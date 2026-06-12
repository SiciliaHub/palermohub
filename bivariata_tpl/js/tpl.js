const PAL = {
  '1-1':'#f0ece4','2-1':'#e8d0a4','3-1':'#c89050',
  '1-2':'#c8d8d4','2-2':'#a8b8b0','3-2':'#809098',
  '1-3':'#7ab8c8','2-3':'#5898a8','3-3':'#306878',
};
const col = lbl => PAL[lbl] || '#444';

const CIRC_LABELS = {
  'I':'I · Centro Storico','II':'II · Brancaccio','III':'III · Oreto',
  'IV':'IV · Mezzomonreale','V':'V · Noce','VI':'VI · Resuttana',
  'VII':'VII · Mondello','VIII':'VIII · Libertà',
};

const HIERARCHY = {
  'I': {
    'Palazzo Reale - Monte di Pietà': ['Monte di Pietà  o Seralcadi','Palazzo Reale o Albergaria'],
    'Tribunali-Castellammare': ['Castellammare o Loggia','Tribunali o Kalsa'],
  },
  'II': {
    'Brancaccio - Ciaculli': ['Brancaccio Conte Federico','Ciaculli Croce Verde'],
    'Oreto - Stazione': ['Corso dei Mille - S.Erasmo'],
    'Settecannoli': ['Roccella Acqua dei Corsari','Settecannoli'],
  },
  'III': {
    'Oreto - Stazione': ['Oreto Guadagna','Oreto Perez'],
    'Villagrazia - Falsomiele': ['Bonagia','Chiavelli - S.Maria di Gesù','Falsomiele Borgo Ulivia','Villagrazia'],
  },
  'IV': {
    'Altarello': ['Altarello - Tasca Lanza'],
    'Boccadifalco': ['Boccadifalco - Baida'],
    'Cuba - Calatafimi': ['Cuba - Calatafimi'],
    'Mezzomonreale - Villa Tasca': ['Mezzomonreale','Villa Tasca'],
    'Montegrappa - S. Rosalia': ['Montegrappa','S.Rosalia'],
  },
  'V': {
    'Borgo Nuovo': ['Borgo Nuovo'],
    'Noce': ['Noce','Parlatore - Serradifalco'],
    'Uditore - Passo di Rigano': ['Leonardo da Vinci - Di Blasi','Passo di Rigano','Uditore'],
    'Zisa': ['Olivuzza','Zisa - 4 Camere','Zisa - Ingastone'],
  },
  'VI': {
    'Cruillas - S.Giovanni Apostolo': ['Cruillas','San Giovanni Apostolo'],
    'Resuttana - San Lorenzo': ['Resuttana','San Lorenzo'],
  },
  'VII': {
    'Arenella - Vergine Maria': ['Arenella','Vergine Maria'],
    'Pallavicino': ['Pallavicino','Patti - Villaggio Ruffini','San Filippo Neri'],
    'Partanna Mondello': ['Partanna Mondello'],
    'Tommaso Natale - Sferracavallo': ['Sferracavallo','Tommaso Natale - Sant\'Ambrogio - Cardillo'],
  },
  'VIII': {
    'Libertà': ['Marchese di Villabianca - Sampolo','Notarbartolo - Giardino Inglese','Villa Sperlinga','Vittorio Veneto'],
    'Malaspina - Palagonia': ['Malaspina - Leonardo da Vinci','Principe di Palagonia'],
    'Montepellegrino': ['Acquasanta','Cantieri','Montepellegrino'],
    'Politeama': ['Borgo Vecchio - Principe Scordia','Croci - Ruggero Settimo','S.Francesco di Paola - Terrasanta'],
  },
};

// --- UI refs ---
const fCirc   = document.getElementById('f-circ');
const fQuart  = document.getElementById('f-quart');
const fUpl    = document.getElementById('f-upl');
const btnZoom = document.getElementById('btn-zoom');
const btnReset= document.getElementById('btn-reset');

Object.keys(HIERARCHY).sort().forEach(k => {
  const o = document.createElement('option');
  o.value = k; o.textContent = CIRC_LABELS[k] || k;
  fCirc.appendChild(o);
});

function populateQuartieri(circ) {
  fQuart.innerHTML = '<option value="">— Tutti —</option>';
  fUpl.innerHTML   = '<option value="">— Tutte —</option>';
  fQuart.disabled  = !circ; fUpl.disabled = true;
  if (!circ) return;
  Object.keys(HIERARCHY[circ]).sort().forEach(q => {
    const o = document.createElement('option'); o.value = q; o.textContent = q;
    fQuart.appendChild(o);
  });
}

function populateUPL(circ, quart) {
  fUpl.innerHTML = '<option value="">— Tutte —</option>';
  fUpl.disabled  = !quart;
  if (!circ || !quart) return;
  const upls = HIERARCHY[circ]?.[quart] || [];
  upls.forEach(u => {
    const o = document.createElement('option'); o.value = u; o.textContent = u;
    fUpl.appendChild(o);
  });
  if (upls.length === 1) fUpl.value = upls[0];
}

fCirc.addEventListener('change',  () => { populateQuartieri(fCirc.value); fQuart.value=''; fUpl.value=''; applyFilters(); updateChips(); });
fQuart.addEventListener('change', () => { populateUPL(fCirc.value, fQuart.value); fUpl.value=''; applyFilters(); updateChips(); });
fUpl.addEventListener('change',   () => { applyFilters(); updateChips(); });

// --- Bivariate grid ---
const CLS_SHORT  = ['B', 'M', 'A'];
const ROW_LABELS = ['Bassa', 'Media', 'Alta'];
let activeBivLbl = null;
const bivCells = {};
(function() {
  const grid = document.getElementById('biv-grid');
  for (let cp = 3; cp >= 1; cp--) {
    const rh = document.createElement('div');
    rh.className = 'biv-row-hdr';
    rh.textContent = ROW_LABELS[cp - 1];
    grid.appendChild(rh);

    for (let cc = 1; cc <= 3; cc++) {
      const lbl  = `${cc}-${cp}`;
      const cell = document.createElement('div');
      cell.className = 'biv-cell'; cell.style.background = PAL[lbl];
      cell.title = `Dens. pop. ${CLS_SHORT[cc-1]} · Offerta TPL ${CLS_SHORT[cp-1]}`;

      cell.addEventListener('click', () => {
        activeBivLbl = activeBivLbl === lbl ? null : lbl;
        Object.values(bivCells).forEach(c => c.classList.remove('active'));
        if (activeBivLbl) cell.classList.add('active');
        applyFilters(); updateChips();
      });
      bivCells[lbl] = cell; grid.appendChild(cell);
    }
  }
})();

