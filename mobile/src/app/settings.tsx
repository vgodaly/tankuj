import { Redirect, router } from 'expo-router';
import {
  Card,
  Copy,
  Heading,
  Metric,
  Page,
  SectionTitle,
  TextButton,
} from '@/components/tankuj-ui';
import { useFuel } from '@/state/fuel-store';

export default function Settings() {
  const { vehicle } = useFuel();
  if (!vehicle) return <Redirect href="/" />;
  return (
    <Page brand={false}>
      <TextButton
        title="← Prehľad"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <Heading title="Nastavenia" subtitle="Tvoje auto a tvoje údaje." />
      <Card>
        <Metric label="Vozidlo" value={vehicle.name} />
        <Metric label="Palivo" value={vehicle.fuel} />
        <Metric label="Jednotky" value="km · l · EUR" />
      </Card>
      <Card soft>
        <SectionTitle>Ako meriame spotrebu</SectionTitle>
        <Copy>
          Medzi dvomi plnými nádržami sčítame litre a vydelíme ich prejdenými kilometrami. Pri
          chýbajúcom tankovaní začneme od novej plnej nádrže.
        </Copy>
      </Card>
      <SectionTitle>Prvá vývojová verzia</SectionTitle>
      <Copy small muted>
        Údaje sa ukladajú lokálne v tomto telefóne. Export, obnova zálohy a úpravy záznamov ešte nie
        sú dostupné. Túto verziu zatiaľ používaj na skúšanie, nie ako jedinú kópiu svojej histórie.
      </Copy>
    </Page>
  );
}
