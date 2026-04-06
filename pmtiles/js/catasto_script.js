
// =========================
// MOBILE-OPTIMIZED CATASTO PALERMO SCRIPT
// Versione ottimizzata per dispositivi mobili
// =========================

// =========================
// NEWS POPUP (scade 2026-04-10)
// =========================
function initNewsPopup() {
    const overlay = document.getElementById('news-popup-overlay');
    if (!overlay) return;
    const expiry = new Date('2026-04-10');
    if (new Date() > expiry) {
        overlay.style.display = 'none';
        return;
    }
    setTimeout(() => closeNewsPopup(), 10000);
}

function closeNewsPopup() {
    const overlay = document.getElementById('news-popup-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeOutOverlay 0.25s ease forwards';
        setTimeout(() => { overlay.style.display = 'none'; }, 250);
    }
}

// VARIABILI GLOBALI
let isSatelliteOverlayOpen = false;
let satelliteMap = null;
let layerPanelOpen = false;
let currentPopup = null;
let isMobile = window.innerWidth <= 768;

// STATO DEI LAYER
const layerStates = {
    'basemap': true,
    'vincoli_lin': true,
    'vincoli_ar': true,
    'particelle': true,
    'civici': false,
    'carta_tecnica': false,
    'satellite': false,
    'zonizzazione': true,
    'zone_omi': false
};

// MAPPATURA TRA ID PULSANTI E ID LAYER SULLA MAPPA
const layerMapping = {
    'basemap': 'raster-tiles-layer',
    'vincoli_lin': 'vincoli_lin',
    'vincoli_ar': 'vincoli_ar',
    'particelle': 'Particelle catastali',
    'civici': 'Numeri Civici',
    'carta_tecnica': 'carta_tecnica',
    'satellite': 'satellite-layer',
    'zonizzazione': 'zto',
    'zone_omi': 'Zone OMI'
};

// =========================
// FUNZIONE HIDE LOADER
// =========================
function hideLoader() {
    const loader = document.getElementById('custom-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            loader.style.display = 'none';
            setTimeout(() => initNewsPopup(), 3000);
        }, 500);
    }
}

// =========================
// RILEVAMENTO MOBILE E ORIENTAMENTO
// =========================
function detectMobile() {
    isMobile = window.innerWidth <= 768;
    updateMobileUI();
}

function updateMobileUI() {
    const body = document.body;
    if (isMobile) {
        body.classList.add('mobile');
    } else {
        body.classList.remove('mobile');
    }
}

// =========================
// FUNZIONI LAYER SWITCHER OTTIMIZZATE
// =========================
function toggleLayers() {
    const panel = document.getElementById('layer-panel');
    const btn = document.querySelector('.command-btn');
    layerPanelOpen = !layerPanelOpen;
    
    if (layerPanelOpen) {
        panel.classList.add('active');
        btn.classList.add('active');
        if (isMobile && window.map) {
            window.map.scrollZoom.disable();
            window.map.dragPan.disable();
        }
    } else {
        panel.classList.remove('active');
        btn.classList.remove('active');
        if (isMobile && window.map) {
            window.map.scrollZoom.enable();
            window.map.dragPan.enable();
        }
    }
}

function toggleLayer(layerId) {
    if (!layerMapping[layerId]) {
        console.warn(`Nessun mapping trovato per il layer: ${layerId}`);
        return;
    }
    
    layerStates[layerId] = !layerStates[layerId];
    
    const button = document.getElementById(layerId);
    if (button) {
        if (layerStates[layerId]) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
    
    if (window.map && window.map.getLayer(layerMapping[layerId])) {
        window.map.setLayoutProperty(
            layerMapping[layerId], 
            'visibility', 
            layerStates[layerId] ? 'visible' : 'none'
        );
        
        if (layerId === 'particelle') {
            window.map.setLayoutProperty(
                'particelle-labels',
                'visibility',
                layerStates[layerId] ? 'visible' : 'none'
            );
        }

        if (layerId === 'zone_omi') {
            if (window.map.getLayer('Zone OMI-line')) {
                window.map.setLayoutProperty(
                    'Zone OMI-line',
                    'visibility',
                    layerStates[layerId] ? 'visible' : 'none'
                );
            }
            if (window.map.getLayer('Zone OMI-labels')) {
                window.map.setLayoutProperty(
                    'Zone OMI-labels',
                    'visibility',
                    layerStates[layerId] ? 'visible' : 'none'
                );
            }
        }

        if (layerId === 'vincoli_lin' || layerId === 'vincoli_ar') {
            syncVincoliMain();
        }

        if (layerId === 'zonizzazione') {
            const vis = layerStates[layerId] ? 'visible' : 'none';
            if (window.map.getLayer('ppe')) {
                window.map.setLayoutProperty('ppe', 'visibility', vis);
            }
            if (window.map.getLayer('Info ZTO')) {
                window.map.setLayoutProperty('Info ZTO', 'visibility', vis);
            }
        }
    }
    
    if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function toggleVincoliSubmenu() {
    const container = document.querySelector('.vincoli-container');
    container.classList.toggle('active');

    if (isMobile && navigator.vibrate) {
        navigator.vibrate(30);
    }
}

function toggleVincoliMain() {
    // Lo stato principale è attivo se almeno uno dei due sub-layer è attivo
    const anyActive = layerStates['vincoli_lin'] || layerStates['vincoli_ar'];
    const newState = !anyActive;

    ['vincoli_lin', 'vincoli_ar'].forEach(id => {
        layerStates[id] = newState;
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('active', newState);
        if (window.map && window.map.getLayer(layerMapping[id])) {
            window.map.setLayoutProperty(layerMapping[id], 'visibility', newState ? 'visible' : 'none');
        }
    });

    const mainBtn = document.getElementById('vincoli-main');
    if (mainBtn) mainBtn.classList.toggle('active', newState);

    if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function syncVincoliMain() {
    const anyActive = layerStates['vincoli_lin'] || layerStates['vincoli_ar'];
    const mainBtn = document.getElementById('vincoli-main');
    if (mainBtn) mainBtn.classList.toggle('active', anyActive);
}

function initLayerButtons() {
    const vincoliMain = document.getElementById('vincoli-main');
    if (vincoliMain) {
        vincoliMain.addEventListener('click', function(e) {
            e.stopPropagation();
            const toggle = e.target.closest('.layer-toggle');
            if (toggle) {
                toggleVincoliMain();
            } else {
                toggleVincoliSubmenu();
            }
        });
    }
    
    const layerButtons = ['basemap', 'vincoli_lin', 'vincoli_ar', 'particelle', 'civici', 'carta_tecnica', 'satellite', 'zonizzazione', 'zone_omi'];
    layerButtons.forEach(layerId => {
        const button = document.getElementById(layerId);
        if (button) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleLayer(layerId);
            });
        }
    });
    
    if (isMobile) {
        document.addEventListener('touchstart', function(e) {
            const layerPanel = document.getElementById('layer-panel');
            const commandBar = document.querySelector('.command-bar');
            
            if (layerPanelOpen && 
                layerPanel && !layerPanel.contains(e.target) && 
                commandBar && !commandBar.contains(e.target)) {
                toggleLayers();
            }
        });
    }
}

