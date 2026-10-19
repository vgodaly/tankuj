# Pravidlá dát a výpočtov

Stav: pracovná špecifikácia doménovej logiky, 19. 10. 2026. Príklady sú vymyslené a slúžia ako budúce testovacie prípady.

## Vstupy a presnosť

| Údaj | Pravidlo |
| --- | --- |
| Dátum | Lokálny kalendárny deň `YYYY-MM-DD`, najneskôr dnešný deň podľa zariadenia |
| Tachometer | Nezáporné celé kilometre; pri zoradení podľa času musí striktne rásť |
| Litre | Kladné číslo, najviac 3 desatinné miesta |
| Zaplatená suma | Kladné číslo v EUR, najviac 2 desatinné miesta |
| Zadaná jednotková cena | Kladné číslo v EUR/l, najviac 3 desatinné miesta |
| Plná nádrž | Výslovný údaj používateľa, predvolene vypnuté |
| Medzera v evidencii | Označenie neúplného úseku, zachované aj pri úpravách a zálohe |

Každý záznam má stabilné ID a zvolený režim zadania ceny. Čas vytvorenia a poslednej zmeny sú technické metadáta, neurčujú poradie tankovaní. Vozidlo má stabilné ID, názov a druh paliva.

Čiarku aj bodku prijmeme ako desatinný oddeľovač; nejednoznačné zápisy, záporné hodnoty, nekonečno a nečíselné vstupy odmietneme. Nadbytočné desatinné miesta neopravujeme potichu. Implementácia musí odmietnuť aj hodnoty a súčty mimo bezpečného rozsahu použitého číselného typu.

### Zadanie ceny

- **Suma:** používateľ zadá litre a skutočne zaplatenú sumu. Efektívna jednotková cena je `totalAmount / liters`.
- **Jednotková cena:** používateľ zadá litre a cenu za liter. Suma je `roundHalfUp(liters × enteredUnitPrice, 2)` a je označená ako vypočítaná.
- Pôvodná zadaná jednotková cena zostáva zachovaná. Rozdiel vzniknutý zaokrúhlením sumy nie je chyba dát.
- V režime sumy sa pred uložením prechodu na jednotkovú cenu vyžaduje vedomé potvrdenie nového vstupu; zaokrúhlená zobrazená cena nesmie potichu prepísať pôvodnú sumu.
- Pre štatistiky používame efektívnu cenu zo sumy a litrov, s nezaokrúhleným podielom až do zobrazenia.

Finančné a objemové vstupy uchovávame presne, napríklad ako celočíselné centy, mililitre a tisíciny EUR/l. Zvoliť treba jeden konzistentný spôsob. Výpočty nesmú závisieť od kumulovaných chýb binárneho zaokrúhľovania.

Zobrazenie: sumy na 2 miesta, jednotková cena na 3, spotreba na 2. Medzivýsledky spotreby nezaokrúhľujeme. Súhrny sa počítajú zo vstupov a platných intervalov, nie zo zaokrúhlených hodnôt na obrazovke.

### Poradie a validácia

Záznamy zoradíme podľa dátumu vzostupne a pri rovnakom dni podľa tachometra vzostupne. Dva záznamy s rovnakým tachometrom v MVP nepovolíme; zlúčenie tankovaní bez jazdy je mimo prvého vydania.

Nový alebo upravený záznam musí zapadať medzi časových susedov aj hodnotou tachometra. Pri zmene dátumu sa susedia určia nanovo. Výmena tachometra a jeho pretočenie sú mimo MVP; neobchádzajú sa záporným rozdielom kilometrov.

Neobvykle vysokú či nízku spotrebu označíme na kontrolu vstupov; nevymažeme automaticky záznam ani neurčíme poruchu auta. Konkrétne varovné prahy sú úlohou validácie pri implementácii a musia byť pokryté testami.

## Spotreba medzi plnými nádržami

Platný interval začína záznamom do plnej nádrže a končí ďalším záznamom do plnej nádrže. Medzi nimi môžu byť čiastočné tankovania, musí však byť úplná evidencia.

```text
distanceKm = end.odometerKm - start.odometerKm
consumedLiters = sum(liters after start up to and including end)
consumptionPer100Km = consumedLiters / distanceKm × 100
```

