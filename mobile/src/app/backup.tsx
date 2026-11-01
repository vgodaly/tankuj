import { router, Stack, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import {
  Button, Card, Copy, countLabel, dateLabel, Heading, Metric, Page, SectionTitle, TextButton,
} from '@/components/tankuj-ui';
import { pickBackup, shareBackup, shareCsv } from '@/data/backup-files';
import { BackupError } from '@/domain/backup';
import type { Backup } from '@/domain/backup';
import { useFuel } from '@/state/fuel-store';

export default function BackupScreen() {
  const { getBackup, getCsv, restore, vehicle, refuels } = useFuel();
  const [pending, setPending] = useState<Backup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  usePreventRemove(busy, () => {});

  async function perform(action: 'share' | 'csv' | 'pick' | 'restore', backup?: Backup) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (action === 'share') {
        await shareBackup(await getBackup());
        setNotice('Ak si zálohu uložil, nájdeš ju vo vybranom umiestnení. Samotné zatvorenie zdieľania ju neuloží.');
      } else if (action === 'csv') {
        await shareCsv(await getCsv());
        setNotice('Ak si CSV uložil, nájdeš ho vo vybranom umiestnení. Evidencia sa exportom nemení.');
      } else if (action === 'pick') {
        setPending(null);
        const selected = await pickBackup();
        if (selected) setPending(selected);
      } else if (backup) {
        await restore(backup);
        setPending(null);
        setNotice('Údaje boli obnovené. Spotrebu a súhrny sme prepočítali z obnovenej histórie.');
        AccessibilityInfo.announceForAccessibility('Údaje boli obnovené.');
      }
    } catch (caught) {
      setError(caught instanceof BackupError ? caught.message : action === 'restore'
        ? 'Obnova sa nepodarila. Pôvodné údaje zostali zachované. Môžeš to skúsiť znova.'
        : action === 'share' || action === 'csv'
          ? 'Súbor sa nepodarilo zdieľať. Skús to znova v mobilnej aplikácii a vyber miesto na uloženie.'
          : 'Súbor sa nepodarilo prečítať. Skús ho vybrať znova zo Súborov v mobilnej aplikácii.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function confirmRestore() {
    if (!pending || lock.current) return;
    const selected = pending;
    Alert.alert('Nahradiť súčasné údaje?',
      `Vozidlo ${selected.vehicle?.name ?? 'bez vozidla'} a ${countLabel(selected.refuels.length, 'tankovanie', 'tankovania', 'tankovaní')} zo zálohy nahradia celú aktuálnu evidenciu. Túto zmenu nemožno vrátiť bez zálohy súčasných údajov.`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Nahradiť údaje', style: 'destructive', onPress: () => void perform('restore', selected) },
      ]);
  }
  const first = pending?.refuels[0];
  const last = pending?.refuels.at(-1);
  return (
    <Page brand={false}>
      <Stack.Screen options={{ gestureEnabled: !busy }} />
      <TextButton title="← Späť" disabled={busy}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <Heading title="Záloha a obnova" subtitle="Tvoja história aj na ďalšom telefóne." />
      <Copy>
        Záloha je manuálny, nešifrovaný JSON súbor. Obsahuje vozidlo, tankovania aj medzery v evidencii.
        Ulož ho na miesto, ku ktorému budeš mať prístup aj pri strate telefónu.
      </Copy>
      <Card>
        <SectionTitle>Súčasná evidencia</SectionTitle>
        <Metric label="Vozidlo" value={vehicle?.name ?? 'Zatiaľ bez vozidla'} />
        <Metric label="Tankovania" value={String(refuels.length)} />
        <Button title={pending ? 'Zálohovať súčasné údaje' : 'Vytvoriť zálohu'}
          disabled={busy} onPress={() => void perform('share')} />
        <Copy small muted>V systémovom zdieľaní vyber napríklad Uložiť do Súborov. Zrušenie nemení tvoju históriu.</Copy>
      </Card>
      <Button title={pending ? 'Vybrať inú zálohu' : 'Vybrať zálohu na obnovu'}
        secondary disabled={busy} onPress={() => void perform('pick')} />
      {pending ? (
        <Card warning>
          <SectionTitle>Pred obnovením</SectionTitle>
          <Metric label="Vozidlo zo zálohy" value={pending.vehicle?.name ?? 'Bez vozidla'} />
          {pending.vehicle ? <Metric label="Palivo" value={pending.vehicle.fuel} /> : null}
          <Metric label="Tankovania" value={String(pending.refuels.length)} />
          <Metric label="Obdobie" value={first && last ? `${dateLabel(first.date)} – ${dateLabel(last.date)}` : 'Bez tankovaní'} />
          <Metric label="Medzery v evidencii" value={String(pending.gaps.length)} />
          <Copy>Obnova nahradí všetky súčasné údaje. Histórie sa nezlučujú. Pred pokračovaním si môžeš vyššie zálohovať súčasnú evidenciu.</Copy>
          <Button title="Nahradiť údaje zo zálohy" disabled={busy} onPress={confirmRestore} />
          <TextButton title="Zrušiť obnovu" disabled={busy} onPress={() => { setPending(null); setError(''); setNotice(''); }} />
        </Card>
      ) : null}
      <Card>
        <SectionTitle>História pre tabuľku</SectionTitle>
        <Copy small>CSV otvoríš v Exceli alebo Numbers. Obsahuje zapísané tankovania a označenia medzier. Na obnovu v Tankuj použi JSON zálohu.</Copy>
        <Button title="Exportovať históriu do CSV" secondary disabled={busy}
          onPress={() => void perform('csv')} />
      </Card>
      {busy ? <Copy>Pracujeme so súborom…</Copy> : null}
      {error ? <Copy error>{error}</Copy> : null}
      {notice ? <Copy>{notice}</Copy> : null}
    </Page>
  );
}
