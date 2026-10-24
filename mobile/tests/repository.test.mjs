import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  createVehicle,
  initializeDatabase,
  insertRefuel,
  readSnapshot,
} from '../src/data/fuel-repository.ts';
import { ValidationError } from '../src/domain/fuel.ts';

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