Litre úvodnej plnej nádrže sa nezapočítajú. Koncová plná nádrž je súčasne začiatkom ďalšieho merania; jej litre sa v ďalšom intervale nezapočítajú znova.

Ide o metódu merania z tankovaní. Ani platný interval nie je laboratórne presné meranie; závisí napríklad od konzistentného naplnenia nádrže.

### Pravidlá priechodu históriou

1. Bez úvodnej plnej nádrže neexistuje základ merania; skoršie litre sa do budúceho intervalu neprenesú.
2. Po úvodnej plnej nádrži sčítavame všetky ďalšie litre.
3. Nasledujúca plná nádrž bez medzery uzavrie platný interval s kladnou vzdialenosťou.
4. Medzera pred aktuálnym tankovaním preruší rozpracované meranie. Platné staršie intervaly ostávajú platné.
5. Ak je aktuálne tankovanie s medzerou plné, hneď tvorí nový základ. Ak je čiastočné, čakáme na ďalšiu plnú nádrž, ktorá vytvorí nový základ bez výsledku za neúplný úsek.
6. Posledný otvorený interval nedáva spotrebu. Jeho platby sa naďalej započítavajú do výdavkov.

Doménová vrstva rozlišuje aspoň stavy: chýba úvodná plná nádrž, čaká sa na koncovú plnú nádrž, evidencia je neúplná, platný výsledok. Neplatnosť vstupu je validačná chyba; nie je to spotreba nula.

## Medzery, úpravy a vymazanie

Označenie „vynechal som tankovanie“ znamená neúplný úsek medzi predchádzajúcim evidovaným tankovaním a aktuálnym záznamom. Pri prvom zázname neposkytuje dodatočnú spotrebu.

Medzera je informácia o histórii, nesmie sa stratiť iba preto, že používateľ záznam vymaže, presunie alebo vloží medzi existujúce záznamy. Konkrétna reprezentácia v databáze sa zvolí pri dátovom modeli; obyčajné vymazanie príznaku spolu so záznamom nie je prípustné.

- Pri odstránení chybného/duplicitného záznamu sa história prepočíta zo zostávajúcich vstupov; existujúce medzery sa zachovajú.
- Pri odstránení skutočného tankovania sa príslušný úsek označí ako neúplný. Ak ešte nemá nasledujúci záznam, informácia sa musí zachovať pre budúce tankovanie.
- Po doplnení chýbajúceho tankovania používateľ výslovne potvrdí úplnosť konkrétneho úseku. Aplikácia ju neodvodí len z prítomnosti nového záznamu.
- Pri zmene dátumu alebo tachometra sa skontrolujú susedia aj dotknuté medzery. Ak nie je jasné, ktorého úseku sa medzera týka, zostane dotknuté meranie vylúčené, kým používateľ nepotvrdí úplnosť.
- Odvodené intervaly sa v MVP môžu vždy prepočítať z celej histórie jedného auta. Bez konkrétneho dôvodu nebudujeme inkrementálnu analytiku.

## Súhrny a interpretácia

### Celková spotreba

```text
averageConsumption = sum(validIntervalLiters) / sum(validIntervalKm) × 100
```

Nepoužívame jednoduchý priemer spotrieb. Bez platných intervalov výsledok chýba. V rozhraní uvádzame počet intervalov a ich rozsah; medzery sa nesmú skryť za označenie súvislého merania.

### Zaplatené sumy a cena paliva

- Mesačné platby sú súčet evidovaných súm s dátumom v danom kalendárnom mesiaci.
- Mesiac s nulovým počtom záznamov má „0 € v evidencii“, nie tvrdenie, že používateľ netankoval.
- Priemerná zaplatená cena za liter je `sum(totalAmount) / sum(liters)` pre zvolené záznamy. Nie je to priemer jednotlivých cien.
- Cena za liter po prvom zázname aj mesačné platby sú dostupné bez merateľnej spotreby.
- Dátum tankovania ostáva lokálnym kalendárnym dňom aj pri zmene časového pásma telefónu.

### Čo z evidencie nevieme

Zostatok paliva v nádrži na začiatku a konci mesiaca nepoznáme. Zaplatené sumy sa preto nemusia rovnať hodnote paliva spotrebovaného v rovnakom mesiaci. Ani vzdialenosť intervalu prechádzajúceho cez hranicu mesiaca nemožno presne rozdeliť na mesiace bez ďalších údajov.

