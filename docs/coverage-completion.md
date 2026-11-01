# Potvrdenie úplnosti úseku histórie

Implementované a overené 1. 11. 2026. Dostupné cez Štatistiky → Skontrolovať medzery.

## Správanie

Používateľ najprv doplní chýbajúce tankovania alebo opraví históriu. Samotné doplnenie ani oprava neodstraňujú uložené medzery. Na obrazovke Medzery v evidencii si následne vyberie konkrétny úsek, skontroluje dátumy aj oba tachometre a výslovne potvrdí, že sú v ňom zapísané všetky skutočné tankovania.

Potvrdenie neodhaduje ani nedopĺňa chýbajúce litre. Odstráni iba označenia neúplnosti z vybraného úseku a prepočíta spotrebu. Tankovania, sumy, litre, ich ID a ostatné úseky sa nemenia. Zrušenie voľbou Ešte nie nič neuloží. Chyba obnoví ovládanie a ponechá medzery zachované.

## Rozsah potvrdenia

SQLite v1 uchováva medzery ako nezávislé body tachometra. Obrazovka ich zoskupí medzi najbližšie susedné tankovania v aktuálnej histórii:

- Bod na tachometri existujúceho tankovania patrí do úseku tesne pred týmto tankovaním.
- Viac bodov v tom istom úseku tvorí jednu kartu; potvrdenie odstráni všetky tieto body, nie body z iných úsekov.
- Po spätnom doplnení záznamu sa hranice kariet určia nanovo. Body samotným vložením nezmiznú.
- Medzery pred prvým tankovaním, po poslednom tankovaní alebo bez tankovaní sa zobrazia s vysvetlením. Kým nemajú obe ohraničujúce tankovania, nemožno ich potvrdiť. Používateľ najprv doplní potrebné záznamy. Toto pracovné pravidlo zabraňuje potvrdeniu neurčitej časti histórie alebo budúcnosti.
- Hranice nemusia byť plné nádrže: potvrdzuje sa úplnosť evidencie medzi susednými záznamami. Spotreba sa naďalej počíta iba medzi plnými nádržami, cez všetky medziľahlé čiastočné tankovania a bez zostávajúcich medzier.

## Ukladanie

Repository v exkluzívnej transakcii znova načíta aktuálnu históriu a vyhľadá presne ten úsek, ktorý používateľ skontroloval. Porovná všetky vstupy oboch hraníc aj identifikátory a polohy bodov medzier. Zmena hranice, vloženie záznamu do úseku, pridanie bodu alebo obnova iného datasetu s rovnakými ID zneplatní staré potvrdenie. Zmena nesúvisiaceho neskoršieho úseku ho nezneplatňuje.

Vymazanie bodov aj načítanie výsledného snapshotu sú v tej istej transakcii. Pri chybe počas ktoréhokoľvek zápisu sa celá operácia vráti; React stav sa nahradí až po úspešnom commite databázy. Každý bod sa vymaže podmienkou na jeho ID aj tachometer. Opakované potvrdenie starého úseku sa odmietne. Počas operácie sú ovládanie a odchod z obrazovky blokované.

Nevzniká migrácia ani zmena formátu zálohy: SQLite aj JSON zostávajú vo verzii 1. Nová záloha obsahuje už iba zostávajúce body medzier; obnova staršej zálohy vedome obnoví jej vtedajší stav vrátane vtedajších medzier.

## Overenie

- `npm run typecheck`: prešlo. Po pridaní novej cesty boli lokálne generované Expo typy obnovené cez `npx expo customize tsconfig.json`; verzovaný tsconfig sa nezmenil.
- `npm test`: všetkých 63 testov prešlo, z toho 11 nových doménových a SQLite testov pre túto funkciu.
- Doménové testy: zoskupovanie podľa hraníc, bod presne na tankovaní, viac bodov, spätné vloženie bez implicitného zrušenia, otvorené úseky, prázdna história a rozlíšenie zmien v potvrdení.
- SQLite testy: prepočty po doplnení, zachovanie susedných/prefixových/budúcich medzier a vstupov, duplicitné body na jednom tachometri, odmietnutie neaktuálneho alebo zostaveného cudzieho rozsahu, opakované potvrdenie, zmena nesúvisiaceho úseku, rollback po čiastočnom vymazaní a opakovanie. Potvrdený stav prežil zatvorenie/otvorenie databázového súboru aj JSON export a obnovu.
- Export iOS JS/Hermes balíka prešiel. Nejde o vlastný natívny build.

Agent sám vykonal UI test v samostatnom Tankuj Restore QA (iPhone 17, iOS 27.0, Expo Go 58.0.7):

1. K obnoveným záznamom A/C/E doplnil cez formulár B: 10 200 km, 12 l, 19,20 €, čiastočné. Zostala medzera pri 10 200 km a spotreba 6,00 iba za C–E; vloženie samo neuzavrelo medzeru.
2. Úpravou E a voľbou vynechaného tankovania pridal druhú testovaciu medzeru pri 11 000 km. Platby 163,20 €, objem 102 l; bez platnej spotreby.
3. Obrazovka správne pomenovala dva úseky 10 000–10 200 a 10 500–11 000 km. Zrušenie konečného potvrdenia ponechalo oba.
4. Potvrdenie prvého úseku odstránilo iba prvú medzeru. Vznikol interval A–C: 500 km, 32 l, 6,40 l/100 km. Druhý úsek zostal neúplný, platby a litre sa nezmenili.
5. Po úplnom ukončení Expo Go cez prepínač aplikácií a otvorení Tankuj zostala spotreba 6,40 aj druhá medzera. Read-only kontrola natívnej SQLite potvrdila štyri záznamy, 163,20 €, 102 l a jediný bod pri 11 000 km. Pôvodný simulátor zostal na troch záznamoch, 144 €, 90 l a pôvodnej medzere pri 10 200 km.
6. Po potvrdení druhého úseku sa zobrazil stav Bez označených medzier a v štatistikách 2 platné intervaly za 1 000 km, vážená spotreba 6,20 l/100 km, nezmenené platby 163,20 € a 102 l.

Toto je agentom vykonaný UI test a read-only kontrola natívnej databázy v simulátore; nezvyšuje počet automatizovaných testov. Otvorené úseky a súbežné zmeny sú pokryté doménovými/SQLite testami, nie samostatnou UI skúškou. Fyzický iPhone, Android, VoiceOver a veľký text ešte vyžadujú overenie.
