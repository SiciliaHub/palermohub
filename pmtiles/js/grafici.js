import { state } from './state.js';
import { esc, iconSvg } from './ui.js';
import { loadLib } from './pdf.js';

const PAL = ['#e07b00', '#2f7fb8', '#3a9a5b', '#9b59b6', '#c0392b', '#7f8c8d', '#d4ac0d', '#16a085'];
const fmt = n => Math.round(n).toLocaleString('it-IT');
const pct = n => (n >= 10 ? n.toFixed(0) : n.toFixed(1)).replace('.', ',') + '%';

// barra impilata + legenda: items = [{ lbl, mq, pct }]
function stacked(items) {
    const bar = items.map((it, i) => `<span style="width:${Math.max(it.pct, 0.5)}%;background:${it.color || PAL[i % PAL.length]}" title="${esc(it.lbl)} ${pct(it.pct)}"></span>`).join('');
    const leg = items.map((it, i) => `<li><i style="background:${it.color || PAL[i % PAL.length]}"></i><span>${esc(it.lbl)}</span><b>${fmt(it.mq)} m² · ${pct(it.pct)}</b></li>`).join('');
    return `<div class="sc-stack" role="img" aria-label="Ripartizione">${bar}</div><ul class="sc-leg">${leg}</ul>`;
}

const sec = (title, icon, body, adv) => `<section class="sc-sec${adv ? ' sc-adv' : ''}"><h3>${iconSvg(icon)}${esc(title)}</h3>${body}</section>`;

// ---- indici di forma (sincrono, nessuna libreria) ----
// ponytail: proiezione equirettangolare locale, rettangolo minimo per scansione angoli a passo 2°
export function shapeSection(geom) {
    const ring = (geom.type === 'MultiPolygon' ? geom.coordinates[0] : geom.coordinates)[0];
    if (!ring || ring.length < 4) return '';
    const lat0 = ring[0][1] * Math.PI / 180, k = 111320;
    const pts = ring.map(([x, y]) => [x * k * Math.cos(lat0), y * k]);
    let per = 0, a2 = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        per += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        a2 += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
    }
    const area = Math.abs(a2) / 2;
    if (!area || !per) return '';
    let best = null;
    for (let d = 0; d < 90; d += 2) {
        const c = Math.cos(d * Math.PI / 180), s = Math.sin(d * Math.PI / 180);
        let x0 = 1e18, x1 = -1e18, y0 = 1e18, y1 = -1e18;
        pts.forEach(([x, y]) => { const u = x * c + y * s, v = -x * s + y * c; x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); });
        const w = x1 - x0, h = y1 - y0;
        if (!best || w * h < best.w * best.h) best = { w, h };
    }
    const lungo = Math.max(best.w, best.h), corto = Math.min(best.w, best.h);
    const comp = 4 * Math.PI * area / (per * per); // Polsby-Popper: 1 = cerchio
    const rapp = corto / lungo;
    const giudizio = rapp < 0.25 ? 'lotto stretto e allungato' : comp < 0.35 ? 'forma irregolare' : comp > 0.65 && rapp > 0.5 ? 'forma compatta' : 'forma regolare';
    const bar = v => `<span class="sc-meter"><i style="width:${Math.round(v * 100)}%"></i></span>`;
    return sec('Forma del lotto', 'draw-polygon', `
        <ul class="sc-leg sc-shape">
            <li><span>Compattezza</span>${bar(comp)}<b>${comp.toFixed(2).replace('.', ',')}</b></li>
            <li><span>Rapporto lati</span>${bar(rapp)}<b>${rapp.toFixed(2).replace('.', ',')}</b></li>
            <li><span>Perimetro</span><b>${fmt(per)} m</b></li>
            <li><span>Rettangolo minimo</span><b>${fmt(lungo)} × ${fmt(corto)} m</b></li>
        </ul>
        <p class="sc-src">Esito: ${giudizio}. Compattezza 1 = cerchio; rapporto lati 1 = quadrato.</p>`, true);
}

// ---- zone PRG e vincoli (async, turf) ----
const feat = g => ({ type: 'Feature', properties: {}, geometry: g });
const dedupeGeom = list => { const s = new Set(); return list.filter(f => { const k = JSON.stringify(f.geometry); return s.has(k) ? false : s.add(k); }); };

