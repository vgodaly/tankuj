# Vlastný iOS vývojový build

Prvé zostavenie pre simulátor bolo overené 2. 11. 2026 a prvé spustenie na iPhone 8. 11. 2026. Pracovný postup je lokálne zostavenie na Macu cez Expo CLI a Xcode. Cloudový EAS build a TestFlight nie sú súčasťou tohto kroku. Následná príprava podpisovania pre zariadenie je uvedená nižšie.

## Konfigurácia a nástroje

- Expo SDK 58 a `expo-dev-client ~58.0.18` podľa `package-lock.json`.
- Xcode 27.2; pre natívne závislosti CocoaPods cez Homebrew (`brew install cocoapods`). Node.js 24 a npm podľa projektového stavu.
- Používateľ potvrdil bundle ID `com.vgodaly.tankuj`, uložené v `mobile/app.json` → `expo.ios.bundleIdentifier`. Schéma odkazu vlastnej aplikácie je `tankuj`. Samotná konfigurácia nepotvrdzuje dostupnosť ID v Apple Developer.
- Natívne priečinky `mobile/ios` a `mobile/android` sú generované a ignorované cez `mobile/.gitignore`. Zdrojom konfigurácie je `app.json`, balíky a config pluginy. Ručné natívne úpravy treba previesť do pluginu pred ďalším generovaním.
- Používateľ schválil vývojové podpisovanie tímom Viktor Godály. `expo.ios.appleTeamId` je `P84RJ936C7`; je to identifikátor tímu, nie prihlasovací údaj. Certifikáty, súkromné kľúče, profily a `credentials.json` sa necommitujú. Prihlásenie je lokálne v Xcode, súkromný podpisovací kľúč v Kľúčenke.

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

Používateľ sa prihlásil v Xcode a výslovne schválil priradenie tímu, vytvorenie vývojového certifikátu/profilu a registráciu identifikátora Tankuj a pripojeného zariadenia. Tím je nastavený v Expo konfigurácii aj lokálnom generovanom projekte. Xcode vytvorilo platnú identitu Apple Development. Pri prvom pokuse profil nevznikol: tím hlásil 0 registrovaných zariadení a chýbajúci profil. Používateľ potom pripojil iPhone 13 s iOS 27.0; káblové spojenie a párovanie sú overené. Dňa 8. 11. používateľ zapol Developer Mode a agent overil káblové pripojenie iPhonu 13 s iOS 27.2. Xcode vytvorilo vývojový profil, ktorý pokrýva Tankuj a pripojený iPhone. Po povolení kľúča Apple Development v Kľúčenke prešiel opakovaný build. Podpísaný Tankuj sa nainštaloval a spustil na iPhone 13 s iOS 27.2.

1. Pripoj iPhone dátovým káblom a odomkni ho. Pri prvom spojení používateľ potvrdí dôveru Macu na telefóne. Ak ho Xcode nevidí, najprv over zobrazenie vo Finderi v časti Locations/Miesta; kábel určený iba na nabíjanie nestačí.
2. Otvor `mobile/ios/Tankuj.xcworkspace`, nie samostatný projekt Pods. V targete Tankuj → Signing & Capabilities má byť tím Viktor Godály, bundle ID `com.vgodaly.tankuj` a automatické podpisovanie. V ponuke cieľov vyber konkrétny fyzický iPhone. Pri prvom pokuse môže Xcode dokončovať prípravu zariadenia.
3. Ak zariadenie vyžaduje Developer Mode, používateľ ho zapne v Nastavenia → Súkromie a bezpečnosť → Režim vývojára, dokončí reštart a potvrdenie na telefóne. Ide o samostatnú zmenu bezpečnostného nastavenia; nevykonávame ju bez jeho potvrdenia. Podrobnosti: [Apple Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device).
4. Až keď je zariadenie dostupné, dokonči automatické podpisovanie. Postup a vytváranie lokálnych certifikátov opisuje [Expo: Xcode signing](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md). Ak chýba profil, v Signing & Capabilities skontroluj konkrétnu chybu; chýbajúce zariadenie nevyrieši reset simulátora ani opakovanie `npm ci`.
5. V priečinku `mobile` spusti `npm run ios -- --device "<názov alebo UDID fyzického iPhonu>"`. Pri prvom spustení treba nový build pre iPhone; binárka iPhoneSimulator nie je použiteľná na telefóne. Metro poskytuje JavaScript pre tento Debug build; na prvé pripojenie skontroluj dosiahnuteľnosť servera z telefónu a prípadnú žiadosť aplikácie o lokálnu sieť.

Pred testovaním skutočnej histórie ulož JSON zálohu a ponechaj ju mimo kontajnera aplikácie. Testovacie tankovania vkladaj iba do dohodnutej prázdnej QA evidencie. Expo Go zostáva oddelené; samostatný Tankuj otvor cez jeho vlastnú ikonu.

### Prvé vytvorenie podpisovacieho profilu

Pri už nastavenom `appleTeamId` Expo CLI 58 v tomto projekte spustilo `xcodebuild` bez `-allowProvisioningUpdates`. Ak ešte chýba profil, zostavenie skončí chybou `No profiles for 'com.vgodaly.tankuj' were found`. Po schválení registrácie zariadenia použi priamo Xcode s povolením aktualizácie profilu. V priečinku `mobile` nahraď zástupnú hodnotu UDID fyzického iPhonu zo zoznamu `xcrun devicectl list devices`.

~~~bash
iphone_udid='<UDID fyzického iPhonu>'
RCT_NO_LAUNCH_PACKAGER=true SKIP_BUNDLING=1 xcodebuild \
  -workspace ios/Tankuj.xcworkspace -scheme Tankuj -configuration Debug \
  -destination "id=$iphone_udid" -derivedDataPath /private/tmp/tankuj-iphone-derived \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration build

