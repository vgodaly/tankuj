import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  createVehicle,
  deleteRefuel,
  initializeDatabase,
  insertRefuel,
  readSnapshot,
  updateRefuel,
} from '../src/data/fuel-repository.ts';
import { draftFromRefuel, measure, summarize, ValidationError } from '../src/domain/fuel.ts';

function adapter(connection = new DatabaseSync(':memory:')) {
  return {
    connection,
    async execAsync(sql) {
      connection.exec(sql);
    },
    async getFirstAsync(sql, ...params) {
      return connection.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, ...params) {
      return connection.prepare(sql).all(...params);
    },
    async runAsync(sql, ...params) {
      const result = connection.prepare(sql).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    async withExclusiveTransactionAsync(task) {
      connection.exec('BEGIN IMMEDIATE');
      try {
        await task(this);
        connection.exec('COMMIT');
      } catch (error) {
        connection.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
const draft = (overrides) => ({
  date: '2026-10-24',
  odometer: '10000',
  liters: '40',
  price: '64',
  full: true,
  missed: false,
  priceMode: 'amount',
  ...overrides,
});

test('initial migration is repeatable and never resets existing data', async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    assert.deepEqual(await readSnapshot(db), { vehicle: null, refuels: [], gaps: [] });
    await createVehicle(db, { name: '', fuel: 'Benzín' });
    await insertRefuel(db, draft({}), '2026-10-24');
    await initializeDatabase(db);
    const saved = await readSnapshot(db);
    assert.equal(saved.vehicle.name, 'Moje auto');
    assert.equal(saved.refuels.length, 1);
    assert.equal(saved.refuels[0].full, true);
    assert.equal(saved.refuels[0].volumeMl, 40000);
  } finally {
    db.connection.close();
  }
});
test('unknown database versions are rejected without deleting data', async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await createVehicle(db, { name: 'Auto', fuel: 'Diesel' });
    db.connection.exec('PRAGMA user_version = 2');
    await assert.rejects(initializeDatabase(db), /Nepodporovaná verzia/);
    assert.equal((await readSnapshot(db)).vehicle.name, 'Auto');
  } finally {
    db.connection.close();
  }
});
test('vehicle, original prices and gaps persist after closing and reopening the database file', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'tankuj-database-test-'));
  let db;
  try {
    const path = join(directory, 'tankuj.db');
    db = adapter(new DatabaseSync(path));
    await initializeDatabase(db);
    await createVehicle(db, { name: 'Test vehicle', fuel: 'Diesel' });
    await insertRefuel(
      db,
      draft({ liters: '10,5', priceMode: 'unit', price: '1,639', missed: true }),
      '2026-10-24',
    );
    db.connection.close();
    db = adapter(new DatabaseSync(path));
    await initializeDatabase(db);
    const restored = await readSnapshot(db);
    assert.equal(restored.vehicle.name, 'Test vehicle');
    assert.equal(restored.refuels.length, 1);
    assert.equal(restored.refuels[0].amountCents, 1721);
    assert.equal(restored.refuels[0].unitPriceMilli, 1639);
    assert.equal(restored.gaps[0].atOdometerKm, 10000);
  } finally {
    db?.connection.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
test('a refuel and its coverage gap are committed atomically', async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await createVehicle(db, { name: 'Auto', fuel: 'Benzín' });
    const result = await insertRefuel(db, draft({ missed: true }), '2026-10-24');
    assert.equal(result.snapshot.refuels.length, 1);
    assert.equal(result.snapshot.gaps[0].atOdometerKm, 10000);
    assert.equal(result.id, result.snapshot.refuels[0].id);
  } finally {
    db.connection.close();
  }
});
test('a failure after refuel insertion rolls back both writes and allows retry', async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await createVehicle(db, { name: 'Auto', fuel: 'Benzín' });
    const run = db.runAsync.bind(db);
    db.runAsync = async (sql, ...params) => {
      if (sql.startsWith('INSERT INTO coverage_gaps')) throw new Error('Simulated write failure');
      return run(sql, ...params);
    };
    await assert.rejects(
      insertRefuel(db, draft({ missed: true }), '2026-10-24'),
      /Simulated write failure/,
    );
    assert.equal((await readSnapshot(db)).refuels.length, 0);
    db.runAsync = run;
    assert.equal(
      (await insertRefuel(db, draft({ missed: true }), '2026-10-24')).snapshot.refuels.length,
      1,
    );
  } finally {
    db.connection.close();
  }
});
test('repository validation rejects duplicate and inconsistent chronological input', async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await createVehicle(db, { name: 'Auto', fuel: 'Benzín' });
    await insertRefuel(db, draft({}), '2026-10-24');
    await assert.rejects(insertRefuel(db, draft({}), '2026-10-24'), ValidationError);
    await assert.rejects(
      insertRefuel(db, draft({ date: '2026-10-20', odometer: '11000' }), '2026-10-24'),
      ValidationError,
    );
    assert.equal((await readSnapshot(db)).refuels.length, 1);
  } finally {
    db.connection.close();
  }
});
test('foreign keys and money/volume constraints are enforced by SQLite', async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await assert.rejects(insertRefuel(db, draft({}), '2026-10-24'), /Najprv pridaj vozidlo/);
    await createVehicle(db, { name: 'Auto', fuel: 'Benzín' });
    assert.throws(
      () =>
        db.connection.exec(
          "INSERT INTO refuels(date,odometer_km,volume_ml,amount_cents,is_full,price_mode) VALUES('2026-10-24',10000,0,1000,1,'amount')",
        ),
      /CHECK/,
    );
    assert.equal((await readSnapshot(db)).refuels.length, 0);
  } finally {
    db.connection.close();
  }
});

