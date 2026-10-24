# Tankuj

Mobilná aplikácia na rýchlu evidenciu tankovaní a porozumenie nákladom na palivo. Najprv iOS, neskôr Android.

**Produktový prísľub:** Maj prehľad o tankovaní a pochop, prečo míňaš viac.

## Stav projektu

Pripravujeme MVP. V [mobile/](mobile/README.md) je funkčná vývojová verzia Tankuj: nastavenie auta, pridanie, úprava a vymazanie tankovania, história a základné štatistiky s lokálnym ukladaním do SQLite. Rozsah a hranice overenia opisuje [prvý mobilný tok](docs/mobile-first-flow.md).

Základ používa Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6 a expo-sqlite. Pre vývoj a testy používame Node.js 24.

## Spustenie mobilnej aplikácie

Z koreňa repozitára:

~~~bash
cd mobile
npm ci
npm start
~~~

V ponuke Expo vyber iOS simulátor klávesmi Shift + i. Typová kontrola v priečinku mobile:

~~~bash
npm run typecheck
npm test
~~~

Pôvodné licenčné oznámenie prevzatej Expo šablóny je zachované v [mobile/LICENSE](mobile/LICENSE). Licencia vlastného projektu Tankuj zatiaľ nebola zvolená.

## Dokumentácia

- [Špecifikácia MVP](docs/mvp.md): používateľ, rozsah, toky a podmienky prijatia.
- [Pravidlá výpočtov](docs/calculations.md): vstupy, spotreba, neistota a overovacie príklady.
- [Návrh obrazoviek a UX](docs/ux-design.md): navigácia, komponenty, stavy a plán overenia s vodičmi.
- [Klikateľný prototyp](design/README.md): lokálny náhľad používateľského toku.
- [Kontrola prototypu](docs/prototype-review.md): overené scenáre a hranice overenia.
- [Implementačný plán](docs/implementation-plan.md): malé úlohy a ich závislosti.
- [Stav a rozhodnutia](docs/project-status.md): aktuálny kontext a ďalší krok.

## Zásady

- Prvé použitie bez registrácie; základné funkcie dostupné offline.
- Hodnota už po prvom zázname, spotreba až po platnom meracom intervale.
- Namiesto nepresnej štatistiky vysvetlenie, ktoré údaje chýbajú.
- Minimálny zber údajov a možnosť exportu a obnovy vlastnej histórie.
- Slovenské rozhranie a dokumentácia, anglické technické identifikátory.

Pracovný názov Tankuj zatiaľ nemá overenú dostupnosť značky pre verejné vydanie.
