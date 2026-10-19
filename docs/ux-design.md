# Návrh obrazoviek a používateľského toku

Prvý návrh, 19. 10. 2026. Vychádza zo [špecifikácie MVP](mvp.md) a [pravidiel výpočtov](calculations.md).

Klikateľný návrh je v [design/](../design/README.md). Obsahuje vymyslené údaje a simulované systémové operácie; nie je to mobilná aplikácia ani používateľsky overený dizajn.

## Hlavné rozhodnutia

- Jedna úvodná obrazovka: druh paliva a nepovinný názov auta. Žiadna registrácia ani carousel.
- Tri hlavné sekcie: Prehľad, História, Štatistiky. Nastavenia sú sekundárny cieľ z prehľadu.
- Formulár je samostatná obrazovka s možnosťou zrušenia; hlavné záložky počas zápisu nezobrazujeme. Zostane priestor pre polia a klávesnicu.
- Predvolený režim: tachometer, litre a zaplatená suma. Cena za liter je alternatívny vstup, nie štvrté povinné pole.
- Výsledok uloženia je krátka samostatná obrazovka: uložené hodnoty a spotreba alebo vysvetlenie ďalšieho merania.
- Prehľad vedie zaplatenou sumou za mesiac. Spotreba má vlastný rozsah a jasné označenie dostupnosti.
- Dôležité vysvetlenie sa zobrazuje pri konkrétnom rozhodnutí, nie v dlhom úvodnom návode.

Výsledok po uložení je pracovná voľba. Pri testovaní zistíme, či pomáha porozumeniu; ak pri opakovanom používaní iba zdržuje, skrátime ho bez straty potvrdenia a informácie o spotrebe.

## Mapa toku

~~~mermaid
flowchart TD
    A[Prvé otvorenie] --> B[Palivo a názov auta]
    B --> C[Prázdny prehľad]
    C --> D[Nové tankovanie]
    P[Prehľad s históriou] --> D
    H[História] --> D
    D --> V{Validné vstupy?}
    V -->|Nie| E[Chyba pri poli, vstupy zostávajú]
    E --> D
    V -->|Áno| W{Zápis úspešný?}
    W -->|Nie| R[Opakovanie bez straty vstupov]
    R --> D
    W -->|Áno| S[Potvrdenie a dostupný výsledok]
    S --> P
    P --> H
    H --> F[Detail tankovania]
    F --> U{Úprava alebo vymazanie?}
    U -->|Úprava| D
    U -->|Vymazanie| K[Potvrdenie a zachovanie medzery]
    K --> H
    P --> T[Štatistiky]
    P --> N[Nastavenia]
    N --> Z[Záloha alebo obnova]
~~~

Diagram vetví len hlavné cesty; rozhodnutia pri vymazaní sú rozpísané nižšie.

## Obrazovky a stavy

| ID | Obrazovka | Hlavný obsah a akcia | Osobitné stavy |
| --- | --- | --- | --- |
| S01 | Úvod | Benzín/Diesel, nepovinný názov; „Začať zapisovať“ | Prázdny názov použije „Moje auto“ |
| S02 | Prehľad | Zaplatené za mesiac, spotreba, užitočné zistenie, posledné tankovanie; „Pridať tankovanie“ | Prázdno, prvý základ, otvorený interval, platné meranie, medzera, načítanie, chyba úložiska |
| S03 | Tankovanie | Tachometer, litre, režim ceny, suma/cena, plná nádrž, dátum; „Uložiť tankovanie“ | Nový/spätný/úprava, chybný vstup, ukladanie, chyba zápisu |
| S04 | Uložené | Suma, litre a cena; dostupná spotreba alebo vysvetlenie | Úvodná plná, čiastočné, uzavretý interval, obnovenie po medzere |
| S05 | História | Záznamy od najnovšieho; pridanie a otvorenie detailu | Bez záznamov, prázdny výsledok po vymazaní |
| S06 | Detail | Dátum, plnosť, suma, litre, tachometer a efektívna cena | Úprava, potvrdenie vymazania, údaj o neúplnosti úseku v produkčnom návrhu |
| S07 | Štatistiky | Vážená spotreba a jej rozsah, intervaly, sumy a vážená cena | Bez platného merania, vylúčené úseky, potvrdenie doplnenia konkrétnej medzery |
| S08 | Nastavenia | Vozidlo, jednotky, záloha, export a vysvetlenie merania | Systémové zdieľanie a výber súboru; v prototype simulované |
| S09 | Obnova | Súhrn vybratej zálohy a dôsledok nahradenia | Zrušenie, záloha súčasných dát, potvrdenie; neplatný súbor sa rieši ešte pred touto obrazovkou |

