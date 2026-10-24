import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Amount,
  Button,
  Card,
  Copy,
  countLabel,
  dateLabel,
  Field,
  formatNumber,
  Heading,
  Page,
  RecordRow,
  SectionTitle,
  usePalette,
} from '@/components/tankuj-ui';
import { localToday, measure, measurementHelp, summarize } from '@/domain/fuel';
import type { FuelType } from '@/domain/fuel';
import { useFuel } from '@/state/fuel-store';

function Onboarding() {
  const c = usePalette();
  const { saveVehicle } = useFuel();
  const [fuel, setFuel] = useState<FuelType>('Benzín');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await saveVehicle({ name, fuel });
    } catch {
      setError('Auto sa nepodarilo uložiť. Skús to znova.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Page brand={false}>
      <Text
        accessibilityLabel="Tankuj"
        style={{
          color: c.green,
          fontSize: 52,
          letterSpacing: -3,
          fontWeight: '600',
          marginTop: 16,
        }}
      >
        tankuj.
      </Text>
      <Heading
        title={'Menej zadávania.\nViac prehľadu.'}
        subtitle="Zapíš tankovanie. Spoznaj svoju spotrebu a výdavky."
      />
      <Copy muted>Bez účtu. Funguje aj bez internetu.</Copy>
      <View style={{ gap: 10 }}>
        <SectionTitle>Na čo jazdíš?</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['Benzín', 'Diesel'] as const).map((value) => (
            <Pressable
              key={value}
              disabled={busy}
              accessibilityRole="radio"
              accessibilityState={{ checked: value === fuel, disabled: busy }}
              onPress={() => setFuel(value)}
              style={{
                flex: 1,
                backgroundColor: fuel === value ? c.green : c.paper,
                padding: 16,
                borderRadius: 14,
                minHeight: 52,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: fuel === value ? c.onGreen : c.text,
                  fontSize: 17,
                  fontWeight: '500',
                }}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Field
        label="Názov auta"
        help="Voliteľné — pokojne nechaj Moje auto."
        placeholder="Moje auto"
        value={name}
        onChangeText={setName}
        maxLength={40}
        editable={!busy}
      />
      {error ? <Copy error>{error}</Copy> : null}
      <Button title="Začať zapisovať" onPress={start} busy={busy} />
      <Copy small muted>
        História sa ukladá v tomto telefóne. Prístup k polohe ani registráciu nepotrebuješ.
      </Copy>
    </Page>
  );
}

export default function Overview() {
  const { vehicle, refuels, gaps } = useFuel();
  const c = usePalette();
  if (!vehicle) return <Onboarding />;
  const today = localToday();
  const summary = summarize(refuels, today.slice(0, 7));
  const result = measure(refuels, gaps);
  const latest = refuels.at(-1);
  const previous = refuels.at(-2);
  const delta =
    latest && previous
      ? (latest.amountCents * 10) / latest.volumeMl -
        (previous.amountCents * 10) / previous.volumeMl
      : null;
  const month = new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(
    new Date(today + 'T12:00:00'),
  );
  return (
    <Page tab="overview">
      <Heading title={'Tvoje jazdy.\nJasnejšie.'} subtitle={vehicle.name + ' · ' + vehicle.fuel} />
      <Card>
        <Copy small muted>
          {'ZAPLATENÉ · ' + month.toLocaleUpperCase('sk-SK')}
        </Copy>
        <Amount value={formatNumber(summary.monthlyCents / 100)} unit="€" />
        <Copy small muted>
          {countLabel(
            summary.monthlyCount,
            'evidované tankovanie',
            'evidované tankovania',
            'evidovaných tankovaní',
          )}
        </Copy>
        <View
          style={{ borderTopWidth: 1, borderColor: c.line, marginTop: 4, paddingTop: 16, gap: 4 }}
        >
          <Copy small muted>
            Priemerná spotreba
          </Copy>
          <Text
            style={{
              color: c.text,
              fontSize: 28,
              fontWeight: '500',
              fontVariant: ['tabular-nums'],
            }}
          >
            {result.average === null ? '—' : formatNumber(result.average) + ' l/100 km'}
          </Text>
          <Copy small muted>
            {result.intervals.length
              ? countLabel(
                  result.intervals.length,
                  'platný interval',
                  'platné intervaly',
                  'platných intervalov',
                ) +
                ' · od ' +
                dateLabel(result.intervals[0].start.date)
              : 'Zatiaľ bez platného merania'}
          </Copy>
        </View>
      </Card>
      <Button
        title="+ Pridať tankovanie"
        onPress={() => router.push('/refuel')}
        testID="add-refuel"
      />
      {result.state !== 'ready' ? (
        <Card soft>
          <SectionTitle>
            {refuels.length ? 'Každý záznam sa počíta' : 'Začni jedným tankovaním'}
          </SectionTitle>
          <Copy small>{measurementHelp(refuels, gaps)}</Copy>
        </Card>
      ) : delta !== null && latest && previous ? (
        <Card soft>
          <SectionTitle>Tvoja cena paliva</SectionTitle>
          <Copy small>
            {Math.abs(delta) < 0.0005
              ? 'Pri posledných dvoch tankovaniach bola cena za liter rovnaká.'
              : 'Pri poslednom tankovaní bol liter o ' +
                formatNumber(Math.abs(delta), 3) +
                ' € ' +
                (delta < 0 ? 'lacnejší.' : 'drahší.')}
          </Copy>
          <Copy small muted>
            {dateLabel(previous.date)} → {dateLabel(latest.date)}
          </Copy>
        </Card>
      ) : null}
      <SectionTitle>Posledné tankovanie</SectionTitle>
      {latest ? (
        <RecordRow record={latest} />
      ) : (
        <Copy small muted>
          Tvoja história sa začne prvým záznamom. Hneď uvidíš litre, zaplatenú sumu a cenu za liter.
        </Copy>
      )}
    </Page>
  );
}
