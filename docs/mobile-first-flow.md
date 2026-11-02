# Prvý funkčný tok v mobilnej aplikácii

Stav k 1. 11. 2026: prvá vývojová verzia Tankuj, nie dokončené MVP ani verzia pripravená na vydanie.

## Dostupné funkcie

- Úvod bez registrácie: benzín/diesel a nepovinný názov auta.
- Prehľad s aktuálnym kalendárnym mesiacom, platbami v evidencii a dostupnou spotrebou.
- Pridanie tankovania: tachometer, litre, suma alebo jednotková cena, plná nádrž, dátum a označenie vynechaného tankovania.
- Dátum je predvyplnený; upravuje sa v ďalších možnostiach vo formáte deň.mesiac.rok. Natívny dátumový picker ešte nie je pridaný.
- Validácia vstupov aj chronológie, potvrdenie zahodenia zmien a ochrana pred opakovaným uložením.
- [Kontext susedných tankovaní](refuel-context.md): pri pridávaní aj úprave dátum a tachometer predchodcu/nasledovníka, priebežný prepočet, pomenovanie duplicity a vysvetlenie pri chýbajúcom vstupe. Pomoc pri tachometri zostáva dostupná aj pri validačnej chybe.
- Potvrdenie zápisu, história, detail a štatistiky. [Tri pruhové grafy](statistics-charts.md) spotreby po platných intervaloch, efektívnych cien a mesačných platieb, s číslami, mierkou a stránkovaním po šiestich položkách.
- Úprava z detailu v rovnakom formulári: pôvodná suma alebo zadaná jednotková cena, litre, tachometer, dátum a plná nádrž; ID sa nemení. Kontrola chronológie vynechá iba práve upravovaný záznam.
- Vymazanie z detailu: výber chybného/duplicitného záznamu alebo skutočného tankovania, potom potvrdenie s dátumom, tachometrom a sumou. Skutočné tankovanie po odstránení zanechá medzeru. Vymazanie zatiaľ nemá funkciu späť.
- [Potvrdenie úplnosti konkrétneho úseku](coverage-completion.md) zo štatistík: pomenované hranice, konečné potvrdenie, atomické odstránenie iba vybraných medzier a prepočet. Otvorené úseky vyžadujú doplnenie ohraničujúcich tankovaní.
- Svetlý a tmavý farebný základ podľa návrhu; klávesnicou posúvateľný formulár. Pri veľkom systémovom texte sa navigácia, voľby paliva/ceny a prepínače s vysvetlením usporiadajú pod seba. Hlavný nadpis a značka majú najviac dvojnásobné zväčšenie; nadpis, značka úvodu a veľká suma sa prispôsobujú šírke. Ostatný text zachováva systémovú mierku.
- Lokálna SQLite databáza bez predvyplnených demo záznamov.
- [JSON záloha a obnova](backup-and-restore.md): systémové zdieľanie a výber súboru, validácia, náhľad a potvrdené atomické nahradenie celej histórie. Dostupné aj pred vytvorením vozidla; manuálna nešifrovaná záloha, bez synchronizácie. Hlavný tok uloženia a obnovy cez súborové UI používateľ overil v simulátore; zostávajúce kontroly uvádza manuálny scenár.

- [CSV export](csv-export.md) dostupný z nastavení na obrazovke údajov; uloženie cez systémové zdieľanie, presné vstupy a označenie medzier. Na obnovu slúži JSON.

## Kód a ukladanie

Čisté pravidlá sú v mobile/src/domain/fuel.ts. Prístup k SQLite a prvá migrácia sú v mobile/src/data/fuel-repository.ts. React stav a otvorenie databázy zabezpečuje FuelProvider; obrazovky nevykonávajú SQL.

Databáza tankuj.db obsahuje vozidlo, tankovania a samostatné body neúplnej evidencie. Medzera nie je závislá od existencie konkrétneho tankovania; budúce opravy a vymazanie musia túto informáciu zachovať.

Úprava aj vymazanie vrátane medzier sú exkluzívne transakcie; pri chybe sa všetky ich zápisy vrátia. Existujúca schéma v1 a údaje ostávajú zachované, tento krok nevyžaduje migráciu. Štatistiky sa odvodia z aktualizovanej histórie až po úspešnom zápise.

