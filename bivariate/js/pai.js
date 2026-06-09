// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════
const PMTILES_URL  = 'https://palermohub.github.io/pmtiles/aggregati/Aggre_pop2022_PAI.pmtiles';
const PALERMO      = { center: [13.35189, 38.14484], zoom: 11 };
const PALERMO_BOUNDS = [[13.18, 37.90], [13.59, 38.30]];
const D_BREAKS     = [1.5, 5];               // carico insediativo thresholds ab/ha: 1.5, 5
let   LAYER        = 'Aggre_pop2022_PAI';    // updated from metadata

const STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const STYLE_DARK  = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const MOON_PATH = 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z';
const SUN_PATH  = 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z';

// ═══════════════════════════════════════════════════════
//  TAB CONFIGURATIONS
// ═══════════════════════════════════════════════════════
const TABS = [

  // ── 0: RISCHIO_Idraul × carico_insediativo────────────
  {
    title:    'Rischio Idraulico PAI × Carico Insediativo',
    // subtitle: 'RISCHIO_Idraul (R1–R4) × Carico Insediativo',
    yField:   'RISCHIO_Idraul',
    yLabel:   '← Rischio Idraulico PAI →',
    yClasses: [
      { label: 'R1-R2\nbasso', match: ['all', ['!=', ['get', 'RISCHIO_Idraul'], null], ['!=', ['get', 'RISCHIO_Idraul'], ''], ['!', ['in', ['get', 'RISCHIO_Idraul'], ['literal', ['R3','R4']]]]] },
      { label: 'R3\nmedio',    match: ['==', ['get', 'RISCHIO_Idraul'], 'R3'] },
      { label: 'R4\nalto',     match: ['==', ['get', 'RISCHIO_Idraul'], 'R4'] }
    ],
    xType:    'step',
    xField:   'carico_insediativo',
    xLabel:   '← Carico insediativo (ab/ha): < 1,5 · 1,5–5 · > 5 →',
    xBreaks:  D_BREAKS,
    xClasses: [
      { short: '< 1,5' }, { short: '1,5–5' }, { short: '> 5' }
    ],
    colors: [
      ['#d0d0d4', '#9cb8d8', '#4878c8'],
      ['#8ccc8c', '#98b850', '#7060b8'],
      ['#44aa44', '#b4a000', '#681888']
    ],
    critical: [2, 2],
    yFieldLabel: 'Rischio Idraulico'
  },

  // ── 1: RISCHIO_geomorf × carico_insediativo───────────
  {
    title:    'Rischio Geomorfologico PAI × Carico Insediativo',
  //  subtitle: 'RISCHIO_geomorf (1,3,4) × carico_insediativo',
    yField:   'RISCHIO_geomorf',
    yLabel:   '← Rischio Geomorfologico PAI →',
    yClasses: [
      { label: '1\nbasso', match: ['==', ['get', 'RISCHIO_geomorf'], 1] },
      { label: '3\nmedio', match: ['==', ['get', 'RISCHIO_geomorf'], 3] },
      { label: '4\nalto',  match: ['==', ['get', 'RISCHIO_geomorf'], 4] }
    ],
    xType:    'step',
    xField:   'carico_insediativo',
    xLabel:   '← Carico insediativo. (ab/ha): < 1,5 · 1,5–5 · > 5 →',
    xBreaks:  D_BREAKS,
    xClasses: [
      { short: '< 1,5' }, { short: '1,5–5' }, { short: '> 5' }
    ],
    colors: [
      ['#e8e0d0', '#c0c890', '#809048'],
      ['#e8c080', '#c89040', '#987020'],
      ['#e09080', '#c05038', '#881828']
    ],
    critical: [2, 2],
    yFieldLabel: 'Rischio Geomorfologico'
  },

  // ── 2: PERICOLO_Idraul × carico_insediativo(4 × 3) ──
  {
    title:    'Pericolosità Idraulica PAI × Carico Insediativo',
 //   subtitle: 'PERICOLO_Idraul (P1–P4) × Carico Insediativo',
    yField:   'PERICOLO_Idraul',
    yLabel:   '← Pericolosità Idraulica PAI →',
    yClasses: [
      { label: 'P1\nbassa',         match: ['==', ['get', 'PERICOLO_Idraul'], 'P1'] },
      { label: 'P2\nmoderata',      match: ['==', ['get', 'PERICOLO_Idraul'], 'P2'] },
      { label: 'P3\nelevata',       match: ['==', ['get', 'PERICOLO_Idraul'], 'P3'] },
      { label: 'P4\nmolto elevata', match: ['==', ['get', 'PERICOLO_Idraul'], 'P4'] }
    ],
    xType:    'step',
    xField:   'carico_insediativo',
    xLabel:   '← Carico insediativo (ab/ha): < 1,5 · 1,5–5 · > 5 →',
    xBreaks:  D_BREAKS,
    xClasses: [
      { short: '< 1,5' }, { short: '1,5–5' }, { short: '> 5' }
    ],
    colors: [
      ['#d4e8f4', '#88c0e8', '#2878c0'],
      ['#d4f0d8', '#80c890', '#208898'],
      ['#f0e898', '#d0c050', '#a09010'],
      ['#f0c0a0', '#e07848', '#c02818']
    ],
    critical: [3, 2],
    yFieldLabel: 'Pericolosità Idraulica'
  },

  // ── 3: PERICOLO_geomorf × carico_insediativo(4 × 3) ─
  {
    title:    'Pericolosità Geomorfologica PAI × Carico Insediativo',
   // subtitle: 'PERICOLO_geomorf (0,1,3,4) × Carico Insediativo',
    yField:   'PERICOLO_geomorf',
    yLabel:   '← Pericolosità Geomorfologica PAI →',
    yClasses: [
      { label: '0\nnessuna', match: ['==', ['get', 'PERICOLO_geomorf'], '0'] },
      { label: '1\nbassa',   match: ['==', ['get', 'PERICOLO_geomorf'], '1'] },
      { label: '3\nelevata', match: ['==', ['get', 'PERICOLO_geomorf'], '3'] },
      { label: '4\nmolto elevata', match: ['==', ['get', 'PERICOLO_geomorf'], '4'] }
    ],
    xType:    'step',
    xField:   'carico_insediativo',
    xLabel:   '← Carico insediativo (ab/ha): < 1,5 · 1,5–5 · > 5 →',
    xBreaks:  D_BREAKS,
    xClasses: [
      { short: '< 1,5' }, { short: '1,5–5' }, { short: '> 5' }
    ],
    colors: [
      ['#e0e4e8', '#a8c0d0', '#5888b8'],
      ['#c8e8c0', '#80c878', '#389880'],
      ['#e8d898', '#c0a840', '#887020'],
      ['#e8a898', '#c06040', '#882040']
    ],
    critical: [3, 2],
    yFieldLabel: 'Pericolosità Geomorfologica'
  },

  // ── 4: RISCHIO_Idraul × RISCHIO_geomorf (3 × 3) ──────
  {
    title:    'Rischio Idraulico × Rischio Geomorfologico PAI',
  //  subtitle: 'RISCHIO_Idraul (R1–R4) × RISCHIO_geomorf (1,3,4)',
    yField:   'RISCHIO_Idraul',
    yLabel:   '← Rischio Idraulico PAI →',
    yClasses: [
      { label: 'R1-R2\nbasso', match: ['all', ['!=', ['get', 'RISCHIO_Idraul'], null], ['!=', ['get', 'RISCHIO_Idraul'], ''], ['!', ['in', ['get', 'RISCHIO_Idraul'], ['literal', ['R3','R4']]]]] },
      { label: 'R3\nmedio',    match: ['==', ['get', 'RISCHIO_Idraul'], 'R3'] },
      { label: 'R4\nalto',     match: ['==', ['get', 'RISCHIO_Idraul'], 'R4'] }
    ],
    xType:    'categorical',
    xField:   'RISCHIO_geomorf',
    xLabel:   '← Rischio Geomorfologico PAI →',
    xClasses: [
      { short: '1\nbasso', match: ['==', ['get', 'RISCHIO_geomorf'], 1] },
      { short: '3\nmedio', match: ['==', ['get', 'RISCHIO_geomorf'], 3] },
      { short: '4\nalto',  match: ['==', ['get', 'RISCHIO_geomorf'], 4] }
    ],
    colors: [
      ['#d8e8f8', '#a0c8f0', '#5098d8'],
      ['#c8f8c8', '#78d888', '#3090a8'],
      ['#f8f090', '#e8b020', '#c02820']
    ],
    critical: [2, 2],
    yFieldLabel: 'Rischio Idraulico',
    xFieldLabel: 'Rischio Geomorfologico'
  },

  // ── 5: Carico insediativo (coropletica) ──────────────
  {
    title:    'Carico Insediativo 2022',
  // subtitle: 'Carico insediativo – abitanti per ha',
    type:     'choropleth',
    field:    'carico_insediativo',
    breaks:   [0.5, 1.5, 3.5, 7],
    colors:   ['#eef5fb', '#b0d0ec', '#5898c8', '#2060a0', '#082048'],
    labels:   ['< 0,5', '0,5–1,5', '1,5–3,5', '3,5–7', '> 7 ab/ha']
  },

  // ── 6: Rischio Idraulico PAI (colori ufficiali) ───────
  {
    title:      'Rischio Idraulico PAI',
  //  subtitle:   'RISCHIO_Idraul (R1–R4) — colori ufficiali PAI',
    type:       'pai-cat',
    field:      'RISCHIO_Idraul',
    fieldLabel: 'Rischio Idraulico',
    categories: [
      { value: 'R1', label: 'R1 — Moderato',      color: '#FFFF8C' },
      { value: 'R2', label: 'R2 — Medio',          color: '#FFB400' },
      { value: 'R3', label: 'R3 — Elevato',        color: '#FF5A00' },
      { value: 'R4', label: 'R4 — Molto elevato',  color: '#A80000' }
    ],
    noDataColor: '#444455'
  },

  // ── 7: Rischio Geomorfologico PAI (colori ufficiali) ──
  {
    title:      'Rischio Geomorfologico PAI',
  //  subtitle:   'RISCHIO_geomorf (1, 3, 4) — colori ufficiali PAI',
    type:       'pai-cat',
    field:      'RISCHIO_geomorf',
    fieldLabel: 'Rischio Geomorfologico',
    categories: [
      { value: '1', label: 'R1 — Moderato',      color: '#FFFF99' },
      { value: '3', label: 'R3 — Elevato',        color: '#FF8C00' },
      { value: '4', label: 'R4 — Molto elevato',  color: '#A80000' }
    ],
    noDataColor: '#444455'
  },

  // ── 8: Pericolosità Idraulica PAI (colori ufficiali) ──
  {
    title:      'Pericolosità Idraulica PAI',
   // subtitle:   'PERICOLO_Idraul (P1–P4) — colori ufficiali PAI',
    type:       'pai-cat',
    field:      'PERICOLO_Idraul',
    fieldLabel: 'Pericolosità Idraulica',
    categories: [
      { value: 'P1', label: 'P1 — Moderata',      color: '#B8DEFF' },
      { value: 'P2', label: 'P2 — Media',          color: '#64B4FF' },
      { value: 'P3', label: 'P3 — Elevata',        color: '#1E70D4' },
      { value: 'P4', label: 'P4 — Molto elevata',  color: '#00308A' }
    ],
    noDataColor: '#444455'
  },

  // ── 9: Pericolosità Geomorfologica PAI (colori ufficiali)
  {
    title:      'Pericolosità Geomorfologica PAI',
   // subtitle:   'PERICOLO_geomorf (0, 1, 3, 4) — colori ufficiali PAI',
    type:       'pai-cat',
    field:      'PERICOLO_geomorf',
    fieldLabel: 'Pericolosità Geomorfologica',
    categories: [
      { value: '0', label: '0 — Nessuna',          color: '#F5F0E0' },
      { value: '1', label: 'P1 — Moderata',        color: '#D4B896' },
      { value: '3', label: 'P3 — Elevata',         color: '#A07040' },
      { value: '4', label: 'P4 — Molto elevata',   color: '#6B3820' }
    ],
    noDataColor: '#444455'
  }
];

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
let currentTab = 0;
const activeCells = new Set(); // "y-x" strings

