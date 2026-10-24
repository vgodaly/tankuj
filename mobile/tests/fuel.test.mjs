import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRefuel,
  centsFromUnitPrice,
  isDate,
  localToday,
  measure,
  parseScaled,
  summarize,
  ValidationError,
} from '../src/domain/fuel.ts';

const record = (odometerKm, liters, full = true, amountCents = 1600, date = '2026-10-01') => ({
  id: odometerKm,
  date,
  odometerKm,
  volumeMl: liters * 1000,
  amountCents,
  full,
  priceMode: 'amount',
  unitPriceMilli: null,
});
const draft = (overrides = {}) => ({
  date: '2026-10-24',
  odometer: '10500',
  liters: '30',
  price: '48',
  priceMode: 'amount',
  full: true,
  missed: false,
  ...overrides,
});
const gap = (atOdometerKm) => ({ id: atOdometerKm, atOdometerKm });

test('decimal parsing is exact and rejects ambiguous, negative, overprecise and unsafe values', () => {
  assert.equal(parseScaled('10,500', 3), 10500);
  assert.equal(parseScaled('10.500', 3), 10500);
  assert.equal(parseScaled('0', 0), 0);
  for (const value of [
    '1,000.50',
    '1e3',
    '-1',
    'NaN',
    'Infinity',
    '',
    '1.0001',
    '9007199254740993',
  ])
    assert.equal(parseScaled(value, 3), null, value);
});
test('price multiplication rounds half-up in integer units', () => {
  assert.equal(centsFromUnitPrice(10500, 1639), 1721);
  assert.equal(centsFromUnitPrice(1005, 1000), 101);
  assert.equal(centsFromUnitPrice(1004, 1000), 100);
});
test('amount mode preserves the receipt total; unit mode preserves entered unit price', () => {
  assert.equal(buildRefuel(draft({ liters: '10,5', price: '17,21' }), []).amountCents, 1721);
  const result = buildRefuel(draft({ liters: '10,5', price: '1,639', priceMode: 'unit' }), []);
  assert.equal(result.amountCents, 1721);
  assert.equal(result.unitPriceMilli, 1639);
});
test('strict dates reject impossible dates and future entries', () => {
  assert.equal(isDate('2024-02-29'), true);
  assert.equal(isDate('2026-02-29'), false);
  assert.equal(isDate('2026-02-31'), false);
  assert.throws(
    () => buildRefuel(draft({ date: '2026-10-25' }), [], '2026-10-24'),
    ValidationError,
  );
  assert.equal(localToday(new Date(2026, 9, 24, 0, 5)), '2026-10-24');
});
test('positive values, precision, range and rounded zero are validated', () => {
  for (const patch of [
    { liters: '0' },
    { price: '0' },
    { liters: '1.0001' },
    { price: '16.001' },
    { odometer: '1.1' },
    { odometer: '10000000' },
    { price: '1000000' },
    { liters: '0.001', price: '0.001', priceMode: 'unit' },
  ]) {
    assert.throws(() => buildRefuel(draft(patch), []), ValidationError, JSON.stringify(patch));
  }
});
test('odometer validation respects both date neighbors and same-day ordering', () => {
  const records = [
    record(10000, 40, true, 6000, '2026-10-10'),
    record(10500, 30, true, 4800, '2026-10-20'),
  ];
  assert.throws(
    () => buildRefuel(draft({ date: '2026-10-15', odometer: '10600' }), records),
    ValidationError,
  );
  assert.throws(() => buildRefuel(draft({ odometer: '10500' }), records), ValidationError);
  assert.equal(
    buildRefuel(draft({ date: '2026-10-10', odometer: '10200' }), records).odometerKm,
    10200,
  );
});
test('empty history and a single full tank do not invent zero consumption', () => {
  assert.equal(measure([], []).average, null);
  assert.equal(measure([record(10000, 40)], []).average, null);
});
test('two full tanks exclude starting liters', () => {
  assert.equal(measure([record(10000, 40), record(10500, 30)], []).average, 6);
});
test('partial fill-ups accumulate until the next full tank', () => {
  assert.equal(
    measure([record(10000, 40), record(10200, 10, false), record(10500, 20)], []).average,
    6,
  );
  assert.equal(measure([record(10000, 40), record(10200, 10, false)], []).average, null);
});
test('partial records before the first full tank are not carried into the first interval', () => {
  assert.equal(
    measure([record(10000, 10, false), record(10200, 15), record(10700, 30)], []).average,
    6,
  );
});
test('a gap before a full tank invalidates only the affected interval', () => {
  const result = measure([record(10000, 40), record(10500, 25), record(11000, 30)], [gap(10500)]);
  assert.equal(result.intervals.length, 1);
  assert.equal(result.intervals[0].start.odometerKm, 10500);
  assert.equal(result.average, 6);
});
test('a gap before a partial tank waits for a fresh full baseline', () => {
  const result = measure(
    [record(10000, 40), record(10300, 10, false), record(10500, 20), record(11000, 30)],
    [gap(10300)],
  );
  assert.equal(result.intervals.length, 1);
  assert.equal(result.average, 6);
});
test('coverage gaps survive removal of a real intermediate or final fill-up', () => {
  assert.equal(measure([record(10000, 40), record(10500, 20)], [gap(10200)]).average, null);
  assert.equal(measure([record(10000, 40)], [gap(10200)]).state, 'gap');
  assert.equal(
    measure([record(10000, 40), record(10500, 20), record(11000, 30)], [gap(10200)]).average,
    6,
  );
});
test('backfilling a record does not silently clear a known coverage gap', () => {
  assert.equal(
    measure([record(10000, 40), record(10200, 10, false), record(10500, 20)], [gap(10200)]).average,
    null,
  );
});
test('weighted consumption and shared endpoints avoid double counting', () => {
  const result = measure([record(10000, 40), record(10500, 30), record(10900, 28)], []);
  assert.equal(result.distanceKm, 900);
  assert.equal(result.average, (58 / 900) * 100);
  assert.equal(result.intervals.length, 2);
  assert.equal(measure([record(1000, 40), record(1100, 10), record(2000, 45)], []).average, 5.5);
});
test('monthly payments include first and partial tanks; unit price is weighted by volume', () => {
  const records = [
    record(1000, 10, true, 2000, '2026-09-30'),
    record(1200, 40, false, 6000, '2026-10-01'),
  ];
  const result = summarize(records, '2026-10');
  assert.equal(result.monthlyCents, 6000);
  assert.equal(result.averagePrice, 1.6);
  assert.equal(summarize([], '2026-10').averagePrice, null);
});