MVP preto neuvádza presné mesačné kilometre, presnú mesačnú spotrebu, náklady na skutočne spotrebované palivo ani rozklad mesačného rozdielu na cenu, vzdialenosť a spotrebu. Spotrebu zobrazuje po intervaloch a celkovo. Náklady na 100 km odložíme, kým nebude výslovne zvolený a pomenovaný model ocenenia paliva.

## Referenčné prípady pre budúce testy

`F` znamená plnú nádrž, `P` čiastočnú. Čísla pri záznamoch sú tachometer a natankované litre.

| Prípad | Vstupy | Očakávanie |
| --- | --- | --- |
| Prvý záznam | F: 10 000 km, 40 l | Základ merania; žiadna spotreba |
| Dve plné | F: 10 000/40; F: 10 500/30 | 500 km, 30 l, 6,00 l/100 km |
| Čiastočné medzi plnými | F: 10 000/40; P: 10 200/10; F: 10 500/20 | 500 km, 30 l, 6,00 |
| Bez úvodnej plnej | P: 10 000/10; F: 10 200/15; F: 10 700/30 | Až interval 10 200–10 700: 6,00; skorších 10 a 15 l sa nezapočíta |
| Otvorený koniec | F: 10 000/40; P: 10 200/10 | Spotreba čaká, obe platby sú v evidencii |
| Medzera pred plnou | F: 10 000/40; F s medzerou: 10 500/25; F: 11 000/30 | Prvý úsek neplatný, druhý 6,00 |
| Medzera pred čiastočnou | F: 10 000/40; P s medzerou: 10 300/10; F: 10 500/20; F: 11 000/30 | Nový základ až 10 500; jediný výsledok 6,00 |
| Nadväzujúce intervaly | F: 10 000/40; F: 10 500/30; F: 10 900/28 | 6,00 a 7,00; súhrn 58/900 × 100 = 6,44 |
| Váženie spotreby | Platné intervaly: 100 km/10 l a 900 km/45 l | Súhrn 5,50, nie 7,50 |
| Váženie ceny | 10 l za 20 € a 40 l za 60 € | 1,600 €/l, nie 1,750 €/l |
| Zaokrúhlenie ceny | 10,500 l pri 1,639 €/l | Vypočítaná suma 17,21 €; pôvodná cena zostáva 1,639 |
| Rovnaký tachometer | Dva záznamy 10 000 km | Odmietnutie s vysvetlením, bez delenia nulou |
| Spätný záznam | Susedia 10. 10.: 10 000 a 20. 10.: 10 500; nový 15. 10.: 10 600 | Odmietnutie rozporného tachometra |
| Dve tankovania v deň | Rovnaký dátum, 10 000 a 10 200 km | Povolené, poradie určuje tachometer |
| Oprava čiastočného | Príklad čiastočného medzi plnými; 10 l sa zmení na 12 l | Nový výsledok 32/500 × 100 = 6,40 |
| Vymazanie skutočného | Z príkladu s čiastočným sa odstráni reálnych 10 l | Úsek neplatný; nesmie vzniknúť 4,00 |
| Vymazanie posledného | F: 10 000/40; P: 10 200/10 sa odstráni ako skutočné; neskôr F: 10 500/20 | Medzera pretrvá; 10 500 je nový základ |
| Doplnenie medzery | Do príkladu s medzerou sa vloží záznam | Neplatnosť sa nezruší bez potvrdenia úplnosti |
| Hranica mesiaca | F: 31. 1. a F: 10. 2. | Platby podľa mesiaca dátumu; spotreba za celý interval, nie presná februárová |
| Nulový menovateľ | Žiadne litre alebo žiadny platný interval | Chýbajúci súhrn, nikdy NaN/Infinity ani falošná nula |
| Lokalizované vstupy | `10,5` a `10.5` | Rovnakých 10,500 l; nejednoznačné zápisy odmietnuté |
| Obnova zálohy | Export a obnova rovnakej histórie vrátane medzier | Rovnaké vstupy, platné intervaly, súhrny a stav merania |

Tieto prípady ešte nie sú spustené automatizované testy. Pri implementácii sa doplnia o kombinácie úprav, medzier, validácie zálohy a chýb zápisu.