// ═══════════════════════════════════════════════════════
//  PMTiles protocol
// ═══════════════════════════════════════════════════════
const proto = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', proto.tile.bind(proto));

// ═══════════════════════════════════════════════════════
//  EXPRESSION BUILDERS
// ═══════════════════════════════════════════════════════
function buildExpr(tab) {
  if (tab.type === 'choropleth') return buildChoroplethExpr(tab);
  if (tab.type === 'pai-cat')    return buildPaiCatExpr(tab);
  return tab.xType === 'step'
    ? buildStepExpr(tab)
    : buildCategoricalExpr(tab);
}

function buildChoroplethExpr(tab) {
  const args = ['step', ['to-number', ['get', tab.field], 0], tab.colors[0]];
  tab.breaks.forEach((b, i) => { args.push(b); args.push(tab.colors[i + 1]); });
  return args;
}

function buildStepExpr(tab) {
  const noData = 'rgba(0,0,0,0)';
  const stepFor = (yi) => {
    const args = ['step', ['to-number', ['get', tab.xField], 0], tab.colors[yi][0]];
    tab.xBreaks.forEach((b, i) => { args.push(b); args.push(tab.colors[yi][i + 1]); });
    return args;
  };
  const cases = [];
  // campo PAI null/vuoto → nessun rischio, non colorare
  cases.push(['any', ['==', ['get', tab.yField], null], ['==', ['get', tab.yField], '']]);
  cases.push(noData);
  for (let y = tab.yClasses.length - 1; y >= 1; y--) {
    cases.push(tab.yClasses[y].match);
    cases.push(stepFor(y));
  }
  cases.push(stepFor(0));
  return ['case', ...cases];
}

function buildPaiCatExpr(tab) {
  const args = ['match', ['to-string', ['get', tab.field]]];
  tab.categories.forEach(cat => { args.push(String(cat.value), cat.color); });
  const noData = document.body.classList.contains('dark') ? (tab.noDataColor || '#444455') : 'rgba(0,0,0,0)';
  args.push(noData);
  return args;
}

function buildCategoricalExpr(tab) {
  const noData = 'rgba(0,0,0,0)';
  const xCaseFor = (yi) => {
    const cases = [];
    for (let x = tab.xClasses.length - 1; x >= 1; x--) {
      cases.push(tab.xClasses[x].match);
      cases.push(tab.colors[yi][x]);
    }
    cases.push(tab.colors[yi][0]);
    return ['case', ...cases];
  };
  const cases = [];
  // campo PAI null/vuoto su asse Y o X → nessun rischio, non colorare
  cases.push(['any',
    ['==', ['get', tab.yField], null], ['==', ['get', tab.yField], ''],
    ['==', ['get', tab.xField], null], ['==', ['get', tab.xField], '']
  ]);
  cases.push(noData);
  for (let y = tab.yClasses.length - 1; y >= 1; y--) {
    cases.push(tab.yClasses[y].match);
    cases.push(xCaseFor(y));
  }
  cases.push(xCaseFor(0));
  return ['case', ...cases];
}

// ═══════════════════════════════════════════════════════
//  FILTER BUILDER
// ═══════════════════════════════════════════════════════
function buildCellFilter(tab, y, x) {
  const yExpr = tab.yClasses[y].match;

  let xExpr;
  if (tab.xType === 'step') {
    const b = tab.xBreaks;
    xExpr = x === tab.xClasses.length - 1
      ? ['>=', ['to-number', ['get', tab.xField], 0], b[b.length - 1]]
      : x === 0
        ? ['<', ['to-number', ['get', tab.xField], 0], b[0]]
        : ['all',
            ['>=', ['to-number', ['get', tab.xField], 0], b[x - 1]],
            ['<',  ['to-number', ['get', tab.xField], 0], b[x]]];
  } else {
    xExpr = tab.xClasses[x].match;
  }
  return ['all', yExpr, xExpr];
}

function buildChoroClassFilter(tab, idx) {
  const b = tab.breaks;
  const field = ['to-number', ['get', tab.field], 0];
  if (idx === 0)        return ['<',  field, b[0]];
  if (idx >= b.length)  return ['>=', field, b[b.length - 1]];
  return ['all', ['>=', field, b[idx - 1]], ['<', field, b[idx]]];
}

function applyFilters() {
  updateFilterChips();
  if (!map.getLayer('biv-fill')) return;
  const tab = TABS[currentTab];

  // Build legend-cell filter
  let cellFilter = null;
  if (activeCells.size > 0) {
    if (tab.type === 'choropleth') {
      const parts = [];
      activeCells.forEach(k => parts.push(buildChoroClassFilter(tab, Number(k))));
      cellFilter = parts.length === 1 ? parts[0] : ['any', ...parts];
    } else if (tab.type === 'pai-cat') {
      const parts = [];
      activeCells.forEach(k => {
        const cat = tab.categories[Number(k)];
        if (cat) parts.push(['==', ['to-string', ['get', tab.field]], String(cat.value)]);
      });
      cellFilter = parts.length === 1 ? parts[0] : (parts.length > 1 ? ['any', ...parts] : null);
    } else {
      const parts = [];
      activeCells.forEach(k => {
        const [y, x] = k.split('-').map(Number);
        parts.push(buildCellFilter(tab, y, x));
      });
      cellFilter = parts.length === 1 ? parts[0] : ['any', ...parts];
    }
  }

  // Build modal filter
  const mf = window.paiMF || {};
  const mfParts = [];
  if (mf.ri)  mfParts.push(['==', ['get', 'RISCHIO_Idraul'],  mf.ri]);
  if (mf.rg)  mfParts.push(['==', ['get', 'RISCHIO_geomorf'], Number(mf.rg)]);
  if (mf.pi)  mfParts.push(['==', ['get', 'PERICOLO_Idraul'], mf.pi]);
  if (mf.pg)  mfParts.push(['==', ['get', 'PERICOLO_geomorf'], Number(mf.pg)]);
  if (mf.densMin > 0) mfParts.push(['>=', ['get', 'carico_insediativo'], mf.densMin]);
  if (mf.quartiere) mfParts.push(['==', ['get', 'Quartiere'], mf.quartiere]);
  if (mf.circ) mfParts.push(['==', ['to-string', ['get', 'circoscrizione']], mf.circ]);
  if (mf.upl)  mfParts.push(['==', ['to-string', ['get', 'UPL']], mf.upl]);
  const modalFilter = mfParts.length > 0 ? ['all', ...mfParts] : null;

  // Combine
  let f = null;
  if (cellFilter && modalFilter) f = ['all', cellFilter, modalFilter];
  else if (cellFilter)  f = cellFilter;
  else if (modalFilter) f = modalFilter;

  map.setFilter('biv-fill', f);
  map.setFilter('biv-line', f);
  fitFilteredFeatures(f);
  buildRanking();
  pushAppState();
}

let _fitCb = null;

function bboxFromFeats(feats) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  function walk(c) {
    if (typeof c[0] === 'number') {
      if (c[0] < w) w = c[0]; if (c[0] > e) e = c[0];
      if (c[1] < s) s = c[1]; if (c[1] > n) n = c[1];
    } else { c.forEach(walk); }
  }
  feats.forEach(ft => { if (ft.geometry) walk(ft.geometry.coordinates); });
  return w === Infinity ? null : [[w, s], [e, n]];
}

function fitFilteredFeatures(f) {
  if (_fitCb) { map.off('idle', _fitCb); _fitCb = null; }
  if (!f || _restoringState) return;
  _fitCb = () => {
    _fitCb = null;
    const feats = map.querySourceFeatures('pai', { sourceLayer: LAYER, filter: f });
    const bb = bboxFromFeats(feats);
    if (bb) map.fitBounds(bb, { padding: 70, maxZoom: 16, animate: true, duration: 700 });
  };
  map.once('idle', _fitCb);
}

// ═══════════════════════════════════════════════════════
//  TOOLTIP
// ═══════════════════════════════════════════════════════
const tt = document.getElementById('tt');

