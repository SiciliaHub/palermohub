// Territorio: circoscrizioni, quartieri, UPL (fonte: Comune di Palermo). Dati in territorio.json (WGS84).
import { layerStates, state } from './state.js';
import { esc } from './ui.js';

const SRC = 'territorio';
export const LINEE = ['territorio-circ-line', 'territorio-quart-line', 'territorio-upl-line', 'territorio-circ-labels', 'territorio-quart-labels', 'territorio-upl-labels'];
const NONE = ['==', ['get', 'liv'], ''];
let dati = null;

export function initTerritorio() {
    const map = state.map;
    const vis = layerStates.territorio ? 'visible' : 'none';
    map.addSource(SRC, { type: 'geojson', data: new URL('territorio.json', location.href).href, attribution: 'Limiti amministrativi - <b>Comune di Palermo</b>' });
    // area invisibile per leggere i dati sotto il clic (solo UPL: contiene anche circoscrizione e quartiere)
    map.addLayer({ id: 'territorio-hit', type: 'fill', source: SRC, filter: ['==', ['get', 'liv'], 'upl'], paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: 'territorio-sel', type: 'fill', source: SRC, filter: NONE, paint: { 'fill-color': '#FF9900', 'fill-opacity': 0.18 } });
    map.addLayer({ id: 'territorio-sel-line', type: 'line', source: SRC, filter: NONE, paint: { 'line-color': '#9A5400', 'line-width': 3 } });
    const linea = (liv, color, w, dash, minzoom, maxzoom) => ({
        id: `territorio-${liv}-line`, type: 'line', source: SRC, filter: ['==', ['get', 'liv'], liv], minzoom, maxzoom,
        layout: { visibility: vis }, paint: { 'line-color': color, 'line-width': w, ...(dash && { 'line-dasharray': dash }) }
    });
    const label = (liv, campo, size, color, minzoom, maxzoom) => ({
        id: `territorio-${liv}-labels`, type: 'symbol', source: SRC, filter: ['==', ['get', 'liv'], liv], minzoom, maxzoom,
        layout: { visibility: vis, 'text-field': ['get', campo], 'text-font': ['Noto Sans Bold'], 'text-size': size, 'text-max-width': 8 },
        paint: { 'text-color': color, 'text-halo-color': '#fff', 'text-halo-width': 1.5 }
    });
    [
        linea('circ', '#7A2E8E', 3, null, 0, 24), linea('quart', '#2F6FB5', 2, [4, 2], 11, 24), linea('upl', '#1F8A5B', 1.2, [2, 2], 13, 24),
        label('circ', 'circ', 15, '#7A2E8E', 0, 13), label('quart', 'quart', 12, '#2F6FB5', 11, 14), label('upl', 'upl', 11, '#1F8A5B', 14, 24)
    ].forEach(l => map.addLayer(l));
    initFiltri();
}

export function setTerritorioVisible(on) {
    LINEE.forEach(id => { if (state.map.getLayer(id)) state.map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); });
}

// sezione per la scheda: ente che contiene il punto cliccato
export function territorioDelPunto(point) {
    const f = state.map.queryRenderedFeatures(point, { layers: ['territorio-hit'] })[0];
    return f ? f.properties : null;
}

// ---- filtri a scalare: circoscrizione > quartiere > UPL ----
const $ = id => document.getElementById(id);
async function carica() {
    if (!dati) {
        const r = await fetch('territorio.json');
        if (!r.ok) throw new Error(r.status);
        dati = (await r.json()).features.map(f => f.properties);
    }
    return dati;
}
const unici = a => [...new Set(a)].sort((x, y) => x.localeCompare(y, 'it', { numeric: true }));
const opzioni = (sel, valori, vuoto) => {
    sel.innerHTML = `<option value="">${vuoto}</option>` + valori.map(v => `<option>${esc(v)}</option>`).join('');
    sel.disabled = valori.length === 0;
};

function applica() {
    const c = $('ter-circ').value, q = $('ter-quart').value, u = $('ter-upl').value;
    const liv = u ? 'upl' : q ? 'quart' : c ? 'circ' : null;
    const f = liv ? ['all', ['==', ['get', 'liv'], liv], ['==', ['get', 'circ'], c], ...(q ? [['==', ['get', 'quart'], q]] : []), ...(u ? [['==', ['get', 'upl'], u]] : [])] : NONE;
    ['territorio-sel', 'territorio-sel-line'].forEach(id => state.map.setFilter(id, f));
    if (!liv) { $('ter-info').textContent = ''; return; }
    const r = dati.find(p => p.liv === liv && p.circ === c && (!q || p.quart === q) && (!u || p.upl === u));
    $('ter-info').textContent = `${{ circ: 'Circoscrizione', quart: 'Quartiere', upl: 'UPL' }[liv]}: ${(r.area / 1e6).toLocaleString('it-IT', { maximumFractionDigits: 2 })} km²`;
    const [w, s, e, n] = r.bbox;
    state.map.fitBounds([[w, s], [e, n]], { padding: state.isMobile ? 40 : 80, maxZoom: 17 });
}

export async function initFiltri() {
    const sc = $('ter-circ');
    if (!sc) return;
    try { await carica(); } catch (e) { $('ter-info').textContent = 'Elenco non disponibile.'; return; }
    const reset = (sel, valori, vuoto) => opzioni(sel, valori, vuoto);
    reset(sc, unici(dati.filter(p => p.liv === 'circ').map(p => p.circ)), 'Tutte le circoscrizioni');
    reset($('ter-quart'), [], 'Tutti i quartieri');
    reset($('ter-upl'), [], 'Tutte le UPL');
    sc.addEventListener('change', () => {
        const c = sc.value;
        reset($('ter-quart'), c ? unici(dati.filter(p => p.liv === 'quart' && p.circ === c).map(p => p.quart)) : [], 'Tutti i quartieri');
        reset($('ter-upl'), c ? unici(dati.filter(p => p.liv === 'upl' && p.circ === c).map(p => p.upl)) : [], 'Tutte le UPL');
        applica();
    });
    $('ter-quart').addEventListener('change', () => {
        const q = $('ter-quart').value, c = sc.value;
        reset($('ter-upl'), unici(dati.filter(p => p.liv === 'upl' && p.circ === c && (!q || p.quart === q)).map(p => p.upl)), 'Tutte le UPL');
        applica();
    });
    $('ter-upl').addEventListener('change', applica);
    $('ter-reset').addEventListener('click', () => {
        sc.value = ''; sc.dispatchEvent(new Event('change'));
    });
}
