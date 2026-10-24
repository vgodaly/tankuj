import type { SQLiteDatabase } from 'expo-sqlite';
import { buildRefuel, localToday } from '../domain/fuel.ts';
import type { CoverageGap, Refuel, RefuelDraft, Snapshot, Vehicle } from '../domain/fuel.ts';

type Db = Pick<
  SQLiteDatabase,
  'execAsync' | 'getFirstAsync' | 'getAllAsync' | 'runAsync' | 'withExclusiveTransactionAsync'
>;
type RefuelRow = Omit<Refuel, 'full'> & { full: number };
const REFUELS_SQL =
  'SELECT id, date, odometer_km AS odometerKm, volume_ml AS volumeMl, amount_cents AS amountCents, is_full AS full, price_mode AS priceMode, unit_price_milli AS unitPriceMilli FROM refuels ORDER BY date, odometer_km';

export const SCHEMA_V1 = [
  "CREATE TABLE vehicle (id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40), fuel TEXT NOT NULL CHECK (fuel IN ('Benzín', 'Diesel')));",
  "CREATE TABLE refuels (id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_id INTEGER NOT NULL DEFAULT 1 REFERENCES vehicle(id), date TEXT NOT NULL, odometer_km INTEGER NOT NULL UNIQUE CHECK (odometer_km BETWEEN 0 AND 9999999), volume_ml INTEGER NOT NULL CHECK (volume_ml BETWEEN 1 AND 10000000), amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 1 AND 99999999), is_full INTEGER NOT NULL CHECK (is_full IN (0, 1)), price_mode TEXT NOT NULL CHECK (price_mode IN ('amount', 'unit')), unit_price_milli INTEGER, CHECK ((price_mode = 'amount' AND unit_price_milli IS NULL) OR (price_mode = 'unit' AND unit_price_milli BETWEEN 1 AND 100000)));",
  'CREATE INDEX refuels_date ON refuels(date, odometer_km);',
  'CREATE TABLE coverage_gaps (id INTEGER PRIMARY KEY AUTOINCREMENT, at_odometer_km INTEGER NOT NULL CHECK (at_odometer_km >= 0));',
  'PRAGMA user_version = 1;',
].join('\n');

export async function initializeDatabase(db: Db): Promise<void> {
  await db.execAsync(
    'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;',
  );
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const version = await transaction.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    if (!version || version.user_version > 1) throw new Error('Nepodporovaná verzia databázy.');
    if (version.user_version === 0) await transaction.execAsync(SCHEMA_V1);
  });
}

export async function readSnapshot(
  db: Pick<Db, 'getFirstAsync' | 'getAllAsync'>,
): Promise<Snapshot> {
  const vehicle = await db.getFirstAsync<Vehicle>('SELECT name, fuel FROM vehicle WHERE id = 1');
  const rows = await db.getAllAsync<RefuelRow>(REFUELS_SQL);
  const gaps = await db.getAllAsync<CoverageGap>(
    'SELECT id, at_odometer_km AS atOdometerKm FROM coverage_gaps ORDER BY at_odometer_km',
  );
  return { vehicle, refuels: rows.map((row) => ({ ...row, full: Boolean(row.full) })), gaps };
}

export async function createVehicle(db: Db, vehicle: Vehicle): Promise<Snapshot> {
  const name = vehicle.name.trim() || 'Moje auto';
  if (name.length > 40 || !['Benzín', 'Diesel'].includes(vehicle.fuel))
    throw new Error('Skontroluj údaje vozidla.');
  let result: Snapshot | undefined;
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      'INSERT INTO vehicle (id, name, fuel) VALUES (1, ?, ?)',
      name,
      vehicle.fuel,
    );
    result = await readSnapshot(transaction);
  });
  return result!;
}

export async function insertRefuel(
  db: Db,
  draft: RefuelDraft,
  today = localToday(),
): Promise<{ snapshot: Snapshot; id: number }> {
  let result: { snapshot: Snapshot; id: number } | undefined;
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const before = await readSnapshot(transaction);
    if (!before.vehicle) throw new Error('Najprv pridaj vozidlo.');
    const record = buildRefuel(draft, before.refuels, today);
    const write = await transaction.runAsync(
      'INSERT INTO refuels (date, odometer_km, volume_ml, amount_cents, is_full, price_mode, unit_price_milli) VALUES (?, ?, ?, ?, ?, ?, ?)',
      record.date,
      record.odometerKm,
      record.volumeMl,
      record.amountCents,
      Number(record.full),
      record.priceMode,
      record.unitPriceMilli,
    );
    if (draft.missed)
      await transaction.runAsync(
        'INSERT INTO coverage_gaps (at_odometer_km) VALUES (?)',
        record.odometerKm,
      );
    result = { snapshot: await readSnapshot(transaction), id: write.lastInsertRowId };
  });
  return result!;
}