### Prehľad bez spotreby

Namiesto nuly použijeme pomlčku a konkrétny ďalší krok:

- Bez úvodnej plnej nádrže: „Pri najbližšom tankovaní do plnej začneme merať spotrebu.“
- Po prvej plnej nádrži: „Prvá plná nádrž je základ. Spotrebu uvidíš po ďalšom tankovaní do plnej.“
- Po čiastočnom tankovaní: „Tankovanie je zapísané. Spotrebu dopočítame pri ďalšej plnej nádrži.“
- Po medzere: „Po vynechanom tankovaní začneme merať od ďalšej plnej nádrže.“

Ak existuje platná staršia spotreba, neschovávame ju pre novú medzeru. Vysvetlíme, že je vypočítaná iba z úplných intervalov. Po uzavretí ďalšieho platného intervalu sa nemusí zobrazovať staré varovanie ako hlavná správa, informácia o vylúčení úsekov však ostáva v štatistikách.

### Formulár

Poradie polí v návrhu:

1. Stav tachometra; pomocný text uvádza posledný záznam. Pri spätnej úprave má produkčná verzia pomenovať relevantných susedov.
2. Natankované litre.
3. Prepínač „Celkovú sumu / Cenu za liter“.
4. Suma alebo jednotková cena a dopočítaná hodnota.
5. „Do plnej nádrže“ s krátkym vysvetlením, predvolene vypnuté.
6. Dátum s dnešnou predvolenou hodnotou.
7. Rozbaliteľné „Ďalšie možnosti“ s označením vynechaného tankovania.
8. Uloženie.

Pri otvorení nového formulára nepreberáme starú sumu ani stav plnej nádrže. Tachometer je referenčná hodnota, nikdy domyslený aktuálny stav.

Pri prepnutí režimu už vyplnenej ceny vysvetlíme dôsledok a vyžiadame nový vstup. Zaokrúhlenú odvodenú jednotkovú cenu nesmieme potichu povýšiť na pôvodný vstup a zmeniť sumu.

Počas zápisu sa uloženie nedá opakovať. Pri zlyhaní zostáva formulár vyplnený. V produkcii sa nezamyká celá aplikácia bez časového obmedzenia; chyba alebo dokončenie zápisu musí obnoviť ovládanie.

### Potvrdenia

| Situácia | Používateľská voľba | Výsledok |
| --- | --- | --- |
| Zavretie zmeneného formulára | Pokračovať / Zahodiť | Bez tichého uloženia alebo straty vstupov |
| Zmena režimu vyplnenej ceny | Zmeniť zadávanie / Ponechať | Nový spôsob vyžaduje vedomé zadanie ceny |
| Vymazanie | Skutočné tankovanie / Chybný či duplicitný záznam / Ponechať | Skutočné tankovanie zachová medzeru v meraní |
| Doplnená medzera | Potvrdiť úplnosť pomenovaného úseku / Ešte nie | Zruší sa iba neistota konkrétneho úseku |
| Obnova | Zálohovať súčasné / Nahradiť / Zrušiť | Úplné nahradenie, žiadne skryté zlúčenie |

Natívna implementácia použije vhodné systémové dialógy a správanie návratu. V HTML prototype sú potvrdenia náhradným obsahom obrazovky s presunom fokusu, cyklovaním klávesu Tab a zatvorením cez Escape.

## Vizuálny základ

Pracovný smer: pokojné, čitateľné rozhranie s teplým neutrálnym podkladom a zeleným akcentom. Veľké čísla slúžia hierarchii, nie ďalším dekoratívnym metrikám.

| Token | Svetlý režim | Tmavý režim |
| --- | --- | --- |
| Podklad | #F4F5F0 | #151B17 |
| Povrch | #FFFFFF | #202923 |
| Hlavný text | #17271E | #EDF3EA |
| Sekundárny text | #526457 | #B2C1B5 |
| Akcent | #286043 | #A9D7AC |
| Text na akcente | #FFFFFF | #143820 |
| Jemné zvýraznenie | #E6EEE1 | #2A3E2C |
| Oddeľovač | #DDE4DA | #39473D |
| Chyba — text | #A22C27 | #FFB4AB |
| Chyba — povrch | #FFF0ED | #412822 |

