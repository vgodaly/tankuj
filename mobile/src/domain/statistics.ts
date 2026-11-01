import { isDate, orderRefuels } from './fuel.ts';
import type { Refuel } from './fuel.ts';

export type MonthlyPayment = { month: string; amountCents: number; count: number };

const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 1;

// Calendar keys avoid UTC/local shifts and Date's special handling of years 0–99.
export function monthlyPayments(refuels: readonly Refuel[], currentMonth: string): MonthlyPayment[] {
  if (!isDate(currentMonth + '-01')) throw new Error('Neplatný kalendárny mesiac.');
  const records = orderRefuels(refuels);
  if (!records.length) return [];
  const totals = new Map<string, MonthlyPayment>();
  for (const record of records) {
    const month = record.date.slice(0, 7);
    const total = totals.get(month) ?? { month, amountCents: 0, count: 0 };
    total.amountCents += record.amountCents;
    total.count += 1;
    totals.set(month, total);
  }
  const current = monthIndex(currentMonth);
  const start = Math.min(monthIndex(records[0].date.slice(0, 7)), current);
  // Retain existing dated entries even if the device clock is moved backwards.
  const end = Math.max(monthIndex(records.at(-1)!.date.slice(0, 7)), current);
  const result: MonthlyPayment[] = [];
  for (let index = start; index <= end; index++) {
    const month = String(Math.floor(index / 12)).padStart(4, '0') + '-' +
      String(index % 12 + 1).padStart(2, '0');
    result.push(totals.get(month) ?? { month, amountCents: 0, count: 0 });
  }
  return result;
}
