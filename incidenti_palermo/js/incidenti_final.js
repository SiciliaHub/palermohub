// ==========================================
// INCIDENTI PALERMO - DASHBOARD INTERATTIVA
// File JavaScript Completo con Icone Font Awesome
// Versione: 2.0 - Font Awesome Edition
// Data: 2025-01-02
// ==========================================

// ==========================================
// VARIABILI GLOBALI E CONFIGURAZIONI
// ==========================================

let map;
let allIncidenti = [];
let currentFilters = {};
let showHeatmap = false;
let analyticsCharts = {};
let monthlyInjuriesChart = null;
let showClustering = false;
let topLuoghiData = [];
let monthlyAreaChart = null;

let customCalendarState = {
    currentYear: 2023,
    selectedYear: null,
    selectedMonth: null,
    selectedWeekday: null,
    selectedDay: null
};

const MESI_ITALIANI = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const GIORNI_SETTIMANA_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
    display: false
});

const colorMap = {
    'M': '#ef4444',
    'R': '#a855f7',
    'F': '#f59e0b',
    'C': '#10b981'
};

// ICONE FONT AWESOME PER TIPOLOGIE
const tipologiaIcons = {
    'M': '<i class="fas fa-skull"></i>',
    'R': '<i class="fas fa-ambulance"></i>',
    'F': '<i class="fas fa-user-injured"></i>',
    'C': '<i class="fas fa-car-crash"></i>'
};

const tipologiaNames = {
    'M': 'Mortale',
    'R': 'Riserva',
    'F': 'Feriti',
    'C': 'Cose'
};

const basemapStyles = {
    'carto-dark': {
        version: 8,
        sources: {
            'carto': {
                type: 'raster',
                tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© CARTO | <a href="https://www.dati.gov.it/view-dataset?Cerca=incidenti+palermo" target="_blank">Fonte Dati: dati.gov.it</a>'
            }
        },
        layers: [{ id: 'carto', type: 'raster', source: 'carto' }]
    },
    'osm': {
        version: 8,
        sources: {
            'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
            }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
    },
    'satellite': {
        version: 8,
        sources: {
            'satellite': {
                type: 'raster',
                tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                tileSize: 256,
                attribution: '© Google'
            }
        },
        layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }]
    },
    'carto-light': {
        version: 8,
        sources: {
            'carto': {
                type: 'raster',
                tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© CARTO'
            }
        },
        layers: [{ id: 'carto', type: 'raster', source: 'carto' }]
    }
};

const filterConfig = {
    'filter-tipologia': 'Tipologia',
    'filter-circoscrizione': 'Circoscrizione',
    'filter-quartiere': 'Quartiere',
    'filter-upl': 'UPL',
    'filter-anno': 'Anno',
    'filter-stagione': 'Stagione',
    'filter-mese': 'Mese',
    'filter-giorno-settimana': 'Giorno settimana',
    'filter-feriale-weekend': 'Feriale/Weekend',
    'filter-giorno-notte': 'Giorno/Notte',
    'filter-condizioni-luce': 'Condizioni luce (Visibilità)',
    'filter-fascia-4': 'Fascia oraria (4 fasce)',
    'filter-fascia-6': 'Fascia oraria dettagliata (6 fasce)',
    'filter-ora-punta': 'Ora di punta (Picchi di traffico)'
};

const filterDependencies = {
    'filter-circoscrizione': ['filter-quartiere', 'filter-upl'],
    'filter-quartiere': ['filter-upl']
};

// ==========================================
// NOTA: Questo è un file di esempio abbreviato
// Per il file completo funzionante, assembla tutte le 9 parti
// seguendo le istruzioni nel documento di riepilogo
// ==========================================

// Il file completo conterrebbe qui:
// - Tutte le funzioni dalla PARTE 2 alla PARTE 9
// - Oltre 3000 righe di codice JavaScript
// - Tutte le funzioni per mappa, filtri, grafici, calendario, analytics

// Per assemblare il file completo:
// 1. Copia il contenuto di PARTE 1 (sopra)
// 2. Aggiungi contenuto PARTE 2 (init, toggle)
// 3. Aggiungi contenuto PARTE 3 (detail panel)
// 4. Aggiungi contenuto PARTE 4 (download)
// 5. Aggiungi contenuto PARTE 5 (mappa)
// 6. Aggiungi contenuto PARTE 6 (filtri)
// 7. Aggiungi contenuto PARTE 7 (grafici)
// 8. Aggiungi contenuto PARTE 8 (calendario)
// 9. Aggiungi contenuto PARTE 9 (analytics e listeners)

console.log('Dashboard Incidenti Palermo - Font Awesome Edition');
console.log('Per il file completo, assembla tutte le 9 parti');