export const PLACEHOLDER = '<section class="sc-sec" id="sc-async"><h3>' + '</h3><p class="sc-src">Calcolo zone e vincoli…</p></section>';

export async function zoneVincoliSection(geom, selfId, sup_mq, zoneOmi) {
    const turf = await loadLib('turf');
    const m = state.map;
    const q = sl => (m.getSource('prg') ? dedupeGeom(m.querySourceFeatures('prg', { sourceLayer: sl })) : []);
    const part = feat(geom);
    const tot = turf.area(part);
    if (!tot) return '';
    const inter = (f, buf) => {
        try {
            let g = feat(f.geometry);
            if (buf) g = turf.buffer(g, buf, { units: 'meters' });
            const r = turf.intersect(part, g);
            return r ? turf.area(r) : 0;
        } catch { return 0; }
    };
    const somma = (feats, key, buf) => {
        const acc = {};
        feats.forEach(f => { const a = inter(f, buf); if (a > 0.5) acc[key(f.properties)] = (acc[key(f.properties)] || 0) + a; });
        return Object.entries(acc).sort((a, b) => b[1] - a[1]);
    };

    // zone PRG
    const zto = somma(q('zto'), p => (p.ZTO || '?') + (p.DESCRIZION ? ' – ' + p.DESCRIZION : ''));
    const ztoTot = zto.reduce((t, [, a]) => t + a, 0);
    const items = zto.map(([lbl, a]) => ({ lbl, mq: Math.min(a, tot), pct: Math.min(a / tot * 100, 100) }));
    if (tot - ztoTot > tot * 0.01) items.push({ lbl: 'Non zonizzata / n.d.', mq: tot - ztoTot, pct: (tot - ztoTot) / tot * 100, color: '#bdbdbd' });
    const zonaHtml = items.length ? sec('Ripartizione per zona PRG', 'map', stacked(items) + (zto.length > 1 ? '<p class="sc-src">La particella ricade in più zone.</p>' : ''), true) : '';

    // vincoli: areali + lineari (fascia 10 m dalla linea)
    // ponytail: buffer fisso 10 m sui lineari, la fascia reale dipende dal tipo di vincolo
    const va = somma(q('va'), p => p.tipo || 'Vincolo areale');
    const vl = somma(q('vl'), p => (p.TIPO || 'Vincolo lineare') + ' (fascia 10 m)', 10);
    const vinc = [...va, ...vl].sort((a, b) => b[1] - a[1]);
    let vincHtml;
    if (!vinc.length) {
        vincHtml = sec('Vincoli', 'shield', '<p class="sc-stato sc-ok">Particella non vincolata</p>');
    } else {
        // unione di tutti i vincoli per la quota libera (evita di sommare sovrapposizioni)
        let uni = null;
        try {
            [...q('va').map(f => feat(f.geometry)), ...q('vl').map(f => turf.buffer(feat(f.geometry), 10, { units: 'meters' }))].forEach(g => {
                const r = turf.intersect(part, g);
                if (r) uni = uni ? turf.union(uni, r) : r;
            });
        } catch { /* usa somma */ }
        const vincolata = Math.min(uni ? turf.area(uni) : vinc.reduce((t, [, a]) => t + a, 0), tot);
        const p = vincolata / tot * 100;
        const stato = p >= 99 ? 'interamente vincolata' : 'parzialmente vincolata';
        const righe = vinc.map(([lbl, a]) => {
            const v = Math.min(a / tot * 100, 100);
            return `<li class="sc-row"><span>${esc(lbl)}</span><b>${pct(v)}</b><span class="sc-meter"><i style="width:${v}%"></i></span></li>`;
        }).join('');
        vincHtml = sec('Quota vincolata', 'shield', `<p class="sc-stato sc-warn">Particella ${stato}: ${pct(p)}</p>
            <ul class="sc-leg sc-rows">${righe}</ul>
            <p class="sc-src">Libera da vincoli: ${fmt(tot - vincolata)} m² · ${pct(100 - p)}</p>`);
    }
    return (await distribuzioneSection(Number(sup_mq) || tot, selfId.split('/')[0], zto.map(([lbl]) => lbl.split(' – ')[0]), zoneOmi)) + zonaHtml + vincHtml + intornoSection(turf, part, selfId);
}

