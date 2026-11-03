import * as maplibregl from 'maplibre-gl';
import { DATA_CATASTO, state } from './state.js';

const LIBS = {
    jspdf: { src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', sri: 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk', global: 'jspdf' },
    turf: { src: 'https://unpkg.com/@turf/turf@6.5.0/turf.min.js', sri: 'sha384-82q0nm29xZzIo5BMtDYnh2/NxeO6FoaK1S/0nF84w3cEsqbBfun3JdMyDVYWfVY5', global: 'turf' }
};

const libLoads = {};

function loadLib(name) {
    const lib = LIBS[name];
    if (window[lib.global]) return Promise.resolve(window[lib.global]);
    return libLoads[name] || (libLoads[name] = new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = lib.src;
        el.integrity = lib.sri;
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(window[lib.global]);
        el.onerror = () => { delete libLoads[name]; el.remove(); reject(new Error('Impossibile caricare ' + name)); }; // il tentativo successivo riprova
        document.head.appendChild(el);
    }));
}

async function calculateAreasAndIntersections(features) {
    await loadLib('turf');
    const particellaFeature = features.find(f => f.layer.id === "Particelle catastali");
    if (!particellaFeature) return null;

    const particellaGeometry = particellaFeature.geometry;
    const particellaPolygon = turf.polygon(particellaGeometry.coordinates);
    const particellaArea = turf.area(particellaPolygon);

    const intersections = features
        .filter(f => f.layer.id !== "Particelle catastali")
        .map(feature => {
            const featureGeometry = feature.geometry;
            const featurePolygon = turf.polygon(featureGeometry.coordinates);
            const intersection = turf.intersect(particellaPolygon, featurePolygon);
            
            if (intersection) {
                const intersectionArea = turf.area(intersection);
                const percentage = (intersectionArea / particellaArea) * 100;
                return {
                    layer: feature.layer.id,
                    area: intersectionArea.toFixed(2),
                    percentage: percentage.toFixed(2)
                };
            }
            return null;
        })
        .filter(intersection => intersection !== null);

    return {
        particellaArea: particellaArea.toFixed(2),
        intersections: intersections
    };
}

const MAP_W = 1200, MAP_H = 800; // 3:2, riempie la larghezza utile di un A4 verticale
const QUERY_LAYERS = ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali"];

// Mappa fuori schermo a dimensione fissa: il PDF non dipende da schermo, orientamento o interazioni.
// Ritorna l'immagine JPEG (su fondo bianco) e le feature sotto il centro della particella.
async function renderOffscreenMap(p) {
    const box = document.createElement('div');
    box.style.cssText = `position:fixed;left:-9999px;top:0;width:${MAP_W}px;height:${MAP_H}px`;
    document.body.appendChild(box);
    const filter = ["all", ["==", "Foglio", p.foglio], ["==", "Paricella", p.particella]];
    const bounds = p.bounds.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(p.bounds[0], p.bounds[0]));
    const map = new maplibregl.Map({
        container: box,
        style: state.map.getStyle(), // stessi livelli attivi della mappa visibile
        bounds,
        fitBoundsOptions: { padding: 50, maxZoom: 17.5 },
        interactive: false,
        attributionControl: false,
        pixelRatio: 1.5,
        canvasContextAttributes: { preserveDrawingBuffer: true }
    });
    try {
        const idle = () => new Promise((ok, ko) => {
            const t = setTimeout(() => ko(new Error('Timeout mappa')), 25000);
            map.once('idle', () => { clearTimeout(t); ok(); });
        });
        await new Promise(ok => map.once('load', ok));
        map.addLayer({ id: "pdf-fill", type: "fill", source: "catasto", "source-layer": "particelle", paint: { "fill-color": "#ffff00", "fill-opacity": 0.3 }, filter });
        map.addLayer({ id: "pdf-line", type: "line", source: "catasto", "source-layer": "particelle", paint: { "line-color": "#000000", "line-width": 4 }, filter });
        await idle();

        const src = map.getCanvas();
        const out = document.createElement('canvas');
        out.width = src.width; out.height = src.height;
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(src, 0, 0);
        const features = map.queryRenderedFeatures(map.project(p.center), {
            layers: QUERY_LAYERS.filter(id => map.getLayer(id))
        });
        return { image: out.toDataURL('image/jpeg', 0.85), ratio: out.height / out.width, features };
    } finally {
        map.remove();
        box.remove();
    }
}

