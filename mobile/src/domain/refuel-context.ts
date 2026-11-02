import { isDate, localToday, orderRefuels, parseScaled } from './fuel.ts';
import type { Refuel, RefuelDraft } from './fuel.ts';

export type RefuelContext =
  | { kind: 'invalid-date' }
  | { kind: 'needs-odometer'; sameDayCount: number }
  | { kind: 'neighbors'; previous?: Refuel; next?: Refuel; duplicate?: Refuel };

// Describe the candidate's chronological position without requiring litres or a
// price. This is guidance only; buildRefuel still validates every saved input.
export function refuelContext(
  draft: Pick<RefuelDraft, 'date' | 'odometer'>,
  existing: readonly Refuel[],
  excludeId?: number,
  today = localToday(),
): RefuelContext {
  if (!isDate(draft.date) || draft.date > today) return { kind: 'invalid-date' };
  const records = orderRefuels(existing.filter((record) => record.id !== excludeId));
  const parsed = parseScaled(draft.odometer, 0);
  const odometerKm = parsed !== null && parsed <= 9_999_999 ? parsed : null;
  const sameDayCount = records.filter((record) => record.date === draft.date).length;
  if (odometerKm === null && sameDayCount)
    return { kind: 'needs-odometer', sameDayCount };

  // With no same-day records the date alone determines both neighbors. With a
  // tachometer, use the same date/km ordering as the persisted history.
  const before = (record: Refuel) =>
    record.date < draft.date ||
    (record.date === draft.date && odometerKm !== null && record.odometerKm < odometerKm);
  const after = (record: Refuel) =>
    record.date > draft.date ||
    (record.date === draft.date && odometerKm !== null && record.odometerKm > odometerKm);
  return {
    kind: 'neighbors',
    previous: records.filter(before).at(-1),
    next: records.find(after),
    duplicate: records.find((record) => record.odometerKm === odometerKm),
  };
}
