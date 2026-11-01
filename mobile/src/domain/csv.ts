import { orderRefuels } from './fuel.ts';
import type { Snapshot } from './fuel.ts';

const HEADERS = [
  'ID tankovania', 'Vozidlo', 'Palivo', 'Dátum', 'Tachometer (km)', 'Litre (l)',
  'Suma (EUR)', 'Zadanie ceny', 'Zadaná cena (EUR/l)', 'Efektívna cena (EUR/l)',
  'Plná nádrž', 'Medzera pred tankovaním', 'Medzera po poslednom tankovaní',
];

function decimal(value: number, places: number): string {
  const digits = String(value).padStart(places + 1, '0');
  return digits.slice(0, -places) + ',' + digits.slice(-places);
}

function cell(value: string | number): string {
  let text = String(value);
  // Quoting alone does not stop spreadsheet formula evaluation in user-entered names.
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function serializeCsv(snapshot: Snapshot): string {
  const records = orderRefuels(snapshot.refuels);
  const lines = [HEADERS.map(cell).join(';')];
  records.forEach((record, index) => {
    const previousKm = records[index - 1]?.odometerKm ?? -1;
    const gapBefore = snapshot.gaps.some(
      (gap) => gap.atOdometerKm > previousKm && gap.atOdometerKm <= record.odometerKm,
    );
    const gapAfter = index === records.length - 1 && snapshot.gaps.some(
      (gap) => gap.atOdometerKm > record.odometerKm,
    );
    // Rounded display price in thousandths, without changing the stored receipt total.
    const volume = BigInt(record.volumeMl);
    const effectivePrice = Number((BigInt(record.amountCents) * 10_000n + volume / 2n) / volume);
    lines.push([
      record.id, snapshot.vehicle?.name ?? '', snapshot.vehicle?.fuel ?? '', record.date,
      record.odometerKm, decimal(record.volumeMl, 3), decimal(record.amountCents, 2),
      record.priceMode === 'unit' ? 'Cena za liter' : 'Suma',
      record.unitPriceMilli === null ? '' : decimal(record.unitPriceMilli, 3),
      decimal(effectivePrice, 3), record.full ? 'Áno' : 'Nie', gapBefore ? 'Áno' : 'Nie',
      gapAfter ? 'Áno' : 'Nie',
    ].map(cell).join(';'));
  });
  // UTF-8 BOM for Excel, semicolon delimiter and decimal comma for Slovak locales.
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
