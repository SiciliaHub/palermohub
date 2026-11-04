import { layerStates, state } from './state.js';

// Stato nell'indirizzo: la posizione resta nell'hash (la gestisce MapLibre),
// livelli e particella stanno nella query string: ?l=basemap,particelle&p=134-1
const DEFAULTS = { ...layerStates };
let attivo = false;

export function readUrl() {
    const q = new URLSearchParams(location.search);
    const l = q.get('l');
    const m = /^(\d+)-(.+)$/.exec(q.get('p') || '');
    return {
        livelli: l === null ? null : new Set(l.split(',')),
        particella: m ? { foglio: m[1], particella: m[2] } : null
    };
}

export function startUrlSync() { attivo = true; syncUrl(); }

export function syncUrl() {
    if (!attivo) return;
    const u = new URL(location.href);
    const cambiati = Object.keys(DEFAULTS).some(k => DEFAULTS[k] !== layerStates[k]);
    if (cambiati) u.searchParams.set('l', Object.keys(layerStates).filter(k => layerStates[k]).join(',') || '-');
    else u.searchParams.delete('l');
    const cp = state.currentParticella;
    if (cp) u.searchParams.set('p', `${cp.foglio}-${cp.particella}`);
    else u.searchParams.delete('p');
    u.search = u.search.replace(/%2C/g, ',');
    history.replaceState(history.state, '', u);
}

// Indirizzo da condividere: se l'app sta in un iframe (prg_part_catastali.html) si condivide
// la pagina madre, che al caricamento passa query e hash all'iframe.
const PAGINA_MADRE = 'https://palermohub.opendatasicilia.it/prg_part_catastali.html';
export function urlCondivisione() {
    if (window.parent === window) return location.href;
    let base = PAGINA_MADRE;
    try { const p = window.parent.location; base = p.origin + p.pathname; } catch (e) {}
    return base + location.search + location.hash;
}

export async function condividi(btn) {
    const url = urlCondivisione();
    const t0 = btn.title;
    try {
        if (navigator.share) await navigator.share({ title: document.title, url });
        else { await navigator.clipboard.writeText(url); btn.title = btn.ariaLabel = 'Link copiato!'; }
    } catch (e) { if (e.name === 'AbortError') return; prompt('Copia il link:', url); }
    setTimeout(() => { btn.title = btn.ariaLabel = t0; }, 2000);
}