Pri oprave ceny, litrov, dátumu alebo plnej nádrže sa existujúce body medzier nemažú. Ak sa mení tachometer pri medzere v úseku presunu alebo pri jeho susedných hraniciach, zachováme aj pôvodný a nový bod tachometra ako medzery. Je to konzervatívne pravidlo: môže vylúčiť ďalší dotknutý interval, ale presun nesmie potichu vyhlásiť evidenciu za úplnú. Formulár na tento dôsledok upozorní. Samotná zmena dátumu bez zmeny tachometra pri platnej chronológii body nepridáva.

Voľba vynechaného tankovania pri úprave pridáva medzeru; jej vypnutie neodstraňuje skôr uložené medzery. Doplnenie záznamu tiež samo medzeru neuzatvára. Úplnosť konkrétneho úseku sa potvrdzuje samostatne cez Štatistiky → Skontrolovať medzery; podmienky a ochrana pred zmenou histórie sú v [špecifikácii](coverage-completion.md).

Objemy sú celé mililitre, sumy celé centy a pôvodná jednotková cena celé tisíciny EUR/l. Výpočet sumy používa celočíselné zaokrúhlenie half-up. Odvodené pomery sa zaokrúhľujú až pri zobrazení.

Vstupy sú obmedzené na tachometer 0–9 999 999 km, objem do 10 000 l, sumu do 999 999,99 € a jednotkovú cenu do 100 €/l. Nejednoznačný zápis, nadbytočná presnosť a budúci dátum sa odmietajú.

Zápis tankovania a prípadnej medzery prebieha v jednej exkluzívnej transakcii. Validácia sa opakuje nad aktuálnou históriou v transakcii. Úspech sa zobrazuje až po dokončení zápisu; pri chybe zostávajú vstupy vo formulári. Neznáma verzia databázy sa odmietne bez jej vymazania.

Použité API je overené podľa [oficiálnej dokumentácie expo-sqlite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/).

## Overenie

