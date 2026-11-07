import * as maplibregl from 'maplibre-gl';
import { state } from './state.js';
import { closePanel, esc, iconSvg } from './ui.js';
import { syncUrl } from './urlstate.js';

export function buildDl(rows) {
    const items = rows
        .filter(r => r.val != null && r.val !== 'N/A' && r.val !== '' && r.val !== 'NULL')
        .map(r => `<div><dt>${esc(r.lbl)}</dt><dd>${esc(r.val)}</dd></div>`)
        .join('');
    return `<dl class="sc-dl">${items}</dl>`;
}

// sezione della scheda: titolo + elenco etichetta/valore
export function buildInfoCard(title, rows, icon = '') {
    const i = icon ? iconSvg(icon) : '';
    return `<section class="sc-sec"><h3>${i}${esc(title)}</h3>${buildDl(rows)}</section>`;
}

// area in m² di (Multi)Polygon GeoJSON, formula sferica come turf.area; anelli interni sottratti
// ponytail: geometria da queryRenderedFeatures, tagliata ai bordi tessera; per particelle a cavallo puo' essere parziale (come nel PDF)
const ringArea = r => {
    let s = 0;
    for (let i = 0; i < r.length - 1; i++) {
        const [x1, y1] = r[i], [x2, y2] = r[i + 1], d = Math.PI / 180;
        s += (x2 - x1) * d * (2 + Math.sin(y1 * d) + Math.sin(y2 * d));
    }
    return Math.abs(s * 6378137 * 6378137 / 2);
};
export function geomArea(g) {
    const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    return polys.reduce((t, [outer, ...holes]) => t + ringArea(outer) - holes.reduce((h, r) => h + ringArea(r), 0), 0);
}

export function setCurrentParticella(foglio, particella, geometry) {
    const coords = geometry.type === 'MultiPolygon' ? geometry.coordinates[0][0] : geometry.coordinates[0];
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    state.currentParticella = { foglio, particella, bounds: coords, center: bounds.getCenter() };
    const pdfCmd = document.getElementById('pdf-cmd');
    if (pdfCmd) pdfCmd.style.display = 'flex';
    syncUrl();
}

export function openScheda({ particella, html }) {
    const el = document.getElementById('scheda');
    const title = document.getElementById('scheda-title');
    const actions = document.getElementById('scheda-actions');
    if (!el) return;
    if (particella) {
        if (particella.geometry) setCurrentParticella(particella.foglio, particella.particella, particella.geometry);
        title.textContent = `F. ${particella.foglio} · P. ${particella.particella}`;
        title.className = 'mono';
        actions.innerHTML =
            `<button type="button" class="btn" data-action="generatePDF">${iconSvg('file-pdf')} Scarica scheda PDF</button>` +
            `<a class="sister-btn" href="https://sister3.agenziaentrate.gov.it/" target="_blank" rel="noopener noreferrer" title="Accedi a SISTER con SPID e inserisci Foglio ${esc(particella.foglio)}, Particella ${esc(particella.particella)}">${iconSvg('up-right-from-square')} Visura su SISTER <span class="sister-coords">Fg.${esc(particella.foglio)} · P.${esc(particella.particella)}</span></a>`;
    } else {
        title.textContent = 'Informazioni sul punto';
        title.className = '';
        actions.innerHTML = '';
    }
    document.getElementById('scheda-body').innerHTML = html;
    el.hidden = false;
    el.scrollTop = 0;
    document.getElementById('scheda-body').scrollTop = 0;
    if (state.isMobile) closePanel();
    title.focus();
}

export function closeScheda() {
    const el = document.getElementById('scheda');
    if (!el || el.hidden) return;
    el.hidden = true;
    if (state.map.getLayer("highlighted-polygon")) state.map.setFilter("highlighted-polygon", ["==", "id", ""]);
    const canvas = document.querySelector('.maplibregl-canvas');
    if (canvas) canvas.focus({ preventScroll: true });
}

