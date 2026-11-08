// Modale "Analisi dei dati": caricato al primo clic. Dati precalcolati da tools/build_analisi_particelle.py.
// Grafici in SVG a mano, colori dai token CSS (.an-*), niente librerie.
import { searchParticella } from './search.js';

const NS = 'http://www.w3.org/2000/svg';
const it = n => Number(n).toLocaleString('it-IT');
const it1 = n => Number(n).toLocaleString('it-IT', { maximumFractionDigits: 1 });
const it2 = n => Number(n).toLocaleString('it-IT', { maximumFractionDigits: 3 });
const mq = a => a >= 1e4 ? it1(a / 1e4) + ' ha' : it(Math.round(a)) + ' m²';

let data = null;
let built = false;

function svg(w, h, label, ...kids) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', `0 0 ${w} ${h}`);
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', label);
    s.classList.add('an-svg');
    kids.forEach(k => s.append(k));
    return s;
}
function el(tag, attrs = {}, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
}
function tip(node, text) { node.append(el('title', {}, text)); return node; }
function html(tag, cls, inner) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (inner != null) e.innerHTML = inner;
    return e;
}

// ---- Superfici ---------------------------------------------------------
function histSuperfici() {
    const { edges, n } = data.hist, W = 720, H = 260, L = 52, B = 34, T = 10, R = 8;
    const max = Math.max(...n), bw = (W - L - R) / n.length;
    const g = [];
    for (let i = 0; i <= 4; i++) { // griglia orizzontale
        const v = max * i / 4, y = T + (H - T - B) * (1 - i / 4);
        g.push(el('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'an-grid' }), el('text', { x: L - 6, y: y + 4, class: 'an-tick', 'text-anchor': 'end' }, it(Math.round(v))));
    }
    n.forEach((c, i) => {
        const h = (H - T - B) * c / max;
        const r = el('rect', { x: L + i * bw + 1, y: H - B - h, width: bw - 2, height: Math.max(h, 0), class: 'an-bar' });
        g.push(tip(r, `${mq(edges[i])} – ${mq(edges[i + 1])}: ${it(c)} particelle`));
    });
    for (let d = 0; d <= 6; d++) { // un'etichetta per decade (4 classi per decade)
        const x = L + d * 4 * bw;
        g.push(el('text', { x, y: H - B + 16, class: 'an-tick', 'text-anchor': d === 6 ? 'end' : 'middle' }, mq(10 ** d)));
    }
    g.push(el('text', { x: W / 2, y: H - 2, class: 'an-axis', 'text-anchor': 'middle' }, 'Superficie della particella (scala logaritmica)'));
    const s = svg(W, H, `Istogramma delle superfici in scala logaritmica: mediana ${mq(data.mediana)}, 90° percentile ${mq(data.p90)}`, ...g);
    s.style.minWidth = '560px'; // su smartphone scorre invece di rimpicciolire il testo
    return s;
}

function boxplotFogli() {
    const f = data.fogli, bw = 7, L = 64, T = 10, B = 34, H = 300, W = L + f.length * bw + 8;
    const lo = Math.log10(Math.min(...f.map(x => x.q[0]))), hi = Math.log10(Math.max(...f.map(x => x.q[4])));
    const y = v => T + (H - T - B) * (1 - (Math.log10(v) - lo) / (hi - lo));
    const g = [];
    for (let d = Math.ceil(lo); d <= Math.floor(hi); d++) {
        g.push(el('line', { x1: L, x2: W, y1: y(10 ** d), y2: y(10 ** d), class: 'an-grid' }), el('text', { x: L - 6, y: y(10 ** d) + 4, class: 'an-tick', 'text-anchor': 'end' }, mq(10 ** d)));
    }
    f.forEach((r, i) => {
        const cx = L + i * bw + bw / 2, [p5, p25, p50, p75, p95] = r.q;
        const grp = el('g', { class: 'an-box' });
        grp.append(
            el('line', { x1: cx, x2: cx, y1: y(p95), y2: y(p5), class: 'an-whisker' }),
            el('rect', { x: cx - 2.5, y: y(p75), width: 5, height: Math.max(y(p25) - y(p75), 1), class: 'an-bar' }),
            el('line', { x1: cx - 3, x2: cx + 3, y1: y(p50), y2: y(p50), class: 'an-median' }));
        tip(grp, `Foglio ${r.f} (${it(r.n)} particelle) · mediana ${mq(p50)} · metà centrale ${mq(p25)}–${mq(p75)} · 5°–95° percentile ${mq(p5)}–${mq(p95)}`);
        g.push(grp);
        if (i % 10 === 0) g.push(el('text', { x: cx, y: H - B + 16, class: 'an-tick', 'text-anchor': 'middle' }, r.f));
    });
    g.push(el('text', { x: L, y: H - 2, class: 'an-axis' }, 'Foglio catastale · riga = 5°–95° percentile, riquadro = 25°–75°, tratto = mediana'));
    const s = svg(W, H, `Distribuzione delle superfici per foglio: ${f.length} fogli, mediane da ${mq(Math.min(...f.map(x => x.q[2])))} a ${mq(Math.max(...f.map(x => x.q[2])))}`, ...g);
    s.style.minWidth = W + 'px';
    return s;
}

// ---- Frammentazione ----------------------------------------------------
function esagoni(modo) {
    const s = data.hex_lato, rows = data.hex;
    const lat0 = 38.1, kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110574;
    const lon = rows.map(r => r[0]), lat = rows.map(r => r[1]);
    const x0 = Math.min(...lon), y1 = Math.max(...lat);
    const px = r => (r[0] - x0) * kx + s, py = r => (y1 - r[1]) * ky + s;
    const W = (Math.max(...lon) - x0) * kx + 2 * s, H = (y1 - Math.min(...lat)) * ky + 2 * s;
    const ha = r => Math.max(r[3], 0.01); // ettari arrotondati a 2 decimali nel JSON: evita 1/0
    const val = r => modo === 'dens' ? r[2] / ha(r) : r[2];
    const sorted = rows.map(val).sort((a, b) => a - b);
    const cuts = [0.2, 0.4, 0.6, 0.8].map(p => sorted[Math.floor(p * sorted.length)]);
    const cls = v => cuts.filter(c => v >= c).length;
    const pts = [0, 1, 2, 3, 4, 5].map(k => {
        const a = k * Math.PI / 3;
        return [s * Math.cos(a), s * Math.sin(a)];
    });
    const g = rows.map(r => {
        const x = px(r), y = py(r);
        const p = el('polygon', { points: pts.map(([a, b]) => `${(x + a).toFixed(0)},${(y + b).toFixed(0)}`).join(' '), class: `an-hex c${cls(val(r))}` });
        return tip(p, `${it(r[2])} particelle su ${it1(r[3])} ha: ${it1(r[2] / ha(r))} particelle/ha`);
    });
    const unit = modo === 'dens' ? 'particelle/ha' : 'particelle per cella';
    const leg = html('ul', 'an-legend');
    const bounds = [sorted[0], ...cuts, sorted[sorted.length - 1]];
    for (let k = 0; k < 5; k++) leg.append(html('li', null, `<i class="an-hex c${k}"></i>${it1(bounds[k])} – ${it1(bounds[k + 1])}`));
    const wrap = html('div');
    const sv = svg(W, H, `Griglia esagonale della frammentazione: ${unit}, ${rows.length} celle`, ...g);
    sv.classList.add('an-hexmap');
    wrap.append(sv, leg, html('p', 'an-note', `Colore = ${unit}, in 5 classi di pari numerosità. Esagoni di ${s * 2} m di diametro. La densità è calcolata sulla superficie effettivamente particellata della cella, così le celle di bordo o in zone senza particelle (mare, strade) non risultano rade.`));
    return wrap;
}

function tabellaFogli() {
    const top = data.fogli.filter(f => f.n >= 100).sort((a, b) => b.dens - a.dens).slice(0, 10);
    const max = top[0].dens;
    const ul = html('ol', 'an-rank');
    top.forEach(f => ul.append(html('li', null, `<span class="an-rk-n">Foglio ${f.f}</span><span class="an-rk-bar"><i style="width:${(100 * f.dens / max).toFixed(0)}%"></i></span><span class="an-rk-v">${it1(f.dens)} /ha <small>(${it(f.n)} part., ${it1(f.ha)} ha)</small></span>`)));
    return ul;
}

// ---- Forma -------------------------------------------------------------
function histCompatt() {
    const { edges, n } = data.hist_compatt, tot = n.reduce((a, b) => a + b, 0), W = 800, H = 250, L = 20, B = 40, T = 26;
    const bw = (W - L - 8) / n.length, max = Math.max(...n);
    const nomi = ['molto irreg.', 'irregolari', 'medie', 'compatte', 'molto comp.'];
    const g = [];
    n.forEach((c, i) => {
        const h = (H - T - B) * c / max;
        const r = el('rect', { x: L + i * bw + 4, y: H - B - h, width: bw - 8, height: h, class: 'an-bar' });
        g.push(tip(r, `Compattezza ${edges[i]}–${edges[i + 1]}: ${it(c)} particelle (${it1(100 * c / tot)}%)`),
            el('text', { x: L + i * bw + bw / 2, y: H - B - h - 5, class: 'an-tick', 'text-anchor': 'middle' }, it1(100 * c / tot) + '%'),
            el('text', { x: L + i * bw + bw / 2, y: H - B + 15, class: 'an-tick', 'text-anchor': 'middle' }, `${it1(edges[i])}–${it1(edges[i + 1])}`),
            el('text', { x: L + i * bw + bw / 2, y: H - B + 28, class: 'an-tick', 'text-anchor': 'middle' }, nomi[i]));
    });
    g.push(el('line', { x1: L, x2: W - 8, y1: H - B, y2: H - B, class: 'an-grid' }));
    return svg(W, H, `Istogramma della compattezza: mediana ${it2(data.compatt_mediana)}`, ...g);
}

function tabellaIrregolari() {
    const t = html('table', 'an-table');
    t.innerHTML = '<caption>I 40 lotti più irregolari (sopra ' + data.area_min_irregolari + ' m²)</caption><thead><tr><th scope="col">Particella</th><th scope="col" class="num">Superficie</th><th scope="col" class="num">Compattezza</th><th scope="col" class="num">Perim./area</th></tr></thead>';
    const tb = html('tbody');
    data.irregolari.forEach(r => {
        const tr = html('tr', null, `<td><button type="button" class="an-lotto" data-f="${r.f}" data-p="${r.p}" title="Mostra sulla mappa">F. ${r.f} · P. ${r.p}</button></td><td class="num">${mq(r.a)}</td><td class="num">${it2(r.c)}</td><td class="num">${it2(r.pa)} m⁻¹</td>`);
        tb.append(tr);
    });
    t.append(tb);
    return lottoClick(t);
}

// clic su una particella dell'elenco: chiude il modale e la mostra in mappa (vale per ogni tabella con .an-lotto)
function lottoClick(root) {
    root.addEventListener('click', e => {
        const b = e.target.closest('.an-lotto');
        if (!b) return;
        document.getElementById('analisi').close();
        document.getElementById('foglio').value = b.dataset.f;
        document.getElementById('particella').value = b.dataset.p;
        searchParticella();
    });
    return root;
}
const lotto = (f, p) => `<button type="button" class="an-lotto" data-f="${f}" data-p="${p}" title="Mostra sulla mappa">F. ${f} · P. ${p}</button>`;

// ---- Zonizzazione PRG --------------------------------------------------
const pct = (v, t) => it1(100 * v / t) + '%';

// barre orizzontali ordinate: righe {k (classe colore), l, v (valore), txt}
function barre(righe, cls = 'zone') {
    const max = Math.max(...righe.map(r => r.v)) || 1;
    const ul = html('ol', 'an-rank ' + cls);
    righe.forEach(r => ul.append(html('li', 'g-' + r.k, `<span class="an-rk-n">${r.l}</span><span class="an-rk-bar"><i style="width:${(100 * r.v / max).toFixed(1)}%"></i></span><span class="an-rk-v">${r.txt}</span>`)));
    return ul;
}

// treemap "squarified": items {v, ...} ordinati per v decrescente, riempie il rettangolo W×H
function squarify(items, W, H) {
    const tot = items.reduce((a, b) => a + b.v, 0), out = [];
    let x = 0, y = 0, w = W, h = H, rest = items.map(i => ({ ...i, a: i.v / tot * W * H }));
    const worst = (row, side) => {
        const s = row.reduce((a, b) => a + b.a, 0);
        return Math.max(...row.map(r => Math.max(side * side * r.a / (s * s), s * s / (side * side * r.a))));
    };
    while (rest.length) {
        const side = Math.min(w, h), row = [rest.shift()];
        while (rest.length && worst([...row, rest[0]], side) <= worst(row, side)) row.push(rest.shift());
        const s = row.reduce((a, b) => a + b.a, 0);
        if (w >= h) { // colonna a sinistra
            const cw = s / h; let yy = y;
            row.forEach(r => { out.push({ ...r, x, y: yy, w: cw, h: r.a / cw }); yy += r.a / cw; });
            x += cw; w -= cw;
        } else {
            const rh = s / w; let xx = x;
            row.forEach(r => { out.push({ ...r, x: xx, y, w: r.a / rh, h: rh }); xx += r.a / rh; });
            y += rh; h -= rh;
        }
    }
    return out;
}

function treemapZone() {
    const P = data.prg, W = 760, H = 420, tot = P.ha_netto;
    const items = P.codici.filter(c => c.ha > 0).sort((a, b) => b.ha - a.ha).map(c => ({ ...c, v: c.ha }));
    const g = squarify(items, W, H).map(r => {
        const grp = el('g', { class: 'g-' + r.g });
        grp.append(el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, class: 'an-fill an-tm' }));
        if (r.w > 38 && r.h > 18) grp.append(el('text', { x: r.x + 4, y: r.y + 14, class: 'an-tm-t' }, r.c + (r.w > 70 && r.h > 32 ? ' ' + pct(r.ha, tot) : '')));
        return tip(grp, `${r.c} · ${r.d}: ${it1(r.ha)} ha (${pct(r.ha, tot)}), ${it(r.n)} particelle`);
    });
    const s = svg(W, H, `Treemap della superficie per codice di zona: ${items.length} zone, ${it(Math.round(tot))} ettari`, ...g);
    s.style.minWidth = '560px';
    return s;
}

