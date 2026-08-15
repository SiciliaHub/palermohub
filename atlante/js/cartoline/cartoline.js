(function () {
  var cartolineLayer = L.layerGroup();
  var cardById = {};
  var markerById = {};
  var allFeatureProps = [];

  // filtri della sidebar destra: interconnessi "a scalare" (faceted filtering) —
  // scegliendo un valore in uno, gli altri select si ripopolano mostrando solo
  // le opzioni ancora compatibili con la selezione corrente (calcolate escludendo
  // se stessi, altrimenti un select potrebbe auto-svuotarsi la propria selezione)
  var FILTER_DEFS = [
    { key: 'circoscrizione', field: 'Circoscrizione', selectId: 'cartoline-filter-circoscrizione', label: 'Circoscrizione' },
    { key: 'zona', field: 'Quartiere', selectId: 'cartoline-filter-zona', label: 'Quartiere' },
    { key: 'upl', field: 'UPL', selectId: 'cartoline-filter-upl', label: 'UPL' },
    { key: 'place', field: 'geographic_place', selectId: 'cartoline-filter-place', label: 'Zona' },
    { key: 'album', field: 'album_title', selectId: 'cartoline-filter-album', label: 'Album' }
  ];
  var currentFilters = {};
  FILTER_DEFS.forEach(function (def) { currentFilters[def.key] = ''; });

  // colore del bordo card per Circoscrizione: hash del nome su una palette
  // fissa cosi' lo stesso valore ottiene sempre lo stesso colore, senza
  // dover mantenere una mappa esplicita nome->colore
  var ZONE_COLORS = ['#2277cc', '#cc4444', '#2e9e5b', '#b96a00', '#7a4fc4', '#c43f8f', '#3aa3a3', '#8a8a2e'];
  function colorForZone(name) {
    if (!name) { return '#ccc'; }
    var hash = 0;
    for (var i = 0; i < name.length; i++) { hash = (hash * 31 + name.charCodeAt(i)) | 0; }
    return ZONE_COLORS[Math.abs(hash) % ZONE_COLORS.length];
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function cardId(f) { return 'ct-card-' + f.properties.risorsa; }

  // le miniature sono scaricate in locale da scripts/download_cartoline_thumbs.py
  // (size Flickr _n 320px per la gallery, _q 150x150 per il popup marker): niente
  // piu' richieste verso staticflickr.com, servite dallo stesso dominio del sito
  function cartolinaThumb(risorsa, suffix) {
    return 'atlante/img/cartoline/' + suffix + '/' + risorsa + '.jpg';
  }

  function passesFilter(props, exceptKey) {
    return FILTER_DEFS.every(function (def) {
      if (def.key === exceptKey) { return true; }
      var val = currentFilters[def.key];
      return !val || props[def.field] === val;
    });
  }

  var showAllOverride = false;
  var lastRenderedIds = [];

  function dotIcon() {
    return L.divIcon({
      className: 'ct-dot-wrap',
      html: '<div class="ct-dot"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -8]
    });
  }

  // crea sempre un marker NUOVO (mai riposizionare via setLatLng un marker gia'
  // esistente e con popup gia' bindato): in questa Leaflet 0.7.x un marker che ha
  // subito piu' cicli di add/remove/setLatLng puo' finire con un popup che si
  // apre fuori schermo (bottom/top calcolati su un containing block sbagliato,
  // bug riscontrato con l'apertura a ventaglio). Un marker fresco con bindPopup
  // fatto sulla posizione definitiva non ha questo problema.
  function createCartolineMarker(id, latlng, popupHtml) {
    var marker = L.marker(latlng, { icon: dotIcon() });
    marker.bindPopup(popupHtml);
    marker.on('popupopen', function () {
      var link = document.querySelector('[data-goto-card="' + id + '"]');
      if (link) {
        link.addEventListener('click', function (e) { e.preventDefault(); goToCard(id); });
      }
    });
    return marker;
  }

  // clustering "fatto in casa": il plugin leaflet.markercluster vendorizzato nel
  // progetto (lib/js/qgi2web/leaflet.markercluster.js) richiede L.FeatureGroup.addEventParent,
  // API di Leaflet 1.x — ma atlante/js/leaflet/leaflet.js e' Leaflet 0.7.x, quindi il
  // plugin va in errore JS bloccante (gia' verificato). Con centinaia di marker serve
  // pero' un raggruppamento visivo: si raggruppano qui i marker vicini (griglia in pixel
  // alla proiezione dello zoom corrente) e si ricalcola ad ogni zoomend. Il clustering
  // e' sempre attivo quando ci sono piu' marker sovrapposti: un solo id non forma mai
  // un cluster, quindi non serve un interruttore dedicato per attivarlo/disattivarlo.
  function computeClusters(ids) {
    var zoom = map.getZoom();
    var cellSize = 56;
    var buckets = {};
    ids.forEach(function (id) {
      var pt = map.project(markerById[id].marker.getLatLng(), zoom);
      var key = Math.floor(pt.x / cellSize) + '_' + Math.floor(pt.y / cellSize);
      (buckets[key] = buckets[key] || []).push(id);
    });
    return Object.keys(buckets).map(function (k) { return buckets[k]; });
  }

  function renderCartolineLayer(ids) {
    lastRenderedIds = ids;
    collapseSpiderfy();
    cartolineLayer.clearLayers();
    if (ids.length <= 1) {
      ids.forEach(function (id) { cartolineLayer.addLayer(markerById[id].marker); });
      return;
    }
    computeClusters(ids).forEach(function (groupIds) {
      if (groupIds.length === 1) {
        cartolineLayer.addLayer(markerById[groupIds[0]].marker);
        return;
      }
      var latlngs = groupIds.map(function (id) { return markerById[id].marker.getLatLng(); });
      var bounds = L.latLngBounds(latlngs);
      var size = groupIds.length < 10 ? 32 : (groupIds.length < 50 ? 40 : 48);
      var clusterMarker = L.marker(bounds.getCenter(), {
        // zIndexOffset alto: nella pila di marker (ordinati per Y, vedi fix piu'
        // sotto per i popup) un cluster deve sempre restare cliccabile sopra
        // agli eventuali marker singoli o altri cluster con cui si sovrappone
        zIndexOffset: 1000,
        icon: L.divIcon({
          html: '<div class="ct-cluster-icon" style="width:' + size + 'px;height:' + size + 'px;line-height:' + size + 'px;">' + groupIds.length + '</div>',
          className: 'ct-cluster-wrap',
          iconSize: [size, size]
        })
      });
      clusterMarker.on('click', function () {
        collapseSpiderfy();
        // se il fitBounds non farebbe zoommare oltre lo zoom attuale, i punti
        // sono troppo vicini/coincidenti per separarsi zoomando: si aprono a
        // ventaglio invece di restare bloccati sullo stesso cluster
        var targetZoom = map.getBoundsZoom(bounds, false, L.point(50, 50));
        if (targetZoom > map.getZoom()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        } else {
          cartolineLayer.removeLayer(clusterMarker);
          spiderfy(bounds.getCenter(), groupIds);
        }
      });
      cartolineLayer.addLayer(clusterMarker);
    });
  }

  // "apertura a ventaglio": dispone i marker di un cluster non ulteriormente
  // separabile con lo zoom in cerchio attorno al centro, collegati da una
  // linea sottile, cosi' restano tutti raggiungibili col click
  var spiderfied = null;
  function spiderfy(center, ids) {
    collapseSpiderfy();
    var count = ids.length;
    var radius = Math.max(30, Math.min(80, 18 + count * 5));
    var centerPt = map.latLngToLayerPoint(center);
    var markers = [];
    var legs = [];
    ids.forEach(function (id, i) {
      var angle = (2 * Math.PI * i) / count - Math.PI / 2;
      var pt = centerPt.add(L.point(radius * Math.cos(angle), radius * Math.sin(angle)));
      var latlng = map.layerPointToLatLng(pt);
      var entry = markerById[id];
      // marker temporaneo dedicato al ventaglio (mai il marker originale
      // condiviso: vedi nota su createCartolineMarker)
      var m = createCartolineMarker(id, latlng, entry.popupHtml);
      m.setZIndexOffset(1000);
      cartolineLayer.addLayer(m);
      markers.push(m);
      var leg = L.polyline([center, latlng], { className: 'ct-spider-leg', color: '#FF9900', weight: 1.5, opacity: 0.7 });
      cartolineLayer.addLayer(leg);
      legs.push(leg);
    });
    spiderfied = { markers: markers, legs: legs };
  }
  function collapseSpiderfy() {
    if (!spiderfied) { return; }
    spiderfied.markers.forEach(function (m) { cartolineLayer.removeLayer(m); });
    spiderfied.legs.forEach(function (l) { cartolineLayer.removeLayer(l); });
    spiderfied = null;
  }

  // "Disattiva effetti mappa": spegne l'occhio di bue/swipe della mappa storica
  // sovrapposta (che segue il mouse e puo' disturbare il click sui marker delle
  // cartoline) forzando la modalita' Base cartografica e disattivando il confronto
  // affiancato; riattivandolo si ripristina lo stato precedente (mappa storica e/o
  // affiancato), riusando i controlli gia' presenti nella toolbar della mappa
  // "_mode" del pannello basemap e' solo lo stato della tab aperta nel picker,
  // non riflette cosa e' davvero sulla mappa (la storica di default e' aggiunta
  // inline al caricamento, indipendentemente da _mode): il segnale affidabile
  // e' se basemapsControl.overlayLayer e' effettivamente su map.
  var effectsPrevState = { hadOverlay: false, overlayLayer: null, wasSideBySide: false };
  function setMapEffectsDisabled(disabled) {
    if (disabled) {
      var ov = (typeof basemapsControl !== 'undefined') ? basemapsControl.overlayLayer : null;
      effectsPrevState.wasSideBySide = (typeof sideBySideActive !== 'undefined' && sideBySideActive);
      effectsPrevState.hadOverlay = !!(ov && map.hasLayer(ov));
      effectsPrevState.overlayLayer = ov;
      // deactivateSideBySide riporta a galla la mask occhio-di-bue sottostante:
      // va disattivato per primo, poi si rimuove anche quella
      if (effectsPrevState.wasSideBySide) { deactivateSideBySide(); }
      if (effectsPrevState.hadOverlay) { map.removeLayer(effectsPrevState.overlayLayer); }
      // disabilita anche il pulsante affiancato in toolbar: impedisce di
      // riattivare l'effetto manualmente finche' lo switch resta acceso
      if (typeof sbsBtn !== 'undefined') { L.DomUtil.addClass(sbsBtn, 'disabled'); }
    } else {
      if (typeof sbsBtn !== 'undefined') { L.DomUtil.removeClass(sbsBtn, 'disabled'); }
      if (effectsPrevState.hadOverlay && effectsPrevState.overlayLayer) { map.addLayer(effectsPrevState.overlayLayer); }
      if (effectsPrevState.wasSideBySide) { activateSideBySide(); }
    }
  }

  // il ricalcolo dei cluster serve solo con piu' di un marker: un marker
  // isolato (es. dopo "Vedi sulla mappa") non ha nulla da raggruppare, e
  // rifare clearLayers()+addLayer() qui chiuderebbe subito un popup appena
  // aperto (bug osservato: zoomend dell'animazione di setView arriva dopo
  // openPopup e lo richiude, l'utente vede il popup sparire all'istante)
  map.on('zoomend', function () {
    if (map.hasLayer(cartolineLayer) && lastRenderedIds.length > 1) { renderCartolineLayer(lastRenderedIds); }
  });

  function renderActiveFilterChips() {
    var container = document.getElementById('cartoline-active-filters');
    if (!container) { return; }
    container.innerHTML = '';
    FILTER_DEFS.forEach(function (def) {
      var selectEl = document.getElementById(def.selectId);
      var val = currentFilters[def.key];
      selectEl.classList.toggle('has-value', !!val);
      if (!val) { return; }
      var chip = document.createElement('span');
      chip.className = 'ct-filter-chip';
      chip.innerHTML = '<strong>' + escapeHtml(def.label) + ':</strong> ' + escapeHtml(val) + ' <button type="button" aria-label="Rimuovi filtro ' + escapeHtml(def.label) + '">&times;</button>';
      chip.querySelector('button').addEventListener('click', function () {
        currentFilters[def.key] = '';
        refreshFilterOptions();
        applyFilters();
      });
      container.appendChild(chip);
    });
  }

  function applyFilters() {
    var visible = 0;
    var visibleIds = [];
    Object.keys(cardById).forEach(function (id) {
      var entry = cardById[id];
      var show = passesFilter(entry.props);
      entry.el.classList.toggle('hidden', !show);
      if (show) { visible++; visibleIds.push(id); }
    });
    var total = Object.keys(cardById).length;
    document.getElementById('cartoline-count').textContent = visible + ' / ' + total + ' cartoline';
    document.getElementById('cartoline-empty').style.display = visible === 0 ? 'block' : 'none';
    renderActiveFilterChips();

    // la mappa segue i filtri: se e' attivo almeno un filtro (o "Mostra tutti i
    // marker"), il layer mostra i soli marker che passano i filtri correnti;
    // senza filtri e senza il toggle, il layer resta spento come stato iniziale
    var anyFilterActive = FILTER_DEFS.some(function (def) { return !!currentFilters[def.key]; });
    if (showAllOverride || anyFilterActive) {
      renderCartolineLayer(visibleIds);
      if (!map.hasLayer(cartolineLayer)) { map.addLayer(cartolineLayer); }
      // un filtro attivo deve portare in vista i risultati: senza questo la
      // mappa resta ferma sulla vista precedente e i cluster filtrati possono
      // finire fuori schermo, invisibili finche' l'utente non panna a mano
      if (anyFilterActive && visibleIds.length > 0) {
        var filteredLatLngs = visibleIds.map(function (id) { return markerById[id].marker.getLatLng(); });
        map.fitBounds(L.latLngBounds(filteredLatLngs), { padding: [50, 50], maxZoom: 17 });
      }
    } else {
      collapseSpiderfy();
      cartolineLayer.clearLayers();
      if (map.hasLayer(cartolineLayer)) { map.removeLayer(cartolineLayer); }
    }
  }

  function fillSelect(selectEl, valuesObj) {
    // il primo <option> (placeholder "Tutte/i...") e' definito nel markup e va
    // sempre conservato; solo le opzioni dinamiche successive vengono ricreate
    while (selectEl.options.length > 1) { selectEl.remove(1); }
    Object.keys(valuesObj).sort().forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      selectEl.appendChild(opt);
    });
  }

  // faceted filtering "a scalare": per ogni select ricalcola i soli valori
  // ancora raggiungibili date le selezioni correnti sugli ALTRI select, cosi'
  // i filtri restano sempre coerenti tra loro (mai una combinazione senza
  // risultati selezionabile). Se una selezione non e' piu' valida dopo il
  // ricalcolo (era compatibile solo con un valore appena escluso altrove) la
  // si azzera e si ripete il giro, finche' tutto non e' stabile.
  function refreshFilterOptions() {
    for (var pass = 0; pass < FILTER_DEFS.length; pass++) {
      var changed = false;
      FILTER_DEFS.forEach(function (def) {
        var values = {};
        allFeatureProps.forEach(function (props) {
          var v = props[def.field];
          if (v && passesFilter(props, def.key)) { values[v] = true; }
        });
        var selectEl = document.getElementById(def.selectId);
        fillSelect(selectEl, values);
        if (currentFilters[def.key] && !values[currentFilters[def.key]]) {
          currentFilters[def.key] = '';
          changed = true;
        }
        selectEl.value = currentFilters[def.key];
      });
      if (!changed) { break; }
    }
  }

  function goToCard(id) {
    sidebarRight.open('cartoline');
    FILTER_DEFS.forEach(function (def) { currentFilters[def.key] = ''; });
    refreshFilterOptions();
    applyFilters();
    var el = cardById[id] && cardById[id].el;
    if (!el) { return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flipped');
  }

  function goToMarker(id) {
    var entry = markerById[id];
    if (!entry) { return; }
    // "Vedi sulla mappa" isola il marker della cartolina scelta: disattiva "Mostra
    // tutti i marker" se attivo, gli altri restano nascosti finche' non si clicca
    // un'altra scheda o si riattiva "Mostra tutti i marker"
    showAllOverride = false;
    var showAllToggle = document.getElementById('cartoline-showall-toggle');
    if (showAllToggle) { showAllToggle.checked = false; }
    renderCartolineLayer([id]);
    if (!map.hasLayer(cartolineLayer)) { map.addLayer(cartolineLayer); }
    map.setView(entry.marker.getLatLng(), 16, { animate: true });
    setTimeout(function () { entry.marker.openPopup(); }, 350);
  }

  fetch('atlante/dati/foto_biblioteca.geojson')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var gallery = document.getElementById('cartoline-gallery');

      // etichetta:campo dei metadati mostrati sul retro scheda, nell'ordine della
      // scheda di riferimento (#opendatasicilia) + dati territoriali richiesti in coda
      var BACK_FIELDS = [
        { label: 'Album', field: 'album_title' },
        { label: 'Link Album', field: 'album_link_album', isLink: true, linkText: "Apri l'album su Flickr" },
        { label: 'Link risorsa su Flickr', field: 'href', isLink: true, linkText: 'Apri la risorsa su Flickr' },
        { label: 'Luogo', field: 'geographic_place' },
        { label: 'Editore', field: 'editor' },
        { label: 'Autore', field: 'author' },
        { label: 'Collaboratore', field: 'contributor' },
        { label: 'Collocazione', field: 'shelfmark' },
        { label: 'Luogo di pubblicazione', field: 'place_of_publishing' },
        { label: 'Emissione', field: 'issuance' },
        { label: 'Identificatore', field: 'identifier' }
      ];

      function buildBackFields(p) {
        var html = '';
        BACK_FIELDS.forEach(function (f) {
          var val = p[f.field];
          if (!val && val !== 0) { return; }
          html += '<dt>' + escapeHtml(f.label) + '</dt><dd>';
          if (f.isLink) {
            html += '<a href="' + val + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(f.linkText) + '</a>';
          } else if (f.field === 'album_title') {
            html += '<span class="ct-tag">' + escapeHtml(val) + '</span>';
          } else {
            html += escapeHtml(val);
          }
          html += '</dd>';
        });
        return html;
      }

      data.features.forEach(function (f) {
        var p = f.properties;
        // il dataset completo contiene una feature vuota (nessun risorsa/url/coordinate): la si scarta
        if (!p || !p.url || !p.risorsa || !f.geometry || !f.geometry.coordinates) { return; }
        var id = cardId(f);
        allFeatureProps.push(p);

        var zonaLabel = p.Quartiere || 'Zona non nota';

        var card = document.createElement('div');
        card.className = 'cartoline-card';
        card.id = id;
        card.style.setProperty('--ct-zone-color', colorForZone(p.Circoscrizione));
        card.innerHTML =
          '<div class="cartoline-card-inner">' +
            '<div class="cartoline-card-face cartoline-card-front">' +
              '<div class="ct-photo">' +
                '<img src="' + cartolinaThumb(p.risorsa, 'n') + '" alt="' + escapeHtml(p.title || '') + '" loading="lazy">' +
                '<div class="ct-photo-overlay">' +
                  '<div class="ct-title">' + escapeHtml(p.title || 'Senza titolo') + '</div>' +
                  '<div class="ct-zone"><i class="fa fa-map-marker" aria-hidden="true"></i> ' + escapeHtml(zonaLabel) + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="ct-territorio">' +
                (p.Circoscrizione ? '<span class="ct-terr-item"><strong>Circoscrizione</strong> ' + escapeHtml(p.Circoscrizione) + '</span>' : '') +
                (p.UPL ? '<span class="ct-terr-item"><strong>UPL</strong> ' + escapeHtml(p.UPL) + '</span>' : '') +
              '</div>' +
              '<div class="ct-actions ct-actions-front">' +
                '<a href="#" class="ct-btn-map" data-goto-marker="' + id + '">Vedi sulla mappa</a>' +
                (p.href ? '<a href="' + p.href + '" class="ct-btn-flickr" target="_blank" rel="noopener noreferrer">Apri su Flickr</a>' : '') +
              '</div>' +
              '<div class="ct-flip-hint">Clicca per i dettagli</div>' +
            '</div>' +
            '<div class="cartoline-card-face cartoline-card-back">' +
              '<div class="ct-back-title">' + escapeHtml(p.title || 'Senza titolo') + '</div>' +
              '<dl>' + buildBackFields(p) + '</dl>' +
            '</div>' +
          '</div>';

        card.addEventListener('click', function (e) {
          if (e.target.closest('[data-goto-marker]') || e.target.closest('a')) { return; }
          card.classList.toggle('flipped');
        });
        card.querySelectorAll('[data-goto-marker]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            goToMarker(id);
          });
        });

        gallery.appendChild(card);
        cardById[id] = { el: card, props: p };

        var latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
        var popupHtml =
          '<div class="cartoline-marker-pop">' +
            (p.href ?
              '<a href="' + p.href + '" target="_blank" rel="noopener noreferrer"><img src="' + cartolinaThumb(p.risorsa, 'q') + '" alt="' + escapeHtml(p.title || '') + '" loading="lazy"></a><br>' :
              '<img src="' + cartolinaThumb(p.risorsa, 'q') + '" alt="' + escapeHtml(p.title || '') + '" loading="lazy"><br>') +
            '<strong>' + escapeHtml(p.title || 'Senza titolo') + '</strong><br>' +
            escapeHtml(zonaLabel) +
            '<br><a href="#" class="ct-go-card" data-goto-card="' + id + '">Vai alla scheda &rarr;</a>' +
          '</div>';
        var marker = createCartolineMarker(id, latlng, popupHtml);
        markerById[id] = { marker: marker, props: p, latlng: latlng, popupHtml: popupHtml };
      });

      refreshFilterOptions();

      FILTER_DEFS.forEach(function (def) {
        document.getElementById(def.selectId).addEventListener('change', function () {
          currentFilters[def.key] = this.value;
          refreshFilterOptions();
          applyFilters();
        });
      });
      document.getElementById('cartoline-reset-filters').addEventListener('click', function (e) {
        e.stopPropagation();
        FILTER_DEFS.forEach(function (def) { currentFilters[def.key] = ''; });
        refreshFilterOptions();
        applyFilters();
      });

      var isMobile = window.matchMedia('(max-width: 767px)').matches;
      [
        ['cartoline-info-card', 'cartoline-info-toggle'],
        ['cartoline-toggles-card', 'cartoline-toggles-toggle'],
        ['cartoline-filters-card', 'cartoline-filters-toggle']
      ].forEach(function (pair) {
        var card = document.getElementById(pair[0]);
        var head = document.getElementById(pair[1]);
        if (isMobile) { card.classList.add('collapsed'); }
        head.addEventListener('click', function (e) {
          if (e.target.closest('button')) { return; }
          card.classList.toggle('collapsed');
        });
      });
      document.getElementById('cartoline-showall-toggle').addEventListener('change', function (e) {
        e.target.closest('.ct-icon-toggle').classList.toggle('active', e.target.checked);
        showAllOverride = e.target.checked;
        applyFilters();
      });
      document.getElementById('cartoline-noeffects-toggle').addEventListener('change', function (e) {
        e.target.closest('.ct-icon-toggle').classList.toggle('active', e.target.checked);
        setMapEffectsDisabled(e.target.checked);
      });

      applyFilters();
    })
    .catch(function (err) {
      document.getElementById('cartoline-gallery').textContent = 'Errore nel caricamento dei dati: ' + err.message;
    });
})();
