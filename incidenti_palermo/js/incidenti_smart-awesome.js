// ==========================================
// INCIDENTI PALERMO - DASHBOARD INTERATTIVA
// File JavaScript CORRETTO - Clustering Funzionante
// Versione: 2.1 - FIXED
// ==========================================

// ==========================================
// PARTE 1: VARIABILI GLOBALI E CONFIGURAZIONI
// ==========================================

// Global Variables
let map;
let allIncidenti = [];
let currentFilters = {};
let showHeatmap = false;
let analyticsCharts = {};
let monthlyInjuriesChart = null;
let showClustering = false;
let topLuoghiData = [];
let monthlyAreaChart = null;
let serieStoricaData = [];
let serieStoricaChartIncidenti = null;
let serieStoricaChartMorti = null;

// Calendario Custom - Variabili Globali
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

const MESI_ITALIANI_CAL = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const GIORNI_SETTIMANA_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

// Register Chart.js plugins globally
Chart.register(ChartDataLabels);

// Unregister datalabels by default
Chart.defaults.set('plugins.datalabels', {
    display: false
});

// Color Map per tipologie
const colorMap = {
    'M': '#ef4444',  // Rosso - Mortale
    'R': '#a855f7',  // Viola - Riserva  
    'F': '#f59e0b',  // Ambra - Feriti
    'C': '#10b981'   // Verde - Cose
};

// Icone Font Awesome per tipologie
const tipologiaIcons = {
    'M': '<i class="fas fa-skull"></i>',
    'R': '<i class="fas fa-ambulance"></i>',
    'F': '<i class="fas fa-user-injured"></i>',
    'C': '<i class="fas fa-car-crash"></i>'
};

// Nomi tipologie
const tipologiaNames = {
    'M': 'Mortale',
    'R': 'Riserva',
    'F': 'Feriti',
    'C': 'Cose'
};

// Basemap styles
// âœ… Basemap styles SENZA glyphs (evita errori di caricamento font)
const basemapStyles = {
    'carto-dark': {
        version: 8,
		glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=BZTlvCzEgnATtZxkip69', // âœ… Font gratuiti       
	   sources: {
            'carto': {
                type: 'raster',
                tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© CARTO | <a href="https://www.dati.gov.it/view-dataset?Cerca=incidenti+palermo" target="_blank">Fonte Dati: dati.gov.it</a> - Rielaborazione: <a href="https://www.linkedin.com/in/gbvitrano/" target="_blank">@gbvitrano</a> - <a href="http://opendatasicilia.it/" target="_blank">opendatasicilia.it</a>'
            }
        },
        layers: [{
            id: 'carto',
            type: 'raster',
            source: 'carto'
        }]
    },
    'osm': {
        version: 8,
		glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=BZTlvCzEgnATtZxkip69', // âœ… Font gratuiti
        sources: {
            'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors | <a href="https://www.dati.gov.it/view-dataset?Cerca=incidenti+palermo" target="_blank">Fonte Dati: dati.gov.it</a> - Rielaborazione: <a href="https://www.linkedin.com/in/gbvitrano/" target="_blank">@gbvitrano</a> - <a href="http://opendatasicilia.it/" target="_blank">opendatasicilia.it</a>'
            }
        },
        layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm'
        }]
    },
    'satellite': {
        version: 8,
		glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=BZTlvCzEgnATtZxkip69', // âœ… Font gratuiti
        sources: {
            'satellite': {
                type: 'raster',
                tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                tileSize: 256,
                attribution: '© Google | <a href="https://www.dati.gov.it/view-dataset?Cerca=incidenti+palermo" target="_blank">Fonte Dati: dati.gov.it</a> - Rielaborazione: <a href="https://www.linkedin.com/in/gbvitrano/" target="_blank">@gbvitrano</a> - <a href="http://opendatasicilia.it/" target="_blank">opendatasicilia.it</a>'
            }
        },
        layers: [{
            id: 'satellite',
            type: 'raster',
            source: 'satellite'
        }]
    },
    'carto-light': {
        version: 8,
		glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=BZTlvCzEgnATtZxkip69', // âœ… Font gratuiti
        sources: {
            'carto': {
                type: 'raster',
                tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© CARTO | <a href="https://www.dati.gov.it/view-dataset?Cerca=incidenti+palermo" target="_blank">Fonte Dati: dati.gov.it</a> - Rielaborazione: <a href="https://www.linkedin.com/in/gbvitrano/" target="_blank">@gbvitrano</a> - <a href="http://opendatasicilia.it/" target="_blank">opendatasicilia.it</a>'
            }
        },
        layers: [{
            id: 'carto',
            type: 'raster',
            source: 'carto'
        }]
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
// PARTE 2 - incidenti_part2
// ==========================================

// ==========================================
// PARTE 2: INIZIALIZZAZIONE E TOGGLE FUNZIONI
// ==========================================

// Initialization

async function init() {
    try {
        console.log('Inizio caricamento CSV...');
        document.getElementById('loading').innerHTML = '<div>Caricamento CSV...</div><small>Download in corso</small>';
        
        await loadCSV();
        await loadSerieStoricaCSV();
        
        console.log('CSV caricato, inizializzazione mappa...');
        document.getElementById('loading').innerHTML = '<div>Creazione mappa...</div><small>Attendere</small>';
        
        initMap();
        initCustomCalendar();
        setupEventListeners();
        restoreDesktopSidebarState();
        
        calculateTopLuoghi();
        
        // ✅ Carica filtri dall'URL (se presenti)
        setTimeout(() => {
            const hasUrlFilters = loadFiltersFromUrl();
            
            // ✅ Se NON ci sono filtri nell'URL, imposta il default 2023 e aggiorna l'URL
            if (!hasUrlFilters) {
                console.log('📅 Nessun filtro nell\'URL, applico default anno 2023');
                currentFilters['filter-anno'] = '2023';
                
                // Aggiorna la select
                const filterAnno = document.getElementById('filter-anno');
                if (filterAnno) {
                    filterAnno.value = '2023';
                }
                
                // Aggiorna calendario
                customCalendarState.selectedYear = 2023;
                customCalendarState.currentYear = 2023;
                
                // ✅ IMPORTANTE: Aggiorna l'URL del browser con il filtro default
                setTimeout(() => {
                    updateBrowserUrl();
                    console.log('✅ URL browser inizializzato con anno=2023');
                }, 500);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        document.getElementById('loading').innerHTML = '<div>Errore caricamento</div><small>' + error.message + '</small>';
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 2000);
    }
}

// ==========================================
// GESTIONE URL BROWSER - SYNC CON FILTRI
// ==========================================

// Aggiorna URL del browser con i filtri correnti

// Aggiorna URL del browser con i filtri correnti
function updateBrowserUrl() {
    const params = new URLSearchParams();
    let hasFilters = false;
    
    // Aggiungi tutti i filtri attivi
    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== '' && value !== null) {
            const paramName = key.replace('filter-', '');
            params.set(paramName, value);
            hasFilters = true;
        }
    });
    
    // ❌ RIMUOVI QUESTA PARTE - MapLibre gestisce già lat/lng/zoom nell'hash
    // Non serve duplicarli nei query params
    /*
    if (map) {
        try {
            const center = map.getCenter();
            const zoom = map.getZoom();
            params.set('lat', center.lat.toFixed(6));
            params.set('lng', center.lng.toFixed(6));
            params.set('zoom', zoom.toFixed(2));
        } catch (e) {
            console.warn('Errore nel recupero posizione mappa:', e);
        }
    }
    */
    
    // ✅ PRESERVA L'HASH DI MAPLIBRE
    const currentHash = window.location.hash;
    
    // Aggiorna URL senza ricaricare la pagina
    const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}${currentHash}` 
        : `${window.location.pathname}${currentHash}`;
    
    // Usa replaceState per non aggiungere alla cronologia ad ogni filtro
    window.history.replaceState({ filters: currentFilters }, '', newUrl);
    
    console.log('✅ URL browser aggiornato:', newUrl);
}

// Carica filtri dall'URL al caricamento della pagina
function loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    
    console.log('🔍 Caricamento filtri da URL...');
    
    let filtersLoaded = false;
    
    // Mappa dei parametri URL ai nomi dei filtri
    const urlParamMap = {
        'anno': 'filter-anno',
        'mese': 'filter-mese',
        'tipologia': 'filter-tipologia',
        'circoscrizione': 'filter-circoscrizione',
        'quartiere': 'filter-quartiere',
        'upl': 'filter-upl',
        'stagione': 'filter-stagione',
        'giorno-settimana': 'filter-giorno-settimana',
        'feriale-weekend': 'filter-feriale-weekend',
        'giorno-notte': 'filter-giorno-notte',
        'condizioni-luce': 'filter-condizioni-luce',
        'fascia-4': 'filter-fascia-4',
        'fascia-6': 'filter-fascia-6',
        'ora-punta': 'filter-ora-punta',
        'data-selezionata': 'filter-data-selezionata'
    };
    
    // Applica ogni parametro trovato
    params.forEach((value, key) => {
        // ✅ SALTA SOLO I PARAMETRI CHE NON SONO FILTRI
        // (lat/lng/zoom e shared non sono più nei query params)
        
        const filterKey = urlParamMap[key];
        if (filterKey) {
            currentFilters[filterKey] = value;
            
            // Aggiorna anche la select corrispondente
            const selectElement = document.getElementById(filterKey);
            if (selectElement) {
                selectElement.value = value;
            }
            
            filtersLoaded = true;
            console.log(`  ✓ Filtro caricato: ${key} = ${value}`);
        }
    });
    
    if (filtersLoaded) {
        console.log('✅ Filtri caricati da URL:', currentFilters);
        
        // Aggiorna tutto dopo aver caricato i filtri
        setTimeout(() => {
            updateAllFilters();
            updateMapData();
            updateStats();
            updateYearStats();
            updateLegendChart();
            updatePeriodSwitches();
            updateMonthlyInjuriesChart();
            updateMonthlyAreaChart();
            calculateTopLuoghi();
            
            // Aggiorna calendario se necessario
            if (currentFilters['filter-anno']) {
                customCalendarState.currentYear = parseInt(currentFilters['filter-anno']);
                customCalendarState.selectedYear = parseInt(currentFilters['filter-anno']);
                renderCalendarYear();
                renderCalendarMonths();
            }
            
            if (currentFilters['filter-mese']) {
                customCalendarState.selectedMonth = currentFilters['filter-mese'];
                const monthIndex = MESI_ITALIANI.indexOf(currentFilters['filter-mese']);
                if (monthIndex >= 0) {
                    renderCalendarDays(monthIndex);
                }
            }
            
            updateCalendarSummary();
        }, 500);
    } else {
        console.log('ℹ️ Nessun filtro trovato nell\'URL');
    }
    
    return filtersLoaded;
}

// CSV Loading
async function loadCSV() {
    return new Promise((resolve, reject) => {
        Papa.parse('data/incidenti_2015_2023.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('CSV scaricato, parsing righe...');
                
                allIncidenti = results.data.filter(row => {
                    return row.Tipologia && 
                           row.longitude && 
                           row.latitude &&
                           !isNaN(parseFloat(row.longitude)) &&
                           !isNaN(parseFloat(row.latitude));
                });
                
                console.log(`CSV processato: ${allIncidenti.length} incidenti validi`);
                resolve();
            },
            error: function(error) {
                console.error('Errore download CSV:', error);
                reject(error);
            }
        });
    });
}

// Carica CSV Serie Storica
async function loadSerieStoricaCSV() {
    return new Promise((resolve, reject) => {
        Papa.parse('data/serie_storica.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('Serie Storica CSV caricato:', results.data.length, 'righe');
                serieStoricaData = results.data.filter(row => {
                    return row.anno && 
                           !isNaN(parseInt(row.anno));
                });
                console.log('Serie Storica validata:', serieStoricaData.length, 'righe');
                resolve();
            },
            error: function(error) {
                console.error('Errore caricamento Serie Storica CSV:', error);
                reject(error);
            }
        });
    });
}

// Toggle Heatmap
function toggleHeatmap() {
    showHeatmap = !showHeatmap;
    const btn = document.getElementById('btn-toggle-heatmap');
    const btnMap = document.getElementById('btn-heatmap-map');
    const pointsLegend = document.getElementById('points-legend');
    const heatmapLegend = document.getElementById('heatmap-legend');
    
    if (showHeatmap) {
        map.setLayoutProperty('incidenti-heatmap', 'visibility', 'visible');
        ['C', 'F', 'R', 'M'].forEach(tipo => {
            map.setLayoutProperty(`incidenti-${tipo}`, 'visibility', 'none');
        });
        if (btn) {
            btn.innerHTML = '<i class="fas fa-map"></i> Localizzazione incidenti';
            btn.classList.add('active');
        }
        if (btnMap) {
            btnMap.innerHTML = '<i class="fa-solid fa-power-off"></i> Heatmap - Off';
            btnMap.classList.add('active');
        }
        if (pointsLegend) pointsLegend.classList.add('hidden');
        if (heatmapLegend) heatmapLegend.classList.remove('hidden');
    } else {
        map.setLayoutProperty('incidenti-heatmap', 'visibility', 'none');
        ['C', 'F', 'R', 'M'].forEach(tipo => {
            map.setLayoutProperty(`incidenti-${tipo}`, 'visibility', 'visible');
        });
        if (btn) {
            btn.innerHTML = '<i class="fas fa-fire"></i> Heatmap';
            btn.classList.remove('active');
        }
        if (btnMap) {
            btnMap.innerHTML = '<i class="fas fa-fire"></i> Heatmap';
            btnMap.classList.remove('active');
        }
        if (pointsLegend) pointsLegend.classList.remove('hidden');
        if (heatmapLegend) heatmapLegend.classList.add('hidden');
    }
}

// Toggle Clustering - VERSIONE CORRETTA
function toggleClustering() {
    showClustering = !showClustering;
    const btn = document.getElementById('btn-clustering-map');
    
    if (showClustering) {
        // Disattiva heatmap se attiva
        if (showHeatmap) {
            toggleHeatmap();
        }
        
        // Nascondi i layer standard
        ['C', 'F', 'R', 'M'].forEach(tipo => {
            if (map.getLayer(`incidenti-${tipo}`)) {
                map.setLayoutProperty(`incidenti-${tipo}`, 'visibility', 'none');
            }
        });
        
        // Crea i layer clustering
        createClusteringLayers();
        
        // Aggiorna pulsante
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-power-off"></i> <span>Clustering - Off</span>';
            btn.classList.add('active');
        }
        
    } else {
        // Rimuovi i layer clustering
        const layersToRemove = ['cluster-count', 'clusters', 'unclustered-point'];
        layersToRemove.forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
        });
        
        // Rimuovi il source
        if (map.getSource('incidenti-cluster')) {
            map.removeSource('incidenti-cluster');
        }
        
        // Mostra i layer standard
        ['C', 'F', 'R', 'M'].forEach(tipo => {
            if (map.getLayer(`incidenti-${tipo}`)) {
                map.setLayoutProperty(`incidenti-${tipo}`, 'visibility', 'visible');
            }
        });
        
        // Aggiorna pulsante
        if (btn) {
            btn.innerHTML = '<i class="fas fa-circle"></i> <span>Clustering</span>';
            btn.classList.remove('active');
        }
        
        // Chiudi modale top luoghi se aperta
        const modal = document.getElementById('top-luoghi-modal');
        if (modal && modal.classList.contains('show')) {
            closeTopLuoghiModal();
        }
    }
}

// Toggle Section
function toggleSection(sectionId) {
    const content = document.getElementById(`content-${sectionId}`);
    const header = document.querySelector(`[data-section="${sectionId}"]`);
    
    if (!content || !header) return;
    
    const toggle = header.querySelector('.toggle-icon');
    
    content.classList.toggle('collapsed');
    if (toggle) toggle.classList.toggle('collapsed');
}

// âœ… FUNZIONE CORRETTA - Toggle Sidebar (con chiusura graffa)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('mobile-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) return;
    
    sidebar.classList.toggle('open');
    if (toggle) toggle.classList.toggle('active');
    
    if (overlay) {
        if (sidebar.classList.contains('open')) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
} // âœ… CHIUSURA CORRETTA

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('mobile-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (toggle) toggle.classList.remove('active');
    if (overlay) overlay.classList.remove('show');
}

// âœ… SINGOLA DEFINIZIONE - Toggle Desktop Sidebar
function toggleDesktopSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-desktop-toggle');
    const toggleIcon = toggleBtn?.querySelector('i');
    
    if (!sidebar) return;
    
    sidebar.classList.toggle('collapsed');
    
    if (toggleIcon) {
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.className = 'fas fa-chevron-right';
            toggleBtn.title = 'Apri pannello filtri';
        } else {
            toggleIcon.className = 'fas fa-chevron-left';
            toggleBtn.title = 'Chiudi pannello filtri';
        }
    }
    
    localStorage.setItem('sidebarDesktopState', 
        sidebar.classList.contains('collapsed') ? 'collapsed' : 'open'
    );
}

// Ripristina stato sidebar al caricamento
function restoreDesktopSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-desktop-toggle');
    const toggleIcon = toggleBtn?.querySelector('i');
    
    sidebar?.classList.remove('collapsed');
    if (toggleIcon) {
        toggleIcon.className = 'fas fa-chevron-left';
        toggleBtn.title = 'Chiudi pannello filtri';
    }
    
    localStorage.removeItem('sidebarDesktopState');
}






// ==========================================
// PARTE 3 - incidenti_part3
// ==========================================

// ==========================================
// PARTE 3: PANNELLO DETTAGLI E POPUP
// ==========================================

// Open Detail Panel (AGGIORNATO CON FONT AWESOME)
function openDetailPanel(properties) {
    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');
    
    if (!panel || !content) return;
    
    const tipoIcon = document.getElementById('detail-tipo-icon');
    const subtitle = document.getElementById('detail-subtitle');
    
    if (tipoIcon) tipoIcon.innerHTML = tipologiaIcons[properties.Tipologia] || '<i class="fas fa-car"></i>';
    if (subtitle) subtitle.textContent = `Incidente del ${properties.Data || 'Data non disponibile'}`;
    
    let html = '';
    
    // Sezione Tipologia e Gravità  (ICONA AGGIORNATA)
    html += `
        <div class="detail-section">
            <h3><i class="fas fa-exclamation-triangle"></i> Tipologia e Gravità </h3>
            <div class="detail-row">
                <span class="detail-label">Tipo Incidente</span>
                <span class="tipo-badge ${properties.Tipologia}">${properties.Tipologia} - ${tipologiaNames[properties.Tipologia]}</span>
            </div>
        </div>
    `;
    
    // Sezione Quando (ICONA AGGIORNATA)
    html += '<div class="detail-section"><h3><i class="fas fa-calendar-alt"></i> Quando è avvenuto</h3>';
    const temporalFields = [
        { key: 'Data', label: 'Data' },
        { key: 'Anno', label: 'Anno' },
        { key: 'Stagione', label: 'Stagione' },
        { key: 'Mese', label: 'Mese' },
        { key: 'Giorno settimana', label: 'Giorno Settimana' },
        { key: 'Feriale/Weekend', label: 'Tipo Giorno' },
        { key: 'Giorno/Notte', label: 'Momento' },
        { key: 'Fascia oraria (4 fasce)', label: 'Fascia Oraria' },
        { key: 'Fascia oraria dettagliata (6 fasce)', label: 'Fascia Dettagliata' },
        { key: 'Ora di punta (Picchi di traffico)', label: 'Ora di Punta' }
    ];
    
    temporalFields.forEach(field => {
        if (properties[field.key] && properties[field.key] !== 'null') {
            html += `
                <div class="detail-row">
                    <span class="detail-label">${field.label}</span>
                    <span class="detail-value">${properties[field.key]}</span>
                </div>
            `;
        }
    });
    html += '</div>';
    
    // Sezione Dove (ICONA AGGIORNATA)
    html += '<div class="detail-section"><h3><i class="fas fa-map-marker-alt"></i> Dove è avvenuto</h3>';
    const locationFields = [
        { key: 'Circoscrizione', label: 'Circoscrizione' },
        { key: 'Quartiere', label: 'Quartiere' },
        { key: 'UPL', label: 'Unità  di Primo Livello' }
    ];
    
    locationFields.forEach(field => {
        if (properties[field.key] && properties[field.key] !== 'null') {
            html += `
                <div class="detail-row">
                    <span class="detail-label">${field.label}</span>
                    <span class="detail-value">${properties[field.key]}</span>
                </div>
            `;
        }
    });
    
    if (properties.latitude && properties.longitude) {
        html += `
            <div class="detail-row">
                <span class="detail-label">Coordinate GPS</span>
                <div style="flex: 1; text-align: right;">
                    <div class="coordinates-box">
                        Lat: ${parseFloat(properties.latitude).toFixed(6)}<br>
                        Lng: ${parseFloat(properties.longitude).toFixed(6)}
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    
    // Sezione Condizioni Ambientali (ICONA AGGIORNATA)
    html += '<div class="detail-section"><h3><i class="fas fa-cloud-sun"></i> Condizioni Ambientali</h3>';
    if (properties['Condizioni luce (Visibilità)'] && properties['Condizioni luce (Visibilità)'] !== 'null') {
        html += `
            <div class="detail-row">
                <span class="detail-label">Condizioni Luce</span>
                <span class="detail-value">${properties['Condizioni luce (Visibilità)']}</span>
            </div>
        `;
    }
    html += '</div>';
    
    content.innerHTML = html;
    panel.classList.add('open');
}

