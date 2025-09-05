// =========================
// SCRIPT UNIFICATO CATASTO PALERMO - VERSIONE CORRETTA
// Tutti i bug risolti - Gestione layer funzionante
// =========================

// VARIABILI GLOBALI
let isSatelliteOverlayOpen = false;
let satelliteMap = null;
let layerPanelOpen = false;
let currentPopup = null;

// STATO DEI LAYER
const layerStates = {
    'vincoli_lin': true,
    'vincoli_ar': true,
    'particelle': true,
    'carta_tecnica': false,
    'satellite': false
};

// MAPPATURA TRA ID PULSANTI E ID LAYER SULLA MAPPA
const layerMapping = {
    'vincoli_lin': 'vincoli_lin',
    'vincoli_ar': 'vincoli_ar', 
    'particelle': 'Particelle catastali',
    'carta_tecnica': 'carta_tecnica',
    'satellite': 'satellite-layer'
};

// =========================
// FUNZIONI LAYER SWITCHER CORRETTE
// =========================

function toggleLayers() {
    const panel = document.getElementById('layer-panel');
    const btn = document.querySelector('.command-btn');
    layerPanelOpen = !layerPanelOpen;
    
    if (layerPanelOpen) {
        panel.classList.add('active');
        btn.classList.add('active');
    } else {
        panel.classList.remove('active');
        btn.classList.remove('active');
    }
}

// FUNZIONE PRINCIPALE PER ATTIVARE/DISATTIVARE LAYER
function toggleLayer(layerId) {
    if (!layerMapping[layerId]) {
        console.warn(`Nessun mapping trovato per il layer: ${layerId}`);
        return;
    }
    
    // Aggiorna lo stato
    layerStates[layerId] = !layerStates[layerId];
    
    // Aggiorna l'interfaccia
    const button = document.getElementById(layerId);
    if (button) {
        if (layerStates[layerId]) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
    
    // Aggiorna la mappa
    if (map && map.getLayer(layerMapping[layerId])) {
        map.setLayoutProperty(
            layerMapping[layerId], 
            'visibility', 
            layerStates[layerId] ? 'visible' : 'none'
        );
        
        // Gestione speciale per le particelle (include le labels)
        if (layerId === 'particelle') {
            map.setLayoutProperty(
                'particelle-labels', 
                'visibility', 
                layerStates[layerId] ? 'visible' : 'none'
            );
        }
    }
    
    console.log(`Layer ${layerId} ${layerStates[layerId] ? 'attivato' : 'disattivato'}`);
}

// FUNZIONE PER IL TOGGLE DEL SUBMENU VINCOLI
function toggleVincoliSubmenu() {
    const container = document.querySelector('.vincoli-container');
    container.classList.toggle('active');
}

// INIZIALIZZA GLI EVENT LISTENER PER I PULSANTI
function initLayerButtons() {
    // Pulsante principale vincoli (solo per aprire/chiudere il submenu)
    const vincoliMain = document.getElementById('vincoli-main');
    if (vincoliMain) {
        vincoliMain.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleVincoliSubmenu();
        });
    }
    
    // Pulsanti dei layer individuali
    const layerButtons = ['vincoli_lin', 'vincoli_ar', 'particelle', 'carta_tecnica', 'satellite'];
    layerButtons.forEach(layerId => {
        const button = document.getElementById(layerId);
        if (button) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleLayer(layerId);
            });
        }
    });
    
    // Chiudi il submenu vincoli quando si clicca altrove
    document.addEventListener('click', function(e) {
        const vincoliContainer = document.querySelector('.vincoli-container');
        const vincoliBtn = document.getElementById('vincoli-main');
        
        if (vincoliContainer && vincoliContainer.classList.contains('active') && 
            !vincoliContainer.contains(e.target) && 
            e.target !== vincoliBtn) {
            vincoliContainer.classList.remove('active');
        }
    });
    
    console.log('✅ Pulsanti dei layer inizializzati correttamente');
}

// =========================
// OVERLAY SATELLITARE CORRETTO
// =========================