Pravidlá komponentov:

- Systémové písmo, bežná a stredná hrúbka; čísla v riadkoch majú tabuľkové zarovnanie.
- Základ textu 16–17 bodov, hlavné nadpisy približne 30, dominantná suma približne 40–42. Pomocné texty v návrhu 12–13; ich čitateľnosť overíme na zariadení.
- Rytmus rozostupov 4/8 bodov; hlavný vodorovný okraj 20, na úzkych obrazovkách 16.
- Hlavné tlačidlo aspoň 48 bodov vysoké, ostatné dotykové ciele aspoň 44.
- Zaoblenie formulárových polí 12, tlačidiel 14, súhrnov 20. Nevytvárame samostatnú kartu pre každú drobnú metriku.
- Zelená označuje hlavné akcie a platné súhrny. Červená patrí chybám a vymazaniu. Neúplný interval má aj text, nie iba farbu.
- Graf po intervaloch má číselné hodnoty a rozsahy; interpretácia nesmie vyžadovať rozpoznanie farby.

Natívna typografia musí reagovať na systémové zväčšenie. CSS hodnoty v prototype nie sú konečné rozmery React Native komponentov.

## Klávesnica, prístupnosť a malé obrazovky

- Jednostĺpcový formulár. Pri klávesnici zostane aktívne pole aj cesta k uloženiu dosiahnuteľná posunutím.
- Desatinné polia prijímajú čiarku aj bodku. Tachometer používa celé čísla.
- Všetky vstupy majú názov a chybový text priradený k poľu. Prvá chyba dostane fokus.
- Úspech a zlyhanie sa oznamujú pomocným technológiám. Čísla obsahujú jednotky aj v prístupnom názve.
- Záložky majú textové názvy a označenú aktuálnu sekciu.
- Tmavý režim má vlastné farby, nie iba invertovaný svetlý návrh.
- Žiadna funkcia nevyžaduje hover; návrh neobsahuje povinné animácie.
- Návrh má fungovať pri šírke 320 px, bežnom aj zväčšenom texte. To nenahrádza meranie na fyzickom zariadení.

## Systémové a chybové stavy

| Stav | Správanie |
| --- | --- |
| Lokálne dáta sa načítavajú | Stav načítania; neukazuje falošnú nulovú históriu |
| Databáza sa neotvorí | Údaje sa nemažú, ponúkne sa opakovanie |
| Uloženie zlyhá | Vstupy zostávajú a možno ich znova uložiť |
| Nie je internet | Hlavné toky fungujú bežne; bez chybového banneru |
| Zdieľanie/výber súboru sa zruší | Návrat do nastavení bez zmeny dát |
| Záloha nie je podporovaná alebo je poškodená | Vysvetlenie a výber iného súboru; žiadna zmena lokálnej histórie |
| Systém odmietne prístup k súboru | Opakovanie výberu a zrozumiteľná pomoc; žiadne zbytočné oprávnenia |

V prototype sú priamo prepínateľné prvé štyri dátové stavy a dva chybové stavy úložiska. Validácia súboru, migrácie, oprávnenia, práca na pozadí a natívne systémové dialógy ostávajú na implementáciu.

## Overenie s vodičmi

Použijeme 3–5 vodičov a úlohy bez navádzania:

1. Začni evidovať svoje auto a prvé tankovanie podľa pripravenej účtenky.
2. Zapíš ďalšie tankovanie, pri ktorom nádrž nie je plná.
3. Urob záznam do plnej a povedz, čo znamená zobrazená spotreba.
4. Oprav litre v staršom zázname.
5. Predstav si, že jedno tankovanie chýba; ukáž, ako budeš pokračovať.
6. Nájdi zálohu a vysvetli, čo sa stane pri obnove.

Sledujeme dokončenie úlohy, čas, chyby, zaváhania a vysvetlenie výsledku vlastnými slovami. Pozorovateľ nevysvetľuje význam plnej nádrže vopred. Zistenia zapíšeme oddelene od našich predpokladov.

## Ďalší krok

Po spätnej väzbe doladiť tok a založiť Expo projekt. Pred výberom verzií overiť oficiálnu dokumentáciu a kompatibilitu; pred lokálnym iOS buildom nakonfigurovať plný Xcode. Presné výpočty a bezpečné uloženie vzniknú ako samostatné vrstvy s príslušnými testami.
