import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import {
  Amount,
  Button,
  Card,
  Copy,
  dateLabel,
  formatNumber,
  Heading,
  money,
  Page,
  SectionTitle,
  usePalette,
} from '@/components/tankuj-ui';
import { measure, measurementHelp } from '@/domain/fuel';
import { useFuel } from '@/state/fuel-store';

export default function Saved() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refuels, gaps } = useFuel();
  const c = usePalette();
  const record = refuels.find((item) => item.id === Number(id));
  const interval = measure(refuels, gaps).intervals.find((item) => item.end.id === Number(id));
  useEffect(() => {
    if (record) AccessibilityInfo.announceForAccessibility('Tankovanie uložené.');
  }, [record]);
  if (!record) return <Redirect href="/" />;
  return (
    <Page brand={false}>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ color: c.green, fontSize: 40 }}
      >
        ✓
      </Text>
      <Heading title="Tankovanie uložené" subtitle="O jeden záznam bližšie k lepšiemu prehľadu." />
      <Card>
        <Amount value={money(record.amountCents)} />
        <Copy muted>
          {formatNumber(record.volumeMl / 1000)} l ·{' '}
          {formatNumber((record.amountCents * 10) / record.volumeMl, 3)} €/l
        </Copy>
      </Card>
      <Card soft>
        {interval ? (
          <>
            <SectionTitle>{formatNumber(interval.consumption)} l/100 km</SectionTitle>
            <Copy small>
              Spotreba na {formatNumber(interval.distanceKm, 0)} km medzi{' '}
              {dateLabel(interval.start.date)} a {dateLabel(interval.end.date)}.
            </Copy>
          </>
        ) : (
          <>
            <SectionTitle>
              {record.full ? 'Plná nádrž je základ merania' : 'Aj čiastočné tankovanie sa počíta'}
            </SectionTitle>
            <Copy small>{measurementHelp(refuels, gaps)}</Copy>
          </>
        )}
      </Card>
      <Button title="Späť na prehľad" onPress={() => router.replace('/')} />
    </Page>
  );
}
