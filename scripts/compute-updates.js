// Confronta CSV vecchio e nuovo per URL: le righe cambiate finiscono in updates.json con la data di oggi.
// uso: node scripts/compute-updates.js old.csv new.csv updates.json
const fs = require('fs');

function parse(t) {
  const rows = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { r.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); c = ''; if (r.some(x => x)) rows.push(r); r = []; }
    else c += ch;
  }
  if (c || r.length) { r.push(c); rows.push(r); }
  return rows;
}

function byUrl(file) {
  const rows = parse(fs.readFileSync(file, 'utf8'));
  const h = rows[0].map(x => x.trim().toLowerCase());
  const u = h.indexOf('url');
  const m = {};
  rows.slice(1).forEach(r => { if (r[u]) { const o = {}; h.forEach((k, i) => { o[k] = (r[i] || '').trim(); }); m[r[u].trim()] = o; } });
  return m;
}

// confronta solo le colonne presenti in entrambe le righe (una colonna nuova non deve segnare tutto come cambiato)
const IGNORA = ['aggiornamento'];
function changed(a, b) {
  return Object.keys(a).some(k => k in b && !IGNORA.includes(k) && a[k] !== b[k]);
}

function compute(oldM, newM, prev, today) {
  const out = { ...prev }; // le date restano per sempre; il badge scade lato home (30 giorni)
  for (const k in newM) if (k in oldM && changed(oldM[k], newM[k])) out[k] = today; // ponytail: le mappe nuove non contano, hanno già `data`
  return out;
}

if (require.main === module) {
  const [o, n, out] = process.argv.slice(2);
  const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
  const res = compute(byUrl(o), byUrl(n), prev, new Date().toISOString().slice(0, 10));
  fs.writeFileSync(out, JSON.stringify(res, null, 2));
  console.log('updates.json:', Object.keys(res).length, 'mappe aggiornate');
} else module.exports = { compute };
