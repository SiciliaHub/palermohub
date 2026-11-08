// Stato condiviso dell'app: un solo oggetto, importato dai moduli (niente variabili globali su window).
export const BASE_STYLES = {
    light: 'https://tiles.openfreemap.org/styles/positron',
    dark: 'https://tiles.openfreemap.org/styles/dark'
};

// DATA DI AGGIORNAMENTO DEL CATASTO: unico punto da modificare.
// Viene usata nel PDF e in ogni elemento con [data-catasto-data] della pagina.
export const DATA_CATASTO = 'Settembre 2026';

export const mqMobile = window.matchMedia('(max-width: 899px)');

export const state = {
    map: null,
    isMobile: mqMobile.matches,
    currentParticella: null,
    civiciIndex: null,
    odonomiList: null,
    civicoMarker: null,
    civiciWasVisible: false,
    baseLayerIds: null,
    baseSourceIds: null,
    baseTheme: null
};

// STATO DEI LAYER
export const layerStates = {
    'basemap': true,
    'vincoli_lin': true,
    'vincoli_ar': true,
    'particelle': true,
    'civici': false,
    'carta_tecnica': false,
    'satellite': false,
    'zonizzazione': true,
    'zone_omi': false,
    'territorio': false
};

// MAPPATURA TRA ID PULSANTI E ID LAYER SULLA MAPPA
export const layerMapping = {
    'basemap': null, // gestito via state.baseLayerIds (tutti i layer dello stile OpenFreeMap)
    'vincoli_lin': 'vincoli_lin',
    'vincoli_ar': 'vincoli_ar',
    'particelle': 'Particelle catastali',
    'civici': 'Numeri Civici',
    'carta_tecnica': 'carta_tecnica',
    'satellite': 'satellite-layer',
    'zonizzazione': 'zto',
    'zone_omi': 'Zone OMI',
    'territorio': 'territorio-circ-line'
};