function legendaGruppi(righe, tot) {
    const ul = html('ul', 'an-legend');
    righe.forEach(r => ul.append(html('li', 'g-' + r.k, `<i class="an-sw" style="width:14px;height:14px;margin:0"></i>${r.l} <b>${pct(r.v, tot)}</b>`)));
    return ul;
}

function ciambellaZone(righe, tot, centro) {
    const R = 80, C = 2 * Math.PI * R, g = [];
    let off = 0;
    righe.forEach(r => {
        const len = C * r.v / tot;
        const c = el('circle', { cx: 110, cy: 110, r: R, fill: 'none', 'stroke-width': 36, 'stroke-dasharray': `${len} ${C - len}`, 'stroke-dashoffset': -off, transform: 'rotate(-90 110 110)', class: 'an-donut g-' + r.k, style: 'stroke:var(--c)' });
        off += len;
        g.push(tip(c, `${r.l}: ${r.txt} (${pct(r.v, tot)})`));
    });
    g.push(el('text', { x: 110, y: 112, class: 'an-donut-c', 'text-anchor': 'middle' }, centro[0]), el('text', { x: 110, y: 132, class: 'an-donut-s', 'text-anchor': 'middle' }, centro[1]));
    const s = svg(220, 220, `Ciambella della ripartizione: ${righe.map(r => `${r.l} ${pct(r.v, tot)}`).join(', ')}`, ...g);
    s.style.maxWidth = '260px'; s.style.margin = '0 auto';
    const w = html('div');
    w.append(s, legendaGruppi(righe, tot));
    return w;
}

