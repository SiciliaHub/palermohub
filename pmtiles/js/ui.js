import * as maplibregl from 'maplibre-gl';
import { closeScheda } from './card.js';
import { BASE_STYLES, layerStates, mqMobile, state } from './state.js';

export const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
let themeLocked = false; // true se l'utente (o l'indirizzo) ha scelto: il sistema non decide piu'


export function initialTheme() {
    const q = new URLSearchParams(location.search).get('theme');
    if (q === 'dark' || q === 'light') { themeLocked = true; return q; }
    let saved = null;
    try { saved = localStorage.getItem('catasto-theme'); } catch (e) {}
    if (saved === 'dark' || saved === 'light') { themeLocked = true; return saved; }
    return mqDark.matches ? 'dark' : 'light';
}

document.documentElement.dataset.theme = initialTheme();

export function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('theme-btn');
    if (btn) {
        const dark = theme === 'dark';
        btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
        btn.title = dark ? 'Passa al tema chiaro' : 'Passa al tema scuro';
        btn.setAttribute('aria-label', btn.title);
        setIcon(btn.querySelector('svg'), dark ? 'sun' : 'moon');
    }
    applyBaseStyle(theme);
}

export function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    themeLocked = true;
    try { localStorage.setItem('catasto-theme', next); } catch (e) {}
    applyTheme(next);
}

mqDark.addEventListener('change', e => { if (!themeLocked) applyTheme(e.matches ? 'dark' : 'light'); });

// sostituisce solo la mappa di base: sorgenti e layer dell'app restano dove sono
export function applyBaseStyle(theme) {
    const map = state.map;
    if (!map || !state.baseLayerIds || state.baseTheme === theme) return;
    state.baseTheme = theme;
    const oldBaseLayers = new Set(state.baseLayerIds);
    const oldBaseSources = new Set(state.baseSourceIds || []);
    map.setStyle(BASE_STYLES[theme], {
        diff: false,
        transformStyle: (prev, next) => {
            const sources = Object.assign({}, next.sources);
            Object.keys(prev.sources).forEach(k => { if (!oldBaseSources.has(k)) sources[k] = prev.sources[k]; });
            const custom = prev.layers.filter(l => !oldBaseLayers.has(l.id));
            const base = next.layers.map(l => layerStates.basemap ? l
                : Object.assign({}, l, { layout: Object.assign({}, l.layout, { visibility: 'none' }) }));
            state.baseLayerIds = next.layers.map(l => l.id);
            state.baseSourceIds = Object.keys(next.sources);
            return Object.assign({}, next, { sources, layers: [...base, ...custom] });
        }
    });
}

export function hideLoader() {
    const loader = document.getElementById('custom-loader');
    if (!loader || loader.dataset.hiding) return;
    loader.dataset.hiding = '1';
    loader.style.transition = 'opacity 0.5s ease';
    loader.addEventListener('transitionend', () => { loader.style.display = 'none'; }, { once: true });
    loader.style.opacity = '0';
}

function updateMobileUI() {
    document.body.classList.toggle('mobile', state.isMobile);
}

export function detectMobile() {
    state.isMobile = mqMobile.matches;
    updateMobileUI();
}

export const PANEL_TABS = ['livelli', 'cerca', 'info', 'tecnica'];

export function openPanel(tab) {
    const panel = document.getElementById('panel');
    if (!panel) return;
    // su mobile un secondo tocco sul tab attivo chiude il pannello
    if (state.isMobile && panel.classList.contains('open') && panel.dataset.tab === tab) { closePanel(); return; }
    panel.dataset.tab = tab;
    panel.classList.add('open');
    PANEL_TABS.forEach(t => {
        const b = document.getElementById('tab-' + t);
        if (b) b.setAttribute('aria-selected', t === tab ? 'true' : 'false');
    });
    if (tab === 'cerca') {
        if (state.civicoMarker) { state.civicoMarker.remove(); state.civicoMarker = null; }
        requestAnimationFrame(() => { const f = document.getElementById('foglio'); if (f && !state.isMobile) f.focus(); });
    }
    if (tab === 'info') {
        const badge = document.getElementById('info-badge');
        if (badge) badge.remove();
    }
}

