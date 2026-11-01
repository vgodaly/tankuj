import { orderRefuels } from './fuel.ts';
import type { CoverageGap, Refuel } from './fuel.ts';

export type CoverageSection = {
  start: Refuel | null;
  end: Refuel | null;
  gaps: CoverageGap[];
};

export class CoverageChangedError extends Error {
  constructor() {
    super('Úsek sa medzitým zmenil. Skontroluj históriu a potvrď ho znova.');
    this.name = 'CoverageChangedError';
  }
}

// Points at an existing fill belong to the section immediately before that fill.
// Backfilling changes the displayed boundaries but never clears a point by itself.
export function coverageSections(
  refuels: readonly Refuel[],
  gaps: readonly CoverageGap[],
): CoverageSection[] {
  const records = orderRefuels(refuels);
  const orderedGaps = [...gaps].sort((a, b) => a.atOdometerKm - b.atOdometerKm || a.id - b.id);
  const sections = new Map<number, CoverageSection>();
  let index = 0;
  for (const gap of orderedGaps) {
    while (index < records.length && records[index].odometerKm < gap.atOdometerKm) index++;
    let section = sections.get(index);
    if (!section) {
      section = { start: records[index - 1] ?? null, end: records[index] ?? null, gaps: [] };
      sections.set(index, section);
    }
    section.gaps.push({ ...gap });
  }
  return [...sections.values()];
}

// Include boundary inputs and all point identities to reject a stale confirmation,
// including reuse of the same IDs after a JSON restore with different contents.
export function coverageSectionKey(section: CoverageSection): string {
  const boundary = (record: Refuel | null) => record ? [
    record.id, record.date, record.odometerKm, record.volumeMl, record.amountCents,
    record.full, record.priceMode, record.unitPriceMilli,
  ] : null;
  return JSON.stringify([
    boundary(section.start), boundary(section.end),
    [...section.gaps].sort((a, b) => a.id - b.id).map((gap) => [gap.id, gap.atOdometerKm]),
  ]);
}
