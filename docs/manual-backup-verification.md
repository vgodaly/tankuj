# Manuálne overenie zálohy a obnovy

Pripravené 1. 11. 2026. Stav: **nevykonané**. Výsledky doplniť po teste používateľa, vrátane zariadenia, iOS a verzie Expo Go, ak je známa. Fyzický iPhone sa eviduje samostatne.

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
| Zdieľanie a uloženie zálohy do Súborov | Neoverené |
| Zrušenie zdieľania a výberu | Neoverené |
| Náhľad a záloha súčasných údajov | Neoverené |
| Zrušenie náhľadu a konečného potvrdenia | Neoverené |
| Úplná obnova, ceny, súhrny a medzery | Neoverené |
| Zachovanie obnovy po zatvorení/otvorení | Neoverené |
| Neplatný súbor/verzia nemení dáta | Neoverené |
| Obnova pri prvom spustení | Neoverené |