// ---- posizione nella distribuzione delle superfici (dati di analisi_particelle.json) ----
// ponytail: percentile per interpolazione lineare in log(m²) tra p5..p95 (fuori range: 2,5 / 97,5); citywide dall'istogramma
let analisiP;
const analisi = () => analisiP || (analisiP = fetch(new URL('../analisi_particelle.json', import.meta.url)).then(r => r.json()));
const PQ = [5, 25, 50, 75, 95];
function percentile(x, q) {
    const l = Math.log(x), k = q.map(Math.log);
    if (l <= k[0]) return 2.5;
    if (l >= k[4]) return 97.5;
    const i = k.findIndex((v, j) => l < k[j + 1]);
    return PQ[i] + (PQ[i + 1] - PQ[i]) * (l - k[i]) / (k[i + 1] - k[i]);
}
function percentileHist(x, { edges, n }) {
    const tot = n.reduce((a, b) => a + b, 0); let acc = 0;
    for (let i = 0; i < n.length; i++) {
        if (x >= edges[i + 1]) { acc += n[i]; continue; }
        return (acc + n[i] * Math.max(0, Math.log(x / edges[i]) / Math.log(edges[i + 1] / edges[i]))) / tot * 100;
    }
    return 100;
}
async function distribuzioneSection(mq, foglio, codiciZto = [], zoneOmi = []) {
    if (!(mq > 0)) return '';
    try {
        const d = await analisi();
        const f = d.fogli.find(r => String(r.f) === String(foglio));
        const riga = (lbl, p) => `<li class="sc-row"><span>${lbl}</span><b>più grande del ${Math.round(p)}%</b><span class="sc-meter"><i style="width:${p}%"></i></span></li>`;
        const righe = [
            f && riga(`Foglio ${esc(foglio)} (${f.n.toLocaleString('it-IT')} particelle, mediana ${fmt(f.q[2])} m²)`, percentile(mq, f.q)),
            ...codiciZto.filter(c => d.q_zto?.[c]).map(c => riga(`Zona PRG ${esc(c)} (${d.q_zto[c][0].toLocaleString('it-IT')} particelle, mediana ${fmt(d.q_zto[c][3])} m²)`, percentile(mq, d.q_zto[c].slice(1)))),
            ...zoneOmi.filter(z => d.q_omi?.[z]).map(z => riga(`Zona OMI ${esc(z)} (${d.q_omi[z][0].toLocaleString('it-IT')} particelle, mediana ${fmt(d.q_omi[z][3])} m²)`, percentile(mq, d.q_omi[z].slice(1)))),
            riga(`Tutta Palermo (mediana ${fmt(d.mediana)} m²)`, percentileHist(mq, d.hist))
        ].filter(Boolean).join('');
        return sec('Dimensione rispetto alle altre', 'table-cells', `<ul class="sc-leg sc-rows">${righe}</ul>
            <p class="sc-src">Percentile stimato sulle superfici del catasto (${esc(d.data_catasto)}).</p>`, true);
    } catch { return ''; }
}

