export type FuelType = 'Benzín' | 'Diesel';
export type Vehicle = { name: string; fuel: FuelType };
export type Refuel = {
  id: number;
  date: string;
  odometerKm: number;
  volumeMl: number;
  amountCents: number;
  full: boolean;
  priceMode: 'amount' | 'unit';
  unitPriceMilli: number | null;
};
export type CoverageGap = { id: number; atOdometerKm: number };
export type Snapshot = { vehicle: Vehicle | null; refuels: Refuel[]; gaps: CoverageGap[] };
export type RefuelDraft = {
  date: string;
  odometer: string;
  liters: string;
  price: string;
  priceMode: 'amount' | 'unit';
  full: boolean;
  missed: boolean;
};
export type FieldErrors = Partial<Record<'date' | 'odometer' | 'liters' | 'price', string>>;
export class ValidationError extends Error {
  errors: FieldErrors;
  constructor(errors: FieldErrors) {
    super('Skontroluj označené údaje.');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export function localToday(now = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseScaled(raw: string, decimals: number): number | null {
  const value = raw.trim().replace(',', '.');
  if (value.length > 24 || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const [integer, fraction = ''] = value.split('.');
  if (fraction.length > decimals) return null;
  const result = Number(BigInt(integer + fraction.padEnd(decimals, '0')));
  return Number.isSafeInteger(result) ? result : null;
}

export function centsFromUnitPrice(volumeMl: number, unitPriceMilli: number): number {
  if (![volumeMl, unitPriceMilli].every((value) => Number.isSafeInteger(value) && value > 0)) {
    throw new Error('Neplatný objem alebo cena.');
  }
  // ml × thousandths of EUR/l → cents; half-up without binary rounding.
  const cents = Number((BigInt(volumeMl) * BigInt(unitPriceMilli) + 5000n) / 10000n);
  if (!Number.isSafeInteger(cents)) throw new Error('Suma je mimo podporovaného rozsahu.');
  return cents;
}

export function orderRefuels(refuels: readonly Refuel[]): Refuel[] {
  return [...refuels].sort((a, b) => a.date.localeCompare(b.date) || a.odometerKm - b.odometerKm);
}

export function buildRefuel(
  draft: RefuelDraft,
  existing: readonly Refuel[],
  today = localToday(),
): Omit<Refuel, 'id'> {
  const errors: FieldErrors = {};
  const odometerKm = parseScaled(draft.odometer, 0);
  const volumeMl = parseScaled(draft.liters, 3);
  const price = parseScaled(draft.price, draft.priceMode === 'amount' ? 2 : 3);
  if (odometerKm === null || odometerKm > 9_999_999)
    errors.odometer = 'Zadaj celé kilometre od 0 do 9 999 999.';
  if (volumeMl === null || volumeMl <= 0 || volumeMl > 10_000_000)
    errors.liters = 'Zadaj kladné litre, najviac 10 000 a 3 desatinné miesta.';
  if (
    price === null ||
    price <= 0 ||
    price > (draft.priceMode === 'amount' ? 99_999_999 : 100_000)
  ) {
    errors.price =
      draft.priceMode === 'amount'
        ? 'Zadaj kladnú sumu do 999 999,99 €, najviac na 2 desatinné miesta.'
        : 'Zadaj cenu do 100 €/l, najviac na 3 desatinné miesta.';
  }
  if (!isDate(draft.date) || draft.date > today)
    errors.date = 'Zadaj platný dátum, najneskôr dnešný.';
  if (odometerKm !== null && !errors.date) {
    const conflict = existing.some(
      (record) =>
        record.odometerKm === odometerKm ||
        (record.date < draft.date && record.odometerKm >= odometerKm) ||
        (record.date > draft.date && record.odometerKm <= odometerKm),
    );
    if (conflict)
      errors.odometer = 'Kilometre nesedia s históriou. Skontroluj tachometer aj dátum.';
  }
  let amountCents = 0;
  if (!errors.price && !errors.liters && price !== null && volumeMl !== null) {
    amountCents = draft.priceMode === 'amount' ? price : centsFromUnitPrice(volumeMl, price);
    if (amountCents < 1 || amountCents > 99_999_999)
      errors.price = 'Výsledná suma musí byť od 0,01 € do 999 999,99 €.';
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return {
    date: draft.date,
    odometerKm: odometerKm!,
    volumeMl: volumeMl!,
    amountCents,
    full: draft.full,
    priceMode: draft.priceMode,
    unitPriceMilli: draft.priceMode === 'unit' ? price : null,
  };
}

export type Interval = {
  start: Refuel;
  end: Refuel;
  distanceKm: number;
  volumeMl: number;
  consumption: number;
};
export function measure(refuels: readonly Refuel[], gaps: readonly CoverageGap[]) {
  const intervals: Interval[] = [];
  let baseline: Refuel | null = null;
  let volumeMl = 0;
  let interrupted = false;
  for (const record of orderRefuels(refuels)) {
    if (
      baseline &&
      gaps.some(
        (gap) => gap.atOdometerKm > baseline!.odometerKm && gap.atOdometerKm <= record.odometerKm,
      )
    ) {
      baseline = null;
      volumeMl = 0;
      interrupted = true;
    }
    if (!baseline) {
      if (record.full) baseline = record;
      continue;
    }
    volumeMl += record.volumeMl;
    if (record.full) {
      const distanceKm = record.odometerKm - baseline.odometerKm;
      if (distanceKm > 0)
        intervals.push({
          start: baseline,
          end: record,
          distanceKm,
          volumeMl,
          consumption: volumeMl / (distanceKm * 10),
        });
      baseline = record;
      volumeMl = 0;
    }
  }
  const distanceKm = intervals.reduce((sum, interval) => sum + interval.distanceKm, 0);
  const totalMl = intervals.reduce((sum, interval) => sum + interval.volumeMl, 0);
  const last = orderRefuels(refuels).at(-1);
  const pendingGap = last
    ? gaps.some((gap) => gap.atOdometerKm > last.odometerKm)
    : gaps.length > 0;
  return {
    intervals,
    distanceKm,
    average: distanceKm ? totalMl / (distanceKm * 10) : null,
    state:
      pendingGap || (interrupted && !baseline)
        ? 'gap'
        : !baseline
          ? 'no-baseline'
          : (last && !last.full) || !intervals.length
            ? 'waiting'
            : 'ready',
  };
}

export function measurementHelp(refuels: readonly Refuel[], gaps: readonly CoverageGap[]): string {
  const result = measure(refuels, gaps);
  if (result.state === 'gap')
    return 'Po vynechanom tankovaní začneme merať od ďalšej plnej nádrže.';
  if (result.state === 'no-baseline')
    return 'Pri najbližšom tankovaní do plnej začneme merať spotrebu.';
  if (result.state === 'waiting')
    return 'Spotrebu dopočítame pri ďalšom tankovaní do plnej. Priebežné litre započítame automaticky.';
  return 'Počítame iba z úplných intervalov medzi plnými nádržami.';
}

export function summarize(refuels: readonly Refuel[], month: string) {
  const monthly = refuels.filter((record) => record.date.startsWith(month + '-'));
  const totalCents = refuels.reduce((sum, record) => sum + BigInt(record.amountCents), 0n);
  const totalMl = refuels.reduce((sum, record) => sum + BigInt(record.volumeMl), 0n);
  return {
    monthlyCount: monthly.length,
    monthlyCents: monthly.reduce((sum, record) => sum + record.amountCents, 0),
    totalCents: Number(totalCents),
    totalMl: Number(totalMl),
    averagePrice: totalMl > 0n ? (Number(totalCents) * 10) / Number(totalMl) : null,
  };
}