// --- State ---
let PROPS  = [];
let BBOXES = {};
let activeLayer  = 'biv';
let activeDensLbl = null; // '1','2','3' (cls_pop)
let activeAnomLbl = null; // 'civ','pop'

// --- PMTiles protocol ---
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile.bind(protocol));

// --- Map ---
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
          'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
          'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
          'https://d.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        ],
        tileSize: 256,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
      },
    },
    layers: [{ id: 'carto-dark', type: 'raster', source: 'carto-dark' }],
  },
  center: [13.3265, 38.135],
  zoom: 11,
  minZoom: 11,
  maxZoom: 17,
  maxBounds: [[13.08, 38.00], [13.60, 38.30]],
  hash: true,
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
  attributionControl: false,
});
map.touchZoomRotate.disableRotation();

map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

// --- Layer groups config ---
const LAYER_GROUPS = {
  biv:   { ids: ['sezioni-biv', 'sezioni-biv-border'],              active: true,  title: 'Densità pop. (ab/km²) × Offerta TPL (corse/ab) · Palermo',       subtitle: 'Densità pop. (ab/km²) × Offerta TPL (corse/ab) · Sezioni Censuarie 2011' },
  dens:  { ids: ['sezioni-dens', 'sezioni-dens-border'],             active: false, title: 'Offerta TPL (corse/ab) · Palermo',         subtitle: 'Offerta TPL (corse/ab) per sezione censuaria · Palermo 2011' },
  anom:  { ids: ['sezioni-anom'],                                    active: false, title: 'Anomalia Bivariata · Palermo',      subtitle: 'Scostamento Densità pop. (ab/km²)/Offerta TPL (corse/ab) · Sezioni Censuarie 2011' },
  quart: { ids: ['quartieri-fill', 'quartieri-border'],              active: false, title: 'Quartieri · Palermo',               subtitle: 'Aggregati per quartiere · GTFS AMAT + ISTAT' },
  circ:  { ids: ['circoscrizioni-fill', 'circoscrizioni-border'],    active: false, title: 'Circoscrizioni · Palermo',          subtitle: 'Aggregati per circoscrizione · GTFS AMAT + ISTAT' },
  upl:   { ids: ['upl-fill', 'upl-border'],                         active: false, title: 'Unità di Paesaggio · Palermo',      subtitle: 'Aggregati per UPL · GTFS AMAT + ISTAT' },
};