// ---- intorno: confinanti, conteggi entro 100 m, distanza dal vincolo lineare ----
// ponytail: usa solo i tile gia' caricati (quelli fuori vista mancano); distanza misurata dal centroide
const R_INTORNO = 100;
function intornoSection(turf, part, selfId) {
    try {
        const m = state.map;
        const me = f => f.properties.Foglio + '/' + f.properties.Paricella;
        const cat = dedupeGeom(m.getSource('catasto') ? m.querySourceFeatures('catasto', { sourceLayer: 'particelle' }) : []);
        const ctr = turf.centroid(part);
        const zona = turf.buffer(part, R_INTORNO, { units: 'meters' });
        const tocco = turf.buffer(part, 0.5, { units: 'meters' });
        const vicine = new Map(), conf = new Map();
        cat.forEach(f => {
            try {
                const k = me(f);
                if (k === selfId) return;
                if (turf.booleanIntersects(f, zona)) vicine.set(k, 1);
                if (turf.booleanIntersects(f, tocco)) conf.set(k, 1);
            } catch { /* geometria non valida */ }
        });
        const civici = m.getSource('civici') ? dedupeGeom(m.querySourceFeatures('civici', { sourceLayer: 'civici_wgs84' })) : [];
        const nCiv = civici.filter(f => { try { return turf.booleanPointInPolygon(f.geometry, zona.geometry); } catch { return false; } }).length;
        let dist = null;
        dedupeGeom(m.getSource('prg') ? m.querySourceFeatures('prg', { sourceLayer: 'vl' }) : []).forEach(f => {
            try {
                const l = f.geometry.type === 'MultiLineString' ? turf.multiLineString(f.geometry.coordinates) : turf.lineString(f.geometry.coordinates);
                const d = turf.pointToLineDistance(ctr, l, { units: 'meters' });
                if (dist == null || d < dist.d) dist = { d, t: f.properties.TIPO || 'Vincolo lineare' };
            } catch { /* geometria non valida */ }
        });
        const ids = [...conf.keys()].sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b, 'it', { numeric: true }));
        return sec('Intorno', 'location-dot', `<ul class="sc-leg sc-rows">
            <li><span>Confinanti</span><b>${ids.length}</b></li>
            <li><span>Particelle entro ${R_INTORNO} m</span><b>${vicine.size}</b></li>
            <li><span>Civici entro ${R_INTORNO} m</span><b>${nCiv}</b></li>
            ${dist ? `<li><span>Vincolo lineare più vicino</span><b>${fmt(dist.d)} m</b></li>` : ''}</ul>
            ${ids.length ? `<p class="sc-src">Confinanti (foglio/particella): ${esc(ids.join(', '))}</p>` : ''}
            <p class="sc-src">Calcolo sulle tessere caricate in mappa${dist ? `; vincolo: ${esc(dist.t)}, distanza dal centro` : ''}.</p>`, true);
    } catch { return ''; }
}

// ---- OMI: grafico min-max per tipologia + rendimento lordo ----
export function omiChart(omiFeatures) {
    const num = v => { if (v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
    const rows = omiFeatures.map(f => {
        const p = f.properties;
        return { t: String(p.Descr_Tipologia ?? '').replace(/^'|'$/g, '').trim(), cmin: num(p.Compr_min), cmax: num(p.Compr_max), lmin: num(p.Loc_min), lmax: num(p.Loc_max) };
    }).filter(r => r.t && r.cmin != null && r.cmax != null);
    if (!rows.length) return '';
    const maxC = Math.max(...rows.map(r => r.cmax)), maxL = Math.max(0, ...rows.map(r => r.lmax ?? 0));
    const range = (a, b, max, c) => a == null || b == null ? '' :
        `<span class="sc-range"><i style="left:${a / max * 100}%;width:${Math.max((b - a) / max * 100, 1.5)}%;background:${c}"></i></span>`;
    const body = rows.map(r => {
        const y = r.lmin != null && r.lmax != null && r.cmin + r.cmax > 0 ? ((r.lmin + r.lmax) / 2 * 12) / ((r.cmin + r.cmax) / 2) * 100 : null;
        return `<div class="sc-omi">
            <div class="sc-omi-h"><span>${esc(r.t)}</span>${y != null ? `<b title="Rendimento lordo stimato (affitto annuo / valore, punti medi)">${pct(y)}</b>` : ''}</div>
            <div class="sc-omi-r"><em>Vendita</em>${range(r.cmin, r.cmax, maxC, PAL[1])}<small>${fmt(r.cmin)}–${fmt(r.cmax)} €/m²</small></div>
            ${r.lmin != null ? `<div class="sc-omi-r"><em>Affitto</em>${range(r.lmin, r.lmax, maxL, PAL[0])}<small>${r.lmin.toLocaleString('it-IT')}–${r.lmax.toLocaleString('it-IT')} €/m²·mese</small></div>` : ''}
        </div>`;
    }).join('');
    return `<div class="sc-omi-chart sc-adv">${body}<p class="sc-src">Rendimento lordo = affitto annuo / valore di vendita (punti medi dell'intervallo). Scale distinte per vendita e affitto.</p></div>`;
}
