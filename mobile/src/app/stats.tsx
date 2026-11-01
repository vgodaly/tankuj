import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { BarChart } from '@/components/bar-chart';
import {
  Amount,
  Card,
  Copy,
  countLabel,
  dateLabel,
  formatNumber,
  Heading,
  Metric,
  money,
  Page,
  SectionTitle,
  TextButton,
} from '@/components/tankuj-ui';
import { localToday, measure, measurementHelp, orderRefuels, summarize } from '@/domain/fuel';
import { monthlyPayments } from '@/domain/statistics';
import { useFuel } from '@/state/fuel-store';

const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(
    new Date(month + '-01T12:00:00'),
  );

export default function Statistics() {
  const { vehicle, refuels, gaps } = useFuel();
  if (!vehicle) return <Redirect href="/" />;
  const month = localToday().slice(0, 7);
  const result = measure(refuels, gaps);
  const summary = summarize(refuels, month);
  return (
    <Page tab="stats">
      <Heading title="Štatistiky" subtitle="Vlastné údaje. Zrozumiteľné súvislosti." />
      <Card>
        <Copy small muted>
          CELKOVÁ SPOTREBA
        </Copy>
        <Amount
          value={result.average === null ? '—' : formatNumber(result.average)}
          accessibilityLabel={
            result.average === null
              ? 'Celková spotreba zatiaľ nie je dostupná'
              : `Celková spotreba: ${formatNumber(result.average)} litrov na 100 km`
          }
        />
        <Copy small muted>
          l/100 km · vážené vzdialenosťou
        </Copy>
        {result.intervals.length ? (
          <Copy small muted>
            {dateLabel(result.intervals[0].start.date)} –{' '}
            {dateLabel(result.intervals.at(-1)!.end.date)}
            {'\n'}
            {countLabel(
              result.intervals.length,
              'platný interval',
              'platné intervaly',
              'platných intervalov',
            )}{' '}
            · {formatNumber(result.distanceKm, 0)} km
          </Copy>
        ) : (
          <Copy small>{measurementHelp(refuels, gaps)}</Copy>
        )}
      </Card>
      {gaps.length ? (
        <Card warning>
          <SectionTitle>Niektoré údaje chýbajú</SectionTitle>
          <Copy small>
            Neúplné úseky vynechávame zo spotreby. Platby obsahujú iba zapísané tankovania.
          </Copy>
          <TextButton title="Skontrolovať medzery →" onPress={() => router.push('/coverage')} />
        </Card>
      ) : null}
      <BarChart
        title="Spotreba po intervaloch"
        description="Iba úplné intervaly medzi plnými nádržami, nie kalendárne mesiace. Neúplné úseky nespájame."
        scaleLabel={(max) => `Spoločná mierka od 0 do ${formatNumber(max)} l/100 km.`}
        emptyMessage={measurementHelp(refuels, gaps)}
        points={result.intervals.map((interval) => ({
          key: String(interval.end.id),
          label: `${dateLabel(interval.start.date)} – ${dateLabel(interval.end.date)}`,
          value: interval.consumption,
          valueLabel: `${formatNumber(interval.consumption)} l/100 km`,
          detail: `${formatNumber(interval.start.odometerKm, 0)} → ${formatNumber(interval.end.odometerKm, 0)} km · ${formatNumber(interval.distanceKm, 0)} km · ${formatNumber(interval.volumeMl / 1000, 3)} l`,
        }))}
      />
      <BarChart
        title="Cena za liter pri tankovaní"
        description="Efektívna cena zo zaplatenej sumy a litrov pri každom zázname. Nejde o trhovú cenu paliva."
        scaleLabel={(max) => `Spoločná mierka od 0 do ${formatNumber(max, 3)} €/l.`}
        emptyMessage="Cenu za liter uvidíš po prvom zapísanom tankovaní."
        points={orderRefuels(refuels).map((record) => ({
          key: String(record.id),
          label: dateLabel(record.date),
          value: record.amountCents * 10 / record.volumeMl,
          valueLabel: `${formatNumber(record.amountCents * 10 / record.volumeMl, 3)} €/l`,
          detail: `${formatNumber(record.odometerKm, 0)} km · ${money(record.amountCents)} / ${formatNumber(record.volumeMl / 1000, 3)} l`,
        }))}
      />
      <BarChart
        title="Mesačné platby"
        description="Súčet zapísaných platieb podľa dátumu tankovania vrátane čiastočných nádrží. Nula znamená mesiac bez záznamov."
        scaleLabel={(max) => `Spoločná mierka od 0 do ${money(max)}.`}
        emptyMessage="Mesačné platby uvidíš po prvom zapísanom tankovaní."
        points={monthlyPayments(refuels, month).map((payment) => ({
          key: payment.month,
          label: monthLabel(payment.month),
          value: payment.amountCents,
          valueLabel: money(payment.amountCents),
          detail: countLabel(payment.count, 'tankovanie', 'tankovania', 'tankovaní') +
            (payment.month === month ? ' · prebiehajúci mesiac' : '') +
            (payment.count === 0 ? ' · 0 € v evidencii' : ''),
        }))}
      />
      <View>
        <SectionTitle>Zaplatené palivo</SectionTitle>
        <Metric label="Celkom v evidencii" value={money(summary.totalCents)} />
        <Metric label="Natankované" value={formatNumber(summary.totalMl / 1000) + ' l'} />
        <Metric
          label="Priemerná cena za liter"
          value={
            summary.averagePrice === null ? '—' : formatNumber(summary.averagePrice, 3) + ' €/l'
          }
        />
      </View>
      <Copy small muted>
        Platby za tankovania sa nemusia rovnať hodnote paliva spotrebovaného v tom istom mesiaci.
      </Copy>
    </Page>
  );
}