map.on('load', () => {
  // --- Sources ---
  map.addSource('sezioni',   { type: 'vector', url: 'pmtiles://https://palermohub.github.io/pmtiles/tpl/sezioni_bivariate.pmtiles' });
  map.addSource('aggregati', { type: 'vector', url: 'pmtiles://https://palermohub.github.io/pmtiles/tpl/territorio.pmtiles' });

  // --- Sezioni bivariata ---
  map.addLayer({
    id: 'sezioni-biv', type: 'fill', source: 'sezioni', 'source-layer': 'sezioni',
    paint: {
      'fill-color': ['match', ['coalesce', ['get', 'bivar_lbl'], ''],
        '1-1','#f0ece4','2-1','#e8d0a4','3-1','#c89050',
        '1-2','#c8d8d4','2-2','#a8b8b0','3-2','#809098',
        '1-3','#7ab8c8','2-3','#5898a8','3-3','#306878','#444'],
      'fill-opacity': 0.82,
    },
  });
  map.addLayer({
    id: 'sezioni-biv-border', type: 'line', source: 'sezioni', 'source-layer': 'sezioni',
    paint: { 'line-color': 'rgba(0,0,0,0.22)', 'line-width': 0.6 },
  });

  // --- Sezioni densità popolazione (nascosta) ---
  map.addLayer({
    id: 'sezioni-dens', type: 'fill', source: 'sezioni', 'source-layer': 'sezioni',
    layout: { visibility: 'none' },
    paint: {
            'fill-color': ['step', ['get', 'val_y'],
        '#ffffcc',
        1.42,'#ffeda0',
        2.4,'#fed976',
        3.7,'#feb24c',
        5.65,'#fd8d3c',
        8.22,'#fc4e2a',
        12.31,'#e31a1c',
        20.91,'#bd0026',
        39.04,'#800026',
        87.68,'#4d0019'],
      'fill-opacity': 0.82,
    },
  });
  map.addLayer({
    id: 'sezioni-dens-border', type: 'line', source: 'sezioni', 'source-layer': 'sezioni',
    layout: { visibility: 'none' },
    paint: { 'line-color': 'rgba(0,0,0,0.22)', 'line-width': 0.5 },
  });

  // --- Anomalie bivariata (nascosta) ---
  map.addLayer({
    id: 'sezioni-anom', type: 'fill', source: 'sezioni', 'source-layer': 'sezioni',
    layout: { visibility: 'none' },
    filter: ['!=', ['get', 'cls_x'], ['get', 'cls_y']],
    paint: {
      'fill-color': ['case', ['>', ['get', 'cls_x'], ['get', 'cls_y']], '#c89050', '#4090a8'],
      'fill-opacity': 0.88,
    },
  });

  // --- Quartieri (nascosto) ---
  map.addLayer({
    id: 'quartieri-fill', type: 'fill', source: 'aggregati', 'source-layer': 'quartieri',
    layout: { visibility: 'none' },
    paint: { 'fill-color': ['match', ['coalesce', ['get', 'bivar_lbl_modale'], ''],
      '1-1','#f0ece4','2-1','#e8d0a4','3-1','#c89050',
      '1-2','#c8d8d4','2-2','#a8b8b0','3-2','#809098',
      '1-3','#7ab8c8','2-3','#5898a8','3-3','#306878','#444'], 'fill-opacity': 0.55 },
  });
  map.addLayer({
    id: 'quartieri-border', type: 'line', source: 'aggregati', 'source-layer': 'quartieri',
    layout: { visibility: 'none' },
    paint: { 'line-color': '#7ab8c8', 'line-width': 1.5 },
  });

  // --- Circoscrizioni (nascosta) ---
  map.addLayer({
    id: 'circoscrizioni-fill', type: 'fill', source: 'aggregati', 'source-layer': 'circoscrizioni',
    layout: { visibility: 'none' },
    paint: { 'fill-color': ['match', ['coalesce', ['get', 'bivar_lbl_modale'], ''],
      '1-1','#f0ece4','2-1','#e8d0a4','3-1','#c89050',
      '1-2','#c8d8d4','2-2','#a8b8b0','3-2','#809098',
      '1-3','#7ab8c8','2-3','#5898a8','3-3','#306878','#444'], 'fill-opacity': 0.45 },
  });
  map.addLayer({
    id: 'circoscrizioni-border', type: 'line', source: 'aggregati', 'source-layer': 'circoscrizioni',
    layout: { visibility: 'none' },
    paint: { 'line-color': '#c89050', 'line-width': 2 },
  });

  // --- UPL (nascosta) ---
  map.addLayer({
    id: 'upl-fill', type: 'fill', source: 'aggregati', 'source-layer': 'upl',
    layout: { visibility: 'none' },
    paint: { 'fill-color': ['match', ['coalesce', ['get', 'bivar_lbl_modale'], ''],
      '1-1','#f0ece4','2-1','#e8d0a4','3-1','#c89050',
      '1-2','#c8d8d4','2-2','#a8b8b0','3-2','#809098',
      '1-3','#7ab8c8','2-3','#5898a8','3-3','#306878','#444'], 'fill-opacity': 0.50 },
  });
  map.addLayer({
    id: 'upl-border', type: 'line', source: 'aggregati', 'source-layer': 'upl',
    layout: { visibility: 'none' },
    paint: { 'line-color': '#fdb434', 'line-width': 1.5 },
  });

  // --- Etichette CartoDB sopra tutto ---
  map.addSource('carto-labels', {
    type: 'raster',
    tiles: [
      'https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      'https://b.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    ],
    tileSize: 256,
  });
  map.addLayer({ id: 'carto-labels', type: 'raster', source: 'carto-labels' });

  // Source/layer CartoDB light — per theme switch
  map.addSource('carto-light', {
    type: 'raster',
    tiles: [
      'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    ],
    tileSize: 256,
  });
  map.addLayer(
    { id: 'carto-light', type: 'raster', source: 'carto-light', layout: { visibility: 'none' } },
    'sezioni-biv'
  );
  map.addSource('carto-labels-light', {
    type: 'raster',
    tiles: [
      'https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
      'https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
    ],
    tileSize: 256,
  });
  map.addLayer({ id: 'carto-labels-light', type: 'raster', source: 'carto-labels-light', layout: { visibility: 'none' } });

  // Applica tema salvato ai layer basemap
  const _t = localStorage.getItem('anncus-theme');
  if (_t === 'light') {
    map.setLayoutProperty('carto-dark',         'visibility', 'none');
    map.setLayoutProperty('carto-light',        'visibility', 'visible');
    map.setLayoutProperty('carto-labels',       'visibility', 'none');
    map.setLayoutProperty('carto-labels-light', 'visibility', 'visible');
  }

  setupHover();
  applyFilters();
  updateLegends('biv');
});

// --- Fetch props leggeri per statistiche e zoom ---
fetch('dati/offerta_tpl_stats.json')
  .then(r => r.json())
  .then(d => { PROPS = d.props; BBOXES = d.bboxes; updateStats(); });

// --- Filtri ---
function geoConditions() {
  const c = [];
  if (fCirc.value)  c.push(['==', ['get', 'circoscrizione'], fCirc.value]);
  if (fQuart.value) c.push(['==', ['get', 'Quartiere'],      fQuart.value]);
  if (fUpl.value)   c.push(['==', ['get', 'UPL_nome'],       fUpl.value]);
  if (activeBivLbl) c.push(['==', ['get', 'bivar_lbl'],      activeBivLbl]);
  return c;
}

function mkFilter(conds) {
  if (conds.length === 0) return null;
  if (conds.length === 1) return conds[0];
  return ['all', ...conds];
}

function applyFilters() {
  if (!map.getLayer('sezioni-biv')) return;
  const geo = geoConditions(); // include activeBivLbl se presente

  // biv layers
  map.setFilter('sezioni-biv',        mkFilter(geo));
  map.setFilter('sezioni-biv-border', mkFilter(geo));

  // dens layers: geo + filtro classe popolazione
  const densGeo = [...geo];
  if (activeDensLbl) densGeo.push(['==', ['get', 'cls_y'], +activeDensLbl]);
  map.setFilter('sezioni-dens',        mkFilter(densGeo));
  map.setFilter('sezioni-dens-border', mkFilter(densGeo));

  // anom layer: condizione anomalia + geo + direzione
  const anomBase = activeAnomLbl === 'civ' ? ['>', ['get', 'cls_x'], ['get', 'cls_y']]
                 : activeAnomLbl === 'pop' ? ['>', ['get', 'cls_y'],    ['get', 'cls_x']]
                 :                           ['!=', ['get', 'cls_x'], ['get', 'cls_y']];
  map.setFilter('sezioni-anom', mkFilter([anomBase, ...geo]));

  const hasGeo = !!(fCirc.value || fQuart.value || fUpl.value);
  btnZoom.disabled = !hasGeo;
  updateStats();
}

// --- Toggle layer (unico gruppo radio) ---
const ALL_RADIO = ['biv', 'dens', 'anom', 'quart', 'circ', 'upl'];

function updateLegends(activeId) {
  const legBiv = document.getElementById('leg-biv');
  if (legBiv) legBiv.style.display = activeId === 'biv' ? '' : 'none';
  const legDens = document.getElementById('legend-dens');
  if (legDens) legDens.classList.toggle('visible', activeId === 'dens');

  const g = activeId && LAYER_GROUPS[activeId];
  const h1 = document.querySelector('#panel-header h1');
  const sub = document.querySelector('#panel-header p');
  if (h1 && g) h1.textContent = g.title;
  if (sub && g) sub.textContent = g.subtitle;

  // Reset filtri di classe al cambio layer
  activeBivLbl  = null;
  activeDensLbl = null;
  activeAnomLbl = null;
  Object.values(bivCells).forEach(c => c.classList.remove('active'));

  activeLayer = activeId || 'biv';
  updatePanelSections(activeId);
  if (PROPS.length > 0) { applyFilters(); updateChips(); }
}

function updatePanelSections(layerId) {
  const bivGrid   = document.getElementById('fsec-biv-grid');
  const donutTitle = document.getElementById('donut-sec-title');

  const showBivGrid = !layerId || ['biv', 'quart', 'circ', 'upl'].includes(layerId);
  if (bivGrid)   bivGrid.style.display   = showBivGrid ? '' : 'none';

  const titles = { dens: 'Distribuzione densità', anom: 'Distribuzione anomalie' };
  if (donutTitle) donutTitle.textContent = titles[layerId] || 'Distribuzione classi';
}

function toggleLayer(id) {
  const g = LAYER_GROUPS[id];
  if (!g) return;
  const wasActive = g.active;
  ALL_RADIO.forEach(rid => {
    const rg = LAYER_GROUPS[rid];
    rg.active = (rid === id) ? !wasActive : false;
    const rv = rg.active ? 'visible' : 'none';
    rg.ids.forEach(lid => { if (map.getLayer(lid)) map.setLayoutProperty(lid, 'visibility', rv); });
    document.getElementById('lbtn-' + rid).classList.toggle('active', rg.active);
  });
  updateLegends(ALL_RADIO.find(rid => LAYER_GROUPS[rid].active) || null);
}

// --- Hover (eventi per-layer — MapLibre usa indice spaziale interno) ---
function setupHover() {
  const canvas = map.getCanvas();
  const infoEl = document.getElementById('info');

  // Sezioni: priorità bassa (aggregati la sovrascrivono se presenti nello stesso punto)
  ['sezioni-biv', 'sezioni-dens', 'sezioni-anom'].forEach(id => {
    map.on('mousemove', id, e => {
      canvas.style.cursor = 'pointer';
      if (e.features.length) showInfo(e.features[0].properties);
    });
    map.on('mouseleave', id, () => { canvas.style.cursor = ''; infoEl.style.display = 'none'; });
  });

  // Aggregati: priorità alta — registrati dopo sezioni, MapLibre li fa scattare per ultimi
  [['quartieri-fill','q'], ['circoscrizioni-fill','c'], ['upl-fill','u']].forEach(([id, tipo]) => {
    map.on('mousemove', id, e => {
      canvas.style.cursor = 'pointer';
      if (e.features.length) fmtAgg(e.features[0].properties, tipo);
    });
    map.on('mouseleave', id, () => { canvas.style.cursor = ''; infoEl.style.display = 'none'; });
  });
}

// --- Helpers output ---
const fmt     = (v, d = 0) => v == null ? '—' : Number(v).toLocaleString('it-IT', { maximumFractionDigits: d });
const esc     = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const safeHex = c => /^#[0-9a-fA-F]{3,6}$/.test(c) ? c : '#444';

function positionInfo() {
  const infoEl = document.getElementById('info');
  const legendDens = document.getElementById('legend-dens');
  const offset = legendDens && legendDens.classList.contains('visible')
    ? 18 + legendDens.offsetHeight + 8
    : 18;
  infoEl.style.bottom = offset + 'px';
}

function showInfo(p) {
  const lbl = p.bivar_lbl || 'ND';
  document.getElementById('i-title').textContent = `Sez. ${p.sez} · ${p.Quartiere || '—'}`;
  document.getElementById('i-table').innerHTML = [
    ['Circoscrizione', esc(p.circoscrizione || '—')],
    ['UPL',           esc(p.UPL_nome || '—')],
    ['Densità pop. (ab/km²)', fmt(p.val_x, 2)],
    ['Offerta TPL (corse/ab)',   fmt(p.val_y, 2)],
    ['Area',          fmt(p.area_km2, 4) + ' km²'],
  ].map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
  + `<tr><td colspan="2"><span class="cls-badge" style="background:${safeHex(col(lbl))}">${esc('Classe ' + lbl)}</span></td></tr>`;
  positionInfo();
  document.getElementById('info').style.display = 'block';
}

// --- Info aggregati ---
function fmtAgg(p, tipo) {
  const id = tipo === 'q' ? p.Quartiere : tipo === 'u' ? p.UPL : p.circoscrizione;
  document.getElementById('i-title').textContent = id || '';
  const modale = p.bivar_lbl_modale || '—';
  document.getElementById('i-table').innerHTML = [
    ['Sezioni',       fmt(p.n_sezioni)],
    ['Densità pop. (ab/km²)',   fmt(p.val_x, 2)],
    ['Offerta TPL (corse/ab)', fmt(p.val_y, 2)],
    ['Area',          fmt(p.area_km2, 2) + ' km²'],
    ['Classe modale', esc(modale)],
  ].map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
  + `<tr><td colspan="2"><span class="cls-badge" style="background:${safeHex(p.col_modale || '#444')}">${esc('Classe ' + (p.bivar_lbl_modale || 'ND'))}</span></td></tr>`;
  positionInfo();
  document.getElementById('info').style.display = 'block';
}

// --- Statistiche ---
function matchFilter(p) {
  if (fCirc.value  && p.circ  !== fCirc.value)  return false;
  if (fQuart.value && p.quart !== fQuart.value)  return false;
  if (fUpl.value   && p.upl   !== fUpl.value)    return false;
  if (activeBivLbl && p.biv   !== activeBivLbl)  return false;
  if (activeDensLbl) {
    const cp = p.biv ? p.biv.split('-')[1] : null;
    if (cp !== activeDensLbl) return false;
  }
  if (activeAnomLbl) {
    if (!p.biv || p.biv.length < 3) return false;
    const cc = +p.biv[0], cp = +p.biv[2];
    if (activeAnomLbl === 'civ' && !(cc > cp)) return false;
    if (activeAnomLbl === 'pop' && !(cp > cc)) return false;
  }
  return true;
}

function updateStats() {
  const sel = PROPS.filter(matchFilter);
  document.getElementById('st-sez').textContent = sel.length.toLocaleString('it-IT');
  document.getElementById('st-civ').textContent = sel.length ? (sel.reduce((s,p)=>s+(p.vx||0),0)/sel.length).toFixed(1) : '—';
  document.getElementById('st-pop').textContent = sel.length ? (sel.reduce((s,p)=>s+(p.vy||0),0)/sel.length).toFixed(1) : '—';

  if (activeLayer === 'dens') buildDensDonut(sel);
  else if (activeLayer === 'anom') buildAnomDonut(sel);
  else buildDonut(sel);

  buildRanking(sel);
}

// --- Zoom alla selezione (bbox precompute) ---
btnZoom.addEventListener('click', () => {
  const bb = fUpl.value   ? BBOXES.upl?.[fUpl.value]
           : fQuart.value ? BBOXES.quart?.[fQuart.value]
           :                BBOXES.circ?.[fCirc.value];
  if (bb) map.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { padding: 40 });
});

// --- Reset ---
if (btnReset) btnReset.addEventListener('click', () => {
  fCirc.value = ''; fQuart.value = ''; fUpl.value = '';
  populateQuartieri('');
  activeBivLbl = null;
  Object.values(bivCells).forEach(c => c.classList.remove('active'));
  applyFilters();
  map.flyTo({ center: [13.3265, 38.135], zoom: 11 });
});

// ── Panel toggle ──────────────────────────────────────────────────────
const panelEl     = document.getElementById('panel');
const panelToggle = document.getElementById('panel-toggle');

function setPanelOpen(open) {
  panelEl.classList.toggle('closed', !open);
  document.body.classList.toggle('panel-closed', !open);
  panelToggle.textContent = open ? '›' : '‹';
  panelToggle.title       = open ? 'Chiudi pannello' : 'Apri pannello';
}

panelToggle.addEventListener('click', () => setPanelOpen(panelEl.classList.contains('closed')));

// ── Toolbar ───────────────────────────────────────────────────────────
const zoomSlider = document.getElementById('zoom-slider');
const zoomBadge  = document.getElementById('zoom-badge');

document.getElementById('btn-home').addEventListener('click', () => {
  map.flyTo({ center: [13.3265, 38.135], zoom: 11 });
});

document.getElementById('btn-fs').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});

