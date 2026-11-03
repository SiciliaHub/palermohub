
// =========================
// MOBILE-OPTIMIZED CATASTO PALERMO SCRIPT
// Versione ottimizzata per dispositivi mobili
// =========================

// TEMA: ?theme=dark|light forza il tema (utile quando la pagina e' in un iframe); altrimenti segue il sistema
{
    const t = new URLSearchParams(location.search).get('theme');
    if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
}

// DATA DI AGGIORNAMENTO DEL CATASTO: unico punto da modificare.
// Viene usata nel PDF e in ogni elemento con [data-catasto-data] della pagina.
const DATA_CATASTO = 'Settembre 2026';

// VARIABILI GLOBALI
let isSatelliteOverlayOpen = false;
let satelliteMap = null;
const mqMobile = window.matchMedia('(max-width: 899px)');
let isMobile = mqMobile.matches;

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
    'basemap': null, // gestito via window.baseLayerIds (tutti i layer dello stile OpenFreeMap)
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
        }, 500);
    }
}

// =========================
// RILEVAMENTO MOBILE E ORIENTAMENTO
// =========================
function detectMobile() {
    isMobile = mqMobile.matches;
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
const PANEL_TABS = ['livelli', 'cerca', 'info'];

function openPanel(tab) {
    const panel = document.getElementById('panel');
    if (!panel) return;
    // su mobile un secondo tocco sul tab attivo chiude il pannello
    if (isMobile && panel.classList.contains('open') && panel.dataset.tab === tab) { closePanel(); return; }
    panel.dataset.tab = tab;
    panel.classList.add('open');
    PANEL_TABS.forEach(t => {
        const b = document.getElementById('tab-' + t);
        if (b) b.setAttribute('aria-selected', t === tab ? 'true' : 'false');
    });
    if (tab === 'cerca') {
        if (window._civicoMarker) { window._civicoMarker.remove(); window._civicoMarker = null; }
        setTimeout(() => { const f = document.getElementById('foglio'); if (f && !isMobile) f.focus(); }, 50);
    }
    if (tab === 'info') {
        const badge = document.getElementById('info-badge');
        if (badge) badge.remove();
    }
}

function closePanel() {
    const panel = document.getElementById('panel');
    if (!panel || !isMobile) return;
    panel.classList.remove('open');
    const b = document.getElementById('tab-' + panel.dataset.tab);
    if (b) b.focus();
}

function toggleLegend(btn) {
    const box = document.getElementById('prg-legend');
    const open = box.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Nascondi legenda PRG' : 'Mostra legenda PRG';
}

function toggleLayer(layerId) {
    if (!(layerId in layerMapping)) {
        console.warn(`Nessun mapping trovato per il layer: ${layerId}`);
        return;
    }
    
    layerStates[layerId] = !layerStates[layerId];
    
    const button = document.getElementById(layerId);
    if (button) {
        button.classList.toggle('active', layerStates[layerId]);
        if (button.getAttribute('role') === 'radio') button.setAttribute('aria-checked', layerStates[layerId] ? 'true' : 'false');
    }
    
    if (layerId === 'basemap' && window.map && Array.isArray(window.baseLayerIds)) {
        const vis = layerStates[layerId] ? 'visible' : 'none';
        window.baseLayerIds.forEach(id => {
            if (window.map.getLayer(id)) {
                window.map.setLayoutProperty(id, 'visibility', vis);
            }
        });
    } else if (window.map && window.map.getLayer(layerMapping[layerId])) {
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

const BG_LAYERS = ['basemap', 'satellite', 'carta_tecnica'];

// sfondo: una sola opzione attiva alla volta
function setBackground(id) {
    BG_LAYERS.forEach(k => { if ((k === id) !== layerStates[k]) toggleLayer(k); });
}

function initLayerButtons() {
    const vincoliMain = document.getElementById('vincoli-main');
    if (vincoliMain) vincoliMain.addEventListener('click', toggleVincoliMain);

    BG_LAYERS.forEach(id => {
        const b = document.getElementById(id);
        if (b) b.addEventListener('click', () => setBackground(id));
    });

    // etichetta "Nuovo" sui livelli recenti: sparisce al primo uso e il browser se lo ricorda
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem('catasto-seen') || '[]'); } catch (e) {}
    document.querySelectorAll('.lyr-new').forEach(tag => {
        const row = tag.closest('.lyr-row');
        if (seen.includes(row.id)) { tag.hidden = true; return; }
        row.addEventListener('click', () => {
            tag.hidden = true;
            seen.push(row.id);
            try { localStorage.setItem('catasto-seen', JSON.stringify(seen)); } catch (e) {}
        });
    });

    ['vincoli_lin', 'vincoli_ar', 'particelle', 'civici', 'zonizzazione', 'zone_omi'].forEach(layerId => {
        const button = document.getElementById(layerId);
        if (button) button.addEventListener('click', () => toggleLayer(layerId));
    });
}

// avviso accanto ai livelli che non si vedono perche' lo zoom e' troppo basso
function updateZoomHints() {
    if (!window.map) return;
    const z = window.map.getZoom();
    Object.keys(layerMapping).forEach(id => {
        const btn = document.getElementById(id);
        const lid = layerMapping[id];
        const layer = lid && window.map.getLayer(lid);
        if (!btn || !layer) return;
        const min = layer.minzoom || 0;
        if (min <= 0) return;
        let hint = btn.querySelector('.lyr-hint');
        if (!hint) {
            hint = document.createElement('span');
            hint.className = 'lyr-hint';
            btn.insertBefore(hint, btn.querySelector('.lyr-sw, .lyr-radio'));
        }
        const low = z < min;
        hint.hidden = !low;
        hint.textContent = 'da zoom ' + Math.ceil(min);
        btn.classList.toggle('out-of-zoom', low);
    });
}

// =========================
// OVERLAY SATELLITARE OTTIMIZZATO PER MOBILE
// =========================
function toggleSatelliteOverlay() {
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
        
        if (window.map) {
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
// dopo un risultato: su mobile libera la mappa, su desktop lascia il pannello com'e'
function toggleSearchPopup() { closePanel(); }

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
    document.getElementById('search-mode-foglio').hidden = mode !== 'foglio';
    document.getElementById('search-mode-civico').hidden = mode !== 'civico';
    document.getElementById('label-foglio').setAttribute('aria-pressed', mode === 'foglio' ? 'true' : 'false');
    document.getElementById('label-civico').setAttribute('aria-pressed', mode === 'civico' ? 'true' : 'false');
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

        openScheda({
            particella: { foglio, particella },
            html: buildInfoCard('Particella catastale', [{ lbl: 'Foglio', val: foglio }, { lbl: 'Particella', val: particella }], 'fas fa-table-cells') +
                '<p class="sc-src">Tocca la particella sulla mappa per vedere zonizzazione, vincoli e quotazioni OMI.</p>'
        });

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
                const disclaimerText = `Fonte dati catastali S.I.T.R. Sicilia - Ultimo aggiornamento ${DATA_CATASTO}, rilasciati con licenza CC-BY 4.0.
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
    document.querySelectorAll('[data-catasto-data]').forEach(el => { el.textContent = DATA_CATASTO; });
    const btnPart = document.getElementById('particelle');
    if (btnPart) btnPart.title = 'Ultimo aggiornamento ' + DATA_CATASTO;
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
        
        mqMobile.addEventListener('change', () => {
            detectMobile();
            if (window.map) window.map.resize();
        });

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
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [13.33225, 38.14074],
        zoom: isMobile ? 11 : 12,
        maxBounds: [[13.1, 37.9785], [13.55, 38.2919]],
        hash: true,
        pitch: 0,
        dragRotate: false,
        preserveDrawingBuffer: true,
        attributionControl: { compact: true },
        touchZoomRotate: true,
        touchPitch: false
    });

    window.map = map;

    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on('load', () => {
        try {
            hideLoader();
            console.log('Mappa caricata con successo');
            // attribuzioni compatte: chiuse finche' non si tocca il pulsante (i)
            const attrib = document.querySelector('.maplibregl-ctrl-attrib');
            if (attrib) attrib.classList.remove('maplibregl-compact-show');
            window.baseLayerIds = map.getStyle().layers.map(l => l.id);
            initializeMapLayers();
            loadCiviciIndex('civici_index.json');
            initZoomSlider();
            updateZoomHints();
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
function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildDl(rows) {
    const items = rows
        .filter(r => r.val != null && r.val !== 'N/A' && r.val !== '' && r.val !== 'NULL')
        .map(r => `<div><dt>${esc(r.lbl)}</dt><dd>${esc(r.val)}</dd></div>`)
        .join('');
    return `<dl class="sc-dl">${items}</dl>`;
}

// sezione della scheda: titolo + elenco etichetta/valore
function buildInfoCard(title, rows, icon = '') {
    const i = icon ? `<i aria-hidden="true" class="${icon}"></i>` : '';
    return `<section class="sc-sec"><h3>${i}${esc(title)}</h3>${buildDl(rows)}</section>`;
}

function setCurrentParticella(foglio, particella, geometry) {
    const coords = geometry.type === 'MultiPolygon' ? geometry.coordinates[0][0] : geometry.coordinates[0];
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    window.currentParticella = { foglio, particella, bounds: coords, center: bounds.getCenter() };
    const pdfCmd = document.getElementById('pdf-cmd');
    if (pdfCmd) pdfCmd.style.display = 'flex';
}

function openScheda({ particella, html }) {
    const el = document.getElementById('scheda');
    const title = document.getElementById('scheda-title');
    const actions = document.getElementById('scheda-actions');
    if (!el) return;
    if (particella) {
        if (particella.geometry) setCurrentParticella(particella.foglio, particella.particella, particella.geometry);
        title.textContent = `F. ${particella.foglio} · P. ${particella.particella}`;
        title.className = 'mono';
        actions.innerHTML =
            `<button type="button" class="btn" onclick="generatePDF()"><i aria-hidden="true" class="fas fa-file-pdf"></i> Scarica scheda PDF</button>` +
            `<a class="sister-btn" href="https://sister3.agenziaentrate.gov.it/" target="_blank" rel="noopener noreferrer" title="Accedi a SISTER con SPID e inserisci Foglio ${esc(particella.foglio)}, Particella ${esc(particella.particella)}"><i aria-hidden="true" class="fas fa-external-link-alt"></i> Visura su SISTER <span class="sister-coords">Fg.${esc(particella.foglio)} · P.${esc(particella.particella)}</span></a>`;
    } else {
        title.textContent = 'Informazioni sul punto';
        title.className = '';
        actions.innerHTML = '';
    }
    document.getElementById('scheda-body').innerHTML = html;
    el.hidden = false;
    el.scrollTop = 0;
    document.getElementById('scheda-body').scrollTop = 0;
    if (isMobile) closePanel();
    title.focus();
}

function closeScheda() {
    const el = document.getElementById('scheda');
    if (!el || el.hidden) return;
    el.hidden = true;
    const canvas = document.querySelector('.maplibregl-canvas');
    if (canvas) canvas.focus({ preventScroll: true });
}

// HELPER: POPUP QUOTAZIONI OMI
// Accetta un array di feature (una per tipologia immobiliare) della stessa zona
// =========================
function buildOMIPopup(omiFeatures) {
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
        <h3><i aria-hidden="true" class="fas fa-euro-sign"></i>Quotazioni OMI <span class="sc-badge">Zona ${esc(zona)}</span></h3>
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
            url: "pmtiles://https://palermohub.github.io/PRG2004/particelle/particelle.pmtiles",
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
            tiles: ["https://map.sitr.regione.sicilia.it/gis/services/ortofoto/ortofoto_2022_20cm_sicilia/ImageServer/WMSServer?service=WMS&version=1.3.0&request=GetMap&layers=0&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/jpeg"],
            tileSize: 256,
            attribution: "Ortofoto 2022 © Regione Siciliana - SITR - "
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
                        "text-font": ["Noto Sans Bold"],
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
                "text-font": ["Noto Sans Regular"],
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
                "text-font": ["Noto Sans Bold"],
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

        // CLICK: scheda unica con i dati di tutti i livelli sotto il punto
        window.map.on("click", e => {
            const features = window.map.queryRenderedFeatures(e.point, {
                layers: ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Zone OMI", "Particelle catastali", "Numeri Civici"]
            });
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
                        return buildInfoCard('Piano urbanistico', [{ lbl: 'Strumento', val: 'PPE' }, { lbl: 'Circoscrizione', val: p.Circoscriz }], 'fas fa-city');
                    case "Info Vin. areali":
                        return buildInfoCard('Vincolo areale', [{ lbl: 'Tipo', val: p.tipo }, { lbl: 'Descrizione', val: p.descrizone }], 'fas fa-shield-alt');
                    case "Info Vin. lineari":
                        return buildInfoCard('Vincolo lineare', [{ lbl: 'Tipo', val: p.TIPO }, { lbl: 'Descrizione', val: p.DESCRIZION }], 'fas fa-draw-polygon');
                    case "Info Netto storico":
                        return buildInfoCard('Netto storico', [{ lbl: 'ZTO', val: p.ZTO }, { lbl: 'Descrizione', val: p.DESCRIZION }], 'fas fa-scroll');
                    case "Info ZTO":
                        return buildInfoCard('Zonizzazione', [{ lbl: 'ZTO', val: p.ZTO }, { lbl: 'Descrizione', val: p.DESCRIZION }], 'fas fa-map');
                    case "Particelle catastali":
                        if (!part) part = f;
                        return buildInfoCard('Particella catastale', [{ lbl: 'Foglio', val: p.Foglio }, { lbl: 'Particella', val: p.Paricella }], 'fas fa-table-cells');
                    case "Numeri Civici": {
                        const esp = p.Esponente;
                        const civico = (esp && esp !== 'NULL' && esp !== '') ? `${p.Civico}/${esp}` : p.Civico;
                        return buildInfoCard('Numero civico', [
                            { lbl: 'Civico', val: civico }, { lbl: 'Odonimo', val: p.Odonimo },
                            { lbl: 'Circoscrizione', val: p.Circoscrizione }, { lbl: 'Quartiere', val: p.Quartiere }, { lbl: 'UPL', val: p.UPL }
                        ], 'fas fa-map-marker-alt');
                    }
                    default: return '';
                }
            });
            const omi = Object.values(omiByZona).map(buildOMIPopup);

            openScheda({
                particella: part ? { foglio: part.properties.Foglio, particella: part.properties.Paricella, geometry: part.geometry } : null,
                html: [...parts, ...omi].join('')
            });
            if (isMobile && navigator.vibrate) navigator.vibrate(30);
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

// =========================
// FULLSCREEN TOGGLE
// =========================
function toggleFullscreen() {
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
    if (icon) icon.className = isFs ? 'fas fa-compress' : 'fas fa-expand';
    btn.classList.toggle('active', isFs);
});

// =========================
// ZOOM SLIDER
// =========================
function initZoomSlider() {
    if (!window.map) return;
    _syncZoomUI(Math.round(window.map.getZoom()));
    window.map.on('zoom', () => {
        _syncZoomUI(Math.round(window.map.getZoom()));
        updateZoomHints();
    });
}

function resetMapHome() {
    if (!window.map) return;
    window.map.flyTo({ center: [13.33225, 38.14074], zoom: isMobile ? 11 : 12, bearing: 0, duration: 800 });
}

function resetBearing() {
    if (!window.map) return;
    window.map.easeTo({ bearing: 0, duration: 400 });
}

function _syncZoomUI(zoom) {
    const badge = document.getElementById('zoom-level-display');
    if (badge) badge.textContent = zoom;
}

console.log('✅ Mobile-Optimized Catasto Script Loaded Successfully');

// =========================
// ACCESSIBILITA': tastiera, aria-pressed, Esc
// =========================
document.addEventListener('DOMContentLoaded', () => {
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
        if (e.key !== 'Escape') return;
        const sc = document.getElementById('scheda');
        if (sc && !sc.hidden) closeScheda(); else closePanel();
    });
});