// pulsanti a scelta singola che cambiano la vista dentro `box`
function viste(box, opzioni) {
    const seg = html('div', 'seg', opzioni.map((o, i) => `<button type="button" aria-pressed="${i === 0}" data-i="${i}">${o[0]}</button>`).join(''));
    const draw = i => { box.textContent = ''; box.append(opzioni[i][1]()); };
    seg.addEventListener('click', e => {
        const b = e.target.closest('button[data-i]');
        if (!b) return;
        seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        draw(+b.dataset.i);
    });
    draw(0);
    return seg;
}

function panelSuperficieZone() {
    const P = data.prg, righe = [...P.gruppi].sort((a, b) => b.ha - a.ha).map(g => ({ k: g.k, l: g.l, v: g.ha, txt: `${it1(g.ha)} ha · ${pct(g.ha, P.ha_netto)}` }));
    const box = html('div');
    const seg = viste(box, [['Barre', () => barre(righe)], ['Treemap', treemapZone], ['Ciambella', () => ciambellaZone(righe, P.ha_netto, [it(Math.round(P.ha_netto)), 'ettari zonizzati'])]]);
    const top = righe[0];
    return panel('an-zsup', 'an-tab-zsup',
        html('div', 'an-kpi', kpi(it(Math.round(P.ha_netto)) + ' ha', 'territorio zonizzato') + kpi(top.l.split(' · ')[0], `zona prevalente (${pct(top.v, P.ha_netto)})`) + kpi(it(P.codici.length), 'codici di zona')),
        fig('Superficie e quota per zona omogenea', `Le zone si sovrappongono in ${it(Math.round(P.ha_lordo - P.ha_netto))} ha (soprattutto il verde storico su A1 e F4): ogni metro quadro è contato una sola volta, con priorità a verde e attrezzature specifiche, poi alle zone A-E, per ultimo al verde storico. Nel treemap ogni riquadro è un codice di zona (B3, E1...), colorato per gruppo.`, seg, box));
}

