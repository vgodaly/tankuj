import assert from 'node:assert/strict';
import test from 'node:test';
import { monthlyPayments } from '../src/domain/statistics.ts';

const fill = (id, date, amountCents, full = false) => ({
  id, date, odometerKm: id * 100, volumeMl: 10000, amountCents,
  full, priceMode: 'amount', unitPriceMilli: null,
});

test('monthly payments include first and partial fills, keep cents and fill calendar gaps across years', () => {
  const records = Object.freeze([
    Object.freeze(fill(4, '2026-02-28', 1721)),
    Object.freeze(fill(1, '2025-12-01', 101, true)),
    Object.freeze(fill(3, '2026-02-01', 1)),
    Object.freeze(fill(2, '2025-12-01', 199)),
  ]);
  assert.deepEqual(monthlyPayments(records, '2026-03'), [
    { month: '2025-12', amountCents: 300, count: 2 },
    { month: '2026-01', amountCents: 0, count: 0 },
    { month: '2026-02', amountCents: 1722, count: 2 },
    { month: '2026-03', amountCents: 0, count: 0 },
  ]);
  assert.equal(records[0].id, 4);
});

test('empty history remains empty and a first fill provides payments without a consumption interval', () => {
  assert.deepEqual(monthlyPayments([], '2026-11'), []);
  assert.deepEqual(monthlyPayments([fill(1, '2026-11-01', 6400)], '2026-11'), [
    { month: '2026-11', amountCents: 6400, count: 1 },
  ]);
});

test('calendar month keys preserve years below 100 without Date constructor coercion', () => {
  assert.deepEqual(monthlyPayments([fill(1, '0099-12-31', 123)], '0100-01'), [
    { month: '0099-12', amountCents: 123, count: 1 },
    { month: '0100-01', amountCents: 0, count: 0 },
  ]);
});

test('moving the device calendar backwards never drops already stored later payments', () => {
  assert.deepEqual(monthlyPayments([fill(1, '2026-02-01', 500)], '2025-12'), [
    { month: '2025-12', amountCents: 0, count: 0 },
    { month: '2026-01', amountCents: 0, count: 0 },
    { month: '2026-02', amountCents: 500, count: 1 },
  ]);
});

test('editing dates and amounts, deleting and restoring histories recalculate monthly totals', () => {
  const original = [fill(1, '2026-09-30', 2000, true), fill(2, '2026-10-01', 6000)];
  const edited = [original[0], { ...original[1], date: '2026-09-30', amountCents: 6001 }];
  assert.deepEqual(monthlyPayments(edited, '2026-10'), [
    { month: '2026-09', amountCents: 8001, count: 2 },
    { month: '2026-10', amountCents: 0, count: 0 },
  ]);
  assert.deepEqual(monthlyPayments(edited.slice(0, 1), '2026-10'), [
    { month: '2026-09', amountCents: 2000, count: 1 },
    { month: '2026-10', amountCents: 0, count: 0 },
  ]);
  assert.deepEqual(monthlyPayments(structuredClone(original), '2026-10'), [
    { month: '2026-09', amountCents: 2000, count: 1 },
    { month: '2026-10', amountCents: 6000, count: 1 },
  ]);
});

test('invalid calendar months are refused before generating a range', () => {
  for (const month of ['2026-00', '2026-13', '2026-1', '2026-01-01', '', 'NaN']) {
    assert.throws(() => monthlyPayments([fill(1, '2026-01-01', 100)], month));
  }
});