export function closePanel() {
    const panel = document.getElementById('panel');
    if (!panel || !state.isMobile) return;
    panel.classList.remove('open');
    const b = document.getElementById('tab-' + panel.dataset.tab);
    if (b) b.focus();
}

export function toggleLegend(btn) {
    const box = document.getElementById('prg-legend');
    const open = box.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Nascondi legenda PRG' : 'Mostra legenda PRG';
}

let isSatelliteOverlayOpen = false;

// desktop: la minimappa sta nel tab Livelli (dopo le mappe di base); su mobile il pannello si chiude, quindi torna flottante nel body
const wideMq = matchMedia('(min-width: 900px)');
const dockSatellite = () => {
    const o = document.getElementById('satellite-overlay');
    const home = document.getElementById('layer-panel');
    if (o && home) (wideMq.matches ? home : document.body).appendChild(o);
};
dockSatellite();
wideMq.addEventListener('change', dockSatellite);
let satelliteMap = null;
let syncSatellite = null;


export function toggleSatelliteOverlay() {
    const satelliteOverlay = document.getElementById("satellite-overlay");
    const crosshairMain = document.querySelector(".crosshair-main");

    const satBtn = document.getElementById('satellite-btn');
    if (satBtn) { satBtn.classList.toggle('active', !isSatelliteOverlayOpen); satBtn.setAttribute('aria-pressed', !isSatelliteOverlayOpen ? 'true' : 'false'); }
    if (isSatelliteOverlayOpen) {
        satelliteOverlay.style.display = "none";
        if (crosshairMain) crosshairMain.style.display = "none";
        
        if (satelliteMap) {
            satelliteMap.remove();
            satelliteMap = null;
        }
    } else {
        satelliteOverlay.style.display = "block";
        if (crosshairMain) crosshairMain.style.display = "block";
        
        if (state.map) {
            satelliteMap = new maplibregl.Map({
                container: "satellite-map",
                style: {
                    version: 8,
                    sources: {
                        satellite: {
                            type: "raster",
                            tiles: ["https://map.sitr.regione.sicilia.it/gis/services/ortofoto/ortofoto_2022_20cm_sicilia/ImageServer/WMSServer?service=WMS&version=1.3.0&request=GetMap&layers=0&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/jpeg"],
                            tileSize: 256,
                            attribution: "Ortofoto 2022 © Regione Siciliana - SITR - "
                        }
                    },
                    layers: [{
                        id: "satellite-layer",
                        type: "raster",
                        source: "satellite",
                        minzoom: 0,
                        maxzoom: 22
                    }]
                },
                center: state.map.getCenter(),
                zoom: state.map.getZoom(),
                interactive: false,
                attributionControl: false
            });

            // un solo listener (prima ne veniva aggiunto uno a ogni apertura); centro e zoom insieme
            if (!syncSatellite) {
                syncSatellite = () => {
                    if (!satelliteMap) return;
                    satelliteMap.resize();
                    satelliteMap.jumpTo({ center: state.map.getCenter(), zoom: state.map.getZoom() });
                };
                state.map.on("move", syncSatellite);
                state.map.on("resize", syncSatellite);
            }
            satelliteMap.once("load", syncSatellite);
            syncSatellite();
        }
    }

    isSatelliteOverlayOpen = !isSatelliteOverlayOpen;
    
    if (state.isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// desktop: nasconde/mostra il pannello; --panel-w segue, quindi mappa e barra strumenti si muovono insieme
export function togglePanel() {
    const hidden = document.body.classList.toggle('panel-hidden');
    const b = document.getElementById('panel-tab');
    b.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    b.title = b.ariaLabel = hidden ? 'Mostra pannello' : 'Nascondi pannello';
    if (state.map) { const t = Date.now(); (function f() { state.map.resize(); if (Date.now() - t < 300) requestAnimationFrame(f); })(); }
}

export function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreen-btn');
    const icon = document.getElementById('fullscreen-icon');
    if (!btn) return;
    const isFs = !!document.fullscreenElement;
    setIcon(icon, isFs ? 'compress' : 'expand');
    btn.classList.toggle('active', isFs);
});