export function buildOMIPopup(omiFeatures) {
    if (!omiFeatures || omiFeatures.length === 0) return '';
    const p0 = omiFeatures[0].properties;
    const clean = v => String(v ?? '').replace(/^'|'$/g, '').trim();

    // numeri anche se salvati come stringa con virgola decimale (es. "1,4")
    const parseOMI = v => {
        if (v == null) return null;
        const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
        return isNaN(n) ? null : n;
    };
    const fmt = n => n.toLocaleString('it-IT');
    const supMap = { 'L': 'sup. lorda', 'N': 'sup. netta' };

    const zona = p0.Zona_OMI || p0.Zona || '—';
    const fascia = p0.Fascia || p0.Fasce || '—';
    const fasciaDescr = clean(p0.Fascia_Descr);
    const semestre = p0.Anno_Semestre ? `OMI ${String(p0.Anno_Semestre).replace(' / ', ' S')}` : 'OMI 2025 S2';
    const tipoPrev = clean(p0.Descr_tip_prev);
    const codTipPrev = p0.Cod_tip_prev || '';

    const tipiHTML = omiFeatures.map(f => {
        const p = f.properties;
        const cMin = parseOMI(p.Compr_min), cMax = parseOMI(p.Compr_max);
        const lMin = parseOMI(p.Loc_min), lMax = parseOMI(p.Loc_max);
        const sup = k => supMap[p[k]] ? ` (${supMap[p[k]]})` : '';
        const comp = (cMin != null && cMax != null) ? `${fmt(cMin)} – ${fmt(cMax)} €/m²${sup('Sup_NL_compr')}` : '—';
        const loc = (lMin != null && lMax != null) ? `${fmt(lMin)} – ${fmt(lMax)} €/m²/mese${sup('Sup_NL_loc')}` : '—';
        const preview = (cMin != null && cMax != null) ? `${fmt(cMin)}–${fmt(cMax)} €/m²` : '';
        return `<details class="sc-det">
            <summary><span>${esc(clean(p.Descr_Tipologia) || '—')}${p.Stato ? ` <em>${esc(p.Stato)}</em>` : ''}</span>${preview ? `<span class="sc-prev">${esc(preview)}</span>` : ''}</summary>
            <dl class="sc-dl"><div><dt>Compravendita</dt><dd>${esc(comp)}</dd></div><div><dt>Locazione</dt><dd>${esc(loc)}</dd></div></dl>
        </details>`;
    }).join('');

    const prevalente = `${codTipPrev ? `[${esc(codTipPrev)}] ` : ''}${esc(tipoPrev || '—')}`;
    return `<section class="sc-sec">
        <h3>${iconSvg('euro-sign')}Quotazioni OMI <span class="sc-badge">Zona ${esc(zona)}</span></h3>
        ${buildDl([
            { lbl: 'Fascia', val: fasciaDescr ? `${fascia} – ${fasciaDescr}` : fascia },
            { lbl: 'Descrizione', val: clean(p0.Zona_Descr) },
            { lbl: 'Microzona', val: p0.Microzona }
        ])}
        <p class="sc-prevalente">Tipo prevalente: <b>${prevalente}</b></p>
        ${tipiHTML}
        <p class="sc-src">Fonte: Agenzia delle Entrate — ${esc(semestre)}</p>
    </section>`;
}

export function onMapClick(e) {
    const features = state.map.queryRenderedFeatures(e.point, {
        layers: ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Zone OMI", "Particelle catastali", "Numeri Civici"]
    });
    const pf = features.find(f => f.layer.id === "Particelle catastali");
    state.map.setFilter("highlighted-polygon", pf
        ? ["all", ["==", "Foglio", pf.properties.Foglio], ["==", "Paricella", pf.properties.Paricella]]
        : ["==", "id", ""]);
    if (features.length === 0) { closeScheda(); return; }

    // una stessa geometria spezzata tra tessere compare piu' volte: tieni una sola feature per layer+dati
    const seen = new Set();
    const unique = features.filter(f => {
        const k = f.layer.id + JSON.stringify(f.properties);
        return seen.has(k) ? false : seen.add(k);
    });

    // OMI raggruppate per zona (una riga per tipologia); particella sempre per prima
    const omiByZona = {};
    const others = [];
    unique.forEach(f => {
        if (f.layer.id === "Zone OMI") {
            const z = f.properties.Zona_OMI || 'unknown';
            (omiByZona[z] = omiByZona[z] || []).push(f);
        } else others.push(f);
    });
    others.sort((a, b) => (b.layer.id === "Particelle catastali") - (a.layer.id === "Particelle catastali"));

    let part = null;
    const parts = others.map(f => {
        const p = f.properties;
        switch (f.layer.id) {
            case "cs":
                return buildInfoCard('Piano urbanistico', [{ lbl: 'Strumento', val: 'PPE' }, { lbl: 'Circoscrizione', val: p.Circoscriz }], 'city');
            case "Info Vin. areali":
                return buildInfoCard('Vincolo areale', [{ lbl: 'Tipo', val: p.tipo }, { lbl: 'Descrizione', val: p.descrizone }], 'shield');
            case "Info Vin. lineari":
                return buildInfoCard('Vincolo lineare', [{ lbl: 'Tipo', val: p.TIPO }, { lbl: 'Descrizione', val: p.DESCRIZION }], 'draw-polygon');
            case "Info Netto storico":
                return buildInfoCard('Netto storico', [{ lbl: 'ZTO', val: p.ZTO }, { lbl: 'Descrizione', val: p.DESCRIZION }], 'scroll');
            case "Info ZTO":
                return buildInfoCard('Zonizzazione', [{ lbl: 'ZTO', val: p.ZTO }, { lbl: 'Descrizione', val: p.DESCRIZION }], 'map');
            case "Particelle catastali":
                if (!part) part = f;
                return buildInfoCard('Particella catastale', [{ lbl: 'Foglio', val: p.Foglio }, { lbl: 'Particella', val: p.Paricella }, { lbl: 'Superficie', val: Math.round(geomArea(f.geometry)).toLocaleString('it-IT') + ' m²' }], 'table-cells');
            case "Numeri Civici": {
                const esp = p.Esponente;
                const civico = (esp && esp !== 'NULL' && esp !== '') ? `${p.Civico}/${esp}` : p.Civico;
                return buildInfoCard('Numero civico', [
                    { lbl: 'Civico', val: civico }, { lbl: 'Odonimo', val: p.Odonimo },
                    { lbl: 'Circoscrizione', val: p.Circoscrizione }, { lbl: 'Quartiere', val: p.Quartiere }, { lbl: 'UPL', val: p.UPL }
                ], 'location-dot');
            }
            default: return '';
        }
    });
    const omi = Object.values(omiByZona).map(buildOMIPopup);

    openScheda({
        particella: part ? { foglio: part.properties.Foglio, particella: part.properties.Paricella, geometry: part.geometry } : null,
        html: [...parts, ...omi].join('')
    });
    if (state.isMobile && navigator.vibrate) navigator.vibrate(30);
}