zoomSlider.addEventListener('input', () => {
  map.setZoom(+zoomSlider.value);
  zoomBadge.textContent = (+zoomSlider.value).toFixed(1);
});
map.on('zoom', () => {
  const z = map.getZoom();
  zoomSlider.value = z;
  zoomBadge.textContent = z.toFixed(1);
});

const btnTheme = document.getElementById('btn-theme');
function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  btnTheme.title = dark ? 'Tema chiaro' : 'Tema scuro';
  if (map.getLayer('carto-light')) {
    map.setLayoutProperty('carto-dark',         'visibility', dark ? 'visible' : 'none');
    map.setLayoutProperty('carto-light',        'visibility', dark ? 'none'    : 'visible');
    map.setLayoutProperty('carto-labels',       'visibility', dark ? 'visible' : 'none');
    map.setLayoutProperty('carto-labels-light', 'visibility', dark ? 'none'    : 'visible');
  }
  localStorage.setItem('anncus-theme', dark ? 'dark' : 'light');
}

btnTheme.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark'));
});

const savedTheme = localStorage.getItem('anncus-theme');
if (savedTheme) applyTheme(savedTheme === 'dark');

// ── Search area + filter modal ────────────────────────────────────────
const searchInput   = document.getElementById('anncus-search-input');
const searchClear   = document.getElementById('anncus-search-clear');
const searchDD      = document.getElementById('anncus-search-dd');
const chipsEl       = document.getElementById('anncus-chips');
const filterBtn     = document.getElementById('anncus-filter-btn');
const filterBadge   = document.getElementById('anncus-filter-badge');
const filterOverlay = document.getElementById('anncus-filter-overlay');
const filterModal   = document.getElementById('anncus-filter-modal');
const pfmClose      = document.getElementById('anncus-pfm-close');
const pfmReset      = document.getElementById('anncus-pfm-reset');
const pfmApply      = document.getElementById('anncus-pfm-apply');