export async function generatePDF() {
    if (!state.currentParticella) {
        alert("Nessuna particella selezionata.");
        return;
    }
    if (state.isMobile && navigator.vibrate) navigator.vibrate(100);

    const waitPopup = document.getElementById("pdf-wait-popup");
    waitPopup.style.display = "flex";

    try {
        const bounds = state.currentParticella.bounds;
        if (!bounds || bounds.length === 0) throw new Error("Bounds della particella non validi.");

        const [{ jsPDF }, shot] = await Promise.all([loadLib('jspdf'), renderOffscreenMap(state.currentParticella)]);
        const { image: mapImage, ratio, features } = shot;
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFont("helvetica");

        // Aggiungi logo demo se disponibile
        try {
            const demoImageUrl = "https://palermohub.opendatasicilia.it/pmtiles/js/demo.png";
            doc.addImage(demoImageUrl, "PNG", pageWidth - margin - 35.28, margin, 35.28, 18.7);
        } catch (e) {
            console.log("Logo non caricato, continuando senza logo");
        }

        // Titolo e info particella
        doc.setFontSize(16);
        doc.text(`Demo ricerca particella catastale`, pageWidth / 2, margin + 15, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Foglio: ${state.currentParticella.foglio}`, margin, margin + 30);
        doc.text(`Particella: ${state.currentParticella.particella}`, margin, margin + 35);

        const now = new Date();
        doc.setFontSize(8);
        doc.text(`Documento generato il ${now.toLocaleDateString()} alle ${now.toLocaleTimeString()}`, margin, margin + 45);

        // Mappa
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = ratio * imgWidth;
        doc.addImage(mapImage, "JPEG", margin, margin + 48, imgWidth, imgHeight);

        // Disclaimer e fonte dati
        const disclaimerText = `Fonte dati catastali S.I.T.R. Sicilia - Ultimo aggiornamento ${DATA_CATASTO}, rilasciati con licenza CC-BY 4.0.
Fonte dati ZTO e vincoli: opendata Comune di Palermo, rilasciati con licenza CC-BY 4.0.

L'Agenzia delle entrate è l'amministrazione titolare dei dati, rilasciati con licenza CC-BY 4.0.
L'Agenzia delle Entrate non è responsabile per qualunque tipo di danno diretto, indiretto o accidentale derivante dall'impiego delle informazioni raccolte tramite questo servizio dimostrativo.

Disclaimer: I contenuti presenti in questo documento, compresi testi ed elementi grafici, hanno carattere puramente informativo e divulgativo. Non sono presenti dati personali o sensibili. Si precisa che questi materiali non costituiscono documenti ufficiali né hanno alcun valore legale. Per consultare la documentazione ufficiale e legalmente vincolante, si prega di fare riferimento agli atti definitivi allegati alle relative deliberazioni degli organi competenti.

by @opendatasicilia`;
        
        doc.setFontSize(8);
        let yPos = margin + 50 + imgHeight + 10;
        const textLines = doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin);
        doc.text(textLines, margin, yPos);
        yPos += textLines.length * 3 + 10;
        
        // Linea separatrice
        doc.setLineWidth(0.5);
        doc.setDrawColor(204, 204, 204);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Aggiungi sezione dati urbanistici
        doc.setFontSize(14);
        yPos += 8;
        doc.text("Dati urbanistici:", margin, yPos);
        yPos += 8;
        doc.setFontSize(11);
        
        // Calcola aree se disponibili
        try {
            const areaData = await calculateAreasAndIntersections(features);
            if (areaData) {
                doc.text(`• Area totale della particella: ${areaData.particellaArea} m²`, margin, yPos);
                yPos += 5;
                areaData.intersections.forEach(intersection => {
                    if (yPos > pageHeight - margin) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(`• Area intersecata con ${intersection.layer}: ${intersection.area} m² (${intersection.percentage}%)`, margin, yPos);
                    yPos += 5;
                });
            }
        } catch (e) {
            console.log("Errore nel calcolo delle aree:", e);
            doc.text("• Calcolo aree non disponibile", margin, yPos);
            yPos += 5;
        }
        
        yPos += 5;
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        // Dettagli urbanistici
        features.forEach(feature => {
            if (yPos > pageHeight - margin - 20) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFontSize(11);
            switch(feature.layer.id) {
                case "cs":
                    doc.text(`• Circoscrizione: ${feature.properties.Circoscriz || "N/A"}`, margin, yPos);
                    yPos += 5;
                    break;
                case "Info Vin. areali":
                    doc.text(`• Vincolo Areale:`, margin, yPos);
                    yPos += 5;
                    doc.text(`  Tipo: ${feature.properties.tipo || "N/A"}`, margin, yPos);
                    yPos += 5;
                    const descrizioneAreale = feature.properties.descrizone || "N/A";
                    const descLines = doc.splitTextToSize(`  Descrizione: ${descrizioneAreale}`, pageWidth - 2 * margin - 10);
                    doc.text(descLines, margin, yPos);
                    yPos += descLines.length * 5;
                    break;
                case "Info Vin. lineari":
                    doc.text(`• Vincolo Lineare:`, margin, yPos);
                    yPos += 5;
                    doc.text(`  Tipo: ${feature.properties.TIPO || "N/A"}`, margin, yPos);
                    yPos += 5;
                    const descrizioneLineare = feature.properties.DESCRIZION || "N/A";
                    const descLinesLin = doc.splitTextToSize(`  Descrizione: ${descrizioneLineare}`, pageWidth - 2 * margin - 10);
                    doc.text(descLinesLin, margin, yPos);
                    yPos += descLinesLin.length * 5;
                    break;
                case "Info Netto storico":
                    doc.text(`• Netto Storico:`, margin, yPos);
                    yPos += 5;
                    doc.text(`  ZTO: ${feature.properties.ZTO || "N/A"}`, margin, yPos);
                    yPos += 5;
                    const descrizioneNetto = feature.properties.DESCRIZION || "N/A";
                    const descLinesNetto = doc.splitTextToSize(`  Descrizione: ${descrizioneNetto}`, pageWidth - 2 * margin - 10);
                    doc.text(descLinesNetto, margin, yPos);
                    yPos += descLinesNetto.length * 5;
                    break;
                case "Info ZTO":
                    doc.text(`• Zonizzazione:`, margin, yPos);
                    yPos += 5
                    doc.text(`  ZTO: ${feature.properties.ZTO || "N/A"}`, margin, yPos);
                    yPos += 5;
                    const descrizioneZTO = feature.properties.DESCRIZION || "N/A";
                    const descLinesZTO = doc.splitTextToSize(`  Descrizione: ${descrizioneZTO}`, pageWidth - 2 * margin - 10);
                    doc.text(descLinesZTO, margin, yPos);
                    yPos += descLinesZTO.length * 5;
                    break;
                case "Particelle catastali":
                    doc.text(`• Dati Catastali:`, margin, yPos);
                    yPos += 5;
                    doc.text(`  Foglio: ${feature.properties.Foglio || "N/A"}`, margin, yPos);
                    yPos += 5;
                    doc.text(`  Particella: ${feature.properties.Paricella || "N/A"}`, margin, yPos);
                    yPos += 5;
                    break;
            }
        });

        waitPopup.style.display = "none";
        doc.save(`particella_${state.currentParticella.foglio}_${state.currentParticella.particella}.pdf`);
        if (state.isMobile && navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
    } catch (error) {
        console.error("Errore durante la generazione del PDF:", error);
        waitPopup.style.display = "none";
        alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
        if (state.isMobile && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}