function showTT(e, html) {
  tt.innerHTML = html;
  tt.classList.add('on');
  moveTT(e);
}
function hideTT() { tt.classList.remove('on'); }
function moveTT(e) {
  const ttW = 250;
  const x = e.clientX > window.innerWidth / 2
    ? Math.max(e.clientX - ttW - 14, 8)
    : Math.min(e.clientX + 14, window.innerWidth - ttW);
  const y = Math.max(e.clientY - 50, 8);
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

// ═══════════════════════════════════════════════════════
//  EXPRESSION EVALUATOR (per conteggi donut)
// ═══════════════════════════════════════════════════════
function evalExpr(expr, props) {
  if (!Array.isArray(expr)) return expr;
  const [op, ...args] = expr;
  switch (op) {
    case 'get':       return props[args[0]];
    case 'literal':   return args[0];
    case 'to-number': {
      const v = evalExpr(args[0], props);
      if (v == null || v === '') return args.length > 1 ? args[1] : 0;
      const n = Number(v); return isNaN(n) ? (args.length > 1 ? args[1] : 0) : n;
    }
    case 'to-string': return String(evalExpr(args[0], props) ?? '');
    case '==':  return evalExpr(args[0], props) == evalExpr(args[1], props);
    case '!=':  return evalExpr(args[0], props) != evalExpr(args[1], props);
    case '>':   return evalExpr(args[0], props) >  evalExpr(args[1], props);
    case '>=':  return evalExpr(args[0], props) >= evalExpr(args[1], props);
    case '<':   return evalExpr(args[0], props) <  evalExpr(args[1], props);
    case '<=':  return evalExpr(args[0], props) <= evalExpr(args[1], props);
    case '!':   return !evalExpr(args[0], props);
    case 'all': return args.every(a => evalExpr(a, props));
    case 'any': return args.some(a => evalExpr(a, props));
    case 'in': {
      const val = evalExpr(args[0], props);
      const arr = evalExpr(args[1], props);
      return Array.isArray(arr) ? arr.includes(val) : false;
    }
    default: return null;
  }
}

// ═══════════════════════════════════════════════════════
//  DONUT CHART
// ═══════════════════════════════════════════════════════
let _donutFeats = [];

function _polarXY(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function _arcPath(cx, cy, ro, ri, a1, a2) {
  if (a2 - a1 >= 360) a2 = a1 + 359.99;
  const lg = (a2 - a1) > 180 ? 1 : 0;
  const f = v => v.toFixed(2);
  const [x1,y1] = _polarXY(cx,cy,ro,a1), [x2,y2] = _polarXY(cx,cy,ro,a2);
  const [x3,y3] = _polarXY(cx,cy,ri,a2), [x4,y4] = _polarXY(cx,cy,ri,a1);
  return `M${f(x1)},${f(y1)} A${ro},${ro},0,${lg},1,${f(x2)},${f(y2)} L${f(x3)},${f(y3)} A${ri},${ri},0,${lg},0,${f(x4)},${f(y4)} Z`;
}

function buildDonut() {
  const wrap = document.getElementById('donut-wrap');
  if (!wrap) return;
  const tab = TABS[currentTab];

  if (_donutFeats.length === 0) {
    wrap.innerHTML = '<div class="donut-placeholder">Caricamento…</div>';
    return;
  }

  const isChoro  = tab.type === 'choropleth';
  const isPaiCat = tab.type === 'pai-cat';
  let classes;

  if (isChoro) {
    const counts = new Array(tab.colors.length).fill(0);
    _donutFeats.forEach(f => {
      const v = Number(f.properties[tab.field] ?? 0);
      let idx = 0;
      for (let i = 0; i < tab.breaks.length; i++) { if (v >= tab.breaks[i]) idx = i + 1; }
      counts[idx]++;
    });
    classes = tab.colors.map((color, i) => ({
      label: tab.labels[i], color, count: counts[i], yIdx: i
    }));
  } else if (isPaiCat) {
    const counts = new Map(tab.categories.map(c => [String(c.value), 0]));
    _donutFeats.forEach(f => {
      const v = String(f.properties[tab.field] ?? '');
      if (counts.has(v)) counts.set(v, counts.get(v) + 1);
    });
    classes = tab.categories.map((cat, i) => ({
      label: cat.label, color: cat.color,
      count: counts.get(String(cat.value)) || 0, yIdx: i
    }));
  } else {
    const ny = tab.yClasses.length;
    const nx = tab.xClasses.length;
    classes = tab.yClasses.map((yc, y) => ({
      label: yc.label.replace('\n', ' '),
      color: tab.colors[y][nx - 1],
      match: yc.match,
      yIdx:  y,
      count: 0
    }));
    _donutFeats.forEach(f => {
      const p = f.properties;
      const yVal = p[tab.yField];
      if (yVal == null || yVal === '') return; // campo PAI null → non classificato
      if (tab.xType === 'categorical') {
        const xVal = p[tab.xField];
        if (xVal == null || xVal === '') return;
      }
      for (let y = ny - 1; y >= 0; y--) {
        if (evalExpr(tab.yClasses[y].match, p)) { classes[y].count++; break; }
      }
    });
  }

  const total      = _donutFeats.length;
  const classified = classes.reduce((s, c) => s + c.count, 0);
  const noData     = total - classified;
  const CX = 100, CY = 100, RO = 85, RI = 58, GAP = total > 1 ? 1.5 : 0;

  const titleText = (isChoro || isPaiCat)
    ? (tab.fieldLabel || tab.field || '').replace(/_/g, ' ').trim()
    : (tab.yLabel || tab.yField || '').replace(/[←→_]/g, ' ').replace(/\s+/g, ' ').trim();

  // ── SVG ──
  let svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="donut-svg">`;

  if (total === 0) {
    svg += `<circle cx="${CX}" cy="${CY}" r="${(RO+RI)/2}" fill="none" stroke="var(--border)" stroke-width="${RO-RI}"/>`;
  } else {
    let startDeg = 0;
    classes.forEach(cls => {
      if (cls.count === 0) return;
      const sweep  = (cls.count / total) * 360;
      const s = startDeg + GAP / 2, e = startDeg + sweep - GAP / 2;
      const isActive = cls.yIdx != null && (
        (isChoro || isPaiCat)
          ? activeCells.has(String(cls.yIdx))
          : [...activeCells].some(k => k.startsWith(`${cls.yIdx}-`))
      );
      const opacity = activeCells.size > 0 && !isActive ? '0.3' : '1';
      const pctSeg = ((cls.count / total) * 100).toFixed(1);
      const d = _arcPath(CX, CY, RO, RI, s, e);
      svg += `<path d="${d}" fill="${cls.color}" opacity="${opacity}" class="donut-seg donut-seg-click" data-y="${cls.yIdx ?? ''}" data-label="${escHtml(cls.label)}" data-count="${cls.count}" data-pct="${pctSeg}"/>`;
      startDeg += sweep;
    });
    if (noData > 0) {
      const sweep = (noData / total) * 360;
      svg += `<path d="${_arcPath(CX, CY, RO, RI, startDeg + GAP/2, startDeg + sweep - GAP/2)}" fill="var(--border)" opacity="0.6"/>`;
    }
  }

  // centro
  svg += `<text x="${CX}" y="${CY - 7}" text-anchor="middle" class="donut-total">${total.toLocaleString('it-IT')}</text>`;
  svg += `<text x="${CX}" y="${CY + 10}" text-anchor="middle" class="donut-label">AGGREGATI</text>`;
  svg += `</svg>`;

  // ── Legend rows ──
  let legendHtml = '<div class="donut-legend">';
  classes.forEach(cls => {
    if (cls.count === 0) return;
    const pct = ((cls.count / total) * 100).toFixed(1);
    const isActive = cls.yIdx != null && (
      isChoro
        ? activeCells.has(String(cls.yIdx))
        : [...activeCells].some(k => k.startsWith(`${cls.yIdx}-`))
    );
    const actCls = isActive ? ' donut-row-active' : '';
    const yAttr  = cls.yIdx != null ? ` data-y="${cls.yIdx}"` : '';
    const barW = ((cls.count / total) * 100).toFixed(1);
    legendHtml += `<div class="donut-leg-row${actCls}"${yAttr} data-label="${escHtml(cls.label)}" data-count="${cls.count}" data-pct="${pct}">
      <span class="donut-dot" style="background:${cls.color}"></span>
      <span class="donut-leg-label">${cls.label}</span>
      <div class="donut-leg-bar-wrap"><div class="donut-leg-bar" style="width:${barW}%;background:${cls.color}"></div></div>
      <span class="donut-leg-count">${cls.count.toLocaleString('it-IT')}</span>
      <span class="donut-leg-pct">${pct}%</span>
    </div>`;
  });
  if (noData > 0) {
    legendHtml += `<div class="donut-nodata">${noData.toLocaleString('it-IT')} senza dato</div>`;
  }
  legendHtml += '</div>';

  // ── Stat carico insediativo ──
  let carStatHtml = '';
  if (!(isChoro && tab.field === 'carico_insediativo')) {
    const carVals = _donutFeats
      .map(f => Number(f.properties['carico_insediativo'] ?? NaN))
      .filter(v => !isNaN(v) && v > 0);
    if (carVals.length > 0) {
      const avg = carVals.reduce((s, v) => s + v, 0) / carVals.length;
      carStatHtml = `<div class="donut-carico-stat">Carico ins. medio: <strong>${avg.toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})} ab/ha</strong></div>`;
    }
  }

  wrap.innerHTML = `<div class="donut-card">
    <div class="donut-title">${titleText}</div>
    <div class="donut-svg-wrap">${svg}</div>
    ${legendHtml}
    ${carStatHtml}
  </div>`;

  buildRanking();

  const _donutTip = el => {
    if (!el.dataset.label) return;
    el.addEventListener('mouseenter', e => showTT(e, `<strong>${el.dataset.label}</strong><br>${Number(el.dataset.count).toLocaleString('it-IT')} aggregati · ${el.dataset.pct}%`));
    el.addEventListener('mousemove',  moveTT);
    el.addEventListener('mouseleave', hideTT);
  };
  wrap.querySelectorAll('.donut-seg-click').forEach(el => {
    el.addEventListener('click', () => { if (el.dataset.y !== '') donutToggleRow(+el.dataset.y); });
    _donutTip(el);
  });
  wrap.querySelectorAll('.donut-leg-row[data-y]').forEach(el => {
    el.addEventListener('click', () => donutToggleRow(+el.dataset.y));
    _donutTip(el);
  });
}

function donutToggleRow(y) {
  const tab = TABS[currentTab];

  if (tab.type === 'choropleth' || tab.type === 'pai-cat') {
    const key = String(y);
    if (activeCells.has(key)) activeCells.delete(key);
    else activeCells.add(key);
    applyFilters();
    buildLegend();
    return;
  }

  if (!tab.xClasses) return;
  const nx = tab.xClasses.length;
  const allActive = Array.from({length: nx}, (_, x) => activeCells.has(`${y}-${x}`)).every(Boolean);
  for (let x = 0; x < nx; x++) {
    if (allActive) activeCells.delete(`${y}-${x}`);
    else           activeCells.add(`${y}-${x}`);
  }
  applyFilters();
  buildLegend();
}

// ═══════════════════════════════════════════════════════
//  LEGEND BUILDER
// ═══════════════════════════════════════════════════════
function buildLegend() {
  const wrap = document.getElementById('legend-wrap');
  wrap.innerHTML = '';
  const tab = TABS[currentTab];

  if (tab.type === 'choropleth') {
    buildChoroplethLegend(tab, wrap);
    document.getElementById('clear-btn').style.display = '';
    buildDonut();
    return;
  }

  if (tab.type === 'pai-cat') {
    buildPaiCatLegend(tab, wrap);
    document.getElementById('clear-btn').style.display = '';
    buildDonut();
    return;
  }

  document.getElementById('clear-btn').style.display = '';

  const ny = tab.yClasses.length;
  const nx = tab.xClasses.length;

  // Y-axis label
  const yl = document.createElement('div');
  yl.className = 'ylbl';
  yl.textContent = tab.yLabel;
  wrap.appendChild(yl);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'lgrid';
  grid.style.gridTemplateColumns = `46px repeat(${nx}, 1fr)`;
  wrap.appendChild(grid);

  // Header row: empty + x-class headers
  grid.appendChild(document.createElement('div'));
  tab.xClasses.forEach(cls => {
    const h = document.createElement('div');
    h.className = 'lhdr';
    h.innerHTML = (cls.short || '').replace('\n', '<br>');
    grid.appendChild(h);
  });

  // Data rows: y highest → lowest
  for (let y = ny - 1; y >= 0; y--) {
    const rh = document.createElement('div');
    rh.className = 'lrhdr';
    rh.innerHTML = tab.yClasses[y].label.replace('\n', '<br>');
    grid.appendChild(rh);

    for (let x = 0; x < nx; x++) {
      const cell = document.createElement('div');
      cell.className = 'lcell';
      cell.style.background = tab.colors[y][x];
      const key = `${y}-${x}`;
      if (activeCells.has(key)) cell.classList.add('on');

      const isCrit = tab.critical && tab.critical[0] === y && tab.critical[1] === x;

      // Inner label text
      const yShort = tab.yClasses[y].label.split('\n').slice(-1)[0]; // last part = "basso/medio/alto"
      const xShort = (tab.xClasses[x].short || '').split('\n')[0];

      if (isCrit) {
        const w = document.createElement('span');
        w.className = 'lcell-warn';
        w.textContent = '⚠';
        cell.appendChild(w);
        const l = document.createElement('span');
        l.className = 'lcell-lbl';
        l.textContent = 'critica';
        cell.appendChild(l);
      } else {
        const l1 = document.createElement('span');
        l1.className = 'lcell-lbl';
        l1.textContent = yShort;
        const l2 = document.createElement('span');
        l2.className = 'lcell-lbl';
        l2.style.opacity = '.8';
        l2.textContent = xShort;
        cell.appendChild(l1);
        cell.appendChild(l2);
      }

      // Tooltip
      const yFull = tab.yClasses[y].label.replace('\n', ' ');
      const xFull = (tab.xClasses[x].short || tab.xClasses[x].label || '').replace('\n', ' ');
      const yFieldLbl = tab.yFieldLabel || tab.yField;
      const xFieldLbl = tab.xFieldLabel || (tab.xType === 'step' ? 'Carico ins.' : tab.xField);
      const ttHtml = `<strong>${yFieldLbl}:</strong> ${yFull}<br>`
        + `<strong>${xFieldLbl}:</strong> ${xFull}`
        + (isCrit ? `<span class="tt-warn">⚠ Zona critica — massimo rischio e carico insediativo</span>` : '');

      cell.addEventListener('mouseenter', e => showTT(e, ttHtml));
      cell.addEventListener('mousemove',  moveTT);
      cell.addEventListener('mouseleave', hideTT);
      cell.addEventListener('click', () => toggleCell(y, x, cell));
      grid.appendChild(cell);
    }
  }

  // X-axis label
  const xl = document.createElement('div');
  xl.className = 'xlbl';
  xl.textContent = tab.xLabel;
  wrap.appendChild(xl);
  buildDonut();
}

function buildChoroplethLegend(tab, wrap) {
  const bar = document.createElement('div');
  bar.className = 'choro-bar';
  tab.colors.forEach((c, i) => {
    const s = document.createElement('div');
    s.className = 'choro-seg';
    if (activeCells.has(String(i))) s.classList.add('on');
    s.style.background = c;
    s.addEventListener('click', () => {
      const key = String(i);
      if (activeCells.has(key)) activeCells.delete(key);
      else activeCells.add(key);
      applyFilters();
      buildLegend();
    });
    s.addEventListener('mouseenter', e => showTT(e, `<strong>${tab.labels[i]}</strong>`));
    s.addEventListener('mousemove',  moveTT);
    s.addEventListener('mouseleave', hideTT);
    bar.appendChild(s);
  });
  wrap.appendChild(bar);

  const lbls = document.createElement('div');
  lbls.className = 'choro-lbls';
  tab.labels.forEach((l, i) => {
    const s = document.createElement('span');
    s.className = 'choro-lbl' + (activeCells.has(String(i)) ? ' on' : '');
    s.textContent = l;
    s.style.cursor = 'pointer';
    s.addEventListener('click', () => {
      const key = String(i);
      if (activeCells.has(key)) activeCells.delete(key);
      else activeCells.add(key);
      applyFilters();
      buildLegend();
    });
    lbls.appendChild(s);
  });
  wrap.appendChild(lbls);
}

function buildPaiCatLegend(tab, wrap) {
  const yl = document.createElement('div');
  yl.className = 'ylbl';
  yl.textContent = tab.fieldLabel;
  wrap.appendChild(yl);

  const ul = document.createElement('div');
  ul.className = 'pai-cat-legend';
  tab.categories.forEach((cat, i) => {
    const row = document.createElement('div');
    row.className = 'pai-cat-row';
    if (activeCells.has(String(i))) row.classList.add('on');
    row.innerHTML = `<span class="pai-cat-swatch" style="background:${cat.color}"></span>`
                  + `<span class="pai-cat-lbl">${cat.label}</span>`;
    row.addEventListener('click', () => togglePaiCat(i, row));
    row.addEventListener('mouseenter', e => showTT(e, `<strong>${tab.fieldLabel}:</strong> ${cat.label}`));
    row.addEventListener('mousemove', moveTT);
    row.addEventListener('mouseleave', hideTT);
    ul.appendChild(row);
  });
  wrap.appendChild(ul);
}

function togglePaiCat(idx, el) {
  const key = String(idx);
  if (activeCells.has(key)) { activeCells.delete(key); el.classList.remove('on'); }
  else                       { activeCells.add(key);    el.classList.add('on'); }
  applyFilters();
  buildDonut();
}

function toggleCell(y, x, el) {
  const key = `${y}-${x}`;
  if (activeCells.has(key)) {
    activeCells.delete(key);
    el.classList.remove('on');
  } else {
    activeCells.add(key);
    el.classList.add('on');
  }
  applyFilters();
  buildDonut();
}

// ═══════════════════════════════════════════════════════
//  RANKING
// ═══════════════════════════════════════════════════════
const RANK_CIRC_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`;
const RANK_UPL_ICON  = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
const RANK_QRTR_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M1 11l11-9 11 9v11h-7v-7H8v7H1z"/></svg>`;

function buildRanking() {
  const wrap = document.getElementById('ranking-wrap');
  if (!wrap) return;
  if (_donutFeats.length === 0) { wrap.innerHTML = ''; return; }

  const tab     = TABS[currentTab];
  const isChoro = tab.type === 'choropleth';

  // Per carico_insediativo (coropletica globale) usa tutte le sezioni;
  // altrimenti conta solo la popolazione soggetta a rischio/pericolo.
  let rankFeats;
  if (isChoro && tab.field === 'carico_insediativo') {
    rankFeats = _donutFeats;
  } else if (tab.type === 'pai-cat') {
    const valid = new Set(tab.categories.map(c => String(c.value)));
    rankFeats = _donutFeats.filter(f => valid.has(String(f.properties[tab.field] ?? '')));
  } else {
    rankFeats = _donutFeats.filter(f => {
      const v = f.properties[tab.yField];
      return v != null && v !== '';
    });
  }

  const mf = window.paiMF;
  const circPop = new Map(), uplPop = new Map(), qrtrPop = new Map();

  rankFeats.forEach(f => {
    const p   = f.properties;
    const pop = Number(p.pop_ripartita || 0);
    const c   = p.circoscrizione != null ? String(p.circoscrizione) : null;
    const u   = p.UPL            != null ? String(p.UPL)            : null;
    const q   = p.Quartiere      || null;

    if (c) circPop.set(c, (circPop.get(c) || 0) + pop);
    if (u && (!mf.circ || c === mf.circ))
      uplPop.set(u, (uplPop.get(u) || 0) + pop);
    if (q && (!mf.circ || c === mf.circ) && (!mf.upl || u === mf.upl))
      qrtrPop.set(q, (qrtrPop.get(q) || 0) + pop);
  });

  const SECTIONS = [
    { id: 'circ',      mfKey: 'circ',      label: 'Circoscrizioni', icon: RANK_CIRC_ICON, color: '#f5a623', data: circPop },
    { id: 'quartiere', mfKey: 'quartiere',  label: 'Quartieri',      icon: RANK_QRTR_ICON, color: '#44aa44', data: qrtrPop },
    { id: 'upl',       mfKey: 'upl',        label: 'UPL',            icon: RANK_UPL_ICON,  color: '#4878c8', data: uplPop  }
  ];

  let html = '';
  SECTIONS.forEach(sec => {
    if (sec.data.size === 0) return;
    const sorted = [...sec.data.entries()].sort((a, b) => b[1] - a[1]);
    const maxVal = sorted[0][1];
    const activeVal = mf[sec.mfKey] || '';

    html += `<div class="rank-section"><div class="rank-hdr">${sec.icon} ${sec.label}<span class="rank-hdr-unit">pop. ripartita</span></div>`;
    sorted.forEach(([name, val], i) => {
      const pct     = maxVal > 0 ? (val / maxVal * 100).toFixed(1) : 0;
      const isActive = activeVal === name;
      const display  = sec.id === 'circ' ? `Circ. ${name}` : name;
      html += `<div class="rank-row${isActive ? ' rank-active' : ''}" data-mfkey="${sec.mfKey}" data-val="${escHtml(name)}">
        <span class="rank-num">${i + 1}</span>
        <span class="rank-name" title="${escHtml(name)}">${escHtml(display)}</span>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%;background:${sec.color}"></div></div>
        <span class="rank-val">${Math.round(val).toLocaleString('it-IT')}</span>
      </div>`;
    });
    html += `</div>`;
  });

  wrap.innerHTML = html;

  wrap.querySelectorAll('.rank-row').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.mfkey;
      const val = el.dataset.val;
      if (window.paiMF[key] === val) {
        window.paiMF[key] = '';
      } else {
        window.paiMF[key] = val;
      }
      if (key === 'circ')  { window.paiMF.upl = ''; window.paiMF.quartiere = ''; }
      if (key === 'upl')   { window.paiMF.quartiere = ''; }
      updateFilterBadge();
      applyFilters(); // applyFilters chiama buildRanking alla fine
    });
  });
}