function buildSuggestions() {
  const items = [];
  Object.entries(HIERARCHY).forEach(([circKey, quarts]) => {
    items.push({ type: 'circ', label: CIRC_LABELS[circKey] || circKey, value: circKey });
    Object.entries(quarts).forEach(([qName, upls]) => {
      items.push({ type: 'quart', label: qName, value: qName, circ: circKey });
      upls.forEach(u => {
        items.push({ type: 'upl', label: u, value: u, circ: circKey, quart: qName });
      });
    });
  });
  return items;
}
const SUGGESTIONS = buildSuggestions();

function highlight(text, query) {
  const safe = esc(text);
  if (!query) return safe;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return safe.replace(re, '<mark>$1</mark>');
}

const TYPE_LABELS = { circ: 'Circoscrizione', quart: 'Quartiere', upl: 'UPL' };

function renderDD(query) {
  const q = query.trim().toLowerCase();
  const matches = q.length === 0 ? [] : SUGGESTIONS.filter(s =>
    s.label.toLowerCase().includes(q)
  ).slice(0, 12);

  if (matches.length === 0) {
    searchDD.innerHTML = q.length > 0
      ? `<div class="anncus-dd-empty">Nessun risultato per &ldquo;${esc(q)}&rdquo;</div>`
      : '';
    searchDD.classList.toggle('open', q.length > 0);
    return;
  }

  let html = '';
  let lastType = null;
  matches.forEach(m => {
    if (m.type !== lastType) {
      html += `<div class="anncus-dd-cat">${TYPE_LABELS[m.type]}</div>`;
      lastType = m.type;
    }
    html += `<div class="anncus-dd-item" data-type="${esc(m.type)}" data-value="${esc(m.value)}"
                  data-circ="${esc(m.circ || '')}" data-quart="${esc(m.quart || '')}">
               <span>${highlight(m.label, query.trim())}</span>
               <span class="anncus-dd-badge">${esc(TYPE_LABELS[m.type])}</span>
             </div>`;
  });
  searchDD.innerHTML = html;
  searchDD.classList.add('open');

  searchDD.querySelectorAll('.anncus-dd-item').forEach(el => {
    el.addEventListener('click', () => selectSuggestion(el));
  });
}

function selectSuggestion(el) {
  const type  = el.dataset.type;
  const value = el.dataset.value;
  const circ  = el.dataset.circ;
  const quart = el.dataset.quart;

  if (type === 'circ') {
    fCirc.value = value;
    populateQuartieri(value);
  } else if (type === 'quart') {
    fCirc.value = circ; populateQuartieri(circ);
    fQuart.value = value; populateUPL(circ, value);
  } else if (type === 'upl') {
    fCirc.value = circ; populateQuartieri(circ);
    fQuart.value = quart; populateUPL(circ, quart);
    fUpl.value = value;
  }
  applyFilters();
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchDD.classList.remove('open');
  updateChips();
}

const DENS_CHIP_LABELS = { '1': 'Dens. Bassa', '2': 'Dens. Media', '3': 'Dens. Alta' };
const ANOM_CHIP_LABELS = { 'civ': 'Sottoservita', 'pop': 'Sovraservita' };

