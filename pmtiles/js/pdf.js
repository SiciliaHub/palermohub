import { setupMapInteractions } from './layers.js';
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

export async function generatePDF() {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (state.isMobile && isPortrait) {
        alert("Per generare il file PDF con le informazioni richieste, ruotare il dispositivo in orientamento orizzontale (modalità landscape).");
        return;
    }
    
    if (!state.currentParticella) {
        alert("Nessuna particella selezionata.");
        return;
    }
    
    if (state.isMobile && navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    const waitPopup = document.getElementById("pdf-wait-popup");
    waitPopup.style.display = "flex";
    
    // Disabilita temporaneamente gli eventi mouse/touch
    state.map.off("mouseenter", "Particelle catastali");
    state.map.off("mousemove");
    if (state.isMobile) {
        state.map.off("touchstart");
    }
    
    // Rimuovi highlight temporaneamente
    if (state.map.getLayer("highlighted-polygon")) {
        state.map.setFilter("highlighted-polygon", ["==", "id", ""]);
    }
    
    try {
        const { jsPDF } = await loadLib('jspdf');
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        doc.setFont("helvetica");
        
        // Aggiungi logo demo se disponibile
        try {
            const demoImageUrl = "https://palermohub.opendatasicilia.it/pmtiles/js/demo.png";
            const demoImageWidth = 35.28;
            const demoImageHeight = 18.7;
            doc.addImage(demoImageUrl, "PNG", pageWidth - margin - demoImageWidth, margin, demoImageWidth, demoImageHeight);
        } catch (e) {
            console.log("Logo non caricato, continuando senza logo");
        }
        
        // Titolo e info particella
        doc.setFontSize(16);
        doc.text(`Demo ricerca particella catastale`, pageWidth / 2, margin + 15, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Foglio: ${state.currentParticella.foglio}`, margin, margin + 30);
        doc.text(`Particella: ${state.currentParticella.particella}`, margin, margin + 35);
        
        const bounds = state.currentParticella.bounds;
        if (!bounds || bounds.length === 0) {
            alert("Bounds della particella non validi.");
            waitPopup.style.display = "none";
            return;
        }
        
        // Zoom sulla particella con padding ottimizzato
        const padding = state.isMobile ? 20 : 50;
        const maxZoom = state.isMobile ? 16.5 : 17.5;
        state.map.fitBounds(bounds, { padding: padding, maxZoom: maxZoom });
        
        // Aggiungi layer temporanei per evidenziare la particella
        state.map.addLayer({
            id: "highlighted-polygon-pdf",
            type: "fill",
            source: "catasto",
            "source-layer": "particelle",
            paint: {
                "fill-color": "#ffff00",
                "fill-opacity": 0.3
            },
            filter: ["all", ["==", "Foglio", state.currentParticella.foglio], ["==", "Paricella", state.currentParticella.particella]]
        });
        
        state.map.addLayer({
            id: "highlighted-polygon-outline-pdf",
            type: "line",
            source: "catasto",
            "source-layer": "particelle",
            paint: {
                "line-color": "#000000",
                "line-width": 4
            },
            filter: ["all", ["==", "Foglio", state.currentParticella.foglio], ["==", "Paricella", state.currentParticella.particella]]
        });
        
        // Data di generazione
        const now = new Date();
        doc.setFontSize(8);
        doc.text(`Documento generato il ${now.toLocaleDateString()} alle ${now.toLocaleTimeString()}`, margin, margin + 45);
        
        // Aspetta che la mappa si stabilizzi
        state.map.once("idle", async () => {
            try {
                // Cattura la mappa
                const mapCanvas = state.map.getCanvas();
                const mapImage = mapCanvas.toDataURL("image/png");
                
                if (!mapImage || mapImage === "data:,") {
                    throw new Error("Errore durante la generazione dell'immagine della mappa.");
                }
                
                // Aggiungi immagine della mappa
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (mapCanvas.height / mapCanvas.width) * imgWidth;
                doc.addImage(mapImage, "PNG", margin, margin + 48, imgWidth, imgHeight);
                
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
                
                // Query per dati urbanistici
                const center = state.currentParticella.center;
                const point = state.map.project(center);
                const features = state.map.queryRenderedFeatures(point, {
                    layers: ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali"]
                });
                
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
                
                // Nascondi popup di attesa
                waitPopup.style.display = "none";
                
                // Rimuovi layer temporanei
                if (state.map.getLayer("highlighted-polygon-pdf")) {
                    state.map.removeLayer("highlighted-polygon-pdf");
                }
                if (state.map.getLayer("highlighted-polygon-outline-pdf")) {
                    state.map.removeLayer("highlighted-polygon-outline-pdf");
                }
                
                // Ripristina eventi mouse/touch
                setupMapInteractions();
                
                // Salva il PDF
                doc.save(`particella_${state.currentParticella.foglio}_${state.currentParticella.particella}.pdf`);
                
                // Feedback vibrazione successo su mobile
                if (state.isMobile && navigator.vibrate) {
                    navigator.vibrate([50, 30, 50, 30, 50]);
                }
                
            } catch (error) {
                console.error("Errore durante la generazione del PDF:", error);
                waitPopup.style.display = "none";
                alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
                
                // Rimuovi layer temporanei in caso di errore
                try {
                    if (state.map.getLayer("highlighted-polygon-pdf")) {
                        state.map.removeLayer("highlighted-polygon-pdf");
                    }
                    if (state.map.getLayer("highlighted-polygon-outline-pdf")) {
                        state.map.removeLayer("highlighted-polygon-outline-pdf");
                    }
                } catch (e) {
                    console.log("Errore nella pulizia layer temporanei:", e);
                }
                
                // Feedback vibrazione errore su mobile
                if (state.isMobile && navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
        });
        
    } catch (error) {
        console.error("Errore generale nella generazione PDF:", error);
        waitPopup.style.display = "none";
        alert("Errore generale durante la generazione del PDF.");
        
        if (state.isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
}