async function history(task) {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await createVehicle(db, { name: 'QA', fuel: 'Benzín' });
    const first = await insertRefuel(db, draft({ date: '2026-10-01' }), '2026-10-24');
    const middle = await insertRefuel(
      db,
      draft({ date: '2026-10-10', odometer: '10200', liters: '10', price: '15', full: false }),
      '2026-10-24',
    );
    const last = await insertRefuel(
      db,
      draft({ date: '2026-10-20', odometer: '10500', liters: '20', price: '30' }),
      '2026-10-24',
    );
    await task(db, { first: first.id, middle: middle.id, last: last.id });
  } finally {
    db.connection.close();
  }
}

test('editing preserves IDs and recalculates payments and consumption from corrected inputs', async () => {
  await history(async (db, ids) => {
    const before = await readSnapshot(db);
    const edited = draftFromRefuel(before.refuels.find((r) => r.id === ids.middle));
    const after = await updateRefuel(
      db,
      ids.middle,
      { ...edited, liters: '15', price: '24' },
      '2026-10-24',
    );
    assert.deepEqual(
      after.refuels.map((r) => r.id),
      before.refuels.map((r) => r.id),
    );
    assert.equal(measure(before.refuels, []).average, 6);
    assert.equal(measure(after.refuels, after.gaps).average, 7);
    assert.equal(summarize(after.refuels, '2026-10').monthlyCents, 11800);
    assert.deepEqual(
      await updateRefuel(db, ids.middle, { ...edited, liters: '15', price: '24' }, '2026-10-24'),
      after,
    );
  });
});

test('edit form round trips exact entered unit price and actual receipt amount', async () => {
  await history(async (db, ids) => {
    let snapshot = await updateRefuel(
      db,
      ids.middle,
      draft({
        date: '2026-10-10',
        odometer: '10200',
        liters: '10.5',
        price: '1.639',
        priceMode: 'unit',
        full: false,
      }),
      '2026-10-24',
    );
    const unit = snapshot.refuels.find((r) => r.id === ids.middle);
    assert.equal(unit.unitPriceMilli, 1639);
    assert.equal(unit.amountCents, 1721);
    assert.equal(draftFromRefuel(unit).price, '1.639');
    snapshot = await updateRefuel(db, ids.middle, draftFromRefuel(unit), '2026-10-24');
    assert.deepEqual(
      snapshot.refuels.find((r) => r.id === ids.middle),
      unit,
    );
    const receipt = snapshot.refuels[0];
    assert.equal(draftFromRefuel(receipt).price, '64.00');
    assert.equal(draftFromRefuel(receipt).liters, '40.000');
  });
});