function closeDetailPanel() {
    const panel = document.getElementById('detail-panel');
    if (panel) panel.classList.remove('open');
}

// Show 2019 Info Popup (ICONA AGGIORNATA)
function show2019InfoPopup() {
    const existingPopup = document.getElementById('popup-2019');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    const popup = document.createElement('div');
    popup.id = 'popup-2019';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        z-index: 10000;
        max-width: 500px;
        border: 2px solid #0079c6;
    `;
    
    // ICONA AGGIORNATA
    popup.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;"><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i></div>
            <h3 style="color: #3b82f6; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
                Anno 2019 - Dati Parziali
            </h3>
            <p style="color: #1f2937c9; margin: 0 0 16px 0; font-size: 14px; line-height: 1.6;">
                Il <strong style="color: #1f2937;">2019</strong> include <strong style="color: #3b82f6;">3.192 incidenti non mappati</strong> 
                perchà© nel dataset non erano presenti le coordinate geografiche.
            </p>
            <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 13px; font-style: italic;">
                Questi incidenti sono conteggiati nelle statistiche ma non visualizzati sulla mappa.
            </p>
            <button onclick="document.getElementById('popup-2019').remove(); document.getElementById('popup-overlay-2019').remove();" 
                    style="
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59,130,246,0.4)';"
                    onmouseout="this.style.transform=''; this.style.boxShadow='';">
                Ho capito
            </button>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'popup-overlay-2019';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
    `;
    overlay.onclick = () => {
        popup.remove();
        overlay.remove();
    };
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

// Open Top Luoghi Modal (ICONA AGGIORNATA)
function openTopLuoghiModal() {
    // RIMOSSO questo blocco:
    // if (!showClustering) {
    //     alert('Attiva prima la modalità  Clustering per visualizzare i Top Luoghi');
    //     return;
    // }
    
    const modal = document.getElementById('top-luoghi-modal');
    const tbody = document.getElementById('top-luoghi-body');
    const countEl = document.getElementById('top-luoghi-count');
    
    if (!modal || !tbody) return;
    
    if (countEl) {
        countEl.textContent = topLuoghiData.length;
    }
    
    const activeFilters = Object.entries(currentFilters)
        .filter(([key, value]) => value && value !== '')
        .map(([key, value]) => {
            const label = filterConfig[key] || key;
            return `${label}: ${value}`;
        });
    
    const existingFilters = modal.querySelector('.filters-info-top');
    if (existingFilters) existingFilters.remove();
    
    if (activeFilters.length > 0) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.insertAdjacentHTML('afterbegin', `
                <div class="filters-info-top" style="margin-bottom: 16px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 6px;">
                    <strong style="color: #1f2937;">Filtri applicati:</strong><br>
                    <span style="color: #1f2937c9; font-size: 13px;">${activeFilters.join('  • ')}</span>
                </div>
            `);
        }
    }
    
    let html = '';
    topLuoghiData.forEach((item, index) => {
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        
        // ICONA AGGIORNATA per il pulsante visualizza
        html += `
            <tr>
                <td style="text-align: center;">
                    <span class="rank-badge ${rankClass}">${rank}</span>
                </td>
                <td style="font-weight: 600; color: #1f2937;">${item.indirizzo}</td>
                <td style="text-align: center; font-weight: 700; color: #3b82f6; font-size: 16px;">
                    ${item.total}
                </td>
                <td style="text-align: center;">
                    <span class="tipo-count" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                        ${item.M}
                    </span>
                </td>
                <td style="text-align: center;">
                    <span class="tipo-count" style="background: rgba(168, 85, 247, 0.2); color: #a855f7;">
                        ${item.R}
                    </span>
                </td>
                <td style="text-align: center;">
                    <span class="tipo-count" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">
                        ${item.F}
                    </span>
                </td>
                <td style="text-align: center;">
                    <span class="tipo-count" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">
                        ${item.C}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button class="btn-zoom-location" onclick="zoomToLocation(${item.coordinates[0]}, ${item.coordinates[1]})">
                        <i class="fas fa-search-location"></i> Visualizza
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    modal.classList.add('show');
}

function closeTopLuoghiModal() {
    const modal = document.getElementById('top-luoghi-modal');
    if (modal) modal.classList.remove('show');
}

// ==========================================
// PARTE 4 - incidenti_part4
// ==========================================

// ==========================================
// PARTE 4: FUNZIONI DOWNLOAD E ANALYTICS
// ==========================================

// Download CSV
function downloadCSV() {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
        alert('Nessun dato da scaricare');
        return;
    }
    
    const keys = Object.keys(filteredData[0]);
    let csv = keys.join(',') + '\n';
    
    filteredData.forEach(row => {
        const values = keys.map(key => {
            const value = row[key];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return '"' + stringValue.replace(/"/g, '""') + '"';
            }
            return stringValue;
        });
        csv += values.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const annoFiltro = currentFilters['filter-anno'] || 'tutti';
    link.setAttribute('href', url);
    link.setAttribute('download', `incidenti_palermo_${annoFiltro}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download JSON
function downloadJSON() {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
        alert('Nessun dato da scaricare');
        return;
    }
    
    const json = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const annoFiltro = currentFilters['filter-anno'] || 'tutti';
    link.setAttribute('href', url);
    link.setAttribute('download', `incidenti_palermo_${annoFiltro}_${new Date().getTime()}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download Top Luoghi CSV
function downloadTopLuoghiCSV() {
    if (topLuoghiData.length === 0) {
        alert('Nessun dato da scaricare');
        return;
    }
    
    let csv = 'Posizione,Indirizzo,Totale Incidenti,Mortali,Riserva,Feriti,Cose\n';
    
    topLuoghiData.forEach((item, index) => {
        const indirizzo = item.indirizzo.replace(/"/g, '""');
        csv += `${index + 1},"${indirizzo}",${item.total},${item.M},${item.R},${item.F},${item.C}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const annoFiltro = currentFilters['filter-anno'] || 'tutti';
    link.setAttribute('href', url);
    link.setAttribute('download', `top_50_luoghi_palermo_${annoFiltro}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Analytics Functions - VERSIONE CORRETTA CON TIMEOUT
function openAnalytics() {
    const panel = document.getElementById('analytics-panel');
    if (panel) {
        panel.classList.add('open');
        document.body.classList.add('analytics-panel-open');
        document.body.classList.add('modal-open');
        
        // ✅ IMPORTANTE: Aspetta che il DOM sia renderizzato
        setTimeout(() => {
            console.log('🎯 openAnalytics - chiamata updateActiveFiltersDisplay');
            console.log('📦 currentFilters:', currentFilters);
            updateActiveFiltersDisplay();
            updateAnalytics();
        }, 200); // Aumentato da 100 a 200ms
    }
}


function closeAnalytics() {
    const panel = document.getElementById('analytics-panel');
    if (panel) {
        panel.classList.remove('open');
        document.body.classList.remove('analytics-panel-open'); // Rimuovi classe dal body
        document.body.classList.remove('modal-open'); // Rimuovi classe generica
    }
}

function updateActiveFiltersDisplay() {
    console.log('\n🔍 === updateActiveFiltersDisplay chiamata ===');
    
    // Verifica immediata elemento
    const activeFiltersText = document.getElementById('active-filters-text');
    console.log('🎯 Elemento trovato subito:', activeFiltersText ? '✅ SÌ' : '❌ NO');
    
    if (!activeFiltersText) {
        console.error('❌ ELEMENTO active-filters-text NON TROVATO!');
        console.log('🔍 Cerco nel DOM...');
        const allElements = document.querySelectorAll('*[id]');
        console.log('📋 Tutti gli ID nel DOM:', Array.from(allElements).map(el => el.id));
        return;
    }
    
    const filteredData = getFilteredData();
    const totalData = allIncidenti.length;
    
    console.log('📊 Dati:', filteredData.length, 'di', totalData);
    console.log('🔧 currentFilters:', JSON.stringify(currentFilters, null, 2));
    
    let filterText = [];
    
    // Data specifica
    if (currentFilters['filter-data-selezionata']) {
        filterText.push(`Data: ${currentFilters['filter-data-selezionata']}`);
        console.log('➕ Aggiunto filtro: Data');
    }
    
    // Anno
    if (currentFilters['filter-anno']) {
        filterText.push(`Anno: ${currentFilters['filter-anno']}`);
        console.log('➕ Aggiunto filtro: Anno');
    }
    
    // Mese
    if (currentFilters['filter-mese']) {
        filterText.push(`Mese: ${currentFilters['filter-mese']}`);
        console.log('➕ Aggiunto filtro: Mese');
    }
    
    // Giorno settimana
    if (currentFilters['filter-giorno-settimana']) {
        filterText.push(`Giorno: ${currentFilters['filter-giorno-settimana']}`);
        console.log('➕ Aggiunto filtro: Giorno settimana');
    }
    
    // Tipologia
    if (currentFilters['filter-tipologia']) {
        const tipologiaNames = {
            'M': 'Mortale',
            'R': 'Riserva',
            'F': 'Feriti',
            'C': 'Cose'
        };
        filterText.push(`Tipologia: ${tipologiaNames[currentFilters['filter-tipologia']]}`);
        console.log('➕ Aggiunto filtro: Tipologia');
    }
    
    // Circoscrizione
    if (currentFilters['filter-circoscrizione']) {
        filterText.push(`Circoscrizione: ${currentFilters['filter-circoscrizione']}`);
        console.log('➕ Aggiunto filtro: Circoscrizione');
    }
    
    // Quartiere
    if (currentFilters['filter-quartiere']) {
        filterText.push(`Quartiere: ${currentFilters['filter-quartiere']}`);
        console.log('➕ Aggiunto filtro: Quartiere');
    }
    
    // UPL
    if (currentFilters['filter-upl']) {
        filterText.push(`UPL: ${currentFilters['filter-upl']}`);
        console.log('➕ Aggiunto filtro: UPL');
    }
    
    // Giorno/Notte
    if (currentFilters['filter-giorno-notte']) {
        filterText.push(`${currentFilters['filter-giorno-notte']}`);
        console.log('➕ Aggiunto filtro: Giorno/Notte');
    }
    
    // Stagione
    if (currentFilters['filter-stagione']) {
        filterText.push(`Stagione: ${currentFilters['filter-stagione']}`);
        console.log('➕ Aggiunto filtro: Stagione');
    }
    
    // Feriale/Weekend
    if (currentFilters['filter-feriale-weekend']) {
        filterText.push(`${currentFilters['filter-feriale-weekend']}`);
        console.log('➕ Aggiunto filtro: Feriale/Weekend');
    }
    
    // Condizioni luce
    if (currentFilters['filter-condizioni-luce']) {
        filterText.push(`Luce: ${currentFilters['filter-condizioni-luce']}`);
        console.log('➕ Aggiunto filtro: Condizioni luce');
    }
    
    // Fascia oraria 4
    if (currentFilters['filter-fascia-4']) {
        filterText.push(`Fascia: ${currentFilters['filter-fascia-4']}`);
        console.log('➕ Aggiunto filtro: Fascia 4');
    }
    
    // Fascia oraria 6
    if (currentFilters['filter-fascia-6']) {
        filterText.push(`Fascia: ${currentFilters['filter-fascia-6']}`);
        console.log('➕ Aggiunto filtro: Fascia 6');
    }
    
    // Ora di punta
    if (currentFilters['filter-ora-punta']) {
        filterText.push(`${currentFilters['filter-ora-punta']}`);
        console.log('➕ Aggiunto filtro: Ora di punta');
    }
    
    console.log('🏷️ Totale filtri trovati:', filterText.length);
    console.log('📝 Filtri:', filterText);
    
    let displayHTML = '';
    
    if (filterText.length === 0) {
        displayHTML = `Tutti gli incidenti (2015-2023) • ${totalData.toLocaleString('it-IT')} incidenti totali`;
        console.log('ℹ️ Nessun filtro attivo, mostro messaggio default');
    } else {
        displayHTML = `${filteredData.length.toLocaleString('it-IT')} di ${totalData.toLocaleString('it-IT')} incidenti • `;
        displayHTML += filterText.map(f => `<span class="filter-badge">${f}</span>`).join('');
        console.log('✅ HTML costruito con filtri');
    }
    
    console.log('📝 HTML finale:', displayHTML.substring(0, 100) + '...');
    
    activeFiltersText.innerHTML = displayHTML;
    console.log('✅ HTML inserito nell\'elemento');
    console.log('🎯 Contenuto finale elemento:', activeFiltersText.innerHTML.substring(0, 100) + '...');
    console.log('=== Fine updateActiveFiltersDisplay ===\n');
}

function switchAnalyticsTab(tabName) {
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.analytics-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // âœ… AGGIUNGI 'serie-storica' alla lista
    const validTabs = ['serie-storica', 'panoramica', 'temporale', 'oraria', 'insights'];
    if (!validTabs.includes(tabName)) {
        tabName = 'serie-storica'; // Fallback al primo tab valido
    }
    
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`tab-${tabName}`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

function updateAnalytics() {
    const filteredData = getFilteredData();
    
    // ✅ Chiama updateActiveFiltersDisplay() SEMPRE come prima cosa
    updateActiveFiltersDisplay();
    
    updateSerieStoricaChart();
    updatePanoramicaCharts(filteredData);
    updateTemporaleCharts(filteredData);
    updateOrariaCharts(filteredData);
    updateInsights(filteredData);
    
    // IMPORTANTE: Aumenta il timeout
    setTimeout(() => {
        console.log('Chiamata addChartDownloadButtons da updateAnalytics');
        addChartDownloadButtons();
    }, 500);
}

// Add Chart Download Buttons (ICONA AGGIORNATA)
function addChartDownloadButtons() {
    console.log('=== INIZIO addChartDownloadButtons ===');
    
    const chartContainers = document.querySelectorAll('.chart-container');
    console.log('Chart containers trovati:', chartContainers.length);
    
    chartContainers.forEach((container, index) => {
        console.log(`\nContainer ${index + 1}:`);
        
        // Escludi il calendario heatmap
        if (container.id === 'chart-calendario-heatmap' || 
            container.querySelector('#chart-calendario-heatmap')) {
            console.log('- Calendario heatmap, skip download button');
            return;
        }
        
        // Verifica se ha già  il pulsante
        if (container.querySelector('.chart-download-btn')) {
            console.log('- Ha già  il pulsante, skip');
            return;
        }
        
        const canvas = container.querySelector('canvas');
        if (!canvas) {
            console.log('- NESSUN CANVAS trovato');
            return;
        }
        
        const chartId = canvas.id;
        console.log('- Canvas ID:', chartId);
        
        const h3 = container.querySelector('h3');
        const chartTitle = h3 ? h3.textContent : 'grafico';
        console.log('- Titolo:', chartTitle);
        
        // Crea pulsante
        const btn = document.createElement('button');
        btn.className = 'chart-download-btn';
        btn.innerHTML = '<i class="fas fa-download"></i> PNG';
        btn.title = 'Scarica grafico come PNG (800x600)';
        btn.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 100; background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;';
        
        console.log('- Pulsante creato');
        
        // Event listener con debug
        btn.onclick = (e) => {
            console.log('\nðŸ–±ï¸ CLICK sul pulsante download!');
            console.log('Chart ID:', chartId);
            console.log('Titolo:', chartTitle);
            
            e.preventDefault();
            e.stopPropagation();
            
            const filename = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().getTime()}`;
            console.log('Filename:', filename);
            
            // Chiama la funzione
            downloadChartAsPNG(chartId, filename);
        };
        
        container.style.position = 'relative';
        container.appendChild(btn);
        console.log('- Pulsante aggiunto al DOM');
    });
    
    console.log('\n=== FINE addChartDownloadButtons ===\n');
}


// Download Chart as PNG

