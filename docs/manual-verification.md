# Manuálne overenie mobilného toku

Pripravené 1. 11. 2026. Stav: **vedený scenár úspešne overený používateľom** v simulátore cez Expo Go: pridanie, spotreba, úprava, oba dôvody mazania, zachovanie medzery, obnovenie merania a zachovanie dát po úplnom zatvorení a otvorení aplikácie. Úplná kontrola navigácie nad rámec vykonaných krokov zostáva otvorená.
Automatizované testy v Node nenahrádzajú tento test UI a expo-sqlite.

## Príprava

Použi prázdnu testovaciu evidenciu v simulátore. Ak už obsahuje skutočné údaje, nemaž ich ani do nich nemiešaj tento scenár; najprv pripravíme samostatný QA simulátor. Vytvor auto „Tankuj QA“, benzín. Všetky záznamy nižšie majú dnešný dátum (pri príprave 1. 11. 2026); rovnaký deň je povolený, poradie určuje tachometer. Označenie vynechaného tankovania nechaj vypnuté.

Pri každom kroku zapíš skutočný výsledok alebo chybu. Kontroluj aj návrat z formulára na prehľad/históriu bez prázdnej obrazovky. Ak sa výsledok líši, zastav scenár a zaznamenaj krok a zobrazené hodnoty.

## Pridanie a spotreba

Použi režim celkovej sumy. Pri každom novom formulári má byť plná nádrž predvolene vypnutá; pre A a C ju zapni.

| Záznam | Tachometer | Litre | Suma | Plná nádrž | Očakávanie po uložení |
| --- | --- | --- | --- | --- | --- |
| A | 10 000 km | 40 | 64 € | Áno | Bez spotreby, základ merania; cena 1,600 €/l |
| B | 10 200 km | 10 | 16 € | Nie | Bez spotreby, čaká sa na plnú nádrž; platby 80 € |
| C | 10 500 km | 20 | 32 € | Áno | 6,00 l/100 km, 500 km, 1 platný interval; platby 112 € |

História má obsahovať práve tri záznamy v poradí C, B, A. Štatistiky po C: 70 l, 112 €, priemerná cena 1,600 €/l. Litre z A sa do spotreby nezapočítajú.

## Úprava a reštart

1. Otvor detail B a uprav litre na `12` a sumu na `19,20`. Ostatné polia ponechaj.
2. Po uložení zostávajú tri záznamy, B má 12 l a 19,20 €. Spotreba je **6,40 l/100 km**, platby **115,20 €**, objem **72 l**.
3. V simulátore otvor prepínač aplikácií a potiahnutím karty úplne ukonči Expo Go. Potom ho znovu otvor a spusti ten istý projekt Tankuj. Metro nechaj bežať; samotný Fast Refresh alebo Reload nestačí na tento test.
4. Over vozidlo, všetky tri záznamy, upravený detail B a rovnaké súhrny. Nesmie sa znovu objaviť úvod na vytvorenie auta.

## Vymazanie chybného záznamu

1. Pridaj testovací chybný záznam D: 10 600 km, 5 l, 8 €, neplná nádrž. Súčet platieb je 123,20 €; uzavretý interval ostáva 6,40 l/100 km.
2. V detaile D zvoľ vymazanie a dôvod „Chybný alebo duplicitný“. V konečnom potvrdení najprv zruš vymazanie: záznam aj súhrny musia zostať.
3. Zopakuj vymazanie s tým istým dôvodom a potvrď ho. Zostanú A, B, C, platby 115,20 € a spotreba 6,40 l/100 km. Nemá vzniknúť medzera.

## Vymazanie skutočného tankovania a zachovanie medzery

1. Vymaž B s dôvodom skutočného tankovania a potvrď. Zostanú A a C; platby **96 €**, objem **60 l**. Spotreba musí byť nedostupná s vysvetlením neúplnej evidencie, nikdy 4,00 ani nula.
2. Úplne ukonči a znovu otvor Expo Go ako vyššie. Over dva záznamy, 96 € a zachovanú neúplnosť merania.
3. Pridaj E: 11 000 km, 30 l, 48 €, plná nádrž. Vznikne iba jeden platný interval C–E: **500 km a 6,00 l/100 km**. Platby sú **144 €**, objem **90 l**; upozornenie na staršiu medzeru zostáva.
4. Zopakuj úplné ukončenie a otvorenie. Musia zostať A, C, E, výsledok 6,00 a staršia medzera.

## Záznam výsledkov

| Oblasť | Výsledok |
| --- | --- |
| Pridanie A/B/C a navigácia | Používateľ potvrdil úspešné uloženie A, B a C; úplná kontrola navigácie ešte nepotvrdená |
| Spotreba a súhrny | Prešlo podľa používateľa: po B 80 € bez spotreby; po C 6,00 l/100 km, 500 km, 1 interval, 112 € a 70 l |
| Úprava B | Prešlo podľa používateľa: 12 l, 19,20 €, 3 záznamy, spotreba 6,40 l/100 km, platby 115,20 € a objem 72 l |
| Zachovanie úpravy po reštarte | Prešlo podľa používateľa: úplne zatvoril Expo Go v simulátore, znovu ho otvoril a vybral Tankuj; všetky kontrolované údaje zostali zachované |
| Zrušenie vymazania a odstránenie chybného D | Prešlo podľa používateľa: zrušenie ponechalo záznam; potvrdenie vrátilo históriu na 3 záznamy, 115,20 € a 6,40 l/100 km bez medzery |
| Odstránenie skutočného B a medzera | Prešlo podľa používateľa: 2 záznamy, 96 €, 60 l a nedostupná spotreba s upozornením na neúplnú evidenciu |
| Zachovanie vymazania a medzery po reštarte | Prešlo podľa používateľa: rovnaký stav po úplnom zatvorení Expo Go a opätovnom otvorení Tankuj |
| Obnovenie merania C–E a posledný reštart | Prešlo podľa používateľa: 3 záznamy, 144 €, 90 l, jediný platný interval 500 km so spotrebou 6,00 l/100 km a zachované upozornenie na staršiu medzeru; rovnaký stav aj po opätovnom otvorení |

Doterajšie výsledky potvrdil používateľ v chate 1. 11. 2026 pri vedenom teste v Expo Go. Kontext testu: simulátor iPhone 17, iOS 27.0; presná verzia Expo Go pri tomto teste nebola zisťovaná. Tento scenár neoveruje fyzický iPhone, natívny build, zálohu ani obnovu. Po jeho dokončení nasleduje implementácia zálohy a obnovy.