test('editing rejects duplicates and incompatible dates without changing history', async () => {
  await history(async (db, ids) => {
    const before = await readSnapshot(db);
    const input = draftFromRefuel(before.refuels.find((r) => r.id === ids.middle));
    for (const patch of [
      { odometer: '10500' },
      { date: '2026-10-21' },
      { odometer: '9999' },
      { date: '2026-10-25' },
    ]) {
      await assert.rejects(
        updateRefuel(db, ids.middle, { ...input, ...patch }, '2026-10-24'),
        ValidationError,
      );
      assert.deepEqual(await readSnapshot(db), before);
    }
    const moved = await updateRefuel(
      db,
      ids.middle,
      { ...input, date: '2026-10-22', odometer: '10600' },
      '2026-10-24',
    );
    assert.equal(moved.refuels.at(-1).id, ids.middle);
    assert.equal(moved.gaps.length, 0);
  });
});

test('full and partial edits rebuild interval boundaries', async () => {
  await history(async (db, ids) => {
    const before = await readSnapshot(db);
    const input = draftFromRefuel(before.refuels.find((r) => r.id === ids.middle));
    const after = await updateRefuel(db, ids.middle, { ...input, full: true }, '2026-10-24');
    assert.equal(measure(after.refuels, after.gaps).intervals.length, 2);
    const final = after.refuels.find((r) => r.id === ids.last);
    const partial = await updateRefuel(
      db,
      ids.last,
      { ...draftFromRefuel(final), full: false },
      '2026-10-24',
    );
    assert.equal(measure(partial.refuels, partial.gaps).intervals.length, 1);
  });
});

test('deleting an incorrect record recalculates without inventing a gap', async () => {
  await history(async (db, ids) => {
    const after = await deleteRefuel(db, ids.middle, 'incorrect');
    assert.equal(after.refuels.length, 2);
    assert.equal(after.gaps.length, 0);
    assert.equal(measure(after.refuels, after.gaps).average, 4);
    assert.equal(summarize(after.refuels, '2026-10').monthlyCents, 9400);
  });
});

test('deleting a real intermediate fill excludes that interval and resumes at the next full tank', async () => {
  await history(async (db, ids) => {
    let after = await deleteRefuel(db, ids.middle, 'real');
    assert.equal(after.gaps[0].atOdometerKm, 10200);
    assert.equal(measure(after.refuels, after.gaps).average, null);
    after = (
      await insertRefuel(db, draft({ odometer: '11000', liters: '30', price: '48' }), '2026-10-24')
    ).snapshot;
    const result = measure(after.refuels, after.gaps);
    assert.equal(result.intervals.length, 1);
    assert.equal(result.intervals[0].start.id, ids.last);
    assert.equal(result.average, 6);
  });
});

test('deleting first, final and only real records retains missing-history information', async () => {
  for (const position of ['first', 'last']) {
    await history(async (db, ids) => {
      let after = await deleteRefuel(db, ids[position], 'real');
      assert.equal(after.gaps.length, 1);
      if (position === 'last') {
        assert.equal(measure(after.refuels, after.gaps).state, 'gap');
        after = (await insertRefuel(db, draft({ odometer: '11000' }), '2026-10-24')).snapshot;
        assert.equal(measure(after.refuels, after.gaps).average, null);
      }
      for (const record of after.refuels) after = await deleteRefuel(db, record.id, 'incorrect');
      assert.equal(after.refuels.length, 0);
      assert.equal(after.gaps.length, 1);
    });
  }
});

test('known gaps survive corrections, moves, backfill and incorrect deletion', async () => {
  await history(async (db, ids) => {
    let snapshot = await readSnapshot(db);
    const input = draftFromRefuel(snapshot.refuels.find((r) => r.id === ids.middle));
    snapshot = await updateRefuel(db, ids.middle, { ...input, missed: true }, '2026-10-24');
    snapshot = await updateRefuel(db, ids.middle, input, '2026-10-24');
    assert.deepEqual(
      snapshot.gaps.map((g) => g.atOdometerKm),
      [10200],
    );
    snapshot = await updateRefuel(
      db,
      ids.middle,
      { ...input, date: '2026-10-22', odometer: '10600', full: true },
      '2026-10-24',
    );
    assert.deepEqual(
      snapshot.gaps.map((g) => g.atOdometerKm),
      [10200, 10600],
    );
    assert.equal(measure(snapshot.refuels, snapshot.gaps).average, null);
    snapshot = await deleteRefuel(db, ids.middle, 'incorrect');
    assert.deepEqual(
      snapshot.gaps.map((g) => g.atOdometerKm),
      [10200, 10600],
    );
    snapshot = (await insertRefuel(db, input, '2026-10-24')).snapshot;
    assert.equal(measure(snapshot.refuels, snapshot.gaps).average, null);
  });
});