async function downloadChartAsPNG(chartId, filename) {
    console.log('\nðŸŽ¨ === INIZIO downloadChartAsPNG ===');
    
    if (chartId.includes('calendario-heatmap')) {
        alert('Download disabilitato per il calendario heatmap');
        return;
    }
    
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        alert(`Errore: canvas "${chartId}" non trovato`);
        return;
    }
    
    const chartInstance = Chart.getChart(canvas);
    if (!chartInstance) {
        alert('Errore: istanza Chart non trovata');
        return;
    }
    
    try {
        // ===== CONFIGURAZIONE BASE =====
        const targetWidth = 800;
        const originalRatio = canvas.height / canvas.width;
        const targetHeight = Math.max(Math.round(targetWidth * originalRatio), 600);
        
        const headerHeight = 100;
        const footerHeight = 70;
        const chartAreaHeight = targetHeight - headerHeight - footerHeight;
        
        // ===== Salva colori originali =====
        const originalColors = {
            scales: {},
            legend: null,
            datalabels: null,
            title: null,
            datasets: []
        };
        
        const darkColor = '#313131';
           const fontSizes = {
            axisTicks: 7,
            axisTitle: 7,
            legend: 7,
            datalabels: 6,
            chartTitle: 13
        };
		
        // Modifica colori assi
        if (chartInstance.options.scales) {
            Object.keys(chartInstance.options.scales).forEach(scaleKey => {
                const scale = chartInstance.options.scales[scaleKey];
                originalColors.scales[scaleKey] = {
                    ticksColor: scale.ticks?.color,
                    ticksFont: scale.ticks?.font ? {...scale.ticks.font} : null,
                    titleColor: scale.title?.color,
                    titleFont: scale.title?.font ? {...scale.title.font} : null,
                    gridColor: scale.grid?.color
                };
                
                if (scale.ticks) scale.ticks.color = darkColor;
                if (scale.title) scale.title.color = darkColor;
                if (scale.grid) scale.grid.color = '#e5e7eb';
            });
        }
        
        if (chartInstance.options.plugins?.legend?.labels) {
            originalColors.legend = {
                color: chartInstance.options.plugins.legend.labels.color,
                font: chartInstance.options.plugins.legend.labels.font ? 
                      {...chartInstance.options.plugins.legend.labels.font} : null
            };
            chartInstance.options.plugins.legend.labels.color = darkColor;
        }
        
        if (chartInstance.options.plugins?.title) {
            originalColors.title = {
                color: chartInstance.options.plugins.title.color,
                font: chartInstance.options.plugins.title.font ? 
                      {...chartInstance.options.plugins.title.font} : null
            };
            chartInstance.options.plugins.title.color = darkColor;
        }
        
        if (chartInstance.options.plugins?.datalabels) {
            originalColors.datalabels = {
                color: chartInstance.options.plugins.datalabels.color,
                font: chartInstance.options.plugins.datalabels.font ? 
                      {...chartInstance.options.plugins.datalabels.font} : null
            };
            chartInstance.options.plugins.datalabels.color = darkColor;
        }
        
        if (chartInstance.data.datasets) {
            chartInstance.data.datasets.forEach((dataset, index) => {
                originalColors.datasets[index] = {
                    datalabels: dataset.datalabels ? JSON.parse(JSON.stringify(dataset.datalabels)) : null
                };
                if (dataset.datalabels?.color) {
                    dataset.datalabels.color = darkColor;
                }
            });
        }
        
        chartInstance.update('none');
        
        // ===== Crea canvas finale =====
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        
        // Sfondo bianco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // ===== HEADER =====
        ctx.fillStyle = '#313131';
        ctx.font = 'bold 22px Titillium Web, Arial, sans-serif';
        ctx.textAlign = 'left';
        
        const chartContainer = canvas.closest('.chart-container');
        const chartTitle = chartContainer ? chartContainer.querySelector('h3').textContent : 'Grafico Analytics';
        ctx.fillText(chartTitle, 40, 35);
        
        ctx.font = '13px Titillium Web, Arial, sans-serif';
        
        const activeFilters = document.getElementById('active-filters-text');
        let filtersText = 'Tutti gli incidenti (2015-2023)';
        
        if (activeFilters) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = activeFilters.innerHTML;
            filtersText = tempDiv.textContent || tempDiv.innerText || '';
            filtersText = filtersText.replace(/\(\d+\.?\d*\)/g, '').trim();
        }
        
        const lines = wrapText(ctx, filtersText, targetWidth - 80, 13);
        lines.forEach((line, index) => {
            ctx.fillText(line, 40, 60 + (index * 18));
        });
        
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, headerHeight - 15);
        ctx.lineTo(targetWidth - 40, headerHeight - 15);
        ctx.stroke();
        
        // ===== GRAFICO =====
        const chartCanvas = document.createElement('canvas');
        const chartWidth = targetWidth - 80;
        const chartHeight = chartAreaHeight;
        
        chartCanvas.width = chartWidth;
        chartCanvas.height = chartHeight;
        
        const chartCtx = chartCanvas.getContext('2d');
        chartCtx.fillStyle = '#FFFFFF';
        chartCtx.fillRect(0, 0, chartWidth, chartHeight);
        chartCtx.drawImage(canvas, 0, 0, chartWidth, chartHeight);
        
        ctx.drawImage(chartCanvas, 40, headerHeight);
        
        // ===== FOOTER =====
        ctx.strokeStyle = '#d1d5db';
        ctx.beginPath();
        ctx.moveTo(40, targetHeight - footerHeight + 10);
        ctx.lineTo(targetWidth - 40, targetHeight - footerHeight + 10);
        ctx.stroke();
        
        ctx.font = '11px Titillium Web, Arial, sans-serif';
        ctx.fillStyle = '#313131';
        
        if (chartId.includes('serie-storica')) {
            ctx.fillText('Fonte: Istat - ACI - Rielaborazione: opendatasicilia.it', 40, targetHeight - 40);
        } else {
            ctx.fillText('Fonte: dati.gov.it - Rielaborazione: opendatasicilia.it', 40, targetHeight - 40);
        }
        
        ctx.fillText('https://opendatasicilia.github.io/incidenti_palermo/', 40, targetHeight - 20);
        
        // Logo
        try {
            const logo = new Image();
            logo.crossOrigin = 'anonymous';
            await new Promise((resolve) => {
                logo.onload = resolve;
                logo.onerror = resolve;
                logo.src = 'img/pa_hub_new.png';
            });
            
            if (logo.complete && logo.naturalWidth > 0) {
                const logoWidth = 100;
                const logoHeight = (logoWidth * logo.naturalHeight) / logo.naturalWidth;
                ctx.drawImage(logo, targetWidth - logoWidth - 40, targetHeight - footerHeight + 15, logoWidth, logoHeight);
            }
        } catch (e) {}
        
        // ===== Download =====
        const dataURL = finalCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${safeFilename}_${targetWidth}x${targetHeight}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // ===== Ripristina colori =====
        if (chartInstance.options.scales) {
            Object.keys(originalColors.scales).forEach(scaleKey => {
                const scale = chartInstance.options.scales[scaleKey];
                const saved = originalColors.scales[scaleKey];
                
                if (scale.ticks && saved.ticksColor !== undefined) scale.ticks.color = saved.ticksColor;
                if (scale.title && saved.titleColor !== undefined) scale.title.color = saved.titleColor;
                if (scale.grid && saved.gridColor !== undefined) scale.grid.color = saved.gridColor;
            });
        }
        
        if (originalColors.legend && chartInstance.options.plugins?.legend?.labels) {
            if (originalColors.legend.color !== undefined) {
                chartInstance.options.plugins.legend.labels.color = originalColors.legend.color;
            }
        }
        
        if (originalColors.title && chartInstance.options.plugins?.title) {
            if (originalColors.title.color !== undefined) {
                chartInstance.options.plugins.title.color = originalColors.title.color;
            }
        }
        
        if (originalColors.datalabels && chartInstance.options.plugins?.datalabels) {
            if (originalColors.datalabels.color !== undefined) {
                chartInstance.options.plugins.datalabels.color = originalColors.datalabels.color;
            }
        }
        
        if (originalColors.datasets && chartInstance.data.datasets) {
            chartInstance.data.datasets.forEach((dataset, index) => {
                if (originalColors.datasets[index]?.datalabels) {
                    dataset.datalabels = originalColors.datasets[index].datalabels;
                }
            });
        }
        
        chartInstance.update('none');
        console.log('âœ… Download completato - risoluzione originale');
        
    } catch (error) {
        console.error('Errore download:', error);
        alert('Errore durante il download: ' + error.message);
    }
}

// Funzione helper per wrappare il testo
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Funzione helper per wrappare il testo (invariata)
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}


// Funzione helper per wrappare il testo (invariata)
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Funzione helper per wrappare il testo
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Funzione helper per wrappare il testo (invariata)
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Funzione helper per wrappare il testo (invariata)
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}



// Funzione helper per wrappare il testo
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Data Table Functions
function openDataTable() {
    const filteredData = getFilteredData();
    const modal = document.getElementById('data-table-modal');
    
    if (!modal) return;
    
    const tableCount = document.getElementById('table-count');
    if (tableCount) {
        tableCount.textContent = filteredData.length.toLocaleString('it-IT');
    }
    
    if (filteredData.length === 0) {
        const tableHeader = document.getElementById('table-header');
        const tableBody = document.getElementById('table-body');
        if (tableHeader) tableHeader.innerHTML = '';
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 40px; color: #94a3b8;">Nessun dato da visualizzare</td></tr>';
        }
        modal.classList.add('show');
        return;
    }
    
    const keys = Object.keys(filteredData[0]);
    let headerHtml = '<tr>';
    keys.forEach(key => {
        headerHtml += `<th>${key}</th>`;
    });
    headerHtml += '</tr>';
    
    const tableHeader = document.getElementById('table-header');
    if (tableHeader) tableHeader.innerHTML = headerHtml;
    
    const displayData = filteredData.slice(0, 500);
    let bodyHtml = '';
    displayData.forEach(row => {
        bodyHtml += '<tr>';
        keys.forEach(key => {
            bodyHtml += `<td>${row[key] !== null && row[key] !== undefined ? row[key] : '-'}</td>`;
        });
        bodyHtml += '</tr>';
    });
    
    if (filteredData.length > 500) {
        bodyHtml += `<tr><td colspan="${keys.length}" style="text-align: center; padding: 20px; color: #f59e0b;">Visualizzate le prime 500 righe di ${filteredData.length.toLocaleString('it-IT')}.</td></tr>`;
    }
    
    const tableBody = document.getElementById('table-body');
    if (tableBody) tableBody.innerHTML = bodyHtml;
    
    modal.classList.add('show');
}

function closeDataTable() {
    const modal = document.getElementById('data-table-modal');
    if (modal) modal.classList.remove('show');
}

// ==========================================
// PARTE 5 - incidenti_part5
// ==========================================

// ==========================================
// PARTE 5: FUNZIONI MAPPA E LAYERS
// ==========================================

// Map Initialization
function initMap() {
    const palermoBounds = [
        [13.05, 38.00],
        [13.65, 38.25]
    ];
    
    map = new maplibregl.Map({
        container: 'map',
        style: basemapStyles['carto-light'],
        center: [13.3423, 38.1451],
        zoom: 11.65,
        minZoom: 9,
        maxZoom: 18,
        maxBounds: palermoBounds,
        hash: true
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-left');
    
    class HomeControl {
        onAdd(map) {
            this._map = map;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            this._container.innerHTML = '<button class="maplibregl-ctrl-home" type="button" title="Torna alla vista iniziale"></button>';
            
            this._container.onclick = () => {
                map.flyTo({
                    center: [13.3423, 38.1451],
					zoom: 11.65,
                    duration: 1500,
                    essential: true
                });
            };
            
            return this._container;
        }
        
        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }
    
    map.addControl(new HomeControl(), 'top-left');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    
    class ODSControl {
        onAdd(map) {
            this._map = map;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-ods';
            
            const link = document.createElement('a');
            link.href = 'https://palermohub.opendatasicilia.it/';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.title = 'palermohub.opendatasicilia.it';
            
            const img = document.createElement('img');
            img.src = 'img/pa_hub_new.png';
            img.alt = 'palermohub.opendatasicilia.it';
            
            link.appendChild(img);
            this._container.appendChild(link);
            
            return this._container;
        }
        
        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }
    
    map.addControl(new ODSControl(), 'bottom-left');
    
    map.setPadding({ top: 80, bottom: 80, left: 50, right: 50 });

    map.on('load', () => {
        console.log('Mappa caricata, creazione layers...');
        try {
            currentFilters['filter-anno'] = '2023';
            
            createMapLayers();
            populateFilters();
            updateStats();
            updateYearStats();
            updateLegendChart();
            updatePeriodSwitches();
            updateMonthlyInjuriesChart();
            updateMonthlyAreaChart();
            console.log('Inizializzazione completata!');
        } catch (error) {
            console.error('Errore durante inizializzazione:', error);
        } finally {
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.classList.add('hidden');
            }
        }
    });
    
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading && !loading.classList.contains('hidden')) {
            console.log('Timeout sicurezza: nascondo loading');
            loading.classList.add('hidden');
        }
    }, 5000);
}

// Create GeoJSON
function createGeoJSON() {
    const filteredData = getFilteredData();
    
    return {
        type: 'FeatureCollection',
        features: filteredData.map(row => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
            },
            properties: row
        }))
    };
}

// Create Map Layers
function createMapLayers() {
    const geojson = createGeoJSON();
    
    console.log(`Creazione source con ${geojson.features.length} features`);
    
    map.addSource('incidenti', {
        type: 'geojson',
        data: geojson
    });

    map.addLayer({
        id: 'incidenti-heatmap',
        type: 'heatmap',
        source: 'incidenti',
        maxzoom: 15,
        paint: {
            'heatmap-weight': [
                'match',
                ['get', 'Tipologia'],
                'C', 0.5,
                'F', 1,
                'R', 1.5,
                'M', 2,
                1
            ],
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 0.8,
                9, 1,
                15, 2.5
            ],
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0,0,255,0)',
                0.1, 'rgba(0,0,255,0.6)',
                0.3, 'rgba(0,255,255,0.7)',
                0.5, 'rgba(0,255,0,0.8)',
                0.7, 'rgba(255,255,0,0.85)',
                0.9, 'rgba(255,128,0,0.9)',
                1, 'rgba(255,0,0,1)'
            ],
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                9, 3,
                11, 6,
                13, 10,
                15, 14
            ],
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, 0.65,
                15, 0.75
            ]
        },
        layout: {
            visibility: 'none'
        }
    });

    ['C', 'F', 'R', 'M'].forEach(tipo => {
        const layerId = `incidenti-${tipo}`;
        
        map.addLayer({
            id: layerId,
            type: 'circle',
            source: 'incidenti',
            filter: ['==', ['get', 'Tipologia'], tipo],
            paint: {
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    10, tipo === 'M' ? 4 : tipo === 'R' ? 3 : 2,
                    16, tipo === 'M' ? 10 : tipo === 'R' ? 8 : 6
                ],
                'circle-color': colorMap[tipo],
                'circle-opacity': 0.8,
                'circle-stroke-width': tipo === 'M' ? 2 : 1,
                'circle-stroke-color': 'transparent'
            }
        });

        setupLayerInteractions(layerId);
    });

    console.log('Layers creati con successo');
}

// Create Clustering Layers - VERSIONE CORRETTA SENZA ERRORI
function createClusteringLayers() {
    const geojson = createGeoJSON();
    
    // Rimuovi TUTTI i layer e source nell'ordine corretto
    const layersToRemove = ['cluster-count', 'clusters', 'unclustered-point'];
    layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
    });
    
    if (map.getSource('incidenti-cluster')) {
        map.removeSource('incidenti-cluster');
    }
    
    console.log('Creazione clustering con', geojson.features.length, 'incidenti');
    
    // CREA SOURCE
map.addSource('incidenti-cluster', {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 15,        // zoom pià¹ alto
    clusterRadius: 40,         // raggio ridotto
    clusterMinPoints: 2        // minimo 2 punti per cluster
});

    // LAYER 1: CERCHI CLUSTER
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'incidenti-cluster',
        filter: ['has', 'point_count'],
paint: {
    'circle-color': [
        'step',
        ['get', 'point_count'],
        '#3b82f6',
        10, '#f59e0b',
        25, '#f97316',
        50, '#ef4444'
    ],
    'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],                    // â† basato sullo zoom
        10, ['interpolate', ['linear'], ['get', 'point_count'], 2, 6, 100, 25],
        16, ['interpolate', ['linear'], ['get', 'point_count'], 2, 12, 100, 40]
    ],
    'circle-opacity': 0.85,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff'
}
    });

    // LAYER 2: NUMERI (SUBITO DOPO I CERCHI)
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'incidenti-cluster',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count'],
            'text-font': ['Open Sans Bold', 'Titillium Web Unicode MS Bold'],
            'text-size': [
                'interpolate',
                ['linear'],
                ['get', 'point_count'],
                2, 10,
                10, 10,
                25, 12,
                50, 16,
                100, 15
            ],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': 'center',
            'text-offset': [0, 0],
            'visibility': 'visible'  // AGGIUNGI ESPLICITAMENTE
        },
        paint: {
            'text-color': '#ffffff',
'text-halo-color': 'rgba(0, 0, 0, 0.3)',
    'text-halo-width': 1.5,
    'text-halo-blur': 1
        }
    });

    // LAYER 3: PUNTI SINGOLI
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'incidenti-cluster',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': [
                'match',
                ['get', 'Tipologia'],
                'M', '#ef4444',
                'R', '#a855f7',
                'F', '#f59e0b',
                'C', '#10b981',
                '#94a3b8'
            ],
            'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                10, 5,
                16, 8
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    console.log('âœ“ Tutti i layer cluster creati');

    // Event handlers
    if (!map._clusterHandlersAdded) {
        map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });
            if (!features.length) return;
            
            const clusterId = features[0].properties.cluster_id;
            const pointCount = features[0].properties.point_count;
            
            map.getSource('incidenti-cluster').getClusterExpansionZoom(
                clusterId,
                (err, zoom) => {
                    if (err) return;
                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom + 1,
                        duration: 1000
                    });
                }
            );
        });

        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15
        });

        map.on('mouseenter', 'clusters', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            const coordinates = e.features[0].geometry.coordinates.slice();
            const pointCount = e.features[0].properties.point_count;
            
            popup.setLngLat(coordinates)
                .setHTML(`<div style="padding: 10px; font-weight: 600;">
                    <div style="font-size: 18px; color: #3b82f6; margin-bottom: 4px;">${pointCount} incidenti</div>
                    <small style="color: #64748b;">Clicca per espandere</small>
                </div>`)
                .addTo(map);
        });

        map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });

        map.on('click', 'unclustered-point', (e) => {
            if (!e.features || e.features.length === 0) return;
            const props = e.features[0].properties;
            openDetailPanel(props);
        });

        map.on('mouseenter', 'unclustered-point', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = '';
        });

        map._clusterHandlersAdded = true;
    }
}

// Setup Layer Interactions
function setupLayerInteractions(layerId) {
    map.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const props = e.features[0].properties;
        openDetailPanel(props);
    });

    map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
    });
}

// Change Basemap
function changeBasemap() {
    const basemapSelect = document.getElementById('basemap-select');
    if (!basemapSelect) return;
    
    const selectedStyle = basemapSelect.value;
    
    if (!basemapStyles[selectedStyle]) {
        console.error('Stile mappa non trovato:', selectedStyle);
        return;
    }
    
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();
    
    map.setStyle(basemapStyles[selectedStyle]);
    
    map.once('styledata', () => {
        map.jumpTo({
            center: currentCenter,
            zoom: currentZoom,
            bearing: currentBearing,
            pitch: currentPitch
        });
        
        createMapLayers();
        
        if (showHeatmap) {
            map.setLayoutProperty('incidenti-heatmap', 'visibility', 'visible');
            ['C', 'F', 'R', 'M'].forEach(tipo => {
                map.setLayoutProperty(`incidenti-${tipo}`, 'visibility', 'none');
            });
        }
    });
}

// Zoom to Location
function zoomToLocation(lng, lat) {
    closeTopLuoghiModal();
    
    map.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 2000,
        essential: true
    });
    
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// Zoom To Filtered Area
function zoomToFilteredArea() {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) return;

    const coords = filteredData
        .filter(row => row.longitude && row.latitude)
        .map(row => [parseFloat(row.longitude), parseFloat(row.latitude)]);

    if (coords.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    coords.forEach(coord => bounds.extend(coord));

    if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 80, right: 80 },
            maxZoom: 17,
            duration: 1000
        });
    }
}

// Calculate Top Luoghi
function calculateTopLuoghi() {
    const filteredData = getFilteredData();
    const luoghiMap = {};
    
    filteredData.forEach(row => {
        const indirizzo = row.Indirizzo || 'Non specificato';
        
        if (!luoghiMap[indirizzo]) {
            luoghiMap[indirizzo] = {
                indirizzo: indirizzo,
                total: 0,
                M: 0,
                R: 0,
                F: 0,
                C: 0,
                coordinates: []
            };
        }
        
        luoghiMap[indirizzo].total++;
        const tipo = row.Tipologia;
        if (tipo && luoghiMap[indirizzo].hasOwnProperty(tipo)) {
            luoghiMap[indirizzo][tipo]++;
        }
        
        if (luoghiMap[indirizzo].coordinates.length === 0 && row.longitude && row.latitude) {
            luoghiMap[indirizzo].coordinates = [
                parseFloat(row.longitude),
                parseFloat(row.latitude)
            ];
        }
    });
    
    topLuoghiData = Object.values(luoghiMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 25);
    
    console.log('Top 25 luoghi calcolati:', topLuoghiData.length);
}

// Update Top Luoghi Modal if open
function updateTopLuoghiModalIfOpen() {
    const modal = document.getElementById('top-luoghi-modal');
    if (modal && modal.classList.contains('show')) {
        openTopLuoghiModal();
    }
}