// ═══════════════════════════════════════════════════════
//  MAP INIT
// ═══════════════════════════════════════════════════════
function setupPaiLayers() {
  if (!map.getSource('pai')) {
    map.addSource('pai', { type: 'vector', url: `pmtiles://${PMTILES_URL}` });
  }
  if (!map.getLayer('biv-fill')) {
    map.addLayer({
      id: 'biv-fill', type: 'fill', source: 'pai', 'source-layer': LAYER,
      paint: { 'fill-color': buildExpr(TABS[currentTab]), 'fill-opacity': 0.82 }
    });
  }
  if (!map.getLayer('biv-line')) {
    map.addLayer({
      id: 'biv-line', type: 'line', source: 'pai', 'source-layer': LAYER,
      paint: {
        'line-color': document.body.classList.contains('dark') ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',
        'line-width': 0.6
      }
    });
  }
  applyFilters();
}

const map = new maplibregl.Map({
  container: 'map',
  style: STYLE_LIGHT,
  center: PALERMO.center,
  zoom: PALERMO.zoom,
  minZoom: 11,
  maxZoom: 17,
  maxBounds: PALERMO_BOUNDS,
  hash: false,
  dragRotate: false,
  attributionControl: { compact: true }
});

map.touchZoomRotate.disableRotation();
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