function panelIntersezione() {
    const P = data.prg, tot = data.n, M = P.matrice, conZona = tot - P.senza_zona;
    const t = html('table', 'an-table');
    t.innerHTML = '<caption>Particelle e superficie per zona</caption><thead><tr><th scope="col">Zona</th><th scope="col" class="num">Particelle</th><th scope="col" class="num">Superficie particelle</th><th scope="col" class="num">% della zona</th></tr></thead>';
    const tb = html('tbody');
    [...P.gruppi].sort((a, b) => b.n - a.n).filter(g => g.n > 0).forEach(g => tb.append(html('tr', 'g-' + g.k, `<th scope="row"><i class="an-sw"></i>${g.l}</th><td class="num">${it(g.n)}</td><td class="num">${mq(g.mq)}</td><td class="num">${it1(100 * g.mq / (g.ha * 1e4))}%</td>`)));
    t.append(tb);
    const lab = k => P.gruppi.find(g => g.k === k).l.split(' · ')[0];
    let max = 1;
    M.m.forEach((r, i) => r.forEach((v, j) => { if (i !== j) max = Math.max(max, v); }));
    const mt = html('table', 'an-matrix');
    mt.innerHTML = '<caption class="an-note">Quante particelle ricadono insieme nelle due zone (riga e colonna); sulla diagonale, tutte le particelle della zona.</caption>';
    mt.querySelector('caption').style.captionSide = 'top';
    const th = html('thead'), hr = html('tr', null, '<td></td>');
    M.k.forEach(k => hr.append(html('th', 'g-' + k, lab(k))));
    hr.querySelectorAll('th').forEach(x => x.setAttribute('scope', 'col'));
    th.append(hr); mt.append(th);
    const mb = html('tbody');
    M.k.forEach((a, i) => {
        const tr = html('tr', null, `<th scope="row" class="g-${a}">${lab(a)}</th>`);
        M.m[i].forEach((v, j) => {
            const td = html('td', i === j ? 'diag' : v ? '' : 'zero', v ? it(v) : '·');
            if (i !== j) td.style.setProperty('--v', (Math.sqrt(v / max)).toFixed(2));
            td.title = i === j ? `${lab(a)}: ${it(v)} particelle` : `${it(v)} particelle in ${lab(a)} e ${lab(M.k[j])}`;
            tr.append(td);
        });
        mb.append(tr);
    });
    mt.append(mb);
    const nz = P.n_zone, tz = nz[0] + nz[1] + nz[2];
    return panel('an-zint', 'an-tab-zint',
        html('div', 'an-kpi', kpi(it(conZona), 'particelle in zonizzazione') + kpi(it(Math.round(P.mq_in_zona / 1e4)) + ' ha', 'superficie particellata in zona') + kpi(it(P.senza_zona), 'particelle fuori PRG')),
        fig('Particelle × zone', `Una particella conta in una zona se vi ricade per almeno il ${P.soglia_pct}% della sua superficie (e ${P.soglia_mq} m²): sotto, è uno scarto di bordo tra catasto e PRG. La superficie particellata è inferiore a quella della zona perché strade e acque non sono particelle.`, t),
        fig('Matrice di sovrapposizione', 'Le celle più scure indicano gruppi di zone che si incontrano spesso dentro la stessa particella.', mt),
        fig('Particelle in una o più zone', null, barre([{ k: 'B', l: 'In una zona', v: nz[0], txt: `${it(nz[0])} · ${pct(nz[0], tz)}` }, { k: 'C', l: 'In due zone', v: nz[1], txt: `${it(nz[1])} · ${pct(nz[1], tz)}` }, { k: 'E', l: 'In tre o più', v: nz[2], txt: `${it(nz[2])} · ${pct(nz[2], tz)}` }])));
}

