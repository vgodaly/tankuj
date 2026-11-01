import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeCsv } from '../src/domain/csv.ts';

const record = (patch = {}) => ({
  id: 1, date: '2026-11-01', odometerKm: 10000, volumeMl: 40000, amountCents: 6400,
  full: true, priceMode: 'amount', unitPriceMilli: null, ...patch,
});
const snapshot = (patch = {}) => ({
  vehicle: { name: 'Auto', fuel: 'Benzín' }, refuels: [record()], gaps: [], ...patch,
});

test('CSV exports exact scaled inputs, original unit price, effective price and Slovak labels', () => {
  const text = serializeCsv(snapshot({ refuels: [record(), record({
    id: 7, odometerKm: 10200, volumeMl: 10500, amountCents: 1721,
    full: false, priceMode: 'unit', unitPriceMilli: 1639,
  })] }));
  assert.ok(text.startsWith('\uFEFF"ID tankovania";"Vozidlo"'));
  assert.ok(text.endsWith('\r\n'));
  const lines = text.split('\r\n');
  assert.equal(lines.length, 4);
  assert.equal(lines[1], '"1";"Auto";"Benzín";"2026-11-01";"10000";"40,000";"64,00";"Suma";"";"1,600";"Áno";"Nie";"Nie"');
  assert.equal(lines[2], '"7";"Auto";"Benzín";"2026-11-01";"10200";"10,500";"17,21";"Cena za liter";"1,639";"1,639";"Nie";"Nie";"Nie"');
});

test('CSV escaping preserves semicolons, quotes, multiline names and non-ASCII characters', () => {
  const text = serializeCsv(snapshot({ vehicle: { name: 'Auto; "Žlté"\n🚗', fuel: 'Diesel' } }));
  assert.ok(text.includes(';"Auto; ""Žlté""\n🚗";"Diesel";'));
});

test('user-entered formula prefixes are escaped even after whitespace or control characters', () => {
  for (const name of ['=1+1', '+1', '-1', '@SUM(A1)', ' \t=1', '\r\n+1']) {
    const text = serializeCsv(snapshot({ vehicle: { name, fuel: 'Benzín' } }));
    assert.ok(text.includes(`;"'${name}";`), JSON.stringify(name));
  }
  assert.ok(serializeCsv(snapshot({ vehicle: { name: 'Auto-1', fuel: 'Diesel' } })).includes(';"Auto-1";'));
});

test('CSV orders history and labels inherited gaps and gaps beyond the final record without mutation', () => {
  const source = snapshot({
    refuels: [record({ id: 5, odometerKm: 11000 }), record(), record({ id: 3, odometerKm: 10500 })],
    gaps: [{ id: 1, atOdometerKm: 10200 }, { id: 2, atOdometerKm: 11200 }],
  });
  const before = structuredClone(source);
  const rows = serializeCsv(source).split('\r\n');
  assert.ok(rows[1].startsWith('"1";'));
  assert.ok(rows[1].endsWith(';"Áno";"Nie";"Nie"'));
  assert.ok(rows[2].startsWith('"3";'));
  assert.ok(rows[2].endsWith(';"Áno";"Áno";"Nie"'));
  assert.ok(rows[3].startsWith('"5";'));
  assert.ok(rows[3].endsWith(';"Áno";"Nie";"Áno"'));
  assert.deepEqual(source, before);
});

test('empty CSV has a readable header and rounding of effective price is half-up', () => {
  assert.equal(serializeCsv({ vehicle: null, refuels: [], gaps: [] }).split('\r\n').length, 2);
  const text = serializeCsv(snapshot({ refuels: [record({ volumeMl: 20000, amountCents: 2469 })] }));
  assert.ok(text.includes(';"24,69";"Suma";"";"1,235";'));
});