map.on('load', async () => {
  syncZoomUI(map.getZoom());

  // Inspect metadata
  try {
    const p = new pmtiles.PMTiles(PMTILES_URL);
    const meta = await p.getMetadata();
    if (meta?.vector_layers?.length) {
      LAYER = meta.vector_layers[0].id;
      toast(`Layer: ${LAYER}`);
    }
  } catch (e) {
    console.warn('[PMTiles meta]', e);
  }

  setupPaiLayers();

  document.getElementById('loading').classList.add('hidden');
  document.getElementById('panel-title').textContent = TABS[0].title;
  document.getElementById('panel-sub').textContent   = TABS[0].subtitle;
  buildLegend();

  restoreAppState();
  _mapReady = true;

  // Sample for field value verification
  map.once('idle', () => {
    const s = map.querySourceFeatures('pai', { sourceLayer: LAYER });
    if (s.length) {
      const p = s[0].properties;
      console.log('[Sample]', {
        RISCHIO_Idraul:  p.RISCHIO_Idraul,
        RISCHIO_geomorf: p.RISCHIO_geomorf,
        PERICOLO_Idraul: p.PERICOLO_Idraul,
        PERICOLO_geomorf:p.PERICOLO_geomorf,
        'carico_insediativo': p['carico_insediativo'],
        Quartiere:       p.Quartiere,
        UPL:             p.UPL,
        circoscrizione:  p.circoscrizione
      });
    }
  });
});

map.on('error', e => {
  toast('Errore: ' + (e.error?.message || 'caricamento fallito'), true);
  document.getElementById('loading').classList.add('hidden');
});

// ═══════════════════════════════════════════════════════
//  URL ROUTING
// ═══════════════════════════════════════════════════════
let _mapReady       = false;
let _restoringState = false;
let _pushStateTimer = null;

function encodeAppState() {
  const c = map.getCenter();
  const p = new URLSearchParams();
  p.set('tab', String(currentTab));
  p.set('z',   map.getZoom().toFixed(2));
  p.set('lat', c.lat.toFixed(5));
  p.set('lng', c.lng.toFixed(5));
  const mf = window.paiMF;
  if (mf.ri)          p.set('ri',   mf.ri);
  if (mf.rg)          p.set('rg',   String(mf.rg));
  if (mf.pi)          p.set('pi',   mf.pi);
  if (mf.pg)          p.set('pg',   String(mf.pg));
  if (mf.densMin > 0) p.set('dens', String(mf.densMin));
  if (mf.circ)        p.set('circ', mf.circ);
  if (mf.upl)         p.set('upl',  mf.upl);
  if (mf.quartiere)   p.set('q',    mf.quartiere);
  if (activeCells.size > 0) p.set('sel', [...activeCells].sort().join(','));
  return p.toString();
}

function pushAppState() {
  if (!_mapReady || _restoringState) return;
  if (_pushStateTimer) clearTimeout(_pushStateTimer);
  _pushStateTimer = setTimeout(() => {
    _pushStateTimer = null;
    history.replaceState(null, '', '#' + encodeAppState());
  }, 200);
}

function restoreAppState() {
  const raw = location.hash.slice(1);
  if (!raw || /^\d/.test(raw)) return; // empty or old MapLibre numeric format
  let s;
  try { s = Object.fromEntries(new URLSearchParams(raw)); } catch { return; }
  if (!Object.keys(s).length) return;

  _restoringState = true;

  if (s.z && s.lat && s.lng) {
    map.jumpTo({ center: [parseFloat(s.lng), parseFloat(s.lat)], zoom: parseFloat(s.z) });
    syncZoomUI(parseFloat(s.z));
  }

  const tabIdx = s.tab !== undefined
    ? Math.max(0, Math.min(TABS.length - 1, parseInt(s.tab, 10))) : 0;
  if (tabIdx !== currentTab) {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelector('.tab[data-tab="' + tabIdx + '"]').classList.add('active');
    currentTab = tabIdx;
    const tab = TABS[currentTab];
    document.getElementById('panel-title').textContent = tab.title;
    document.getElementById('panel-sub').textContent   = tab.subtitle;
    document.getElementById('maptitle').textContent    = tab.title;
    if (map.getLayer('biv-fill'))
      map.setPaintProperty('biv-fill', 'fill-color', buildExpr(tab));
  }

  const mf = window.paiMF;
  if (s.ri)   mf.ri        = s.ri;
  if (s.rg)   mf.rg        = s.rg;
  if (s.pi)   mf.pi        = s.pi;
  if (s.pg)   mf.pg        = s.pg;
  if (s.dens) mf.densMin   = parseFloat(s.dens);
  if (s.circ) mf.circ      = s.circ;
  if (s.upl)  mf.upl       = s.upl;
  if (s.q)    mf.quartiere = s.q;

  if (s.sel) s.sel.split(',').filter(Boolean).forEach(k => activeCells.add(k));

  if (s.ri)   document.getElementById('pfm-ri').value   = mf.ri;
  if (s.rg)   document.getElementById('pfm-rg').value   = mf.rg;
  if (s.pi)   document.getElementById('pfm-pi').value   = mf.pi;
  if (s.pg)   document.getElementById('pfm-pg').value   = mf.pg;
  if (s.dens) {
    document.getElementById('pfm-dens').value           = mf.densMin;
    document.getElementById('pfm-dens-val').textContent = String(mf.densMin);
  }

  _syncSearchInput();
  buildLegend();
  updateFilterBadge();
  applyFilters();

  _restoringState = false;
}

// ═══════════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.tab').forEach(btn => {
  const tabData = TABS[+btn.dataset.tab];
  btn.addEventListener('mouseenter', e => showTT(e,
    `<strong>${tabData.title}</strong><br><span style="font-size:11px;color:var(--text2)">${tabData.subtitle}</span>`
  ));
  btn.addEventListener('mousemove', moveTT);
  btn.addEventListener('mouseleave', hideTT);

  btn.addEventListener('click', () => {
    const idx = +btn.dataset.tab;
    if (idx === currentTab) return;

    // Update tab UI
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentTab = idx;
    activeCells.clear();
    updateFilterChips();

    const tab = TABS[currentTab];
    document.getElementById('panel-title').textContent = tab.title;
    document.getElementById('panel-sub').textContent   = tab.subtitle;
    document.getElementById('maptitle').textContent    = tab.title;

    // Update map
    if (map.getLayer('biv-fill')) {
      map.setPaintProperty('biv-fill', 'fill-color', buildExpr(tab));
      map.setFilter('biv-fill', null);
      map.setFilter('biv-line', null);
    }

    buildLegend();
    pushAppState();
  });
});

