import { Redirect, router, Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';
import {
  Button,
  Copy,
  dateLabel,
  Field,
  formatNumber,
  Heading,
  money,
  Page,
  TextButton,
  usePalette,
} from '@/components/tankuj-ui';
import {
  buildRefuel,
  centsFromUnitPrice,
  draftFromRefuel,
  gapAnchorsForEdit,
  isDate,
  localToday,
  parseScaled,
  ValidationError,
} from '@/domain/fuel';
import type { FieldErrors, Refuel, RefuelDraft } from '@/domain/fuel';
import { useFuel } from '@/state/fuel-store';

function isoDate(value: string) {
  const match = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/.exec(value.trim());
  return match
    ? match[3] + '-' + match[2].padStart(2, '0') + '-' + match[1].padStart(2, '0')
    : value.trim();
}

export default function RefuelForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { refuels } = useFuel();
  const record = id === undefined ? undefined : refuels.find((item) => item.id === Number(id));
  if (id !== undefined && !record) return <Redirect href="/history" />;
  return <RefuelEditor key={record?.id ?? 'new'} record={record} />;
}

function RefuelEditor({ record }: { record?: Refuel }) {
  const { vehicle, refuels, gaps, saveRefuel, editRefuel } = useFuel();
  const c = usePalette();
  const [draft, setDraft] = useState<RefuelDraft>(() =>
    record
      ? {
          ...draftFromRefuel(record),
          date: record.date.split('-').reverse().join('.'),
        }
      : {
          date: localToday().split('-').reverse().join('.'),
          odometer: '',
          liters: '',
          price: '',
          priceMode: 'amount',
          full: false,
          missed: false,
        },
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const writing = useRef(false);
  const odometerRef = useRef<ComponentRef<typeof TextInput>>(null);
  const litersRef = useRef<ComponentRef<typeof TextInput>>(null);
  const priceRef = useRef<ComponentRef<typeof TextInput>>(null);
  const dateRef = useRef<ComponentRef<typeof TextInput>>(null);
  const disablePrevention = usePreventRemove(dirty || busy, ({ repeat }) => {
    if (writing.current) return;
    Alert.alert('Zahodiť zmeny?', 'Neuložené údaje sa stratia.', [
      { text: 'Pokračovať v úprave', style: 'cancel' },
      {
        text: 'Zahodiť',
        style: 'destructive',
        onPress: () => {
          setDirty(false);
          repeat();
        },
      },
    ]);
  });
  if (!vehicle) return <Redirect href="/" />;
  function update<K extends keyof RefuelDraft>(key: K, value: RefuelDraft[K]) {
    setDirty(true);
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function changeMode(mode: RefuelDraft['priceMode']) {
    if (mode === draft.priceMode) return;
    const change = () => {
      setDraft((previous) => ({ ...previous, priceMode: mode, price: '' }));
      setDirty(true);
      setErrors({});
    };
    if (draft.price.trim())
      Alert.alert(
        'Zmeniť spôsob zadania?',
        'Aktuálnu cenu vymažeme. Novú hodnotu zadaj z účtenky, aby zaokrúhlenie nezmenilo zaplatenú sumu.',
        [
          { text: 'Ponechať', style: 'cancel' },
          { text: 'Zmeniť', onPress: change },
        ],
      );
    else change();
  }
  async function save() {
    if (writing.current) return;
    const input = { ...draft, date: isoDate(draft.date) };
    setErrors({});
    setError('');
    try {
      buildRefuel(
        input,
        refuels.filter((item) => item.id !== record?.id),
      );
      writing.current = true;
      setBusy(true);
      const id = record ? record.id : await saveRefuel(input);
      if (record) await editRefuel(record.id, input);
      setDirty(false);
      setBusy(false);
      disablePrevention();
      if (record) router.dismissTo({ pathname: '/record', params: { id } });
      else router.replace({ pathname: '/saved', params: { id } });
      AccessibilityInfo.announceForAccessibility(
        record ? 'Zmeny boli uložené.' : 'Tankovanie bolo uložené.',
      );
    } catch (caught) {
      if (caught instanceof ValidationError) {
        setErrors(caught.errors);
        if (caught.errors.date) setMore(true);
        const first = (['odometer', 'liters', 'price', 'date'] as const).find(
          (key) => caught.errors[key],
        );
        const refs = { odometer: odometerRef, liters: litersRef, price: priceRef, date: dateRef };
        if (first) requestAnimationFrame(() => refs[first].current?.focus());
        AccessibilityInfo.announceForAccessibility('Skontroluj označené údaje.');
      } else {
        setError('Tankovanie sa nepodarilo uložiť. Údaje zostali vo formulári. Skús to znova.');
        AccessibilityInfo.announceForAccessibility('Uloženie zlyhalo. Údaje zostali vo formulári.');
      }
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  const liters = parseScaled(draft.liters, 3);
  const price = parseScaled(draft.price, draft.priceMode === 'amount' ? 2 : 3);
  let preview = '';
  if (liters && liters <= 10_000_000 && price && price <= 99_999_999) {
    preview =
      draft.priceMode === 'amount'
        ? 'Vypočítaná cena: ' + formatNumber((price * 10) / liters, 3) + ' €/l'
        : 'Vypočítaná suma: ' + money(centsFromUnitPrice(liters, price));
  }
  const last = refuels.at(-1);
  let movingGap = false;
  if (record) {
    try {
      const updated = buildRefuel(
        { ...draft, date: isoDate(draft.date) },
        refuels.filter((item) => item.id !== record.id),
      );
      movingGap = gapAnchorsForEdit(record, updated, refuels, gaps).length > 0;
    } catch {
      /* Inline validation is shown on save. */
    }
  }
  return (
    <Page brand={false}>
      <Stack.Screen options={{ gestureEnabled: !busy }} />
      <TextButton
        title="Zrušiť"
        disabled={busy}
        onPress={() => {
          if (!writing.current) router.canGoBack() ? router.back() : router.replace('/');
        }}
      />
      <Heading
        title={record ? 'Upraviť tankovanie' : 'Nové tankovanie'}
        subtitle={
          record
            ? 'Oprav údaje podľa účtenky a palubnej dosky.'
            : 'Tri údaje z účtenky a palubnej dosky.'
        }
      />
      {movingGap ? (
        <Copy small>
          Presúvaš záznam pri neúplnej evidencii. Medzery zachováme aj pri pôvodnom a novom stave
          tachometra; dotknuté úseky nezahrnieme do spotreby.
        </Copy>
      ) : null}
      <Field
        inputRef={odometerRef}
        label="Stav tachometra · km"
        value={draft.odometer}
        onChangeText={(value) => update('odometer', value)}
        keyboardType="number-pad"
        maxLength={12}
        editable={!busy}
        error={errors.odometer}
        help={
          last
            ? 'Posledný záznam: ' + formatNumber(last.odometerKm, 0) + ' km'
            : 'Aktuálny stav na palubnej doske.'
        }
      />
      <Field
        inputRef={litersRef}
        label="Natankované litre · l"
        value={draft.liters}
        onChangeText={(value) => update('liters', value)}
        keyboardType="decimal-pad"
        maxLength={16}
        editable={!busy}
        error={errors.liters}
        placeholder="napr. 32,50"
      />
      <View style={{ gap: 10 }}>
        <Copy small>Čo zadáš z účtenky?</Copy>
        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            gap: 4,
            backgroundColor: c.soft,
            borderRadius: 12,
          }}
        >
          {(
            [
              { mode: 'amount', title: 'Celkovú sumu' },
              { mode: 'unit', title: 'Cenu za liter' },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.mode}
              disabled={busy}
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.priceMode === item.mode, disabled: busy }}
              onPress={() => changeMode(item.mode)}
              style={{
                flex: 1,
                minHeight: 46,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 8,
                borderRadius: 9,
                backgroundColor: draft.priceMode === item.mode ? c.paper : 'transparent',
              }}
            >
              <Text
                style={{
                  color: draft.priceMode === item.mode ? c.text : c.muted,
                  fontWeight: '500',
                  fontSize: 15,
                }}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Field
        inputRef={priceRef}
        label={draft.priceMode === 'amount' ? 'Zaplatená suma · €' : 'Cena za liter · €/l'}
        value={draft.price}
        onChangeText={(value) => update('price', value)}
        keyboardType="decimal-pad"
        maxLength={16}
        editable={!busy}
        error={errors.price}
      />
      {preview ? (
        <Copy small muted>
          {preview}
        </Copy>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Copy>Do plnej nádrže</Copy>
          <Copy small muted>
            Plná nádrž nám pomáha merať spotrebu.
          </Copy>
        </View>
        <Switch
          accessibilityLabel="Do plnej nádrže"
          value={draft.full}
          disabled={busy}
          onValueChange={(value) => update('full', value)}
          trackColor={{ false: c.line, true: c.green }}
        />
      </View>
      <TextButton
        title={more ? 'Skryť ďalšie možnosti ↑' : 'Dátum a ďalšie možnosti →'}
        disabled={busy}
        onPress={() => {
          if (!busy) setMore((value) => !value);
        }}
      />
      {more ? (
        <>
          <Field
            inputRef={dateRef}
            label="Dátum tankovania"
            help="Deň.mesiac.rok, napríklad 24.10.2026."
            value={draft.date}
            onChangeText={(value) => update('date', value)}
            keyboardType="numbers-and-punctuation"
            maxLength={14}
            editable={!busy}
            error={errors.date}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Copy>Vynechal som tankovanie</Copy>
              <Copy small muted>
                Od predchádzajúceho záznamu niektoré tankovanie chýba. Tento úsek nezahrnieme do
                spotreby.
              </Copy>
            </View>
            <Switch
              accessibilityLabel="Od predchádzajúceho záznamu som vynechal tankovanie"
              value={draft.missed}
              disabled={busy}
              onValueChange={(value) => update('missed', value)}
              trackColor={{ false: c.line, true: c.green }}
            />
          </View>
          {record && gaps.length > 0 ? (
            <Copy small muted>
              Existujúce medzery zostávajú zachované. Táto voľba pridá označenie chýbajúceho
              tankovania; vypnutie voľby staršie medzery neodstráni.
            </Copy>
          ) : null}
        </>
      ) : (
        <Copy small muted>
          {'Dátum: ' + (isDate(isoDate(draft.date)) ? dateLabel(isoDate(draft.date)) : draft.date)}
        </Copy>
      )}
      {error ? <Copy error>{error}</Copy> : null}
      <Button
        title={record ? 'Uložiť zmeny' : 'Uložiť tankovanie'}
        onPress={save}
        busy={busy}
        testID="save-refuel"
      />
    </Page>
  );
}
