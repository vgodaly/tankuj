import { Redirect, router, useLocalSearchParams } from 'expo-router';
import {
  Amount,
  Card,
  dateLabel,
  formatNumber,
  Heading,
  Metric,
  money,
  Page,
  TextButton,
} from '@/components/tankuj-ui';
import { useFuel } from '@/state/fuel-store';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refuels } = useFuel();
  const record = refuels.find((item) => item.id === Number(id));
  if (!record) return <Redirect href="/history" />;
  return (
    <Page brand={false}>
      <TextButton
        title="← História"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/history'))}
      />
      <Heading
        title="Tankovanie"
        subtitle={
          dateLabel(record.date) + ' · ' + (record.full ? 'Plná nádrž' : 'Čiastočné tankovanie')
        }
      />
      <Card>
        <Amount value={money(record.amountCents)} />
        <Metric label="Stav tachometra" value={formatNumber(record.odometerKm, 0) + ' km'} />
        <Metric label="Natankované" value={formatNumber(record.volumeMl / 1000, 3) + ' l'} />
        <Metric
          label="Efektívna cena za liter"
          value={formatNumber((record.amountCents * 10) / record.volumeMl, 3) + ' €/l'}
        />
        {record.unitPriceMilli !== null ? (
          <Metric
            label="Pôvodná zadaná cena za liter"
            value={formatNumber(record.unitPriceMilli / 1000, 3) + ' €/l'}
          />
        ) : null}
      </Card>
    </Page>
  );
}