// ═══════════════════════════════════════════════════════
//  CLEAR FILTERS
// ═══════════════════════════════════════════════════════
document.getElementById('clear-btn').addEventListener('click', () => {
  activeCells.clear();
  applyFilters();
  document.querySelectorAll('.lcell.on').forEach(c => c.classList.remove('on'));
  buildDonut();
});

// ═══════════════════════════════════════════════════════
//  FEATURE CLICK
// ═══════════════════════════════════════════════════════
map.on('click', 'biv-fill', e => showInfo(e.features[0].properties));

map.on('click', e => {
  if (!map.getLayer('biv-fill')) return;
  if (!map.queryRenderedFeatures(e.point, { layers: ['biv-fill'] }).length)
    document.getElementById('finfo').style.display = 'none';
});

map.on('mouseenter', 'biv-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'biv-fill', () => { map.getCanvas().style.cursor = ''; hideTT(); });

map.on('mousemove', 'biv-fill', e => {
  const p   = e.features[0].properties;
  const tab = TABS[currentTab];
  const dens = (+(p['carico_insediativo'] ?? 0)).toLocaleString('it-IT', {minimumFractionDigits:1, maximumFractionDigits:1});
  const qrt  = p.Quartiere ? `<br><strong>Quartiere:</strong> ${p.Quartiere}` : '';
  const circ = p.circoscrizione ? ` &nbsp;(Circ. ${p.circoscrizione})` : '';

  let body = '';
  if (tab.type === 'choropleth') {
    body = `<strong>Carico ins.:</strong> ${dens} ab/ha${qrt}${circ}`;
  } else if (tab.type === 'pai-cat') {
    const val = p[tab.field] ?? '—';
    const cat = tab.categories.find(c => String(c.value) === String(val));
    body = `<strong>${tab.fieldLabel}:</strong> ${cat ? cat.label : val}<br>`
         + `<strong>Carico ins.:</strong> ${dens} ab/ha`
         + qrt + circ;
  } else {
    const yFieldLbl = tab.yFieldLabel || tab.yField;
    const xFieldLbl = tab.xFieldLabel || tab.xField;
    const yVal = p[tab.yField] ?? '—';
    const xVal = tab.xType === 'step'
      ? `${dens} ab/ha`
      : (p[tab.xField] ?? '—');
    body = `<strong>${yFieldLbl}:</strong> ${yVal}<br>`
         + `<strong>${tab.xType === 'step' ? 'Carico ins.' : xFieldLbl}:</strong> ${xVal}`
         + qrt + circ;
  }
  showTT(e.originalEvent, body);
});

const INFO_FIELDS = [
  // ── Localizzazione ──────────────────────────────────────
  { k: 'Comune',           l: 'Comune' },
  { k: 'circoscrizione',   l: 'Circoscrizione' },
  { k: 'UPL',              l: 'UPL' },
  { k: 'Quartiere',        l: 'Quartiere' },
  // ── Popolazione ─────────────────────────────────────────
  { k: 'pop_ripartita',      l: 'Pop. ripartita' },
  { k: 'carico_insediativo', l: 'Carico insediativo (ab/ha)' },
  { k: 'Italiani',           l: 'Italiani' },
  { k: 'Stranieri',        l: 'Stranieri' },
  { k: 'Totale',           l: 'Totale' },
  // ── Rischio / Pericolo PAI ───────────────────────────────
  { k: 'RISCHIO_Idraul',   l: 'Rischio Idraulico' },
  { k: 'RISCHIO_geomorf',  l: 'Rischio Geomorfologico' },
  { k: 'PERICOLO_Idraul',  l: 'Pericolosità Idraulica' },
  { k: 'PERICOLO_geomorf', l: 'Pericolosità Geomorfologica' },
  // ── Aree (m²) ───────────────────────────────────────────
  { k: 'area_sezione',     l: 'Area sezione (m²)',    tech: true },
  { k: 'area_agg',         l: 'Area aggregato (m²)',  tech: true },
  { k: 'area_tot_sez',     l: 'Area tot. sez. (m²)',  tech: true },
  // ── Codici tecnici ──────────────────────────────────────
  { k: 'SA_geomorf',       l: 'SA geomorf.',          tech: true },
  { k: 'sez2011',          l: 'Sez. ISTAT 2011',      tech: true, code: true },
  { k: 'sez',              l: 'Sezione',               tech: true, code: true },
  { k: 'cod_asc',          l: 'Cod. ASC',              tech: true, code: true },
  { k: 'id_quartieri',     l: 'ID Quartiere',          tech: true, code: true },
  { k: 'Label',            l: 'Etichetta',             tech: true, code: true },
  { k: 'IDAG',             l: 'IDAG',                  tech: true, code: true },
  { k: 'fid',              l: 'FID',                   tech: true, code: true },
];

function showInfo(props) {
  const shown = new Set();
  let html = '';
  INFO_FIELDS.forEach(({ k, l, code, tech }) => {
    if (props[k] == null) return;
    shown.add(k);
    let v;
    if (k === 'carico_insediativo') {
      v = (+(props[k])).toLocaleString('it-IT', {minimumFractionDigits:1, maximumFractionDigits:1});
    } else if (code) {
      v = String(props[k]);
    } else {
      v = typeof props[k] === 'number'
        ? Math.round(props[k]).toLocaleString('it-IT')
        : props[k];
    }
    const sz = tech ? ' style="font-size:10px;color:var(--text2)"' : '';
    const vz = tech ? ' style="font-size:10px"' : '';
    html += `<div class="prow"><span class="pk"${sz}>${l}</span><span class="pv"${vz}>${v}</span></div>`;
  });
  // campi residui non in INFO_FIELDS
  Object.entries(props).forEach(([k, v]) => {
    if (shown.has(k) || v == null) return;
    html += `<div class="prow"><span class="pk" style="font-size:9px;color:var(--text2)">${k}</span><span class="pv" style="font-size:9px">${v}</span></div>`;
  });
  document.getElementById('fprops').innerHTML = html || '<div class="prow"><span class="pk">—</span></div>';
  document.getElementById('finfo').style.display = 'block';
}

// ═══════════════════════════════════════════════════════
//  CUSTOM TOOLBAR
// ═══════════════════════════════════════════════════════
const zoomSlider = document.getElementById('zoom-slider');
const zoomBadge  = document.getElementById('zoom-badge');

function syncZoomUI(z) {
  const clamped = Math.min(Math.max(z, 11), 17);
  zoomSlider.value = clamped;
  zoomBadge.textContent = Math.round(clamped);
  const pct = ((clamped - 11) / 6) * 100;
  zoomSlider.style.background =
    `linear-gradient(to right, #f5a623 ${pct}%, var(--border) ${pct}%)`;
}

map.on('zoom', () => syncZoomUI(map.getZoom()));

zoomSlider.addEventListener('input', () => map.setZoom(+zoomSlider.value));

document.getElementById('btn-home').addEventListener('click', () => {
  map.flyTo({ center: PALERMO.center, zoom: PALERMO.zoom });
});

const FS_EXPAND   = 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z';
const FS_COMPRESS = 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z';

document.getElementById('btn-fs').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

document.addEventListener('fullscreenchange', () => {
  const path = document.getElementById('btn-fs').querySelector('path');
  if (path) path.setAttribute('d', document.fullscreenElement ? FS_COMPRESS : FS_EXPAND);
});

// ═══════════════════════════════════════════════════════
//  TOAST UTIL
// ═══════════════════════════════════════════════════════
function toast(msg, isErr = false) {
  const el = document.getElementById('dbg');
  el.textContent = msg;
  el.style.color = isErr ? '#f06060' : 'var(--text2)';
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 6000);
}

// ═══════════════════════════════════════════════════════
//  SEARCH + FILTER MODULE
// ═══════════════════════════════════════════════════════

window.paiMF = { ri:'', rg:'', pi:'', pg:'', densMin:0, quartiere:'', circ:'', upl:'' };

const _paiData = {
  quartieri: new Set(), circs: new Set(), upls: new Set(), collected: false,
  circUpls:  new Map(), circQrtrs: new Map(),
  uplQrtrs:  new Map(), uplCirc:   new Map(),
  qrtrCirc:  new Map(), qrtrUpl:   new Map()
};

