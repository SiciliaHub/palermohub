const assert = require('assert');
const { compute } = require('./compute-updates');
const r = compute({ a: '1', b: '2' }, { a: '1', b: 'X', c: '3' }, { old: '2020-01-01', keep: '2026-09-01' }, '2026-09-29');
assert.deepStrictEqual(r, { keep: '2026-09-01', b: '2026-09-29' });
console.log('ok');