- Po doplnení [kontextu formulára](refuel-context.md) 2. 11. prešli typy, 75 testov (6 nových) a iOS export. V QA agent overil susedov pri úprave, zmenu kilometrov/dátumu, duplicitu a odmietnutie uloženia s ponechanou pomocou, prázdny vstup a dnešný nový formulár. Dočasné zmeny zahodil; história a súhrny sa nezmenili. Presný rozsah veľkého textu a limity sú v špecifikácii.
- Nadväzujúca [kontrola VoiceOver a výsledkov](ui-accessibility-review.md#nadväzujúca-kontrola-výsledkov-a-voiceover): výsledky súborových operácií sú hore a dostávajú fokus; so zapnutým VoiceOver agent pozoroval rámik na výsledku po zrušení zdieľania CSV. Overil chybu nesprávneho formátu, platný náhľad a jeho zrušenie, ochranu neuloženého formulára cez tlačidlo. Návrat gestom a celý výber súboru s VoiceOver zostávajú otvorené. Prešli typy, 69 testov a iOS export; reč ani fyzický iPhone neboli overené.
- [Úzke rozloženie a veľký text](responsive-layout-review.md): opravené zalamovanie veľkých súm, nadpisov a volieb. Cielene skúšaný obsah so šírkou 320 bodov a klávesnica na samostatnom iPhone 13 mini pri bežnom aj najväčšom texte. Prešli typy, 69 testov a iOS export; nejde o celý tok na 320-bodovom zariadení ani skúšku VoiceOver či fyzického iPhonu.
- Po doplnení grafov prešli typy, 69 testov a iOS export. Agent overil aktuálne QA hodnoty a pomocou dočasných dát iba pre zobrazenie aj stránkovanie, nuly, medzeru, prázdny stav a prvé čiastočné tankovanie. Overené veľký text a tmavý mesačný graf; detaily a limity sú v [grafoch štatistík](statistics-charts.md).
- [Cielená kontrola navigácie a prístupnosti](ui-accessibility-review.md): agent overil návraty, ochranu neuložených vstupov, chyby prázdneho formulára, softvérovú klávesnicu, navigáciu pri najväčšom texte a tmavý režim. Upravené názvy/stavy sú v prístupnostnom strome. Prešli typy, 63 existujúcich testov a iOS export; nejde o úplnú skúšku VoiceOver ani fyzického zariadenia.
- Po pridaní zálohy, obnovy, CSV exportu a potvrdenia úplnosti prešla typová kontrola `npm run typecheck`, všetkých 63 testov cez `npm test` a export iOS JS/Hermes balíka. Hlavný tok súborového UI následne používateľ úspešne overil v simulátore; podrobnosti v [overení zálohy](backup-and-restore.md).
- Testy: npm test, Node.js 24 a jeho vstavané testovacie a SQLite moduly.
- Doménové testy: presné vstupy, zaokrúhlenie, dátumy, susedia, plné/čiastočné tankovania, medzery, vážená spotreba a cena.
- Integračné testy používajú rovnaké repository funkcie a skutočné SQLite cez adaptér pre Node. Pokrývajú migráciu, odmietnutie novšej schémy, atomický rollback pri chybe, duplicity a zachovanie údajov po zatvorení a opätovnom otvorení databázového súboru.
- Doplnené integračné scenáre pre opravy a oba dôvody mazania, prepočty platieb a spotreby, stabilné ID, presnú pôvodnú cenu, susedov, zmeny plnej nádrže, presuny pri medzerách, prvý/posledný záznam, chýbajúce ID a rollback úpravy aj vymazania s možnosťou opakovania.
- Na iPhone 17 s iOS 27.0 v Expo Go vizuálne overená úvodná obrazovka Tankuj a jej ovládacie prvky. Testovacie tankovania neboli vložené do používateľovej histórie.
- Pri doplnení úprav a mazania vytvorený samostatný iPhone 17 simulátor Tankuj QA (iOS 27.0). V Expo Go sa podarilo vytvoriť vozidlo Tankuj QA a vyplniť formulár 10 000 km, 40 l, 64 € vrátane náhľadu 1,600 €/l. Uloženie tankovania, prepnutie plnej nádrže, úprava a vymazanie cez mobilné UI ani reštart s tankovaniami nie sú týmto pokusom overené. Ovládací nástroj pri prepínači a posúvaní opakovane hlásil windowNotFoundAtPosition alebo nezmenil UI; ani presun okna medzi displejmi a jeho vycentrovanie problém nevyriešili. Pôvodná používateľova evidencia na iPhone 17 nebola menená.

Dňa 1. 11. 2026 používateľ úspešne dokončil [vedený manuálny scenár](manual-verification.md) v simulátore cez Expo Go: zápis troch tankovaní, spotreba, úprava a prepočet, zrušenie vymazania, oba dôvody vymazania, zachovanie medzery, obnovenie merania a zachovanie údajov po úplnom zatvorení a opätovnom otvorení aplikácie. Výsledky potvrdil používateľ v chate; agent ich nepozoroval priamo.

Testy repository v Node nenahrádzajú úplné overenie expo-sqlite na zariadení. Úplná kontrola navigácie, VoiceOver, veľký text, Android a fyzický iPhone ešte vyžadujú samostatnú kontrolu. Natívny development build ani distribúcia týmto krokom nevznikli.

## Zostávajúce funkcie MVP

Dokončenie širšieho overenia UI a vlastný iOS build. Grafy štatistík sú implementované a overené v QA simulátore; nejde o dokončené všetky podmienky MVP. Potvrdenie úplnosti konkrétneho úseku je implementované a agentom overené v QA simulátore vrátane zachovania inej medzery po reštarte. CSV export aj jeho uloženie cez UI QA simulátora sú overené; priame otvorenie v Exceli/Numbers ešte nie. Hlavný mobilný tok JSON zálohy a obnovy úspešne prešiel; zostávajúce okrajové a vstupné scenáre uvádza [manuálna skúška](manual-backup-verification.md).

[Kontrola závislostí](dependency-review.md) 1. 11. zladila opravy v SDK 58 a React Native 0.88.1; prešli čistá inštalácia, 63 testov, Expo Doctor 20/20, export a základné UI overenie v QA simulátore. Audit teraz hlási 13 moderate (dve príčiny glob/minimatch v nástrojoch Expo), žiadne high ani low. Tieto zvyšné nálezy zostávajú otvorené. Ochrana histórie vyžaduje vedomé uloženie zálohy používateľom. Hlavný tok obnovy je overený v simulátore; fyzický iPhone a zostávajúce scenáre ešte vyžadujú samostatné testovanie pred širšou betou.