function paiCollectFeatures() {
  if (!map.getLayer('biv-fill')) return;
  const feats = map.queryRenderedFeatures({ layers: ['biv-fill'] });
  feats.forEach(f => {
    const p = f.properties;
    const q = p.Quartiere || null;
    const c = p.circoscrizione != null ? String(p.circoscrizione) : null;
    const u = p.UPL          != null ? String(p.UPL)           : null;
    if (q) _paiData.quartieri.add(q);
    if (c) _paiData.circs.add(c);
    if (u) _paiData.upls.add(u);
    if (c && u) {
      if (!_paiData.circUpls.has(c))  _paiData.circUpls.set(c, new Set());
      _paiData.circUpls.get(c).add(u);
      _paiData.uplCirc.set(u, c);
    }
    if (c && q) {
      if (!_paiData.circQrtrs.has(c)) _paiData.circQrtrs.set(c, new Set());
      _paiData.circQrtrs.get(c).add(q);
      _paiData.qrtrCirc.set(q, c);
    }
    if (u && q) {
      if (!_paiData.uplQrtrs.has(u))  _paiData.uplQrtrs.set(u, new Set());
      _paiData.uplQrtrs.get(u).add(q);
      _paiData.qrtrUpl.set(q, u);
    }
  });
  _paiData.collected = true;
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function hlText(text, q) {
  if (!q) return escHtml(text);
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
  return escHtml(text).replace(re, '<mark>$1</mark>');
}

const RISCHIO_LABELS = [
  { val:'R1', label:'Rischio Idraulico R1 — Basso',          field:'RISCHIO_Idraul', mfKey:'ri' },
  { val:'R2', label:'Rischio Idraulico R2 — Moderato',       field:'RISCHIO_Idraul', mfKey:'ri' },
  { val:'R3', label:'Rischio Idraulico R3 — Elevato',        field:'RISCHIO_Idraul', mfKey:'ri' },
  { val:'R4', label:'Rischio Idraulico R4 — Molto elevato',  field:'RISCHIO_Idraul', mfKey:'ri' },
  { val:'P1', label:'Pericolosità Idraulica P1 — Moderata',      field:'PERICOLO_Idraul', mfKey:'pi' },
  { val:'P2', label:'Pericolosità Idraulica P2 — Media',          field:'PERICOLO_Idraul', mfKey:'pi' },
  { val:'P3', label:'Pericolosità Idraulica P3 — Elevata',        field:'PERICOLO_Idraul', mfKey:'pi' },
  { val:'P4', label:'Pericolosità Idraulica P4 — Molto elevata',  field:'PERICOLO_Idraul', mfKey:'pi' },
];

// I–VIII riconosciuti solo come Circoscrizioni (sia come numero che come romano)
const ROMAN_CIRC = { 'i':'1','ii':'2','iii':'3','iv':'4','v':'5','vi':'6','vii':'7','viii':'8' };

const PIN_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

function paiSearch(q) {
  const dd = document.getElementById('pai-search-dd');
  if (!q || q.length < 1) { dd.innerHTML = ''; dd.classList.remove('open'); return; }
  paiCollectFeatures();
  const ql  = q.toLowerCase().trim();
  const mf  = window.paiMF;
  let html  = '';

  // ── Romani → solo Circoscrizione ───────────────────────
  const numericVal = ROMAN_CIRC[ql];
  if (numericVal !== undefined) {
    // Cerca il valore nella forma effettivamente memorizzata (numero o romano)
    const circVal = _paiData.circs.has(numericVal)      ? numericVal
                  : _paiData.circs.has(ql.toUpperCase()) ? ql.toUpperCase()
                  : numericVal; // fallback: tiles ancora parziali
    html += `<div class="pai-dd-cat">Circoscrizioni</div>`;
    html += `<div class="pai-dd-item" data-type="circ" data-val="${escHtml(circVal)}" data-label="Circoscrizione ${ql.toUpperCase()}">
      ${PIN_SVG}<span>Circoscrizione <mark>${ql.toUpperCase()}</mark></span><span class="pai-dd-badge">Circ.</span></div>`;
    dd.innerHTML = html;
    dd.classList.add('open');
    dd.querySelectorAll('.pai-dd-item').forEach(el =>
      el.addEventListener('mousedown', e => { e.preventDefault(); paiSearchSelect(el); }));
    return;
  }

  // ── Opzioni disponibili in base alla selezione attuale (cascading) ─
  const availUpls = mf.circ
    ? (_paiData.circUpls.get(mf.circ)  || _paiData.upls)
    : _paiData.upls;

  const availQrtrs = mf.upl
    ? (_paiData.uplQrtrs.get(mf.upl)   || (mf.circ ? _paiData.circQrtrs.get(mf.circ) || _paiData.quartieri : _paiData.quartieri))
    : (mf.circ ? (_paiData.circQrtrs.get(mf.circ) || _paiData.quartieri) : _paiData.quartieri);

  // ── Quartieri ───────────────────────────────────────────
  const qMatches = [...availQrtrs].filter(v => v.toLowerCase().includes(ql)).slice(0, 8);
  if (qMatches.length) {
    html += `<div class="pai-dd-cat">Quartieri</div>`;
    qMatches.forEach(v => {
      html += `<div class="pai-dd-item" data-type="quartiere" data-val="${escHtml(v)}" data-label="${escHtml(v)}">
        ${PIN_SVG}<span>${hlText(v, q)}</span><span class="pai-dd-badge">Quartiere</span></div>`;
    });
  }

  // ── UPL ────────────────────────────────────────────────
  const uMatches = [...availUpls].filter(v => String(v).toLowerCase().includes(ql)).slice(0, 5);
  if (uMatches.length) {
    html += `<div class="pai-dd-cat">UPL</div>`;
    uMatches.forEach(v => {
      const sv = String(v);
      html += `<div class="pai-dd-item" data-type="upl" data-val="${escHtml(sv)}" data-label="UPL ${escHtml(sv)}">
        ${PIN_SVG}<span>UPL ${hlText(sv, q)}</span><span class="pai-dd-badge">UPL</span></div>`;
    });
  }

  // ── Circoscrizioni ─────────────────────────────────────
  const cMatches = [..._paiData.circs].filter(v => String(v).toLowerCase().includes(ql)).slice(0, 5);
  if (cMatches.length) {
    html += `<div class="pai-dd-cat">Circoscrizioni</div>`;
    cMatches.forEach(v => {
      const sv = String(v);
      html += `<div class="pai-dd-item" data-type="circ" data-val="${escHtml(sv)}" data-label="Circoscrizione ${escHtml(sv)}">
        ${PIN_SVG}<span>Circoscrizione ${hlText(sv, q)}</span><span class="pai-dd-badge">Circ.</span></div>`;
    });
  }

  // ── Classificazione PAI ────────────────────────────────
  const rMatches = RISCHIO_LABELS.filter(r => r.label.toLowerCase().includes(ql)).slice(0, 4);
  if (rMatches.length) {
    html += `<div class="pai-dd-cat">Classificazione PAI</div>`;
    rMatches.forEach(r => {
      html += `<div class="pai-dd-item" data-type="risk" data-mfkey="${r.mfKey}" data-val="${escHtml(r.val)}" data-label="${escHtml(r.val)}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        <span>${hlText(r.label, q)}</span><span class="pai-dd-badge">Rischio</span></div>`;
    });
  }

  if (!html) html = `<div class="pai-dd-empty">Nessun risultato per "<em>${escHtml(q)}</em>"</div>`;
  dd.innerHTML = html;
  dd.classList.add('open');

  dd.querySelectorAll('.pai-dd-item').forEach(el => {
    el.addEventListener('mousedown', e => { e.preventDefault(); paiSearchSelect(el); });
  });
}

function paiSearchSelect(el) {
  const type  = el.dataset.type;
  const val   = el.dataset.val;
  const label = el.dataset.label || val;
  if (type === 'quartiere') {
    window.paiMF.quartiere = val;
    // Backfill circ/upl dalla gerarchia solo se non già impostati
    if (!window.paiMF.circ) window.paiMF.circ = _paiData.qrtrCirc.get(val) || '';
    if (!window.paiMF.upl)  window.paiMF.upl  = _paiData.qrtrUpl.get(val)  || '';
  } else if (type === 'circ') {
    window.paiMF.circ      = val;
    window.paiMF.upl       = '';
    window.paiMF.quartiere = '';
  } else if (type === 'upl') {
    window.paiMF.upl       = val;
    // Backfill circ se non già impostato
    if (!window.paiMF.circ) window.paiMF.circ = _paiData.uplCirc.get(val) || '';
    window.paiMF.quartiere = '';
  } else if (type === 'risk') {
    window.paiMF[el.dataset.mfkey] = val;
  }
  const inp = document.getElementById('pai-search-input');
  inp.value = label;
  document.getElementById('pai-search-clear').style.display = 'flex';
  document.getElementById('pai-search-dd').classList.remove('open');
  updateFilterBadge();
  applyFilters();
}

function paiSearchClear() {
  const inp = document.getElementById('pai-search-input');
  inp.value = '';
  document.getElementById('pai-search-clear').style.display = 'none';
  document.getElementById('pai-search-dd').classList.remove('open');
  window.paiMF.quartiere = '';
  window.paiMF.circ = '';
  window.paiMF.upl  = '';
  updateFilterBadge();
  applyFilters();
}

// ─── Filter Modal ───────────────────────────────────────

function paiOpenFilterModal() {
  // sync selects with current state
  const mf = window.paiMF;
  document.getElementById('pfm-ri').value = mf.ri || '';
  document.getElementById('pfm-rg').value = mf.rg || '';
  document.getElementById('pfm-pi').value = mf.pi || '';
  document.getElementById('pfm-pg').value = mf.pg || '';
  const densEl = document.getElementById('pfm-dens');
  densEl.value = mf.densMin || 0;
  document.getElementById('pfm-dens-val').textContent = (mf.densMin || 0).toLocaleString('it-IT');
  document.getElementById('pai-filter-overlay').classList.add('open');
  document.getElementById('pai-filter-modal').classList.add('open');
  document.getElementById('pai-filter-btn').classList.add('active');
}

function paiCloseFilterModal() {
  document.getElementById('pai-filter-overlay').classList.remove('open');
  document.getElementById('pai-filter-modal').classList.remove('open');
  document.getElementById('pai-filter-btn').classList.remove('active');
}

function paiApplyFilterModal() {
  window.paiMF.ri      = document.getElementById('pfm-ri').value;
  window.paiMF.rg      = document.getElementById('pfm-rg').value;
  window.paiMF.pi      = document.getElementById('pfm-pi').value;
  window.paiMF.pg      = document.getElementById('pfm-pg').value;
  window.paiMF.densMin = Number(document.getElementById('pfm-dens').value);
  updateFilterBadge();
  applyFilters();
  paiCloseFilterModal();
}

function paiResetFilterModal() {
  window.paiMF = { ri:'', rg:'', pi:'', pg:'', densMin:0, quartiere: window.paiMF.quartiere, circ: window.paiMF.circ, upl: window.paiMF.upl };
  document.getElementById('pfm-ri').value = '';
  document.getElementById('pfm-rg').value = '';
  document.getElementById('pfm-pi').value = '';
  document.getElementById('pfm-pg').value = '';
  document.getElementById('pfm-dens').value = 0;
  document.getElementById('pfm-dens-val').textContent = '0';
  updateFilterBadge();
  applyFilters();
}

function updateFilterBadge() {
  const mf = window.paiMF;
  let n = 0;
  if (mf.ri) n++; if (mf.rg) n++; if (mf.pi) n++; if (mf.pg) n++;
  if (mf.densMin > 0) n++;
  if (mf.quartiere) n++; if (mf.circ) n++; if (mf.upl) n++;
  const badge = document.getElementById('pai-filter-badge');
  if (n > 0) { badge.textContent = n; badge.style.display = 'flex'; }
  else        { badge.style.display = 'none'; }
  updateFilterChips();
}

function _syncSearchInput() {
  const inp = document.getElementById('pai-search-input');
  const clr = document.getElementById('pai-search-clear');
  if (!inp) return;
  const mf = window.paiMF;
  if      (mf.quartiere) { inp.value = mf.quartiere;              clr.style.display = 'flex'; }
  else if (mf.upl)       { inp.value = 'UPL ' + mf.upl;          clr.style.display = 'flex'; }
  else if (mf.circ)      { inp.value = 'Circoscrizione ' + mf.circ; clr.style.display = 'flex'; }
  else                   { inp.value = '';                          clr.style.display = 'none'; }
}

function resetAllFilters() {
  window.paiMF = { ri:'', rg:'', pi:'', pg:'', densMin:0, quartiere:'', circ:'', upl:'' };
  activeCells.clear();
  document.querySelectorAll('.lcell.on, .choro-seg.on, .pai-cat-row.on').forEach(c => c.classList.remove('on'));
  const inp = document.getElementById('pai-search-input');
  if (inp) inp.value = '';
  document.getElementById('pai-search-clear').style.display = 'none';
  document.getElementById('pfm-ri').value   = '';
  document.getElementById('pfm-rg').value   = '';
  document.getElementById('pfm-pi').value   = '';
  document.getElementById('pfm-pg').value   = '';
  document.getElementById('pfm-dens').value = 0;
  document.getElementById('pfm-dens-val').textContent = '0';
  updateFilterBadge();
  buildLegend();
  applyFilters();
}

function updateFilterChips() {
  const el = document.getElementById('pai-chips');
  if (!el) return;
  const mf = window.paiMF;
  const items = [];
  const rmHandlers = [];

  if (mf.circ) items.push({ cat:'loc', label:'Circ. ' + mf.circ,
    rm() { window.paiMF.circ=''; window.paiMF.upl=''; window.paiMF.quartiere=''; _syncSearchInput(); }
  });
  if (mf.upl) items.push({ cat:'loc', label:'UPL: ' + mf.upl,
    rm() { window.paiMF.upl=''; window.paiMF.quartiere=''; _syncSearchInput(); }
  });
  if (mf.quartiere) items.push({ cat:'loc', label: mf.quartiere,
    rm() { window.paiMF.quartiere=''; _syncSearchInput(); }
  });
  if (mf.ri)  items.push({ cat:'pai',  label:'R.Idraul: '  + mf.ri,  rm(){ window.paiMF.ri=''; } });
  if (mf.rg)  items.push({ cat:'pai',  label:'R.Geomorf: ' + mf.rg,  rm(){ window.paiMF.rg=''; } });
  if (mf.pi)  items.push({ cat:'pai',  label:'P.Idraul: '  + mf.pi,  rm(){ window.paiMF.pi=''; } });
  if (mf.pg)  items.push({ cat:'pai',  label:'P.Geomorf: ' + mf.pg,  rm(){ window.paiMF.pg=''; } });
  if (mf.densMin > 0) items.push({ cat:'dens',
    label:'Carico ≥ ' + Number(mf.densMin).toLocaleString('it-IT') + ' ab/ha',
    rm(){ window.paiMF.densMin=0; }
  });
  if (activeCells.size > 0) items.push({ cat:'sel',
    label:'Legenda: ' + activeCells.size + ' sel.',
    rm() {
      activeCells.clear();
      document.querySelectorAll('.lcell.on, .choro-seg.on, .pai-cat-row.on').forEach(c => c.classList.remove('on'));
      buildLegend();
    }
  });

  el.textContent = '';
  if (items.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'flex';

  items.forEach((item, i) => {
    rmHandlers.push(item.rm);
    const chip = document.createElement('span');
    chip.className = 'pai-chip pai-chip-' + item.cat;
    const lbl = document.createElement('span');
    lbl.className = 'pai-chip-label';
    lbl.textContent = item.label;
    chip.appendChild(lbl);
    const btn = document.createElement('button');
    btn.className = 'pai-chip-close';
    btn.title = 'Rimuovi filtro';
    btn.textContent = '✕';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      rmHandlers[i]();
      updateFilterBadge();
      applyFilters();
    });
    chip.appendChild(btn);
    el.appendChild(chip);
  });

  if (items.length > 1) {
    const rall = document.createElement('button');
    rall.className = 'pai-chip pai-chip-resetall';
    rall.textContent = '✕ Tutti';
    rall.addEventListener('click', resetAllFilters);
    el.appendChild(rall);
  }
}

