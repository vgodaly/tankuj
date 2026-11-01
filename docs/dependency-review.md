# Kontrola závislostí

Stav k 1. 11. 2026 po aktualizácii v rámci Expo SDK 58. Ide o kontrolu kompatibility a hlásení npm, nie o úplný bezpečnostný audit aplikácie.

## Vykonané zmeny

Aktualizované kompatibilné opravy Expo a odporúčané verzie jeho modulov. Hlavné verzie SDK, Reactu a TypeScriptu zostali zachované; konfigurácia aplikácie a SQLite schéma sa nemenili.

| Závislosť | Pred kontrolou | Po kontrole |
| --- | --- | --- |
| Expo | 58.0.19 | 58.0.22 |
| Expo CLI, tranzitívne | 58.1.15 | 58.1.18 |
| Expo config, tranzitívne | 58.0.8 | 58.0.10 |
| Expo Router | 58.0.26 | 58.0.29 |
| Expo SQLite | 58.0.14 | 58.0.15 |
| React Native | 0.88.0 | 0.88.1 |
| React Native Screens | 4.30.0 | 4.30.1 |
| node-forge, tranzitívne | 1.4.0 | 1.4.2 |

Zladené sú aj `@expo/ui`, image, linking, splash-screen, system-ui a web-browser; konkrétne verzie všetkých priamych a tranzitívnych závislostí zaznamenáva `mobile/package-lock.json`. Nové Expo CLI a config už nevyžadujú `zod` a `deepmerge`; oba balíky zmizli zo stromu. Aktualizovaný `node-forge` už npm audit neoznačuje.

Použitá bola aktualizácia Expo, `npm update node-forge`, online kontrola a `npx expo install --fix`, následne čisté `npm ci`. Postup zladenia a kontroly vychádza z [odporúčania Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/). Nepoužili sa `overrides`, `npm audit fix --force` ani prechod na inú hlavnú verziu SDK.

## Výsledok npm audit

| Závažnosť | Pred kontrolou | Po čistej inštalácii |
| --- | --- | --- |
| Low | 1 | 0 |
| Moderate | 11 | 13 |
| High | 3 | 0 |
| Critical | 0 | 0 |
| Spolu | 15 | 13 |

Počet označených balíkov zahŕňa aj rodičov, ktorí chybu dedia. Zostávajúcich 13 hlásení preto nepredstavuje 13 samostatných chýb: majú dve príčiny, `glob` a `minimatch`. Súčasťou kontroly boli závislostné cesty, údaje npm registra a príslušné advisories.

| Zostávajúca príčina | Inštalovaná verzia | Opravená vetva podľa advisory | Dôsledok |
| --- | --- | --- | --- |
| [glob: nedostatočné prerušenie cez AbortSignal](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | 13.0.6 | od 14.0.2 | Prechádzanie súborov môže pokračovať po zrušení a ďalej spotrebúvať zdroje. |
| [minimatch: globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249) | 10.2.6 | od 11.0.1 | Špeciálne zostavené vzory pri `optimizationLevel >= 2` môžu nadmerne spotrebovať CPU a pamäť. |

Expo nástroje v overenej verzii vyžadujú `glob ^13` a fingerprint aj `minimatch ^10`; pri kontrole nebola dostupná oprava v týchto rozsahoch. Vynútenie nových hlavných verzií by obišlo deklarovanú kompatibilitu. Návrh npm na automatickú opravu obsahoval aj downgrade Expo na 51.0.39, preto sa nepoužil.

Zostávajú označené `glob`, `minimatch`, `expo`, `expo-sharing`, `expo-splash-screen`, `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/fingerprint`, `@expo/inline-modules`, `@expo/local-build-cache-provider`, `@expo/metro-config` a `@expo/prebuild-config`.

Závislostné cesty vedú cez nástroje Expo pre konfiguráciu, súbory a zostavovanie. V source mape vytvoreného iOS JS/Hermes exportu (1 206 zdrojov) sa nenachádzajú moduly `glob`, `minimatch`, `node-forge`, `zod` ani `deepmerge`. Toto overuje konkrétny mobilný JS balík; nevylučuje riziká vývojových nástrojov ani nenahrádza kontrolu natívneho buildu. Samotné označenie npm ako produkčnej závislosti nerozlišuje tento účel.

Pri najbližšej kompatibilnej aktualizácii Expo a pred širšou betou zopakovať audit a zhodnotiť obe otvorené príčiny. Dovtedy sa nimi naďalej zaoberáme ako otvorenými nálezmi.

## Overenie

Kontroly kódu a prostredia na novom Macu:

- Čisté `npm ci` a `npm ls --all` prešli bez chyby závislostného stromu.
- `npm run typecheck` a všetkých 63 doménových/SQLite testov prešli. Existujúce upozornenie Node `MODULE_TYPELESS_PACKAGE_JSON` zostáva; testy nezlyhali.
- Online `npx expo install --check`: závislosti sú aktuálne pre SDK 58.
- `npx expo-doctor`: 20 z 20 kontrol prešlo.
- `npx expo export --platform ios --source-maps` vytvoril JS/Hermes balík a source mapu; nezávisle skontrolované zdrojové cesty uvedených balíkov.
- Konečný `npm audit --json` po čistej inštalácii: 13 moderate, žiadne low/high/critical. Audit zostáva nenulový pre otvorené nálezy.

Agent cez UI samostatného simulátora Tankuj Restore QA (iPhone 17, iOS 27.0, Expo Go 58.0.7) overil úplné ukončenie a otvorenie Expo Go s novým Metro serverom, načítanie existujúcich údajov, otvorenie detailu, uloženie úpravy s pôvodnými hodnotami a prechod do štatistík. Zostali 4 tankovania, 163,20 €, 102 l, 1,600 €/l a 6,20 l/100 km za 1 000 km/2 intervaly bez medzier. Pôvodná používateľova história sa nemenila. Ide o kontrolu základného fungovania po aktualizácii, nie o opakovanie všetkých scenárov zálohy a mazania.

Expo Go používa vlastné natívne moduly; nový natívny development build, Android ani fyzický iPhone sa v tomto kroku netestovali. Export JS/Hermes nie je natívny build.