function panelCavallo() {
    const P = data.prg, g = {};
    P.codici.forEach(c => { g[c.c] = c.g; });
    const t = html('table', 'an-table');
    t.innerHTML = `<caption>Le ${P.cavallo.length} particelle con la parte minore più estesa</caption><thead><tr><th scope="col">Particella</th><th scope="col" class="num">Superficie</th><th scope="col">Zone (quota della particella)</th><th scope="col" class="num">Parte minore</th></tr></thead>`;
    const tb = html('tbody');
    P.cavallo.forEach(r => tb.append(html('tr', null, `<td>${lotto(r.f, r.p)}</td><td class="num">${mq(r.a)}</td><td>${r.z.map(([c, s]) => `<span class="an-chip g-${g[c]}">${c.replace(/_/g, " ")} ${it1(s)}%</span>`).join('')}</td><td class="num">${mq(r.m)}</td>`)));
    t.append(tb);
    return panel('an-zcav', 'an-tab-zcav',
        html('div', 'an-kpi', kpi(it(P.n_cavallo), 'particelle a cavallo') + kpi(pct(P.n_cavallo, data.n - P.senza_zona), 'delle particelle in zona')),
        fig('Particelle a cavallo di più zone', `Particelle che ricadono in almeno due gruppi di zona (A-F, verde e altri) con almeno il ${P.soglia_pct}% della superficie ciascuno: per queste l'istruttoria deve dire quale disciplina si applica a quale parte. Ordinate per estensione della parte minore. Clicca una particella per vederla in mappa.`, lottoClick(t)));
}

