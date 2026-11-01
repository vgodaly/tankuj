# Manuálne overenie zálohy a obnovy

Pripravené 1. 11. 2026. Stav: **hlavný tok úspešne overený používateľom** v simulátore cez Expo Go. Používateľ v chate potvrdil uloženie súboru, načítanie náhľadu, zrušenie výberu a obnovy, nahradenie zmenenej histórie pôvodnou zálohou aj zachovanie údajov po úplnom zatvorení a opätovnom otvorení Expo Go. Kontext: iPhone 17, iOS 27.0; presná verzia Expo Go nebola zisťovaná. Agent výsledky priamo nepozoroval. Zostávajúce kontroly sú rozlíšené v tabuľke; fyzický iPhone nebol testovaný.

Použi testovaciu históriu po [základnom scenári](manual-verification.md): A (10 000 km, 40 l, 64 €), C (10 500 km, 20 l, 32 €), E (11 000 km, 30 l, 48 €), všetky plné. Súhrn: 144 €, 90 l, jediný platný interval 500 km, spotreba 6,00 l/100 km a staršia medzera po vymazaní B.

1. Otvor Nastavenia → Záloha a obnova. Over vysvetlenie manuálnej nešifrovanej zálohy a aktuálny počet 3 tankovaní.
2. Zvoľ Vytvoriť zálohu a najprv zruš systémové zdieľanie. Údaje sa nesmú zmeniť ani sa nemá tvrdiť, že záloha bola uložená.
3. Znova vytvor zálohu a v zdieľaní zvoľ Uložiť do Súborov. Ulož `tankuj-backup-…json` a over, že ho vieš nájsť v Súboroch. Samotné zatvorenie dialógu nestačí.
4. Zvoľ Vybrať zálohu na obnovu a výber zruš. História zostáva rovnaká.
5. Vyber uloženú zálohu. Over náhľad vozidla, 3 tankovaní, rozsahu dát a zachovanej medzery. Zvoľ Zrušiť obnovu; údaje zostávajú rovnaké.
6. Zmeň sumu E z 48 € na 50 €. Platby majú byť 146 €, spotreba zostáva 6,00. Tým rozlíšime súčasnú históriu od zálohy.
7. Vyber pôvodnú zálohu. Over možnosť Zálohovať súčasné údaje; pri jej použití a návrate musí zostať náhľad pôvodnej zálohy dostupný.
8. Stlač Nahradiť údaje zo zálohy, ale konečné potvrdenie zruš. Platby zostávajú 146 €.
9. Zopakuj obnovu a konečné potvrdenie prijmi. Platby sa vrátia na 144 €, E má znovu 48 €, zostávajú presne 3 záznamy, 90 l, spotreba 6,00 za 500 km a upozornenie na staršiu medzeru.
10. Úplne zatvor Expo Go cez prepínač aplikácií a znovu otvor Tankuj. Over rovnaký obnovený stav.
11. Vyber neplatný JSON alebo súbor s nepodporovanou verziou (kópiu zálohy s `version: 2`). Musí sa zobraziť zrozumiteľná chyba bez zmeny histórie; žiadny náhľad staršieho výberu nesmie zostať pripravený na obnovu.
12. Na samostatnom prázdnom QA simulátore over „Mám zálohu – obnoviť údaje“ pred vytvorením vozidla. Po obnove musí byť dostupné vozidlo a rovnaká história. Súčasnú testovaciu databázu kvôli tomuto kroku nemaž.

| Oblasť | Výsledok |
| --- | --- |
| Zdieľanie a uloženie zálohy do Súborov | Prešlo podľa používateľa; uložený súbor následne vybral a úspešne obnovil |
| Zrušenie zdieľania | Prešlo podľa používateľa pri zálohovaní súčasných údajov z náhľadu; evidencia zostala nezmenená |
| Zrušenie výberu súboru | Prešlo podľa používateľa, evidencia zostala nezmenená |
| Náhľad zálohy | Prešlo podľa používateľa: správne vozidlo, 3 tankovania, rozsah dát a medzera |
| Záloha súčasných údajov z náhľadu | Prešlo podľa používateľa: po zrušení zdieľania zopakoval uloženie nového súboru, náhľad pôvodnej zálohy zostal dostupný; po zrušení obnovy zostali 3 tankovania a 144 € |
| Zrušenie náhľadu a konečného potvrdenia | Prešlo podľa používateľa; po zrušení konečného potvrdenia zostalo 146 € a E za 50 € |
| Úplná obnova, ceny, súhrny a medzery | Prešlo podľa používateľa: E sa vrátil z 50 € na 48 €, platby zo 146 € na 144 €; 3 tankovania, 90 l, spotreba 6,00 l/100 km za 500 km, 1 interval a upozornenie na staršiu medzeru |
| Zachovanie obnovy po zatvorení/otvorení | Prešlo podľa používateľa: rovnaký obnovený stav po úplnom zatvorení a otvorení Expo Go |
| Neplatný súbor/verzia nemení dáta | Neoverené |
| Obnova pri prvom spustení | Neoverené |

## Súbory pre negatívne overenie

Agent pripravil dva syntetické súbory, ktoré neobsahujú používateľovu históriu, a skopíroval ich do rovnakého priečinka Súborov v bežiacom simulátore iPhone 17, kde sú uložené zálohy Tankuj:

- `tankuj-test-unsupported-version.json`: inak správna štruktúra prázdnej zálohy s `version: 2`; očakávaná chyba „Táto verzia zálohy nie je podporovaná.“
- `tankuj-test-invalid-json.json`: neplatný JSON; očakávaná chyba „Súbor neobsahuje platnú JSON zálohu.“

V Node bolo overené odmietnutie oboch súborov s uvedenými správami bez prístupu k databáze. Existujúce zálohy neboli prepísané. Ich výber cez mobilné UI a nezmenená evidencia po odmietnutí zatiaľ čakajú na potvrdenie používateľom. Po každom pokuse majú zostať 3 tankovania, 144 €, 90 l, spotreba 6,00 l/100 km a staršia medzera; nesmie zostať dostupný náhľad predchádzajúcej platnej zálohy.