function updateChips() {
  const activeFilters = [];
  if (fCirc.value)   activeFilters.push({ type: 'geo',  label: CIRC_LABELS[fCirc.value] || fCirc.value, clear: 'circ' });
  if (fQuart.value)  activeFilters.push({ type: 'geo',  label: fQuart.value, clear: 'quart' });
  if (fUpl.value)    activeFilters.push({ type: 'geo',  label: fUpl.value,   clear: 'upl'   });
  if (activeBivLbl)  activeFilters.push({ type: 'biv',  label: 'Classe ' + activeBivLbl, clear: 'biv' });
  if (activeDensLbl) activeFilters.push({ type: 'dens', label: DENS_CHIP_LABELS[activeDensLbl] || activeDensLbl, clear: 'dens' });
  if (activeAnomLbl) activeFilters.push({ type: 'anom', label: ANOM_CHIP_LABELS[activeAnomLbl], clear: 'anom' });

  chipsEl.style.display = activeFilters.length ? 'flex' : 'none';
  filterBadge.style.display = activeFilters.length ? 'flex' : 'none';
  filterBadge.textContent = activeFilters.length;
  filterBtn.classList.toggle('active', activeFilters.length > 0);

  let html = activeFilters.map(f =>
    `<span class="anncus-chip anncus-chip-${esc(f.type)}">
       ${esc(f.label)}
       <button class="anncus-chip-close" data-clear="${esc(f.clear)}">✕</button>
     </span>`
  ).join('');
  if (activeFilters.length > 1) {
    html += `<button class="anncus-chip anncus-chip-resetall" id="chips-resetall">✕ tutti</button>`;
  }
  chipsEl.innerHTML = html;

  chipsEl.querySelectorAll('.anncus-chip-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = btn.dataset.clear;
      if (c === 'circ')  { fCirc.value = ''; populateQuartieri(''); }
      if (c === 'quart') { fQuart.value = ''; populateUPL(fCirc.value, ''); }
      if (c === 'upl')   { fUpl.value = ''; }
      if (c === 'biv')   { activeBivLbl = null; Object.values(bivCells).forEach(c => c.classList.remove('active')); }
      if (c === 'dens')  { activeDensLbl = null; }
      if (c === 'anom')  { activeAnomLbl = null; }
      applyFilters(); updateChips();
    });
  });
  const ra = document.getElementById('chips-resetall');
  if (ra) ra.addEventListener('click', resetAll);
}

function resetAll() {
  fCirc.value = ''; populateQuartieri('');
  activeBivLbl  = null;
  activeDensLbl = null;
  activeAnomLbl = null;
  Object.values(bivCells).forEach(c => c.classList.remove('active'));
  applyFilters(); updateChips();
  map.flyTo({ center: [13.3265, 38.135], zoom: 11 });
}

// Search input listeners
searchInput.addEventListener('input', () => {
  searchClear.style.display = searchInput.value ? '' : 'none';
  renderDD(searchInput.value);
});
searchClear.addEventListener('click', () => {
  searchInput.value = ''; searchClear.style.display = 'none';
  searchDD.classList.remove('open');
});
document.addEventListener('click', e => {
  if (!e.target.closest('#anncus-searchbar')) searchDD.classList.remove('open');
});

// Filter modal open/close
filterBtn.addEventListener('click', () => {
  filterModal.classList.add('open');
  filterOverlay.classList.add('open');
});
pfmClose.addEventListener('click',     closeFilterModal);
filterOverlay.addEventListener('click', closeFilterModal);
pfmReset.addEventListener('click', () => { resetAll(); closeFilterModal(); });
pfmApply.addEventListener('click', () => { applyFilters(); updateChips(); closeFilterModal(); });

function closeFilterModal() {
  filterModal.classList.remove('open');
  filterOverlay.classList.remove('open');
}

