        let isSatelliteOverlayOpen = false;
        let satelliteMap = null;

        function toggleSatelliteOverlay() {
            const satelliteOverlay = document.getElementById('satellite-overlay');
            const overlayButton = document.querySelector('.overlay-button button');
            const crosshairMain = document.querySelector('.crosshair-main');

            if (isSatelliteOverlayOpen) {
                satelliteOverlay.style.display = 'none';
                overlayButton.setAttribute('data-state', 'closed');
                crosshairMain.style.display = 'none';
                if (satelliteMap) {
                    satelliteMap.remove();
                    satelliteMap = null;
                }
            } else {
                satelliteOverlay.style.display = 'block';
                overlayButton.setAttribute('data-state', 'open');
                crosshairMain.style.display = 'block';

                satelliteOverlay.style.width = '350px';
                satelliteOverlay.style.height = '350px';
                satelliteOverlay.style.bottom = '50px';
                satelliteOverlay.style.left = '10px';

                satelliteMap = new maplibregl.Map({
                    container: 'satellite-map',
                    style: {
                        version: 8,
                        sources: {
                            'satellite': {
                                type: 'raster',
                                tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                                tileSize: 256,
                                attribution: 'Immagini ©2025 Google.Immagini ©2025 AirbusCNES /Airbus.Maxar Technologies. Dati cartografici ©2025'
                            }
                        },
                        layers: [
                            {
                                id: 'satellite-layer',
                                type: 'raster',
                                source: 'satellite',
                                minzoom: 0,
                                maxzoom: 22
                            }
                        ]
                    },
                    center: map.getCenter(),
                    zoom: map.getZoom(),
                    interactive: false
                });

                map.on('move', () => {
                    if (satelliteMap) {
                        satelliteMap.setCenter(map.getCenter());
                        satelliteMap.setZoom(map.getZoom());
                    }
                });

                map.on('zoom', () => {
                    if (satelliteMap) {
                        satelliteMap.setZoom(map.getZoom());
                    }
                });
            }

            isSatelliteOverlayOpen = !isSatelliteOverlayOpen;
        }

        function setupInteract() {
            const satelliteOverlay = document.getElementById('satellite-overlay');

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
                modifiers: [
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    })
                ]
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            setupInteract();
        });

        function toggleSearchPopup() {
            const searchPopup = document.getElementById('search-popup');
            searchPopup.classList.toggle('active');
        }

        function searchParticella() {
            const foglio = document.getElementById('foglio').value;
            const particella = document.getElementById('particella').value;
            const errorDiv = document.getElementById('search-error');
            const pdfTab = document.getElementById('pdf-tab');

            if (!foglio || !particella) {
                errorDiv.textContent = 'Inserire sia il Foglio che la Particella';
                pdfTab.style.display = 'none';
                return;
            }

            const features = map.querySourceFeatures('catasto', {
                sourceLayer: 'particelle',
                filter: ['all', ['==', 'Foglio', foglio], ['==', 'Paricella', particella]]
            });

            if (features.length > 0) {
                errorDiv.textContent = '';

                window.currentParticella = {
                    foglio: foglio,
                    particella: particella,
                    bounds: features[0].geometry.coordinates[0],
                    center: features[0].geometry.coordinates[0].reduce((bounds, coord) => {
                        return bounds.extend(coord);
                    }, new maplibregl.LngLatBounds(features[0].geometry.coordinates[0][0], features[0].geometry.coordinates[0][0])).getCenter()
                };

                pdfTab.style.display = 'block';

                const coordinates = features[0].geometry.coordinates[0];
                const bounds = coordinates.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

                map.fitBounds(bounds, { padding: 50, maxZoom: 17.5 });

                if (map.getLayer('highlighted-polygon')) {
                    map.setFilter('highlighted-polygon', ['all', ['==', 'Foglio', foglio], ['==', 'Paricella', particella]]);
                }

                new maplibregl.Popup()
                    .setLngLat(bounds.getCenter())
                    .setHTML(`<b>Particelle catastali</b><br><b>Foglio:</b> ${foglio}<br><b>Particella:</b> ${particella}`)
                    .addTo(map);

                toggleSearchPopup();
            } else {
                errorDiv.textContent = 'Nessuna particella trovata con i parametri specificati o la particella richiesta non è visibile nell\'area corrente';
                pdfTab.style.display = 'none';
                if (map.getLayer('highlighted-polygon')) {
                    map.setFilter('highlighted-polygon', ['==', 'id', '']);
                }
            }
        }


        function calculateAreasAndIntersections(features) {
            const particellaFeature = features.find(f => f.layer.id === 'Particelle catastali');
            if (!particellaFeature) return null;

            const particellaGeometry = particellaFeature.geometry;
            const particellaPolygon = turf.polygon(particellaGeometry.coordinates);
            const particellaArea = turf.area(particellaPolygon); 

            const intersections = features
                .filter(f => f.layer.id !== 'Particelle catastali')
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
                intersections
            };
        }

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

            const waitPopup = document.getElementById('pdf-wait-popup');
            waitPopup.style.display = 'flex';

           
            map.off('mouseenter', 'Particelle catastali');
            map.off('mousemove');

            
            if (map.getLayer('highlighted-polygon')) {
                map.setFilter('highlighted-polygon', ['==', 'id', '']);
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const margin = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.setFont("helvetica");

            const demoImageUrl = 'https://palermohub.opendatasicilia.it/pmtiles/js/demo.png';
            const demoImageWidth = 35.28;
            const demoImageHeight = 18.7;
            doc.addImage(demoImageUrl, 'PNG', pageWidth - margin - demoImageWidth, margin, demoImageWidth, demoImageHeight);

            doc.setFontSize(16);
            doc.text(`Demo ricerca particella catastale`, pageWidth / 2, margin + 15, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Foglio: ${window.currentParticella.foglio}`, margin, margin + 30);
            doc.text(`Particella: ${window.currentParticella.particella}`, margin, margin + 35);

            const bounds = window.currentParticella.bounds;

            if (!bounds || bounds.length === 0) {
                alert("Bounds della particella non validi.");
                waitPopup.style.display = 'none';
                return;
            }

            map.fitBounds(bounds, { padding: 50, maxZoom: 17.5 });

            map.addLayer({
                id: 'highlighted-polygon-pdf',
                type: 'fill',
                source: 'catasto',
                'source-layer': 'particelle',
                paint: {
                    'fill-color': '#ffff00',
                    'fill-opacity': 0.3
                },
                filter: ['all', ['==', 'Foglio', window.currentParticella.foglio], ['==', 'Paricella', window.currentParticella.particella]]
            });

            map.addLayer({
                id: 'highlighted-polygon-outline-pdf',
                type: 'line',
                source: 'catasto',
                'source-layer': 'particelle',
                paint: {
                    'line-color': '#000000',
                    'line-width': 4
                },
                filter: ['all', ['==', 'Foglio', window.currentParticella.foglio], ['==', 'Paricella', window.currentParticella.particella]]
            });

            const addText = (text, y) => {
                const maxWidth = pageWidth - 2 * margin;
                if (doc.getTextWidth(text) > maxWidth) {
                    const words = text.split(' ');
                    let line = '';
                    for (let word of words) {
                        const testLine = line + word + ' ';
                        if (doc.getTextWidth(testLine) > maxWidth) {
                            doc.text(line, margin, y);
                            line = word + ' ';
                            y += 7;
                        } else {
                            line = testLine;
                        }
                    }
                    if (line.trim()) {
                        doc.text(line.trim(), margin, y);
                    }
                    return y + 7;
                } else {
                    doc.text(text, margin, y);
                    return y + 7;
                }
            };

            // Aggiungi la data di generazione del documento prima della mappa
            const now = new Date();
            doc.setFontSize(8);
            doc.text(`Documento generato il ${now.toLocaleDateString()} alle ${now.toLocaleTimeString()}`, margin, margin + 45);

            map.once('idle', async () => {
                try {
                    const mapCanvas = map.getCanvas();
                    const mapImage = mapCanvas.toDataURL('image/png');

                    if (!mapImage) {
                        throw new Error("Errore durante la generazione dell'immagine della mappa.");
                    }

                    const imgWidth = pageWidth - 2 * margin;
                    const imgHeight = (mapCanvas.height / mapCanvas.width) * imgWidth;

                    doc.addImage(mapImage, 'PNG', margin, margin + 48, imgWidth, imgHeight);

                    const disclaimerText = `Fonte dati catastali S.I.T.R. Sicilia - Ultimo aggiornamento Gennaio 2025.\nFonte dati ZTO e vincoli: opendata Comune di Palermo, rilasciati con licenza CC-BY 4.0.			
                    \nL'Agenzia delle entrate è l'amministrazione titolare dei dati, rilasciati con licenza CC-BY 4.0.\nL'Agenzia delle Entrate non è responsabile per qualunque tipo di danno diretto, indiretto o accidentale derivante dall'impiego delle informazioni raccolte tramite questo servizio dimostrativo.\n\nDisclaimer: I contenuti presenti in questo documento, compresi testi ed elementi grafici, hanno carattere puramente informativo e divulgativo. Non sono presenti dati personali o sensibili. Si precisa che questi materiali non costituiscono documenti ufficiali né hanno alcun valore legale. Per consultare la documentazione ufficiale e legalmente vincolante, si prega di fare riferimento agli atti definitivi allegati alle relative deliberazioni degli organi competenti.\n\nby @opendatasicilia`;
                    doc.setFontSize(8);
                    let yPos = margin + 50 + imgHeight + 10;
                    doc.text(disclaimerText, margin, yPos, { maxWidth: pageWidth - 2 * margin });
					
                    yPos += doc.getTextDimensions(disclaimerText).h + 39;

                    doc.setLineWidth(0.5);
                    doc.setDrawColor(204, 204, 204); 
                    doc.line(margin, yPos, pageWidth - margin, yPos); 
                    yPos += 2;

                    const center = window.currentParticella.center;
                    const point = map.project(center);
                    const features = map.queryRenderedFeatures(point, {
                        layers: ['cs', 'Info Vin. areali', 'Info Vin. lineari', 'Info Netto storico', 'Info ZTO', 'Particelle catastali']
                    });

                    doc.setFontSize(14);
                    yPos = addText('Dati urbanistici:', yPos + 8);
                    doc.setFontSize(11);

                    const areaData = calculateAreasAndIntersections(features);
                    if (areaData) {
                        yPos = addText(`• Area totale della particella: ${areaData.particellaArea} m²`, yPos + 5);
                        areaData.intersections.forEach(intersection => {
                            yPos = addText(`• Area intersecata con ${intersection.layer}: ${intersection.area} m² (${intersection.percentage}%)`, yPos + 3);
                        });
                    }

                    doc.setLineWidth(0.5);
                    doc.setDrawColor(204, 204, 204); 
                    doc.line(margin, yPos, pageWidth - margin, yPos); 
                    yPos += 10; 

                    features.forEach(feature => {
                        doc.setFontSize(11);
                        switch (feature.layer.id) {
                            case 'cs':
                                yPos = addText(`• Circoscrizione: ${feature.properties.Circoscriz}`, yPos + 3);
                                break;
                            case 'Info Vin. areali':
                                yPos = addText(`• Vincolo Areale:`, yPos + 3);
                                yPos = addText(`  Tipo: ${feature.properties.tipo || 'N/A'}`, yPos);
                                yPos = addText(`  Descrizione: ${feature.properties.descrizone || 'N/A'}`, yPos);
                                break;
                            case 'Info Vin. lineari':
                                yPos = addText(`• Vincolo Lineare:`, yPos + 3);
                                yPos = addText(`  Tipo: ${feature.properties.TIPO || 'N/A'}`, yPos);
                                yPos = addText(`  Descrizione: ${feature.properties.DESCRIZION || 'N/A'}`, yPos);
                                break;
                            case 'Info Netto storico':
                                yPos = addText(`• Netto Storico:`, yPos + 3);
                                yPos = addText(`  ZTO: ${feature.properties.ZTO || 'N/A'}`, yPos);
                                yPos = addText(`  Descrizione: ${feature.properties.DESCRIZION || 'N/A'}`, yPos);
                                break;
                            case 'Info ZTO':
                                yPos = addText(`• Zonizzazione:`, yPos + 3);
                                yPos = addText(`  ZTO: ${feature.properties.ZTO || 'N/A'}`, yPos);
                                yPos = addText(`  Descrizione: ${feature.properties.DESCRIZION || 'N/A'}`, yPos);
                                break;
                        }

                        if (yPos > pageHeight - margin) {
                            doc.addPage();
                            yPos = margin;
                        }
                    });

                    waitPopup.style.display = 'none';

                    map.removeLayer('highlighted-polygon-pdf');
                    map.removeLayer('highlighted-polygon-outline-pdf');

                    map.on('mouseenter', 'Particelle catastali', (e) => {
                        if (e.features.length > 0) {
                            map.getCanvas().style.cursor = 'pointer';
                            const foglio = e.features[0].properties.Foglio;
                            const particella = e.features[0].properties.Paricella;
                            map.setFilter('highlighted-polygon', [
                                'all',
                                ['==', 'Foglio', foglio],
                                ['==', 'Paricella', particella]
                            ]);
                        }
                    });

                    map.on('mousemove', (e) => {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: ['Particelle catastali']
                        });

                        if (features.length > 0) {
                            const feature = features[0];
                            const foglio = feature.properties.Foglio;
                            const particella = feature.properties.Paricella;

                            map.setFilter('highlighted-polygon', [
                                'all',
                                ['==', 'Foglio', foglio],
                                ['==', 'Paricella', particella]
                            ]);
                        } else {
                            map.setFilter('highlighted-polygon', ['==', 'id', '']);
                        }
                    });

                    doc.save(`particella_${window.currentParticella.foglio}_${window.currentParticella.particella}.pdf`);
                } catch (error) {
                    console.error("Errore durante la generazione del PDF:", error);
                    waitPopup.style.display = 'none';
                    alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
                }
            });
        }

        document.getElementById('foglio').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchParticella();
        });
        document.getElementById('particella').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchParticella();
        });

        function toggleSidepanel() {
            const sidepanel = document.getElementById('sidepanel');
            const layerSwitcher = document.querySelector('.layer-switcher');
            const searchContainer = document.querySelector('.search-container');
            const tabIcon = document.getElementById('tab-icon');

            if (sidepanel.style.right === '0px') {
                sidepanel.style.right = '-400px';
                layerSwitcher.style.right = '20px';
                searchContainer.style.right = '220px';
                tabIcon.classList.remove('fa-chevron-right');
                tabIcon.classList.add('fa-chevron-left');
            } else {
                sidepanel.style.right = '0px';
                layerSwitcher.style.right = '420px';
                searchContainer.style.right = '620px';
                tabIcon.classList.remove('fa-chevron-left');
                tabIcon.classList.add('fa-chevron-right');
            }
        }

        function showSection(sectionId) {
            const sections = document.querySelectorAll('.sidepanel-section');
            const buttons = document.querySelectorAll('#sidepanel-tabs button');

            sections.forEach(section => {
                section.style.display = 'none';
            });

            buttons.forEach(button => {
                button.classList.remove('active');
            });

            document.getElementById(sectionId).style.display = 'block';
            document.querySelector(`button[onclick="showSection('${sectionId}')"]`).classList.add('active');
        }

        const protocol = new pmtiles.Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        const map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                glyphs: 'https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=eyJ1IjoiZ2J2aXRyYW5vIiwiYSI6ImNtNWpwMDloejBtN3ozM3F3NzJvZGh2ZG4ifQ.AXXkYYL7XY6RBVXpJ2IrBA',
                sources: {
                    'raster-tiles': {
                        type: 'raster',
                        tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],
                        tileSize: 256,
                        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions">CARTO</a>'
                    },
                    'satellite': {
                        type: 'raster',
                        tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                        tileSize: 256,
                        attribution: 'Immagini ©2025 Google.Immagini ©2025 AirbusCNES /Airbus.Maxar Technologies. Dati cartografici ©2025'
                    }
                },
                layers: [
                    {
                        id: 'raster-tiles-layer',
                        type: 'raster',
                        source: 'raster-tiles',
                        minzoom: 10,
                        maxzoom: 22
                    },
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'satellite',
                        minzoom: 10,
                        maxzoom: 22,
                        layout: {
                            visibility: 'none'
                        }
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

        map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-left');
        map.addControl(new maplibregl.FullscreenControl(), 'top-left');
        map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

        map.on('load', () => {
            map.addSource('prg', {
                type: 'vector',
                url: 'pmtiles://https://palermohub.github.io/PRG2004/particelle/prg.pmtiles'
            });

            map.addSource('catasto', {
                type: 'vector',
                url: 'pmtiles://https://palermohub.github.io/PRG2004/particelle/particelle_0125.pmtiles',
                attribution: 'Particelle catastali - fonte dati <b>SITR Sicilia</b>'
            });

            map.addSource('zto', {
                type: 'raster',
                tiles: ['https://palermohub.github.io/PRG2004/ZTO/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: 'Comune di Palermo - Variente Generle al P.R.G. 2004 - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia">@opendatasicilia</a>',
                minzoom: 12,
                maxzoom: 19
            });

            map.addSource('ppe', {
                type: 'raster',
                tiles: ['https://palermohub.github.io/PRG2004/ppe/{z}/{x}/{y}.png'],
                tileSize: 256,
                minzoom: 12,
                maxzoom: 19
            });

            map.addSource('vincoli_lin', {
                type: 'raster',
                tiles: ['https://palermohub.github.io/PRG2004/VL/{z}/{x}/{y}.png'],
                tileSize: 256,
                minzoom: 12,
                maxzoom: 19
            });

            map.addSource('vincoli_ar', {
                type: 'raster',
                tiles: ['https://palermohub.github.io/PRG2004/VA/{z}/{x}/{y}.png'],
                tileSize: 256,
                minzoom: 12,
                maxzoom: 19
            });

            map.addSource('carta_tecnica', {
                type: 'raster',
                tiles: ['https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© Carta Tecnica Layer',
                minzoom: 12,
                maxzoom: 19
            });

            const rasterLayers = [
                { id: 'carta_tecnica', source: 'carta_tecnica', visibility: 'none' },
                { id: 'zto', source: 'zto' },
                { id: 'ppe', source: 'ppe' },
                { id: 'vincoli_lin', source: 'vincoli_lin' },
                { id: 'vincoli_ar', source: 'vincoli_ar' }
            ];

            rasterLayers.forEach(layer => {
                map.addLayer({
                    id: layer.id,
                    type: 'raster',
                    source: layer.source,
                    minzoom: 0,
                    maxzoom: 22,
                    layout: {
                        visibility: layer.visibility || 'visible'
                    }
                });
            });

            const layers = [
                { id: 'cs', source: 'prg', sourceLayer: 'cs', color: '#ffffff', tooltip: "<b>Circoscrizione:</b> {{Circoscriz}}" },
                { id: 'Info Vin. areali', source: 'prg', sourceLayer: 'va', color: '#ffffff', tooltip: "<b>Tipo:</b> {{tipo}}<br><b>Descrizione:</b> {{descrizone}}<br><b>Note:</b> {{note}}" },
                { id: 'Info Vin. lineari', source: 'prg', sourceLayer: 'vl', color: '#ffffff', tooltip: "<b>Tipo:</b> {{TIPO}}<br><b>Descrizione:</b> {{DESCRIZION}}<br><b>Note:</b> {{note}}" },
                { id: 'Info Netto storico', source: 'prg', sourceLayer: 'ns', color: '#ffffff', tooltip: "<b>Netto storico</b><br><b>ZTO:</b> {{ZTO}}<br><b>Descrizione:</b> {{DESCRIZION}}" },
                { id: 'Info ZTO', source: 'prg', sourceLayer: 'zto', color: '#ffffff', tooltip: "<b>Zonizzazione</b><br><b>ZTO:</b> {{ZTO}}<br><b>Descrizione:</b> {{DESCRIZION}}" },
                { id: 'Particelle catastali', source: 'catasto', sourceLayer: 'particelle', color: '#ffffff', tooltip: "<b>Particelle catastali</b><br><b>Foglio:</b> {{Foglio}}<br><b>Particella:</b> {{Paricella}}" }
            ];

            layers.forEach(layer => {
                map.addLayer({
                    id: layer.id,
                    type: 'fill',
                    source: layer.source,
                    'source-layer': layer.sourceLayer,
                    paint: {
                        'fill-color': layer.color,
                        'fill-opacity': layer.id === 'Particelle catastali' ? 0.60 : 0,
                        'fill-outline-color': layer.id === 'Particelle catastali' ? '#000' : 'transparent'
                    }
                });
            });

            map.addLayer({
                id: 'particelle-labels',
                type: 'symbol',
                source: 'catasto',
                'source-layer': 'particelle',
                layout: {
                    'text-field': [
                        'concat',
                        'F. ', ['get', 'Foglio'], ' - ',
                        'P. ', ['get', 'Paricella']
                    ],
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15, 5,
                        19, 12
                    ],
                    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                    'text-allow-overlap': false,
                    'text-ignore-placement': false,
                    'text-anchor': 'center',
                    'text-offset': [0, 0.5],
                    'visibility': 'none'
                },
                paint: {
                    'text-color': '#000000',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1
                },
                minzoom: 15
            });

            const particelleButton = document.getElementById('particelle');
            if (particelleButton.classList.contains('active')) {
                map.setLayoutProperty('particelle-labels', 'visibility', 'visible');
            }

            map.on('mouseenter', 'Particelle catastali', (e) => {
                if (e.features.length > 0) {
                 map.getCanvas().style.cursor = 'pointer';

                    const foglio = e.features[0].properties.Foglio;
                    const particella = e.features[0].properties.Paricella;
                    map.setFilter('highlighted-polygon', [
                        'all',
                        ['==', 'Foglio', foglio],
                        ['==', 'Paricella', particella]
                    ]);
                }
            });

            map.on('mouseenter', 'Particelle catastali', (e) => {
                if (e.features.length > 0) {
                    map.getCanvas().style.cursor = 'pointer';

                    const feature = e.features[0];
                    const foglio = feature.properties.Foglio;
                    const particella = feature.properties.Paricella;

                    map.setFilter('highlighted-polygon', [
                        'all',
                        ['==', 'Foglio', foglio],
                        ['==', 'Paricella', particella]
                    ]);
                }
            });

            map.on('mousemove', (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['Particelle catastali']
                });

                if (features.length > 0) {
                    const feature = features[0];
                    const foglio = feature.properties.Foglio;
                    const particella = feature.properties.Paricella;

                    map.setFilter('highlighted-polygon', [
                        'all',
                        ['==', 'Foglio', foglio],
                        ['==', 'Paricella', particella]
                    ]);
                } else {
                    map.setFilter('highlighted-polygon', ['==', 'id', '']);
                }
            });

            const buttons = {
                vincoli_lin: 'vincoli_lin',
                vincoli_ar: 'vincoli_ar',
                particelle: 'Particelle catastali',
                carta_tecnica: 'carta_tecnica',
                satellite: 'satellite-layer'
            };

            Object.keys(buttons).forEach(id => {
                const button = document.getElementById(id);
                const layerId = buttons[id];

                button.addEventListener('click', () => {
                    const isActive = button.classList.contains('active');
                    button.classList.toggle('active', !isActive);

                    map.setLayoutProperty(layerId, 'visibility', isActive ? 'none' : 'visible');

                    if (layerId === 'Particelle catastali') {
                        map.setLayoutProperty('particelle-labels', 'visibility', isActive ? 'none' : 'visible');
                    }
                });
            });

            document.getElementById('vincoli-main').addEventListener('click', function() {
                const vincoliContainer = document.querySelector('.vincoli-container');
                vincoliContainer.classList.toggle('active');
            });

            map.addLayer({
                id: 'highlighted-polygon',
                type: 'fill',
                source: 'catasto',
                'source-layer': 'particelle',
                paint: {
                    'fill-color': '#ffff00', 
                    'fill-opacity': 0.5,    
                    'fill-outline-color': '#ff0000' 
                },
                filter: ['==', 'id', ''] 
            });
        });

        let currentPopup = null;

        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['cs', 'Info Vin. areali', 'Info Vin. lineari', 'Info Netto storico', 'Info ZTO', 'Particelle catastali']
            });

            if (features.length > 0) {
                if (currentPopup) {
                    currentPopup.remove();
                    currentPopup = null;
                }

                const unifiedTooltipContent = features.map(feature => {
                    let content = '';
                    if (feature.layer.id === 'cs') {
                        content = `<b> Strumento Urbanistico:</b> PPE<br><b>Circoscrizione:</b> ${feature.properties.Circoscriz || 'N/A'}`;
                    } else if (feature.layer.id === 'Info Vin. areali') {
                        content = `<b>Vicolo areale</b><br><b>Tipo:</b> ${feature.properties.tipo || 'N/A'}<br><b>Descrizione:</b> ${feature.properties.descrizone || 'N/A'}`;
                    } else if (feature.layer.id === 'Info Vin. lineari') {
                        content = `<b>Vicolo lineare</b><br><b>Tipo:</b> ${feature.properties.TIPO || 'N/A'}<br><b>Descrizione:</b> ${feature.properties.DESCRIZION || 'N/A'}`;
                    } else if (feature.layer.id === 'Info Netto storico') {
                        content = `<b>Netto storico</b><br><b>ZTO:</b> ${feature.properties.ZTO || 'N/A'}<br><b>Descrizione:</b> ${feature.properties.DESCRIZION || 'N/A'}`;
                    } else if (feature.layer.id === 'Info ZTO') {
                        content = `<b>Zonizzazione</b><br><b>ZTO:</b> ${feature.properties.ZTO || 'N/A'}<br><b>Descrizione:</b> ${feature.properties.DESCRIZION || 'N/A'}`;
                    } else if (feature.layer.id === 'Particelle catastali') {
                        content = `<b>Particelle catastali</b><br><b>Foglio:</b> ${feature.properties.Foglio || 'N/A'}<br><b>Particella:</b> ${feature.properties.Paricella || 'N/A'}`;
                    }
                    return content;
                }).join('<hr>');

                currentPopup = new maplibregl.Popup({ closeOnClick: true })
                    .setLngLat(e.lngLat)
                    .setHTML(unifiedTooltipContent)
                    .addTo(map);
            }
        });

        map.on('mouseenter', ['cs', 'Info Vin. areali', 'Info Vin. lineari', 'Info Netto storico', 'Info ZTO', 'Particelle catastali'], () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', ['cs', 'Info Vin. areali', 'Info Vin. lineari', 'Info Netto storico', 'Info ZTO', 'Particelle catastali'], () => {
            map.getCanvas().style.cursor = 'default';
        });