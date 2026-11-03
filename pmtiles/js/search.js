import * as maplibregl from 'maplibre-gl';
import { buildInfoCard, openScheda } from './card.js';
import { state } from './state.js';
import { closePanel, esc } from './ui.js';

export function loadCiviciIndex(url) {
    fetch(url)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            state.civiciIndex = data;
            state.odonomiList = Object.keys(data).sort();
        })
        .catch(() => {
            // fallback: estrazione dai tile caricati nel viewport
            state.civiciIndex = null;
        });
}

export function extractOdonomi() {
    if (state.civiciIndex) return; // indice già caricato, non serve riestrarre dai tile
    if (!state.map) return;
    state.map.once('idle', () => {
        const features = state.map.querySourceFeatures("civici", { sourceLayer: "civici_wgs84" });
        const set = new Set();
        features.forEach(f => { if (f.properties.Odonimo) set.add(f.properties.Odonimo.toUpperCase()); });
        state.odonomiList = Array.from(set).sort();
    });
}

export function renderOdonimoDropdown(matches) {
    const dropdown = document.getElementById("odonimo-dropdown");
    if (!dropdown) return;
    if (matches.length === 0) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = matches.map(m =>
        `<div class="odonimo-option" data-name="${esc(m)}">${esc(m)}</div>`
    ).join('');
    dropdown.style.display = 'block';
}

export function closeOdonimoDropdown() {
    const dropdown = document.getElementById("odonimo-dropdown");
    if (dropdown) dropdown.style.display = 'none';
}

export function placeCivicoMarker(coords) {
    if (state.civicoMarker) {
        state.civicoMarker.remove();
        state.civicoMarker = null;
    }
    const el = document.createElement('div');
    el.className = 'civico-marker';
    state.civicoMarker = new maplibregl.Marker({ element: el, anchor: 'top' })
        .setLngLat(coords)
        .addTo(state.map);
}

export function selectOdonimo(name) {
    document.getElementById('odonimo').value = name;
    closeOdonimoDropdown();
    const civicoInput = document.getElementById('civico-search');
    if (civicoInput) civicoInput.focus();
}

export function switchSearchMode(mode) {
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

    if (state.map && state.map.getLayer("Numeri Civici")) {
        if (mode === 'civico') {
            state.civiciWasVisible = state.map.getLayoutProperty("Numeri Civici", "visibility") === "visible";
            state.map.setLayoutProperty("Numeri Civici", "visibility", "visible");
            const btn = document.getElementById("civici");
            if (btn) btn.classList.add("active");
            extractOdonomi();
        } else if (!state.civiciWasVisible) {
            state.map.setLayoutProperty("Numeri Civici", "visibility", "none");
            const btn = document.getElementById("civici");
            if (btn) btn.classList.remove("active");
        }
    }

    requestAnimationFrame(() => {
        const input = document.getElementById(mode === 'foglio' ? 'foglio' : 'odonimo');
        if (input) input.focus();
    });
}

export function searchByCivico() {
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
    if (state.civiciIndex) {
        const viaData = state.civiciIndex[odonimo];
        if (!viaData) {
            errorDiv.textContent = `Via "${odonimo}" non trovata`;
            return;
        }
        const coords = viaData[civico];
        if (!coords) {
            const civiciDisp = Object.keys(viaData).sort((a, b) => parseInt(a) - parseInt(b)).slice(0, 10).join(', ');
            errorDiv.textContent = `Civico "${civico}" non trovato in ${odonimo}. Civici disponibili: ${civiciDisp}`;
            if (state.isMobile && navigator.vibrate) navigator.vibrate([100, 50, 100]);
            return;
        }
        closePanel();
        state.map.flyTo({ center: coords, zoom: 17, duration: 800 });
        placeCivicoMarker(coords);
        return;
    }

    // --- fallback: ricerca sui tile del viewport (richiede zoom ≥ 14) ---
    if (state.map.getZoom() < 14) {
        errorDiv.textContent = "Dati civici non ancora caricati. Aumenta lo zoom (almeno livello 14) e riprova.";
        return;
    }

    errorDiv.textContent = "Ricerca in corso…";

    const doSearch = () => {
        const features = state.map.querySourceFeatures("civici", { sourceLayer: "civici_wgs84" });

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
            if (state.isMobile && navigator.vibrate) navigator.vibrate([100, 50, 100]);
            return;
        }

        errorDiv.textContent = "";
        closePanel();
        state.map.flyTo({ center: match.geometry.coordinates, zoom: 17, duration: 800 });
        placeCivicoMarker(match.geometry.coordinates);
    };

    if (state.map.loaded()) {
        doSearch();
    } else {
        state.map.once('idle', doSearch);
    }
}