// ── Ranking cascading ─────────────────────────────────────────────────
function buildRanking(sel) {
  const wrap = document.getElementById('ranking-wrap');
  if (sel.length === 0) { wrap.innerHTML = ''; return; }

  // Drill level: circ → quart → upl
  let groupKey, labelFn, drillLabel, onRowClick, isRowActive;

  if (!fCirc.value) {
    groupKey   = 'circ';
    labelFn    = k => CIRC_LABELS[k] || k;
    drillLabel = 'Per circoscrizione';
    isRowActive = k => fCirc.value === k;
    onRowClick  = k => {
      const toggle = fCirc.value === k;
      fCirc.value = toggle ? '' : k;
      populateQuartieri(toggle ? '' : k);
      if (toggle) { fQuart.value = ''; fUpl.value = ''; }
      applyFilters(); updateChips();
    };
  } else if (!fQuart.value) {
    groupKey   = 'quart';
    labelFn    = k => k;
    drillLabel = (CIRC_LABELS[fCirc.value] || fCirc.value) + ' › Quartieri';
    isRowActive = k => fQuart.value === k;
    onRowClick  = k => {
      const toggle = fQuart.value === k;
      fQuart.value = toggle ? '' : k;
      populateUPL(fCirc.value, toggle ? '' : k);
      if (toggle) fUpl.value = '';
      applyFilters(); updateChips();
    };
  } else {
    groupKey   = 'upl';
    labelFn    = k => k;
    drillLabel = fQuart.value + ' › UPL';
    isRowActive = k => fUpl.value === k;
    onRowClick  = k => {
      fUpl.value = fUpl.value === k ? '' : k;
      applyFilters(); updateChips();
    };
  }

  // Aggregate stats by group key
  const gMap = {};
  if (activeLayer === 'anom') {
    // conta sezioni anomale per direzione
    sel.forEach(p => {
      if (!p.biv || p.biv.length < 3) return;
      const cc = +p.biv[0], cp = +p.biv[2];
      if (cc === cp) return; // sezione normale, esclusa dalla mappa anom
      const k = p[groupKey] || '—';
      if (!gMap[k]) gMap[k] = { civ: 0, pop: 0 };
      if (cc > cp) gMap[k].civ++; else gMap[k].pop++;
    });
  } else {
    sel.forEach(p => {
      const k = p[groupKey] || '—';
      if (!gMap[k]) gMap[k] = { pop: 0, corse: 0 };
      gMap[k].pop   += p.pop   || 0;
      gMap[k].corse += p.corse || 0;
    });
  }

  function rankSection(title, unit, getValue, color) {
    const rows = Object.entries(gMap)
      .map(([name, d]) => ({ name, val: getValue(d) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);
    if (rows.length === 0) return '';
    const max = rows[0].val;
    if (max === 0) return '';
    const rowsHtml = rows.map((row, i) => {
      const barW = max > 0 ? Math.round((row.val / max) * 50) : 0;
      const active = isRowActive(row.name);
      return `<div class="rank-row rank-clickable${active ? ' rank-active' : ''}" data-val="${esc(row.name)}">
        <div class="rank-num">${i + 1}</div>
        <div class="rank-name" title="${esc(labelFn(row.name))}">${esc(labelFn(row.name))}</div>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:${barW}px;background:${color}"></div></div>
        <div class="rank-val">${Math.round(row.val).toLocaleString('it-IT')}</div>
      </div>`;
    }).join('');
    return `<div class="rank-section">
      <div class="rank-hdr">${title}<span class="rank-hdr-unit">${unit}</span></div>
      ${rowsHtml}
    </div>`;
  }

  let ranksHtml;
  if (activeLayer === 'anom') {
    ranksHtml = rankSection('Sottoservita', 'sez.', d => d.civ || 0, '#c89050')
              + rankSection('Sovraservita',  'sez.', d => d.pop || 0, '#4090a8');
  } else if (activeLayer === 'dens') {
    ranksHtml = rankSection('Popolazione',  'ab.',    d => d.pop,   '#bd0026')
              + rankSection('Offerta TPL',  'corse',  d => d.corse, '#fd8d3c');
  } else {
    ranksHtml = rankSection('Popolazione',  'ab.',    d => d.pop,   '#7ab8c8')
              + rankSection('Offerta TPL',  'corse',  d => d.corse, '#c89050');
  }

  wrap.innerHTML = `<div class="rank-drill-hdr">${esc(drillLabel)}</div>` + ranksHtml;

  wrap.querySelectorAll('.rank-clickable').forEach(row => {
    row.addEventListener('click', () => onRowClick(row.dataset.val));
  });
}

// ── Tab bar ───────────────────────────────────────────────────────────
document.querySelectorAll('.tab-hdr').forEach(hdr => {
  hdr.addEventListener('click', () => {
    document.querySelectorAll('.tab-hdr').forEach(h => h.classList.remove('active'));
    document.querySelectorAll('.tab-group').forEach(g => g.classList.remove('open'));
    hdr.classList.add('active');
    document.getElementById('group-' + hdr.dataset.group).classList.add('open');
  });
});

// ── Donut densità (interattivo) ───────────────────────────────────────
const DENS_CLASSES = [
  { key: '3', label: 'Alta densità pop.',  color: '#bd0026' },
  { key: '2', label: 'Media densità pop.', color: '#fd8d3c' },
  { key: '1', label: 'Bassa densità pop.', color: '#ffeda0' },
];

function buildDensDonut(sel) {
  const wrap = document.getElementById('donut-wrap');
  if (sel.length === 0) { wrap.innerHTML = ''; return; }

  const cnt = { '1': 0, '2': 0, '3': 0 };
  sel.forEach(p => { if (p.biv) { const k = p.biv.split('-')[1]; if (cnt[k] !== undefined) cnt[k]++; } });

  const total = sel.length;
  const R = 45, r = 28, cx = 65, cy = 65;
  let startAngle = -Math.PI / 2;
  const paths = [];

  DENS_CLASSES.forEach(({ key, color }) => {
    const n = cnt[key]; if (n === 0) return;
    const angle = (n / total) * 2 * Math.PI, end = startAngle + angle;
    const x1 = cx+R*Math.cos(startAngle), y1 = cy+R*Math.sin(startAngle);
    const x2 = cx+R*Math.cos(end),        y2 = cy+R*Math.sin(end);
    const x3 = cx+r*Math.cos(end),        y3 = cy+r*Math.sin(end);
    const x4 = cx+r*Math.cos(startAngle), y4 = cy+r*Math.sin(startAngle);
    const lg = angle > Math.PI ? 1 : 0;
    const sc = activeDensLbl === null ? 'donut-seg' : activeDensLbl === key ? 'donut-seg active' : 'donut-seg dimmed';
    paths.push(`<path d="M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${lg},0 ${x4},${y4} Z" fill="${color}" data-dens="${key}" class="${sc}" opacity="0.9"/>`);
    startAngle = end;
  });

  const legRows = DENS_CLASSES.filter(({ key }) => cnt[key] > 0).map(({ key, label, color }) => {
    const pct = ((cnt[key] / total) * 100).toFixed(0);
    const barW = Math.round((cnt[key] / total) * 40);
    return `<div class="donut-leg-row${activeDensLbl === key ? ' active' : ''}" data-dens="${key}">
      <div class="donut-dot" style="background:${color}"></div>
      <span class="donut-leg-label">${label}</span>
      <div class="donut-leg-bar-wrap"><div class="donut-leg-bar" style="width:${barW}px;background:${color}"></div></div>
      <span class="donut-leg-count">${cnt[key]}</span>
      <span class="donut-leg-pct">${pct}%</span>
    </div>`;
  }).join('');

  wrap.innerHTML = `<div class="donut-card"><div class="donut-svg-wrap"><svg class="donut-svg" viewBox="0 0 130 130">${paths.join('')}<text x="${cx}" y="${cy-5}" text-anchor="middle" class="donut-total">${total}</text><text x="${cx}" y="${cy+11}" text-anchor="middle" class="donut-label">sezioni</text></svg></div><div class="donut-legend">${legRows}</div></div>`;

  function onDensClick(dens) { activeDensLbl = activeDensLbl === dens ? null : dens; applyFilters(); updateChips(); }
  wrap.querySelectorAll('.donut-leg-row[data-dens]').forEach(row => row.addEventListener('click', () => onDensClick(row.dataset.dens)));
  wrap.querySelectorAll('.donut-seg[data-dens]').forEach(seg => seg.addEventListener('click', () => onDensClick(seg.dataset.dens)));
}

// ── Donut anomalie (interattivo) ──────────────────────────────────────
const ANOM_CLASSES = [
  { key: 'civ', label: 'Sottoservita (Dens. > TPL)', color: '#c89050' },
  { key: 'pop', label: 'Sovraservita (TPL > Dens.)',  color: '#4090a8' },
];

function buildAnomDonut(sel) {
  const wrap = document.getElementById('donut-wrap');
  if (sel.length === 0) { wrap.innerHTML = ''; return; }

  const cnt = { civ: 0, pop: 0 };
  sel.forEach(p => {
    if (!p.biv || p.biv.length < 3) return;
    const cc = +p.biv[0], cp = +p.biv[2];
    if (cc > cp) cnt.civ++; else if (cp > cc) cnt.pop++;
  });

  const total = cnt.civ + cnt.pop;
  if (total === 0) { wrap.innerHTML = ''; return; }

  const R = 45, r = 28, cx = 65, cy = 65;
  let startAngle = -Math.PI / 2;
  const paths = [];

  ANOM_CLASSES.forEach(({ key, color }) => {
    const n = cnt[key]; if (n === 0) return;
    const angle = (n / total) * 2 * Math.PI, end = startAngle + angle;
    const x1 = cx+R*Math.cos(startAngle), y1 = cy+R*Math.sin(startAngle);
    const x2 = cx+R*Math.cos(end),        y2 = cy+R*Math.sin(end);
    const x3 = cx+r*Math.cos(end),        y3 = cy+r*Math.sin(end);
    const x4 = cx+r*Math.cos(startAngle), y4 = cy+r*Math.sin(startAngle);
    const lg = angle > Math.PI ? 1 : 0;
    const sc = activeAnomLbl === null ? 'donut-seg' : activeAnomLbl === key ? 'donut-seg active' : 'donut-seg dimmed';
    paths.push(`<path d="M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${lg},0 ${x4},${y4} Z" fill="${color}" data-anom="${key}" class="${sc}" opacity="0.9"/>`);
    startAngle = end;
  });

  const legRows = ANOM_CLASSES.filter(({ key }) => cnt[key] > 0).map(({ key, label, color }) => {
    const pct = ((cnt[key] / total) * 100).toFixed(0);
    const barW = Math.round((cnt[key] / total) * 40);
    return `<div class="donut-leg-row${activeAnomLbl === key ? ' active' : ''}" data-anom="${key}">
      <div class="donut-dot" style="background:${color}"></div>
      <span class="donut-leg-label">${label}</span>
      <div class="donut-leg-bar-wrap"><div class="donut-leg-bar" style="width:${barW}px;background:${color}"></div></div>
      <span class="donut-leg-count">${cnt[key]}</span>
      <span class="donut-leg-pct">${pct}%</span>
    </div>`;
  }).join('');

  wrap.innerHTML = `<div class="donut-card"><div class="donut-svg-wrap"><svg class="donut-svg" viewBox="0 0 130 130">${paths.join('')}<text x="${cx}" y="${cy-5}" text-anchor="middle" class="donut-total">${total}</text><text x="${cx}" y="${cy+11}" text-anchor="middle" class="donut-label">anomalie</text></svg></div><div class="donut-legend">${legRows}</div></div>`;

  function onAnomClick(dir) { activeAnomLbl = activeAnomLbl === dir ? null : dir; applyFilters(); updateChips(); }
  wrap.querySelectorAll('.donut-leg-row[data-anom]').forEach(row => row.addEventListener('click', () => onAnomClick(row.dataset.anom)));
  wrap.querySelectorAll('.donut-seg[data-anom]').forEach(seg => seg.addEventListener('click', () => onAnomClick(seg.dataset.anom)));
}

// ── Donut chart ───────────────────────────────────────────────────────
const BIV_ORDER = ['3-3','2-3','1-3','3-2','2-2','1-2','3-1','2-1','1-1'];
const BIV_LABELS = {
  '1-1':'Bassa/Bassa','2-1':'Media/Bassa','3-1':'Alta/Bassa',
  '1-2':'Bassa/Media','2-2':'Media/Media','3-2':'Alta/Media',
  '1-3':'Bassa/Alta', '2-3':'Media/Alta', '3-3':'Alta/Alta',
};

function buildDonut(sel) {
  const wrap = document.getElementById('donut-wrap');
  if (sel.length === 0) { wrap.innerHTML = ''; return; }

  const counts = {};
  BIV_ORDER.forEach(k => counts[k] = 0);
  sel.forEach(p => { if (counts[p.biv] !== undefined) counts[p.biv]++; });

  const total = sel.length;
  const R = 45, r = 28, cx = 65, cy = 65;
  let startAngle = -Math.PI / 2;
  const paths = [];

  BIV_ORDER.forEach(k => {
    const n = counts[k];
    if (n === 0) return;
    const angle = (n / total) * 2 * Math.PI;
    const end = startAngle + angle;
    const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(end),        y2 = cy + R * Math.sin(end);
    const x3 = cx + r * Math.cos(end),        y3 = cy + r * Math.sin(end);
    const x4 = cx + r * Math.cos(startAngle), y4 = cy + r * Math.sin(startAngle);
    const lg = angle > Math.PI ? 1 : 0;
    const segClass = activeBivLbl === null ? 'donut-seg' : (activeBivLbl === k ? 'donut-seg active' : 'donut-seg dimmed');
    paths.push(`<path d="M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${lg},0 ${x4},${y4} Z" fill="${PAL[k]}" data-biv="${k}" class="${segClass}" opacity="0.9"/>`);
    startAngle = end;
  });

  const legRows = BIV_ORDER.filter(k => counts[k] > 0).map(k => {
    const pct  = ((counts[k] / total) * 100).toFixed(0);
    const barW = Math.round((counts[k] / total) * 40);
    const isActive = activeBivLbl === k;
    return `<div class="donut-leg-row${isActive ? ' active' : ''}" data-biv="${k}">
      <div class="donut-dot" style="background:${PAL[k]}"></div>
      <span class="donut-leg-label">${BIV_LABELS[k]}</span>
      <div class="donut-leg-bar-wrap"><div class="donut-leg-bar" style="width:${barW}px;background:${PAL[k]}"></div></div>
      <span class="donut-leg-count">${counts[k]}</span>
      <span class="donut-leg-pct">${pct}%</span>
    </div>`;
  }).join('');

  wrap.innerHTML = `<div class="donut-card">
    <div class="donut-svg-wrap">
      <svg class="donut-svg" viewBox="0 0 130 130">
        ${paths.join('')}
        <text x="${cx}" y="${cy - 5}" text-anchor="middle" class="donut-total">${total}</text>
        <text x="${cx}" y="${cy + 11}" text-anchor="middle" class="donut-label">sezioni</text>
      </svg>
    </div>
    <div class="donut-legend">${legRows}</div>
  </div>`;

  function onBivClick(biv) {
    activeBivLbl = activeBivLbl === biv ? null : biv;
    Object.entries(bivCells).forEach(([k, cell]) => cell.classList.toggle('active', k === activeBivLbl));
    applyFilters(); updateChips();
  }

  wrap.querySelectorAll('.donut-leg-row[data-biv]').forEach(row => {
    row.addEventListener('click', () => onBivClick(row.dataset.biv));
  });

  wrap.querySelectorAll('.donut-seg[data-biv]').forEach(seg => {
    seg.addEventListener('click', () => onBivClick(seg.dataset.biv));
  });
}

// ── Info modal (slide dal basso) ──────────────────────────────────────
(function initInfoModal() {
  const overlay = document.getElementById('info-overlay');
  const wrap    = document.getElementById('info-modal-wrap');
  const modal   = document.getElementById('info-modal');
  const tabBtn  = document.getElementById('info-modal-tab');

  function open()   { overlay.classList.add('open');    wrap.classList.add('open'); }
  function close()  { overlay.classList.remove('open'); wrap.classList.remove('open'); }
  function toggle() { wrap.classList.contains('open') ? close() : open(); }

  tabBtn.addEventListener('click', toggle);
  overlay.addEventListener('click', close);
  document.getElementById('info-close').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  const totop = document.getElementById('info-totop');

  function activePanel() { return modal.querySelector('.info-panel.active'); }

  function updateTotop() {
    const p = activePanel();
    totop.classList.toggle('visible', !!p && p.scrollTop > 120);
  }

  modal.querySelectorAll('.info-panel').forEach(p => {
    p.addEventListener('scroll', updateTotop, { passive: true });
  });

  totop.addEventListener('click', () => {
    const p = activePanel();
    if (p) p.scrollTo({ top: 0, behavior: 'smooth' });
  });

  modal.querySelectorAll('.info-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
      modal.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('itab-' + tab.dataset.itab).classList.add('active');
      updateTotop();
    });
  });
})();
