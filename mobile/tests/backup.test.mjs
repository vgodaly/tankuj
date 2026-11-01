import assert from 'node:assert/strict';
import test from 'node:test';
import { BackupError, MAX_BACKUP_BYTES, MAX_BACKUP_ITEMS, parseBackup, serializeBackup, validateBackup } from '../src/domain/backup.ts';
import { buildRefuel, measure, summarize } from '../src/domain/fuel.ts';

const today = '2026-11-01';
const now = new Date('2026-11-01T12:00:00.000Z');
function fixture() {
  const row = (id, odometer, liters, price, patch = {}) => ({ id, ...buildRefuel({
    date: today, odometer, liters, price, priceMode: 'amount', full: true, missed: false, ...patch,
  }, [], today) });
  return {
    vehicle: { name: 'Moje auto 🚗', fuel: 'Benzín' },
    refuels: [row(4, '10000', '40', '64'),
      row(8, '10200', '10.5', '1.639', { priceMode: 'unit', full: false }),
      row(12, '10500', '20', '32'), row(18, '11000', '30', '48')],
    // Retain gaps without an owning record, including a gap after the last record.
    gaps: [{ id: 7, atOdometerKm: 10200 }, { id: 10, atOdometerKm: 11200 }],
  };
}
const backup = () => JSON.parse(serializeBackup(fixture(), now));

test('JSON backup round trip preserves exact inputs, stable IDs, all gaps and derived results', () => {
  const source = fixture();
  const restored = parseBackup(serializeBackup(source, now), today);
  assert.deepEqual(restored.vehicle, { id: 1, ...source.vehicle });
  assert.deepEqual(restored.refuels, source.refuels);
  assert.deepEqual(restored.gaps, source.gaps);
  assert.equal(restored.refuels[1].unitPriceMilli, 1639);
  assert.equal(restored.refuels[1].amountCents, 1721);
  assert.deepEqual(measure(restored.refuels, restored.gaps), measure(source.refuels, source.gaps));
  assert.deepEqual(summarize(restored.refuels, '2026-11'), summarize(source.refuels, '2026-11'));
  assert.equal(restored.exportedAt, now.toISOString());
  assert.equal(restored.version, 1);
});

test('empty histories with and without a vehicle can be backed up and restored', () => {
  for (const vehicle of [null, { name: 'Auto', fuel: 'Diesel' }]) {
    const restored = parseBackup(serializeBackup({ vehicle, refuels: [], gaps: [] }, now), today);
    assert.deepEqual(restored.vehicle, vehicle ? { id: 1, ...vehicle } : null);
    assert.deepEqual(restored.refuels, []);
  }
  const invalid = backup(); invalid.vehicle = null;
  assert.throws(() => validateBackup(invalid, today), BackupError);
});

test('malformed, foreign, unsupported and ambiguous backup structures are rejected', () => {
  for (const text of ['', '{', 'null', '[]', '"tankuj"'])
    assert.throws(() => parseBackup(text, today), BackupError);
  for (const patch of [
    { format: 'other' }, { version: 2 }, { version: '1' }, { exportedAt: '2026-02-30T12:00:00.000Z' },
    { exportedAt: 'invalid' }, { vehicle: { id: 2, name: 'A', fuel: 'Diesel' } },
    { vehicle: { id: 1, name: ' ', fuel: 'Benzín' } },
    { vehicle: { id: 1, name: 'A', fuel: 'LPG' } }, { refuels: null }, { gaps: {} }, { average: 6 },
  ]) assert.throws(() => validateBackup({ ...backup(), ...patch }, today), BackupError);
  const missing = backup(); delete missing.gaps;
  assert.throws(() => validateBackup(missing, today), BackupError);
});

test('invalid ranges, types, precision and contradictory price modes never get coerced', () => {
  for (const patch of [
    { id: 0 }, { id: Number.MAX_SAFE_INTEGER + 1 }, { odometerKm: '10000' },
    { odometerKm: -1 }, { odometerKm: 10_000_000 }, { volumeMl: 1.5 }, { volumeMl: 0 },
    { volumeMl: 10_000_001 }, { amountCents: null }, { amountCents: 100_000_000 },
    { full: 1 }, { priceMode: 'other' }, { unitPriceMilli: 1600 },
    { date: '2026-11-02' }, { date: '2026-02-30' },
  ]) {
    const data = backup(); Object.assign(data.refuels[0], patch);
    assert.throws(() => validateBackup(data, today), BackupError, JSON.stringify(patch));
  }
  for (const patch of [{ unitPriceMilli: null }, { unitPriceMilli: 100001 }, { amountCents: 1722 }]) {
    const data = backup(); Object.assign(data.refuels[1], patch);
    assert.throws(() => validateBackup(data, today), BackupError);
  }
});

test('duplicate IDs, duplicate odometers, contradictory dates and invalid gaps are rejected', () => {
  const changes = [
    (d) => { d.refuels[1].id = d.refuels[0].id; },
    (d) => { d.refuels[1].odometerKm = d.refuels[0].odometerKm; },
    (d) => { d.refuels[1].date = '2026-10-31'; },
    (d) => { d.gaps[1].id = d.gaps[0].id; },
    (d) => { d.gaps[0].atOdometerKm = -1; },
    (d) => { d.gaps[0].atOdometerKm = 1.2; },
    (d) => { d.gaps[0].atOdometerKm = 10_000_000; },
  ];
  for (const change of changes) {
    const data = backup(); change(data);
    assert.throws(() => validateBackup(data, today), BackupError);
  }
  const unordered = backup(); unordered.refuels.reverse(); unordered.gaps.reverse();
  assert.deepEqual(validateBackup(unordered, today), backup());
});

test('backup size and collection limits also cover multibyte UTF-8 content', () => {
  assert.throws(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1), today), /10 MB/);
  assert.throws(() => parseBackup('€'.repeat(Math.floor(MAX_BACKUP_BYTES / 3) + 1), today), /10 MB/);
  const data = backup();
  data.refuels = Array(MAX_BACKUP_ITEMS + 1).fill(data.refuels[0]);
  assert.throws(() => validateBackup(data, today), /10 000/);
  data.refuels = []; data.gaps = Array(MAX_BACKUP_ITEMS + 1).fill(data.gaps[0]);
  assert.throws(() => validateBackup(data, today), /10 000/);
});
