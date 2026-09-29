const assert = require('assert');
const { compute } = require('./compute-updates');
const r = compute({ a: { t: '1' }, b: { t: '2' } }, { a: { t: '1', aggiornamento: '01-01-2026' }, b: { t: 'X' }, c: { t: '3' } }, { old: '2020-01-01' }, '2026-09-29');
assert.deepStrictEqual(r, { old: '2020-01-01', b: '2026-09-29' });
console.log('ok');
