const PALERMO_CENTER = [13.350, 38.121];
const BASE_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const map = new maplibregl.Map({
    container: "map",
    style: BASE_STYLE,
    center: PALERMO_CENTER,
    zoom: 14.5,
    minZoom: 11,
    maxZoom: 19,
    maxBounds: [
        [13.08, 38.0],
        [13.6, 38.3],
    ],
    hash: true,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: { compact: true },
});
map.touchZoomRotate.disableRotation();
map.keyboard.disableRotation();

map.on('load', () => {
    map.addSource('google-satellite', {
        type: 'raster',
        tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
        tileSize: 256,
        attribution: '&copy; Google',
    });
    map.addLayer({
        id: 'google-satellite-layer',
        type: 'raster',
        source: 'google-satellite',
        layout: { visibility: 'none' },
    });
});

let satelliteOn = false;
function toggleSatellite() {
    satelliteOn = !satelliteOn;
    map.setLayoutProperty('google-satellite-layer', 'visibility', satelliteOn ? 'visible' : 'none');
    document.getElementById('satelliteBtn').classList.toggle('active', satelliteOn);
}

function mapZoomIn() { map.zoomIn(); }
function mapZoomOut() { map.zoomOut(); }

let fitBoundsTarget = null;

function resetView() {
    if (fitBoundsTarget) {
        map.fitBounds(fitBoundsTarget, { padding: 80, maxZoom: 18 });
    }
}

function toggleInfoPanel() {
    if (window.innerWidth > 768) return;
    document.getElementById('infoPanel').classList.toggle('collapsed');
}

function toggleCredits() {
    document.querySelector('.credits-section').classList.toggle('collapsed');
}

function toggleStreetPanel() {
    document.getElementById('streetPanel').classList.toggle('active');
}

window.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth <= 768) {
        document.getElementById('infoPanel').classList.add('collapsed');
    }
    document.querySelector('.credits-section').classList.add('collapsed');
});

window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        document.getElementById('infoPanel').classList.remove('collapsed');
    }
});

function extendBounds(bounds, coords) {
    for (const c of coords) {
        if (Array.isArray(c[0])) {
            extendBounds(bounds, c);
        } else {
            bounds.extend(c);
        }
    }
}

function formatLunghezza(metri) {
    if (!metri) return null;
    return metri >= 1000 ? (metri / 1000).toFixed(2) + ' km' : Math.round(metri) + ' m';
}

const TIPI_STRADA = {
    residential: 'Strada residenziale',
    tertiary: 'Strada terziaria',
    secondary: 'Strada secondaria',
    primary: 'Strada primaria',
    unclassified: 'Strada non classificata',
    living_street: 'Zona residenziale',
    pedestrian: 'Area pedonale',
};

function tipoStrada(highway) {
    return TIPI_STRADA[highway] || null;
}

function buildPopupHTML(nome, isApprossimato, lungLabel, highway, territorio) {
    const statoTesto = isApprossimato
        ? 'Geometria ricostruita, non da dato OSM originale'
        : 'Lavori di rifacimento manto stradale';
    const badgeClass = isApprossimato ? 'popup-badge approssimato' : 'popup-badge';
    const tipo = tipoStrada(highway);
    const tipoHTML = tipo ? '<div class="popup-tipo">' + tipo + '</div>' : '';
    const lungHTML = lungLabel ? '<div class="popup-lunghezza">' + lungLabel + '</div>' : '';

    const territorioRows = [];
    if (territorio && territorio.circoscrizione) {
        territorioRows.push('<div class="popup-territorio-row"><span class="popup-territorio-label">Circoscrizione</span><span>' + territorio.circoscrizione + '</span></div>');
    }
    if (territorio && territorio.quartiere) {
        territorioRows.push('<div class="popup-territorio-row"><span class="popup-territorio-label">Quartiere</span><span>' + territorio.quartiere + '</span></div>');
    }
    if (territorio && territorio.upl) {
        territorioRows.push('<div class="popup-territorio-row"><span class="popup-territorio-label">UPL</span><span>' + territorio.upl + '</span></div>');
    }
    const territorioHTML = territorioRows.length
        ? '<div class="popup-territorio">' + territorioRows.join('') + '</div>'
        : '';

    return '<div class="popup-title">' + nome + '</div>' +
        '<div class="' + badgeClass + '">🚧 ' + statoTesto + '</div>' +
        tipoHTML + lungHTML + territorioHTML;
}

