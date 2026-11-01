# Úzke rozloženie a veľký text

Cielená kontrola 1. 11. 2026, Expo Go 58.0.7 a iOS 27.0. Nadväzuje na [kontrolu navigácie a prístupnosti](ui-accessibility-review.md). Nejde o úplné overenie všetkých obrazoviek ani fyzického zariadenia.

## Opravy

- Veľká suma sa prispôsobí dostupnej šírke v jednom riadku. Predtým sa pri úzkom obsahu a najväčšom texte rozdelili skupiny číslic na viac riadkov. Úplná hodnota aj jednotka zostávajú v texte a prístupnom názve.
- Hlavný nadpis sa prispôsobí najviac dvom riadkom; zachováva existujúci limit dvojnásobného systémového zväčšenia. Značka v úvode sa prispôsobí jednému riadku. Bežný text a polia nedostali nový limit zväčšenia.
- Pri `fontScale > 1.5` sú voľby sumy/jednotkovej ceny a benzínu/dieselu pod sebou. Prepínače plnej nádrže a vynechaného tankovania sú pod celou šírkou svojho vysvetlenia. Predtým úzke stĺpce lámali aj krátke slová.
- Rádiové voľby majú explicitné prístupné názvy; stav výberu zostáva zachovaný.

Prispôsobenie používa `numberOfLines` a `adjustsFontSizeToFit` podľa [React Native Text](https://reactnative.dev/docs/text). Výpočty, zápisy a SQLite schéma sa nemenia.

## Vykonané skúšky

| Prostredie a scenár | Pozorovaný výsledok |
| --- | --- |
| Tankuj Restore QA, dočasne obmedzený natívny obsah na 320 × 568 bodov, Text Size 11 | Odhalené rozdelenie sumy a úzke voľby ceny. Po oprave sa skúšobná suma 9 999 999,99 € zmestila do jedného riadka; voľby ceny, vysvetlenia a prepínače využívajú šírku a obsah sa posúva. |
| Rovnaké dočasné zúženie, úvod | Značka sa zmestila, voľby Benzín/Diesel boli pod sebou; prepnutie na Diesel zmenilo stav a pole názvu bolo dostupné. Vozidlo sa neukladalo. |
| Tankuj Small QA, samostatný iPhone 13 mini, natívnych 375 × 812 bodov, bežný text | Vytvorené iba testovacie vozidlo Small/Benzín. Názov vozidla aj suma vo formulári zostali viditeľné nad softvérovou klávesnicou. Pokračovanie v úvode bolo dosiahnuteľné posunutím. |
| iPhone 13 mini, Text Size 11 | Nadpis Nové tankovanie sa zobrazil celý na dvoch riadkoch. Suma aj dátum po fokuse zostali nad softvérovou klávesnicou; posunutie klávesnicu skrylo a sprístupnilo celý prepínač medzery aj Uložiť tankovanie. Žiadne tankovanie sa neuložilo. |
| Návrat na Tankuj Restore QA | Prehľad a štatistiky stále uvádzali 4 záznamy, 163,20 €, 102 l, 1,600 €/l a 6,20 l/100 km za 1 000 km/2 intervaly; grafy 6,00 a 6,40. |

Dočasné obmedzenie obsahu, skúšobná suma a vynútené zobrazenie úvodu boli odstránené pred konečnými kontrolami. Nevkladali sa do SQLite. Pôvodná používateľova evidencia na iPhone 17 sa nemenila. V oboch QA simulátoroch zostali Light a Text Size 3.

## Hranice overenia

Device Hub pri pokuse o rozmer 320 × 568 použil najmenej 375 × 667. V tomto režime sa objavilo zakrytie aktívneho poľa a orezanie klávesnice; príčinu nemožno spoľahlivo určiť. Pri natívnom rozmere samostatného iPhonu 13 mini sa zakrytie sumy ani dátumu nezopakovalo. Preto skúška zúženého obsahu na 320 bodov overuje rozloženie vybraných prvkov, nie celé zariadenie, safe areas alebo klávesnicu pri 320 bodoch.

Prešli `npm run typecheck`, všetkých 69 existujúcich doménových/SQLite testov a iOS JS/Hermes export. Tieto UI skúšky vykonal agent; nejde o nové automatizované regresné testy. Natívny development build, fyzický iPhone, Android, hovorené oznamy a poradie gest VoiceOver neboli overené.

Zostáva celý tok pri šírke 320 bodov, grafy a všetky okrajové stavy pri kombinácii úzkeho displeja a veľkého textu, úplná skúška VoiceOver a kontrola fyzického iPhonu. Ďalšie poradie práce je v [roadmape](development-roadmap.md).
