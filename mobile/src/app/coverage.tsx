import { Redirect, router, Stack, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import {
  Button, Card, Copy, dateLabel, formatNumber, Heading, Page, SectionTitle, TextButton,
} from '@/components/tankuj-ui';
import { CoverageChangedError, coverageSectionKey, coverageSections } from '@/domain/coverage';
import type { CoverageSection } from '@/domain/coverage';
import type { Refuel } from '@/domain/fuel';
import { useFuel } from '@/state/fuel-store';

const boundaryLabel = (record: Refuel) =>
  `${dateLabel(record.date)} · ${formatNumber(record.odometerKm, 0)} km`;

function sectionLabel(section: CoverageSection): string {
  if (section.start && section.end)
    return `${boundaryLabel(section.start)} → ${boundaryLabel(section.end)}`;
  if (section.start) return `Po tankovaní ${boundaryLabel(section.start)}`;
  if (section.end) return `Pred tankovaním ${boundaryLabel(section.end)}`;
  return 'História zatiaľ nemá tankovania';
}

export default function CoverageScreen() {
  const { vehicle, refuels, gaps, completeCoverage } = useFuel();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  usePreventRemove(busy, () => {});
  if (!vehicle) return <Redirect href="/" />;
  const sections = coverageSections(refuels, gaps);

  async function complete(section: CoverageSection) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await completeCoverage(section);
      const message = 'Úplnosť vybraného úseku bola potvrdená. Spotrebu sme prepočítali.';
      setNotice(message);
      AccessibilityInfo.announceForAccessibility(message);
    } catch (caught) {
      setError(caught instanceof CoverageChangedError ? caught.message :
        'Potvrdenie sa nepodarilo uložiť. Medzery zostali zachované. Skús to znova.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function confirm(section: CoverageSection) {
    if (lock.current || !section.start || !section.end) return;
    Alert.alert('Je tento úsek úplný?',
      `${sectionLabel(section)}\n\nPotvrď iba vtedy, keď sú v tomto úseku zapísané všetky skutočné tankovania. Označenie neúplnosti odstránime iba z tohto úseku a spotrebu prepočítame. Samotné potvrdenie nedoplní chýbajúce litre.`,
      [
        { text: 'Ešte nie', style: 'cancel' },
        { text: 'Potvrdiť úplnosť', onPress: () => void complete(section) },
      ]);
  }
  return (
    <Page brand={false}>
      <Stack.Screen options={{ gestureEnabled: !busy }} />
      <TextButton title="← Štatistiky" disabled={busy}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/stats')} />
      <Heading title="Medzery v evidencii" subtitle="Skontroluj vždy konkrétny úsek histórie." />
      <Copy>
        Najprv doplň chýbajúce tankovania alebo oprav záznamy v Histórii. Až keď sú všetky
        skutočné tankovania zapísané, potvrď úplnosť príslušného úseku. Ostatné medzery zostanú zachované.
      </Copy>
      {error ? <Copy error>{error}</Copy> : null}
      {notice ? <Copy>{notice}</Copy> : null}
      {sections.length ? sections.map((section) => (
        <Card warning key={coverageSectionKey(section)}>
          <SectionTitle>{sectionLabel(section)}</SectionTitle>
          {section.start && section.end ? (
            <>
              <Copy small>Neúplný úsek. Po doplnení všetkých tankovaní môžeš potvrdiť jeho úplnosť.</Copy>
              <Button title="Potvrdiť úplnosť tohto úseku" disabled={busy}
                onPress={() => confirm(section)} />
            </>
          ) : (
            <Copy small>
              Tento úsek zatiaľ nemá obe ohraničujúce tankovania. Najprv doplň chýbajúce
              tankovanie v Histórii. Potom skontroluj vzniknutý úsek a potvrď jeho úplnosť.
            </Copy>
          )}
        </Card>
      )) : <Card soft><SectionTitle>Bez označených medzier</SectionTitle>
        <Copy>Spotrebu počítame z úplných intervalov medzi plnými nádržami.</Copy></Card>}
      <Button title="Otvoriť históriu" secondary disabled={busy} onPress={() => router.push('/history')} />
      {busy ? <Copy>Ukladáme potvrdenie…</Copy> : null}
    </Page>
  );
}
