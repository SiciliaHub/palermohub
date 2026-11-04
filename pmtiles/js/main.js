// Avvio dell'app: azioni dell'interfaccia, creazione della mappa, caricamento a eventi.
import * as maplibregl from 'maplibre-gl';
import { BASE_STYLES, DATA_CATASTO, layerStates, mqMobile, state } from './state.js';
import {
    applyTheme, detectMobile, hideLoader, initA11y, initGallery, openPanel, resetMapHome,
    toggleFullscreen, toggleLegend, toggleSatelliteOverlay, toggleTheme
} from './ui.js';
import { initializeMapLayers, initZoomSlider, toggleLayer, syncVincoliMain, updateZoomHints } from './layers.js';
import { initSearch, searchByCivico, searchParticella, switchSearchMode } from './search.js';
import { readUrl, startUrlSync } from './urlstate.js';
import { closeScheda } from './card.js';

// Ogni elemento con data-action="nome" [data-arg="x"] chiama la funzione corrispondente (delega di evento).
const ACTIONS = {
    openPanel: el => openPanel(el.dataset.arg),
    switchSearchMode: el => switchSearchMode(el.dataset.arg),
    toggleLegend: el => toggleLegend(el),
    searchByCivico: () => searchByCivico(),
    // pdf.js (con jsPDF e Turf) si scarica solo al primo clic
    generatePDF: () => import('./pdf.js').then(m => m.generatePDF()),
    zoomIn: () => state.map && state.map.zoomIn(),
    zoomOut: () => state.map && state.map.zoomOut(),
    resetMapHome: () => resetMapHome(),
    toggleFullscreen: () => toggleFullscreen(),
    toggleTheme: () => toggleTheme(),
    toggleSatelliteOverlay: () => toggleSatelliteOverlay(),
    closeScheda: () => closeScheda()
};

function initActions() {
    document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        const fn = el && ACTIONS[el.dataset.action];
        if (fn) fn(el);
    });
    // il video parte a richiesta: l'iframe riceve l'indirizzo solo quando si apre la sezione
    const vid = document.querySelector('iframe[data-src]');
    if (vid) vid.closest('details').addEventListener('toggle', function () {
        if (this.open && !vid.src) vid.src = vid.dataset.src;
    });
}

function initPage() {
    initGallery();
    initActions();
    initA11y();
    initSearch();
    document.querySelectorAll('[data-catasto-data]').forEach(el => { el.textContent = DATA_CATASTO; });
    const btnPart = document.getElementById('particelle');
    if (btnPart) btnPart.title = 'Ultimo aggiornamento ' + DATA_CATASTO;
    detectMobile();
    mqMobile.addEventListener('change', () => {
        detectMobile();
        if (state.map) state.map.resize();
    });
}

// livelli e particella dall'indirizzo (?l=...&p=foglio-particella)
function restoreFromUrl() {
    const { livelli, particella } = readUrl();
    if (livelli) {
        Object.keys(layerStates).forEach(k => { if (livelli.has(k) !== layerStates[k]) toggleLayer(k); });
        syncVincoliMain();
    }
    startUrlSync();
    if (particella) {
        document.getElementById('foglio').value = particella.foglio;
        document.getElementById('particella').value = particella.particella;
        searchParticella();
    }
}

function createMap() {
    if (typeof pmtiles === 'undefined') {
        console.error('PMTiles non caricato');
        hideLoader();
        return;
    }
    maplibregl.addProtocol('pmtiles', new pmtiles.Protocol().tile);

    const map = new maplibregl.Map({
        container: 'map',
        style: BASE_STYLES[document.documentElement.dataset.theme] || BASE_STYLES.light,
        center: [13.33225, 38.14074],
        zoom: state.isMobile ? 11 : 12,
        maxBounds: [[13.1, 37.9785], [13.55, 38.2919]],
        hash: true,
        pitch: 0,
        dragRotate: false,
        canvasContextAttributes: { preserveDrawingBuffer: true }, // serve al PDF (toDataURL)
        attributionControl: { compact: true },
        touchZoomRotate: true,
        touchPitch: false
    });
    state.map = map;
    if (new URLSearchParams(location.search).has('debug')) window.map = map; // solo per le prove da console

    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    // il loader sparisce quando la mappa ha finito di disegnare, non dopo un tempo fisso
    map.once('idle', hideLoader);
    // ponytail: 'idle' può non scattare mai (tile/animazioni in corso): tetto a 20s, poi la mappa si vede comunque
    setTimeout(hideLoader, 20000);

    map.on('load', () => {
        try {
            // attribuzioni compatte: chiuse finche' non si tocca il pulsante (i)
            const attrib = document.querySelector('.maplibregl-ctrl-attrib');
            if (attrib) attrib.classList.remove('maplibregl-compact-show');
            state.baseLayerIds = map.getStyle().layers.map(l => l.id);
            state.baseSourceIds = Object.keys(map.getStyle().sources);
            state.baseTheme = document.documentElement.dataset.theme;
            applyTheme(document.documentElement.dataset.theme);
            initializeMapLayers();
            restoreFromUrl();
            initZoomSlider();
            updateZoomHints();
        } catch (error) {
            console.error('Errore durante il caricamento dei layer:', error);
            hideLoader();
        }
    });

    map.on('error', e => {
        // i 404 sui tile raster (zone senza dati) non sono errori fatali: il loader resta fino a 'idle'
        if (e.error && e.error.status === 404) return;
        console.error('Errore mappa:', e);
        hideLoader();
    });
}

initPage();
try {
    createMap();
} catch (error) {
    console.error("Errore durante l'inizializzazione della mappa:", error);
    hideLoader();
}
