import * as maplibregl from 'maplibre-gl';
import { DATA_CATASTO, state } from './state.js';

const LIBS = {
    jspdf: { src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', sri: 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk', global: 'jspdf' },
    turf: { src: 'https://unpkg.com/@turf/turf@6.5.0/turf.min.js', sri: 'sha384-82q0nm29xZzIo5BMtDYnh2/NxeO6FoaK1S/0nF84w3cEsqbBfun3JdMyDVYWfVY5', global: 'turf' }
};

const libLoads = {};

export function loadLib(name) {
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
        supMq: Number(particellaFeature.properties.sup_mq) || null, // geometria intera, precalcolata nei tile
        intersections: intersections
    };
}

const dedupe = list => {
    const seen = new Set();
    return list.filter(f => { const k = JSON.stringify(f.properties); return seen.has(k) ? false : seen.add(k); });
};

// Zone OMI sotto il centro della particella + civici entro ~10 m dal suo ingombro (dai tile gia' caricati)
async function collectOmiCivici(map, p) {
    await loadLib('turf');
    lg('turf ok');
    const pt = turf.point([p.center.lng ?? p.center[0], p.center.lat ?? p.center[1]]);
    const omi = dedupe(map.getLayer("Zone OMI") ? map.querySourceFeatures("zone_omi", { sourceLayer: "Zone_OMI_2025_II" }) : [])
        .filter(f => { try { return turf.booleanPointInPolygon(pt, f.geometry); } catch { return false; } });
    if (!omi.length && map.getLayer("Zone OMI")) omi.push(...dedupe(map.queryRenderedFeatures(map.project(p.center), { layers: ["Zone OMI"] })));
    const omiByZona = {};
    omi.forEach(f => (omiByZona[f.properties.Zona_OMI || "?"] = omiByZona[f.properties.Zona_OMI || "?"] || []).push(f));

    const pad = 0.0001;
    const lngs = p.bounds.map(c => c.lng ?? c[0]), lats = p.bounds.map(c => c.lat ?? c[1]);
    const [w, e, s, n] = [Math.min(...lngs) - pad, Math.max(...lngs) + pad, Math.min(...lats) - pad, Math.max(...lats) + pad];
    const civici = dedupe(map.getLayer("Numeri Civici") ? map.querySourceFeatures("civici", { sourceLayer: "civici_wgs84" }) : [])
        .filter(f => { const [x, y] = f.geometry.coordinates; return x >= w && x <= e && y >= s && y <= n; })
        .map(f => ({ f, d: turf.distance(pt, f.geometry, { units: "meters" }) }))
        .sort((a, b) => a.d - b.d).slice(0, 8);
    return { omiByZona: Object.values(omiByZona), civici };
}

let T0 = 0;
const lg = m => console.log(`[PDF] ${m} +${Math.round(performance.now() - T0)}ms`);

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
        const idle = () => new Promise(ok => {
            const t = setTimeout(() => { console.warn('[PDF] idle timeout'); ok(); }, 30000);
            map.once('idle', () => { clearTimeout(t); ok(); });
        });
        // timeout 30s: se la rete e' lenta si stampa comunque quello che e' gia' stato disegnato
        await new Promise(ok => { const t = setTimeout(() => { console.warn('[PDF] load timeout'); ok(); }, 30000); map.once('load', () => { clearTimeout(t); ok(); }); map.once('error', e => console.warn('PDF map:', e.error)); });
        map.addLayer({ id: "pdf-fill", type: "fill", source: "catasto", "source-layer": "particelle", paint: { "fill-color": "#ffff00", "fill-opacity": 0.3 }, filter });
        map.addLayer({ id: "pdf-line", type: "line", source: "catasto", "source-layer": "particelle", paint: { "line-color": "#000000", "line-width": 4 }, filter });
        // OMI e civici servono nel PDF anche se i livelli sono spenti: li accendo trasparenti perche' carichino i tile
        const ghost = [["Zone OMI", "fill-opacity"], ["Numeri Civici", "text-opacity"]];
        ghost.forEach(([id, prop]) => {
            if (map.getLayer(id) && map.getLayoutProperty(id, "visibility") === "none") {
                map.setLayoutProperty(id, "visibility", "visible");
                map.setPaintProperty(id, prop, 0.01); // non 0: a opacita' nulla i tile possono non caricarsi
            }
        });
        lg('map load ok');
        await idle();
        lg('map idle ok');

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
        const ter = map.getLayer('territorio-hit') ? map.queryRenderedFeatures(map.project(p.center), { layers: ['territorio-hit'] })[0] : null;
        lg('canvas ok');
        const extra = await collectOmiCivici(map, p);
        lg(`OMI zone=${extra.omiByZona.length} civici=${extra.civici.length}`);
        return { image: out.toDataURL('image/jpeg', 0.85), ratio: out.height / out.width, features, territorio: ter ? ter.properties : null, ...extra };
    } finally {
        map.remove();
        box.remove();
    }
}

