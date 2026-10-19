# Špecifikácia MVP

Stav: prvý pracovný návrh, 19. 10. 2026. Predpoklady sú uvedené nižšie; ich správnosť overíme pri návrhu toku a v bete.

## Problém a používateľ

Bežný vodič chce vedieť, koľko platí za palivo, akú má spotrebu a ako sa tieto hodnoty menia. Nechce viesť podrobné účtovníctvo ani každý deň otvárať aplikáciu.

Najväčšie riziko: zapisovanie je príliš náročné alebo vynechané tankovanie znehodnotí štatistiky a používateľ stratí dôveru.

Pracovné predpoklady pre prvé vydanie:

- Jeden vodič, jedno vozidlo, jeden druh paliva: benzín alebo diesel.
- Slovenčina, kilometre, litre a eurá.
- Najprv testovanie a vydanie na iOS, Android neskôr.
- Bez účtu, backendu, reklám a platieb v prvej bete.
- Bez GPS, sledovania jázd a automatického zisťovania tankovaní.

## Produktové ciele

1. Prvé tankovanie uložiť bez vysvetľovania približne do minúty od prvého otvorenia.
2. Opakované tankovanie uložiť približne za 15–20 sekúnd.
3. Po prvom zázname zobraziť zaplatenú sumu, litre a cenu za liter.
4. Po prvom platnom intervale zobraziť vypočítanú spotrebu s rozsahom merania.
5. Umožniť pokračovať po chybe alebo vynechanom zázname bez zavádzajúcich výsledkov.

Časové ciele sú hypotézy na overenie, nie výsledky merania.

## Rozsah prvého vydania

| Oblasť | Obsah MVP |
| --- | --- |
| Vozidlo | Výber paliva, voliteľný názov, predvolene „Moje auto“ |
| Tankovanie | Dátum, tachometer, litre, suma alebo jednotková cena, plná nádrž, vynechané tankovanie |
| História | Zoznam, detail, úprava, doplnenie staršieho a vymazanie záznamu |
| Prehľad | Mesačné platby, posledné tankovanie, dostupná spotreba, jedno užitočné zistenie |
| Štatistiky | Spotreba po platných intervaloch, zaplatená cena za liter, mesačné platby |
| Dáta | Trvalé lokálne uloženie, CSV export a JSON záloha s obnovou |
| Nastavenia | Vozidlo, vysvetlenie výpočtov, export, záloha a obnova |

Odkladáme viac vozidiel, iné meny a jednotky, LPG/CNG a kombinované pohony, elektromobily, OCR, cloud, notifikácie, externé ceny palív, servis, predplatné a rozklad príčin rastu nákladov.

## Navigácia

Tri hlavné časti: **Prehľad**, **História**, **Štatistiky**. Pridanie tankovania musí byť ľahko dostupné z prehľadu aj histórie. Nastavenia sú dostupné z prehľadu.

Formulár pridania a úpravy je jeden spoločný tok. O konkrétnej prezentácii (samostatná obrazovka alebo modal) rozhodne návrh rozhrania.

## Používateľské toky a akceptačné kritériá

### 1. Prvé spustenie

Používateľ vyberie benzín alebo diesel. Názov auta je voliteľný. Potom môže hneď pridať tankovanie.

- Bez registrácie, sieťového pripojenia a systémových oprávnení.
- Žiadny povinný carousel ani ďalšie profilové údaje.
- Prázdny prehľad vysvetľuje prínos a ponúka „Pridať tankovanie“.
- Nedostupná spotreba sa zobrazuje ako chýbajúci údaj s vysvetlením, nikdy ako nula.

### 2. Pridanie tankovania

Predvolené zadávanie: tachometer, litre a celková zaplatená suma. Používateľ môže prepnúť na zadanie litrov a ceny za liter. Dátum je predvyplnený na dnešný lokálny deň.

- Litre sú vždy povinné; z dvojice suma/jednotková cena používateľ zadáva jednu hodnotu. Druhá sa dopočíta.
- „Do plnej nádrže“ je pri novom zázname predvolene vypnuté; nepreberá sa automaticky z minulého tankovania.
- Krátka pomoc vysvetlí, že plná nádrž umožňuje vypočítať spotrebu. Prvý záznam nemusí byť plný.
- Pod „Ďalšie možnosti“ je „Od predchádzajúceho záznamu som vynechal tankovanie“ s predvolenou hodnotou vypnuté.
- Cena z minulého tankovania môže byť zobrazená ako referencia, nenahradí aktuálnu sumu bez vedomého výberu.
- Klávesnica podporí desatinné zadávanie; prijmeme čiarku aj bodku. Pravidlá presnosti sú v dokumente výpočtov.
- Chyba je pri príslušnom poli a ponechá ostatné vstupy. Zamedzíme opakovanému uloženiu toho istého formulára počas zápisu.
- Úspech sa zobrazí až po dokončení zápisu. Pri chybe úložiska zostanú údaje vo formulári a používateľ môže skúsiť uloženie znova.
- Zatvorenie zmeneného formulára ponúkne pokračovať alebo zahodiť zmeny.

### 3. Výsledok po uložení

