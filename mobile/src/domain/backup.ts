import { buildRefuel, draftFromRefuel, localToday, orderRefuels } from './fuel.ts';
import type { CoverageGap, Refuel, Snapshot, Vehicle } from './fuel.ts';

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const MAX_BACKUP_ITEMS = 10_000;
export type Backup = {
  format: 'tankuj';
  version: 1;
  exportedAt: string;
  // SQLite v1 supports one vehicle, whose stable database ID is always 1.
  vehicle: (Vehicle & { id: 1 }) | null;
  refuels: Refuel[];
  gaps: CoverageGap[];
};

export class BackupError extends Error {
  constructor(message = 'Záloha obsahuje neplatné alebo rozporné údaje.') {
    super(message);
    this.name = 'BackupError';
  }
}

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BackupError();
  const result = value as Record<string, unknown>;
  if (Object.keys(result).length !== keys.length || keys.some((key) => !Object.hasOwn(result, key)))
    throw new BackupError();
  return result;
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
    throw new BackupError();
  return value;
}
function items(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > MAX_BACKUP_ITEMS)
    throw new BackupError('Záloha môže obsahovať najviac 10 000 tankovaní a 10 000 medzier.');
  return value;
}

// Keep byte limits identical on Hermes and Node without requiring a TextEncoder polyfill.
function utf8Size(text: string): number {
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

// Return a fresh, canonical value. Untrusted JSON never reaches SQL directly.
export function validateBackup(value: unknown, today = localToday()): Backup {
  const data = object(value, ['format', 'version', 'exportedAt', 'vehicle', 'refuels', 'gaps']);
  if (data.format !== 'tankuj') throw new BackupError('Tento súbor nie je záloha Tankuj.');
  if (data.version !== 1) throw new BackupError('Táto verzia zálohy nie je podporovaná.');
  if (
    typeof data.exportedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.exportedAt) ||
    !Number.isFinite(Date.parse(data.exportedAt)) ||
    new Date(data.exportedAt).toISOString() !== data.exportedAt
  ) throw new BackupError();
  let vehicle: Backup['vehicle'] = null;
  if (data.vehicle !== null) {
    const v = object(data.vehicle, ['id', 'name', 'fuel']);
    if (v.id !== 1 || typeof v.name !== 'string' || !v.name.trim() || v.name.length > 40 ||
        (v.fuel !== 'Benzín' && v.fuel !== 'Diesel')) throw new BackupError();
    vehicle = { id: 1, name: v.name, fuel: v.fuel };
  }
  const ids = new Set<number>();
  const refuels = items(data.refuels).map((value): Refuel => {
    const r = object(value, ['id', 'date', 'odometerKm', 'volumeMl', 'amountCents', 'full', 'priceMode', 'unitPriceMilli']);
    const id = integer(r.id, 1, Number.MAX_SAFE_INTEGER - 1);
    if (ids.has(id)) throw new BackupError('Záloha obsahuje duplicitné identifikátory tankovaní.');
    ids.add(id);
    if (typeof r.date !== 'string' || typeof r.full !== 'boolean' ||
        (r.priceMode !== 'amount' && r.priceMode !== 'unit')) throw new BackupError();
    const record: Refuel = {
      id, date: r.date, full: r.full, priceMode: r.priceMode,
      odometerKm: integer(r.odometerKm, 0, 9_999_999),
      volumeMl: integer(r.volumeMl, 1, 10_000_000),
      amountCents: integer(r.amountCents, 1, 99_999_999),
      unitPriceMilli: r.priceMode === 'unit' ? integer(r.unitPriceMilli, 1, 100_000) : null,
    };
    if (r.priceMode === 'amount' && r.unitPriceMilli !== null) throw new BackupError();
    try {
      const checked = buildRefuel(draftFromRefuel(record), [], today);
      if (checked.amountCents !== record.amountCents) throw new BackupError();
    } catch {
      throw new BackupError();
    }
    return record;
  });
  const ordered = orderRefuels(refuels);
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].odometerKm <= ordered[i - 1].odometerKm)
      throw new BackupError('Dátumy a kilometre v zálohe si odporujú.');
  }
  const gapIds = new Set<number>();
  const gaps = items(data.gaps).map((value): CoverageGap => {
    const gap = object(value, ['id', 'atOdometerKm']);
    const id = integer(gap.id, 1, Number.MAX_SAFE_INTEGER - 1);
    if (gapIds.has(id)) throw new BackupError('Záloha obsahuje duplicitné identifikátory medzier.');
    gapIds.add(id);
    return { id, atOdometerKm: integer(gap.atOdometerKm, 0, 9_999_999) };
  });
  if (!vehicle && (refuels.length || gaps.length)) throw new BackupError();
  return { format: 'tankuj', version: 1, exportedAt: data.exportedAt, vehicle, refuels: ordered,
    gaps: gaps.sort((a, b) => a.atOdometerKm - b.atOdometerKm || a.id - b.id) };
}

export function parseBackup(text: string, today = localToday()): Backup {
  if (text.length > MAX_BACKUP_BYTES || utf8Size(text) > MAX_BACKUP_BYTES)
    throw new BackupError('Záloha je príliš veľká. Limit je 10 MB.');
  let value: unknown;
  try { value = JSON.parse(text); }
  catch { throw new BackupError('Súbor neobsahuje platnú JSON zálohu.'); }
  return validateBackup(value, today);
}

export function serializeBackup(snapshot: Snapshot, now = new Date()): string {
  const data = validateBackup({
    format: 'tankuj', version: 1, exportedAt: now.toISOString(),
    vehicle: snapshot.vehicle ? { id: 1, ...snapshot.vehicle } : null,
    refuels: snapshot.refuels, gaps: snapshot.gaps,
  }, localToday(now));
  const text = JSON.stringify(data, null, 2) + '\n';
  if (utf8Size(text) > MAX_BACKUP_BYTES)
    throw new BackupError('Záloha je príliš veľká. Limit je 10 MB.');
  return text;
}