function toggleSatelliteOverlay() {
    const satelliteOverlay = document.getElementById("satellite-overlay");
    const overlayButton = document.querySelector(".overlay-button button");
    const crosshairMain = document.querySelector(".crosshair-main");

    if (isSatelliteOverlayOpen) {
        satelliteOverlay.style.display = "none";
        if (overlayButton) overlayButton.setAttribute("data-state", "closed");
        if (crosshairMain) crosshairMain.style.display = "none";
        
        if (satelliteMap) {
            satelliteMap.remove();
            satelliteMap = null;
        }
    } else {
        satelliteOverlay.style.display = "block";
        if (overlayButton) overlayButton.setAttribute("data-state", "open");
        if (crosshairMain) crosshairMain.style.display = "block";
        
        // Posizionamento iniziale
        satelliteOverlay.style.width = "350px";
        satelliteOverlay.style.height = "350px";
        satelliteOverlay.style.bottom = "50px";
        satelliteOverlay.style.left = "10px";

        // Inizializza mappa satellitare
        if (map) {
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
                center: map.getCenter(),
                zoom: map.getZoom(),
                interactive: false
            });

            // Sincronizzazione con mappa principale
            map.on("move", () => {
                if (satelliteMap) {
                    satelliteMap.setCenter(map.getCenter());
                    satelliteMap.setZoom(map.getZoom());
                }
            });

            map.on("zoom", () => {
                if (satelliteMap) {
                    satelliteMap.setZoom(map.getZoom());
                }
            });
        }
    }

    isSatelliteOverlayOpen = !isSatelliteOverlayOpen;
}

// =========================
// FUNZIONI RICERCA
// =========================

