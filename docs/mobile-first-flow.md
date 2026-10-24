# Prvý funkčný tok v mobilnej aplikácii

Stav k 24. 10. 2026: prvá vývojová verzia Tankuj, nie dokončené MVP ani verzia pripravená na vydanie.

## Dostupné funkcie

- Úvod bez registrácie: benzín/diesel a nepovinný názov auta.
- Prehľad s aktuálnym kalendárnym mesiacom, platbami v evidencii a dostupnou spotrebou.
- Pridanie tankovania: tachometer, litre, suma alebo jednotková cena, plná nádrž, dátum a označenie vynechaného tankovania.
- Dátum je predvyplnený; upravuje sa v ďalších možnostiach vo formáte deň.mesiac.rok. Natívny dátumový picker ešte nie je pridaný.
- Validácia vstupov aj chronológie, potvrdenie zahodenia zmien a ochrana pred opakovaným uložením.
- Potvrdenie zápisu, história, detail a základné číselné štatistiky po platných intervaloch.
- Svetlý a tmavý farebný základ podľa návrhu; klávesnicou posúvateľný formulár.
- Lokálna SQLite databáza bez predvyplnených demo záznamov.

## Kód a ukladanie

Čisté pravidlá sú v mobile/src/domain/fuel.ts. Prístup k SQLite a prvá migrácia sú v mobile/src/data/fuel-repository.ts. React stav a otvorenie databázy zabezpečuje FuelProvider; obrazovky nevykonávajú SQL.

Databáza tankuj.db obsahuje vozidlo, tankovania a samostatné body neúplnej evidencie. Medzera nie je závislá od existencie konkrétneho tankovania; budúce opravy a vymazanie musia túto informáciu zachovať.

Objemy sú celé mililitre, sumy celé centy a pôvodná jednotková cena celé tisíciny EUR/l. Výpočet sumy používa celočíselné zaokrúhlenie half-up. Odvodené pomery sa zaokrúhľujú až pri zobrazení.

Vstupy sú obmedzené na tachometer 0–9 999 999 km, objem do 10 000 l, sumu do 999 999,99 € a jednotkovú cenu do 100 €/l. Nejednoznačný zápis, nadbytočná presnosť a budúci dátum sa odmietajú.

Zápis tankovania a prípadnej medzery prebieha v jednej exkluzívnej transakcii. Validácia sa opakuje nad aktuálnou históriou v transakcii. Úspech sa zobrazuje až po dokončení zápisu; pri chybe zostávajú vstupy vo formulári. Neznáma verzia databázy sa odmietne bez jej vymazania.

Použité API je overené podľa [oficiálnej dokumentácie expo-sqlite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/).

## Overenie

- Typová kontrola npm run typecheck prešla; npm test úspešne spustilo všetkých 23 testov.
- Testy: npm test, Node.js 24 a jeho vstavané testovacie a SQLite moduly.
- Doménové testy: presné vstupy, zaokrúhlenie, dátumy, susedia, plné/čiastočné tankovania, medzery, vážená spotreba a cena.
- Integračné testy používajú rovnaké repository funkcie a skutočné SQLite cez adaptér pre Node. Pokrývajú migráciu, odmietnutie novšej schémy, atomický rollback pri chybe, duplicity a zachovanie údajov po zatvorení a opätovnom otvorení databázového súboru.
- Na iPhone 17 s iOS 27.0 v Expo Go vizuálne overená úvodná obrazovka Tankuj a jej ovládacie prvky. Testovacie tankovania neboli vložené do používateľovej histórie.

Testy repository v Node nenahrádzajú úplné overenie expo-sqlite na zariadení. Celý zápis z formulára, reštart aplikácie s údajmi, VoiceOver, veľký text, Android a fyzický iPhone ešte vyžadujú samostatnú kontrolu. Natívny development build ani distribúcia týmto krokom nevznikli.

## Zostávajúce funkcie MVP

Úpravy a vymazanie tankovaní, potvrdenie doplnenia konkrétnej medzery, grafy, export a obnova zálohy. Nastavenia tieto obmedzenia vývojovej verzie uvádzajú; neobsahujú falošné tlačidlá na export.

Hlásené nálezy npm audit ostávajú otvorené. Používateľské údaje zatiaľ nie sú chránené vlastnou exportovateľnou zálohou, preto táto verzia nemá byť jedinou evidenciou skutočných tankovaní.