// ---- Vincoli -----------------------------------------------------------
function panelEstensioneVincoli() {
    const V = data.vincoli;
    const cat = [...V.cat].sort((a, b) => b.ha - a.ha).map(c => ({ k: c.k, l: c.l, v: c.ha, txt: `${it1(c.ha)} ha · ${it(c.n)} part.` }));
    const tipi = V.tipi.map(t => ({ k: t.k, l: t.t, v: t.ha, txt: `${it1(t.ha)} ha` }));
    const r = barre(tipi);
    r.classList.add('tipi');
    return panel('an-vest', 'an-tab-vest',
        html('div', 'an-kpi', kpi(it(V.n), 'particelle con almeno un vincolo') + kpi(pct(V.n, data.n), 'di tutte le particelle') + kpi(it(Math.round(V.ha_unione)) + ' ha', 'territorio vincolato')),
        fig('Estensione per categoria', 'Superficie coperta da ciascuna categoria di vincolo areale (sovrapposizioni contate una volta).', barre(cat)),
        fig('Estensione per tipo di vincolo', 'I vincoli si sovrappongono: la somma dei tipi supera il territorio vincolato. Il colore indica la categoria.', r));
}

function panelParticelleVincoli() {
    const V = data.vincoli, t = html('table', 'an-table');
    t.innerHTML = '<caption>Particelle interessate per tipo di vincolo</caption><thead><tr><th scope="col">Vincolo</th><th scope="col" class="num">Particelle</th><th scope="col" class="num">Superficie</th></tr></thead>';
    const tb = html('tbody');
    [...V.tipi].sort((a, b) => b.n - a.n).filter(x => x.n > 0).forEach(x => tb.append(html('tr', 'g-' + x.k, `<th scope="row"><i class="an-sw"></i>${x.t}</th><td class="num">${it(x.n)} · ${pct(x.n, data.n)}</td><td class="num">${mq(x.mq)} · ${pct(x.mq, data.ha * 1e4)}</td>`)));
    t.append(tb);
    const nv = V.n_vincoli, tot = nv.reduce((a, b) => a + b, 0), nomi = ['Nessun vincolo', '1 vincolo', '2 vincoli', '3 vincoli', '4 vincoli', '5 o più'];
    const hist = barre(nv.map((n, i) => ({ k: i ? 'pae' : 'P', l: nomi[i], v: n, txt: `${it(n)} · ${pct(n, tot)}` })));
    return panel('an-vint', 'an-tab-vint',
        fig('Quanti vincoli gravano su una particella', `Numero di tipi di vincolo diversi sovrapposti (almeno il ${data.prg.soglia_pct}% della particella).`, hist),
        fig('Particelle interessate', 'Quante particelle toccano ciascun tipo di vincolo e quanta superficie vi ricade.', t));
}

// Sankey zona (sinistra) -> categoria di vincolo (destra); larghezza = particelle in entrambe
function sankeyZonaVincolo() {
    const V = data.vincoli, P = data.prg, F = V.flusso, W = 720, X1 = 150, X2 = W - 190, GAP = 6, H = 380;
    const zl = k => P.gruppi.find(g => g.k === k).l, cl = k => V.cat.find(c => c.k === k).l;
    const tot = (idx) => { const m = {}; F.forEach(f => { m[f[idx]] = (m[f[idx]] || 0) + f[2]; }); return m; };
    const zt = tot(0), ct = tot(1), zk = Object.keys(zt).sort((a, b) => zt[b] - zt[a]), ck = Object.keys(ct).sort((a, b) => ct[b] - ct[a]);
    const sum = Object.values(zt).reduce((a, b) => a + b, 0);
    const sc = (H - GAP * Math.max(zk.length, ck.length)) / sum;
    const place = (keys, t) => { let y = 0; const o = {}; keys.forEach(k => { o[k] = { y, h: t[k] * sc, off: 0 }; y += t[k] * sc + GAP; }); return o; };
    const L = place(zk, zt), R = place(ck, ct), g = [];
    zk.forEach(z => ck.forEach(c => {
        const f = F.find(x => x[0] === z && x[1] === c); if (!f) return;
        const h = f[2] * sc, y1 = L[z].y + L[z].off + h / 2, y2 = R[c].y + R[c].off + h / 2, m = (X1 + X2) / 2;
        L[z].off += h; R[c].off += h;
        g.push(tip(el('path', { d: `M${X1} ${y1}C${m} ${y1} ${m} ${y2} ${X2} ${y2}`, fill: 'none', 'stroke-width': Math.max(h, .5), class: `an-flow g-${z}`, style: 'stroke:var(--c)' }), `${zl(z)} → ${cl(c)}: ${it(f[2])} particelle`));
    }));
    // ponytail: sotto 11px l'etichetta si sovrapporrebbe alle vicine: resta solo il tooltip
    zk.forEach(z => {
        g.push(tip(el('rect', { x: X1 - 8, y: L[z].y, width: 8, height: Math.max(L[z].h, 1), class: `g-${z}`, style: 'fill:var(--c)' }), `${zl(z)}: ${it(zt[z])} particelle`));
        if (L[z].h >= 11) g.push(el('text', { x: X1 - 14, y: L[z].y + L[z].h / 2 + 4, class: 'an-tick', 'text-anchor': 'end' }, zl(z).split(' · ')[0]));
    });
    ck.forEach(c => g.push(el('rect', { x: X2, y: R[c].y, width: 8, height: Math.max(R[c].h, 1), class: `g-${c}`, style: 'fill:var(--c)' }), el('text', { x: X2 + 14, y: R[c].y + R[c].h / 2 + 4, class: 'an-tick' }, cl(c))));
    const s = svg(W, H + GAP * 2, 'Diagramma di flusso: particelle per zona di PRG e categoria di vincolo', ...g);
    s.style.minWidth = '560px';
    return s;
}