function toggleSearchPopup() {
    const searchPopup = document.getElementById("search-popup");
    searchPopup.classList.toggle("active");
    
    if (searchPopup.classList.contains("active")) {
        setTimeout(() => {
            const foglioInput = document.getElementById("foglio");
            if (foglioInput) {
                foglioInput.focus();
            }
        }, 300);
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
        return;
    }

    const features = map.querySourceFeatures("catasto", {
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

        // MOSTRA ENTRAMBI I PULSANTI PDF
        if (pdfTab) pdfTab.style.display = "block";
        if (pdfCmd) pdfCmd.style.display = "flex";

        const coordinates = features[0].geometry.coordinates[0];
        const bounds = coordinates.reduce(
            (bounds, coord) => bounds.extend(coord),
            new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );

        map.fitBounds(bounds, { padding: 50, maxZoom: 17.5 });

        if (map.getLayer("highlighted-polygon")) {
            map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
        }

        new maplibregl.Popup()
            .setLngLat(bounds.getCenter())
            .setHTML(`<b>Particelle catastali</b><br><b>Foglio:</b> ${foglio}<br><b>Particella:</b> ${particella}`)
            .addTo(map);

        toggleSearchPopup();
    } else {
        errorDiv.textContent = "Nessuna particella trovata con i parametri specificati o la particella richiesta non è visibile nell'area corrente";
        if (pdfTab) pdfTab.style.display = "none";
        if (pdfCmd) pdfCmd.style.display = "none";
        
        if (map.getLayer("highlighted-polygon")) {
            map.setFilter("highlighted-polygon", ["==", "id", ""]);
        }
    }
}

// =========================
// FUNZIONI SIDEPANEL
// =========================

function toggleSidepanel() {
    const sidepanel = document.getElementById('sidepanel');
    const isActive = sidepanel.classList.toggle('active');
    
    if (isActive) {
        const content = document.getElementById('sidepanel-content');
        content.addEventListener('scroll', handleSidepanelScroll);
    }
}

function handleSidepanelScroll() {
    const content = document.getElementById('sidepanel-content');
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (content.scrollTop > 200) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
}

function scrollToTop() {
    const content = document.getElementById('sidepanel-content');
    if (content) {
        content.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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
}

// =========================
// FUNZIONI PDF SEMPLIFICATE E CORRETTE
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

// VERSIONE PDF SEMPLIFICATA BASATA SUL FILE FUNZIONANTE
async function generatePDF() {
    const isMobile = window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isMobile && isPortrait) {
        alert("Per generare il file PDF con le informazioni richieste, ruotare il dispositivo in orientamento orizzontale (modalità landscape).");
        return;
    }
    
    if (!window.currentParticella) {
        alert("Nessuna particella selezionata.");
        return;
    }
    
    const waitPopup = document.getElementById("pdf-wait-popup");
    waitPopup.style.display = "flex";
    
    // Disabilita temporaneamente gli eventi mouse
    map.off("mouseenter", "Particelle catastali");
    map.off("mousemove");
    
    // Rimuovi highlight temporaneamente
    if (map.getLayer("highlighted-polygon")) {
        map.setFilter("highlighted-polygon", ["==", "id", ""]);
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFont("helvetica");
    
    // Aggiungi logo demo
    const demoImageUrl = "https://palermohub.opendatasicilia.it/pmtiles/js/demo.png";
    const demoImageWidth = 35.28;
    const demoImageHeight = 18.7;
    doc.addImage(demoImageUrl, "PNG", pageWidth - margin - demoImageWidth, margin, demoImageWidth, demoImageHeight);
    
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
    
    // Zoom sulla particella
    map.fitBounds(bounds, { padding: 50, maxZoom: 17.5 });
    
    // Aggiungi layer temporanei per evidenziare la particella
    map.addLayer({
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
    
    map.addLayer({
        id: "highlighted-polygon-outline-pdf",
        type: "line",
        source: "catasto",
        "source-layer": "particelle",
        paint: {
            "fill-color": "#000000",
            "line-width": 4
        },
        filter: ["all", ["==", "Foglio", window.currentParticella.foglio], ["==", "Paricella", window.currentParticella.particella]]
    });
    
    // Data di generazione
    const now = new Date();
    doc.setFontSize(8);
    doc.text(`Documento generato il ${now.toLocaleDateString()} alle ${now.toLocaleTimeString()}`, margin, margin + 45);
    
    // Aspetta che la mappa si stabilizzi
    map.once("idle", async () => {
        try {
            // Cattura la mappa
            const mapCanvas = map.getCanvas();
            const mapImage = mapCanvas.toDataURL("image/png");
            
            if (!mapImage) {
                throw new Error("Errore durante la generazione dell'immagine della mappa.");
            }
            
            // Aggiungi immagine della mappa
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (mapCanvas.height / mapCanvas.width) * imgWidth;
            doc.addImage(mapImage, "PNG", margin, margin + 48, imgWidth, imgHeight);
            
            // Disclaimer e fonte dati
            const disclaimerText = `Fonte dati catastali S.I.T.R. Sicilia - Ultimo aggiornamento Gennaio 2025, rilasciati con licenza CC-BY 4.0.
Fonte dati ZTO e vincoli: opendata Comune di Palermo, rilasciati con licenza CC-BY 4.0.

L'Agenzia delle entrate è l'amministrazione titolare dei dati, rilasciati con licenza CC-BY 4.0.
L'Agenzia delle Entrate non è responsabile per qualunque tipo di danno diretto, indiretto o accidentale derivante dall'impiego delle informazioni raccolte tramite questo servizio dimostrativo.

Disclaimer: I contenuti presenti in questo documento, compresi testi ed elementi grafici, hanno carattere puramente informativo e divulgativo. Non sono presenti dati personali o sensibili. Si precisa che questi materiali non costituiscono documenti ufficiali né hanno alcun valore legale. Per consultare la documentazione ufficiale e legalmente vincolante, si prega di fare riferimento agli atti definitivi allegati alle relative deliberazioni degli organi competenti.

by @opendatasicilia`;
            
            doc.setFontSize(8);
            let yPos = margin + 50 + imgHeight + 10;
            doc.text(disclaimerText, margin, yPos, { maxWidth: pageWidth - 2 * margin });
            yPos += doc.getTextDimensions(disclaimerText).h + 39;
            
            // Linea separatrice
            doc.setLineWidth(0.5);
            doc.setDrawColor(204, 204, 204);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 2;
            
            // Query per dati urbanistici
            const center = window.currentParticella.center;
            const point = map.project(center);
            const features = map.queryRenderedFeatures(point, {
                layers: ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali"]
            });
            
            // Aggiungi sezione dati urbanistici
            doc.setFontSize(14);
            yPos += 8;
            doc.text("Dati urbanistici:", margin, yPos);
            yPos += 8;
            doc.setFontSize(11);
            
            // Calcola aree se disponibili
            const areaData = calculateAreasAndIntersections(features);
            if (areaData) {
                doc.text(`• Area totale della particella: ${areaData.particellaArea} m²`, margin, yPos);
                yPos += 5;
                areaData.intersections.forEach(intersection => {
                    doc.text(`• Area intersecata con ${intersection.layer}: ${intersection.area} m² (${intersection.percentage}%)`, margin, yPos);
                    yPos += 3;
                });
            }
            
            yPos += 5;
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
            
            // Dettagli urbanistici
            features.forEach(feature => {
                doc.setFontSize(11);
                switch(feature.layer.id) {
                    case "cs":
                        doc.text(`• Circoscrizione: ${feature.properties.Circoscriz}`, margin, yPos);
                        yPos += 5;
                        break;
                    case "Info Vin. areali":
                        doc.text(`• Vincolo Areale:`, margin, yPos);
                        yPos += 5;
                        doc.text(`  Tipo: ${feature.properties.tipo || "N/A"}`, margin, yPos);
                        yPos += 5;
                        doc.text(`  Descrizione: ${feature.properties.descrizone || "N/A"}`, margin, yPos);
                        yPos += 5;
                        break;
                    case "Info Vin. lineari":
                        doc.text(`• Vincolo Lineare:`, margin, yPos);
                        yPos += 5;
                        doc.text(`  Tipo: ${feature.properties.TIPO || "N/A"}`, margin, yPos);
                        yPos += 5;
                        doc.text(`  Descrizione: ${feature.properties.DESCRIZION || "N/A"}`, margin, yPos);
                        yPos += 5;
                        break;
                    case "Info Netto storico":
                        doc.text(`• Netto Storico:`, margin, yPos);
                        yPos += 5;
                        doc.text(`  ZTO: ${feature.properties.ZTO || "N/A"}`, margin, yPos);
                        yPos += 5;
                        doc.text(`  Descrizione: ${feature.properties.DESCRIZION || "N/A"}`, margin, yPos);
                        yPos += 5;
                        break;
                    case "Info ZTO":
                        doc.text(`• Zonizzazione:`, margin, yPos);
                        yPos += 5
                        doc.text(`  ZTO: ${feature.properties.ZTO || "N/A"}`, margin, yPos);
                        yPos += 5;
                        doc.text(`  Descrizione: ${feature.properties.DESCRIZION || "N/A"}`, margin, yPos);
                        yPos += 5;
                        break;
                }
                
                // Nuova pagina se necessario
                if (yPos > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
            });
            
            // Nascondi popup di attesa
            waitPopup.style.display = "none";
            
            // Rimuovi layer temporanei
            map.removeLayer("highlighted-polygon-pdf");
            map.removeLayer("highlighted-polygon-outline-pdf");
            
            // Ripristina eventi mouse
            map.on("mouseenter", "Particelle catastali", e => {
                if (e.features.length > 0) {
                    map.getCanvas().style.cursor = "pointer";
                    const foglio = e.features[0].properties.Foglio;
                    const particella = e.features[0].properties.Paricella;
                    map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
                }
            });
            
            map.on("mousemove", e => {
                const features = map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] });
                if (features.length > 0) {
                    const feature = features[0];
                    const foglio = feature.properties.Foglio;
                    const particella = feature.properties.Paricella;
                    map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
                } else {
                    map.setFilter("highlighted-polygon", ["==", "id", ""]);
                }
            });
            
            // Salva il PDF
            doc.save(`particella_${window.currentParticella.foglio}_${window.currentParticella.particella}.pdf`);
            
        } catch (error) {
            console.error("Errore durante la generazione del PDF:", error);
            waitPopup.style.display = "none";
            alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
        }
    });
}

// =========================
// INIZIALIZZAZIONE INTERACT.JS
// =========================

function setupInteract() {
    const satelliteOverlay = document.getElementById("satellite-overlay");
    
    interact(satelliteOverlay).draggable({
        inertia: true,
        modifiers: [],
        listeners: {
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            }
        }
    });

    interact(satelliteOverlay).resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
            move(event) {
                const target = event.target;
                let { width, height } = event.rect;
                
                width = Math.max(width, 200);
                height = Math.max(height, 150);
                
                target.style.width = `${width}px`;
                target.style.height = `${height}px`;
                
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.deltaRect.left;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.deltaRect.top;
                
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            }
        },
        modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })]
    });
}

