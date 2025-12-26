        // Funzione per convertire coordinate da EPSG:3857 a WGS84
        function toWGS84(x, y) {
            const R = 6378137;
            const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
            const lon = (x / R) * (180 / Math.PI);
            return [lat, lon];
        }

        // Funzione per rilevare se le coordinate sono in EPSG:3857 o WGS84
        function isEPSG3857(coord) {
            // Le coordinate EPSG:3857 sono molto grandi (milioni), WGS84 sono piccole (-180 a 180 per lon, -90 a 90 per lat)
            return Math.abs(coord[0]) > 200 || Math.abs(coord[1]) > 200;
        }

        // Inizializza mappa
        const centerPalermo = [38.1250, 13.3550];

        // Definisci i bounds del comune di Palermo
        const palermoBounds = [
            [38.05, 13.25],  // Angolo sud-ovest
            [38.20, 13.43]   // Angolo nord-est
        ];

        const map = L.map('map', {
            zoomControl: false,
            attributionControl: true,
            maxBounds: palermoBounds,
            maxBoundsViscosity: 1.0  // 1.0 = bounds rigidi, 0.0 = bounds morbidi
        }).setView(centerPalermo, 16);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO - Rielaborazione dati: @opendatasicilia - @gbvitrano',
            subdomains: 'abcd',
			minZoom: 14,
            maxZoom: 20
        }).addTo(map);

        // Aggiungi funzionalità hash per condividere posizione mappa via URL
        const hash = new L.Hash(map);

        const streetLayers = {};
        const allStreetNames = new Set();
        const allCoords = [];

        // Carica e visualizza dati dai file GeoJSON
        Promise.all([
            fetch('geojson/Chiusura.geojson').then(r => r.json()),
            fetch('geojson/Divieto.geojson').then(r => r.json())
        ]).then(([chiusura, divieto]) => {
            // Processa chiusure al transito (rosso)
            chiusura.features.forEach(feature => {
                const name = feature.properties.Odonimo || feature.properties.UFF_DENOMINAZIONE;
                allStreetNames.add(name);

                feature.geometry.coordinates.forEach(lineString => {
                    // Converti coordinate in base al sistema di riferimento
                    const coords = lineString.map(coord => {
                        if (isEPSG3857(coord)) {
                            // Converti da EPSG:3857 a WGS84 e poi inverti per Leaflet
                            return toWGS84(coord[0], coord[1]);
                        } else {
                            // Già in WGS84, inverti solo [lon, lat] -> [lat, lon]
                            return [coord[1], coord[0]];
                        }
                    });
                    allCoords.push(...coords);

                    // Linea di sfondo
                    L.polyline(coords, {
                        color: '#E63946',
                        weight: 14,
                        opacity: 0.25,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    // Linea principale
                    const polyline = L.polyline(coords, {
                        color: '#E63946',
                        weight: 6,
                        opacity: 0.9,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    polyline.bindPopup('<div class="popup-title">' + name + '</div><div class="popup-status">🚫 Chiusura al transito veicolare</div>');

                    if (!streetLayers[name]) streetLayers[name] = [];
                    streetLayers[name].push({ layer: polyline, coords: coords, type: 'chiusura' });
                });
            });

            // Processa divieti di sosta (#ff9900)
            divieto.features.forEach(feature => {
                const name = feature.properties.Odonimo || feature.properties.UFF_DENOMINAZIONE;
                allStreetNames.add(name);

                feature.geometry.coordinates.forEach(lineString => {
                    // Converti coordinate in base al sistema di riferimento
                    const coords = lineString.map(coord => {
                        if (isEPSG3857(coord)) {
                            // Converti da EPSG:3857 a WGS84 e poi inverti per Leaflet
                            return toWGS84(coord[0], coord[1]);
                        } else {
                            // Già in WGS84, inverti solo [lon, lat] -> [lat, lon]
                            return [coord[1], coord[0]];
                        }
                    });
                    allCoords.push(...coords);

                    // Linea di sfondo
                    L.polyline(coords, {
                        color: '#ff9900',
                        weight: 14,
                        opacity: 0.25,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    // Linea principale
                    const polyline = L.polyline(coords, {
                        color: '#ff9900',
                        weight: 6,
                        opacity: 0.9,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    polyline.bindPopup('<div class="popup-title">' + name + '</div><div class="popup-status">🚷 Divieto di sosta con rimozione coatta</div>');

                    if (!streetLayers[name]) streetLayers[name] = [];
                    streetLayers[name].push({ layer: polyline, coords: coords, type: 'divieto' });
                });
            });

            // Aggiorna statistiche
            document.getElementById('streetCount').textContent = allStreetNames.size;

            // Marker per il centro eventi
            const markerIcon = L.divIcon({
                html: '<div class="custom-marker" style="width:40px;height:40px;font-size:24px;display:flex;align-items:center;justify-content:center;">🎉</div>',
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            L.marker([38.1243, 13.3547], { icon: markerIcon }).addTo(map).bindPopup('<div class="popup-title">Piazza Castelnuovo</div><div class="popup-status">🎉 Centro Eventi Capodanno 2026</div>');

            // Popola lista strade
            const listEl = document.getElementById('streetList');
            const sortedStreets = Array.from(allStreetNames).sort();
            sortedStreets.forEach(strada => {
                const div = document.createElement('div');
                div.className = 'street-item';

                // Aggiungi icona in base al tipo
                const types = streetLayers[strada].map(l => l.type);
                if (types.includes('chiusura') && types.includes('divieto')) {
                    div.style.setProperty('--dot-color', 'linear-gradient(90deg, #E63946 50%, #ff9900 50%)');
                } else if (types.includes('divieto')) {
                    div.style.borderLeft = '4px solid #ff9900';
                } else {
                    div.style.borderLeft = '4px solid #E63946';
                }

                div.textContent = strada;

                if (streetLayers[strada] && streetLayers[strada].length > 0) {
                    div.onclick = () => {
                        const layers = streetLayers[strada];
                        const midLayer = layers[Math.floor(layers.length / 2)];
                        const midCoord = midLayer.coords[Math.floor(midLayer.coords.length / 2)];
                        map.setView(midCoord, 18);
                        midLayer.layer.openPopup();
                    };
                }
                listEl.appendChild(div);
            });

            // Adatta vista a tutte le strade
            if (allCoords.length > 0) {
                map.fitBounds(L.latLngBounds(allCoords), { padding: [80, 80] });
            }
        }).catch(error => {
            console.error('Errore nel caricamento dei dati:', error);
        });

        function toggleStreetPanel() {
            document.getElementById('streetPanel').classList.toggle('active');
        }

        function resetView() {
            if (allCoords.length > 0) {
                map.fitBounds(L.latLngBounds(allCoords), { padding: [80, 80] });
            }
        }

        function toggleInfoPanel() {
            // Solo su mobile
            if (window.innerWidth > 768) return;

            const panel = document.getElementById('infoPanel');
            panel.classList.toggle('collapsed');
        }

        // Inizializza il pannello come chiuso su mobile al caricamento
        window.addEventListener('DOMContentLoaded', function() {
            if (window.innerWidth <= 768) {
                const panel = document.getElementById('infoPanel');
                panel.classList.add('collapsed');
            }

            // Inizializza la sezione crediti come chiusa
            const creditsSection = document.querySelector('.credits-section');
            if (creditsSection) {
                creditsSection.classList.add('collapsed');
            }
        });

        // Gestisci il resize
        window.addEventListener('resize', function() {
            const panel = document.getElementById('infoPanel');
            if (window.innerWidth > 768) {
                panel.classList.remove('collapsed');
            }
        });

        // Funzione per toggle crediti
        function toggleCredits() {
            const creditsSection = document.querySelector('.credits-section');
            creditsSection.classList.toggle('collapsed');
        }

        // Funzioni per il modale
        function openModal() {
            document.getElementById('trafficModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('trafficModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // Chiudi il modale cliccando fuori dal contenuto
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('trafficModal');
            if (event.target === modal) {
                closeModal();
            }
        });

        // Chiudi il modale con il tasto ESC
        window.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });

        // Variabile globale per l'audio
        let podcastAudio = null;

        // Funzione per gestire la riproduzione del podcast
        function playPodcast() {
            // Se l'audio non esiste ancora, crealo
            if (!podcastAudio) {
                podcastAudio = new Audio('audio/Silenzio_e_sicurezza_dietro_il_Capodanno.m4a');

                // Gestisci eventuali errori di caricamento
                podcastAudio.addEventListener('error', function(e) {
                    alert('Errore nel caricamento del podcast. Verifica che il file audio esista.');
                    console.error('Errore audio:', e);
                });
            }

            // Se l'audio è in pausa, riproduci, altrimenti metti in pausa
            if (podcastAudio.paused) {
                podcastAudio.play().catch(function(error) {
                    console.error('Errore nella riproduzione:', error);
                    alert('Impossibile riprodurre il podcast. Riprova.');
                });
            } else {
                podcastAudio.pause();
            }
        }

        // Funzione per scaricare l'infografica
        function downloadInfographic() {
            const link = document.createElement('a');
            link.href = 'img/infografica.png';
            link.download = 'infografica_capodanno_2026_palermo.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }