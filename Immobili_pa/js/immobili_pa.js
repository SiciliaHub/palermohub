// ─── STATE ───────────────────────────────────────────────────────────────────
let filtered = [...RAW_DATA];
let tableData = [...RAW_DATA];
let currentPage = 1;
let pageSize = 50;
let sortField = null;
let sortDir = 1;
let searchStr = "";
let selectedIds = new Set();

// Chart refs
let chartCat = null, chartTipo = null, chartCirc = null, chartQuart = null, chartCatCirc = null;

// Map
let map = null;
let markerCluster = null;
let osmLayer = null;
let satelliteLayer = null;

// PMTiles polygon layer
let usePolygons = false;
let polyLayer = null;
let glMap = null;
let _polyClickFn = null;
let _polyMoveFn  = null;

// ─── COLOURS ─────────────────────────────────────────────────────────────────
const CAT_COLORS = {
  "Unità abitativa": "#f4eabf",
  "Unità non abitativa": "#d66b58",
  "Edificio": "#9ebac4",
  "Area": "#9b9990",
  "Terreno": "#b7f75e"
};
const CAT_BADGE = {
  "Unità abitativa": "badge-ua",
  "Unità non abitativa": "badge-una",
  "Edificio": "badge-ed",
  "Area": "badge-ar",
  "Terreno": "badge-te"
};
const CHART_COLORS = ["#922b21","#9ebac4","#c47e44","#6b8f71","#9b9990","#c9aa58","#5d8a8a","#d66b58","#7c6a5e","#b5825a","#8a7a6e","#a06060"];

// ─── FILTER HELPERS ───────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function clearCatFilter() {
  document.getElementById('f-cat').value = '';
  onFilterChange();
}

function setFilterTeAree() {
  const sel = document.getElementById('f-cat');
  if (sel.value === 'Terreno') sel.value = 'Area';
  else if (sel.value === 'Area') sel.value = '';
  else sel.value = 'Terreno';
  onFilterChange();
}

function setFilter(selectId, value) {
  const sel = document.getElementById(selectId);
  sel.value = sel.value === value ? '' : value; // click again = toggle off
  onFilterChange();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  populateSelect("f-circ", uniqueSorted(RAW_DATA, "circoscrizione"), "Tutte le circoscrizioni (", ")");
  populateSelect("f-quart", uniqueSorted(RAW_DATA, "quartiere"), "Tutti i quartieri (", ")");
  populateSelect("f-upl", uniqueSorted(RAW_DATA, "upl"), "Tutte le UPL (", ")");
  populateSelect("f-cat", uniqueSorted(RAW_DATA, "categoria"), "Tutte le categorie (", ")");
  populateSelect("f-tipo", uniqueSorted(RAW_DATA, "tipo"), "Tutti le tipologie (", ")");

  ["f-circ","f-quart","f-upl","f-cat","f-tipo"].forEach(id =>
    document.getElementById(id).addEventListener("change", onFilterChange)
  );

  applyFilters();
  loadFiltersFromUrl();

  // Mappa è il tab default: init mappa + grafici sidebar
  setTimeout(() => {
    initMap();
    updateDashboard();
  }, 150);

  initResizeHandle();

  ['tab-note', 'tab-analisi'].forEach(tabId => {
    const el = document.getElementById(tabId);
    if (!el) return;
    el.addEventListener('scroll', () => {
      const btn = document.getElementById('doc-scroll-top-btn');
      if (btn) btn.classList.toggle('visible', el.scrollTop > 200);
    });
  });
});

function scrollDocTop() {
  const activeDoc = document.querySelector('#tab-note.active, #tab-analisi.active');
  if (activeDoc) activeDoc.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function uniqueSorted(arr, key) {
  return [...new Set(arr.map(d => d[key]).filter(v => v))].sort();
}

function populateSelect(id, values, prefix, suffix) {
  const sel = document.getElementById(id);
  const first = sel.options[0];
  // Remove all but first
  while (sel.options.length > 1) sel.remove(1);
  // Update first option text
  first.textContent = prefix.replace("(","").trim() + " – tutti (" + values.length + ")";
  first.value = "";
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
  const _badge = document.getElementById('cnt-' + id);
  if (_badge) _badge.textContent = values.length;
}

function countBy(arr, key) {
  const map = {};
  arr.forEach(d => { const v = d[key] || "(n.d.)"; map[v] = (map[v]||0)+1; });
  return map;
}

function fmt(n) { return n.toLocaleString("it-IT"); }

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

// Renderer per la classifica stile "Top N" (sostituisce i grafici a barre sidebar).
// items: [{ label, value, color?, active?, dim?, onClick?, title? }]
// opts:  { color, header?: { title, icon } }
function renderRankList(container, items, opts) {
  if (!container) return;
  opts = opts || {};
  container.innerHTML = "";
  if (!items.length) {
    const e = document.createElement("div");
    e.className = "rank-list-empty";
    e.innerHTML = '<i class="fa-solid fa-chart-simple"></i><span>Nessun dato per la selezione</span>';
    container.appendChild(e);
    return;
  }
  const max = Math.max.apply(null, items.map(i => i.value).concat([1]));
  const baseColor = opts.color || "var(--primary-dark)";
  container.style.setProperty("--rank-color", baseColor);

  if (opts.header) {
    const h = document.createElement("div");
    h.className = "rank-list-header";
    h.innerHTML =
      '<span class="rl-title"><i class="' + (opts.header.icon || "fa-solid fa-arrow-trend-up") + '"></i> ' +
      escapeHtml(opts.header.title) + '</span>' +
      '<span class="rl-count">' + items.length + '</span>';
    container.appendChild(h);
  }

  items.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "rank-item";
    if (item.active) row.classList.add("is-active");
    if (item.dim) row.classList.add("is-dim");
    if (item.color) row.style.setProperty("--rank-color", item.color);

    // Barra: segmenti stacked oppure barra semplice
    let barHtml;
    if (item.segments && item.segments.length) {
      const totalPct = Math.max(2, (item.value / max) * 100);
      const segsHtml = item.segments.filter(s => s.value > 0).map(s => {
        const segPct = (s.value / item.value) * 100;
        return '<span class="rank-seg" style="width:' + segPct + '%;background:' + s.color + '" title="' + escapeHtml(s.label) + ': ' + fmt(s.value) + '"></span>';
      }).join("");
      barHtml = '<div class="rank-bar rank-bar-stacked" style="width:' + totalPct + '%">' + segsHtml + '</div>';
    } else {
      const pct = Math.max(2, (item.value / max) * 100);
      barHtml = '<div class="rank-bar"><div class="rank-bar-fill" style="width:' + pct + '%"></div></div>';
    }

    row.innerHTML =
      '<div class="rank-num">' + (i + 1) + '</div>' +
      '<div class="rank-body">' +
        '<div class="rank-name">' + escapeHtml(item.label) + '</div>' +
        barHtml +
      '</div>' +
      '<div class="rank-val">' + fmt(item.value) + '</div>';
    row.title = item.title || (item.label + ": " + fmt(item.value) + " immobili");
    if (item.onClick) row.addEventListener("click", item.onClick);
    container.appendChild(row);
  });

  if (opts.legend && opts.legend.length) {
    const lg = document.createElement("div");
    lg.className = "rank-list-legend";
    lg.innerHTML = opts.legend.map(l =>
      '<span class="rank-leg-item"><span class="rank-leg-dot" style="background:' + l.color + '"></span>' + escapeHtml(l.label) + '</span>'
    ).join("");
    container.appendChild(lg);
  }
}