// =========================
// INIZIALIZZAZIONE MAPPA PRINCIPALE
// =========================

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
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions">CARTO</a>'
            },
            satellite: {
                type: "raster",
                tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
                tileSize: 256,
                attribution: "Immagini ©2025 Google - "
            }
        },
        layers: [
            {
                id: "raster-tiles-layer",
                type: "raster",
                source: "raster-tiles",
                minzoom: 10,
                maxzoom: 22
            },
            {
                id: "satellite-layer",
                type: "raster",
                source: "satellite",
                minzoom: 10,
                maxzoom: 22,
                layout: { visibility: "none" }
            }
        ]
    },
    center: [13.33225, 38.14074],
    zoom: 12,
    maxBounds: [[13.1, 37.9785], [13.55, 38.2919]],
    hash: true,
    pitch: 0,
    dragRotate: false,
    preserveDrawingBuffer: true
});

// Controlli mappa
map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "top-left");
map.addControl(new maplibregl.FullscreenControl(), "top-left");
map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

// =========================
// EVENT LISTENERS E INIZIALIZZAZIONE
// =========================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Revolutionary Catasto Interface Loaded - Fixed Version');
    
    setupInteract();
    
    // Event listeners per input ricerca
    const foglioInput = document.getElementById("foglio");
    const particellaInput = document.getElementById("particella");
    
    if (foglioInput) {
        foglioInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") searchParticella();
        });
    }
    
    if (particellaInput) {
        particellaInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") searchParticella();
        });
    }
    
    // Shortcut da tastiera
    document.addEventListener('keydown', (e) => {
        if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleLayers();
        }
        if (e.key === 'Escape') {
            if (layerPanelOpen) toggleLayers();
            const searchPopup = document.getElementById('search-popup');
            if (searchPopup && searchPopup.classList.contains('active')) {
                toggleSearchPopup();
            }
        }
    });
    
    // Chiudi pannelli quando si clicca fuori
    document.addEventListener('click', (e) => {
        const layerPanel = document.getElementById('layer-panel');
        const commandBar = document.querySelector('.command-bar');
        
        if (layerPanelOpen && 
            layerPanel && !layerPanel.contains(e.target) && 
            commandBar && !commandBar.contains(e.target)) {
            toggleLayers();
        }
    });
    
    // Inizializza loading screen
    setTimeout(function() {
        const loader = document.getElementById('custom-loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, 4000);
    
    console.log('Layer states initialized:', layerStates);
});

// Inizializzazione mappa al caricamento
map.on("load", () => {
    // AGGIUNGI TUTTE LE SOURCES
    map.addSource("prg", {
        type: "vector",
        url: "pmtiles://https://palermohub.github.io/PRG2004/particelle/prg.pmtiles"
    });

    map.addSource("catasto", {
        type: "vector", 
        url: "pmtiles://https://palermohub.github.io/PRG2004/particelle/particelle_0825.pmtiles",
        attribution: "Catasto - fonte dati <b>SITR Sicilia</b>"
    });

    map.addSource("zto", {
        type: "raster",
        tiles: ["https://palermohub.github.io/PRG2004/ZTO/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: 'Comune di Palermo - Variante Generale al P.R.G. 2004 - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia">@opendatasicilia</a>',
        minzoom: 12,
        maxzoom: 19
    });

    map.addSource("ppe", {
        type: "raster",
        tiles: ["https://palermohub.github.io/PRG2004/ppe/{z}/{x}/{y}.png"],
        tileSize: 256,
        minzoom: 12,
        maxzoom: 19
    });

    map.addSource("vincoli_lin", {
        type: "raster",
        tiles: ["https://palermohub.github.io/PRG2004/VL/{z}/{x}/{y}.png"],
        tileSize: 256,
        minzoom: 12,
        maxzoom: 19
    });

    map.addSource("vincoli_ar", {
        type: "raster",
        tiles: ["https://palermohub.github.io/PRG2004/VA/{z}/{x}/{y}.png"],
        tileSize: 256,
        minzoom: 12,
        maxzoom: 19
    });

    map.addSource("carta_tecnica", {
        type: "raster",
        tiles: ["https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© Carta Tecnica Layer",
        minzoom: 12,
        maxzoom: 19
    });

    // AGGIUNGI LAYER RASTER
    const rasterLayers = [
        { id: "carta_tecnica", source: "carta_tecnica", visibility: "none" },
        { id: "zto", source: "zto" },
        { id: "ppe", source: "ppe" },
        { id: "vincoli_lin", source: "vincoli_lin" },
        { id: "vincoli_ar", source: "vincoli_ar" }
    ];

    rasterLayers.forEach(layer => {
        map.addLayer({
            id: layer.id,
            type: "raster",
            source: layer.source,
            minzoom: 0,
            maxzoom: 22,
            layout: { visibility: layer.visibility || "visible" }
        });
    });

    // AGGIUNGI LAYER VECTOR
    const layers = [
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

    layers.forEach(layer => {
        map.addLayer({
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

    // AGGIUNGI LAYER LABELS PARTICELLE
    map.addLayer({
        id: "particelle-labels",
        type: "symbol",
        source: "catasto",
        "source-layer": "particelle",
        layout: {
            "text-field": ["concat", "F. ", ["get", "Foglio"], " - ", "P. ", ["get", "Paricella"]],
            "text-size": ["interpolate", ["linear"], ["zoom"], 15, 5, 19, 12],
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
        minzoom: 15
    });

    // AGGIUNGI LAYER HIGHLIGHT PARTICELLE
    map.addLayer({
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

    // INIZIALIZZA I PULSANTI DEI LAYER
    initLayerButtons();
    
    // IMPOSTA STATO INIZIALE DEI LAYER
    Object.keys(layerStates).forEach(layerId => {
        const mapLayerId = layerMapping[layerId];
        if (mapLayerId && map.getLayer(mapLayerId)) {
            map.setLayoutProperty(
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
                map.setLayoutProperty(
                    'particelle-labels', 
                    'visibility', 
                    layerStates[layerId] ? 'visible' : 'none'
                );
            }
        }
    });

    // EVENT LISTENERS PER MOUSE INTERACTION
    map.on("mouseenter", "Particelle catastali", e => {
        if (e.features.length > 0) {
            map.getCanvas().style.cursor = "pointer";
            const foglio = e.features[0].properties.Foglio;
            const particella = e.features[0].properties.Paricella;
            map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
        }
    });

    map.on("mousemove", e => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["Particelle catastali"] });
        if (features.length > 0) {
            const feature = features[0];
            const foglio = feature.properties.Foglio;
            const particella = feature.properties.Paricella;
            map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
        } else {
            map.setFilter("highlighted-polygon", ["==", "id", ""]);
        }
    });

    // CLICK EVENT PER POPUP UNIFICATO
    map.on("click", e => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali"]
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
                }
                return content;
            }).join("<hr>");

            currentPopup = new maplibregl.Popup({ closeOnClick: true })
                .setLngLat(e.lngLat)
                .setHTML(unifiedTooltipContent)
                .addTo(map);
        }
    });

    // CURSOR EVENTS
    map.on("mouseenter", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali"], () => {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", ["cs", "Info Vin. areali", "Info Vin. lineari", "Info Netto storico", "Info ZTO", "Particelle catastali"], () => {
        map.getCanvas().style.cursor = "default";
    });
});