import assert from 'node:assert/strict';
import test from 'node:test';
import { coverageSectionKey, coverageSections } from '../src/domain/coverage.ts';

const record = (id, odometerKm, patch = {}) => ({
  id, odometerKm, date: '2026-11-01', volumeMl: 10000, amountCents: 1600,
  full: true, priceMode: 'amount', unitPriceMilli: null, ...patch,
});
const gap = (id, atOdometerKm) => ({ id, atOdometerKm });

test('coverage groups points by neighboring fills, including points exactly on a fill', () => {
  const records = [record(1, 10000), record(2, 10500), record(3, 11000)];
  const sections = coverageSections(records, [gap(4, 11000), gap(3, 10500), gap(2, 10200), gap(1, 9900)]);
  assert.deepEqual(sections.map((s) => [s.start?.id, s.end?.id, s.gaps.map((g) => g.id)]), [
    [undefined, 1, [1]], [1, 2, [2, 3]], [2, 3, [4]],
  ]);
});

test('backfilling changes only the named boundaries and does not clear or mutate gaps', () => {
  const gaps = [gap(1, 10200), gap(2, 10400)];
  const records = [record(1, 10000), record(3, 10500)];
  const source = structuredClone({ records, gaps });
  const before = coverageSections(records, gaps);
  const after = coverageSections([...records, record(2, 10200, { full: false })], gaps);
  assert.equal(before.length, 1);
  assert.equal(after.length, 2);
  assert.deepEqual(after[0].gaps, [gap(1, 10200)]);
  assert.deepEqual(after[1].gaps, [gap(2, 10400)]);
  assert.deepEqual({ records, gaps }, source);
});

test('empty, prefix and pending tail histories remain explicitly unbounded', () => {
  assert.deepEqual(coverageSections([], []), []);
  assert.deepEqual(coverageSections([], [gap(1, 10000)]), [{ start: null, end: null, gaps: [gap(1, 10000)] }]);
  const records = [record(1, 10000)];
  const sections = coverageSections(records, [gap(1, 10000), gap(2, 10200)]);
  assert.equal(sections[0].start, null);
  assert.equal(sections[0].end.id, 1);
  assert.equal(sections[1].start.id, 1);
  assert.equal(sections[1].end, null);
});

test('confirmation keys reject boundary edits, restored ID reuse and added coverage points', () => {
  const source = { start: record(1, 10000), end: record(2, 10500), gaps: [gap(1, 10200)] };
  const key = coverageSectionKey(source);
  for (const patch of [
    { id: 7 }, { date: '2026-10-31' }, { odometerKm: 9999 }, { full: false },
    { volumeMl: 20000 }, { amountCents: 3200 }, { priceMode: 'unit', unitPriceMilli: 1600 },
  ]) assert.notEqual(coverageSectionKey({ ...source, start: { ...source.start, ...patch } }), key);
  assert.notEqual(coverageSectionKey({ ...source, gaps: [gap(2, 10200)] }), key);
  assert.notEqual(coverageSectionKey({ ...source, gaps: [gap(1, 10300)] }), key);
  assert.notEqual(coverageSectionKey({ ...source, gaps: [...source.gaps, gap(2, 10400)] }), key);
  const multiple = { ...source, gaps: [gap(1, 10200), gap(2, 10300)] };
  assert.equal(coverageSectionKey(multiple), coverageSectionKey({ ...multiple, gaps: [...multiple.gaps].reverse() }));
});