// Update Map Data
function updateMapData() {
    const geojson = createGeoJSON();
    console.log(`Aggiornamento mappa con ${geojson.features.length} features`);
    
    const source = map.getSource('incidenti');
    if (source) {
        source.setData(geojson);
    }
    
    const clusterSource = map.getSource('incidenti-cluster');
    if (clusterSource) {
        clusterSource.setData(geojson);
        console.log('Cluster aggiornati con i nuovi filtri');
    }
    
    // AGGIUNTO: Calcola sempre i Top Luoghi, indipendentemente dal clustering
    calculateTopLuoghi();
}


// ==========================================
// PARTE 6 - incidenti_part6
// ==========================================

// ==========================================
// PARTE 6: FUNZIONI FILTRI E STATISTICHE
// ==========================================

// Get Filtered Data
function getFilteredData() {
    return allIncidenti.filter(row => {
        if (currentFilters['filter-data-selezionata']) {
            if (row.Data !== currentFilters['filter-data-selezionata']) {
                return false;
            }
        }
        
        for (const [filterId, property] of Object.entries(filterConfig)) {
            const value = currentFilters[filterId];
            if (!value) continue;

            const rowValue = row[property];
            
            if (property === 'Anno') {
                if (Number(rowValue) !== Number(value)) return false;
            } else {
                if (String(rowValue) !== String(value)) return false;
            }
        }
        return true;
    });
}

// Populate Filters
function populateFilters() {
    console.log('Popolamento filtri...');

    Object.entries(filterConfig).forEach(([selectId, property]) => {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.addEventListener('change', (e) => {
            handleFilterChange(selectId, e.target.value);
        });
    });

    updateAllFilters();
}

// Handle Filter Change

function handleFilterChange(filterId, value) {
    currentFilters[filterId] = value;
    
    if (filterId === 'filter-anno' || filterId === 'filter-mese' || filterId === 'filter-giorno-settimana') {
        delete currentFilters['filter-data-selezionata'];
        customCalendarState.selectedDay = null;
    }

    if (filterDependencies[filterId]) {
        filterDependencies[filterId].forEach(dependentId => {
            currentFilters[dependentId] = '';
            const dependentEl = document.getElementById(dependentId);
            if (dependentEl) dependentEl.value = '';
        });
    }

    updateAllFilters();
    updateMapData();
    
    if (filterId === 'filter-circoscrizione' || filterId === 'filter-quartiere') {
        zoomToFilteredArea();
    }

    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateActiveFiltersDisplay();
        updateAnalytics();
    }
    
    window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
    

}


// Update All Filters
function updateAllFilters() {
    const filteredData = getFilteredData();

    Object.entries(filterConfig).forEach(([selectId, property]) => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = currentFilters[selectId] || '';
        const values = new Set();
        
        filteredData.forEach(row => {
            const value = row[property];
            if (value !== null && value !== 'null' && value !== '' && value !== undefined) {
                values.add(String(value));
            }
        });

        let sortedValues = Array.from(values).sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return String(a).localeCompare(String(b), 'it');
        });

        if (property === 'Anno') {
            sortedValues.reverse();
        }

        select.innerHTML = '<option value="">Tutti</option>';
        sortedValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            if (value === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.disabled = sortedValues.length === 0 && currentValue === '';
    });
}

// Update Stats

function updateStats() {
    const filteredData = getFilteredData();
    const stats = { M: 0, R: 0, F: 0, C: 0 };
    
    filteredData.forEach(row => {
        const tipo = row.Tipologia;
        if (tipo && stats.hasOwnProperty(tipo)) {
            stats[tipo]++;
        }
    });

    const statMortale = document.getElementById('stat-mortale');
    const statRiserva = document.getElementById('stat-riserva');
    const statFeriti = document.getElementById('stat-feriti');
    const statCose = document.getElementById('stat-cose');
    const statTotal = document.getElementById('stat-total');
    
    if (statMortale) statMortale.textContent = stats.M.toLocaleString('it-IT');
    if (statRiserva) statRiserva.textContent = stats.R.toLocaleString('it-IT');
    if (statFeriti) statFeriti.textContent = stats.F.toLocaleString('it-IT');
    if (statCose) statCose.textContent = stats.C.toLocaleString('it-IT');
    if (statTotal) statTotal.textContent = (stats.M + stats.R + stats.F + stats.C).toLocaleString('it-IT');
    
    // *** NUOVO: Aggiorna stato attivo delle stat-item ***
    const selectedTipo = currentFilters['filter-tipologia'];
    document.querySelectorAll('.stat-item').forEach(item => {
        const tipo = item.dataset.tipo;
        if (selectedTipo === tipo) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    const labelTotale = document.querySelector('.stat-total .stat-label');
    if (labelTotale) {
        let labelText = 'Totale Incidenti';
        
        if (currentFilters['filter-data-selezionata']) {
            labelText = `Totale Incidenti (${currentFilters['filter-data-selezionata']})`;
        }
        else if (currentFilters['filter-mese'] && currentFilters['filter-anno']) {
            labelText = `Totale Incidenti (${currentFilters['filter-mese']} ${currentFilters['filter-anno']})`;
        }
        else if (currentFilters['filter-mese']) {
            labelText = `Totale Incidenti (${currentFilters['filter-mese']})`;
        }
        else if (currentFilters['filter-anno']) {
            labelText = `Totale Incidenti (${currentFilters['filter-anno']})`;
        }
        
        labelTotale.textContent = labelText;
    }

    console.log('Statistiche:', stats, `su ${filteredData.length} incidenti filtrati`);
}


// Update Year Stats
function updateYearStats() {
    const selectedYear = currentFilters['filter-anno'];
    const yearStats = {};
    
    const tempFilters = {...currentFilters};
    delete tempFilters['filter-anno'];
    
    const dataForYearCount = allIncidenti.filter(row => {
        for (const [filterId, property] of Object.entries(filterConfig)) {
            if (filterId === 'filter-anno') continue;
            const value = tempFilters[filterId];
            if (!value) continue;

            const rowValue = row[property];
            
            if (property === 'Anno') {
                if (Number(rowValue) !== Number(value)) return false;
            } else {
                if (String(rowValue) !== String(value)) return false;
            }
        }
        return true;
    });
    
    dataForYearCount.forEach(row => {
        const year = row.Anno;
        if (year) {
            yearStats[year] = (yearStats[year] || 0) + 1;
        }
    });
    
    const incidenti2019NonMappati = 3192;
    if (yearStats['2019']) {
        yearStats['2019'] += incidenti2019NonMappati;
    } else {
        yearStats['2019'] = incidenti2019NonMappati;
    }
    
    const totalAllYears = Object.values(yearStats).reduce((sum, count) => sum + count, 0);
    
    let gridHtml = `
        <div class="year-stat-item-all ${selectedYear === '' ? 'active' : ''}" 
             data-year=""
             title="Clicca per mostrare tutti gli anni">
            <div class="year-stat-year">Tutti gli Anni</div>
            <div class="year-stat-count">${totalAllYears.toLocaleString('it-IT')}</div>
        </div>
    `;
    
    const sortedYears = Object.keys(yearStats).sort((a, b) => b - a);
    gridHtml += sortedYears.map(year => {
        const is2019 = year === '2019';
        const titleText = is2019 
            ? `Anno 2019 - Include ${incidenti2019NonMappati.toLocaleString('it-IT')} incidenti non mappati. Clicca per dettagli` 
            : `Clicca per filtrare l'anno ${year}`;
        
        return `
        <div class="year-stat-item ${selectedYear === String(year) ? 'active' : ''} ${is2019 ? 'year-2019' : ''}" 
             data-year="${year}"
             title="${titleText}">
            <div class="year-stat-year">${year}${is2019 ? ' *' : ''}</div>
            <div class="year-stat-count">${yearStats[year].toLocaleString('it-IT')}</div>
        </div>
    `;
    }).join('');
    
    const yearStatsGrid = document.getElementById('year-stats-grid');
    if (yearStatsGrid) {
        yearStatsGrid.innerHTML = gridHtml;
    }
}

// Filter By Year
function filterByYear(year) {
    const currentYear = currentFilters['filter-anno'];
    
    if (currentYear === String(year)) {
        currentFilters['filter-anno'] = '';
        customCalendarState.selectedYear = null;
    } else {
        currentFilters['filter-anno'] = String(year);
        customCalendarState.selectedYear = parseInt(year);
        customCalendarState.currentYear = parseInt(year);
    }
    
    delete currentFilters['filter-data-selezionata'];
    customCalendarState.selectedDay = null;
    
    const filterAnno = document.getElementById('filter-anno');
    if (filterAnno) {
        filterAnno.value = currentFilters['filter-anno'];
    }
    
    renderCalendarYear();
    renderCalendarMonths();
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    if (showClustering) {
        calculateTopLuoghi();
        updateTopLuoghiModalIfOpen();
    }
    
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
    
    // AGGIUNGI/VERIFICA QUESTA PARTE
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();  // Questa chiamata aggiornerà  anche updateActiveFiltersDisplay()
    }
	
	 window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}


function filterByTipologia(tipo) {
    const currentTipo = currentFilters['filter-tipologia'];
    
    if (currentTipo === tipo) {
        currentFilters['filter-tipologia'] = '';
    } else {
        currentFilters['filter-tipologia'] = tipo;
    }
    
    const filterTipologia = document.getElementById('filter-tipologia');
    if (filterTipologia) {
        filterTipologia.value = currentFilters['filter-tipologia'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    // AGGIUNGI/VERIFICA QUESTA PARTE
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();  // Aggiorna anche il testo dei filtri
    }
	window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}


// Filter By Quartiere
function filterByQuartiere(quartiere) {
    const currentQuartiere = currentFilters['filter-quartiere'];
    
    if (currentQuartiere === quartiere) {
        currentFilters['filter-quartiere'] = '';
    } else {
        currentFilters['filter-quartiere'] = quartiere;
    }
    
    // Aggiorna anche la select
    const filterQuartiere = document.getElementById('filter-quartiere');
    if (filterQuartiere) {
        filterQuartiere.value = currentFilters['filter-quartiere'];
    }
    
    // Aggiorna tutto
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateActiveFiltersDisplay();
        updateAnalytics();
    }
	 window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}

// Filter By Day/Night
function filterByDayNight(periodo) {
    const currentPeriodo = currentFilters['filter-giorno-notte'];
    
    if (currentPeriodo === periodo) {
        currentFilters['filter-giorno-notte'] = '';
    } else {
        currentFilters['filter-giorno-notte'] = periodo;
    }
    
    const filterGiornoNotte = document.getElementById('filter-giorno-notte');
    if (filterGiornoNotte) {
        filterGiornoNotte.value = currentFilters['filter-giorno-notte'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
	window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}

// Filter By Month
function filterByMonth(mese) {
    const currentMese = currentFilters['filter-mese'];
    
    if (currentMese === mese) {
        currentFilters['filter-mese'] = '';
        customCalendarState.selectedMonth = null;
        document.getElementById('cal-days-container').style.display = 'none';
    } else {
        currentFilters['filter-mese'] = mese;
        customCalendarState.selectedMonth = mese;
        const monthIndex = MESI_ITALIANI.indexOf(mese);
        if (monthIndex >= 0) {
            renderCalendarDays(monthIndex);
        }
    }
    
    const filterMese = document.getElementById('filter-mese');
    if (filterMese) {
        filterMese.value = currentFilters['filter-mese'];
    }
    
    renderCalendarMonths();
    updateCalendarSummary();
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
   const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
    
    window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl(); // ✅ AGGIUNGI QUESTA RIGA
}

// Reset Filters
function resetFilters() {
    currentFilters = {};
    document.querySelectorAll('select').forEach(select => {
        select.value = '';
        select.disabled = false;
    });
    
    currentFilters['filter-anno'] = '2023';
    
    const filterAnno = document.getElementById('filter-anno');
    if (filterAnno) filterAnno.value = '2023';
    
    customCalendarState.selectedYear = 2023;
    customCalendarState.currentYear = 2023;
    
    resetCustomCalendar();
	
	    if (map) {
        map.flyTo({
            center: [13.3423, 38.1451],  // Centro Palermo
            zoom: 11.65,                     // Zoom iniziale
            duration: 1500,               // Animazione 1.5 secondi
            essential: true
        });
    }        
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
    
    window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl(); // ✅ AGGIUNGI QUESTA RIGA
}

// Reset Charts Filters
function resetChartsFilters() {
    currentFilters['filter-tipologia'] = '';
    const filterTipologia = document.getElementById('filter-tipologia');
    if (filterTipologia) filterTipologia.value = '';
    
    currentFilters['filter-giorno-notte'] = '';
    const filterGiornoNotte = document.getElementById('filter-giorno-notte');
    if (filterGiornoNotte) filterGiornoNotte.value = '';
    
    currentFilters['filter-mese'] = '';
    const filterMese = document.getElementById('filter-mese');
    if (filterMese) filterMese.value = '';
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
    
    window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl(); // ✅ AGGIUNGI QUESTA RIGA
}
// Update Period Switches (Giorno/Notte)
function updatePeriodSwitches() {
    const filteredData = getFilteredData();
    const stats = { 'Giorno': 0, 'Notte': 0 };
    
    filteredData.forEach(row => {
        const periodo = row['Giorno/Notte'];
        if (periodo && stats.hasOwnProperty(periodo)) {
            stats[periodo]++;
        }
    });
    
    const selectedPeriodo = currentFilters['filter-giorno-notte'];
    
    const countGiornoEl = document.getElementById('count-giorno');
    const countNotteEl = document.getElementById('count-notte');
    
    if (countGiornoEl) {
        countGiornoEl.textContent = stats['Giorno'].toLocaleString('it-IT');
    }
    if (countNotteEl) {
        countNotteEl.textContent = stats['Notte'].toLocaleString('it-IT');
    }
    
    const switchGiorno = document.getElementById('switch-giorno');
    const switchNotte = document.getElementById('switch-notte');
    
    if (switchGiorno) {
        switchGiorno.classList.toggle('active', selectedPeriodo === 'Giorno');
    }
    if (switchNotte) {
        switchNotte.classList.toggle('active', selectedPeriodo === 'Notte');
    }
}

function updateLegendActiveState() {
    const selectedTipo = currentFilters['filter-tipologia'];
    
    document.querySelectorAll('.legend-item').forEach(item => {
        const tipo = item.dataset.tipo;
        if (selectedTipo === tipo) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ==========================================
// PARTE 7 - incidenti_part7
// ==========================================

// ==========================================
// PARTE 7: GRAFICI CHART.JS
// ==========================================

// Update Legend Chart
let legendChart = null;

function updateLegendChart() {
    const filteredData = getFilteredData();
    const stats = { M: 0, R: 0, F: 0, C: 0 };
    
    filteredData.forEach(row => {
        const tipo = row.Tipologia;
        if (tipo && stats.hasOwnProperty(tipo)) {
            stats[tipo]++;
        }
    });
    
    // AGGIUNGI QUESTO BLOCCO QUI â†“
    // Costruisci il titolo con i filtri attivi
    const activeFilters = [];
    
    if (currentFilters['filter-data-selezionata']) {
        activeFilters.push(currentFilters['filter-data-selezionata']);
    } else {
        if (currentFilters['filter-anno']) {
            activeFilters.push(currentFilters['filter-anno']);
        }
        if (currentFilters['filter-mese']) {
            activeFilters.push(currentFilters['filter-mese']);
        }
        if (currentFilters['filter-giorno-settimana']) {
            activeFilters.push(currentFilters['filter-giorno-settimana']);
        }
    }
    
    if (currentFilters['filter-circoscrizione']) {
        activeFilters.push(currentFilters['filter-circoscrizione']);
    }
    if (currentFilters['filter-quartiere']) {
        activeFilters.push(currentFilters['filter-quartiere']);
    }
    if (currentFilters['filter-giorno-notte']) {
        activeFilters.push(currentFilters['filter-giorno-notte']);
    }
    
    // Aggiorna il titolo del grafico
    const chartTitle = document.getElementById('legend-chart-title');
    if (chartTitle) {
        if (activeFilters.length > 0) {
            chartTitle.innerHTML = `Tipologia Incidenti<br><small style="font-size: 11px; font-weight: 600; color: #1f2937cc;">${activeFilters.join('  • ')}</small>`;
        } else {
            chartTitle.textContent = 'Tipologia Incidenti';
        }
    }
    
    const selectedTipo = currentFilters['filter-tipologia'];
    
    const items = [
        { label: 'F - Feriti', value: stats.F, tipo: 'F', color: '#f59e0b' },
        { label: 'C - Cose', value: stats.C, tipo: 'C', color: '#10b981' },
        { label: 'R - Riserva', value: stats.R, tipo: 'R', color: '#a855f7' },
        { label: 'M - Mortale', value: stats.M, tipo: 'M', color: '#ef4444' }
    ];
    
    const labels = items.map(item => item.label);
    const data = items.map(item => item.value);
    const tipos = items.map(item => item.tipo);
    const colors = items.map(item => item.color);
    
    const backgroundColors = tipos.map((tipo, idx) => 
        selectedTipo === tipo ? colors[idx] : colors[idx] + 'CC'
    );
    
    const borderColors = tipos.map((tipo, idx) => 
        selectedTipo === tipo ? colors[idx] : 'transparent'
    );
    
    const borderWidths = tipos.map(tipo => 
        selectedTipo === tipo ? 3 : 0
    );
    
    const canvas = document.getElementById('legend-chart');
    if (!canvas) return;
    
    if (legendChart) {
        legendChart.destroy();
    }
    
    legendChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: borderWidths
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0,
                    right: 10,
                    top: 8,
                    bottom: 8
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 10 },
                    callbacks: {
                        title: function(context) {
                            const tipo = tipos[context[0].dataIndex];
                            const names = { F: 'Feriti', C: 'Cose', R: 'Riserva', M: 'Mortale' };
                            return names[tipo];
                        },
                        label: function(context) {
                            const value = context.parsed.x;
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${value.toLocaleString('it-IT')} incidenti (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            const tipo = tipos[context.dataIndex];
                            if (selectedTipo === tipo) {
                                return 'Clicca per deselezionare';
                            }
                            return 'Clicca per filtrare';
                        }
                    }
                },
                datalabels: {
                    display: true,
                    anchor: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        const maxValue = Math.max(...context.dataset.data);
                        return value > maxValue * 0.2 ? 'end' : 'end';
                    },
                    align: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        const maxValue = Math.max(...context.dataset.data);
                        return value > maxValue * 0.2 ? 'start' : 'end';
                    },
                    color: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        const maxValue = Math.max(...context.dataset.data);
                        return value > maxValue * 0.2 ? '#ffffff' : '#1f2937';
                    },
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : '',
                    offset: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        const maxValue = Math.max(...context.dataset.data);
                        return value > maxValue * 0.2 ? 2: 4;
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#1f2937',
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        padding: 8
                    }
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            onClick: (e, items) => {
                if (items.length > 0) {
                    const tipo = tipos[items[0].index];
                    filterByTipologia(tipo);
                }
            }
        }
    });
}