npm run ios -- --device "$iphone_udid" \
  --binary /private/tmp/tankuj-iphone-derived/Build/Products/Debug-iphoneos/Tankuj.app
~~~

Ak podpis zlyhá s `errSecInternalComponent` pri výzve Kľúčenky, povoľ použitie kľúča Apple Development priamo v systémovom okne a zopakuj zostavenie. Druhý príkaz nainštaluje hotovú podpísanú binárku a spustí Metro. Pri prvom štarte vyber v Expo Dev Launcher dostupný server Tankuj. Po načítaní sa zobrazí slovenský úvod aplikácie.

## Kontrola na fyzickom zariadení

Výsledky zapisuj s modelom/iOS, konfiguráciou buildu, pozorovateľom a skutočnými hodnotami. Tabuľka je plán, nie potvrdenie vykonania.

| Skúška | Podmienka úspechu | Stav |
| --- | --- | --- |
| Prvý štart a podpisovanie | Samostatný Tankuj sa otvorí na konkrétnom iPhone, správny identifikátor a evidencia | Prešlo 8. 11. na iPhone 13 s iOS 27.2. Agent v Device Hub overil úvod s výberom paliva a možnosťou obnovy zálohy |
| Zápis, úprava, oba dôvody vymazania | [Základný QA scenár](manual-verification.md), rovnaké súhrny a medzery; namiesto Expo Go ukončovať samostatný Tankuj | Nevykonané |
| Klávesnica a veľký text | Aktívne polia aj uloženie dostupné; čitateľné sumy, grafy a vysvetlenia | Nevykonané |
| Návrat gestom a neuložené zmeny | Skutočné gesto od ľavého okraja; pokračovanie aj zahodenie zmien fungujú a nič sa samovoľne neuloží | Nevykonané |
| VoiceOver | Hovorené názvy, poradie, chyby, úspešné oznamy aj výber a zdieľanie súboru; rozlíšiť od rámika fokusu | Nevykonané |
| JSON a CSV | [Súborový scenár](manual-backup-verification.md), nájdený trvalý súbor, správna obnova a čitateľné CSV | Nevykonané |
| Studený štart | Úplne ukončiť samostatný Tankuj cez prepínač aplikácií a znova otvoriť; rovnaká evidencia. Pri Debug ponechať Metro dostupné | Nevykonané |
| Aktualizácia vlastnej aplikácie | Po zálohe nainštalovať nový podpísaný build s rovnakým bundle ID cez existujúci bez odinštalovania; rovnaké vozidlo, ID, vstupy, súhrny a medzery | Nevykonané |
| Štart bez Metro | Samostatne zostaviť a podpísať Release s pribaleným JS a testovať po vypnutí servera. Debug s Metro nepotvrdzuje úplný offline štart | Nevykonané |

## Stav overenia

- Kód: typová kontrola, všetkých 75 existujúcich testov, online `expo install --check` a iOS JS/Hermes export prešli. Doménové pravidlá ani SQLite schéma sa nemenili.
- Nástroje: CocoaPods 1.17.0 cez Homebrew; prebuild a inštalácia podov prešli. Xcode Debug build pre simulátor skončil s 0 chybami a 2 upozorneniami zo závislostí Expo: viditeľnosť generovaného `CoreModule` a závislosti skriptu `Strip Local Network Keys for Release`. Zostavenie tým nebolo blokované; upozornenia zostávajú otvorené.
- Binárka: `/private/tmp/tankuj-ios-build/Tankuj.app`, overený identifikátor `com.vgodaly.tankuj` a platforma iPhoneSimulator. Výstup v dočasnom priečinku je obnoviteľný build, nie záloha ani distribučný archív.
- UI: samostatný Tankuj nainštalovaný na Tankuj Restore QA (iPhone 17, iOS 27.0), otvorený cez vlastnú ikonu a pripojený k Metro. Začal bez vozidla. Agent cez systémový výber súboru načítal skúšobnú JSON zálohu, skontroloval náhľad a obnovil ju do prázdneho kontajnera. UI zobrazilo Seat, 3 tankovania, 144 €, 90 l, 1,600 €/l, 6,00 l/100 km za 500 km/1 interval a upozornenie na medzeru. Read-only SQLite potvrdila ID, presné vstupy a bod medzery pri 10 200 km; oddelená QA evidencia Expo Go zostala na 4 tankovaniach, 163,20 €, 102 l a bez medzier.
- Reštart: agent úplne vypol a zapol iba QA simulátor, cez vyhľadanie vlastnej ikony znovu otvoril Tankuj a overil rovnaké súhrny, spotrebu aj upozornenie na medzeru. Metro počas tohto testu bežalo; nešlo o Reload. Po skúške boli Metro aj QA simulátor vypnuté.
- Podpisovanie: prihlásenie a výber schváleného tímu v Xcode aj platná lokálna Apple Development identita overené. Po zapnutí Developer Mode priamy príkaz `xcodebuild` vytvoril vývojový profil. Kontrola vloženého profilu potvrdila schválený tím, zhodu s bundle ID cez wildcard a prítomnosť pripojeného iPhonu. Opakované zostavenie prešlo po povolení kľúča. `codesign --verify --deep --strict` potvrdilo podpis a `Info.plist` identifikátor `com.vgodaly.tankuj` a platformu iPhoneOS.
- Na fyzickom iPhone 13 s iOS 27.2 prešla inštalácia vývojového buildu a načítanie aplikácie z Metro. Agent v Device Hub videl úvod pre prázdnu evidenciu. Širšie skúšky na telefóne sú uvedené v tabuľke vyššie.
