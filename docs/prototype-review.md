# Kontrola prvého prototypu

Dátum: 19. 10. 2026.

Predmet: interaktívny návrh v [design/](../design/README.md). Nejde o overenie produkčnej aplikácie, SQLite ani natívnych integrácií.

## Vykonané kontroly

JavaScript bol syntakticky overený pomocou Node.js. Interakcie sa spustili v jsdom 26.1.0 cez pomocný kontrolný skript v dočasnom priečinku. Táto knižnica ani jej závislosti neboli pridané do projektu.

Prešlo 13 skupín scenárov:

1. Všetkých osem scenárov sa vykreslí bez runtime výnimky; úvodná ukážka má platby 131,22 € za október a váženú spotrebu 6,17 l/100 km.
2. Úvod s výberom paliva a názvom, prázdny prehľad a zápis plná → čiastočná → plná vrátane desatinnej čiarky; výsledok 6,00 l/100 km.
3. Prázdne a príliš presné číselné vstupy, duplicitný tachometer, rozpor s časovými susedmi a budúci dátum sa odmietnu.
4. Prechod zo sumy na jednotkovú cenu vyžaduje potvrdenie; 10,5 l pri 1,639 €/l dá ukážkovú sumu 17,21 € a pôvodná cena ostáva pri úprave zachovaná.
5. Zavretie zmeneného formulára vyžaduje rozhodnutie; pokračovanie zachová vstupy a kláves Tab zostáva v potvrdení.
6. Simulované zlyhanie zápisu ponechá vstupy; opakovanie vytvorí jeden záznam a súbežný submit nevytvorí druhý.
7. Vymazanie skutočného čiastočného tankovania vylúči neúplný interval a zachová neskorší platný výsledok.
8. Vymazanie posledného skutočného tankovania zachová medzeru aj pre nasledujúci záznam.
9. Vymazanie chybného záznamu prepočíta súhrny bez vytvorenia novej medzery.
10. Úprava litrov v staršom zázname zmení váženú spotrebu.
11. Neúplný interval je vylúčený; potvrdenie pomenovaného doplneného úseku obnoví jeho použitie.
12. Export je výslovne označený ako simulovaný; obnova ukážkovej histórie vyžaduje potvrdenie nahradenia.
13. Ukážky načítania a chyby majú cestu na pokračovanie; priebežný stav možno uložiť do inline hosta a neplatný obnovený dátum nespôsobí runtime chybu.

Samostatný výpočet kontrastu overil 14 dvojíc farby textu a pozadia pre svetlý a tmavý režim. Kontrolované dvojice vrátane sekundárneho textu, akcií a chýb dosiahli aspoň 4,5 : 1. Ide o kontrolu navrhnutých farebných hodnôt, nie audit vykresleného rozhrania.

## Čo zatiaľ nie je overené

- Dostupný prehliadač zablokoval otvorenie lokálneho súboru svojou bezpečnostnou politikou. Vizuálne overenie preto neprebehlo.
- jsdom nemá rozloženie skutočného prehliadača. Nepotvrdzuje absenciu pretečenia pri 320 px, čitateľnosť, tmavý vzhľad ani vzhľad pri zväčšení textu.
- Natívna klávesnica, safe areas, VoiceOver, Android návrat späť a platformové systémové dialógy.
- Správanie lokálneho preview servera počas reálneho používania; jeho Python zdroj je skontrolovaný syntakticky.
- Produkčná presnosť čísel, ukladanie, migrácie, obnova zo skutočného súboru a odolnosť pri ukončení aplikácie.
- Používateľské testovanie s vodičmi a meranie času zápisu.

## Odporúčaný manuálny priechod

Spusti lokálny náhľad podľa [návodu](../design/README.md), prejdi jednotlivé scenáre a hlavné obrazovky. Skontroluj aj šírku 320 px, svetlý a tmavý vzhľad, zväčšenie textu, klávesovú navigáciu a čitateľnosť potvrdení. Pozorovania zapíš oddelene od automatických kontrol vyššie.

Pri zakladaní mobilnej aplikácie sa produkčné výpočty implementujú podľa [pravidiel](calculations.md) s vlastnými doménovými testami. Prototypový JavaScript sa nepovažuje za hotové analytické jadro.