// ─── CASCADING FILTERS ────────────────────────────────────────────────────────
function onFilterChange() {
  const circ = document.getElementById("f-circ").value;

  // Step 1: circ → rebuild quart (leggi valore DOPO rebuild per vedere se è stato azzerato)
  const pool1 = circ ? RAW_DATA.filter(d => d.circoscrizione === circ) : RAW_DATA;
  rebuildSelect("f-quart", uniqueSorted(pool1, "quartiere"), document.getElementById("f-quart").value, "Tutti i quartieri");
  const quart = document.getElementById("f-quart").value;

  // Step 2: circ+quart → rebuild upl
  const pool2 = quart ? pool1.filter(d => d.quartiere === quart) : pool1;
  rebuildSelect("f-upl", uniqueSorted(pool2, "upl"), document.getElementById("f-upl").value, "Tutte le UPL");
  const upl = document.getElementById("f-upl").value;

  // Step 3: circ+quart+upl → rebuild categoria
  const pool3 = upl ? pool2.filter(d => d.upl === upl) : pool2;
  rebuildSelect("f-cat", uniqueSorted(pool3, "categoria"), document.getElementById("f-cat").value, "Tutte le categorie");
  const cat = document.getElementById("f-cat").value;

  // Step 4: circ+quart+upl+cat → rebuild tipo
  const pool4 = cat ? pool3.filter(d => d.categoria === cat) : pool3;
  rebuildSelect("f-tipo", uniqueSorted(pool4, "tipo"), document.getElementById("f-tipo").value, "TTutti le tipologie");

  applyFilters();
}

function rebuildSelect(id, values, currentVal, allLabel) {
  const sel = document.getElementById(id);
  const prev = sel.value;
  while (sel.options.length > 0) sel.remove(0);
  const opt0 = document.createElement("option");
  opt0.value = ""; opt0.textContent = allLabel + " (" + values.length + ")";
  sel.appendChild(opt0);
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
  // Restore selection if still valid
  if (values.includes(currentVal)) sel.value = currentVal;
  else sel.value = "";
  const _rb = document.getElementById('cnt-' + id);
  if (_rb) _rb.textContent = values.length;
}

function applyFilters() {
  const circ = document.getElementById("f-circ").value;
  const quart = document.getElementById("f-quart").value;
  const upl = document.getElementById("f-upl").value;
  const cat = document.getElementById("f-cat").value;
  const tipo = document.getElementById("f-tipo").value;

  // Aggiorna URL con i filtri attivi (routing condivisibile)
  const params = new URLSearchParams();
  if (circ)  params.set("circ",  circ);
  if (quart) params.set("quart", quart);
  if (upl)   params.set("upl",   upl);
  if (cat)   params.set("cat",   cat);
  if (tipo)  params.set("tipo",  tipo);
  const qs = params.toString();
  history.replaceState(null, "", (qs ? "?" + qs : location.pathname) + location.hash);

  // Aggiorna stato "filtro attivo" sui filter-group per evidenziarli graficamente
  ["f-circ","f-quart","f-upl","f-cat","f-tipo"].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.closest(".filter-group")?.classList.toggle("is-active", !!sel.value);
  });

  filtered = RAW_DATA.filter(d =>
    (!circ  || d.circoscrizione === circ) &&
    (!quart || d.quartiere === quart) &&
    (!upl   || d.upl === upl) &&
    (!cat   || d.categoria === cat) &&
    (!tipo  || d.tipo === tipo)
  );

  updateSidebar();
  updateDashboard();
  updateLegend();
  updateKpiActive();
  applySearchAndSort();

  if (document.getElementById("tab-mappa").classList.contains("active")) {
    if (usePolygons) updatePolyFilter();
    else updateMap();
    fitFilteredBounds();
  }
}

function updateKpiActive() {
  const cat = document.getElementById('f-cat').value;
  const map = { 'kpi-ua': 'Unità abitativa', 'kpi-ed': 'Edificio', 'kpi-una': 'Unità non abitativa' };
  const isTeAree = cat === 'Terreno' || cat === 'Area';

  document.getElementById('kpi-tot').closest('.kpi-card').classList.toggle('kpi-active', !cat);
  for (const [id, val] of Object.entries(map)) {
    document.getElementById(id).closest('.kpi-card').classList.toggle('kpi-active', cat === val);
  }
  document.getElementById('kpi-te').closest('.kpi-card').classList.toggle('kpi-active', isTeAree);

  // aggiorna label per indicare quale dei due è attivo
  const teLabel = document.getElementById('kpi-te-label');
  if (cat === 'Terreno') teLabel.textContent = 'Terreni ✓';
  else if (cat === 'Area') teLabel.textContent = 'Aree ✓';
  else teLabel.textContent = 'Terreni + Aree';
}

function updateLegend() {
  const activeCat = document.getElementById("f-cat").value;
  document.querySelectorAll(".legend-item[data-cat]").forEach(item => {
    item.classList.toggle("legend-active", item.dataset.cat === activeCat && !!activeCat);
    item.classList.toggle("legend-dimmed", !!activeCat && item.dataset.cat !== activeCat);
  });
}

