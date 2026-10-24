import { Redirect, router } from 'expo-router';
import { Button, Copy, Heading, Page, RecordRow } from '@/components/tankuj-ui';
import { useFuel } from '@/state/fuel-store';

export default function History() {
  const { vehicle, refuels } = useFuel();
  if (!vehicle) return <Redirect href="/" />;
  return (
    <Page tab="history">
      <Heading title="História" subtitle="Každé tankovanie na svojom mieste." />
      <Button title="+ Pridať tankovanie" onPress={() => router.push('/refuel')} />
      {refuels.length ? (
        [...refuels].reverse().map((record) => <RecordRow key={record.id} record={record} />)
      ) : (
        <Copy muted>
          Zatiaľ bez záznamov. Zapíš prvé tankovanie a začni budovať vlastný prehľad.
        </Copy>
      )}
    </Page>
  );
}
