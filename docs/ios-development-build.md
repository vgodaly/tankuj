# Vlastný iOS vývojový build

Overené 2. 11. 2026. Pracovný postup je lokálne zostavenie na Macu cez Expo CLI a Xcode. Cloudový EAS build, Apple registrácia a TestFlight nie sú súčasťou tohto kroku.

## Konfigurácia a nástroje

- Expo SDK 58 a `expo-dev-client ~58.0.18` podľa `package-lock.json`.
- Xcode 27.2; pre natívne závislosti CocoaPods cez Homebrew (`brew install cocoapods`). Node.js 24 a npm podľa projektového stavu.
- Používateľ potvrdil bundle ID `com.vgodaly.tankuj`, uložené v `mobile/app.json` → `expo.ios.bundleIdentifier`. Schéma odkazu vlastnej aplikácie je `tankuj`. Samotná konfigurácia nepotvrdzuje dostupnosť ID v Apple Developer.
- Natívne priečinky `mobile/ios` a `mobile/android` sú generované a ignorované cez `mobile/.gitignore`. Zdrojom konfigurácie je `app.json`, balíky a config pluginy. Ručné natívne úpravy treba previesť do pluginu pred ďalším generovaním.
- Certifikáty, profily a `credentials.json` sa necommitujú. Apple Team ani prihlasovacie údaje sa do projektu teraz nepridávajú.

Postup vychádza z [lokálnych development buildov Expo](https://docs.expo.dev/develop/development-builds/introduction/?buildenv=build-locally) a [lokálneho zostavenia](https://docs.expo.dev/guides/local-app-development/). Konkrétne prepínače overujeme aj cez `npx expo run:ios --help` a `npx expo prebuild --help` nainštalovanej verzie CLI.

## Simulátor

Z koreňa repozitára:

~~~bash
cd mobile
npm ci
npm run ios -- --device "Tankuj Restore QA"
~~~

Pri prvom zostavení Expo vygeneruje projekt iOS, nainštaluje pody a spustí Xcode build. Build pre simulátor nevyžaduje Apple účet ani podpisovanie pre zariadenie. Následne nainštaluje samostatný Tankuj a spustí Metro. Tento príkaz vyberá QA simulátor, nie pôvodnú používateľovu evidenciu v Expo Go.

Ak stačí zostaviť binárku bez otvorenia simulátora a servera:

~~~bash
npm run ios -- --device generic --no-bundler --output /private/tmp/tankuj-ios-build
~~~

Po zmene iba TypeScript/JavaScript kódu stačí `npm start` a otvoriť nainštalovaný Tankuj. Po pridaní natívneho modulu alebo zmene natívnej konfigurácie treba nový build. Generovanie obnovuje natívne súbory; pred jeho spustením treba skontrolovať lokálne ručné úpravy. SDK 58 CLI ponúka `--no-clean` na vrstvenie zmien; tento projekt používa generovanie z konfigurácie.

## Údaje z Expo Go

Samostatný Tankuj má vlastný aplikačný kontajner a nezačne automaticky čítať SQLite databázu Expo Go. Pred presunom v pôvodnom Tankuj cez Nastavenia → Záloha a obnova vytvor JSON zálohu a ulož ju do Súborov. Na dočasné otvorenie pôvodnej aplikácie spusti:

~~~bash
cd mobile
npm run start:go
~~~

V samostatnom Tankuj potom zvoľ „Mám zálohu – obnoviť údaje“, skontroluj náhľad a potvrď obnovu. Over počet tankovaní, platby, litre, spotrebu aj medzery. Zálohu ponechaj uloženú aj po úspešnej obnove. CSV slúži na čítanie histórie; na presun použi JSON. Expo Go ani jeho údaje kvôli buildu nemažeme.

## Fyzický iPhone

Bundle ID je potvrdený; ďalším krokom je v Xcode zvoliť používateľov Apple Team a podpísať build pre konkrétne zariadenie. Prvý pokus vykonáme spolu s používateľom; nebude sa automaticky registrovať aplikácia ani vytvárať distribučné certifikáty. iPhone musí byť pripojený, odomknutý a pripravený na vývoj. Na tento krok nadväzuje kontrola skutočnej klávesnice, VoiceOver, návratových gest, súborov a zachovania údajov po aktualizácii.

## Stav overenia

- Kód: typová kontrola, všetkých 75 existujúcich testov, online `expo install --check` a iOS JS/Hermes export prešli. Doménové pravidlá ani SQLite schéma sa nemenili.
- Nástroje: CocoaPods 1.17.0 cez Homebrew; prebuild a inštalácia podov prešli. Xcode Debug build pre simulátor skončil s 0 chybami a 2 upozorneniami zo závislostí Expo: viditeľnosť generovaného `CoreModule` a závislosti skriptu `Strip Local Network Keys for Release`. Zostavenie tým nebolo blokované; upozornenia zostávajú otvorené.
- Binárka: `/private/tmp/tankuj-ios-build/Tankuj.app`, overený identifikátor `com.vgodaly.tankuj` a platforma iPhoneSimulator. Výstup v dočasnom priečinku je obnoviteľný build, nie záloha ani distribučný archív.
- UI: samostatný Tankuj nainštalovaný na Tankuj Restore QA (iPhone 17, iOS 27.0), otvorený cez vlastnú ikonu a pripojený k Metro. Začal bez vozidla. Agent cez systémový výber súboru načítal skúšobnú JSON zálohu, skontroloval náhľad a obnovil ju do prázdneho kontajnera. UI zobrazilo Seat, 3 tankovania, 144 €, 90 l, 1,600 €/l, 6,00 l/100 km za 500 km/1 interval a upozornenie na medzeru. Read-only SQLite potvrdila ID, presné vstupy a bod medzery pri 10 200 km; oddelená QA evidencia Expo Go zostala na 4 tankovaniach, 163,20 €, 102 l a bez medzier.
- Reštart: agent úplne vypol a zapol iba QA simulátor, cez vyhľadanie vlastnej ikony znovu otvoril Tankuj a overil rovnaké súhrny, spotrebu aj upozornenie na medzeru. Metro počas tohto testu bežalo; nešlo o Reload. Po skúške boli Metro aj QA simulátor vypnuté.
- Fyzické zariadenie, podpisovanie Apple Team, aktualizácia už nainštalovanej vlastnej aplikácie, úplný VoiceOver, okrajové gesto a distribúcia ešte neboli overené. Táto skúška nepokrýva celý regresný scenár vo vlastnom builde.