function resetFilters() {
  ["f-circ","f-quart","f-upl","f-cat","f-tipo"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("search-input").value = "";
  searchStr = "";
  rebuildSelect("f-circ",  uniqueSorted(RAW_DATA, "circoscrizione"), "", "Tutte le circoscrizioni");
  rebuildSelect("f-quart", uniqueSorted(RAW_DATA, "quartiere"),      "", "Tutti i quartieri");
  rebuildSelect("f-upl",   uniqueSorted(RAW_DATA, "upl"),            "", "Tutte le UPL");
  rebuildSelect("f-cat",   uniqueSorted(RAW_DATA, "categoria"),      "", "Tutte le categorie");
  rebuildSelect("f-tipo",  uniqueSorted(RAW_DATA, "tipo"),           "", "Tutti le tipologie");
  applyFilters();
}

// ─── SIDEBAR MINI-STATS ───────────────────────────────────────────────────────
function updateSidebar() {
  const n = filtered.length;
  document.getElementById("ms-tot").textContent = fmt(n);
  document.getElementById("ms-geo").textContent = fmt(filtered.filter(d=>d.lat).length);
  document.getElementById("ms-circ").textContent = new Set(filtered.map(d=>d.circoscrizione).filter(v=>v)).size;
  document.getElementById("ms-quart").textContent = new Set(filtered.map(d=>d.quartiere).filter(v=>v)).size;
  document.getElementById("ms-upl").textContent = new Set(filtered.map(d=>d.upl).filter(v=>v)).size;
  renderActiveFilters();
}

function renderActiveFilters() {
  const DEFS = [
    { id: 'f-circ',  label: 'Circoscrizione', icon: 'fa-map' },
    { id: 'f-quart', label: 'Quartiere',       icon: 'fa-location-dot' },
    { id: 'f-upl',   label: 'UPL',             icon: 'fa-layer-group' },
    { id: 'f-cat',   label: 'Categoria',       icon: 'fa-tag' },
    { id: 'f-tipo',  label: 'Tipo',            icon: 'fa-cube' },
  ];
  const panel = document.getElementById('active-filters-panel');
  const chips = DEFS
    .filter(f => document.getElementById(f.id).value)
    .map(f => {
      const val = document.getElementById(f.id).value;
      return `<span class="filter-chip" onclick="clearSingleFilter('${f.id}')">
        <i class="fa-solid ${f.icon}"></i><span class="chip-text"><b>${f.label}:</b> ${val}</span><i class="fa-solid fa-xmark chip-x"></i>
      </span>`;
    });
  if (searchStr) chips.push(
    `<span class="filter-chip filter-chip-search" onclick="clearSearchFilter()">
      <i class="fa-solid fa-magnifying-glass"></i><span class="chip-text"><b>Cerca:</b> ${searchStr}</span><i class="fa-solid fa-xmark chip-x"></i>
    </span>`
  );
  panel.innerHTML = chips.length
    ? chips.join('')
    : '<span class="no-active-filters"><i class="fa-solid fa-circle-check"></i> Nessun filtro attivo</span>';
}

function clearSingleFilter(id) {
  document.getElementById(id).value = '';
  onFilterChange();
}

function clearSearchFilter() {
  document.getElementById('search-input').value = '';
  searchStr = '';
  onFilterChange();
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function updateDashboard() {
  const n = filtered.length;
  const ua  = filtered.filter(d => d.categoria === "Unità abitativa").length;
  const ed  = filtered.filter(d => d.categoria === "Edificio").length;
  const una = filtered.filter(d => d.categoria === "Unità non abitativa").length;
  const te  = filtered.filter(d => d.categoria === "Terreno" || d.categoria === "Area").length;

  document.getElementById("kpi-tot").textContent = fmt(n);
  document.getElementById("kpi-ua").textContent  = fmt(ua);
  document.getElementById("kpi-ed").textContent  = fmt(ed);
  document.getElementById("kpi-una").textContent = fmt(una);
  document.getElementById("kpi-te").textContent  = fmt(te);

  // Mini-bar: % rispetto al totale corrente
  const pct = (v) => n > 0 ? (v / n * 100) + "%" : "0%";
  const setBar = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.style.width = pct(v);
  };
  setBar("kpi-ua-bar",  ua);
  setBar("kpi-ed-bar",  ed);
  setBar("kpi-una-bar", una);
  setBar("kpi-te-bar",  te);

  renderChartCat();
  renderChartTipo();
  renderChartCirc();
  renderChartQuart();
  renderChartCatCirc();
}

function renderChartCat(targetCanvas) {
  const el = targetCanvas || document.getElementById("chart-cat");
  const counts = countBy(filtered, "categoria");
  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const activeCat = document.getElementById("f-cat").value;
  const baseColors = labels.map(l => CAT_COLORS[l] || "#bdc3c7");
  const colors = baseColors.map((c, i) =>
    (!activeCat || labels[i] === activeCat) ? c : hexToRgba(c, 0.2)
  );
  if (!targetCanvas && chartCat) chartCat.destroy();
  const total = values.reduce((a,b)=>a+b,0);
  const isSidebar = !targetCanvas;

  // Aggiorna il valore centrale e la legenda HTML (solo sidebar)
  if (isSidebar) {
    const centerEl = document.getElementById("chart-cat-center");
    if (centerEl) {
      centerEl.querySelector(".dc-num").textContent = fmt(total);
      centerEl.querySelector(".dc-lbl").textContent = total === 1 ? "immobile" : "immobili";
    }
    const legendEl = document.getElementById("chart-cat-legend");
    if (legendEl) {
      // Ordino dalla categoria con più immobili a quella con meno
      const order = labels.map((l, i) => ({ label: l, value: values[i], color: baseColors[i] }))
                         .sort((a, b) => b.value - a.value);
      legendEl.innerHTML = order.map(o => {
        const pct = total ? (o.value / total * 100).toFixed(1) : "0";
        const cls = !activeCat ? "" : (activeCat === o.label ? " is-active" : " is-dim");
        return '<div class="dl-item' + cls + '" data-cat="' + escapeHtml(o.label) + '" title="' + escapeHtml(o.label) + ': ' + fmt(o.value) + ' (' + pct + '%)">' +
                 '<span class="dl-dot" style="background:' + o.color + '"></span>' +
                 '<div class="dl-body">' +
                   '<span class="dl-label">' + escapeHtml(o.label) + '</span>' +
                   '<span class="dl-meta"><b>' + fmt(o.value) + '</b> · ' + pct + '%</span>' +
                 '</div>' +
               '</div>';
      }).join("");
      legendEl.querySelectorAll(".dl-item").forEach(item => {
        item.addEventListener("click", () => setFilter("f-cat", item.dataset.cat));
      });
    }
  }

  const instance = new Chart(el, {
    type: "doughnut",
    plugins: [ChartDataLabels],
    data: { labels, datasets: [{
      data: values,
      backgroundColor: colors,
      borderWidth: isSidebar ? 3 : 4,
      borderColor: "#fff",
      hoverOffset: isSidebar ? 6 : 10,
      hoverBorderColor: "#fff",
      spacing: 1
    }] },
    options: {
      ...(targetCanvas && { responsive: true, maintainAspectRatio: false }),
      ...(isSidebar  && { responsive: true, maintainAspectRatio: false }),
      animation: { animateRotate: true, duration: 600, easing: "easeOutQuart" },
      onClick: (evt, elements) => {
        if (!elements.length) return;
        setFilter("f-cat", labels[elements[0].index]);
        if (targetCanvas) closeChartModal();
      },
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
      plugins: {
        legend: {
          display: !isSidebar,
          position: "right",
          labels: { font: { size: 11 }, padding: 14, usePointStyle: true, pointStyle: "rectRounded" },
          onClick: (evt, item) => { setFilter("f-cat", item.text); if (targetCanvas) closeChartModal(); }
        },
        tooltip: {
          backgroundColor: "rgba(33,33,33,0.92)",
          padding: 10, cornerRadius: 6, displayColors: true, boxPadding: 4,
          titleFont: { size: 12, weight: "600" }, bodyFont: { size: 12 },
          callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)} (${(ctx.raw/total*100).toFixed(1)}%)` }
        },
        datalabels: {
          display: isSidebar ? false : ctx => (ctx.dataset.data[ctx.dataIndex] / total * 100) >= 2,
          color: "#2c2c2c",
          font: { size: targetCanvas ? 13 : 9, weight: "bold" },
          textShadow: "0 1px 2px rgba(255,255,255,.6)",
          formatter: (value) => {
            const pct = (value / total * 100).toFixed(1) + "%";
            return targetCanvas ? fmt(value) + "\n" + pct : pct;
          }
        }
      },
      cutout: isSidebar ? "72%" : "60%"
    }
  });
  if (!targetCanvas) chartCat = instance;
  return instance;
}

function renderChartTipo(targetCanvas) {
  const el = targetCanvas || document.getElementById("chart-tipo");
  const counts = countBy(filtered, "tipo");
  const _tot = filtered.length;
  const _min = _tot > 500 ? Math.ceil(_tot * 0.004) : 1;
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).filter(e=>e[1]>=_min).slice(0,12);
  const labels = sorted.map(e=>e[0]);
  const values = sorted.map(e=>e[1]);
  const activeTipo = document.getElementById("f-tipo").value;

  // --- SIDEBAR: rank list ---
  if (!targetCanvas) {
    const items = labels.map((l, i) => ({
      label: l,
      value: values[i],
      active: activeTipo === l,
      dim: activeTipo && activeTipo !== l,
      onClick: () => setFilter("f-tipo", l)
    }));
    renderRankList(el, items, {
      color: "var(--primary-dark)",
      header: { title: "Top Tipi (" + items.length + ")", icon: "fa-solid fa-arrow-trend-up" }
    });
    return null;
  }

  // --- MODAL: Chart.js ---
  const colors = labels.map((l, i) => {
    const base = CHART_COLORS[i % CHART_COLORS.length];
    return (!activeTipo || l === activeTipo) ? base : hexToRgba(base, 0.2);
  });
  if (!targetCanvas && chartTipo) chartTipo.destroy();
  const instance = new Chart(el, {
    type: "bar",
    plugins: [ChartDataLabels],
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 0 }] },
    options: {
      ...(targetCanvas && { responsive: true, maintainAspectRatio: false }),
      layout: { padding: { right: targetCanvas ? 55 : 38 } },
      indexAxis: "y",
      onClick: (evt, elements) => {
        if (!elements.length) return;
        setFilter("f-tipo", labels[elements[0].index]);
        if (targetCanvas) closeChartModal();
      },
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => { const _t = filtered.length; return ` ${fmt(ctx.raw)} immobili · ${_t ? (ctx.raw/_t*100).toFixed(1) : 0}%`; } } },
        datalabels: {
          display: "auto",
          anchor: "end",
          align: "end",
          offset: 3,
          color: "#2c3e50",
          font: { size: targetCanvas ? 11 : 8, weight: "600" },
          formatter: value => fmt(value)
        }
      },
      scales: {
        x: { grid: { color: "#f0ebe5" }, ticks: { font: { size: 10 } } },
        y: { ticks: { font: { size: 10 } } }
      }
    }
  });
  if (!targetCanvas) chartTipo = instance;
  return instance;
}

function renderChartCirc(targetCanvas) {
  const el = targetCanvas || document.getElementById("chart-circ");
  const counts = countBy(filtered, "circoscrizione");
  const sorted = Object.entries(counts).sort((a,b)=>a[0].localeCompare(b[0]));
  const keys   = sorted.map(e => e[0]);
  const labels = sorted.map(e => "Circ. " + e[0]);
  const values = sorted.map(e => e[1]);
  const activeCirc = document.getElementById("f-circ").value;
  const BASE_CIRC = "#9ebac4";

  // --- SIDEBAR: rank list ---
  if (!targetCanvas) {
    // Ordino per valore decrescente nella classifica
    const ranked = keys.map((k, i) => ({ key: k, label: labels[i], value: values[i] }))
                       .sort((a, b) => b.value - a.value);
    const NA_KEY = "(n.d.)";
    const NA_COLOR = "#b8b1a3"; // grigio caldo per dati non mappati
    const items = ranked.map(r => ({
      label: r.label,
      value: r.value,
      color: r.key === NA_KEY ? NA_COLOR : undefined,
      active: activeCirc === r.key,
      dim: activeCirc && activeCirc !== r.key,
      onClick: () => setFilter("f-circ", r.key),
      title: r.key === NA_KEY
        ? "Non mappato: " + fmt(r.value) + " immobili senza riferimento territoriale"
        : r.label + ": " + fmt(r.value) + " immobili"
    }));
    renderRankList(el, items, {
      color: "#5b8294",
      header: { title: "Circoscrizioni", icon: "fa-solid fa-map-location-dot" }
    });
    return null;
  }

  // --- MODAL: Chart.js ---
  const NA_KEY_M = "(n.d.)";
  const NA_COLOR_M = "#b8b1a3";
  const colors = keys.map((k) => {
    const base = k === NA_KEY_M ? NA_COLOR_M : BASE_CIRC;
    return (!activeCirc || k === activeCirc) ? base : hexToRgba(base, 0.2);
  });
  if (!targetCanvas && chartCirc) chartCirc.destroy();
  const instance = new Chart(el, {
    type: "bar",
    plugins: [ChartDataLabels],
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 0 }] },
    options: {
      ...(targetCanvas && { responsive: true, maintainAspectRatio: false }),
      layout: { padding: { top: targetCanvas ? 28 : 18 } },
      onClick: (evt, elements) => {
        if (!elements.length) return;
        setFilter("f-circ", keys[elements[0].index]);
        if (targetCanvas) closeChartModal();
      },
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => { const _t = filtered.length; return ` ${fmt(ctx.raw)} immobili · ${_t ? (ctx.raw/_t*100).toFixed(1) : 0}%`; } } },
        datalabels: {
          display: "auto",
          anchor: "end",
          align: "end",
          offset: 2,
          color: "#2c3e50",
          font: { size: targetCanvas ? 12 : 9, weight: "600" },
          formatter: value => fmt(value)
        }
      },
      scales: {
        y: { grid: { color: "#f0ebe5" }, ticks: { font: { size: 11 } } },
        x: { ticks: { font: { size: 11 } } }
      }
    }
  });
  if (!targetCanvas) chartCirc = instance;
  return instance;
}

function renderChartQuart(targetCanvas) {
  const el = targetCanvas || document.getElementById("chart-quart");
  const counts = countBy(filtered, "quartiere");
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const labels = sorted.map(e=>e[0]);
  const values = sorted.map(e=>e[1]);
  const activeQuart = document.getElementById("f-quart").value;
  const BASE_QUART = "#d66b58";

  // --- SIDEBAR: rank list ---
  if (!targetCanvas) {
    const top = labels.slice(0, 15);
    const items = top.map((l, i) => ({
      label: l,
      value: values[i],
      active: activeQuart === l,
      dim: activeQuart && activeQuart !== l,
      onClick: () => setFilter("f-quart", l)
    }));
    renderRankList(el, items, {
      color: BASE_QUART,
      header: { title: "Top " + items.length + " Quartieri", icon: "fa-solid fa-arrow-trend-up" }
    });
    return null;
  }

  // --- MODAL: Chart.js ---
  const colors = labels.map((l) => {
    return (!activeQuart || l === activeQuart) ? BASE_QUART : hexToRgba(BASE_QUART, 0.2);
  });
  if (!targetCanvas && chartQuart) chartQuart.destroy();
  const instance = new Chart(el, {
    type: "bar",
    plugins: [ChartDataLabels],
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 0 }] },
    options: {
      ...(targetCanvas && { responsive: true, maintainAspectRatio: false }),
      layout: { padding: { right: targetCanvas ? 55 : 38 } },
      indexAxis: "y",
      onClick: (evt, elements) => {
        if (!elements.length) return;
        setFilter("f-quart", labels[elements[0].index]);
        if (targetCanvas) closeChartModal();
      },
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => { const _t = filtered.length; return ` ${fmt(ctx.raw)} immobili · ${_t ? (ctx.raw/_t*100).toFixed(1) : 0}%`; } } },
        datalabels: {
          display: "auto",
          anchor: "end",
          align: "end",
          offset: 3,
          color: "#2c3e50",
          font: { size: targetCanvas ? 11 : 8, weight: "600" },
          formatter: value => fmt(value)
        }
      },
      scales: {
        x: { grid: { color: "#f0ebe5" }, ticks: { font: { size: 9 } } },
        y: { ticks: { font: { size: 9 } } }
      }
    }
  });
  if (!targetCanvas) chartQuart = instance;
  return instance;
}

function renderChartCatCirc(targetCanvas) {
  const el = targetCanvas || document.getElementById("chart-catcirc");
  if (!el) return;
  const circs = [...new Set(filtered.map(d => d.circoscrizione).filter(Boolean))].sort((a, b) => {
    const order = ["n.d.","I","II","III","IV","V","VI","VII","VIII"];
    return order.indexOf(a) - order.indexOf(b);
  });
  const cats = Object.keys(CAT_COLORS);

  // --- SIDEBAR: rank list stacked ---
  if (!targetCanvas) {
    const activeCirc = document.getElementById("f-circ").value;
    const rows = circs.map(circ => {
      const segments = cats.map(cat => ({
        label: cat,
        color: CAT_COLORS[cat],
        value: filtered.filter(d => d.circoscrizione === circ && d.categoria === cat).length
      }));
      const total = segments.reduce((a, s) => a + s.value, 0);
      return { circ, total, segments };
    }).sort((a, b) => b.total - a.total);

    const items = rows.map(r => ({
      label: r.circ === "n.d." ? "Circoscrizione n.d. (non mappato)" : "Circoscrizione " + r.circ,
      value: r.total,
      segments: r.segments,
      color: r.circ === "n.d." ? "#b8b1a3" : undefined,
      active: activeCirc === r.circ,
      dim: activeCirc && activeCirc !== r.circ,
      onClick: () => setFilter("f-circ", r.circ),
      title: r.circ === "n.d."
        ? "Non mappato: " + fmt(r.total) + " immobili senza riferimento territoriale"
        : "Circ. " + r.circ + ": " + fmt(r.total) + " immobili"
    }));

    renderRankList(el, items, {
      color: "#7c6a5e",
      header: { title: "Circoscrizioni per categoria", icon: "fa-solid fa-layer-group" },
      legend: cats.map(c => ({ label: c, color: CAT_COLORS[c] }))
    });
    return null;
  }

  // --- MODAL: Chart.js stacked ---
  const datasets = cats.map(cat => ({
    label: cat,
    data: circs.map(circ => filtered.filter(d => d.circoscrizione === circ && d.categoria === cat).length),
    backgroundColor: CAT_COLORS[cat],
    borderRadius: 0,
    borderSkipped: false
  }));
  if (!targetCanvas && chartCatCirc) chartCatCirc.destroy();
  const instance = new Chart(el, {
    type: "bar",
    plugins: [ChartDataLabels],
    data: { labels: circs.map(c => "Circ. " + c), datasets },
    options: {
      ...(targetCanvas && { responsive: true, maintainAspectRatio: false }),
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#2c2c2c", font: { size: targetCanvas ? 11 : 9 }, boxWidth: 10, padding: 6 }
        },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } },
        datalabels: { display: false }
      },
      scales: {
        x: { stacked: true, ticks: { font: { size: targetCanvas ? 11 : 9 } } },
        y: { stacked: true, grid: { color: "#f0ebe5" }, ticks: { font: { size: targetCanvas ? 11 : 9 } } }
      }
    }
  });
  if (!targetCanvas) chartCatCirc = instance;
  return instance;
}

// ─── MODAL GRAFICO ────────────────────────────────────────────────────────────
let modalChart = null;
const CHART_MODAL_TITLES = {
  cat: 'Per Categoria', tipo: 'Top Tipi', circ: 'Per Circoscrizione', quart: 'Per Quartiere', catcirc: 'Categoria × Circoscrizione'
};

function openChartModal(type) {
  if (modalChart) { modalChart.destroy(); modalChart = null; }
  const overlay = document.getElementById('chart-modal-overlay');
  document.getElementById('chart-modal-title').textContent = CHART_MODAL_TITLES[type] || type;
  overlay.classList.add('open');
  const canvas = document.getElementById('modal-canvas');
  // Due rAF: prima il browser misura il container, poi Chart.js disegna
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if      (type === 'cat')     modalChart = renderChartCat(canvas);
    else if (type === 'tipo')    modalChart = renderChartTipo(canvas);
    else if (type === 'circ')    modalChart = renderChartCirc(canvas);
    else if (type === 'quart')   modalChart = renderChartQuart(canvas);
    else if (type === 'catcirc') modalChart = renderChartCatCirc(canvas);
  }));
}

function closeChartModal() {
  if (modalChart) { modalChart.destroy(); modalChart = null; }
  document.getElementById('chart-modal-overlay').classList.remove('open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeChartModal(); });

// ─── TABELLA ──────────────────────────────────────────────────────────────────
function onSearch() {
  searchStr = document.getElementById("search-input").value.toLowerCase();
  currentPage = 1;
  applySearchAndSort();
}

function applySearchAndSort() {
  let data = [...filtered];
  if (searchStr) {
    data = data.filter(d =>
      (d.indirizzo||"").toLowerCase().includes(searchStr) ||
      (d.tipo||"").toLowerCase().includes(searchStr) ||
      (d.subtipo||"").toLowerCase().includes(searchStr) ||
      (d.upl||"").toLowerCase().includes(searchStr) ||
      (d.quartiere||"").toLowerCase().includes(searchStr) ||
      (d.categoria||"").toLowerCase().includes(searchStr)
    );
  }
  if (sortField) {
    data.sort((a,b) => {
      const av = (a[sortField]||"").toLowerCase();
      const bv = (b[sortField]||"").toLowerCase();
      return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });
  }
  tableData = data;
  renderTable();
}

function sortTable(field) {
  document.querySelectorAll(".sort-icon").forEach(el => el.innerHTML = '<i class="fa-solid fa-sort"></i>');
  if (sortField === field) { sortDir *= -1; }
  else { sortField = field; sortDir = 1; }
  document.getElementById("sort-" + field).innerHTML = sortDir === 1
    ? '<i class="fa-solid fa-sort-up"></i>'
    : '<i class="fa-solid fa-sort-down"></i>';
  currentPage = 1;
  applySearchAndSort();
}

function onPageSizeChange() {
  pageSize = parseInt(document.getElementById("page-size").value);
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("table-body");
  const total = tableData.length;
  const start = (currentPage-1)*pageSize;
  const end = Math.min(start+pageSize, total);
  const page = tableData.slice(start, end);

  document.getElementById("table-info").textContent = `${fmt(start+1)}–${fmt(end)} di ${fmt(total)} immobili`;

  tbody.innerHTML = page.map(d => {
    const badge = CAT_BADGE[d.categoria] || "badge-other";
    const isSelected = selectedIds.has(d.id);
    return `<tr data-id="${d.id}" class="${isSelected ? 'row-selected' : ''}">
      <td class="td-check"><input type="checkbox" class="row-cb" ${isSelected ? 'checked' : ''} onchange="toggleRow(${d.id})"></td>
      <td style="text-align:center;font-size:0.78rem;color:#888;font-variant-numeric:tabular-nums">${d.id}</td>
      <td class="td-cat"><span class="badge ${badge}">${d.categoria||"–"}</span></td>
      <td>${d.tipo||"–"}</td>
      <td style="font-size:0.8rem;color:#666">${d.subtipo||"–"}</td>
      <td>${d.indirizzo||"–"}</td>
      <td style="font-size:0.8rem;text-align:center">${d.civico||"–"}</td>
      <td style="font-size:0.8rem;text-align:center">${d.foglio||"–"}</td>
      <td style="font-size:0.8rem;text-align:center">${d.plla||"–"}</td>
      <td style="font-size:0.8rem;text-align:center">${d.sub||"–"}</td>
      <td style="font-size:0.8rem">${d.upl||"–"}</td>
      <td style="font-size:0.8rem">${d.quartiere||"–"}</td>
      <td style="text-align:center;font-weight:700;color:var(--primary)">${d.circoscrizione||"–"}</td>
    </tr>`;
  }).join("");

  renderPagination(total);
  updateHeaderCheckbox();
  updateSelectionInfo();
}

// ─── SELEZIONE RIGHE ─────────────────────────────────────────────────────────
function toggleRow(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    row.classList.toggle('row-selected', selectedIds.has(id));
    const cb = row.querySelector('.row-cb');
    if (cb) cb.checked = selectedIds.has(id);
  }
  updateHeaderCheckbox();
  updateSelectionInfo();
}

function toggleAll(checked) {
  if (checked) tableData.forEach(d => selectedIds.add(d.id));
  else tableData.forEach(d => selectedIds.delete(d.id));
  renderTable();
}

function updateHeaderCheckbox() {
  const cb = document.getElementById('check-all');
  if (!cb) return;
  const pageStart = (currentPage-1)*pageSize;
  const pageEnd = Math.min(pageStart+pageSize, tableData.length);
  const pageRows = tableData.slice(pageStart, pageEnd);
  if (pageRows.length === 0) { cb.checked = false; cb.indeterminate = false; return; }
  const allSel = pageRows.every(d => selectedIds.has(d.id));
  const someSel = pageRows.some(d => selectedIds.has(d.id));
  cb.checked = allSel;
  cb.indeterminate = !allSel && someSel;
}

function updateSelectionInfo() {
  const el = document.getElementById('selection-count');
  if (el) el.textContent = selectedIds.size > 0 ? `${fmt(selectedIds.size)} selezionati` : '';
  const btn = document.getElementById('btn-save-json');
  if (btn) btn.disabled = selectedIds.size === 0;
}

function saveSelectionJSON() {
  if (selectedIds.size === 0) return;
  const data = RAW_DATA.filter(d => selectedIds.has(d.id));
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'immobili_selezionati.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderPagination(total) {
  const pages = Math.ceil(total/pageSize);
  const pag = document.getElementById("pagination");
  if (pages <= 1) { pag.innerHTML = ""; return; }

  let html = `<button onclick="goPage(1)" ${currentPage===1?"disabled":""}>«</button>`;
  html += `<button onclick="goPage(${currentPage-1})" ${currentPage===1?"disabled":""}>‹</button>`;

  let start = Math.max(1, currentPage-3), end = Math.min(pages, currentPage+3);
  if (start > 1) html += `<span>…</span>`;
  for (let i=start; i<=end; i++) {
    html += `<button onclick="goPage(${i})" class="${i===currentPage?"active":""}">${i}</button>`;
  }
  if (end < pages) html += `<span>…</span>`;

  html += `<button onclick="goPage(${currentPage+1})" ${currentPage===pages?"disabled":""}>›</button>`;
  html += `<button onclick="goPage(${pages})" ${currentPage===pages?"disabled":""}>»</button>`;
  pag.innerHTML = html;
}

function goPage(p) { currentPage = p; renderTable(); window.scrollTo(0,0); }

// ─── MAPPA ────────────────────────────────────────────────────────────────────
const PALERMO_BOUNDS = L.latLngBounds([37.94, 13.10], [38.29, 13.62]);

// ─── MAP TOOLBAR ──────────────────────────────────────────────────────────────
let _mapSearchResults = [];

function initMapToolbar() {
  const toolbar = document.getElementById('map-toolbar');
  const searchPopup = document.getElementById('map-search-popup');
  if (!toolbar) return;

  L.DomEvent.disableClickPropagation(toolbar);
  L.DomEvent.disableScrollPropagation(toolbar);
  if (searchPopup) {
    L.DomEvent.disableClickPropagation(searchPopup);
    L.DomEvent.disableScrollPropagation(searchPopup);
  }

  document.getElementById('mtb-home').addEventListener('click', () => map.setView([38.115, 13.362], 12));

  const btnBase   = document.getElementById('mtb-base');
  const btnSat    = document.getElementById('mtb-sat');
  const btnMarker = document.getElementById('mtb-marker');
  const btnPoly   = document.getElementById('mtb-poly');
  const btnSearch = document.getElementById('mtb-search');

  btnBase.addEventListener('click', () => {
    if (btnBase.classList.contains('mtb-active')) return;
    map.removeLayer(satelliteLayer);
    osmLayer.addTo(map);
    btnBase.classList.add('mtb-active');
    btnSat.classList.remove('mtb-active');
  });

  btnSat.addEventListener('click', () => {
    if (btnSat.classList.contains('mtb-active')) return;
    map.removeLayer(osmLayer);
    satelliteLayer.addTo(map);
    btnSat.classList.add('mtb-active');
    btnBase.classList.remove('mtb-active');
  });

  btnMarker.addEventListener('click', () => {
    if (btnMarker.classList.contains('mtb-active')) return;
    switchToPoints();
    btnMarker.classList.add('mtb-active');
    btnPoly.classList.remove('mtb-active');
    updatePolyHint();
  });

  btnPoly.addEventListener('click', () => {
    if (btnPoly.classList.contains('mtb-active')) return;
    switchToPolygons();
    btnPoly.classList.add('mtb-active');
    btnMarker.classList.remove('mtb-active');
    updatePolyHint();
  });

  btnSearch.addEventListener('click', () => {
    searchPopup.classList.toggle('open');
    if (searchPopup.classList.contains('open'))
      document.getElementById('msp-foglio').focus();
  });

  map.on('click',   () => searchPopup && searchPopup.classList.remove('open'));
  map.on('zoomend', updatePolyHint);
  updatePolyHint();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') searchPopup && searchPopup.classList.remove('open');
  });
}

function updatePolyHint() {
  const hint = document.getElementById('map-poly-hint');
  const fill = document.getElementById('poly-hint-fill');
  const text = document.getElementById('poly-hint-text');
  if (!hint) return;

  const zoom = map.getZoom();
  const MIN_Z = 12, POLY_Z = 12, TARGET_Z = 18;
  const pct = Math.min(100, Math.max(0, (zoom - MIN_Z) / (TARGET_Z - MIN_Z) * 100));

  if (fill) fill.style.width = pct + '%';
  if (text) {
    if (usePolygons && zoom >= POLY_Z)   text.textContent = 'Particelle visibili';
    else if (zoom >= TARGET_Z)           text.textContent = 'Zoom massimo raggiunto';
    else                                 text.textContent = 'Zoom per le particelle';
  }

  hint.classList.add('visible');
}

function closeMapSearch() {
  const p = document.getElementById('map-search-popup');
  if (p) p.classList.remove('open');
}

function runMapSearch() {
  const foglio    = document.getElementById('msp-foglio').value.trim().toLowerCase();
  const plla      = document.getElementById('msp-plla').value.trim().toLowerCase();
  const indirizzo = document.getElementById('msp-indirizzo').value.trim().toLowerCase();
  const civico    = document.getElementById('msp-civico').value.trim().toLowerCase();
  const el        = document.getElementById('msp-results');

  if (!foglio && !plla && !indirizzo && !civico) { el.innerHTML = ''; return; }

  _mapSearchResults = RAW_DATA.filter(d => {
    if (foglio    && !(d.foglio     ||'').toLowerCase().includes(foglio))    return false;
    if (plla      && !(d.plla       ||'').toLowerCase().includes(plla))      return false;
    if (indirizzo && !(d.indirizzo  ||'').toLowerCase().includes(indirizzo)) return false;
    if (civico    && !String(d.civico||'').toLowerCase().includes(civico))   return false;
    return true;
  });

  const MAX = 80;
  const shown = _mapSearchResults.slice(0, MAX);
  const extra = _mapSearchResults.length - MAX;

  if (!shown.length) {
    el.innerHTML = '<div class="msp-no-results"><i class="fa-solid fa-circle-xmark"></i> Nessun risultato</div>';
    return;
  }

  const countHtml = `<div class="msp-count">${_mapSearchResults.length} risultat${_mapSearchResults.length===1?'o':'i'}${extra>0?` · mostrati i primi ${MAX}`:''}${!shown[0].lat?' · alcuni senza coordinate':''}</div>`;
  const rowsHtml  = shown.map((d, i) => `
    <div class="msp-result-item" onclick="flyToResult(${i})">
      <div class="msp-result-title">
        <span class="msp-r-type">${d.tipo||'–'}</span>
        <span class="msp-r-cat">${d.categoria||''}</span>
      </div>
      <div class="msp-result-sub">
        ${d.foglio  ? `Fg.&nbsp;<b>${d.foglio}</b>` : ''}
        ${d.plla    ? `&nbsp;Part.&nbsp;<b>${d.plla}</b>` : ''}
        ${d.indirizzo ? `&nbsp;·&nbsp;${d.indirizzo}${d.civico?' '+d.civico:''}` : ''}
        ${!d.lat ? '&nbsp;<i class="fa-solid fa-location-crosshairs" style="opacity:.4" title="Senza coordinate"></i>' : ''}
      </div>
    </div>`).join('');

  el.innerHTML = countHtml + rowsHtml;
}

function flyToResult(idx) {
  const d = _mapSearchResults[idx];
  if (!d) return;
  closeMapSearch();
  if (!d.lat || !d.lon) return;

  if (usePolygons) {
    switchToPoints();
    document.getElementById('mtb-marker').classList.add('mtb-active');
    document.getElementById('mtb-poly').classList.remove('mtb-active');
    updatePolyHint();
  }

  map.flyTo([d.lat, d.lon], 18, { duration: 1.2 });

  setTimeout(() => {
    const color = CAT_COLORS[d.categoria] || '#7f8c8d';
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${color};border:3px solid #922b21;width:18px;height:18px;border-radius:50%;box-shadow:0 0 0 5px rgba(146,43,33,0.25),0 2px 8px rgba(0,0,0,0.4)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9]
    });
    const addr = d.indirizzo ? d.indirizzo + (d.civico ? ' ' + d.civico : '') : '–';
    const m = L.marker([d.lat, d.lon], { icon })
      .bindPopup(`<div class="poly-popup">${buildMarkerCard(d)}</div>`, { className: 'poly-leaflet-popup', maxWidth: 310 })
      .addTo(map)
      .openPopup();
    setTimeout(() => map.removeLayer(m), 9000);
  }, 1400);
}

function initMap() {
  if (map) return;
  map = L.map("map", {
    zoomControl: false,
    maxBounds: PALERMO_BOUNDS,
    maxBoundsViscosity: 1.0,
    minZoom: 12
  }).setView([38.115, 13.362], 12);

  osmLayer = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors © <a href='https://carto.com/attributions'>CARTO</a> By @opendatasicilia - @gbvitrano",
    maxZoom: 18
  });
  satelliteLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    attribution: "© Google Maps - By @opendatasicilia - @gbvitrano",
    maxZoom: 18
  });
  osmLayer.addTo(map);
  new L.Hash(map);

  // Pane dedicato per il layer PMTiles (sopra i tile, sotto i marker)
  const polyPane = map.createPane('polyPane');
  polyPane.style.zIndex = '300';

  initMapToolbar();

  const odsCtrl = L.control({ position: 'bottomright' });
  odsCtrl.onAdd = () => {
    const c = L.DomUtil.create('div', 'leaflet-control-ods');
    c.innerHTML = `<a href="https://opendatasicilia.it/" target="_blank" rel="noopener" title="Open Data Sicilia"><img src="immobili_pa//img/opendatasicilia.png" alt="Open Data Sicilia" title="Open Data Sicilia"></a>`;
    L.DomEvent.disableClickPropagation(c);
    return c;
  };
  odsCtrl.addTo(map);

  markerCluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
  map.addLayer(markerCluster);
  updateMap();
}

function updateMap() {
  if (!map) return;
  markerCluster.clearLayers();
  const geoData = filtered.filter(d => d.lat && d.lon);

  geoData.forEach(d => {
    const color = CAT_COLORS[d.categoria] || "#7f8c8d";
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
      iconSize: [10,10], iconAnchor: [5,5]
    });
    const _mkr = L.marker([d.lat, d.lon], { icon })
      .bindPopup(`<div class="poly-popup">${buildMarkerCard(d)}</div>`, { className: 'poly-leaflet-popup', maxWidth: 310 });
    _mkr.on('popupopen', function() {
      const _dot = this.getElement()?.querySelector('div');
      if (_dot) { _dot.classList.remove('marker-dot-pulse'); void _dot.offsetWidth; _dot.classList.add('marker-dot-pulse'); }
    });
    _mkr.addTo(markerCluster);
  });
}

function fitFilteredBounds() {
  if (!map) return;
  const hasFilter = ['f-circ','f-quart','f-upl','f-cat','f-tipo'].some(
    id => document.getElementById(id).value !== ''
  );
  if (!hasFilter) return;
  const pts = filtered.filter(d => d.lat && d.lon);
  if (!pts.length) return;
  const bounds = L.latLngBounds(pts.map(d => [d.lat, d.lon]));
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
}

// ─── PMTILES POLYGON LAYER ────────────────────────────────────────────────────
const PMTILES_URL = 'https://palermohub.github.io/PRG2004/immobili/immobili_comunali_2024.pmtiles';
const PMTILES_SOURCE_LAYER = 'immobili_comunali_2024';

function buildMaplibreStyle(filterExpr) {
  return {
    version: 8,
    sources: {
      immobili: {
        type: 'vector',
        url: 'pmtiles://' + PMTILES_URL
      }
    },
    layers: [
      {
        id: 'immobili-fill',
        type: 'fill',
        source: 'immobili',
        'source-layer': PMTILES_SOURCE_LAYER,
        ...(filterExpr ? { filter: filterExpr } : {}),
        paint: {
          'fill-color': [
            'match', ['get', 'CATEGORIA'],
            'Unità abitativa',     '#f4eabf',
            'Unità non abitativa', '#d66b58',
            'Edificio',            '#9ebac4',
            'Area',                '#9b9990',
            'Terreno',             '#b7f75e',
            '#bdc3c7'
          ],
          'fill-opacity': 0.72
        }
      },
      {
        id: 'immobili-outline',
        type: 'line',
        source: 'immobili',
        'source-layer': PMTILES_SOURCE_LAYER,
        ...(filterExpr ? { filter: filterExpr } : {}),
        paint: {
          'line-color': '#555',
          'line-width': 0.6,
          'line-opacity': 0.7
        }
      }
    ]
  };
}

function buildMaplibreFilter() {
  const circ  = document.getElementById("f-circ").value;
  const quart = document.getElementById("f-quart").value;
  const upl   = document.getElementById("f-upl").value;
  const cat   = document.getElementById("f-cat").value;
  const tipo  = document.getElementById("f-tipo").value;

  const conds = [];
  if (circ)  conds.push(['==', ['get', 'circoscrizione'], circ]);
  if (quart) conds.push(['==', ['get', 'Quartiere'],      quart]);
  if (upl)   conds.push(['==', ['get', 'UPL_nome'],       upl]);
  if (cat)   conds.push(['==', ['get', 'CATEGORIA'],      cat]);
  if (tipo)  conds.push(['==', ['get', 'TIPO'],           tipo]);

  if (conds.length === 0) return null;
  if (conds.length === 1) return conds[0];
  return ['all', ...conds];
}

function buildPolyCard(p) {
  const cat   = p.CATEGORIA || '';
  const tipo  = p.TIPO || '–';
  const color = CAT_COLORS[cat] || '#7f8c8d';
  const badge = CAT_BADGE[cat]  || 'badge-other';

  const addr = [p.INDIRIZZO, p.NUMERO_CIVICO]
    .filter(v => v && v !== 'NULL' && String(v).trim())
    .join(' ') || null;

  const rows = [
    { lbl: 'Subtipo',    val: p.SUBTIPO },
    { lbl: 'Indirizzo',  val: addr },
    { lbl: 'Foglio',     val: p.FOGLIO },
    { lbl: 'Particella', val: p.PLLA },
    { lbl: 'Sub',        val: p.SUB },
    { lbl: 'UPL',            val: p.UPL_nome },
    { lbl: 'Quartiere',     val: p.Quartiere },
    { lbl: 'Circoscrizione', val: p.circoscrizione },
  ];

  const rowsHTML = rows
    .filter(r => r.val && r.val !== 'NULL' && String(r.val).trim() !== '')
    .map(r => `<div class="ic-row"><span class="ic-lbl">${r.lbl}</span><span class="ic-val">${r.val}</span></div>`)
    .join('');

  return `<div class="ic">
    <div class="ic-hdr" style="border-bottom-color:${color}">
      <span class="badge ${badge}" style="font-size:9px;padding:2px 6px;line-height:1.4">${cat || '–'}</span>
      <span class="ic-tipo">${tipo}</span>
    </div>
    <div class="ic-body">${rowsHTML}</div>
  </div>`;
}

function buildMarkerCard(d) {
  const cat   = d.categoria || '';
  const tipo  = d.tipo || '–';
  const color = CAT_COLORS[cat] || '#7f8c8d';
  const badge = CAT_BADGE[cat]  || 'badge-other';

  const addr = [d.indirizzo, d.civico]
    .filter(v => v && String(v).trim())
    .join(' ') || null;

  const rows = [
    { lbl: 'Subtipo',        val: d.subtipo },
    { lbl: 'Indirizzo',      val: addr },
    { lbl: 'Foglio',         val: d.foglio },
    { lbl: 'Particella',     val: d.plla },
    { lbl: 'UPL',            val: d.upl },
    { lbl: 'Quartiere',      val: d.quartiere },
    { lbl: 'Circoscrizione', val: d.circoscrizione },
  ];

  const rowsHTML = rows
    .filter(r => r.val && String(r.val).trim() !== '')
    .map(r => `<div class="ic-row"><span class="ic-lbl">${r.lbl}</span><span class="ic-val">${r.val}</span></div>`)
    .join('');

  return `<div class="ic">
    <div class="ic-hdr" style="border-bottom-color:${color}">
      <span class="badge ${badge}" style="font-size:9px;padding:2px 6px;line-height:1.4">${cat || '–'}</span>
      <span class="ic-tipo">${tipo}</span>
    </div>
    <div class="ic-body">${rowsHTML}</div>
  </div>`;
}

function initPolyLayer() {
  if (polyLayer) return;

  // Register pmtiles:// protocol once
  if (!maplibregl._pmtilesRegistered) {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    maplibregl._pmtilesRegistered = true;
  }

  const filterExpr = buildMaplibreFilter();
  polyLayer = L.maplibreGL({
    style: buildMaplibreStyle(filterExpr),
    attribution: '© Comune di Palermo',
    pane: 'polyPane'
  });

  polyLayer.addTo(map);

  // Attendi glMap disponibile: solo per updatePolyFilter (eventi gestiti da Leaflet)
  const tryGetGlMap = () => {
    const gl = (polyLayer.getMaplibreMap && polyLayer.getMaplibreMap()) || polyLayer._glMap;
    if (!gl) { setTimeout(tryGetGlMap, 150); return; }
    glMap = gl;
    const applyWhenReady = () => updatePolyFilter();
    if (glMap.isStyleLoaded()) applyWhenReady();
    else glMap.once('load', applyWhenReady);
  };
  setTimeout(tryGetGlMap, 150);
}

function updatePolyFilter() {
  if (!usePolygons || !glMap) return;
  const filterExpr = buildMaplibreFilter();
  ['immobili-fill', 'immobili-outline'].forEach(layerId => {
    try {
      if (filterExpr) glMap.setFilter(layerId, filterExpr);
      else            glMap.setFilter(layerId, null);
    } catch(e) { /* layer not yet loaded */ }
  });
}

function _queryPolyFeatures(latlng) {
  if (!glMap) return [];
  // Converte coordinate geografiche → pixel canvas MapLibre
  const pt = glMap.project([latlng.lng, latlng.lat]);
  return glMap.queryRenderedFeatures(pt, { layers: ['immobili-fill'] });
}

function switchToPolygons() {
  usePolygons = true;
  initPolyLayer();
  markerCluster.remove();

  // Click via Leaflet: funziona indipendentemente dagli eventi MapLibre
  _polyClickFn = e => {
    if (!glMap) return;
    const features = _queryPolyFeatures(e.latlng);
    if (!features.length) return;

    const seen = new Set();
    const unique = features.filter(f => {
      const p = f.properties;
      const key = [p.CATEGORIA, p.TIPO, p.FOGLIO, p.PLLA, p.SUB, p.INDIRIZZO].join('|');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    const cards    = unique.map(f => buildPolyCard(f.properties)).join('');
    const countNote = unique.length > 1
      ? `<div class="ic-count"><i class="fa-solid fa-layer-group"></i> ${unique.length} immobili in questo punto</div>`
      : '';
    L.popup({ maxWidth: 310, className: 'poly-leaflet-popup' })
      .setLatLng(e.latlng)
      .setContent(`<div class="poly-popup">${cards}${countNote}</div>`)
      .openOn(map);
  };

  _polyMoveFn = e => {
    if (!glMap) return;
    const over = _queryPolyFeatures(e.latlng).length > 0;
    map.getContainer().style.cursor = over ? 'pointer' : '';
  };

  map.on('click',     _polyClickFn);
  map.on('mousemove', _polyMoveFn);
}

function switchToPoints() {
  usePolygons = false;
  if (_polyClickFn) { map.off('click',     _polyClickFn); _polyClickFn = null; }
  if (_polyMoveFn)  { map.off('mousemove', _polyMoveFn);  _polyMoveFn  = null; }
  map.getContainer().style.cursor = '';
  if (polyLayer) { polyLayer.remove(); polyLayer = null; glMap = null; }
  markerCluster.addTo(map);
}

// ─── MODAL INFO ───────────────────────────────────────────────────────────────
function openInfoModal() {
  document.getElementById('info-modal-overlay').classList.add('open');
}
function closeInfoModal() {
  document.getElementById('info-modal-overlay').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfoModal(); });

// ─── TABS ─────────────────────────────────────────────────────────────────────
function showTab(name, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  btn.classList.add("active");

  if (name === "mappa") {
    setTimeout(() => {
      initMap();
      if (map) map.invalidateSize();
      updateDashboard();
    }, 100);
  }
  if (name === "tabella") {
    applySearchAndSort();
  }

  const scrollBtn = document.getElementById('doc-scroll-top-btn');
  if (scrollBtn) scrollBtn.classList.remove('visible');
}

// ─── MAP SIDEBAR RESIZE ───────────────────────────────────────────────────────
function initResizeHandle() {
  const handle = document.getElementById("map-resize-handle");
  const sidebar = document.getElementById("map-stats-sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const layout = sidebar ? sidebar.closest(".map-layout") : null;
  if (!handle || !sidebar) return;

  let dragging = false, startX = 0, startW = 0, didDrag = false;
  let savedWidth = sidebar.offsetWidth;

  function updateToggleIcon() {
    if (!toggleBtn) return;
    const collapsed = sidebar.classList.contains("collapsed");
    toggleBtn.innerHTML = collapsed ? "&#x276F;" : "&#x276E;";
    const tip = document.getElementById("handle-tooltip");
    if (tip) {
      tip.innerHTML = collapsed
        ? "&#x276F;&nbsp; Clicca per aprire il pannello"
        : "&#x276E;&nbsp; Clicca per chiudere<br>&#x2194;&nbsp; Trascina per ridimensionare";
    }
  }

  function toggleSidebar() {
    if (sidebar.classList.contains("collapsed")) {
      sidebar.classList.remove("collapsed");
      sidebar.style.width = savedWidth + "px";
      layout && layout.classList.remove("sidebar-is-collapsed");
    } else {
      savedWidth = sidebar.offsetWidth || savedWidth;
      sidebar.classList.add("collapsed");
      layout && layout.classList.add("sidebar-is-collapsed");
    }
    updateToggleIcon();
    setTimeout(() => { if (map) map.invalidateSize(); }, 270);
  }

  // Click sul pulsante toggle (non sul handle grezzo)
  toggleBtn && toggleBtn.addEventListener("click", e => {
    e.stopPropagation();
    toggleSidebar();
  });

  handle.addEventListener("mousedown", e => {
    if (e.target === toggleBtn) return;
    if (sidebar.classList.contains("collapsed")) { toggleSidebar(); return; }
    dragging = true; didDrag = false;
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    handle.classList.add("dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    const newW = Math.min(500, Math.max(180, startW + (startX - e.clientX)));
    if (Math.abs(e.clientX - startX) > 3) didDrag = true;
    sidebar.style.width = newW + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("dragging");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (didDrag) savedWidth = sidebar.offsetWidth;
    if (map) map.invalidateSize();
  });

  updateToggleIcon();

  // Mobile: parte collassata di default, max 220px all'apertura
  if (window.innerWidth <= 768) {
    savedWidth = 220;
    sidebar.classList.add("collapsed");
    layout && layout.classList.add("sidebar-is-collapsed");
    updateToggleIcon();
    setTimeout(() => { if (map) map.invalidateSize(); }, 50);
  }
}

/* ─── DRAW RECT FILTER ──────────────────────────────────────────────────────*/
function toggleDrawMode() {
  if (drawBounds || drawMode) { clearDrawFilter(); return; }
  drawMode = true;
  document.getElementById('mtb-draw').classList.add('mtb-active');
  map.getContainer().style.cursor = 'crosshair';
  map.dragging.disable();
  map.once('mousedown', onDrawMouseDown);
}
function onDrawMouseDown(e) {
  _drawStart = e.latlng;
  if (drawRect) { map.removeLayer(drawRect); drawRect = null; }
  drawRect = L.rectangle([_drawStart, _drawStart], {
    color:'#922b21', weight:2, fillOpacity:0.08, dashArray:'6 4'
  }).addTo(map);
  map.on('mousemove', onDrawMouseMove);
  document.addEventListener('mouseup', onDrawMouseUp, { once: true });
}
function onDrawMouseMove(e) {
  if (drawRect && _drawStart) drawRect.setBounds(L.latLngBounds(_drawStart, e.latlng));
}
function onDrawMouseUp() {
  map.off('mousemove', onDrawMouseMove);
  if (!drawRect) return;
  drawBounds = drawRect.getBounds();
  map.dragging.enable();
  map.getContainer().style.cursor = '';
  drawMode = false;
  applyFilters();
}
function clearDrawFilter() {
  drawMode = false; drawBounds = null; _drawStart = null;
  if (drawRect && map) { map.removeLayer(drawRect); drawRect = null; }
  if (map) { map.dragging.enable(); map.getContainer().style.cursor = ''; }
  document.getElementById('mtb-draw')?.classList.remove('mtb-active');
  applyFilters();
}

/* ─── CSV EXPORT ────────────────────────────────────────────────────────────*/
function saveSelectionCSV() {
  if (selectedIds.size === 0) return;
  const data = RAW_DATA.filter(d => selectedIds.has(d.id));
  const headers = ['id','categoria','tipo','subtipo','indirizzo','civico','foglio','plla','sub','upl','quartiere','circoscrizione'];
  const rows = data.map(d => headers.map(h => {
    const v = String(d[h] ?? '');
    return (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v.replace(/"/g,'""')}"` : v;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'immobili_selezionati.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ─── URL SHARING ───────────────────────────────────────────────────────────*/
function copyShareUrl() {
  const KEYS = { circ:'f-circ', quart:'f-quart', upl:'f-upl', cat:'f-cat', tipo:'f-tipo' };
  const params = new URLSearchParams();
  Object.entries(KEYS).forEach(([k,id]) => { const v = document.getElementById(id)?.value; if (v) params.set(k,v); });
  const url = location.origin + location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash;
  navigator.clipboard.writeText(url).then(() => showShareToast('🔗 Link copiato negli appunti'));
}
function showShareToast(msg) {
  let t = document.getElementById('share-toast');
  if (!t) { t = document.createElement('div'); t.id='share-toast'; t.className='share-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2600);
}
function loadFiltersFromUrl() {
  const KEYS = { circ:'f-circ', quart:'f-quart', upl:'f-upl', cat:'f-cat', tipo:'f-tipo' };
  const params = new URLSearchParams(location.search);
  let any = false;
  Object.entries(KEYS).forEach(([k,id]) => {
    if (params.has(k)) { const el = document.getElementById(id); if (el) { el.value = params.get(k); any = true; } }
  });
  if (any) onFilterChange();
}

/* ─── CHART EMPTY STATE ─────────────────────────────────────────────────────*/
function setChartEmptyState(canvasId, isEmpty) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const parent = canvas.parentElement;
  let empty = parent.querySelector('.chart-empty-state');
  if (isEmpty) {
    canvas.style.display = 'none';
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'chart-empty-state';
      empty.innerHTML = '<i class="fa-solid fa-chart-simple"></i><span>Nessun dato per la selezione</span>';
      parent.appendChild(empty);
    }
    empty.style.display = 'flex';
  } else {
    canvas.style.display = '';
    if (empty) empty.style.display = 'none';
  }
}
