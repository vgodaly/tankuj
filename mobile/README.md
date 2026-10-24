# Tankuj — mobilná aplikácia

Prvá vývojová verzia pre iOS; základ je spoločný aj pre Android. Používa Expo SDK 58, React Native, TypeScript a lokálnu SQLite databázu. Na vývoj a testy používame Node.js 24.

## Spustenie

V tomto priečinku:

~~~bash
npm ci
npm start
~~~

V ponuke Expo stlač Shift + i a vyber klasický iPhone. Po prvom otvorení vyber palivo a voliteľne pomenuj auto. Aplikácia nemá predvyplnené demo tankovania.

## Kontroly

~~~bash
npm run typecheck
npm test
~~~

Testy používajú vstavaný test runner a SQLite v Node.js. Nevyžadujú simulátor a nemenia databázu aplikácie. Lint zatiaľ nie je nakonfigurovaný.

## Štruktúra

- src/app: obrazovky a navigácia cez Expo Router.
- src/components/tankuj-ui.tsx: spoločné komponenty a farby.
- src/domain/fuel.ts: presné vstupy a výpočty bez závislosti od UI.
- src/data/fuel-repository.ts: SQL schéma, migrácia a transakcie.
- src/state/fuel-store.tsx: lokálny stav a prepojenie na SQLite.
- tests: doménové a integračné testy repository.

## Rozsah a obmedzenia

Funguje nastavenie auta, pridanie tankovania, prehľad, história, detail a základné štatistiky. Úpravy, vymazanie, grafy a export/obnova zálohy zatiaľ nie sú implementované. Túto verziu používaj na vývoj a skúšanie; zatiaľ nemá byť jedinou kópiou skutočnej histórie.

Podrobnosti sú v [prvom funkčnom toku](../docs/mobile-first-flow.md), [špecifikácii MVP](../docs/mvp.md) a [pravidlách výpočtov](../docs/calculations.md).

Pôvodné licenčné oznámenie prevzatej Expo šablóny je zachované v súbore LICENSE. Licencia vlastného projektu Tankuj zatiaľ nebola zvolená.