// ─── Wire Events ────────────────────────────────────────
(function initPaiSearch() {
  const inp   = document.getElementById('pai-search-input');
  const clrBtn = document.getElementById('pai-search-clear');
  const fBtn  = document.getElementById('pai-filter-btn');
  const overlay = document.getElementById('pai-filter-overlay');
  const densEl  = document.getElementById('pfm-dens');

  inp.addEventListener('input', e => {
    const v = e.target.value.trim();
    clrBtn.style.display = v ? 'flex' : 'none';
    paiSearch(v);
    if (!v) { window.paiMF.quartiere = ''; window.paiMF.circ = ''; window.paiMF.upl = ''; updateFilterBadge(); applyFilters(); }
  });

  inp.addEventListener('keydown', e => {
    const dd = document.getElementById('pai-search-dd');
    const items = [...dd.querySelectorAll('.pai-dd-item')];
    const cur = dd.querySelector('.pai-dd-item.focused');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = cur ? (items[items.indexOf(cur)+1] || items[0]) : items[0];
      items.forEach(i => i.classList.remove('focused'));
      if (next) next.classList.add('focused');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = cur ? (items[items.indexOf(cur)-1] || items[items.length-1]) : items[items.length-1];
      items.forEach(i => i.classList.remove('focused'));
      if (prev) prev.classList.add('focused');
    } else if (e.key === 'Enter') {
      const focused = dd.querySelector('.pai-dd-item.focused');
      if (focused) { e.preventDefault(); paiSearchSelect(focused); }
    } else if (e.key === 'Escape') {
      dd.classList.remove('open');
    }
  });

  inp.addEventListener('blur', () => setTimeout(() => document.getElementById('pai-search-dd').classList.remove('open'), 150));

  clrBtn.addEventListener('click', paiSearchClear);
  fBtn.addEventListener('click', paiOpenFilterModal);
  overlay.addEventListener('click', paiCloseFilterModal);
  document.getElementById('pfm-close').addEventListener('click', paiCloseFilterModal);
  document.getElementById('pfm-apply').addEventListener('click', paiApplyFilterModal);
  document.getElementById('pfm-reset').addEventListener('click', paiResetFilterModal);

  densEl.addEventListener('input', () => {
    document.getElementById('pfm-dens-val').textContent = Number(densEl.value).toLocaleString('it-IT');
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') paiCloseFilterModal(); });
})();

map.on('idle', () => {
  paiCollectFeatures();
  if (!map.getSource('pai')) { buildDonut(); return; }
  const seen = new Set();
  _donutFeats = map.querySourceFeatures('pai', { sourceLayer: LAYER })
    .filter(f => {
      const k = f.id != null ? String(f.id) : JSON.stringify(f.properties);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  buildDonut();
});

map.on('moveend', pushAppState);

// ═══════════════════════════════════════════════════════
//  THEME TOGGLE
// ═══════════════════════════════════════════════════════
function switchTheme() {
  const isDark = document.body.classList.toggle('dark');
  const btn = document.getElementById('btn-theme');
  btn.querySelector('path').setAttribute('d', isDark ? SUN_PATH : MOON_PATH);
  btn.title = isDark ? 'Tema chiaro' : 'Tema scuro';

  if (map.getLayer('biv-line')) map.removeLayer('biv-line');
  if (map.getLayer('biv-fill')) map.removeLayer('biv-fill');
  if (map.getSource('pai'))    map.removeSource('pai');

  map.setStyle(isDark ? STYLE_DARK : STYLE_LIGHT);
  map.once('idle', () => {
    setupPaiLayers();
    if (map.getLayer('biv-fill')) {
      map.setPaintProperty('biv-fill', 'fill-color', buildExpr(TABS[currentTab]));
    }
    applyFilters();
  });
}

document.getElementById('btn-theme').addEventListener('click', switchTheme);

// ═══════════════════════════════════════════════════════
//  INFO MODAL
// ═══════════════════════════════════════════════════════
(function initInfoModal() {
  const overlay = document.getElementById('info-overlay');
  const wrap    = document.getElementById('info-modal-wrap');
  const modal   = document.getElementById('info-modal');
  const btn     = document.getElementById('btn-info');
  const tabBtn  = document.getElementById('info-modal-tab');

  function open() {
    overlay.classList.add('open');
    wrap.classList.add('open');
    btn.classList.add('active');
  }
  function close() {
    overlay.classList.remove('open');
    wrap.classList.remove('open');
    btn.classList.remove('active');
  }
  function toggle() { wrap.classList.contains('open') ? close() : open(); }

  btn.addEventListener('click', toggle);
  tabBtn.addEventListener('click', toggle);
  overlay.addEventListener('click', close);
  document.getElementById('info-close').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // Tab switching del contenuto
  modal.querySelectorAll('.info-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
      modal.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('itab-' + tab.dataset.itab).classList.add('active');
    });
  });
})();

// ═══════════════════════════════════════════════════════
//  PANEL TOGGLE
// ═══════════════════════════════════════════════════════
(function initPanelToggle() {
  const panel  = document.getElementById('panel');
  const toggle = document.getElementById('panel-toggle');

  if (window.innerWidth <= 768) {
    panel.classList.add('closed');
    document.body.classList.add('panel-closed');
    toggle.textContent = '‹';
    toggle.title = 'Apri pannello';
  }

  toggle.addEventListener('click', () => {
    const willClose = !panel.classList.contains('closed');
    panel.classList.toggle('closed');
    document.body.classList.toggle('panel-closed');
    toggle.textContent = willClose ? '‹' : '›';
    toggle.title = willClose ? 'Apri pannello' : 'Chiudi pannello';
  });
})();

