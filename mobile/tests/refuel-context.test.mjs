import assert from 'node:assert/strict';
import test from 'node:test';
import { refuelContext } from '../src/domain/refuel-context.ts';
import { buildRefuel, ValidationError } from '../src/domain/fuel.ts';

const fill = (id, date, odometerKm) => ({
  id, date, odometerKm, volumeMl: 30000, amountCents: 4800,
  full: true, priceMode: 'amount', unitPriceMilli: null,
});
const a = fill(1, '2026-10-01', 10000);
const b = fill(2, '2026-10-10', 10200);
const c = fill(3, '2026-10-10', 10500);
const d = fill(4, '2026-10-20', 11000);
const history = Object.freeze([d, b, a, c].map(Object.freeze));
const context = (date, odometer = '', excludeId) =>
  refuelContext({ date, odometer }, history, excludeId, '2026-11-02');
const ids = (result) => {
  assert.equal(result.kind, 'neighbors');
  return [result.previous?.id, result.next?.id, result.duplicate?.id];
};

test('date alone locates before, between and after records without mutating unsorted history', () => {
  assert.deepEqual(ids(context('2026-09-30')), [undefined, 1, undefined]);
  assert.deepEqual(ids(context('2026-10-05')), [1, 2, undefined]);
  assert.deepEqual(ids(context('2026-11-02')), [4, undefined, undefined]);
  assert.deepEqual(history.map((r) => r.id), [4, 2, 1, 3]);
});

test('same-day ordering waits for a supported integer tachometer, including zero', () => {
  for (const odometer of ['', '1,5', '-1', '10000000', '9007199254740993', 'NaN'])
    assert.deepEqual(context('2026-10-10', odometer), { kind: 'needs-odometer', sameDayCount: 2 });
  assert.deepEqual(ids(context('2026-10-10', '0')), [1, 2, undefined]);
  assert.deepEqual(ids(context('2026-10-10', '10300')), [2, 3, undefined]);
  assert.deepEqual(ids(context('2026-10-10', '10800')), [3, 4, undefined]);
});

test('editing excludes the saved identity and recomputes neighbors when date or km changes', () => {
  assert.deepEqual(ids(context('2026-10-10', '10200', b.id)), [1, 3, undefined]);
  assert.deepEqual(ids(context('2026-10-10', '10800', b.id)), [3, 4, undefined]);
  assert.deepEqual(ids(context('2026-10-25', '10200', b.id)), [4, undefined, undefined]);
  assert.deepEqual(ids(context('2026-09-30', '10200', b.id)), [undefined, 1, undefined]);
});

test('duplicate tachometers are identified across dates and an edited record never duplicates itself', () => {
  assert.deepEqual(ids(context('2026-10-10', '10500')), [2, 4, 3]);
  assert.deepEqual(ids(context('2026-10-05', '10500')), [1, 2, 3]);
  assert.deepEqual(ids(context('2026-10-10', '10500', c.id)), [2, 4, undefined]);
});

test('invalid or future dates do not leave stale neighbors, and empty histories are supported', () => {
  for (const date of ['', '2026-02-29', '2026-11-03', '10.10.2026'])
    assert.deepEqual(context(date, '10300'), { kind: 'invalid-date' });
  assert.deepEqual(ids(refuelContext({ date: a.date, odometer: '' }, [], undefined, '2026-11-02')),
    [undefined, undefined, undefined]);
  assert.deepEqual(ids(refuelContext({ date: a.date, odometer: String(a.odometerKm) }, [a], a.id,
    '2026-11-02')), [undefined, undefined, undefined]);
});

test('context remains guidance: conflicting km/date and duplicates still fail save validation', () => {
  const draft = { date: '2026-10-05', odometer: '10800', liters: '30', price: '48',
    priceMode: 'amount', full: false, missed: false };
  assert.deepEqual(ids(context(draft.date, draft.odometer)), [1, 2, undefined]);
  assert.throws(() => buildRefuel(draft, history, '2026-11-02'),
    (error) => error instanceof ValidationError && Boolean(error.errors.odometer));
  assert.throws(() => buildRefuel({ ...draft, odometer: '10500' }, history, '2026-11-02'),
    (error) => error instanceof ValidationError && Boolean(error.errors.odometer));
});