export function resetMapHome() {
    if (!state.map) return;
    state.map.flyTo({ center: [13.33225, 38.14074], zoom: state.isMobile ? 11 : 12, bearing: 0, duration: 800 });
}

let locMarker = null, locWatch = null;
// Primo clic: segue la posizione (marker + volo al primo fix). Secondo clic: smette e toglie il marker.
export function locateMe() {
    if (!state.map) return;
    const btn = document.getElementById('locate-btn');
    if (locWatch !== null) {
        navigator.geolocation.clearWatch(locWatch);
        locWatch = null;
        if (locMarker) locMarker.remove();
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        return;
    }
    if (!navigator.geolocation) { alert('Geolocalizzazione non supportata dal browser.'); return; }
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    let first = true;
    locWatch = navigator.geolocation.watchPosition(pos => {
        const c = [pos.coords.longitude, pos.coords.latitude];
        if (!locMarker) locMarker = new maplibregl.Marker({ color: '#1a73e8' });
        locMarker.setLngLat(c).addTo(state.map);
        if (first) { first = false; state.map.flyTo({ center: c, zoom: Math.max(state.map.getZoom(), 17), duration: 800 }); }
    }, err => {
        locateMe(); // spegne tutto
        alert(err.code === 1 ? 'Permesso di posizione negato.' : 'Posizione non disponibile.');
    }, { enableHighAccuracy: true, timeout: 15000 });
}

export function syncZoomUI(zoom) {
    const badge = document.getElementById('zoom-level-display');
    if (badge) badge.textContent = zoom;
}

export function initGallery() {
    const dlg = document.getElementById('lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return; // senza <dialog> restano i link all'immagine intera
    const links = [...document.querySelectorAll('.guida-fig a')];
    const img = document.getElementById('lb-img');
    const cap = document.getElementById('lb-cap');
    const count = document.getElementById('lb-count');
    let idx = 0;

    function show(i) {
        idx = (i + links.length) % links.length;
        const a = links[idx];
        img.src = a.getAttribute('href');
        img.alt = a.querySelector('img').alt;
        cap.textContent = a.querySelector('img').alt;
        count.textContent = `${idx + 1} / ${links.length}`;
    }

    links.forEach((a, i) => a.addEventListener('click', e => {
        e.preventDefault();
        show(i);
        dlg.showModal();
    }));
    dlg.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
    dlg.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
    dlg.querySelector('.lb-close').addEventListener('click', () => dlg.close());
    // clic sullo sfondo scuro: chiude
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') show(idx - 1);
        else if (e.key === 'ArrowRight') show(idx + 1);
    });
    // scorrimento con il dito
    let x0 = null;
    dlg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
        x0 = null;
    });
}

export function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// icone: sprite icons.svg (Font Awesome Free 6.0.0, CC BY 4.0)
export function iconSvg(name) {
    return `<svg class="ic" aria-hidden="true" focusable="false"><use href="icons.svg#i-${name}"/></svg>`;
}

export function setIcon(svg, name) {
    const use = svg && svg.querySelector('use');
    if (use) use.setAttribute('href', 'icons.svg#i-' + name);
}

// ACCESSIBILITA: tastiera, aria-pressed, Esc
export function initA11y() {
    // div/span con role="button" o "switch": Invio e Spazio attivano il click
    document.querySelectorAll('[role="button"][tabindex], [role="switch"][tabindex]').forEach(el => {
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
        });
    });

    // aria-pressed dei livelli sempre allineato alla classe .active (i radio dello sfondo usano aria-checked)
    document.querySelectorAll('#layer-panel button.lyr-row').forEach(btn => {
        const attr = btn.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-pressed';
        const sync = () => btn.setAttribute(attr, btn.classList.contains('active') ? 'true' : 'false');
        sync();
        new MutationObserver(sync).observe(btn, { attributes: true, attributeFilter: ['class'] });
    });

    // Esc chiude il pannello (mobile) e restituisce il focus al tab che lo ha aperto
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
        const sc = document.getElementById('scheda');
        if (sc && !sc.hidden) closeScheda(); else closePanel();
    });
}