// Tavola catastale: stessa identità della pagina (carta neutra, arancio solo come evidenziatore).
const INK = [26, 26, 26], MUTED = [110, 110, 110], RULE = [205, 205, 205], ACCENT = [255, 153, 0], ACCENT_TXT = [154, 84, 0];
const M = 15; // margine pagina, mm
const LAYER_LABEL = { "cs": "Circoscrizione", "Info Vin. areali": "Vincoli areali", "Info Vin. lineari": "Vincoli lineari", "Info Netto storico": "Netto storico", "Info ZTO": "Zonizzazione (ZTO)" };

// Feature -> sezione { title, rows: [[etichetta, valore]] }
function sectionFor(f) {
    const p = f.properties, na = v => (v == null || v === "" ? "N/D" : String(v));
    switch (f.layer.id) {
        case "cs": return { title: "Circoscrizione", rows: [["Circoscrizione", na(p.Circoscriz)]] };
        case "Info Vin. areali": return { title: "Vincolo areale", rows: [["Tipo", na(p.tipo)], ["Descrizione", na(p.descrizone)]] };
        case "Info Vin. lineari": return { title: "Vincolo lineare", rows: [["Tipo", na(p.TIPO)], ["Descrizione", na(p.DESCRIZION)]] };
        case "Info Netto storico": return { title: "Netto storico", rows: [["ZTO", na(p.ZTO)], ["Descrizione", na(p.DESCRIZION)]] };
        case "Info ZTO": return { title: "Zonizzazione", rows: [["ZTO", na(p.ZTO)], ["Descrizione", na(p.DESCRIZION)]] };
    }
    return null;
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
        const cp = state.currentParticella;
        if (!cp.bounds || cp.bounds.length === 0) throw new Error("Bounds della particella non validi.");

        T0 = performance.now();
        lg('start');
        // Zoom ottimale prima del render: la mappa visibile scalda la cache dei tile che usa poi la mappa del PDF
        const bounds = cp.bounds.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(cp.bounds[0], cp.bounds[0]));
        state.map.fitBounds(bounds, { padding: 50, maxZoom: 17.5, animate: false });
        await new Promise(ok => { const t = setTimeout(ok, 8000); state.map.once('idle', () => { clearTimeout(t); ok(); }); });

        lg('zoom ok, render mappa');
        const [{ jsPDF }, , shot] = await Promise.all([loadLib('jspdf'), loadLib('turf'), renderOffscreenMap(cp)]);
        const { image: mapImage, ratio, features, omiByZona, civici, territorio } = shot;
        lg('mappa+jspdf ok, calcolo aree');
        let areaData = null;
        try { areaData = await calculateAreasAndIntersections(features); }
        catch (e) { console.log("Errore nel calcolo delle aree:", e); }

        lg('aree ok, costruzione PDF');
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
        const CW = W - 2 * M, FOOT = H - 16;
        const fmt = n => Number(n).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const ink = c => doc.setTextColor(...c);
        let y = 0;

        const ensure = h => { if (y + h > FOOT) { doc.addPage(); y = M; } };
        const heading = t => {
            ensure(24);
            y += 4;
            doc.setFont("helvetica", "bold"); doc.setFontSize(9); ink(ACCENT_TXT);
            doc.text(t.toUpperCase(), M, y);
            doc.setDrawColor(...ACCENT); doc.setLineWidth(0.5); doc.line(M, y + 1.8, M + 12, y + 1.8);
            doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.line(M + 12, y + 1.8, W - M, y + 1.8);
            y += 7;
        };
        const row = (label, value) => {
            const lines = doc.splitTextToSize(value, CW - 38);
            ensure(lines.length * 4.6 + 2);
            doc.setFont("helvetica", "normal"); doc.setFontSize(8); ink(MUTED);
            doc.text(label, M, y);
            doc.setFontSize(9.5); ink(INK);
            doc.text(lines, M + 38, y);
            y += lines.length * 4.6 + 1.2;
        };

        // Testata
        doc.setFillColor(...ACCENT); doc.rect(0, 0, W, 4, "F");
        y = 18;
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); ink(ACCENT_TXT);
        doc.text("CATASTO SICILIA · SERVIZIO DIMOSTRATIVO", M, y);
        const now = new Date();
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); ink(MUTED);
        doc.text(`${now.toLocaleDateString("it-IT")} ${now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`, W - M, y, { align: "right" });
        y += 10;
        doc.setFont("helvetica", "bold"); doc.setFontSize(22); ink(INK);
        doc.text("Scheda particella catastale", M, y);
        y += 5;

        // Avviso ben visibile: documento dimostrativo
        doc.setFillColor(255, 243, 224); doc.setDrawColor(...ACCENT); doc.setLineWidth(0.4);
        doc.rect(M, y, CW, 11, "FD");
        doc.setFillColor(...ACCENT); doc.rect(M, y, 2, 11, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); ink(ACCENT_TXT);
        doc.text("DOCUMENTO SOLO DIMOSTRATIVO", M + 6, y + 4.6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); ink(INK);
        doc.text("Non è un documento ufficiale e non ha valore legale. Non usare per atti, pratiche o certificazioni.", M + 6, y + 8.6);
        y += 15;

        // Dati chiave
        const facts = [["Foglio", String(cp.foglio)], ["Particella", String(cp.particella)]];
        if (areaData) facts.push(areaData.supMq ? ["Superficie (calcolata)", `${fmt(areaData.supMq)} m²`] : ["Area (stima)", `≈ ${fmt(areaData.particellaArea)} m²`]);
        const fw = CW / facts.length;
        doc.setDrawColor(...RULE); doc.setLineWidth(0.2);
        doc.line(M, y, W - M, y);
        facts.forEach(([l, v], i) => {
            const x = M + i * fw;
            if (i) doc.line(x, y + 2, x, y + 15);
            doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); ink(MUTED);
            doc.text(l.toUpperCase(), x + (i ? 4 : 0), y + 6);
            doc.setFont("helvetica", "bold"); doc.setFontSize(13); ink(INK);
            doc.text(v, x + (i ? 4 : 0), y + 13);
        });
        y += 17;
        doc.line(M, y, W - M, y);
        y += 5;

        // Mappa
        const imgH = ratio * CW;
        doc.addImage(mapImage, "JPEG", M, y, CW, imgH);
        doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.rect(M, y, CW, imgH);
        y += imgH + 4;
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); ink(MUTED);
        doc.text("Particella evidenziata in giallo con contorno nero. Mappa non in scala.", M, y);
        y += 3;

        // Aree e intersezioni
        if (areaData && areaData.intersections.length) {
            heading("Sovrapposizioni con i livelli");
            doc.setFont("helvetica", "bold"); doc.setFontSize(8); ink(MUTED);
            doc.text("Livello", M, y);
            doc.text("Area (m²)", W - M - 28, y, { align: "right" });
            doc.text("% particella", W - M, y, { align: "right" });
            y += 4.5;
            areaData.intersections.forEach(it => {
                ensure(6);
                doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); ink(INK);
                doc.text(LAYER_LABEL[it.layer] || it.layer, M, y);
                doc.text(fmt(it.area), W - M - 28, y, { align: "right" });
                doc.text(`${fmt(it.percentage)} %`, W - M, y, { align: "right" });
                y += 5.5;
            });
        }

        // Territorio
        if (territorio) {
            heading("Territorio");
            row("Circoscrizione", territorio.circ);
            row("Quartiere", territorio.quart);
            row("UPL", territorio.upl);
        }

        // Dettagli per livello
        features.map(sectionFor).filter(Boolean).forEach(s => {
            heading(s.title);
            s.rows.forEach(([l, v]) => row(l, v));
        });

        // Civici vicini
        if (civici.length) {
            heading("Numeri civici nelle vicinanze");
            civici.forEach(({ f, d }) => {
                const p = f.properties, esp = p.Esponente;
                const num = (esp && esp !== "NULL" && esp !== "") ? `${p.Civico}/${esp}` : String(p.Civico ?? "N/D");
                const where = [p.Quartiere, p.Circoscrizione].filter(v => v && v !== "NULL").join(" · ");
                row(`${Math.round(d)} m`, `${p.Odonimo || "N/D"} ${num}${where ? ` (${where})` : ""}`);
            });
        }

        // Quotazioni OMI
        const clean = v => String(v ?? "").replace(/^'|'$/g, "").trim();
        const num = v => { if (v == null) return null; const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
        const range = (a, b, unit) => (num(a) != null && num(b) != null) ? `${num(a).toLocaleString("it-IT")} – ${num(b).toLocaleString("it-IT")} ${unit}` : "N/D";
        omiByZona.forEach(list => {
            const p0 = list[0].properties;
            heading(`Quotazioni OMI · Zona ${p0.Zona_OMI || p0.Zona || "N/D"}`);
            const fascia = p0.Fascia || p0.Fasce || "N/D", fd = clean(p0.Fascia_Descr);
            row("Fascia", fd ? `${fascia} – ${fd}` : String(fascia));
            if (clean(p0.Zona_Descr)) row("Descrizione", clean(p0.Zona_Descr));
            if (p0.Microzona != null && p0.Microzona !== "") row("Microzona", String(p0.Microzona));
            if (clean(p0.Descr_tip_prev)) row("Tipo prevalente", clean(p0.Descr_tip_prev));
            list.forEach(f => {
                const p = f.properties;
                row(clean(p.Descr_Tipologia) + (p.Stato ? ` (${p.Stato})` : ""),
                    `Compravendita ${range(p.Compr_min, p.Compr_max, "€/m²")}
Locazione ${range(p.Loc_min, p.Loc_max, "€/m²/mese")}`);
            });
            doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); ink(MUTED);
            ensure(5);
            doc.text(`Fonte: Agenzia delle Entrate — OMI ${p0.Anno_Semestre ? String(p0.Anno_Semestre).replace(" / ", " S") : "2025 S2"}`, M, y);
            y += 4;
        });

        // Note e fonti
        const notes = `Fonte dati catastali: S.I.T.R. Sicilia, aggiornamento ${DATA_CATASTO}, licenza CC-BY 4.0. L'Agenzia delle Entrate è l'amministrazione titolare dei dati e non è responsabile per alcun danno diretto, indiretto o accidentale derivante dall'impiego delle informazioni raccolte tramite questo servizio dimostrativo.
Fonte dati ZTO e vincoli: opendata Comune di Palermo, licenza CC-BY 4.0.
I contenuti di questo documento hanno carattere puramente informativo e divulgativo, non contengono dati personali o sensibili e non costituiscono documenti ufficiali né hanno valore legale. Per la documentazione ufficiale si faccia riferimento agli atti definitivi delle relative deliberazioni degli organi competenti.`;
        heading("Fonti e avvertenze");
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); ink(MUTED);
        doc.splitTextToSize(notes, CW).forEach(line => {
            ensure(3.6);
            doc.text(line, M, y);
            y += 3.4;
        });

        // Piè di pagina
        const n = doc.getNumberOfPages();
        for (let i = 1; i <= n; i++) {
            doc.setPage(i);
            doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.line(M, H - 12, W - M, H - 12);
            doc.setFont("helvetica", "normal"); doc.setFontSize(7); ink(MUTED);
            doc.text("Documento solo dimostrativo, senza valore legale · Catasto Sicilia · by @opendatasicilia", M, H - 8);
            doc.text(`Pagina ${i} di ${n}`, W - M, H - 8, { align: "right" });
        }

        waitPopup.style.display = "none";
        lg('save');
        doc.save(`particella_${cp.foglio}_${cp.particella}.pdf`);
        if (state.isMobile && navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
    } catch (error) {
        console.error("Errore durante la generazione del PDF:", error);
        waitPopup.style.display = "none";
        alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
        if (state.isMobile && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}
