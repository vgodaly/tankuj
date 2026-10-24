import { Redirect } from 'expo-router';
import { View } from 'react-native';
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
} from '@/components/tankuj-ui';
import { localToday, measure, measurementHelp, summarize } from '@/domain/fuel';
import { useFuel } from '@/state/fuel-store';

export default function Statistics() {
  const { vehicle, refuels, gaps } = useFuel();
  if (!vehicle) return <Redirect href="/" />;
  const result = measure(refuels, gaps);
  const summary = summarize(refuels, localToday().slice(0, 7));
  return (
    <Page tab="stats">
      <Heading title="Štatistiky" subtitle="Vlastné údaje. Zrozumiteľné súvislosti." />
      <Card>
        <Copy small muted>
          CELKOVÁ SPOTREBA
        </Copy>
        <Amount value={result.average === null ? '—' : formatNumber(result.average)} />
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
        </Card>
      ) : null}
      {result.intervals.length ? (
        <>
          <SectionTitle>Spotreba po intervaloch</SectionTitle>
          <Copy small muted>
            Intervaly medzi plnými nádržami, nie kalendárne mesiace.
          </Copy>
          {[...result.intervals].reverse().map((interval) => (
            <Card key={interval.end.id}>
              <Copy small muted>
                {dateLabel(interval.start.date)} – {dateLabel(interval.end.date)}
              </Copy>
              <SectionTitle>{formatNumber(interval.consumption)} l/100 km</SectionTitle>
              <Copy small muted>
                {formatNumber(interval.distanceKm, 0)} km · {formatNumber(interval.volumeMl / 1000)}{' '}
                l
              </Copy>
            </Card>
          ))}
        </>
      ) : null}
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