export function searchParticella() {
    const foglio = document.getElementById("foglio").value;
    const particella = document.getElementById("particella").value;
    const errorDiv = document.getElementById("search-error");
    const pdfTab = document.getElementById("pdf-tab");
    const pdfCmd = document.getElementById("pdf-cmd");

    if (!foglio || !particella) {
        errorDiv.textContent = "Inserire sia il Foglio che la Particella";
        if (pdfTab) pdfTab.style.display = "none";
        if (pdfCmd) pdfCmd.style.display = "none";
        
        if (state.isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        return;
    }

    const features = state.map.querySourceFeatures("catasto", {
        sourceLayer: "particelle",
        filter: ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]
    });

    if (features.length > 0) {
        errorDiv.textContent = "";
        state.currentParticella = {
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

        const padding = state.isMobile ? 20 : 50;
        const maxZoom = state.isMobile ? 16.5 : 17.5;
        
        state.map.fitBounds(bounds, { padding: padding, maxZoom: maxZoom });

        if (state.map.getLayer("highlighted-polygon")) {
            state.map.setFilter("highlighted-polygon", ["all", ["==", "Foglio", foglio], ["==", "Paricella", particella]]);
        }

        openScheda({
            particella: { foglio, particella },
            html: buildInfoCard('Particella catastale', [{ lbl: 'Foglio', val: foglio }, { lbl: 'Particella', val: particella }], 'table-cells') +
                '<p class="sc-src">Tocca la particella sulla mappa per vedere zonizzazione, vincoli e quotazioni OMI.</p>'
        });

        closePanel();
        
        if (state.isMobile && navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
    } else {
        errorDiv.textContent = "Nessuna particella trovata con i parametri specificati o la particella richiesta non è visibile nell'area corrente";
        if (pdfTab) pdfTab.style.display = "none";
        if (pdfCmd) pdfCmd.style.display = "none";
        
        if (state.map.getLayer("highlighted-polygon")) {
            state.map.setFilter("highlighted-polygon", ["==", "id", ""]);
        }
        
        if (state.isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
}

// collegamenti dei campi di ricerca (Invio, suggerimenti della via)
export function initSearch() {
    const enter = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); fn(); } });
    };
    enter('foglio', searchParticella);
    enter('particella', searchParticella);
    enter('civico-search', searchByCivico);

    const odonimoInput = document.getElementById('odonimo');
    const dropdown = document.getElementById('odonimo-dropdown');
    if (odonimoInput) {
        odonimoInput.addEventListener('input', function () {
            const val = this.value.trim().toUpperCase();
            if (val.length < 3 || !state.odonomiList) { closeOdonimoDropdown(); return; }
            renderOdonimoDropdown(state.odonomiList.filter(o => o.includes(val)).slice(0, 12));
        });

        odonimoInput.addEventListener('keydown', function (e) {
            const items = dropdown.querySelectorAll('.odonimo-option');
            const active = dropdown.querySelector('.odonimo-option.highlighted');
            const idx = active ? Array.from(items).indexOf(active) : -1;
            const move = el => { if (el) { if (active) active.classList.remove('highlighted'); el.classList.add('highlighted'); el.scrollIntoView({ block: 'nearest' }); } };
            if (e.key === 'ArrowDown') { e.preventDefault(); move(items[idx + 1] || items[0]); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(items[idx - 1] || items[items.length - 1]); }
            else if (e.key === 'Enter') { e.preventDefault(); if (active) selectOdonimo(active.textContent); else searchByCivico(); }
            else if (e.key === 'Escape') closeOdonimoDropdown();
        });
    }
    // suggerimenti: mousedown (non click) per anticipare il blur dell'input
    if (dropdown) dropdown.addEventListener('mousedown', e => {
        const opt = e.target.closest('.odonimo-option');
        if (opt) selectOdonimo(opt.dataset.name);
    });
    document.addEventListener('click', e => { if (!e.target.closest('#search-mode-civico')) closeOdonimoDropdown(); });
}
