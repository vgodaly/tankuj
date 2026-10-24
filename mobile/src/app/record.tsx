import { Redirect, router, Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import {
  Amount,
  Button,
  Card,
  Copy,
  dateLabel,
  formatNumber,
  Heading,
  Metric,
  money,
  Page,
  TextButton,
} from '@/components/tankuj-ui';
import type { DeleteReason } from '@/domain/fuel';
import { useFuel } from '@/state/fuel-store';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refuels, removeRefuel } = useFuel();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const writing = useRef(false);
  const disablePrevention = usePreventRemove(busy, () => {});
  const record = refuels.find((item) => item.id === Number(id));
  if (!record && busy) return null;
  if (!record) return <Redirect href="/history" />;
  async function remove(reason: DeleteReason) {
    if (writing.current || !record) return;
    writing.current = true;
    setBusy(true);
    setError('');
    try {
      await removeRefuel(record.id, reason);
      setBusy(false);
      disablePrevention();
      router.dismissTo('/history');
      AccessibilityInfo.announceForAccessibility('Tankovanie bolo vymazané.');
    } catch {
      setError('Tankovanie sa nepodarilo vymazať. Skús to znova.');
      AccessibilityInfo.announceForAccessibility('Vymazanie zlyhalo.');
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  function confirm(reason: DeleteReason) {
    if (!record || writing.current) return;
    Alert.alert(
      'Vymazať tankovanie?',
      dateLabel(record.date) +
        ' · ' +
        formatNumber(record.odometerKm, 0) +
        ' km · ' +
        money(record.amountCents) +
        '\n\n' +
        (reason === 'real'
          ? 'Skutočné tankovanie odstránime z platieb a histórie. Zostane medzera, aby neúplná evidencia neskreslila spotrebu. Vymazanie sa nedá vrátiť.'
          : 'Chybný alebo duplicitný záznam odstránime a štatistiky prepočítame. Existujúce medzery zachováme. Vymazanie sa nedá vrátiť.'),
      [
        { text: 'Ponechať', style: 'cancel' },
        { text: 'Vymazať', style: 'destructive', onPress: () => void remove(reason) },
      ],
    );
  }
  function chooseReason() {
    if (writing.current) return;
    Alert.alert(
      'Aký záznam chceš vymazať?',
      'Chybný záznam sa do histórie dostal omylom. Pri odstránení skutočného tankovania zostane evidencia neúplná.',
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Chybný alebo duplicitný', onPress: () => confirm('incorrect') },
        { text: 'Skutočné tankovanie', onPress: () => confirm('real') },
      ],
    );
  }
  return (
    <Page brand={false}>
      <Stack.Screen options={{ gestureEnabled: !busy }} />
      <TextButton
        title="← História"
        disabled={busy}
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
      {error ? <Copy error>{error}</Copy> : null}
      <Button
        title="Upraviť tankovanie"
        disabled={busy}
        onPress={() => {
          if (!writing.current) router.push({ pathname: '/refuel', params: { id: record.id } });
        }}
      />
      <TextButton
        title={busy ? 'Vymazávam…' : 'Vymazať tankovanie'}
        disabled={busy}
        destructive
        onPress={chooseReason}
      />
    </Page>
  );
}