// Update Monthly Injuries Chart (Grafico Radar)
function updateMonthlyInjuriesChart() {
    const filteredData = getFilteredData();
    
    const monthsDataAll = {};
    const monthsDataFeriti = {};
    const monthsDataMorti = {};
    
    MESI_ITALIANI.forEach(mese => {
        monthsDataAll[mese] = 0;
        monthsDataFeriti[mese] = 0;
        monthsDataMorti[mese] = 0;
    });
    
    filteredData.forEach(row => {
        const mese = row.Mese;
        const tipo = row.Tipologia;
        
        if (mese && monthsDataAll.hasOwnProperty(mese)) {
            monthsDataAll[mese]++;
            
            if (tipo === 'F' || tipo === 'R') {
                monthsDataFeriti[mese]++;
            }
            
            if (tipo === 'M') {
                monthsDataMorti[mese]++;
            }
        }
    });
    
    const countsAll = MESI_ITALIANI.map(m => monthsDataAll[m]);
    const countsFeriti = MESI_ITALIANI.map(m => monthsDataFeriti[m]);
    const countsMorti = MESI_ITALIANI.map(m => monthsDataMorti[m]);
    
    const selectedMese = currentFilters['filter-mese'];
    
    const canvas = document.getElementById('monthly-injuries-chart');
    if (!canvas) return;
    
    if (monthlyInjuriesChart) {
        monthlyInjuriesChart.destroy();
    }
    
    monthlyInjuriesChart = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: MESI_ITALIANI,
            datasets: [
                {
                    label: 'Incidenti',
                    data: countsAll,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    pointBackgroundColor: MESI_ITALIANI.map(m => 
                        selectedMese === m ? '#2563eb' : '#3b82f6'
                    ),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 0.5,
                    pointRadius: MESI_ITALIANI.map(m => 
                        selectedMese === m ? 5 : 3
                    ),
                    pointHoverRadius: 6
                },
                {
                    label: 'Feriti',
                    data: countsFeriti,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    pointBackgroundColor: MESI_ITALIANI.map(m => 
                        selectedMese === m ? '#d97706' : '#f59e0b'
                    ),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 0.5,
                    pointRadius: MESI_ITALIANI.map(m => 
                        selectedMese === m ? 5 : 3
                    ),
                    pointHoverRadius: 6
                },
                {
                    label: 'Morti',
                    data: countsMorti,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    pointBackgroundColor: MESI_ITALIANI.map(m => 
                        selectedMese === m ? '#dc2626' : '#ef4444'
                    ),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 0.5,
                    pointRadius: MESI_ITALIANI.map(m => 
                        selectedMese === m ? 5 : 3
                    ),
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#1f2937',
                        font: { size: 10 },
                        padding: 8,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 10 },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.r;
                            return `${label}: ${value}`;
                        },
                        afterBody: function(context) {
                            const mese = MESI_ITALIANI[context[0].dataIndex];
                            if (selectedMese === mese) {
                                return '\nClicca per deselezionare';
                            }
                        }
                    }
                },
                datalabels: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        color: '#1f2937',
                        backdropColor: 'transparent',
                        font: { size: 8 }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.5)'			
                    },
                    angleLines: {
                        color: 'rgba(148, 163, 184, 0.3)',
                        lineWidth: 1
                    },
                    pointLabels: {
                        color: '#1f2937',
                        font: { 
                            size: 10,
                            weight: '600'
                        }
                    }
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            onClick: (e, items) => {
                if (items.length > 0) {
                    const mese = MESI_ITALIANI[items[0].index];
                    filterByMonth(mese);
                }
            }
        }
    });
}

// Update Monthly Area Chart
function updateMonthlyAreaChart() {
    const filteredData = getFilteredData();
    
    const monthsDataAll = {};
    const monthsDataFeriti = {};
    
    MESI_ITALIANI.forEach(mese => {
        monthsDataAll[mese] = 0;
        monthsDataFeriti[mese] = 0;
    });
    
    filteredData.forEach(row => {
        const mese = row.Mese;
        const tipo = row.Tipologia;
        
        if (mese && monthsDataAll.hasOwnProperty(mese)) {
            monthsDataAll[mese]++;
            
            if (tipo === 'F' || tipo === 'R' || tipo === 'M') {
                monthsDataFeriti[mese]++;
            }
        }
    });
    
    const countsAll = MESI_ITALIANI.map(m => monthsDataAll[m]);
    const countsFeriti = MESI_ITALIANI.map(m => monthsDataFeriti[m]);
    const countsSenzaFeriti = countsAll.map((total, idx) => total - countsFeriti[idx]);
    
    const selectedMese = currentFilters['filter-mese'];
    
    const canvas = document.getElementById('monthly-area-chart');
    if (!canvas) return;
    
    if (monthlyAreaChart) {
        monthlyAreaChart.destroy();
    }
    
    monthlyAreaChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: MESI_ITALIANI,
            datasets: [
                {
                    label: 'Feriti',
                    data: countsFeriti,
                    backgroundColor:'rgba(245, 158, 11, 0.4)',
                    borderColor: '#f59e0b',
                    pointBorderColor: '#fff', 
                    borderWidth: 2,
                    fill: true,
                    pointBackgroundColor: MESI_ITALIANI.map(m => 
                        selectedMese === m ? '#3b82f6' : '#f59e0b'
                    ),
                    pointBorderWidth: 0.5,
                    pointRadius: MESI_ITALIANI.map(m => 
                        selectedMese === m ? 5 : 3
                    ),
                    pointHoverRadius: 6
                },
                {
                    label: 'Sinistri',
                    data: countsSenzaFeriti,
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    borderColor: '#3b82f6',
                    pointBorderColor: '#fff', 
                    borderWidth: 2,
                    fill: true,
                    pointBackgroundColor: MESI_ITALIANI.map(m => 
                        selectedMese === m ? '#f59e0b' : '#3b82f6',
                    ),
                    pointBorderWidth: 0.5,
                    pointRadius: MESI_ITALIANI.map(m => 
                        selectedMese === m ? 5 : 3
                    ),
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                    position: 'bottom',
                    labels: {
                        color: '#1f2937',
                        font: { size: 9 },
                        padding: 6,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 10,
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 10 },
                    yAlign: function(context) {
                        if (context.tooltip.dataPoints[0].datasetIndex === 1) {
                            return 'bottom';
                        }
                        return 'top';
                    },
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            const mese = MESI_ITALIANI[context.dataIndex];
                            const totale = monthsDataAll[mese];
                            
                            if (datasetLabel === 'Feriti') {
                                return `Feriti: ${value}`;
                            } else {
                                return `Sinistri senza feriti: ${value}`;
                            }
                        },
                        afterLabel: function(context) {
                            const mese = MESI_ITALIANI[context.dataIndex];
                            const totale = monthsDataAll[mese];
                            return `Totale mese: ${totale}`;
                        },
                        footer: function(context) {
                            const mese = MESI_ITALIANI[context[0].dataIndex];
                            if (selectedMese === mese) {
                                return '\nClicca per deselezionare';
                            } else {
                                return '\nClicca per filtrare';
                            }
                        }
                    }
                },
                datalabels: {
                    display: false,
                    align: 'top',
                    anchor: 'end',
                    color: '#1e293b',
                    font: {
                        weight: 'bold',
                        size: 9
                    },
                    backgroundColor: 'rgba(241, 245, 249, 0.95)',
                    borderRadius: 3,
                    padding: 2,
                    formatter: function(value, context) {
                        if (context.datasetIndex === 1) {
                            const mese = MESI_ITALIANI[context.dataIndex];
                            return monthsDataAll[mese];
                        }
                        return null;
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: '#1f2937',
                        font: { size: 9 }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        color: '#1f2937',
                        font: { size: 9 }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            onClick: (e, items) => {
                if (items.length > 0) {
                    const mese = MESI_ITALIANI[items[0].index];
                    filterByMonth(mese);
                }
            }
        }
    });
}

// ==========================================
// PARTE 8 - incidenti_part8
// ==========================================

// ==========================================
// PARTE 8: CALENDARIO CUSTOM E ANALYTICS CHARTS
// ==========================================

// Inizializza Calendario Custom
function initCustomCalendar() {
    const year = currentFilters['filter-anno'] || '2023';
    customCalendarState.currentYear = parseInt(year);
    
    renderCalendarYear();
    renderCalendarMonths();
    renderCalendarWeekdays();
    updateCalendarSummary();
    
    const prevYearBtn = document.getElementById('cal-prev-year');
    const nextYearBtn = document.getElementById('cal-next-year');
    const yearDisplay = document.getElementById('cal-year-display');
    const resetBtn = document.getElementById('btn-calendar-reset');
    
    if (prevYearBtn) {
        prevYearBtn.addEventListener('click', () => {
            if (customCalendarState.currentYear > 2015) {
                customCalendarState.currentYear--;
                selectCalendarYear(customCalendarState.currentYear);
            }
        });
    }
    
    if (nextYearBtn) {
        nextYearBtn.addEventListener('click', () => {
            if (customCalendarState.currentYear < 2023) {
                customCalendarState.currentYear++;
                selectCalendarYear(customCalendarState.currentYear);
            }
        });
    }
    
    if (yearDisplay) {
        yearDisplay.addEventListener('click', () => {
            if (customCalendarState.selectedYear === customCalendarState.currentYear) {
                resetCustomCalendar();
            } else {
                selectCalendarYear(customCalendarState.currentYear);
            }
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetCustomCalendar);
    }
}

// Render Anno
function renderCalendarYear() {
    const yearDisplay = document.getElementById('cal-year-display');
    if (yearDisplay) {
        yearDisplay.textContent = customCalendarState.currentYear;
        yearDisplay.classList.toggle('active', customCalendarState.selectedYear === customCalendarState.currentYear);
    }
}

// Render Mesi
function renderCalendarMonths() {
    const grid = document.getElementById('cal-months-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    MESI_ITALIANI.forEach((mese, index) => {
        const btn = document.createElement('button');
        btn.className = 'calendar-month-btn';
        btn.textContent = mese;
        btn.dataset.month = mese;
        btn.dataset.monthIndex = index;
        
        const hasData = checkMonthHasData(customCalendarState.currentYear, index + 1);
        if (hasData) {
            btn.classList.add('has-data');
        }
        
        if (customCalendarState.selectedMonth === mese && 
            customCalendarState.selectedYear === customCalendarState.currentYear) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => selectCalendarMonth(mese, index));
        grid.appendChild(btn);
    });
}

// Render Giorni Settimana
function renderCalendarWeekdays() {
    const grid = document.getElementById('cal-weekdays-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    GIORNI_SETTIMANA_SHORT.forEach((giorno, index) => {
        const btn = document.createElement('button');
        btn.className = 'calendar-weekday-btn';
        btn.textContent = giorno;
        btn.dataset.weekday = GIORNI_SETTIMANA[index];
        
        if (customCalendarState.selectedWeekday === GIORNI_SETTIMANA[index]) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => selectCalendarWeekday(GIORNI_SETTIMANA[index]));
        grid.appendChild(btn);
    });
}

// Render Giorni del Mese
function renderCalendarDays(monthIndex) {
    const container = document.getElementById('cal-days-container');
    const header = document.getElementById('cal-month-header');
    const grid = document.getElementById('cal-days-grid');
    
    if (!container || !header || !grid) return;
    
    container.style.display = 'block';
    header.textContent = `${MESI_ITALIANI[monthIndex]} ${customCalendarState.currentYear}`;
    grid.innerHTML = '';
    
    const year = customCalendarState.currentYear;
    const month = monthIndex;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    for (let i = 0; i < startDay; i++) {
        const emptyBtn = document.createElement('div');
        emptyBtn.className = 'calendar-day-btn empty';
        grid.appendChild(emptyBtn);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const btn = document.createElement('button');
        btn.className = 'calendar-day-btn';
        btn.textContent = day;
        btn.dataset.day = day;
        
        const dateStr = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
        const incidents = checkDayHasIncidents(dateStr);
        
        if (incidents > 0) {
            btn.classList.add('has-incidents');
            if (incidents >= 5) {
                btn.classList.add('high-incidents');
            }
            btn.title = `${incidents} incident${incidents > 1 ? 'i' : 'e'}`;
        }
        
        if (customCalendarState.selectedDay === day &&
            customCalendarState.selectedMonth === MESI_ITALIANI[monthIndex] &&
            customCalendarState.selectedYear === year) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => selectCalendarDay(day, monthIndex));
        grid.appendChild(btn);
    }
}

// Seleziona Anno
function selectCalendarYear(year) {
    customCalendarState.selectedYear = year;
    customCalendarState.currentYear = year;
    currentFilters['filter-anno'] = String(year);
    
    customCalendarState.selectedMonth = null;
    customCalendarState.selectedDay = null;
    delete currentFilters['filter-mese'];
    delete currentFilters['filter-data-selezionata'];
    
    const daysContainer = document.getElementById('cal-days-container');
    if (daysContainer) {
        daysContainer.style.display = 'none';
    }
    
    renderCalendarYear();
    renderCalendarMonths();
    updateCalendarFromState();
}

// Seleziona Mese
function selectCalendarMonth(mese, monthIndex) {
    if (customCalendarState.selectedMonth === mese && 
        customCalendarState.selectedYear === customCalendarState.currentYear) {
        customCalendarState.selectedMonth = null;
        delete currentFilters['filter-mese'];
        document.getElementById('cal-days-container').style.display = 'none';
    } else {
        customCalendarState.selectedYear = customCalendarState.currentYear;
        customCalendarState.selectedMonth = mese;
        currentFilters['filter-anno'] = String(customCalendarState.currentYear);
        currentFilters['filter-mese'] = mese;
        renderCalendarDays(monthIndex);
    }
    
    customCalendarState.selectedDay = null;
    delete currentFilters['filter-data-selezionata'];
    
    renderCalendarYear();
    renderCalendarMonths();
    updateCalendarFromState();
}

// Seleziona Giorno Settimana
function selectCalendarWeekday(weekday) {
    if (customCalendarState.selectedWeekday === weekday) {
        customCalendarState.selectedWeekday = null;
        delete currentFilters['filter-giorno-settimana'];
    } else {
        customCalendarState.selectedWeekday = weekday;
        currentFilters['filter-giorno-settimana'] = weekday;
    }
    
    renderCalendarWeekdays();
    updateCalendarFromState();
}

// Seleziona Giorno Specifico
function selectCalendarDay(day, monthIndex) {
    const year = customCalendarState.currentYear;
    const month = monthIndex + 1;
    const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    
    if (customCalendarState.selectedDay === day) {
        customCalendarState.selectedDay = null;
        delete currentFilters['filter-data-selezionata'];
    } else {
        customCalendarState.selectedDay = day;
        customCalendarState.selectedYear = year;
        customCalendarState.selectedMonth = MESI_ITALIANI[monthIndex];
        
        currentFilters['filter-anno'] = String(year);
        currentFilters['filter-mese'] = MESI_ITALIANI[monthIndex];
        currentFilters['filter-data-selezionata'] = dateStr;
    }
    
    renderCalendarDays(monthIndex);
    updateCalendarFromState();
}

// Reset Calendario
function resetCustomCalendar() {
    customCalendarState.selectedYear = 2023;
    customCalendarState.currentYear = 2023;
    customCalendarState.selectedMonth = null;
    customCalendarState.selectedWeekday = null;
    customCalendarState.selectedDay = null;
    
    delete currentFilters['filter-mese'];
    delete currentFilters['filter-giorno-settimana'];
    delete currentFilters['filter-data-selezionata'];
    
    document.getElementById('cal-days-container').style.display = 'none';
    
    renderCalendarYear();
    renderCalendarMonths();
    renderCalendarWeekdays();
    updateCalendarFromState();
}

// Aggiorna Filtri e UI
function updateCalendarFromState() {
    const selectAnno = document.getElementById('filter-anno');
    const selectMese = document.getElementById('filter-mese');
    const selectGiornoSettimana = document.getElementById('filter-giorno-settimana');
    
    if (selectAnno) selectAnno.value = currentFilters['filter-anno'] || '';
    if (selectMese) selectMese.value = currentFilters['filter-mese'] || '';
    if (selectGiornoSettimana) selectGiornoSettimana.value = currentFilters['filter-giorno-settimana'] || '';
    
    updateCalendarSummary();
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    if (showClustering) {
        calculateTopLuoghi();
        updateTopLuoghiModalIfOpen();
    }
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateActiveFiltersDisplay();
        updateAnalytics();
    }
}

// Update Summary
function updateCalendarSummary() {
    const summary = document.getElementById('cal-selection-summary');
    if (!summary) return;
    
    const parts = [];
    
    if (customCalendarState.selectedDay) {
        parts.push(`<strong>Giorno:</strong> ${customCalendarState.selectedDay} ${customCalendarState.selectedMonth} ${customCalendarState.selectedYear}`);
    } else {
        if (customCalendarState.selectedYear) {
            parts.push(`<strong>Anno:</strong> ${customCalendarState.selectedYear}`);
        }
        if (customCalendarState.selectedMonth) {
            parts.push(`<strong>Mese:</strong> ${customCalendarState.selectedMonth}`);
        }
    }
    
    if (customCalendarState.selectedWeekday) {
        parts.push(`<strong>Giorno settimana:</strong> ${customCalendarState.selectedWeekday}`);
    }
    
    summary.innerHTML = parts.length > 0 ? parts.join('  • ') : 'Nessun filtro temporale attivo';
}

// Verifica dati mese
function checkMonthHasData(year, month) {
    return allIncidenti.some(row => {
        return row.Anno === year && row.Mese === MESI_ITALIANI[month - 1];
    });
}

// Verifica incidenti giorno
function checkDayHasIncidents(dateStr) {
    return allIncidenti.filter(row => row.Data === dateStr).length;
}


