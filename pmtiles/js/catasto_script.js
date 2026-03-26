
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
    'vincoli_lin': true,
    'vincoli_ar': true,
    'particelle': true,
    'civici': false,
    'carta_tecnica': false,
    'satellite': false,
    'zonizzazione': true
};

// MAPPATURA TRA ID PULSANTI E ID LAYER SULLA MAPPA
const layerMapping = {
    'vincoli_lin': 'vincoli_lin',
    'vincoli_ar': 'vincoli_ar',
    'particelle': 'Particelle catastali',
    'civici': 'Numeri Civici',
    'carta_tecnica': 'carta_tecnica',
    'satellite': 'satellite-layer',
    'zonizzazione': 'zto'
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

function initLayerButtons() {
    const vincoliMain = document.getElementById('vincoli-main');
    if (vincoliMain) {
        vincoliMain.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleVincoliSubmenu();
        });
    }
    
    const layerButtons = ['vincoli_lin', 'vincoli_ar', 'particelle', 'civici', 'carta_tecnica', 'satellite', 'zonizzazione'];
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
                "text-field": ["get", "Civico"],
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
                layers: ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali", "Numeri Civici"]
            });

            if (features.length > 0) {
                if (currentPopup) {
                    currentPopup.remove();
                    currentPopup = null;
                }

                const unifiedTooltipContent = features.map(feature => {
                    let content = "";
                    if (feature.layer.id === "cs") {
                        content = `<b>Strumento Urbanistico:</b> PPE<br><b>Circoscrizione:</b> ${feature.properties.Circoscriz || "N/A"}`;
                    } else if (feature.layer.id === "Info Vin. areali") {
                        content = `<b>Vincolo areale</b><br><b>Tipo:</b> ${feature.properties.tipo || "N/A"}<br><b>Descrizione:</b> ${feature.properties.descrizone || "N/A"}`;
                    } else if (feature.layer.id === "Info Vin. lineari") {
                        content = `<b>Vincolo lineare</b><br><b>Tipo:</b> ${feature.properties.TIPO || "N/A"}<br><b>Descrizione:</b> ${feature.properties.DESCRIZION || "N/A"}`;
                    } else if (feature.layer.id === "Info Netto storico") {
                        content = `<b>Netto storico</b><br><b>ZTO:</b> ${feature.properties.ZTO || "N/A"}<br><b>Descrizione:</b> ${feature.properties.DESCRIZION || "N/A"}`;
                    } else if (feature.layer.id === "Info ZTO") {
                        content = `<b>Zonizzazione</b><br><b>ZTO:</b> ${feature.properties.ZTO || "N/A"}<br><b>Descrizione:</b> ${feature.properties.DESCRIZION || "N/A"}`;
                    } else if (feature.layer.id === "Particelle catastali") {
                        content = `<b>Particelle catastali</b><br><b>Foglio:</b> ${feature.properties.Foglio || "N/A"}<br><b>Particella:</b> ${feature.properties.Paricella || "N/A"}`;
                    } else if (feature.layer.id === "Numeri Civici") {
                        content = `<b>Numero Civico</b><br><b>Civico:</b> ${feature.properties.Civico || "N/A"}<br><b>Odonimo:</b> ${feature.properties.Odonimo || "N/A"}<br><b>Circoscrizione:</b> ${feature.properties.Circoscrizione || "N/A"}<br><b>Quartiere:</b> ${feature.properties.Quartiere || "N/A"}<br><b>UPL:</b> ${feature.properties.UPL || "N/A"}`;
                    }
                    return content;
                }).filter(c => c !== "").join("<hr>");

                // Popup ottimizzato per mobile
                currentPopup = new maplibregl.Popup({ 
                    closeOnClick: true,
                    maxWidth: isMobile ? '280px' : '300px',
                    offset: isMobile ? [0, -10] : [0, 0]
                })
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="padding: ${isMobile ? '8px' : '10px'}; font-size: ${isMobile ? '13px' : '14px'};">${unifiedTooltipContent}</div>`)
                    .addTo(window.map);
                    
                // Feedback vibrazione su mobile
                if (isMobile && navigator.vibrate) {
                    navigator.vibrate(30);
                }
            }
        });

        // CURSOR EVENTS (solo desktop)
        if (!isMobile) {
            window.map.on("mouseenter", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali", "Numeri Civici"], () => {
                window.map.getCanvas().style.cursor = "pointer";
            });

            window.map.on("mouseleave", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali", "Numeri Civici"], () => {
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