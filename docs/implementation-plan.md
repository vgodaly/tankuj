# Implementačný plán

Úlohy sú zoradené podľa závislostí. Rozsah vychádza zo [špecifikácie MVP](mvp.md) a [pravidiel výpočtov](calculations.md). Nejde o zoznam už implementovaných funkcií.

## 1. Tok a návrh obrazoviek

**Výstup:** návrh prvého spustenia, prehľadu, formulára, výsledku po uložení, histórie/detailu, štatistík a nastavení so zálohami.

**Akceptácia:** celé scenáre prvého, opakovaného, čiastočného a vynechaného tankovania; návrat po chybe a úprava staršieho záznamu. Zahrnuté prázdne stavy, načítanie, chyba zápisu, zväčšený text a klávesnica. Pri návrhu rozlíšime platný výsledok od nedostupného merania.

**Overenie:** priechod prototypom a podľa dostupnosti 3–5 vodičov. Pozorovanie zaznamenáme; nepovažujeme internú kontrolu za používateľský test.

## 2. Technický základ a prvý iOS build

**Závisí od:** návrhu hlavného toku; technickú prípravu možno vykonať popri dizajne po začatí implementácie.

**Výstup:** Expo/TypeScript projekt, navigácia, základ komponentov, vývojové príkazy, `.gitignore`, súbor závislostí so zámkom verzií a dokumentácia spustenia.

**Akceptácia:** kompatibilné verzie overené z oficiálnych zdrojov; aplikácia sa otvorí na iOS a má základ použiteľný pre Android. Identifikátor aplikácie sa zvolí pred registráciou. Údaje podpisovania a tajomstvá sa neukladajú do repozitára.

**Overenie:** typová kontrola, lint a dostupné zostavenie. Samostatne uvedieme, čo bolo spustené v simulátore a čo na iPhone. Vlastný development build a prvý TestFlight build overia distribúciu včas; operácie vyžadujúce účet, platbu alebo publikovanie sa vykonajú podľa udeleného súhlasu.

## 3. Doménové typy, vstupy a meranie

**Závisí od:** technického základu.

**Výstup:** čisté funkcie pre normalizáciu vstupov, validáciu chronológie, výpočet intervalov, agregácie a stavy bez výsledku. Bez závislosti výpočtov od UI alebo databázy.

**Akceptácia:** všetky referenčné prípady výpočtov majú správny výsledok. Zvolená presná reprezentácia čísel a explicitná reprezentácia medzier vrátane vymazania posledného záznamu. Určené a overené varovné prahy pre nezvyčajné vstupy.

**Overenie:** jednotkové testy pravidiel a hraničných stavov. Testy sú najmä pre matematiku a zmeny histórie, nie pre kopírovanie implementácie komponentov.

## 4. Lokálne úložisko a migrácie

**Závisí od:** doménových typov a reprezentácie medzier.

**Výstup:** SQLite schéma pre vozidlo, tankovania a informácie o úplnosti histórie; prvá migrácia a úzke rozhranie na čítanie a zápis.

**Akceptácia:** databáza vynucuje potrebné obmedzenia, úpravy sú transakčné, záznamy prežijú reštart. Odvodené metriky možno znova vytvoriť zo vstupov. Zlyhanie migrácie nespôsobí tiché nahradenie databázy prázdnou.

**Overenie:** integračné skúšky vytvorenia databázy, zápisu, opravy, vymazania s medzerou a návratu transakcie pri chybe.

## 5. Prvý úplný používateľský tok

**Závisí od:** návrhu, výpočtov a úložiska.

**Výstup:** nastavenie vozidla → pridanie tankovania → potvrdenie uloženia → záznam v histórii a prehľade.

**Akceptácia:** funguje offline; podporuje oba režimy ceny, čiarku, čiastočné tankovanie a chýbajúce údaje pre spotrebu. Opakované stlačenie uloženia nevytvorí duplikát.

**Overenie:** manuálny hlavný tok v simulátore a následne na iPhone, vrátane malého displeja, klávesnice, reštartu aplikácie a chyby zápisu. Výsledky sa zaznamenajú oddelene.

## 6. História a opravy

**Závisí od:** prvého úplného toku.

**Výstup:** detail, úprava, spätné vloženie, vymazanie s rozlíšením skutočného tankovania a chybného záznamu, potvrdenie úplnosti medzery.

**Akceptácia:** opravy aktualizujú všetky súhrny; susedia sa kontrolujú pri zmene dátumu; medzery prežijú vloženie, presun aj vymazanie.

**Overenie:** doménové a integračné regresné testy zmien histórie; manuálne overenie zrozumiteľnosti potvrdení.

## 7. Prehľad, grafy a jednoduché zistenia

**Závisí od:** správnych výpočtov a histórie.

**Výstup:** mesačné platby, intervalová a celková spotreba, vážená cena paliva a jednoduché porovnanie posledných cien.

**Akceptácia:** jednotky a rozsah sú jasné, neúplné dáta nepôsobia ako presné meranie, graf má aj textový obsah a čísla. Nevzniká tvrdenie o mesačnej spotrebe ani o príčine zmeny nákladov bez dát.

**Overenie:** kontrola proti referenčným dátam a manuálna kontrola prístupnosti, veľkého textu a prázdnych stavov.

## 8. Export a obnova

**Závisí od:** stabilného modelu a úložiska; potrebné pred externou betou.

**Výstup:** CSV export, verzovaná JSON záloha, validátor a atomická obnova nahradením datasetu.

**Akceptácia:** export a obnova zachovajú identitu aj medzery; neplatná alebo novšia nepodporovaná záloha nemení databázu. Používateľ pred nahradením vidí súhrn a môže zálohovať súčasnú históriu.

**Overenie:** export → obnova → rovnaké výsledky; poškodený a neznámy formát; duplicitné ID; zrušenie výberu; chyba uprostred obnovy; práca so súbormi na iPhone.

## 9. iOS beta

**Závisí od:** dokončenia jadra, záloh a kontroly prístupnosti.

**Výstup:** testovací build, stručný návod pre testerov a evidencia chýb/spätnej väzby.

**Akceptácia:** žiadna známa chyba straty dát alebo nesprávnej spotreby v pokrytých scenároch; overená aktualizácia testovacej verzie so zachovaním histórie. Beta umožní niekoľko reálnych tankovaní.

**Overenie:** 10–20 vodičov, orientačne 6–8 týždňov podľa frekvencie tankovania. Zistíme dôvody nezapísania druhého a tretieho tankovania. Zber telemetrie nie je automatickou súčasťou úlohy.

## 10. Verejné iOS vydanie a následný Android

**Závisí od:** výsledkov bety.

**Výstup:** opravy, podklady pre obchod, informácie o súkromí, podpora, plán aktualizácie a obnovy pri problémoch.

**Akceptácia:** aktuálne pravidlá obchodu a použité SDK sú overené, vydanie je pripravené na kontrolu. Publikovanie až s konkrétnym súhlasom používateľa.

Android následne dostane samostatnú kontrolu navigácie, tlačidla späť, klávesnice, súborových tokov, uloženia, prístupnosti a distribúcie. Zdieľaný kód nie je dôkaz otestovania na Androide.

## Pracovný postup

Každá implementačná úloha má malý rozsah, konkrétny výsledok a primerané overenie. Výpočty, UI a prístup k dátam oddeľujeme bez zavádzania backendu a ďalších vrstiev bez potreby. Po významnej zmene aktualizujeme [stav projektu](project-status.md).