- Prvé tankovanie: suma, litre, jednotková cena a stručné vysvetlenie ďalšieho kroku merania.
- Platný uzavretý interval: spotreba, vzdialenosť a dátumy, medzi ktorými bola vypočítaná.
- Čiastočné tankovanie: záznam je uložený, platby aktualizované, meranie spotreby čaká na plnú nádrž.
- Vynechané tankovanie: záznam je uložený a aplikácia vysvetlí obnovenie merania od novej plnej nádrže.
- Hlásenie úspechu je dostupné aj pre čítačku obrazovky.

### 4. História, opravy a vymazanie

- Zoznam je od najnovšieho záznamu, s dátumom, tachometrom, litrami, sumou a označením plnej nádrže.
- Starší záznam sa dá doplniť; dátum a tachometer sa validujú voči obom susedom.
- Úprava prepočíta dotknuté intervaly a súhrny. Identita záznamu zostáva zachovaná.
- Vymazanie vyžaduje potvrdenie. Dialóg rozlíši chybný/duplicitný záznam od skutočného tankovania, ktoré používateľ odstraňuje z evidencie.
- Odstránenie skutočného tankovania vytvorí medzeru v meraní; aplikácia nesmie automaticky uznať neúplný interval za platný. Platí to aj pri odstránení najnovšieho záznamu a následnom budúcom tankovaní.
- Oprava údajov, zápis informácie o medzere a prepočet výsledkov sa prejavia konzistentne; pri chybe sa neuloží iba časť zmeny.
- Doplnenie záznamu samo nezruší už označenú medzeru. Používateľ vedome potvrdí úplnosť príslušného úseku histórie.

### 5. Prehľad a štatistiky

- Mesačné platby zahŕňajú všetky evidované tankovania podľa ich dátumu, vrátane čiastočných a prvého tankovania.
- Celková spotreba sa váži vzdialenosťou platných intervalov; neuzavreté a neúplné intervaly sa nezahrnú.
- Každý údaj má jednotku, pomenované obdobie a zrozumiteľný stav bez dostatku dát.
- Pri spotrebe ukážeme rozsah merania a počet platných intervalov. Nevydávame ju za presnú spotrebu kalendárneho mesiaca.
- Grafy majú textový súhrn a dostupné číselné hodnoty; informácia sa neprenáša iba farbou.
- Zistenia sú založené na jednoduchých pravidlách, bez AI služby. Napríklad rozdiel jednotkovej ceny oproti predchádzajúcemu záznamu.
- Porovnanie ceny zobrazuje oba dátumy; nejde o tvrdenie o trhových cenách. Pri zmene dát sa zistenie prepočíta.
- V MVP neporovnávame rozpracovaný mesiac s celým minulým mesiacom percentuálnou nálepkou rastu.

### 6. Export, záloha a obnova

- CSV je čitateľný export histórie, JSON je verzovaná záloha na obnovu. CSV import zatiaľ nie je súčasťou MVP.
- JSON zachová vstupy, nastavenie vozidla, stabilné identifikátory a všetky informácie o medzerách. Odvodené výsledky sa po obnove prepočítajú.
- Obnova v MVP nahrádza celý lokálny dataset; nezlučuje dve histórie.
- Pred potvrdením sa zobrazí vozidlo, počet záznamov a rozsah dát zo zálohy, spolu s upozornením na nahradenie súčasných údajov a možnosťou ich zálohovať.
- Neplatný súbor, duplicitné identifikátory, rozporné vstupy alebo nepodporovaná verzia sa odmietnu pred zmenou dát. Obnova je atomická.
- Zrušenie výberu alebo zdieľania súboru nie je chyba a nemení dáta.
- Záloha je manuálna a nešifrovaná; rozhranie to zrozumiteľne uvedie. Samotný export bez možnosti obnovy nie je splnenie požiadavky ochrany histórie.

## Spoločné požiadavky

- Safe areas, malé displeje, zväčšený text, čítačka obrazovky a obmedzenie pohybu.
- Dotykové plochy aspoň 44 × 44 logických bodov na iOS; kontrast a stavy overíme pri návrhu.
- Klávesnica nezakryje aktívne pole ani možnosť uloženia. Návrat späť sa správa konzistentne.
- Počas načítania lokálnych dát nezobrazujeme falošný prázdny stav. Chyba otvorenia databázy nesmie viesť k jej tichému vymazaniu.
- Offline režim je bežný stav, nepotrebuje chybový banner. Základné funkcie nevyžadujú sieť.
- MVP nežiada polohu, kameru, kontakty ani notifikácie. Zrušenie alebo odmietnutie prístupu pri práci so súborom má zrozumiteľný výsledok.
- Žiadna vzdialená analytika ani crash reporting bez samostatného rozhodnutia. Do diagnostických logov nepatria celé tankovania ani obsah záloh.

## Overenie produktovej hypotézy

Prototyp overíme s 3–5 vodičmi; uzavretú betu plánujeme s 10–20 vodičmi počas viacerých reálnych tankovaní, orientačne 6–8 týždňov.

Zisťujeme dokončenie a čas prvého aj opakovaného zápisu, zápis druhého a tretieho skutočného tankovania, pochopenie nedostupnej spotreby a užitočnosť prehľadu. V rozhovoroch rozlíšime používateľa, ktorý ešte netankoval, od používateľa, ktorý tankovanie nezapísal.

Najprv použijeme pozorovanie a dobrovoľnú spätnú väzbu. Tieto metriky samy neznamenajú pridanie telemetrie. Denné otvorenia nie sú hlavným ukazovateľom úspechu.
