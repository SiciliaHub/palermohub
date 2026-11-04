import { syncZoomUI } from './ui.js';
import { onMapClick } from './card.js';
import { layerMapping, layerStates, state } from './state.js';
import { syncUrl } from './urlstate.js';

export function toggleLayer(layerId) {
    if (!(layerId in layerMapping)) {
        console.warn(`Nessun mapping trovato per il layer: ${layerId}`);
        return;
    }
    
    layerStates[layerId] = !layerStates[layerId];
    syncUrl();
    
    const button = document.getElementById(layerId);
    if (button) {
        button.classList.toggle('active', layerStates[layerId]);
        if (button.getAttribute('role') === 'radio') button.setAttribute('aria-checked', layerStates[layerId] ? 'true' : 'false');
    }
    
    if (layerId === 'basemap' && state.map && Array.isArray(state.baseLayerIds)) {
        const vis = layerStates[layerId] ? 'visible' : 'none';
        state.baseLayerIds.forEach(id => {
            if (state.map.getLayer(id)) {
                state.map.setLayoutProperty(id, 'visibility', vis);
            }
        });
    } else if (state.map && state.map.getLayer(layerMapping[layerId])) {
        state.map.setLayoutProperty(
            layerMapping[layerId],
            'visibility',
            layerStates[layerId] ? 'visible' : 'none'
        );

        if (layerId === 'particelle') {
            state.map.setLayoutProperty(
                'particelle-labels',
                'visibility',
                layerStates[layerId] ? 'visible' : 'none'
            );
        }

        if (layerId === 'zone_omi') {
            if (state.map.getLayer('Zone OMI-line')) {
                state.map.setLayoutProperty(
                    'Zone OMI-line',
                    'visibility',
                    layerStates[layerId] ? 'visible' : 'none'
                );
            }
            if (state.map.getLayer('Zone OMI-labels')) {
                state.map.setLayoutProperty(
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
            if (state.map.getLayer('ppe')) {
                state.map.setLayoutProperty('ppe', 'visibility', vis);
            }
            if (state.map.getLayer('Info ZTO')) {
                state.map.setLayoutProperty('Info ZTO', 'visibility', vis);
            }
        }
    }
    
    if (state.isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

export function toggleVincoliMain() {
    // Lo stato principale è attivo se almeno uno dei due sub-layer è attivo
    const anyActive = layerStates['vincoli_lin'] || layerStates['vincoli_ar'];
    const newState = !anyActive;

    ['vincoli_lin', 'vincoli_ar'].forEach(id => {
        layerStates[id] = newState;
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('active', newState);
        if (state.map && state.map.getLayer(layerMapping[id])) {
            state.map.setLayoutProperty(layerMapping[id], 'visibility', newState ? 'visible' : 'none');
        }
    });

    const mainBtn = document.getElementById('vincoli-main');
    if (mainBtn) mainBtn.classList.toggle('active', newState);
    syncUrl();

    if (state.isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

export function syncVincoliMain() {
    const anyActive = layerStates['vincoli_lin'] || layerStates['vincoli_ar'];
    const mainBtn = document.getElementById('vincoli-main');
    if (mainBtn) mainBtn.classList.toggle('active', anyActive);
}

export const BG_LAYERS = ['basemap', 'satellite', 'carta_tecnica'];

// sfondo: una sola opzione attiva alla volta
export function setBackground(id) {
    BG_LAYERS.forEach(k => { if ((k === id) !== layerStates[k]) toggleLayer(k); });
}

export function initLayerButtons() {
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
export function updateZoomHints() {
    if (!state.map) return;
    const z = state.map.getZoom();
    Object.keys(layerMapping).forEach(id => {
        const btn = document.getElementById(id);
        const lid = layerMapping[id];
        const layer = lid && state.map.getLayer(lid);
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

export function initializeMapLayers() {
    try {
        // AGGIUNGI TUTTE LE SOURCES
        state.map.addSource("prg", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/particelle/prg.pmtiles"
        });

        state.map.addSource("catasto", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/particelle/particelle.pmtiles",
            attribution: "Catasto - fonte dati <b>SITR Sicilia - Agenzia delle Entrate</b>"
        });

        state.map.addSource("zone_omi", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/civici/Zone_OMI_2025_II.pmtiles",
            attribution: "Zone OMI 2025 S2 - <b>Agenzia delle Entrate</b>"
        });

        state.map.addSource("civici", {
            type: "vector",
            url: "pmtiles://https://palermohub.github.io/PRG2004/civici/civici_0226.pmtiles",
            attribution: "Numeri Civici - fonte dati <b>SITR Sicilia</b>"
        });

        state.map.addSource("satellite", {
            type: "raster",
            tiles: ["https://map.sitr.regione.sicilia.it/gis/services/ortofoto/ortofoto_2022_20cm_sicilia/ImageServer/WMSServer?service=WMS&version=1.3.0&request=GetMap&layers=0&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/jpeg"],
            tileSize: 256,
            attribution: "Ortofoto 2022 © Regione Siciliana - SITR - "
        });

        state.map.addSource("zto", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/ZTO/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: 'Comune di Palermo - Variante Generale al P.R.G. 2004 - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia">@opendatasicilia</a>',
            minzoom: 12,
            maxzoom: 19
        });

        state.map.addSource("ppe", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/ppe/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 19
        });

        state.map.addSource("vincoli_lin", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/VL/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 19
        });

        state.map.addSource("vincoli_ar", {
            type: "raster",
            tiles: ["https://palermohub.github.io/PRG2004/VA/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 19
        });

        state.map.addSource("carta_tecnica", {
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
            state.map.addLayer({
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
                state.map.addLayer({
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
                state.map.addLayer({
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
                state.map.addLayer({
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
                state.map.addLayer({
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
        state.map.addLayer({
            id: "particelle-labels",
            type: "symbol",
            source: "catasto",
            "source-layer": "particelle",
            layout: {
                "text-field": ["concat", "F. ", ["get", "Foglio"], " - ", "P. ", ["get", "Paricella"]],
                "text-size": ["interpolate", ["linear"], ["zoom"], 15, state.isMobile ? 4 : 5, 19, state.isMobile ? 10 : 12],
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
            minzoom: state.isMobile ? 16 : 15
        });

        // AGGIUNGI LAYER HIGHLIGHT PARTICELLE
        state.map.addLayer({
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

        // hover leggero particella: solo contorno
        state.map.addLayer({
            id: "hover-polygon",
            type: "line",
            source: "catasto",
            "source-layer": "particelle",
            paint: { "line-color": "#ff0000", "line-width": 2, "line-opacity": 0.6 },
            filter: ["==", "id", ""]
        });

        // AGGIUNGI LAYER NUMERI CIVICI (in cima allo stack per click detection)
        state.map.addLayer({
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
                    14, state.isMobile ? 7 : 8,
                    16, state.isMobile ? 9 : 11,
                    18, state.isMobile ? 11 : 13,
                    20, state.isMobile ? 13 : 15
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
            if (mapLayerId && state.map.getLayer(mapLayerId)) {
                state.map.setLayoutProperty(
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
                    state.map.setLayoutProperty(
                        'particelle-labels', 
                        'visibility', 
                        layerStates[layerId] ? 'visible' : 'none'
                    );
                }
            }
        });

        state.map.on("click", onMapClick);

        // CURSOR EVENTS (solo desktop)
        if (!state.isMobile) {
            state.map.on("mouseenter", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Zone OMI", "Particelle catastali", "Numeri Civici"], () => {
                state.map.getCanvas().style.cursor = "pointer";
            });

            state.map.on("mouseleave", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Zone OMI", "Particelle catastali", "Numeri Civici"], () => {
                state.map.getCanvas().style.cursor = "default";
            });
        }

        setupMapInteractions();
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione dei layer:', error);
    }
}

export function setupMapInteractions() {
    // Mouse interactions per desktop
    if (!state.isMobile) {
        state.map.on("mouseenter", "Particelle catastali", () => {
            state.map.getCanvas().style.cursor = "pointer";
        });

        // hover leggero: solo quando il mouse si ferma (150ms), layer separato da quello del click
        let hoverTimer, lastHover = "";
        state.map.on("mousemove", e => {
            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(() => {
                const f = state.map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] })[0];
                const key = f ? `${f.properties.Foglio}-${f.properties.Paricella}` : "";
                if (key === lastHover) return;
                lastHover = key;
                state.map.setFilter("hover-polygon", f
                    ? ["all", ["==", "Foglio", f.properties.Foglio], ["==", "Paricella", f.properties.Paricella]]
                    : ["==", "id", ""]);
            }, 150);
        });
        state.map.on("mouseout", () => { clearTimeout(hoverTimer); lastHover = ""; state.map.setFilter("hover-polygon", ["==", "id", ""]); });
    } else {
        // Touch interactions per mobile
        let touchTimeout;
        
        state.map.on("touchstart", e => {
            clearTimeout(touchTimeout);
            touchTimeout = setTimeout(() => {
                const features = state.map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] });
                if (features.length > 0) {
                    const feature = features[0];
                    const foglio = feature.properties.Foglio;
                    const particella = feature.properties.Paricella;
                    state.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
                    
                    // Feedback vibrazione
                    if (navigator.vibrate) {
                        navigator.vibrate(30);
                    }
                }
            }, 100);
        });
        
        state.map.on("touchend", () => {
            clearTimeout(touchTimeout);
        });
    }
}

export function initZoomSlider() {
    if (!state.map) return;
    syncZoomUI(Math.round(state.map.getZoom()));
    state.map.on('zoom', () => {
        syncZoomUI(Math.round(state.map.getZoom()));
        updateZoomHints();
    });
}