// Serie storica
function updateSerieStoricaChart() {
    if (serieStoricaData.length === 0) {
        console.warn('Nessun dato Serie Storica disponibile');
        return;
    }
    
    // Filtra e pulisci i dati
    const datiPuliti = serieStoricaData.filter(row => {
        return row.anno && 
               row.n_incidenti > 0;
    });
    
    console.log('Dati Serie Storica - Righe valide:', datiPuliti.length);
    
    const anni = datiPuliti.map(row => row.anno);
    const incidenti = datiPuliti.map(row => row.n_incidenti || 0);
    const feriti = datiPuliti.map(row => row.n_feriti || 0);
    const incidentiMortali = datiPuliti.map(row => row.n_inc_mort || 0);
    const morti = datiPuliti.map(row => row.n_morti || 0);
    
    // ========================================
    // PRIMO GRAFICO: INCIDENTI E FERITI
    // ========================================
    const canvasIncidenti = document.getElementById('chart-serie-storica-incidenti');
    if (canvasIncidenti) {
        if (serieStoricaChartIncidenti) {
            serieStoricaChartIncidenti.destroy();
        }
        
        serieStoricaChartIncidenti = new Chart(canvasIncidenti, {
            type: 'line',
            data: {
                labels: anni,
                datasets: [
                    {
                        label: 'Incidenti con feriti',
                        data: incidenti,
                        backgroundColor: 'rgba(59, 130, 246, 0.85)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        borderWidth: 2,
                        fill: true,
                        pointBorderWidth: 1,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        tension: 0.4
                    },
                    {
                        label: 'Feriti',
                        data: feriti,
                        backgroundColor: 'rgba(245, 158, 11, 0.75)',
                        borderColor: '#f59e0b',
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#fff',
                        borderWidth: 2,
                        fill: true,
                        pointBorderWidth: 1,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#1f2937',
                            font: { size: 12 },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 14,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        bodySpacing: 6,
                        callbacks: {
                            title: function(context) {
                                return `Anno ${context[0].label}`;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString('it-IT')}`;
                            }
                        }
                    },
                   datalabels: {
    display: true,
    align: 'top',
    anchor: 'end',
    offset: 4,
    color: function(context) {
        return context.dataset.borderColor;
    },
    font: {
        weight: 'bold',
        size: 9
    },
    //backgroundColor: 'rgba(15, 23, 42, 0.8)',
	color: '#1f2937',	
    borderRadius: 3,
    padding: 2,
    formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : ''
}
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#1f2937',
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#1f2937',
                            font: { size: 11 },
                            callback: function(value) {
                                return value.toLocaleString('it-IT');
                            }
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
        
        console.log('âœ“ Grafico Incidenti/Feriti creato');
    }
    
    // ========================================
    // SECONDO GRAFICO: INCIDENTI MORTALI E MORTI
    // ========================================
    const canvasMorti = document.getElementById('chart-serie-storica-morti');
    if (canvasMorti) {
        if (serieStoricaChartMorti) {
            serieStoricaChartMorti.destroy();
        }
        
        serieStoricaChartMorti = new Chart(canvasMorti, {
            type: 'line',
            data: {
                labels: anni,
                datasets: [
                    {
                        label: 'Incidenti con deceduti',
                        data: incidentiMortali,
                        backgroundColor: 'rgba(168, 85, 247, 0.85)',
                        borderColor: '#a855f7',
                        pointBackgroundColor: '#a855f7',
                        pointBorderColor: '#fff',
                        borderWidth: 2,
                        fill: true,
                        pointBorderWidth: 1,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        tension: 0.4
                    },
                    {
                        label: 'Deceduti',
                        data: morti,
                        backgroundColor: 'rgba(239, 68, 68, 0.75)',
                        borderColor: '#ef4444',
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#fff',
                        borderWidth: 2,
                        fill: true,
                        pointBorderWidth: 1,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
plugins: {
    legend: {
        display: true,
        position: 'bottom',
        labels: {
            color: '#1f2937',
            font: { size: 12 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
        }
    },
    tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 14,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        bodySpacing: 6,
        callbacks: {
            title: function(context) {
                return `Anno ${context[0].label}`;
            },
            label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value.toLocaleString('it-IT')}`;
            }
        }
    },
    datalabels: {
        display: function(context) {
            // Mostra etichette solo per il dataset "Morti" (indice 1)
            return context.datasetIndex === 1;
        },
        align: 'top',
        anchor: 'end',
        offset: 4,
        color: '#1f2937',
        font: {
            weight: 'bold',
            size: 10
        },
        //backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 3,
        padding: 2,
        formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : ''
    }
},

                scales: {
                    x: {
                        ticks: {
                            color: '#1f2937',
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#1f2937',
                            font: { size: 11 },
                            callback: function(value) {
                                return value.toLocaleString('it-IT');
                            }
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
        
        console.log('âœ“ Grafico Incidenti Mortali/Morti creato');
    }
}
// Panoramica Charts

// Panoramica Charts - VERSIONE AGGIORNATA CON QUARTIERI E TOP STRADE
function updatePanoramicaCharts(data) {
 // ========================================
// GRAFICO 1: SINISTRI PER QUARTIERE (HEATMAP CONTINUA)
// ========================================
const quartiereData = {};
data.forEach(row => {
    const quartiere = row.Quartiere;
    if (quartiere && quartiere !== 'null') {
        quartiereData[quartiere] = (quartiereData[quartiere] || 0) + 1;
    }
});

const sortedQuartieri = Object.entries(quartiereData)
    .sort((a, b) => b[1] - a[1]);

const quartieriLabels = sortedQuartieri.map(q => q[0]);
const quartieriCounts = sortedQuartieri.map(q => q[1]);

function interpolateColor(color1, color2, factor) {
    const c1 = {
        r: parseInt(color1.slice(1, 3), 16),
        g: parseInt(color1.slice(3, 5), 16),
        b: parseInt(color1.slice(5, 7), 16)
    };
    const c2 = {
        r: parseInt(color2.slice(1, 3), 16),
        g: parseInt(color2.slice(3, 5), 16),
        b: parseInt(color2.slice(5, 7), 16)
    };
    
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    
    return `rgb(${r}, ${g}, ${b})`;
}

const maxCount = Math.max(...quartieriCounts);
const minCount = Math.min(...quartieriCounts);

const colorStart = '#fef3c7';
const colorEnd = '#991b1b';

const quartieriColors = quartieriCounts.map(count => {
    const intensity = (count - minCount) / (maxCount - minCount);
    return interpolateColor(colorStart, colorEnd, intensity);
});

const selectedQuartiere = currentFilters['filter-quartiere'];

const quartiereCanvas = document.getElementById('chart-quartieri-heatmap');
if (quartiereCanvas) {
    if (analyticsCharts.quartieriHeatmap) analyticsCharts.quartieriHeatmap.destroy();
    analyticsCharts.quartieriHeatmap = new Chart(quartiereCanvas, {
        type: 'bar',
        data: {
            labels: quartieriLabels,
            datasets: [{
                label: 'Incidenti',
                data: quartieriCounts,
                backgroundColor: quartieriColors,
                borderColor: quartieriLabels.map(q => 
                    selectedQuartiere === q ? '#ffffff' : 'transparent'
                ),
                borderWidth: quartieriLabels.map(q => 
                    selectedQuartiere === q ? 3 : 0
                ),
                categoryPercentage: 1.0,  // AGGIUNGI - rimuove spazio tra categorie
                barPercentage: 1.0        // AGGIUNGI - rimuove spazio interno barre
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 40,
                    left: 0,
                    top: 0,
                    bottom: 0
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    titleFont: { size: 12, weight: 'bold' },
                    bodyFont: { size: 11 },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.x;
                            const total = quartieriCounts.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `Incidenti: ${value} (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            const quartiere = quartieriLabels[context.dataIndex];
                            if (selectedQuartiere === quartiere) {
                                return '\nClicca per deselezionare';
                            }
                            return '\nClicca per filtrare';
                        }
                    }
                },
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    offset: 8,
                    color: '#1f2937',
                    font: { 
                        weight: 'bold', 
                        size: 11 
                    },
                    formatter: (value) => value
                }
            },
            scales: {
                x: {
                    display: false,
                    beginAtZero: true,
                    max: maxCount * 1.15
                },
                y: {
                    ticks: { 
                        color: '#1f2937',
                        font: { 
                            size: 11, 
                            weight: '500' 
                        },
                        padding: 8
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            },
            onClick: (e, items) => {
                if (items.length > 0) {
                    const quartiere = quartieriLabels[items[0].index];
                    filterByQuartiere(quartiere);
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });
}
    
// ========================================
// GRAFICO 2: TOP 25 STRADE
// ========================================
const stradeData = {};
data.forEach(row => {
    const indirizzo = row.Indirizzo;
    if (indirizzo && indirizzo !== 'null' && indirizzo !== 'Non specificato') {
        stradeData[indirizzo] = (stradeData[indirizzo] || 0) + 1;
    }
});

const sortedStrade = Object.entries(stradeData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

const stradeLabels = sortedStrade.map(s => {
    const nome = s[0];
    return nome.length > 35 ? nome.substring(0, 32) + '...' : nome;
});
const stradeCounts = sortedStrade.map(s => s[1]);

const stradeCanvas = document.getElementById('chart-top-strade');
if (stradeCanvas) {
    if (analyticsCharts.topStrade) analyticsCharts.topStrade.destroy();
    analyticsCharts.topStrade = new Chart(stradeCanvas, {
        type: 'bar',
        data: {
            labels: stradeLabels,
            datasets: [{
                label: 'Incidenti',
                data: stradeCounts,
                backgroundColor: stradeCounts.map((count, idx) => {
                    if (idx === 0) return '#ef4444';
                    if (idx === 1) return '#f59e0b';
                    if (idx === 2) return '#fbbf24';
                    return '#3b82f6';
                }),
                borderColor: 'transparent',
                borderWidth: 0,
                categoryPercentage: 1.0,  // AGGIUNGI
                barPercentage: 1.0        // AGGIUNGI
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 40,
                    left: 0,
                    top: 0,
                    bottom: 0
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 10 },
                    callbacks: {
                        title: function(context) {
                            return sortedStrade[context[0].dataIndex][0];
                        },
                        label: function(context) {
                            const value = context.parsed.x;
                            const rank = context.dataIndex + 1;
                            return `#${rank} - ${value} incidenti`;
                        },
                        afterLabel: function() {
                            return 'Clicca per visualizzare sulla mappa';
                        }
                    }
                },
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    offset: 8,
                    color: '#1f2937',
                    font: { 
                        weight: 'bold', 
                        size: 11 
                    },
                    formatter: (value) => value
                }
            },
            scales: {
                x: {
                    display: false,
                    beginAtZero: true
                },
                y: {
                    ticks: { 
                        color: '#1f2937',
                        font: { 
                            size: 10, 
                            weight: '500' 
                        },
                        padding: 8
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            },
            onClick: (e, items) => {
                if (items.length > 0) {
                    const indirizzo = sortedStrade[items[0].index][0];
                    const incidente = data.find(row => row.Indirizzo === indirizzo);
                    if (incidente && incidente.longitude && incidente.latitude) {
                        zoomToLocation(
                            parseFloat(incidente.longitude),
                            parseFloat(incidente.latitude)
                        );
                        closeAnalytics();
                    }
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });
}  
}

// ==========================================
// PARTE 9 - incidenti_part9
// ==========================================

// ==========================================
// PARTE 9: ANALYTICS CHARTS COMPLETI E EVENT LISTENERS
// ==========================================

// Continuazione Panoramica Charts (da Parte 8)
function updatePanoramicaCharts_continued(data) {
    // Tipologia Chart
    const tipoData = { M: 0, R: 0, F: 0, C: 0 };
    data.forEach(row => {
        if (row.Tipologia && tipoData.hasOwnProperty(row.Tipologia)) {
            tipoData[row.Tipologia]++;
        }
    });
    
    const tipologiaCanvas = document.getElementById('chart-tipologia');
    if (tipologiaCanvas) {
        if (analyticsCharts.tipologia) analyticsCharts.tipologia.destroy();
        analyticsCharts.tipologia = new Chart(tipologiaCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Mortale', 'Riserva', 'Feriti', 'Cose'],
                datasets: [{
                    data: [tipoData.M, tipoData.R, tipoData.F, tipoData.C],
                    backgroundColor: ['#ef4444', '#a855f7', '#f59e0b', '#10b981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        labels: {
                            color: '#1f2937',
                            font: { size: 10 }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#1e293b',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value, ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return value > 0 ? `${value}\n(${percentage}%)` : '';
                        },
                        backgroundColor: 'rgba(241, 245, 249, 0.95)',
                        borderRadius: 3,
                        padding: 4
                    }
                },
                onClick: (e, items) => {
                    if (items.length > 0) {
                        const tipos = ['M', 'R', 'F', 'C'];
                        const tipo = tipos[items[0].index];
                        filterByTipologia(tipo);
                    }
                }
            }
        });
    }
    
    // Stagionale Chart
    const stagioneData = {};
    data.forEach(row => {
        const stagione = row.Stagione;
        if (stagione) {
            stagioneData[stagione] = (stagioneData[stagione] || 0) + 1;
        }
    });
    
    const stagioni = ['Primavera', 'Estate', 'Autunno', 'Inverno'];
    const stagioniCounts = stagioni.map(s => stagioneData[s] || 0);
    
    const stagionaleCanvas = document.getElementById('chart-stagionale');
    if (stagionaleCanvas) {
        if (analyticsCharts.stagionale) analyticsCharts.stagionale.destroy();
        analyticsCharts.stagionale = new Chart(stagionaleCanvas, {
            type: 'bar',
            data: {
                labels: stagioni,
                datasets: [{
                    label: 'Incidenti',
                    data: stagioniCounts,
                    backgroundColor: ['#10b981', '#f59e0b', '#a855f7', '#3b82f6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 2,
                        color: '#1e293b',
                        font: { weight: 'bold', size: 10 },
                        backgroundColor: 'rgba(241, 245, 249, 0.95)',
                        borderRadius: 3,
                        padding: 3
                    }
                },
                scales: {
                    x: { 
                        ticks: { 
                            color: '#94a3b8',
                            font: { size: 10 }
                        }
                    },
                    y: { 
                        ticks: { 
                            color: '#94a3b8',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }
    
    // Feriale Weekend Chart
    const ferialeData = {};
    data.forEach(row => {
        const tipo = row['Feriale/Weekend'];
        if (tipo) {
            ferialeData[tipo] = (ferialeData[tipo] || 0) + 1;
        }
    });
    
    const ferialeCanvas = document.getElementById('chart-feriale-weekend');
    if (ferialeCanvas) {
        if (analyticsCharts.ferialeWeekend) analyticsCharts.ferialeWeekend.destroy();
        analyticsCharts.ferialeWeekend = new Chart(ferialeCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(ferialeData),
                datasets: [{
                    label: 'Incidenti',
                    data: Object.values(ferialeData),
                    backgroundColor: ['#0079c6','#ed7c89']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 2,
                        color: '#1e293b',
                        font: { weight: 'bold', size: 10 },
                        backgroundColor: 'rgba(241, 245, 249, 0.95)',
                        borderRadius: 3,
                        padding: 3
                    }
                },
                scales: {
                    x: { 
                        ticks: { 
                            color: '#94a3b8',
                            font: { size: 10 }
                        }
                    },
                    y: { 
                        ticks: { 
                            color: '#94a3b8',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }
}

// Update Temporale Charts - VERSIONE CON FASCE 6
function updateTemporaleCharts(data) {
    
    // ========================================
    // GRAFICI 1-4: STAGIONI CON FASCE ORARIE
    // ========================================
    
    // Configurazione stagioni
    const stagioniConfig = [
        { 
            nome: 'Primavera', 
            canvasId: 'chart-primavera-oraria',
            colorChiaro: '#a7f3d0',
            colorScuro: '#10b981'
        },
        { 
            nome: 'Estate', 
            canvasId: 'chart-estate-oraria',
            colorChiaro: '#fef08a',
            colorScuro: '#fbbf24'
        },
        { 
            nome: 'Autunno', 
            canvasId: 'chart-autunno-oraria',
            colorChiaro: '#fdba74',
            colorScuro: '#fb923c'
        },
        { 
            nome: 'Inverno', 
            canvasId: 'chart-inverno-oraria',
            colorChiaro: '#93c5fd',
            colorScuro: '#3b82f6'
        }
    ];
    
    // Fasce orarie dal dataset (ordine cronologico)
    const fasceOrarie = ['Notte', 'Alba', 'Mattina', 'Pranzo', 'Pomeriggio', 'Sera'];
    
    // Crea un grafico per ogni stagione
    stagioniConfig.forEach(stagione => {
        const datiStagione = data.filter(row => row.Stagione === stagione.nome);
        
        // Raggruppa per fascia oraria e tipo giorno
        const datiOrari = {};
        fasceOrarie.forEach(fascia => {
            datiOrari[fascia] = { feriale: 0, weekend: 0 };
        });
        
        datiStagione.forEach(row => {
            const fascia = row['Fascia oraria dettagliata (6 fasce)'];
            const tipoGiorno = row['Feriale/Weekend'];
            
            if (fascia && datiOrari[fascia]) {
                if (tipoGiorno === 'Feriale') {
                    datiOrari[fascia].feriale++;
                } else if (tipoGiorno === 'Weekend') {
                    datiOrari[fascia].weekend++;
                }
            }
        });
        
        const datiFeriali = fasceOrarie.map(f => datiOrari[f].feriale);
        const datiWeekend = fasceOrarie.map(f => datiOrari[f].weekend);
        
        const canvas = document.getElementById(stagione.canvasId);
        if (canvas) {
            const chartKey = stagione.canvasId.replace('chart-', '').replace(/-/g, '_');
            if (analyticsCharts[chartKey]) analyticsCharts[chartKey].destroy();
analyticsCharts[chartKey] = new Chart(canvas, {
    type: 'bar',
    data: {
        labels: fasceOrarie,
        datasets: [
            {
                label: 'Feriale',
                data: datiFeriali,
                backgroundColor: stagione.colorChiaro,
                borderColor: 'transparent',
                borderWidth: 0,
                barPercentage: 0.9,
                categoryPercentage: 0.8
            },
            {
                label: 'Weekend',
                data: datiWeekend,
                backgroundColor: stagione.colorScuro,
                borderColor: 'transparent',
                borderWidth: 0,
                barPercentage: 0.9,
                categoryPercentage: 0.8
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,  // â† CAMBIATO DA false
                position: 'bottom',
                labels: {
                    color: '#1f2937',
                    font: { size: 11 },
                    padding: 10,
                    usePointStyle: true,
                    pointStyle: 'rect'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 12,
                titleFont: { size: 11, weight: 'bold' },
                bodyFont: { size: 10 },
                callbacks: {
                    title: function(context) {
                        return `${stagione.nome} - ${context[0].label}`;
                    },
                    label: function(context) {
                        const label = context.dataset.label;
                        const value = context.parsed.y;
                        return `${label}: ${value.toLocaleString('it-IT')}`;
                    },
                    footer: function(context) {
                        const fascia = fasceOrarie[context[0].dataIndex];
                        const totale = datiOrari[fascia].feriale + datiOrari[fascia].weekend;
                        return `\nTotale: ${totale.toLocaleString('it-IT')}`;
                    }
                }
            },
            datalabels: {
                display: true,
                anchor: 'end',
                align: 'top',
                offset: 2,
                color: '#1f2937',
                font: { weight: 'bold', size: 9 },
                formatter: (value) => value > 0 ? value : ''
            }
        },
        scales: {
            x: {
                ticks: { 
                    color: '#1f2937',
                    font: { size: 9 }
                },
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                ticks: { 
                    color: '#1f2937',
                    font: { size: 9 }
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        },
        onClick: (e, items) => {
            filterByStagione(stagione.nome);
        },
        onHover: (event, activeElements) => {
            event.native.target.style.cursor = 'pointer';
        }
    }
});
	  }
    });
    
    // ========================================
    // GRAFICO 5: GIORNO SETTIMANA
    // ========================================
    const giornoData = {};
    data.forEach(row => {
        const giorno = row['Giorno settimana'];
        if (giorno) {
            giornoData[giorno] = (giornoData[giorno] || 0) + 1;
        }
    });
    
    const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const giorniCounts = giorni.map(g => giornoData[g] || 0);
    
    const selectedGiorno = currentFilters['filter-giorno-settimana'];
    
    const giornoCanvas = document.getElementById('chart-giorno-settimana');
    if (giornoCanvas) {
        if (analyticsCharts.giornoSettimana) analyticsCharts.giornoSettimana.destroy();
        analyticsCharts.giornoSettimana = new Chart(giornoCanvas, {
            type: 'bar',
            data: {
                labels: giorni,
                datasets: [{
                    label: 'Incidenti',
                    data: giorniCounts,
                    backgroundColor: giorni.map(g => 
                        selectedGiorno === g ? '#2563eb' : '#3b82f6'
                    ),
                    borderColor: giorni.map(g => 
                        selectedGiorno === g ? '#ffffff' : 'transparent'
                    ),
                    borderWidth: giorni.map(g => 
                        selectedGiorno === g ? 2 : 0
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        titleFont: { size: 11, weight: 'bold' },
                        bodyFont: { size: 10 },
                        callbacks: {
                            label: function(context) {
                                return `Incidenti: ${context.parsed.y.toLocaleString('it-IT')}`;
                            },
                            afterLabel: function(context) {
                                const giorno = giorni[context.dataIndex];
                                if (selectedGiorno === giorno) {
                                    return '\nClicca per deselezionare';
                                }
                                return '\nClicca per filtrare';
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 2,
                        color: '#1f2937',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : ''
                    }
                },
                scales: {
                    x: { 
                        ticks: { 
                            color: '#1f2937',
                            font: { size: 10 }
                        },
                        grid: { display: false }
                    },
                    y: { 
                        beginAtZero: true,
                        ticks: { 
                            color: '#1f2937',
                            font: { size: 10 }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                },
                onClick: (e, items) => {
                    if (items.length > 0) {
                        const giorno = giorni[items[0].index];
                        filterByGiornoSettimana(giorno);
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            }
        });
    }
    
   // ========================================
// GRAFICO 6: GIORNI DEL MESE (AREA)
// ========================================
const giorniMeseData = {};
for (let i = 1; i <= 31; i++) {
    giorniMeseData[i] = 0;
}

data.forEach(row => {
    const dataStr = row.Data;
    if (dataStr) {
        const giorno = parseInt(dataStr.split('/')[0]);
        if (giorno >= 1 && giorno <= 31) {
            giorniMeseData[giorno]++;
        }
    }
});

const giorniMeseLabels = Array.from({length: 31}, (_, i) => i + 1);
const giorniMeseCounts = giorniMeseLabels.map(g => giorniMeseData[g]);

const giorniMeseCanvas = document.getElementById('chart-giorni-mese');
if (giorniMeseCanvas) {
    if (analyticsCharts.giorniMese) analyticsCharts.giorniMese.destroy();
    analyticsCharts.giorniMese = new Chart(giorniMeseCanvas, {
        type: 'line',
        data: {
            labels: giorniMeseLabels,
            datasets: [{
                label: 'Incidenti',
                data: giorniMeseCounts,
                backgroundColor: 'rgba(139, 92, 246, 0.5)',
                borderColor: '#ed7c89',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ed7c89',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,          // âœ… AUMENTATO da 1 a 2
                pointRadius: 5,               // âœ… AUMENTATO da 2 a 5
                pointHoverRadius: 7           // âœ… AUMENTATO da 5 a 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 10 },
                    callbacks: {
                        title: function(context) {
                            return `Giorno ${context[0].label}`;
                        },
                        label: function(context) {
                            return `Incidenti: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    display: true,              // âœ… ABILITATO (era false)
                    align: 'top',               // âœ… NUOVO: posizione sopra i punti
                    anchor: 'end',              // âœ… NUOVO: ancoraggio al punto
                    offset: 4,                  // âœ… NUOVO: distanza dal punto
                    color: '#1f2937',           // âœ… NUOVO: colore chiaro
                    font: {                     // âœ… NUOVO: stile font
                        weight: 'bold', 
                        size: 9
                    },
                    formatter: (value) => value > 0 ? value : ''  // âœ… MOSTRA SOLO SE > 0
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: '#1f2937',
                        font: { size: 9 },
                        maxRotation: 0
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#1f2937',
                        font: { size: 10 }
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
            }
        }
    });
}
    
	// ========================================
// GRAFICO 7: CALENDARIO HEATMAP CON FILTRO
// ========================================
const calendarioData = {};

data.forEach(row => {
    const dataStr = row.Data;
    if (dataStr) {
        const [giorno, mese, anno] = dataStr.split('/').map(Number);
        const key = `${mese}-${giorno}`;
        calendarioData[key] = (calendarioData[key] || 0) + 1;
    }
});

const maxIncidenti = Math.max(...Object.values(calendarioData), 1);

function getIntensityClass(count) {
    if (count === 0) return 'empty';
    const intensity = count / maxIncidenti;
    
    if (intensity <= 0.14) return 'intensity-1';
    if (intensity <= 0.28) return 'intensity-2';
    if (intensity <= 0.42) return 'intensity-3';
    if (intensity <= 0.57) return 'intensity-4';
    if (intensity <= 0.71) return 'intensity-5';
    if (intensity <= 0.85) return 'intensity-6';
    return 'intensity-7';
}

const mesiCompleti = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

const MESI_ITALIANI_CAL = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const calendarioContainer = document.getElementById('chart-calendario-heatmap');
if (calendarioContainer) {
    let html = '<div class="calendar-heatmap-grid">';
    
    // Header con numeri giorni
    html += '<div class="calendar-heatmap-header">';
    html += '<div class="calendar-heatmap-month-label"></div>';
    
    for (let giorno = 1; giorno <= 31; giorno++) {
        html += `<div class="calendar-heatmap-day-label">${giorno}</div>`;
    }
    html += '</div>';
    
    // Righe per ogni mese
    for (let mese = 1; mese <= 12; mese++) {
        html += `<div class="calendar-heatmap-month-label">${mesiCompleti[mese - 1]}</div>`;
        
        const giorniInMese = new Date(2023, mese, 0).getDate();
        
        for (let giorno = 1; giorno <= 31; giorno++) {
            const key = `${mese}-${giorno}`;
            const count = calendarioData[key] || 0;
            
            if (giorno > giorniInMese) {
                html += `<div class="calendar-heatmap-cell empty"></div>`;
            } else {
                const intensityClass = getIntensityClass(count);
                const dataCompleta = `${String(giorno).padStart(2, '0')}/${String(mese).padStart(2, '0')}`;
                const title = count > 0 ? `${giorno} ${mesiCompleti[mese - 1]}: ${count} incidenti\nClicca per filtrare` : `${giorno} ${mesiCompleti[mese - 1]}`;
                
                // Verifica se questa cella à¨ attiva
                const isActive = currentFilters['filter-data-selezionata'] === dataCompleta + '/' + (currentFilters['filter-anno'] || '2023');
                
                html += `<div class="calendar-heatmap-cell ${intensityClass} ${isActive ? 'active' : ''}" 
                              data-mese="${mese}" 
                              data-giorno="${giorno}"
                              data-count="${count}"
                              data-data-completa="${dataCompleta}"
                              title="${title}">
                    ${count > 0 ? count : ''}
                </div>`;
            }
        }
    }
    
    html += '</div>';
    calendarioContainer.innerHTML = html;
    
    // Event listener per il filtro
    calendarioContainer.querySelectorAll('.calendar-heatmap-cell:not(.empty)').forEach(cell => {
        cell.addEventListener('click', () => {
            const mese = parseInt(cell.dataset.mese);
            const giorno = parseInt(cell.dataset.giorno);
            const count = parseInt(cell.dataset.count);
            const dataCompleta = cell.dataset.dataCompleta;
            
            // Filtra anche se count à¨ 0 (mostra che non ci sono incidenti quel giorno)
            filterByCalendarioData(mese, giorno, dataCompleta);
        });
    });
}
	
}

// Filter By Calendario Data
function filterByCalendarioData(mese, giorno, dataCompleta) {
    const meseName = MESI_ITALIANI_CAL[mese - 1];
    const anno = currentFilters['filter-anno'] || '2023';
    const dataCompletaConAnno = `${dataCompleta}/${anno}`;
    
    // Toggle: se già  selezionato, deseleziona
    if (currentFilters['filter-data-selezionata'] === dataCompletaConAnno) {
        delete currentFilters['filter-data-selezionata'];
        delete currentFilters['filter-mese'];
    } else {
        // Imposta nuova data
        currentFilters['filter-data-selezionata'] = dataCompletaConAnno;
        currentFilters['filter-mese'] = meseName;
        
        // Assicurati che l'anno sia impostato
        if (!currentFilters['filter-anno']) {
            currentFilters['filter-anno'] = '2023';
        }
    }
    
    // Aggiorna select
    const filterMese = document.getElementById('filter-mese');
    if (filterMese) {
        filterMese.value = currentFilters['filter-mese'] || '';
    }
    
    const filterAnno = document.getElementById('filter-anno');
    if (filterAnno) {
        filterAnno.value = currentFilters['filter-anno'] || '';
    }
    
    // Aggiorna tutto il sistema
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    // Aggiorna analytics se aperto
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateActiveFiltersDisplay();
        updateAnalytics();
    }
    
    // Scroll alla mappa per vedere i risultati
    if (window.innerWidth <= 768) {
        closeAnalytics();
    }
	window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}




// Filter By Stagione
function filterByStagione(stagione) {
    const currentStagione = currentFilters['filter-stagione'];
    
    if (currentStagione === stagione) {
        currentFilters['filter-stagione'] = '';
    } else {
        currentFilters['filter-stagione'] = stagione;
    }
    
    const filterStagione = document.getElementById('filter-stagione');
    if (filterStagione) {
        filterStagione.value = currentFilters['filter-stagione'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
	window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}

// Filter By Giorno Settimana
function filterByGiornoSettimana(giorno) {
    const currentGiorno = currentFilters['filter-giorno-settimana'];
    
    if (currentGiorno === giorno) {
        currentFilters['filter-giorno-settimana'] = '';
    } else {
        currentFilters['filter-giorno-settimana'] = giorno;
    }
    
    const filterGiorno = document.getElementById('filter-giorno-settimana');
    if (filterGiorno) {
        filterGiorno.value = currentFilters['filter-giorno-settimana'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
   }
   window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}



// Filter By Giorno Settimana (se non esiste già )
function filterByGiornoSettimana(giorno) {
    const currentGiorno = currentFilters['filter-giorno-settimana'];
    
    if (currentGiorno === giorno) {
        currentFilters['filter-giorno-settimana'] = '';
    } else {
        currentFilters['filter-giorno-settimana'] = giorno;
    }
    
    const filterGiorno = document.getElementById('filter-giorno-settimana');
    if (filterGiorno) {
        filterGiorno.value = currentFilters['filter-giorno-settimana'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
	window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}


// Oraria Charts

// Oraria Charts - VERSIONE COMPLETA CON 4 GRAFICI
function updateOrariaCharts(data) {
    const fasciaData = {};
    data.forEach(row => {
        const fascia = row['Fascia oraria dettagliata (6 fasce)'];
        if (fascia) {
            fasciaData[fascia] = (fasciaData[fascia] || 0) + 1;
        }
    });
    
    const fasce = ['Notte', 'Alba', 'Mattina', 'Pranzo', 'Pomeriggio', 'Sera'];
    const fasceCounts = fasce.map(f => fasciaData[f] || 0);
    
    const fasceColors = {
        'Notte': '#1e3a8a',
        'Alba': '#fbbf24',
        'Mattina': '#3b82f6',
        'Pranzo': '#f59e0b',
        'Pomeriggio': '#10b981',
        'Sera': '#8b5cf6'
    };
    
    const selectedFascia = currentFilters['filter-fascia-6'];
    
    // ========================================
    // GRAFICO 1: DISTRIBUZIONE AD AREE (Fasce Orarie)
    // ========================================
    const fasciaCanvas = document.getElementById('chart-fascia-oraria');
    if (fasciaCanvas) {
        if (analyticsCharts.fasciaOraria) analyticsCharts.fasciaOraria.destroy();
        
        analyticsCharts.fasciaOraria = new Chart(fasciaCanvas, {
            type: 'line',
            data: {
                labels: fasce,
                datasets: [{
                    label: 'Incidenti',
                    data: fasceCounts,
                    backgroundColor: fasce.map((f, idx) => {
                        const color = fasceColors[f];
                        return selectedFascia === f ? color + 'DD' : color + '99';
                    }),
                    borderColor: fasce.map(f => fasceColors[f]),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: fasce.map(f => 
                        selectedFascia === f ? '#ffffff' : fasceColors[f]
                    ),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1,
                    pointRadius: fasce.map(f => 
                        selectedFascia === f ? 6 : 4
                    ),
                    pointHoverRadius: 8,
                    segment: {
                        backgroundColor: (ctx) => {
                            const idx = ctx.p0DataIndex;
                            const fascia = fasce[idx];
                            const color = fasceColors[fascia];
                            return selectedFascia === fascia ? color + 'DD' : color + '99';
                        }
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                return fasce[context[0].dataIndex];
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                const total = fasceCounts.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `Incidenti: ${value.toLocaleString('it-IT')} (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                const fascia = fasce[context.dataIndex];
                                if (selectedFascia === fascia) {
                                    return '\nClicca per deselezionare';
                                }
                                return '\nClicca per filtrare';
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        color: '#1f2937',
                        font: { 
                            weight: 'bold', 
                            size: 11 
                        },
                        formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : ''
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#1f2937',
                            font: { size: 11, weight: '600' }
                        },
                        grid: { 
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#1f2937',
                            font: { size: 11 }
                        },
                        grid: { 
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        }
                    }
                },
                onClick: (e, items) => {
                    if (items.length > 0) {
                        const fascia = fasce[items[0].index];
                        filterByFasciaOraria(fascia);
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            }
        });
    }
    
    // ========================================
    // GRAFICO 2: BARRE ORIZZONTALI CON ORARI
    // ========================================
    const orariLabels = [
        '22:00 - 0:00 / 0:00 - 5:00',
        '5:00 - 7:00',
        '7:00 - 12:00',
        '12:00 - 14:00',
        '14:00 - 18:00',
        '18:00 - 22:00'
    ];
    
    const orariCanvas = document.getElementById('chart-orari-dettaglio');
    if (orariCanvas) {
        if (analyticsCharts.orariDettaglio) analyticsCharts.orariDettaglio.destroy();
        
        analyticsCharts.orariDettaglio = new Chart(orariCanvas, {
            type: 'bar',
            data: {
                labels: orariLabels,
                datasets: [{
                    label: 'Incidenti',
                    data: fasceCounts,
                    backgroundColor: fasce.map(f => 
                        selectedFascia === f ? fasceColors[f] + 'FF' : fasceColors[f] + 'CC'
                    ),
                    borderColor: fasce.map(f => 
                        selectedFascia === f ? '#ffffff' : 'transparent'
                    ),
                    borderWidth: fasce.map(f => 
                        selectedFascia === f ? 3 : 0
                    )
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        right: 40,
                        left: 10,
                        top: 10,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                const idx = context[0].dataIndex;
                                return `${fasce[idx]} (${orariLabels[idx]})`;
                            },
                            label: function(context) {
                                const value = context.parsed.x;
                                const total = fasceCounts.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `Incidenti: ${value.toLocaleString('it-IT')} (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                const fascia = fasce[context.dataIndex];
                                if (selectedFascia === fascia) {
                                    return '\nClicca per deselezionare';
                                }
                                return '\nClicca per filtrare';
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'end',
                        offset: 8,
                        color: '#1f2937',
                        font: { 
                            weight: 'bold', 
                            size: 12 
                        },
                        formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : ''
                    }
                },
                scales: {
                    x: {
                        display: false,
                        beginAtZero: true
                    },
                    y: {
                        ticks: { 
                            color: '#1f2937',
                            font: { 
                                size: 11, 
                                weight: '600' 
                            },
                            padding: 8
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                },
                onClick: (e, items) => {
                    if (items.length > 0) {
                        const fascia = fasce[items[0].index];
                        filterByFasciaOraria(fascia);
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            }
        });
    }
	
// ========================================
    // GRAFICO 3: DISTRIBUZIONE SETTIMANALE CON COLORI CORRETTI
    // ========================================
    const giornoData = {};
    data.forEach(row => {
        const giorno = row['Giorno settimana'];
        if (giorno) {
            giornoData[giorno] = (giornoData[giorno] || 0) + 1;
        }
    });
    
    const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const giorniCounts = giorni.map(g => giornoData[g] || 0);
    
    const selectedGiorno = currentFilters['filter-giorno-settimana'];
    
    const settimanaleAreaCanvas = document.getElementById('chart-settimanale-area');
    if (settimanaleAreaCanvas) {
        if (analyticsCharts.settimanaleArea) analyticsCharts.settimanaleArea.destroy();
        
        // Plugin per colorare l'area con due colori
        const areaColorPlugin = {
            id: 'areaColorPlugin',
            beforeDatasetDraw(chart, args) {
                const { ctx, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;
                
                if (args.index !== 0) return; // Solo sul primo dataset
                
                const meta = chart.getDatasetMeta(0);
                if (!meta.data || meta.data.length === 0) return;
                
                ctx.save();
                
                // Disegna area feriali (Lunedì-Venerdì, indici 0-4)
                ctx.beginPath();
                ctx.moveTo(left, bottom);
                for (let i = 0; i <= 4; i++) {
                    const point = meta.data[i];
                    if (point) {
                        ctx.lineTo(point.x, point.y);
                    }
                }
                ctx.lineTo(meta.data[4].x, bottom);
                ctx.closePath();
                ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
                ctx.fill();
                
                // Disegna area weekend (Venerdì-Domenica, indici 4-6)
                ctx.beginPath();
                ctx.moveTo(meta.data[4].x, bottom);
                for (let i = 4; i <= 6; i++) {
                    const point = meta.data[i];
                    if (point) {
                        ctx.lineTo(point.x, point.y);
                    }
                }
                ctx.lineTo(meta.data[6].x, bottom);
                ctx.closePath();
                ctx.fillStyle = 'rgba(237, 124, 137, 0.6)';
                ctx.fill();
                
                ctx.restore();
            }
        };
        
        analyticsCharts.settimanaleArea = new Chart(settimanaleAreaCanvas, {
            type: 'line',
            data: {
                labels: giorni,
                datasets: [{
                    label: 'Incidenti',
                    data: giorniCounts,
                    backgroundColor: 'transparent', // Il plugin gestisce il colore
                    borderColor: '#0079c6',
                    borderWidth: 3,
                    fill: false, // Disabilitiamo il fill predefinito
                    tension: 0.4,
                    pointBackgroundColor: giorni.map((g, idx) => {
                        if (selectedGiorno === g) return '#ffffff';
                        return idx < 5 ? '#0079c6' : '#ed7c89';
                    }),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1,
                    pointRadius: giorni.map(g => selectedGiorno === g ? 6 : 4),
                    pointHoverRadius: 8,
                    segment: {
    borderColor: (ctx) => {
        // Segmento specifico tra venerdà¬ (indice 4) e sabato (indice 5)
        if (ctx.p0DataIndex === 4 && ctx.p1DataIndex === 5) {
            return '#ed7c89'; // Colore per la transizione (es. giallo/arancione)
        }
        // Altri segmenti
        return ctx.p0DataIndex < 5 ? '#0079c6' : '#ed7c89';
    },
    borderWidth: (ctx) => {
        // Spessore maggiore per il segmento tra venerdà¬ e sabato
        if (ctx.p0DataIndex === 4 && ctx.p1DataIndex === 5) {
            return 4; // Spessore aumentato
        }
        return 4; // Spessore normale per gli altri segmenti
    }
}
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#1f2937',
                            font: { size: 11 },
                            padding: 10,
                            generateLabels: function() {
                                return [
                                    {
                                        text: 'Feriali',
                                        fillStyle: 'rgba(0, 121, 198, 0.6)',
                                        strokeStyle: '#0079c6',
                                        lineWidth: 2,
                                        pointStyle: 'circle'
                                    },
                                    {
                                        text: 'Weekend',
                                        fillStyle: 'rgba(237, 124, 137, 0.6)',
                                        strokeStyle: '#ed7c89',
                                        lineWidth: 2,
                                        pointStyle: 'circle'
                                    }
                                ];
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                return giorni[context[0].dataIndex];
                            },
                            label: function(context) {
                                const idx = context.dataIndex;
                                const value = giorniCounts[idx];
                                const total = giorniCounts.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                const tipo = idx < 5 ? 'Feriale' : 'Weekend';
                                return `${tipo}: ${value.toLocaleString('it-IT')} (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                const giorno = giorni[context.dataIndex];
                                if (selectedGiorno === giorno) {
                                    return '\nClicca per deselezionare';
                                }
                                return '\nClicca per filtrare';
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        color: '#1f2937',
                        font: { 
                            weight: 'bold', 
                            size: 11 
                        },
                        formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : ''
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#1f2937',
                            font: { size: 10, weight: '600' }
                        },
                        grid: { 
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#1f2937',
                            font: { size: 11 }
                        },
                        grid: { 
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        }
                    }
                },
                onClick: (e, items) => {
                    if (items.length > 0) {
                        const giorno = giorni[items[0].index];
                        filterByGiornoSettimana(giorno);
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            },
            plugins: [areaColorPlugin]
        });
    }

	
 
   
    // ========================================
    // GRAFICO 4: FERIALI VS WEEKEND (BARRE)
    // ========================================
    const ferialiData = {};
    data.forEach(row => {
        const tipo = row['Feriale/Weekend'];
        if (tipo) {
            ferialiData[tipo] = (ferialiData[tipo] || 0) + 1;
        }
    });
    
    const ferialiLabels = ['Feriale', 'Weekend'];
    const ferialiCounts = ferialiLabels.map(f => ferialiData[f] || 0);
    const selectedFerialeWeekend = currentFilters['filter-feriale-weekend'];
    
    const settimanaleBarreCanvas = document.getElementById('chart-settimanale-barre');
    if (settimanaleBarreCanvas) {
        if (analyticsCharts.settimanaleBarre) analyticsCharts.settimanaleBarre.destroy();
        
        analyticsCharts.settimanaleBarre = new Chart(settimanaleBarreCanvas, {
            type: 'bar',
            data: {
                labels: ferialiLabels,
                datasets: [{
                    label: 'Incidenti',
                    data: ferialiCounts,
                    backgroundColor: ferialiLabels.map(f => {
                        const color = f === 'Feriale' ? '#0079c6' : '#ed7c89';
                        return selectedFerialeWeekend === f ? color + 'FF' : color + 'CC';
                    }),
                    borderColor: ferialiLabels.map(f => 
                        selectedFerialeWeekend === f ? '#ffffff' : 'transparent'
                    ),
                    borderWidth: ferialiLabels.map(f => 
                        selectedFerialeWeekend === f ? 2 : 0
                    )
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        right: 40,
                        left: 10,
                        top: 10,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x;
                                const total = ferialiCounts.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `Incidenti: ${value.toLocaleString('it-IT')} (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                const tipo = ferialiLabels[context.dataIndex];
                                if (selectedFerialeWeekend === tipo) {
                                    return '\nClicca per deselezionare';
                                }
                                return '\nClicca per filtrare';
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'end',
                        offset: 8,
                        color: '#1f2937',
                        font: { 
                            weight: 'bold', 
                            size: 12 
                        },
                        formatter: (value) => value > 0 ? value.toLocaleString('it-IT') : ''
                    }
                },
                scales: {
                    x: {
                        display: false,
                        beginAtZero: true
                    },
                    y: {
                        ticks: { 
                            color: '#1f2937',
                            font: { 
                                size: 12, 
                                weight: '600' 
                            },
                            padding: 8
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                },
                onClick: (e, items) => {
                    if (items.length > 0) {
                        const tipo = ferialiLabels[items[0].index];
                        filterByFerialeWeekend(tipo);
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            }
        });
    }
}

// Funzione di filtro per fascia oraria
function filterByFasciaOraria(fascia) {
    const currentFascia = currentFilters['filter-fascia-6'];
    
    if (currentFascia === fascia) {
        currentFilters['filter-fascia-6'] = '';
    } else {
        currentFilters['filter-fascia-6'] = fascia;
    }
    
    const filterFascia6 = document.getElementById('filter-fascia-6');
    if (filterFascia6) {
        filterFascia6.value = currentFilters['filter-fascia-6'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
}

// Funzione di filtro per Feriale/Weekend
function filterByFerialeWeekend(tipo) {
    const currentTipo = currentFilters['filter-feriale-weekend'];
    
    if (currentTipo === tipo) {
        currentFilters['filter-feriale-weekend'] = '';
    } else {
        currentFilters['filter-feriale-weekend'] = tipo;
    }
    
    const filterFerialeWeekend = document.getElementById('filter-feriale-weekend');
    if (filterFerialeWeekend) {
        filterFerialeWeekend.value = currentFilters['filter-feriale-weekend'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
	
	window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}


// Funzione di filtro per fascia oraria
function filterByFasciaOraria(fascia) {
    const currentFascia = currentFilters['filter-fascia-6'];
    
    if (currentFascia === fascia) {
        currentFilters['filter-fascia-6'] = '';
    } else {
        currentFilters['filter-fascia-6'] = fascia;
    }
    
    const filterFascia6 = document.getElementById('filter-fascia-6');
    if (filterFascia6) {
        filterFascia6.value = currentFilters['filter-fascia-6'];
    }
    
    updateAllFilters();
    updateMapData();
    updateStats();
    updateYearStats();
    updateLegendChart();
    updatePeriodSwitches();
    updateMonthlyInjuriesChart();
    updateMonthlyAreaChart();
    
    calculateTopLuoghi();
    updateTopLuoghiModalIfOpen();
    
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        updateAnalytics();
    }
	window.dispatchEvent(new Event('filtersUpdated'));
    
    // ✅ AGGIUNGI QUESTA RIGA
    updateBrowserUrl();
}


// Update Insights
// Update Insights - VERSIONE CORRETTA CHE POPOLA SOLO I VALORI
function updateInsights(data) {
    // ========================================
    // STATISTICHE IN TEMPO REALE
    // ========================================
    const totalIncidenti = data.length;
    
    // Feriti (F + R)
    const totalFeriti = data.filter(r => r.Tipologia === 'F' || r.Tipologia === 'R').length;
    const percentualeFeriti = totalIncidenti > 0 ? ((totalFeriti / totalIncidenti) * 100).toFixed(1) : 0;
    const mediaFeriti = totalIncidenti > 0 ? (totalFeriti / totalIncidenti).toFixed(2) : 0;
    
    // Deceduti (solo M)
    const totalMorti = data.filter(r => r.Tipologia === 'M').length;
    const percentualeMorti = totalIncidenti > 0 ? ((totalMorti / totalIncidenti) * 100).toFixed(1) : 0;
    const mediaMorti = totalIncidenti > 0 ? (totalMorti / totalIncidenti).toFixed(2) : 0;
    
    // ✅ AGGIORNA DIRETTAMENTE GLI ELEMENTI CON GLI ID
    const realtimeTotal = document.getElementById('realtime-total');
    const realtimeFeriti = document.getElementById('realtime-feriti');
    const realtimePercentuale = document.getElementById('realtime-percentuale');
    const realtimeMedia = document.getElementById('realtime-media');
    
    if (realtimeTotal) realtimeTotal.textContent = totalIncidenti.toLocaleString('it-IT');
    if (realtimeFeriti) realtimeFeriti.textContent = totalFeriti.toLocaleString('it-IT');
    if (realtimePercentuale) realtimePercentuale.textContent = percentualeFeriti + '%';
    if (realtimeMedia) realtimeMedia.textContent = mediaFeriti;
    
    // ✅ NUOVI ELEMENTI DECEDUTI
    const realtimeMorti = document.getElementById('realtime-morti');
    const realtimePercentualeMorti = document.getElementById('realtime-percentuale-morti');
    const realtimeMediaMorti = document.getElementById('realtime-media-morti');
    
    if (realtimeMorti) realtimeMorti.textContent = totalMorti.toLocaleString('it-IT');
    if (realtimePercentualeMorti) realtimePercentualeMorti.textContent = percentualeMorti + '%';
    if (realtimeMediaMorti) realtimeMediaMorti.textContent = mediaMorti;
    
    // ========================================
    // INSIGHTS AUTOMATICI
    // ========================================
    
    // Giorno più pericoloso
    const giornoData = {};
    data.forEach(row => {
        const giorno = row['Giorno settimana'];
        if (giorno) giornoData[giorno] = (giornoData[giorno] || 0) + 1;
    });
    const giornoPericoloso = Object.entries(giornoData).sort((a, b) => b[1] - a[1])[0];
    const insightGiorno = document.getElementById('insight-giorno');
    if (insightGiorno) {
        insightGiorno.textContent = giornoPericoloso ? `${giornoPericoloso[0]} (${giornoPericoloso[1]} incidenti)` : '-';
    }
    
    // Fascia oraria più critica
    const fasciaData = {};
    data.forEach(row => {
        const fascia = row['Fascia oraria dettagliata (6 fasce)'];
        if (fascia) fasciaData[fascia] = (fasciaData[fascia] || 0) + 1;
    });
    const fasciaCritica = Object.entries(fasciaData).sort((a, b) => b[1] - a[1])[0];
    const insightFascia = document.getElementById('insight-fascia');
    if (insightFascia) {
        insightFascia.textContent = fasciaCritica ? `${fasciaCritica[0]} (${fasciaCritica[1]} incidenti)` : '-';
    }
    
    // Stagione più rischiosa
    const stagioneData = {};
    data.forEach(row => {
        const stagione = row.Stagione;
        if (stagione) stagioneData[stagione] = (stagioneData[stagione] || 0) + 1;
    });
    const stagioneRischiosa = Object.entries(stagioneData).sort((a, b) => b[1] - a[1])[0];
    const insightStagione = document.getElementById('insight-stagione');
    if (insightStagione) {
        insightStagione.textContent = stagioneRischiosa ? `${stagioneRischiosa[0]} (${stagioneRischiosa[1]} incidenti)` : '-';
    }
    
    // Condizione luce più pericolosa
    const condizioneData = {};
    data.forEach(row => {
        const cond = row['Condizioni luce (Visibilità)'];
        if (cond) condizioneData[cond] = (condizioneData[cond] || 0) + 1;
    });
    const condizionePericolosa = Object.entries(condizioneData).sort((a, b) => b[1] - a[1])[0];
    const insightCondizione = document.getElementById('insight-condizione');
    if (insightCondizione) {
        insightCondizione.textContent = condizionePericolosa ? `${condizionePericolosa[0]} (${condizionePericolosa[1]} incidenti)` : '-';
    }
    
    // ✅ NUOVI INSIGHTS
    
    // Mese con più incidenti
    const meseData = {};
    data.forEach(row => {
        const mese = row.Mese;
        if (mese) meseData[mese] = (meseData[mese] || 0) + 1;
    });
    const mesePericoloso = Object.entries(meseData).sort((a, b) => b[1] - a[1])[0];
    const insightMese = document.getElementById('insight-mese');
    if (insightMese) {
        insightMese.textContent = mesePericoloso ? `${mesePericoloso[0]} (${mesePericoloso[1]} incidenti)` : '-';
    }
    
    // Circoscrizione con più incidenti
    const circoscrizioneData = {};
    data.forEach(row => {
        const circ = row.Circoscrizione;
        if (circ && circ !== 'null') circoscrizioneData[circ] = (circoscrizioneData[circ] || 0) + 1;
    });
    const circoscrizionePericolosa = Object.entries(circoscrizioneData).sort((a, b) => b[1] - a[1])[0];
    const insightCircoscrizione = document.getElementById('insight-circoscrizione');
    if (insightCircoscrizione) {
        insightCircoscrizione.textContent = circoscrizionePericolosa ? `${circoscrizionePericolosa[0]} (${circoscrizionePericolosa[1]} incidenti)` : '-';
    }
    
    // Quartiere con più incidenti
    const quartiereData = {};
    data.forEach(row => {
        const quart = row.Quartiere;
        if (quart && quart !== 'null') quartiereData[quart] = (quartiereData[quart] || 0) + 1;
    });
    const quartierePericoloso = Object.entries(quartiereData).sort((a, b) => b[1] - a[1])[0];
    const insightQuartiere = document.getElementById('insight-quartiere');
    if (insightQuartiere) {
        insightQuartiere.textContent = quartierePericoloso ? `${quartierePericoloso[0]} (${quartierePericoloso[1]} incidenti)` : '-';
    }
    
    // UPL con più incidenti
    const uplData = {};
    data.forEach(row => {
        const upl = row.UPL;
        if (upl && upl !== 'null') uplData[upl] = (uplData[upl] || 0) + 1;
    });
    const uplPericolosa = Object.entries(uplData).sort((a, b) => b[1] - a[1])[0];
    const insightUpl = document.getElementById('insight-upl');
    if (insightUpl) {
        insightUpl.textContent = uplPericolosa ? `${uplPericolosa[0]} (${uplPericolosa[1]} incidenti)` : '-';
    }
    
    // Strada con più incidenti
    const stradaData = {};
    data.forEach(row => {
        const strada = row.Indirizzo;
        if (strada && strada !== 'null' && strada !== 'Non specificato') {
            stradaData[strada] = (stradaData[strada] || 0) + 1;
        }
    });
    const stradaPericolosa = Object.entries(stradaData).sort((a, b) => b[1] - a[1])[0];
    const insightStrada = document.getElementById('insight-strada');
    if (insightStrada) {
        if (stradaPericolosa) {
            const nomeStrada = stradaPericolosa[0];
            const nomeBreve = nomeStrada.length > 40 ? nomeStrada.substring(0, 37) + '...' : nomeStrada;
            insightStrada.textContent = `${nomeBreve} (${stradaPericolosa[1]} incidenti)`;
            insightStrada.title = `${nomeStrada} - ${stradaPericolosa[1]} incidenti`;
        } else {
            insightStrada.textContent = '-';
            insightStrada.title = '';
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // ✅ LISTENER GLOBALE per aggiornare i filtri in Analytics
    window.addEventListener('filtersUpdated', () => {
        const analyticsPanel = document.getElementById('analytics-panel');
        if (analyticsPanel && analyticsPanel.classList.contains('open')) {
            updateActiveFiltersDisplay();
        }
    });
    
    function addTouchClickListener(element, handler) {
        if (!element) return;
        
        let touchStartTime = 0;
        let touchMoved = false;
        
        element.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchMoved = false;
        }, { passive: true });
        
        element.addEventListener('touchmove', () => {
            touchMoved = true;
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            if (!touchMoved && touchDuration < 500) {
                e.preventDefault();
                handler(e);
            }
        });
        		
        element.addEventListener('click', handler);
				
    }
    
    const btnResetCharts = document.getElementById('btn-reset-charts');
    if (btnResetCharts) addTouchClickListener(btnResetCharts, resetChartsFilters);
    
    const switchGiorno = document.getElementById('switch-giorno');
    const switchNotte = document.getElementById('switch-notte');
    if (switchGiorno) {
        addTouchClickListener(switchGiorno, () => {
            filterByDayNight('Giorno');
        });
    }
    if (switchNotte) {
        addTouchClickListener(switchNotte, () => {
            filterByDayNight('Notte');
        });
    }
    
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (mobileToggle) addTouchClickListener(mobileToggle, toggleSidebar);
    if (sidebarOverlay) addTouchClickListener(sidebarOverlay, closeSidebar);
    
    document.querySelectorAll('.filter-section-header').forEach(header => {
        addTouchClickListener(header, () => {
            const section = header.dataset.section;
            toggleSection(section);
        });
    });
    
const yearStatsGrid = document.getElementById('year-stats-grid');
    if (yearStatsGrid) {
        let touchStartTime = 0;
        let touchMoved = false;
        let touchTarget = null;
        
        yearStatsGrid.addEventListener('touchstart', (e) => {
            const item = e.target.closest('.year-stat-item, .year-stat-item-all');
            if (item) {
                touchStartTime = Date.now();
                touchMoved = false;
                touchTarget = item;
                item.style.opacity = '0.7';
            }
        }, { passive: true });
        
        yearStatsGrid.addEventListener('touchmove', (e) => {
            touchMoved = true;
            if (touchTarget) {
                touchTarget.style.opacity = '';
                touchTarget = null;
            }
        }, { passive: true });
        
        yearStatsGrid.addEventListener('touchend', (e) => {
            const item = e.target.closest('.year-stat-item, .year-stat-item-all');
            const touchDuration = Date.now() - touchStartTime;
            
            if (item && touchTarget === item) {
                item.style.opacity = '';
                
                if (!touchMoved && touchDuration < 500) {
                    e.preventDefault();
                    
                    const year = item.dataset.year;
                    
                    if (year === '2019') {
                        show2019InfoPopup();
                        setTimeout(() => filterByYear(year), 100);
                    } else {
                        filterByYear(year);
                    }
                }
            }
            
            touchTarget = null;
        });
        
        yearStatsGrid.addEventListener('touchcancel', (e) => {
            if (touchTarget) {
                touchTarget.style.opacity = '';
                touchTarget = null;
            }
        }, { passive: true });
        
        yearStatsGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.year-stat-item, .year-stat-item-all');
            if (!item) return;
            
            const year = item.dataset.year;
            
            if (year === '2019') {
                show2019InfoPopup();
                setTimeout(() => filterByYear(year), 100);
            } else {
                filterByYear(year);
            }
        });
    }
    
    document.querySelectorAll('.legend-item').forEach(item => {
        addTouchClickListener(item, () => {
            const tipo = item.dataset.tipo;
            filterByTipologia(tipo);
        });
    });
    
			    document.querySelectorAll('.stat-item').forEach(item => {
        addTouchClickListener(item, () => {
            const tipo = item.dataset.tipo;
            if (tipo) {
                filterByTipologia(tipo);
            }
        });
    });
	
    const buttonsConfig = [
        { id: 'btn-toggle-heatmap', handler: toggleHeatmap },
        { id: 'btn-heatmap-map', handler: toggleHeatmap },
        { id: 'btn-reset', handler: resetFilters },
        { id: 'btn-reset-map', handler: resetFilters },
        { id: 'btn-data-table', handler: openDataTable },
        { id: 'btn-data-table-map', handler: openDataTable },
        { id: 'btn-analytics', handler: openAnalytics },
        { id: 'btn-analytics-map', handler: openAnalytics }
    ];
    
    buttonsConfig.forEach(config => {
        const btn = document.getElementById(config.id);
        if (btn) addTouchClickListener(btn, config.handler);
    });
    
    const basemapSelect = document.getElementById('basemap-select');
    if (basemapSelect) basemapSelect.addEventListener('change', changeBasemap);
    
    const infoIconBtn = document.getElementById('info-icon-btn');
    if (infoIconBtn) addTouchClickListener(infoIconBtn, () => {
        const modal = document.getElementById('info-modal');
        if (modal) modal.classList.add('show');
    });
    
    const modalsConfig = [
        { id: 'info-modal-close', modalId: 'info-modal' },
        { id: 'data-table-close', handler: closeDataTable },
        { id: 'detail-close', handler: closeDetailPanel },
        { id: 'analytics-close', handler: closeAnalytics }
    ];
    
    modalsConfig.forEach(config => {
        const btn = document.getElementById(config.id);
        if (btn) {
            if (config.handler) {
                addTouchClickListener(btn, config.handler);
            } else {
                addTouchClickListener(btn, () => {
                    const modal = document.getElementById(config.modalId);
                    if (modal) modal.classList.remove('show');
                });
            }
        }
    });
    
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        addTouchClickListener(tab, () => {
            const tabName = tab.dataset.tab;
            switchAnalyticsTab(tabName);
        });
    });
    
    const btnDownloadCSV = document.getElementById('btn-download-csv');
    if (btnDownloadCSV) addTouchClickListener(btnDownloadCSV, downloadCSV);
    
    const btnDownloadJSON = document.getElementById('btn-download-json');
    if (btnDownloadJSON) addTouchClickListener(btnDownloadJSON, downloadJSON);
    
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
    
    document.addEventListener('touchend', (e) => {
        if (e.target.closest('button, .legend-item, .year-stat-item, .year-stat-item-all')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    const btnClustering = document.getElementById('btn-clustering-map');
    if (btnClustering) addTouchClickListener(btnClustering, toggleClustering);

    const btnTopLuoghi = document.getElementById('btn-top-luoghi-map');
    if (btnTopLuoghi) addTouchClickListener(btnTopLuoghi, openTopLuoghiModal);

    const btnTopLuoghiClose = document.getElementById('top-luoghi-close');
    if (btnTopLuoghiClose) addTouchClickListener(btnTopLuoghiClose, closeTopLuoghiModal);

    const btnDownloadLuoghi = document.getElementById('btn-download-luoghi-csv');
    if (btnDownloadLuoghi) addTouchClickListener(btnDownloadLuoghi, downloadTopLuoghiCSV);
	
	// Desktop Sidebar Toggle
const sidebarDesktopToggle = document.getElementById('sidebar-desktop-toggle');
if (sidebarDesktopToggle) {
    addTouchClickListener(sidebarDesktopToggle, toggleDesktopSidebar);
}
const btnResetAnalytics = document.getElementById('btn-reset-analytics');
if (btnResetAnalytics) {
    addTouchClickListener(btnResetAnalytics, resetFilters);
}
}



// Initialize App
init();