test('unrelated historical gaps do not introduce new gaps when a later record moves', async () => {
  await history(async (db, ids) => {
    await db.runAsync('INSERT INTO coverage_gaps (at_odometer_km) VALUES (?)', 9900);
    const snapshot = await readSnapshot(db);
    const input = draftFromRefuel(snapshot.refuels.at(-1));
    const after = await updateRefuel(db, ids.last, { ...input, odometer: '10550' }, '2026-10-24');
    assert.deepEqual(after.gaps, snapshot.gaps);
  });
});

test('edit and delete both roll back if gap insertion fails, then allow a retry', async () => {
  for (const operation of ['edit', 'delete']) {
    await history(async (db, ids) => {
      const before = await readSnapshot(db);
      const input = draftFromRefuel(before.refuels.find((r) => r.id === ids.middle));
      const run = db.runAsync.bind(db);
      db.runAsync = async (sql, ...params) => {
        if (sql.startsWith('INSERT INTO coverage_gaps')) throw new Error('Simulated gap failure');
        return run(sql, ...params);
      };
      const perform = () =>
        operation === 'edit'
          ? updateRefuel(db, ids.middle, { ...input, missed: true, liters: '12' }, '2026-10-24')
          : deleteRefuel(db, ids.middle, 'real');
      await assert.rejects(perform(), /Simulated gap failure/);
      assert.deepEqual(await readSnapshot(db), before);
      db.runAsync = run;
      const after = await perform();
      assert.equal(after.gaps.length, 1);
      assert.equal(after.refuels.length, operation === 'edit' ? 3 : 2);
    });
  }
});

test('missing IDs and invalid delete reasons never modify existing data', async () => {
  await history(async (db, ids) => {
    const before = await readSnapshot(db);
    await assert.rejects(updateRefuel(db, 9999, draft({}), '2026-10-24'), /neexistuje/);
    await assert.rejects(deleteRefuel(db, 9999, 'incorrect'), /neexistuje/);
    await assert.rejects(deleteRefuel(db, ids.middle, 'other'), /dôvod/);
    assert.deepEqual(await readSnapshot(db), before);
  });
});

test('edited data and a gap from deleting the only remaining real fill persist on disk', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'tankuj-edit-delete-test-'));
  let db;
  try {
    const path = join(directory, 'tankuj.db');
    db = adapter(new DatabaseSync(path));
    await initializeDatabase(db);
    await createVehicle(db, { name: 'Persistence QA', fuel: 'Diesel' });
    const first = await insertRefuel(db, draft({}), '2026-10-24');
    const edited = await updateRefuel(
      db,
      first.id,
      draft({ liters: '10.5', price: '1.639', priceMode: 'unit' }),
      '2026-10-24',
    );
    db.connection.close();
    db = adapter(new DatabaseSync(path));
    await initializeDatabase(db);
    assert.deepEqual(await readSnapshot(db), edited);
    const deleted = await deleteRefuel(db, first.id, 'real');
    assert.equal(deleted.refuels.length, 0);
    assert.equal(deleted.gaps[0].atOdometerKm, 10000);
    db.connection.close();
    db = adapter(new DatabaseSync(path));
    await initializeDatabase(db);
    assert.deepEqual(await readSnapshot(db), deleted);
    await assert.rejects(deleteRefuel(db, first.id, 'real'), /neexistuje/);
    assert.deepEqual(await readSnapshot(db), deleted);
    assert.equal(db.connection.prepare('PRAGMA user_version').get().user_version, 1);
  } finally {
    db?.connection.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
