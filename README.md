# Tankuj

Mobilná aplikácia na rýchlu evidenciu tankovaní a porozumenie nákladom na palivo. Najprv iOS, neskôr Android.

**Produktový prísľub:** Maj prehľad o tankovaní a pochop, prečo míňaš viac.

## Stav projektu

Pripravujeme MVP. Repozitár obsahuje produktovú špecifikáciu, pravidlá výpočtov a plán práce; aplikácia zatiaľ nie je implementovaná.

Pracovný technologický návrh z roadmapy: React Native, Expo, TypeScript a lokálna SQLite databáza. Konkrétne verzie a kompatibilitu overíme podľa oficiálnej dokumentácie pri založení aplikácie.

## Dokumentácia

- [Špecifikácia MVP](docs/mvp.md): používateľ, rozsah, toky a podmienky prijatia.
- [Pravidlá výpočtov](docs/calculations.md): vstupy, spotreba, neistota a overovacie príklady.
- [Implementačný plán](docs/implementation-plan.md): malé úlohy a ich závislosti.
- [Stav a rozhodnutia](docs/project-status.md): aktuálny kontext a ďalší krok.

## Zásady

- Prvé použitie bez registrácie; základné funkcie dostupné offline.
- Hodnota už po prvom zázname, spotreba až po platnom meracom intervale.
- Namiesto nepresnej štatistiky vysvetlenie, ktoré údaje chýbajú.
- Minimálny zber údajov a možnosť exportu a obnovy vlastnej histórie.
- Slovenské rozhranie a dokumentácia, anglické technické identifikátory.

Pracovný názov Tankuj zatiaľ nemá overenú dostupnosť značky pre verejné vydanie.