function tabellaBuffer() {
    const V = data.vincoli, t = html('table', 'an-table');
    t.innerHTML = `<caption>Particelle entro una distanza dalla linea</caption><thead><tr><th scope="col">Tipo</th>${V.buffer_m.map(d => `<th scope="col" class="num">≤ ${d} m</th>`).join('')}</tr></thead>`;
    const tb = html('tbody');
    V.linee.forEach(l => tb.append(html('tr', null, `<th scope="row">${l.t}</th>${l.buf.map(n => `<td class="num">${it(n)} · ${pct(n, data.n)}</td>`).join('')}`)));
    t.append(tb);
    return t;
}

function panelPiuVincolate() {
    const V = data.vincoli, t = html('table', 'an-table');
    t.innerHTML = `<caption>Le ${V.piu_vincolate.length} particelle con più vincoli sovrapposti</caption><thead><tr><th scope="col">Particella</th><th scope="col" class="num">Superficie</th><th scope="col" class="num">Vincoli</th><th scope="col">Tipi</th></tr></thead>`;
    const tb = html('tbody');
    V.piu_vincolate.forEach(r => tb.append(html('tr', null, `<td>${lotto(r.f, r.p)}</td><td class="num">${mq(r.a)}</td><td class="num">${r.nv}</td><td><small>${r.t.join(' · ')}</small></td>`)));
    t.append(tb);
    const lin = html('table', 'an-table');
    lin.innerHTML = '<caption>Vincoli lineari</caption><thead><tr><th scope="col">Tipo</th><th scope="col" class="num">Lunghezza</th><th scope="col" class="num">Particelle attraversate</th></tr></thead>';
    const lb = html('tbody');
    V.linee.forEach(l => lb.append(html('tr', null, `<th scope="row">${l.t}</th><td class="num">${it1(l.km)} km</td><td class="num">${it(l.n)}</td>`)));
    lin.append(lb);
    return panel('an-vpiu', 'an-tab-vpiu',
        fig('Particelle più vincolate', 'Ordinate per numero di tipi di vincolo sovrapposti. Clicca una particella per vederla in mappa.', lottoClick(t)),
        fig('Vincoli lineari', 'Corsi d’acqua, faglie e regie trazzere: lunghezza e quante particelle attraversano.', lin),
        fig('Fasce di rispetto', 'Particelle che cadono entro una certa distanza dai vincoli lineari (buffer dalla linea): utile per stimare quanti lotti toccherebbe una fascia di rispetto.', tabellaBuffer()));
}

function panelFlusso() {
    return panel('an-vflu', 'an-tab-vflu',
        fig('Da zona di PRG a categoria di vincolo', `Larghezza = particelle che ricadono sia nella zona sia nella categoria (almeno ${data.prg.soglia_pct}% ciascuna). Una particella con più vincoli o zone compare in più flussi.`, sankeyZonaVincolo()));
}

// ---- Pagina ------------------------------------------------------------
function panel(id, labelledby, ...kids) {
    const p = html('section', 'an-panel');
    p.id = id; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', labelledby);
    p.append(...kids);
    return p;
}
function fig(titolo, nota, ...kids) {
    const f = html('figure', 'an-fig');
    f.append(html('h3', null, titolo));
    if (nota) f.append(html('p', 'an-note', nota));
    const sc = html('div', 'an-scroll');
    sc.append(...kids);
    f.append(sc);
    return f;
}

const kpi = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;

// lista di sotto-tab: items [id, etichetta, pannello]; crea tablist + pannelli (id pannello = an-<id>, tab = an-tab-<id>)
function subtabs(label, items) {
    const list = html('div', 'an-subtabs');
    list.setAttribute('role', 'tablist'); list.setAttribute('aria-label', label);
    const wrap = html('div');
    items.forEach(([id, txt, p], i) => {
        const b = html('button', null, txt);
        b.type = 'button'; b.id = 'an-tab-' + id; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'an-' + id);
        b.setAttribute('aria-selected', i === 0); if (i) b.tabIndex = -1;
        list.append(b); p.hidden = i > 0; wrap.append(p);
    });
    initTablist(list);
    return [list, wrap];
}