map.on('load', () => {
    fetch('dati/vie_lavori_stradali.geojson')
        .then(res => res.json())
        .then(data => {
            let totalKm = 0;
            const streetFeatures = {};
            const bounds = new maplibregl.LngLatBounds();

            data.features.forEach(feature => {
                const nome = feature.properties.nome || 'Via senza nome';
                if (!streetFeatures[nome]) streetFeatures[nome] = [];
                streetFeatures[nome].push(feature);
                if (feature.properties.lunghezza_m) totalKm += feature.properties.lunghezza_m;
                extendBounds(bounds, feature.geometry.coordinates);
            });
            fitBoundsTarget = bounds;

            map.addSource('vie-lavori', { type: 'geojson', data });

            map.addLayer({
                id: 'vie-piazze-fill',
                type: 'fill',
                source: 'vie-lavori',
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: { 'fill-color': '#F4A100', 'fill-opacity': 0.2 },
            });
            map.addLayer({
                id: 'vie-piazze-outline',
                type: 'line',
                source: 'vie-lavori',
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: { 'line-color': '#F4A100', 'line-width': 3, 'line-dasharray': [2, 2] },
            });
            map.addLayer({
                id: 'vie-linee',
                type: 'line',
                source: 'vie-lavori',
                filter: ['all', ['==', ['geometry-type'], 'LineString'], ['!=', ['get', 'approssimato'], true]],
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': '#E63946',
                    'line-width': 5,
                    'line-opacity': 0.9,
                },
            });
            map.addLayer({
                id: 'vie-linee-approssimate',
                type: 'line',
                source: 'vie-lavori',
                filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'approssimato'], true]],
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': '#F4A100',
                    'line-width': 4,
                    'line-dasharray': [2, 2],
                    'line-opacity': 0.9,
                },
            });

            const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' });
            const clickableLayers = ['vie-linee', 'vie-linee-approssimate', 'vie-piazze-fill'];

            clickableLayers.forEach(layerId => {
                map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
                map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
                map.on('click', layerId, (e) => {
                    const props = e.features[0].properties;
                    const nome = props.nome || 'Via senza nome';
                    const lungTotale = (streetFeatures[nome] || []).reduce((sum, f) => sum + (f.properties.lunghezza_m || 0), 0);
                    popup
                        .setLngLat(e.lngLat)
                        .setHTML(buildPopupHTML(nome, !!props.approssimato, formatLunghezza(lungTotale), props.highway, {
                            circoscrizione: props.circoscrizione,
                            quartiere: props.quartiere,
                            upl: props.upl,
                        }))
                        .addTo(map);
                });
            });

            document.getElementById('streetCount').textContent = Object.keys(streetFeatures).length;
            document.getElementById('streetKm').textContent = (totalKm / 1000).toFixed(1);

            const circStats = {};
            data.features.forEach(feature => {
                const circ = feature.properties.circoscrizione || 'N/D';
                if (!circStats[circ]) circStats[circ] = { vie: new Set(), metri: 0 };
                circStats[circ].vie.add(feature.properties.nome || 'Via senza nome');
                circStats[circ].metri += feature.properties.lunghezza_m || 0;
            });
            const circEntries = Object.entries(circStats).sort((a, b) => b[1].metri - a[1].metri);
            const maxMetri = circEntries.length ? circEntries[0][1].metri : 1;
            const circListEl = document.getElementById('circBreakdownList');
            circEntries.forEach(([circ, stat]) => {
                const row = document.createElement('div');
                row.className = 'circ-breakdown-row';

                const nomeSpan = document.createElement('span');
                nomeSpan.className = 'circ-breakdown-nome';
                nomeSpan.textContent = circ + ' Circ.';
                row.appendChild(nomeSpan);

                const barWrap = document.createElement('div');
                barWrap.className = 'circ-breakdown-bar-wrap';
                const bar = document.createElement('div');
                bar.className = 'circ-breakdown-bar';
                bar.style.width = Math.max(4, (stat.metri / maxMetri) * 100) + '%';
                barWrap.appendChild(bar);
                row.appendChild(barWrap);

                const valsSpan = document.createElement('span');
                valsSpan.className = 'circ-breakdown-vals';
                valsSpan.textContent = stat.vie.size + ' vie · ' + formatLunghezza(stat.metri);
                row.appendChild(valsSpan);

                circListEl.appendChild(row);
            });

            const listEl = document.getElementById('streetList');
            const sortedStreets = Object.keys(streetFeatures).sort();
            sortedStreets.forEach(nome => {
                const features = streetFeatures[nome];
                const isApprossimato = features.some(f => f.properties.approssimato);
                const lungTotale = features.reduce((sum, f) => sum + (f.properties.lunghezza_m || 0), 0);
                const lungLabel = formatLunghezza(lungTotale);
                const div = document.createElement('div');
                div.className = 'street-item' + (isApprossimato ? ' approssimato' : '');
                const nomeSpan = document.createElement('span');
                nomeSpan.className = 'street-item-nome';
                nomeSpan.textContent = nome;
                div.appendChild(nomeSpan);
                if (lungLabel) {
                    const lungSpan = document.createElement('span');
                    lungSpan.className = 'street-item-lunghezza';
                    lungSpan.textContent = lungLabel;
                    div.appendChild(lungSpan);
                }
                div.onclick = () => {
                    const b = new maplibregl.LngLatBounds();
                    features.forEach(f => extendBounds(b, f.geometry.coordinates));
                    map.fitBounds(b, { padding: 120, maxZoom: 18 });
                    popup
                        .setLngLat(b.getCenter())
                        .setHTML(buildPopupHTML(nome, isApprossimato, lungLabel, features[0].properties.highway, {
                            circoscrizione: features[0].properties.circoscrizione,
                            quartiere: features[0].properties.quartiere,
                            upl: features[0].properties.upl,
                        }))
                        .addTo(map);
                };
                listEl.appendChild(div);
            });

            map.fitBounds(bounds, { padding: 40 });
        })
        .catch(err => console.error('Errore caricamento GeoJSON:', err));
});