// =========================
// OVERLAY SATELLITARE OTTIMIZZATO PER MOBILE
// =========================
function toggleSatelliteOverlay() {
    const satelliteOverlay = document.getElementById("satellite-overlay");
    const crosshairMain = document.querySelector(".crosshair-main");

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
        
        if (window.map) {
            satelliteMap = new maplibregl.Map({
                container: "satellite-map",
                style: {
                    version: 8,
                    sources: {
                        satellite: {
                            type: "raster",
                            tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
                            tileSize: 256,
                            attribution: "Immagini ©2025 Google - "
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
                center: window.map.getCenter(),
                zoom: window.map.getZoom(),
                interactive: false,
                attributionControl: false
            });

            window.map.on("move", () => {
                if (satelliteMap) {
                    satelliteMap.setCenter(window.map.getCenter());
                    satelliteMap.setZoom(window.map.getZoom());
                }
            });

            window.map.on("zoom", () => {
                if (satelliteMap) {
                    satelliteMap.setZoom(window.map.getZoom());
                }
            });
        }
    }

    isSatelliteOverlayOpen = !isSatelliteOverlayOpen;
    
    if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// =========================
// FUNZIONI RICERCA OTTIMIZZATE PER MOBILE
// =========================
function toggleSearchPopup() {
    const searchPopup = document.getElementById("search-popup");
    searchPopup.classList.toggle("active");
    if (searchPopup.classList.contains("active") && window._civicoMarker) {
        window._civicoMarker.remove();
        window._civicoMarker = null;
    }
    
    if (isMobile) {
        if (searchPopup.classList.contains("active")) {
            document.body.style.overflow = 'hidden';
            if (window.map) {
                window.map.scrollZoom.disable();
                window.map.dragPan.disable();
            }
        } else {
            document.body.style.overflow = '';
            if (window.map) {
                window.map.scrollZoom.enable();
                window.map.dragPan.enable();
            }
        }
    }
    
    if (searchPopup.classList.contains("active")) {
        setTimeout(() => {
            const foglioInput = document.getElementById("foglio");
            if (foglioInput) {
                foglioInput.focus();
            }
        }, 300);
    }
    
    if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function loadCiviciIndex(url) {
    fetch(url)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            window._civiciIndex = data;
            window._odonomiList = Object.keys(data).sort();
        })
        .catch(() => {
            // fallback: estrazione dai tile caricati nel viewport
            window._civiciIndex = null;
        });
}

function extractOdonomi() {
    if (window._civiciIndex) return; // indice già caricato, non serve riestrarre dai tile
    if (!window.map) return;
    window.map.once('idle', () => {
        const features = window.map.querySourceFeatures("civici", { sourceLayer: "civici_wgs84" });
        const set = new Set();
        features.forEach(f => { if (f.properties.Odonimo) set.add(f.properties.Odonimo.toUpperCase()); });
        window._odonomiList = Array.from(set).sort();
    });
}

function renderOdonimoDropdown(matches) {
    const dropdown = document.getElementById("odonimo-dropdown");
    if (!dropdown) return;
    if (matches.length === 0) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = matches.map(m =>
        `<div class="odonimo-option" onmousedown="selectOdonimo('${m.replace(/'/g, "\\'")}')">${m}</div>`
    ).join('');
    dropdown.style.display = 'block';
}

function closeOdonimoDropdown() {
    const dropdown = document.getElementById("odonimo-dropdown");
    if (dropdown) dropdown.style.display = 'none';
}

function placeCivicoMarker(coords) {
    if (window._civicoMarker) {
        window._civicoMarker.remove();
        window._civicoMarker = null;
    }
    const el = document.createElement('div');
    el.className = 'civico-marker';
    window._civicoMarker = new maplibregl.Marker({ element: el, anchor: 'top' })
        .setLngLat(coords)
        .addTo(window.map);
}

function selectOdonimo(name) {
    document.getElementById('odonimo').value = name;
    closeOdonimoDropdown();
    const civicoInput = document.getElementById('civico-search');
    if (civicoInput) civicoInput.focus();
}

function switchSearchMode(mode) {
    document.getElementById('search-mode-foglio').style.display = mode === 'foglio' ? 'block' : 'none';
    document.getElementById('search-mode-civico').style.display = mode === 'civico' ? 'block' : 'none';
    document.getElementById('search-mode-toggle').classList.toggle('civico-active', mode === 'civico');
    document.getElementById('label-foglio').classList.toggle('active', mode === 'foglio');
    document.getElementById('label-civico').classList.toggle('active', mode === 'civico');
    document.getElementById('search-error').textContent = '';
    const infoText = document.getElementById('search-info-text');
    if (infoText) infoText.textContent = mode === 'civico'
        ? 'Inserisci il nome della via e il numero civico per trovare la zona sulla mappa.'
        : 'La ricerca funziona sull\'area visibile della mappa. Naviga prima nella zona di interesse, poi avvia la ricerca.';
    closeOdonimoDropdown();

    if (window.map && window.map.getLayer("Numeri Civici")) {
        if (mode === 'civico') {
            window._civiciWasVisible = window.map.getLayoutProperty("Numeri Civici", "visibility") === "visible";
            window.map.setLayoutProperty("Numeri Civici", "visibility", "visible");
            const btn = document.getElementById("civici");
            if (btn) btn.classList.add("active");
            extractOdonomi();
        } else if (!window._civiciWasVisible) {
            window.map.setLayoutProperty("Numeri Civici", "visibility", "none");
            const btn = document.getElementById("civici");
            if (btn) btn.classList.remove("active");
        }
    }

    setTimeout(() => {
        const input = document.getElementById(mode === 'foglio' ? 'foglio' : 'odonimo');
        if (input) input.focus();
    }, 50);
}

function searchByCivico() {
    const odonimo = document.getElementById("odonimo").value.trim().toUpperCase();
    const civico = document.getElementById("civico-search").value.trim();
    const errorDiv = document.getElementById("search-error");

    if (!odonimo || !civico) {
        errorDiv.textContent = "Inserire sia la via che il numero civico";
        return;
    }

    errorDiv.textContent = "";
    closeOdonimoDropdown();

    // --- percorso veloce: indice JSON completo caricato ---
    if (window._civiciIndex) {
        const viaData = window._civiciIndex[odonimo];
        if (!viaData) {
            errorDiv.textContent = `Via "${odonimo}" non trovata`;
            return;
        }
        const coords = viaData[civico];
        if (!coords) {
            const civiciDisp = Object.keys(viaData).sort((a, b) => parseInt(a) - parseInt(b)).slice(0, 10).join(', ');
            errorDiv.textContent = `Civico "${civico}" non trovato in ${odonimo}. Civici disponibili: ${civiciDisp}`;
            if (isMobile && navigator.vibrate) navigator.vibrate([100, 50, 100]);
            return;
        }
        toggleSearchPopup();
        window.map.flyTo({ center: coords, zoom: 17, duration: 800 });
        placeCivicoMarker(coords);
        return;
    }

    // --- fallback: ricerca sui tile del viewport (richiede zoom ≥ 14) ---
    if (window.map.getZoom() < 14) {
        errorDiv.textContent = "Dati civici non ancora caricati. Aumenta lo zoom (almeno livello 14) e riprova.";
        return;
    }

    errorDiv.textContent = "Ricerca in corso…";

    const doSearch = () => {
        const features = window.map.querySourceFeatures("civici", { sourceLayer: "civici_wgs84" });

        if (features.length === 0) {
            errorDiv.textContent = "Nessun civico nell'area visibile. Aumenta lo zoom e riprova.";
            return;
        }

        const viaFeatures = features.filter(f => (f.properties.Odonimo || "").toUpperCase() === odonimo);

        if (viaFeatures.length === 0) {
            const sample = [...new Set(features.map(f => f.properties.Odonimo).filter(Boolean))].sort().slice(0, 3).join(', ');
            errorDiv.textContent = `Via "${odonimo}" non trovata nell'area. Vie caricate: ${sample}`;
            return;
        }

        const match = viaFeatures.find(f => String(f.properties.Civico || "").trim() === civico);

        if (!match) {
            const civiciDisp = [...new Set(viaFeatures.map(f => String(f.properties.Civico || "").trim()))].sort((a, b) => parseInt(a) - parseInt(b)).slice(0, 10).join(', ');
            errorDiv.textContent = `Civico "${civico}" non trovato in ${odonimo}. Civici nell'area: ${civiciDisp}`;
            if (isMobile && navigator.vibrate) navigator.vibrate([100, 50, 100]);
            return;
        }

        errorDiv.textContent = "";
        toggleSearchPopup();
        window.map.flyTo({ center: match.geometry.coordinates, zoom: 17, duration: 800 });
        placeCivicoMarker(match.geometry.coordinates);
    };

    if (window.map.loaded()) {
        doSearch();
    } else {
        window.map.once('idle', doSearch);
    }
}

function searchParticella() {
    const foglio = document.getElementById("foglio").value;
    const particella = document.getElementById("particella").value;
    const errorDiv = document.getElementById("search-error");
    const pdfTab = document.getElementById("pdf-tab");
    const pdfCmd = document.getElementById("pdf-cmd");

    if (!foglio || !particella) {
        errorDiv.textContent = "Inserire sia il Foglio che la Particella";
        if (pdfTab) pdfTab.style.display = "none";
        if (pdfCmd) pdfCmd.style.display = "none";
        
        if (isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        return;
    }

    const features = window.map.querySourceFeatures("catasto", {
        sourceLayer: "particelle",
        filter: ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]
    });

    if (features.length > 0) {
        errorDiv.textContent = "";
        window.currentParticella = {
            foglio: foglio,
            particella: particella,
            bounds: features[0].geometry.coordinates[0],
            center: features[0].geometry.coordinates[0].reduce(
                (bounds, coord) => bounds.extend(coord),
                new maplibregl.LngLatBounds(features[0].geometry.coordinates[0][0], features[0].geometry.coordinates[0][0])
            ).getCenter()
        };

        if (pdfTab) pdfTab.style.display = "flex";
        if (pdfCmd) pdfCmd.style.display = "flex";

        const coordinates = features[0].geometry.coordinates[0];
        const bounds = coordinates.reduce(
            (bounds, coord) => bounds.extend(coord),
            new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );

        const padding = isMobile ? 20 : 50;
        const maxZoom = isMobile ? 16.5 : 17.5;
        
        window.map.fitBounds(bounds, { padding: padding, maxZoom: maxZoom });

        if (window.map.getLayer("highlighted-polygon")) {
            window.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
        }

        const popup = new maplibregl.Popup({
            closeOnClick: true,
            offset: isMobile ? [0, -10] : [0, 0],
            maxWidth: isMobile ? '280px' : '300px'
        })
            .setLngLat(bounds.getCenter())
            .setHTML(`<div style="text-align: center; padding: 5px;"><b>Particelle catastali</b><br><b>Foglio:</b> ${foglio}<br><b>Particella:</b> ${particella}</div>`)
            .addTo(window.map);

        toggleSearchPopup();
        
        if (isMobile && navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
    } else {
        errorDiv.textContent = "Nessuna particella trovata con i parametri specificati o la particella richiesta non è visibile nell'area corrente";
        if (pdfTab) pdfTab.style.display = "none";
        if (pdfCmd) pdfCmd.style.display = "none";
        
        if (window.map.getLayer("highlighted-polygon")) {
            window.map.setFilter("highlighted-polygon", ["==", "id", ""]);
        }
        
        if (isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
}

// =========================
// FUNZIONI SIDEPANEL OTTIMIZZATE PER MOBILE - FIXED
// =========================
function toggleBackToTopVisibility() {
    const backToTopBtn = document.getElementById('back-to-top');
    const sidepanelContent = document.getElementById('sidepanel-content');
    
    if (!backToTopBtn || !sidepanelContent) return;
    
    // Mostra il button se si è scrollato oltre 200px nel sidepanel
    if (sidepanelContent.scrollTop > 200) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
}

function scrollToTop() {
    const sidepanelContent = document.getElementById('sidepanel-content');
    if (sidepanelContent) {
        sidepanelContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function toggleSidepanel() {
    const badge = document.getElementById('info-badge');
    if (badge) badge.remove();

    const sidepanel = document.getElementById('sidepanel');
    const backToTopBtn = document.getElementById('back-to-top');
    const isActive = sidepanel.classList.toggle('active');
    
    // Gestisci visibilità e z-index del back-to-top button
    if (backToTopBtn) {
        if (isActive) {
            backToTopBtn.style.zIndex = '10002';
            // Mostra subito il button quando il sidepanel si apre
            setTimeout(() => {
                backToTopBtn.classList.add('show');
            }, 300);
        } else {
            backToTopBtn.style.zIndex = '10001';
            // Nascondi il button quando il sidepanel si chiude
            backToTopBtn.classList.remove('show');
        }
    }
    
    if (isMobile) {
        if (isActive) {
            if (window.map) {
                window.map.scrollZoom.disable();
                window.map.dragPan.disable();
            }
            document.body.style.overflow = 'hidden';
        } else {
            if (window.map) {
                window.map.scrollZoom.enable();
                window.map.dragPan.enable();
            }
            document.body.style.overflow = '';
        }
    }
    
    if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.sidepanel-section');
    const buttons = document.querySelectorAll('#sidepanel-tabs button');
    
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        setTimeout(() => {
            targetSection.classList.add('active');
        }, 10);
    }
    
    event.target.classList.add('active');
    
    const content = document.getElementById('sidepanel-content');
    if (content) {
        content.scrollTop = 0;
    }
    
    if (isMobile && navigator.vibrate) {
        navigator.vibrate(30);
    }
}

// =========================
// FUNZIONI PDF OTTIMIZZATE PER MOBILE
// =========================
function calculateAreasAndIntersections(features) {
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

async function generatePDF() {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isMobile && isPortrait) {
        alert("Per generare il file PDF con le informazioni richieste, ruotare il dispositivo in orientamento orizzontale (modalità landscape).");
        return;
    }
    
    if (!window.currentParticella) {
        alert("Nessuna particella selezionata.");
        return;
    }
    
    if (isMobile && navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    const waitPopup = document.getElementById("pdf-wait-popup");
    waitPopup.style.display = "flex";
    
    // Disabilita temporaneamente gli eventi mouse/touch
    window.map.off("mouseenter", "Particelle catastali");
    window.map.off("mousemove");
    if (isMobile) {
        window.map.off("touchstart");
    }
    
    // Rimuovi highlight temporaneamente
    if (window.map.getLayer("highlighted-polygon")) {
        window.map.setFilter("highlighted-polygon", ["==", "id", ""]);
    }
    
    try {
        const { jsPDF } = window.jspdf;
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
        doc.text(`Foglio: ${window.currentParticella.foglio}`, margin, margin + 30);
        doc.text(`Particella: ${window.currentParticella.particella}`, margin, margin + 35);
        
        const bounds = window.currentParticella.bounds;
        if (!bounds || bounds.length === 0) {
            alert("Bounds della particella non validi.");
            waitPopup.style.display = "none";
            return;
        }
        
        // Zoom sulla particella con padding ottimizzato
        const padding = isMobile ? 20 : 50;
        const maxZoom = isMobile ? 16.5 : 17.5;
        window.map.fitBounds(bounds, { padding: padding, maxZoom: maxZoom });
        
        // Aggiungi layer temporanei per evidenziare la particella
        window.map.addLayer({
            id: "highlighted-polygon-pdf",
            type: "fill",
            source: "catasto",
            "source-layer": "particelle",
            paint: {
                "fill-color": "#ffff00",
                "fill-opacity": 0.3
            },
            filter: ["all", ["==", "Foglio", window.currentParticella.foglio], ["==", "Paricella", window.currentParticella.particella]]
        });
        
        window.map.addLayer({
            id: "highlighted-polygon-outline-pdf",
            type: "line",
            source: "catasto",
            "source-layer": "particelle",
            paint: {
                "line-color": "#000000",
                "line-width": 4
            },
            filter: ["all", ["==", "Foglio", window.currentParticella.foglio], ["==", "Paricella", window.currentParticella.particella]]
        });
        
        // Data di generazione
        const now = new Date();
        doc.setFontSize(8);
        doc.text(`Documento generato il ${now.toLocaleDateString()} alle ${now.toLocaleTimeString()}`, margin, margin + 45);
        
        // Aspetta che la mappa si stabilizzi
        window.map.once("idle", async () => {
            try {
                // Cattura la mappa
                const mapCanvas = window.map.getCanvas();
                const mapImage = mapCanvas.toDataURL("image/png");
                
                if (!mapImage || mapImage === "data:,") {
                    throw new Error("Errore durante la generazione dell'immagine della mappa.");
                }
                
                // Aggiungi immagine della mappa
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (mapCanvas.height / mapCanvas.width) * imgWidth;
                doc.addImage(mapImage, "PNG", margin, margin + 48, imgWidth, imgHeight);
                
                // Disclaimer e fonte dati
                const disclaimerText = `Fonte dati catastali S.I.T.R. Sicilia - Ultimo aggiornamento Agosto 2025, rilasciati con licenza CC-BY 4.0.
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
                const center = window.currentParticella.center;
                const point = window.map.project(center);
                const features = window.map.queryRenderedFeatures(point, {
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
                    const areaData = calculateAreasAndIntersections(features);
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
                if (window.map.getLayer("highlighted-polygon-pdf")) {
                    window.map.removeLayer("highlighted-polygon-pdf");
                }
                if (window.map.getLayer("highlighted-polygon-outline-pdf")) {
                    window.map.removeLayer("highlighted-polygon-outline-pdf");
                }
                
                // Ripristina eventi mouse/touch
                setupMapInteractions();
                
                // Salva il PDF
                doc.save(`particella_${window.currentParticella.foglio}_${window.currentParticella.particella}.pdf`);
                
                // Feedback vibrazione successo su mobile
                if (isMobile && navigator.vibrate) {
                    navigator.vibrate([50, 30, 50, 30, 50]);
                }
                
            } catch (error) {
                console.error("Errore durante la generazione del PDF:", error);
                waitPopup.style.display = "none";
                alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
                
                // Rimuovi layer temporanei in caso di errore
                try {
                    if (window.map.getLayer("highlighted-polygon-pdf")) {
                        window.map.removeLayer("highlighted-polygon-pdf");
                    }
                    if (window.map.getLayer("highlighted-polygon-outline-pdf")) {
                        window.map.removeLayer("highlighted-polygon-outline-pdf");
                    }
                } catch (e) {
                    console.log("Errore nella pulizia layer temporanei:", e);
                }
                
                // Feedback vibrazione errore su mobile
                if (isMobile && navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
        });
        
    } catch (error) {
        console.error("Errore generale nella generazione PDF:", error);
        waitPopup.style.display = "none";
        alert("Errore generale durante la generazione del PDF.");
        
        if (isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
}

// =========================
// SETUP INTERAZIONI MAPPA
// =========================
function setupMapInteractions() {
    // Mouse interactions per desktop
    if (!isMobile) {
        window.map.on("mouseenter", "Particelle catastali", e => {
            if (e.features.length > 0) {
                window.map.getCanvas().style.cursor = "pointer";
                const foglio = e.features[0].properties.Foglio;
                const particella = e.features[0].properties.Paricella;
                window.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
            }
        });

        window.map.on("mousemove", e => {
            const features = window.map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] });
            if (features.length > 0) {
                const feature = features[0];
                const foglio = feature.properties.Foglio;
                const particella = feature.properties.Paricella;
                window.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
            } else {
                window.map.setFilter("highlighted-polygon", ["==", "id", ""]);
            }
        });
    } else {
        // Touch interactions per mobile
        let touchTimeout;
        
        window.map.on("touchstart", e => {
            clearTimeout(touchTimeout);
            touchTimeout = setTimeout(() => {
                const features = window.map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] });
                if (features.length > 0) {
                    const feature = features[0];
                    const foglio = feature.properties.Foglio;
                    const particella = feature.properties.Paricella;
                    window.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
                    
                    // Feedback vibrazione
                    if (navigator.vibrate) {
                        navigator.vibrate(30);
                    }
                }
            }, 100);
        });
        
        window.map.on("touchend", () => {
            clearTimeout(touchTimeout);
        });
    }
}

// =========================
// EVENT LISTENERS E INIZIALIZZAZIONE OTTIMIZZATI CON GESTIONE ERRORI
// =========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Mobile-Optimized Catasto Interface Loaded');
    
    try {
        detectMobile();

        const foglioInput = document.getElementById("foglio");
        const particellaInput = document.getElementById("particella");
        
        if (foglioInput) {
            foglioInput.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    searchParticella();
                }
            });
        }
        
        if (particellaInput) {
            particellaInput.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    searchParticella();
                }
            });
        }

        const odonimoInput = document.getElementById("odonimo");
        const civicoSearchInput = document.getElementById("civico-search");

        if (odonimoInput) {
            odonimoInput.addEventListener("input", function() {
                const val = this.value.trim().toUpperCase();
                if (val.length < 3 || !window._odonomiList) {
                    closeOdonimoDropdown();
                    return;
                }
                const matches = window._odonomiList.filter(o => o.includes(val)).slice(0, 12);
                renderOdonimoDropdown(matches);
            });

            odonimoInput.addEventListener("keydown", function(e) {
                const dropdown = document.getElementById("odonimo-dropdown");
                const items = dropdown.querySelectorAll(".odonimo-option");
                const active = dropdown.querySelector(".odonimo-option.highlighted");
                const idx = active ? Array.from(items).indexOf(active) : -1;

                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = items[idx + 1] || items[0];
                    if (next) { if (active) active.classList.remove("highlighted"); next.classList.add("highlighted"); next.scrollIntoView({ block: "nearest" }); }
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const prev = items[idx - 1] || items[items.length - 1];
                    if (prev) { if (active) active.classList.remove("highlighted"); prev.classList.add("highlighted"); prev.scrollIntoView({ block: "nearest" }); }
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (active) { selectOdonimo(active.textContent); } else { searchByCivico(); }
                } else if (e.key === "Escape") {
                    closeOdonimoDropdown();
                }
            });
        }

        if (civicoSearchInput) {
            civicoSearchInput.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    searchByCivico();
                }
            });
        }

        document.addEventListener("click", function(e) {
            if (!e.target.closest("#search-mode-civico")) closeOdonimoDropdown();
        });
        
        // AGGIUNGI EVENT LISTENER PER LO SCROLL DEL SIDEPANEL
        const sidepanelContent = document.getElementById('sidepanel-content');
        if (sidepanelContent) {
            sidepanelContent.addEventListener('scroll', toggleBackToTopVisibility);
        }
        
        // ASSICURATI CHE IL BACK-TO-TOP BUTTON SIA NASCOSTO INIZIALMENTE
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            backToTopBtn.classList.remove('show');
        }
        
        if (isMobile) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    detectMobile();
                    if (window.map) {
                        window.map.resize();
                    }
                }, 500);
            });
            
            window.addEventListener('resize', () => {
                detectMobile();
                if (window.map) {
                    window.map.resize();
                }
            });
        }
        
        console.log('Layer states initialized:', layerStates);
        console.log('Mobile mode:', isMobile);
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
        hideLoader();
    }
    
    // TIMEOUT DI SICUREZZA: Nasconde sempre il loader dopo 2 secondi
    setTimeout(() => {
        hideLoader();
    }, 2000);
    
    // BACKUP FINALE: Forza la rimozione del loader dopo 4 secondi
    setTimeout(() => {
        const loader = document.getElementById('custom-loader');
        if (loader) {
            loader.style.display = 'none';
            console.log('Loader forzatamente rimosso');
        }
    }, 4000);
	
	const sidepanelContent = document.getElementById('sidepanel-content');
if (sidepanelContent) {
    sidepanelContent.addEventListener('scroll', () => {
        if (sidepanelContent.scrollTop > 10) {
            sidepanelContent.classList.add('scrolling');
        } else {
            sidepanelContent.classList.remove('scrolling');
        }
    });
}
});

// =========================
// INIZIALIZZAZIONE MAPPA PRINCIPALE OTTIMIZZATA
// =========================
try {
    if (typeof pmtiles === 'undefined') {
        console.error('PMTiles non caricato');
        hideLoader();
    }
    
    if (typeof maplibregl === 'undefined') {
        console.error('MapLibre GL non caricato');
        hideLoader();
    }

    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    const map = new maplibregl.Map({
        container: "map",
        style: {
            version: 8,
            glyphs: "https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=eyJ1IjoiZ2J2aXRyYW5vIiwiYSI6ImNtNWpwMDloejBtN3ozM3F3NzJvZGh2ZG4ifQ.AXXkYYL7XY6RBVXpJ2IrBA",
            sources: {
                "raster-tiles": {
                    type: "raster",
                    tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors, © CARTO'
                }
            },
            layers: [
                {
                    id: "raster-tiles-layer",
                    type: "raster",
                    source: "raster-tiles",
                    minzoom: 10,
                    maxzoom: 22
                }
            ]
        },
        center: [13.33225, 38.14074],
        zoom: isMobile ? 11 : 12,
        maxBounds: [[13.1, 37.9785], [13.55, 38.2919]],
        hash: true,
        pitch: 0,
        dragRotate: false,
        preserveDrawingBuffer: true,
        touchZoomRotate: true,
        touchPitch: false
    });

    window.map = map;

map.addControl(new maplibregl.NavigationControl({ 
    showCompass: !isMobile, 
    showZoom: true 
}), "top-left");

if (!isMobile) {
    map.addControl(new maplibregl.FullscreenControl(), "top-left");
}
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on('load', () => {
        try {
            hideLoader();
            console.log('Mappa caricata con successo');
            initializeMapLayers();
            loadCiviciIndex('civici_index.json');
        } catch (error) {
            console.error('Errore durante il caricamento dei layer:', error);
            hideLoader();
        }
    });

    map.on('error', (e) => {
        console.error('Errore mappa:', e);
        hideLoader();
    });

} catch (error) {
    console.error('Errore durante l\'inizializzazione della mappa:', error);
    hideLoader();
}

// =========================
// HELPER: CARD GENERICA PER TUTTI I LAYER NON-OMI
// =========================
function buildInfoCard(iconClass, title, rows) {
    const rowsHTML = rows
        .filter(r => r.val != null && r.val !== 'N/A' && r.val !== '' && r.val !== 'NULL')
        .map(r => `<div class="info-row"><span class="info-lbl">${r.lbl}</span><span class="info-val">${r.val}</span></div>`)
        .join('');
    return `<div class="info-card">
        <div class="info-card-hdr"><i class="${iconClass}"></i><span>${title}</span></div>
        <div class="info-card-body">${rowsHTML}</div>
    </div>`;
}

// HELPER: POPUP QUOTAZIONI OMI
// Accetta un array di feature (una per tipologia immobiliare) della stessa zona
// =========================
function buildOMIPopup(omiFeatures) {
    if (!omiFeatures || omiFeatures.length === 0) return '';
    const p0 = omiFeatures[0].properties;

    // Converte valori numerici anche se salvati come stringa con virgola decimale (es. "1,4")
    const parseOMI = v => {
        if (v == null) return null;
        const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
        return isNaN(n) ? null : n;
    };

    const zona     = p0.Zona_OMI || p0.Zona || '—';
    const fascia      = p0.Fascia || p0.Fasce || '—';
    const fasciaDescr = (p0.Fascia_Descr || '').replace(/^'|'$/g, '').trim();
    const descr    = (p0.Zona_Descr || '').replace(/^'|'$/g, '').trim();
    const microzona = p0.Microzona;
    const semestre = p0.Anno_Semestre ? `OMI ${p0.Anno_Semestre.replace(' / ', ' S')}` : 'OMI 2025 S2';
    const tipoPrev  = (p0.Descr_tip_prev || '').replace(/^'|'$/g, '').trim();
    const codTipPrev = p0.Cod_tip_prev || '';
    const supMap   = { 'L': 'sup.lorda', 'N': 'sup.netta' };

    const tipiHTML = omiFeatures.map(f => {
        const p    = f.properties;
        const tipo  = (p.Descr_Tipologia || '—').replace(/^'|'$/g, '').trim();
        const stato = p.Stato || '';
        const cMin  = parseOMI(p.Compr_min), cMax = parseOMI(p.Compr_max);
        const lMin  = parseOMI(p.Loc_min),   lMax = parseOMI(p.Loc_max);
        const supC  = supMap[p.Sup_NL_compr] || '';
        const supL  = supMap[p.Sup_NL_loc]   || '';
        const compStr = (cMin != null && cMax != null)
            ? `${cMin.toLocaleString('it-IT')} – ${cMax.toLocaleString('it-IT')} €/m²${supC ? ` <small class="omi-sup">(${supC})</small>` : ''}` : '—';
        const locStr = (lMin != null && lMax != null)
            ? `${lMin.toLocaleString('it-IT')} – ${lMax.toLocaleString('it-IT')} €/m²/mese${supL ? ` <small class="omi-sup">(${supL})</small>` : ''}` : '—';
        const previewStr = cMin != null && cMax != null
            ? `${cMin.toLocaleString('it-IT')}–${cMax.toLocaleString('it-IT')} €/m²` : '';
        return `
        <details class="omi-tipo">
            <summary class="omi-tipo-summary">
                <span class="omi-tipo-name">${tipo}</span>
                ${stato ? `<em class="omi-stato-tag">${stato}</em>` : ''}
                ${previewStr ? `<span class="omi-tipo-preview">${previewStr}</span>` : ''}
            </summary>
            <div class="omi-tipo-body">
                <div class="omi-tipo-values">
                    <div><span class="omi-val-lbl">Compravendita</span><br><span class="omi-val">${compStr}</span></div>
                    <div><span class="omi-val-lbl">Locazione</span><br><span class="omi-val">${locStr}</span></div>
                </div>
            </div>
        </details>`;
    }).join('');

    const fasciaDisplay = fasciaDescr ? `${fascia} – ${fasciaDescr}` : fascia;

    return `
    <div class="info-card">
        <div class="info-card-hdr">
            <i class="fas fa-euro-sign"></i>
            <span>Quotazioni OMI</span>
            <span class="omi-zona-badge">Zona ${zona}</span>
        </div>
        <div class="info-card-body">
            <div class="info-row"><span class="info-lbl">Fascia</span><span class="info-val">${fasciaDisplay}</span></div>
            <div class="info-row"><span class="info-lbl">Descrizione</span><span class="info-val">${descr}</span></div>
            ${microzona != null && microzona !== '' ? `<div class="info-row"><span class="info-lbl">Microzona</span><span class="info-val">${microzona}</span></div>` : ''}
        </div>
        <details class="omi-main-details">
            <summary class="omi-main-summary">
                <i class="fas fa-home"></i>
                Tipo prevalente: <b>${codTipPrev ? `[${codTipPrev}] ` : ''}${tipoPrev || '—'}</b>
            </summary>
            <div class="omi-tipi">${tipiHTML}</div>
            <div class="omi-footer">Fonte: Agenzia delle Entrate — ${semestre}</div>
        </details>
    </div>`;
}

// =========================
// INIZIALIZZAZIONE LAYER MAPPA COMPLETA
// =========================
function initializeMapLayers() {
    try {
        // AGGIUNGI TUTTE LE SOURCES
        window.map.addSource("prg", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/particelle/prg.pmtiles"
        });

        window.map.addSource("catasto", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/particelle/particelle_0226.pmtiles",
            attribution: "Catasto - fonte dati <b>SITR Sicilia - Agenzia delle Entrate</b>"
        });

        window.map.addSource("zone_omi", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/civici/Zone_OMI_2025_II.pmtiles",
            attribution: "Zone OMI 2025 S2 - <b>Agenzia delle Entrate</b>"
        });

        window.map.addSource("civici", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/civici/civici_0226.pmtiles",
            attribution: "Numeri Civici - fonte dati <b>SITR Sicilia</b>"
        });

        window.map.addSource("satellite", {
            type: "raster",
            tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
            tileSize: 256,
            attribution: "Immagini ©2025 Google - "
        });

        window.map.addSource("zto", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/ZTO/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: 'Comune di Palermo - Variante Generale al P.R.G. 2004 - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia">@opendatasicilia</a>',
            minzoom: 12,
            maxzoom: 19
        });

        window.map.addSource("ppe", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/ppe/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 19
        });

        window.map.addSource("vincoli_lin", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/VL/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 19
        });

        window.map.addSource("vincoli_ar", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/VA/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 19
        });

        window.map.addSource("carta_tecnica", {
            type: "raster",
            tiles: ["https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© Carta Tecnica Layer",
            minzoom: 12,
            maxzoom: 19
        });

        // AGGIUNGI LAYER RASTER (Sotto i layer vector)
        const rasterLayers = [
            { id: "satellite-layer", source: "satellite", visibility: "none" },
            { id: "carta_tecnica", source: "carta_tecnica", visibility: "none" },
            { id: "zto", source: "zto" },
            { id: "ppe", source: "ppe" },
            { id: "vincoli_lin", source: "vincoli_lin" },
            { id: "vincoli_ar", source: "vincoli_ar" }
        ];

        rasterLayers.forEach(layer => {
            window.map.addLayer({
                id: layer.id,
                type: "raster",
                source: layer.source,
                minzoom: 0,
                maxzoom: 22,
                layout: { visibility: layer.visibility || "visible" }
            });
        });

        // AGGIUNGI LAYER VECTOR (Sopra i layer raster)
        const vectorLayers = [
            // Zone OMI prima di tutto: rimane sotto tutti gli altri layer vettoriali
            {
                id: "Zone OMI",
                source: "zone_omi",
                sourceLayer: "Zone_OMI_2025_II",
                color: "rgba(22,160,133,0.15)",
                tooltip: "omi"
            },
            {
                id: "cs",
                source: "prg",
                sourceLayer: "cs",
                color: "#ffffff",
                tooltip: "<b>Circoscrizione:</b> {{Circoscriz}}"
            },
            {
                id: "Info Vin. areali",
                source: "prg",
                sourceLayer: "va",
                color: "#ffffff",
                tooltip: "<b>Tipo:</b> {{tipo}}<br><b>Descrizione:</b> {{descrizone}}<br><b>Note:</b> {{note}}"
            },
            {
                id: "Info Vin. lineari",
                source: "prg",
                sourceLayer: "vl",
                color: "#ffffff",
                tooltip: "<b>Tipo:</b> {{TIPO}}<br><b>Descrizione:</b> {{DESCRIZION}}<br><b>Note:</b> {{note}}"
            },
            {
                id: "Info Netto storico",
                source: "prg",
                sourceLayer: "ns",
                color: "#ffffff",
                tooltip: "<b>Netto storico</b><br><b>ZTO:</b> {{ZTO}}<br><b>Descrizione:</b> {{DESCRIZION}}"
            },
            {
                id: "Info ZTO",
                source: "prg",
                sourceLayer: "zto",
                color: "#ffffff",
                tooltip: "<b>Zonizzazione</b><br><b>ZTO:</b> {{ZTO}}<br><b>Descrizione:</b> {{DESCRIZION}}"
            },
            {
                id: "Particelle catastali",
                source: "catasto",
                sourceLayer: "particelle",
                color: "#ffffff",
                tooltip: "<b>Particelle catastali</b><br><b>Foglio:</b> {{Foglio}}<br><b>Particella:</b> {{Paricella}}"
            }
        ];

        vectorLayers.forEach(layer => {
            if (layer.id === "Zone OMI") {
                // Colori esatti da zone_omi.sld (campo Zona_OMI)
                const omiColorMatch = [
                    "match", ["get", "Zona_OMI"],
                    // B zones – rosso/rosa
                    "B2",  "#66333b",
                    "B3",  "#b3243b",
                    "B4",  "#994d59",
                    "B7",  "#e64561",
                    "B12", "#662933",
                    "B13", "#b34759",
                    "B14", "#ff8094",
                    "B15", "#cc5266",
                    "B16", "#e6173b",
                    "B17", "#ff4d6b",
                    "B18", "#660a1a",
                    "B19", "#cc6678",
                    "B20", "#99001a",
                    "B21", "#803340",
                    "B22", "#ff6680",
                    "B23", "#e65c73",
                    // C zones – giallo
                    "C1",  "#ffff00",
                    "C3",  "#d9d942",
                    "C4",  "#f2f23d",
                    "C5",  "#d9d90a",
                    "C7",  "#e6e624",
                    "C10", "#f2f21a",
                    "C11", "#f2f224",
                    "C12", "#99992e",
                    // D zones – blu
                    "D1",  "#002bff",
                    "D3",  "#1f00b3",
                    "D4",  "#0029f2",
                    "D8",  "#000099",
                    "D9",  "#0d0d80",
                    "D10", "#401aff",
                    "D11", "#5433ff",
                    "D12", "#6b4dff",
                    "D13", "#0029f2",
                    "D14", "#1a3df2",
                    // E zones – versioni chiare per visibilità semi-trasparente
                    "E1",  "#a89ab8",
                    "E2",  "#f5ffff",
                    "E3",  "#c8bebe",
                    "E4",  "#d8d8e0",
                    "E5",  "#8a9898",
                    "E6",  "#9a8a9a",
                    "E9",  "#ebe0e0",
                    "E11", "#7a6a7a",
                    "E14", "#787878",
                    "E15", "#78788a",
                    "E19", "#7a6a6a",
                    "E20", "#8a7878",
                    "E21", "#8a788a",
                    "E22", "#8a7898",
                    "E23", "#8a8a78",
                    // R zones – verde
                    "R1",  "#00ff00",
                    "R2",  "#2e992e",
                    // fallback
                    "#323232"
                ];
                // Inserisce Zone OMI PRIMA del satellite (e di tutti i raster overlay)
                // così ZTO, vincoli e particelle vengono renderizzati sopra le zone OMI
                window.map.addLayer({
                    id: layer.id,
                    type: "fill",
                    source: layer.source,
                    "source-layer": layer.sourceLayer,
                    layout: { visibility: "none" },
                    paint: {
                        "fill-color": omiColorMatch,
                        "fill-opacity": 0.15
                    }
                }, 'carta_tecnica');
                window.map.addLayer({
                    id: "Zone OMI-line",
                    type: "line",
                    source: layer.source,
                    "source-layer": layer.sourceLayer,
                    layout: { visibility: "none" },
                    paint: {
                        "line-color": "#232323",
                        "line-width": 0.5
                    }
                }, 'carta_tecnica');
                window.map.addLayer({
                    id: "Zone OMI-labels",
                    type: "symbol",
                    source: layer.source,
                    "source-layer": layer.sourceLayer,
                    layout: {
                        "text-field": ["get", "Zona_OMI"],
                        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 9, 14, 13],
                        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                        "text-allow-overlap": false,
                        "text-ignore-placement": false,
                        "text-anchor": "center",
                        visibility: "none"
                    },
                    paint: {
                        "text-color": "#111111",
                        "text-halo-color": "#ffffff",
                        "text-halo-width": 1.5
                    },
                    minzoom: 9
                }, 'carta_tecnica');
            } else {
                window.map.addLayer({
                    id: layer.id,
                    type: "fill",
                    source: layer.source,
                    "source-layer": layer.sourceLayer,
                    paint: {
                        "fill-color": layer.color,
                        "fill-opacity": layer.id === "Particelle catastali" ? 0.6 : 0,
                        "fill-outline-color": layer.id === "Particelle catastali" ? "#000" : "transparent"
                    }
                });
            }
        });

        // AGGIUNGI LAYER LABELS PARTICELLE (ottimizzato per mobile)
        window.map.addLayer({
            id: "particelle-labels",
            type: "symbol",
            source: "catasto",
            "source-layer": "particelle",
            layout: {
                "text-field": ["concat", "F. ", ["get", "Foglio"], " - ", "P. ", ["get", "Paricella"]],
                "text-size": ["interpolate", ["linear"], ["zoom"], 15, isMobile ? 4 : 5, 19, isMobile ? 10 : 12],
                "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-anchor": "center",
                "text-offset": [0, 0.5],
                visibility: "none"
            },
            paint: {
                "text-color": "#000000",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1
            },
            minzoom: isMobile ? 16 : 15
        });

        // AGGIUNGI LAYER HIGHLIGHT PARTICELLE
        window.map.addLayer({
            id: "highlighted-polygon",
            type: "fill",
            source: "catasto",
            "source-layer": "particelle",
            paint: {
                "fill-color": "#ffff00",
                "fill-opacity": 0.5,
                "fill-outline-color": "#ff0000"
            },
            filter: ["==", "id", ""]
        });

        // AGGIUNGI LAYER NUMERI CIVICI (in cima allo stack per click detection)
        window.map.addLayer({
            id: "Numeri Civici",
            type: "symbol",
            source: "civici",
            "source-layer": "civici_wgs84",
            minzoom: 14,
            layout: {
                "text-field": ["case",
                    ["all",
                        ["has", "Esponente"],
                        ["!=", ["get", "Esponente"], null],
                        ["!=", ["get", "Esponente"], "NULL"],
                        ["!=", ["get", "Esponente"], ""]
                    ],
                    ["concat", ["get", "Civico"], "/", ["get", "Esponente"]],
                    ["get", "Civico"]
                ],
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    14, isMobile ? 7 : 8,
                    16, isMobile ? 9 : 11,
                    18, isMobile ? 11 : 13,
                    20, isMobile ? 13 : 15
                ],
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-anchor": "center",
                "visibility": "none"
            },
            paint: {
                "text-color": "#c0392b",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.5
            }
        });

        // INIZIALIZZA I PULSANTI DEI LAYER
        initLayerButtons();
        
        // IMPOSTA STATO INIZIALE DEI LAYER
        Object.keys(layerStates).forEach(layerId => {
            const mapLayerId = layerMapping[layerId];
            if (mapLayerId && window.map.getLayer(mapLayerId)) {
                window.map.setLayoutProperty(
                    mapLayerId, 
                    'visibility', 
                    layerStates[layerId] ? 'visible' : 'none'
                );
                
                // Aggiorna l'interfaccia
                const button = document.getElementById(layerId);
                if (button) {
                    if (layerStates[layerId]) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                }
                
                // Gestione speciale per le particelle
                if (layerId === 'particelle') {
                    window.map.setLayoutProperty(
                        'particelle-labels', 
                        'visibility', 
                        layerStates[layerId] ? 'visible' : 'none'
                    );
                }
            }
        });

        // CLICK EVENT PER POPUP UNIFICATO OTTIMIZZATO PER MOBILE
        window.map.on("click", e => {
            const features = window.map.queryRenderedFeatures(e.point, {
                layers: ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Zone OMI", "Particelle catastali", "Numeri Civici"]
            });

            if (features.length > 0) {
                if (currentPopup) {
                    currentPopup.remove();
                    currentPopup = null;
                }

                // Raggruppa le feature OMI per Zona_OMI (più tipologie per zona)
                const omiByZona = {};
                const nonOmiFeatures = [];
                features.forEach(feature => {
                    if (feature.layer.id === "Zone OMI") {
                        const z = feature.properties.Zona_OMI || 'unknown';
                        if (!omiByZona[z]) omiByZona[z] = [];
                        omiByZona[z].push(feature);
                    } else {
                        nonOmiFeatures.push(feature);
                    }
                });

                // Costruisci contenuto: prima altri layer, poi OMI alla fine
                const omiParts = Object.values(omiByZona).map(grp => buildOMIPopup(grp));
                const otherParts = nonOmiFeatures.map(feature => {
                    const p = feature.properties;
                    if (feature.layer.id === "cs") {
                        return buildInfoCard('fas fa-city', 'Piano Urbanistico', [
                            { lbl: 'Strumento', val: 'PPE' },
                            { lbl: 'Circoscrizione', val: p.Circoscriz }
                        ]);
                    } else if (feature.layer.id === "Info Vin. areali") {
                        return buildInfoCard('fas fa-shield-alt', 'Vincolo Areale', [
                            { lbl: 'Tipo', val: p.tipo },
                            { lbl: 'Descrizione', val: p.descrizone }
                        ]);
                    } else if (feature.layer.id === "Info Vin. lineari") {
                        return buildInfoCard('fas fa-draw-polygon', 'Vincolo Lineare', [
                            { lbl: 'Tipo', val: p.TIPO },
                            { lbl: 'Descrizione', val: p.DESCRIZION }
                        ]);
                    } else if (feature.layer.id === "Info Netto storico") {
                        return buildInfoCard('fas fa-scroll', 'Netto Storico', [
                            { lbl: 'ZTO', val: p.ZTO },
                            { lbl: 'Descrizione', val: p.DESCRIZION }
                        ]);
                    } else if (feature.layer.id === "Info ZTO") {
                        return buildInfoCard('fas fa-map', 'Zonizzazione', [
                            { lbl: 'ZTO', val: p.ZTO },
                            { lbl: 'Descrizione', val: p.DESCRIZION }
                        ]);
                    } else if (feature.layer.id === "Particelle catastali") {
                        return buildInfoCard('fas fa-table-cells', 'Particella Catastale', [
                            { lbl: 'Foglio', val: p.Foglio },
                            { lbl: 'Particella', val: p.Paricella }
                        ]);
                    } else if (feature.layer.id === "Numeri Civici") {
                        const esp = p.Esponente;
                        const civico = (esp && esp !== 'NULL' && esp !== '') ? `${p.Civico}/${esp}` : p.Civico;
                        return buildInfoCard('fas fa-map-marker-alt', 'Numero Civico', [
                            { lbl: 'Civico', val: civico },
                            { lbl: 'Odonimo', val: p.Odonimo },
                            { lbl: 'Circoscrizione', val: p.Circoscrizione },
                            { lbl: 'Quartiere', val: p.Quartiere },
                            { lbl: 'UPL', val: p.UPL }
                        ]);
                    }
                    return '';
                }).filter(c => c !== '');

                const unifiedTooltipContent = [...otherParts, ...omiParts].join("<hr>");

                // Popup ottimizzato per mobile
                currentPopup = new maplibregl.Popup({
                    closeOnClick: true,
                    maxWidth: isMobile ? '320px' : '390px',
                    offset: isMobile ? [0, -10] : [0, 0]
                })
                    .setLngLat(e.lngLat)
                    .setHTML(`<div class="unified-popup" style="padding: ${isMobile ? '8px' : '10px'}; font-size: ${isMobile ? '13px' : '14px'};">${unifiedTooltipContent}</div>`)
                    .addTo(window.map);
                    
                // Feedback vibrazione su mobile
                if (isMobile && navigator.vibrate) {
                    navigator.vibrate(30);
                }
            }
        });

        // CURSOR EVENTS (solo desktop)
        if (!isMobile) {
            window.map.on("mouseenter", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Zone OMI", "Particelle catastali", "Numeri Civici"], () => {
                window.map.getCanvas().style.cursor = "pointer";
            });

            window.map.on("mouseleave", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Zone OMI", "Particelle catastali", "Numeri Civici"], () => {
                window.map.getCanvas().style.cursor = "default";
            });

            // MOUSE INTERACTIONS PER DESKTOP
            window.map.on("mouseenter", "Particelle catastali", e => {
                if (e.features.length > 0) {
                    window.map.getCanvas().style.cursor = "pointer";
                    const foglio = e.features[0].properties.Foglio;
                    const particella = e.features[0].properties.Paricella;
                    window.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
                }
            });

            window.map.on("mousemove", e => {
                const features = window.map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] });
                if (features.length > 0) {
                    const feature = features[0];
                    const foglio = feature.properties.Foglio;
                    const particella = feature.properties.Paricella;
                    window.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
                } else {
                    window.map.setFilter("highlighted-polygon", ["==", "id", ""]);
                }
            });
        } else {
            // TOUCH INTERACTIONS PER MOBILE
            let touchTimeout;
            
            window.map.on("touchstart", e => {
                clearTimeout(touchTimeout);
                touchTimeout = setTimeout(() => {
                    const features = window.map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] });
                    if (features.length > 0) {
                        const feature = features[0];
                        const foglio = feature.properties.Foglio;
                        const particella = feature.properties.Paricella;
                        window.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
                        
                        // Feedback vibrazione
                        if (navigator.vibrate) {
                            navigator.vibrate(30);
                        }
                    }
                }, 100);
            });
            
            window.map.on("touchend", () => {
                clearTimeout(touchTimeout);
            });
        }
        
        console.log('✅ Tutti i layer della mappa inizializzati correttamente');
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione dei layer:', error);
    }
}

console.log('✅ Mobile-Optimized Catasto Script Loaded Successfully');