function build() {
    const body = document.getElementById('an-body');
    body.textContent = '';
    const sup = panel('an-sup', 'an-tab-sup',
        html('div', 'an-kpi', kpi(it(data.n), 'particelle') + kpi(it(Math.round(data.ha)) + ' ha', 'superficie particellata') + kpi(mq(data.mediana), 'superficie mediana') + kpi(mq(data.p90), '90° percentile')),
        fig('Distribuzione delle superfici', 'Quante particelle cadono in ogni classe di superficie. Le classi sono logaritmiche: ogni decade (×10) è divisa in 4 classi.', histSuperfici()),
        fig('Superfici per foglio', 'Un boxplot per foglio, asse logaritmico. I baffi arrivano al 5° e al 95° percentile, così i pochi lotti enormi non schiacciano il grafico. Scorri per vedere tutti i fogli.', boxplotFogli()));

    const hexWrap = html('div');
    const seg = html('div', 'seg', '<button type="button" aria-pressed="true" data-m="dens">Particelle per ettaro</button><button type="button" aria-pressed="false" data-m="n">Particelle per cella</button>');
    const draw = m => { hexWrap.textContent = ''; hexWrap.append(esagoni(m)); };
    seg.addEventListener('click', e => {
        const b = e.target.closest('button[data-m]');
        if (!b) return;
        seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        draw(b.dataset.m);
    });
    draw('dens');
    const fram = panel('an-fram', 'an-tab-fram',
        fig('Frammentazione su griglia esagonale', 'Più è scuro, più il territorio è spezzettato in tante particelle piccole.', seg, hexWrap),
        fig('Fogli più frammentati', 'Particelle per ettaro particellato, solo fogli con almeno 100 particelle.', tabellaFogli()));

    const forma = panel('an-forma', 'an-tab-forma',
        html('div', 'an-kpi', kpi(it2(data.compatt_mediana), 'compattezza mediana')),
        fig('Compattezza delle particelle', 'Indice di Polsby-Popper: 4π·area / perimetro². Vale 1 per un cerchio, 0,79 per un quadrato, tende a 0 per lotti stretti e lunghi (residuali o interclusi).', histCompatt()),
        fig('Lotti più irregolari', 'Ordinati per compattezza crescente. Clicca una particella per vederla in mappa.', tabellaIrregolari()));

    const sezioni = [
        ['fond', 'Struttura fondiaria', [['sup', 'Superfici', sup], ['fram', 'Frammentazione', fram], ['forma', 'Forma', forma]]],
        ['prg', 'Zonizzazione PRG', [['zsup', 'Superficie per zona', panelSuperficieZone()], ['zint', 'Particelle × zone', panelIntersezione()], ['zcav', 'A cavallo', panelCavallo()]]],
        ['vinc', 'Vincoli', [['vest', 'Estensione', panelEstensioneVincoli()], ['vint', 'Particelle interessate', panelParticelleVincoli()], ['vpiu', 'Più vincolate', panelPiuVincolate()], ['vflu', 'Zona → vincolo', panelFlusso()]]]];
    sezioni.forEach(([id, nome, subs], i) => {
        const p = panel('an-' + id, 'an-tab-' + id, ...subtabs(nome, subs));
        p.hidden = i > 0;
        body.append(p);
    });
}

// tablist con frecce/Home/End: vale per le tab principali e per i sotto-tab
function initTablist(list) {
    const tabs = [...list.querySelectorAll(':scope > [role="tab"]')];
    const show = t => {
        tabs.forEach(x => {
            const on = x === t;
            x.setAttribute('aria-selected', on);
            x.tabIndex = on ? 0 : -1;
            document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
        });
        t.focus();
        document.getElementById('an-body').scrollTop = 0;
    };
    tabs.forEach((t, i) => {
        t.addEventListener('click', () => show(t));
        t.addEventListener('keydown', e => {
            const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (d) { e.preventDefault(); show(tabs[(i + d + tabs.length) % tabs.length]); }
            else if (e.key === 'Home') { e.preventDefault(); show(tabs[0]); }
            else if (e.key === 'End') { e.preventDefault(); show(tabs[tabs.length - 1]); }
        });
    });
}

function initTabs() {
    const dlg = document.getElementById('analisi');
    initTablist(dlg.querySelector('.an-tabs'));
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // clic sullo sfondo
}

export async function openAnalisi() {
    const dlg = document.getElementById('analisi');
    if (typeof dlg.showModal !== 'function') return;
    if (!dlg.open) dlg.showModal();
    if (built) return;
    try {
        const res = await fetch(new URL('../analisi_particelle.json', import.meta.url));
        if (!res.ok) throw new Error(res.status);
        data = await res.json();
        build();
        initTabs();
        built = true;
    } catch (err) {
        console.error('Analisi non disponibile:', err);
        document.getElementById('an-body').innerHTML = '<p class="an-load" role="alert">Dati non disponibili. Riprova più tardi.</p>';
    }
}
