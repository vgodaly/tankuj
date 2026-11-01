# Roadmapa ďalšieho vývoja

Pracovné poradie po implementácii grafov, 1. 11. 2026. Nejde o pevné termíny; výsledky kontrol môžu poradie upraviť. Aktuálne dokončené funkcie a presné hranice overenia uvádza [projektový stav](project-status.md).

| Krok | Výsledok a podmienka dokončenia |
| --- | --- |
| 1. Úzke displeje a veľký text | Skontrolovať formulár, úvod, nadpisy, veľké sumy a grafy. Opraviť zistené zalamovanie a preveriť aktívne polia so softvérovou klávesnicou na menšom simulátore. Rozlíšiť skúšku obsahu so šírkou 320 bodov od celého zariadenia. |
| 2. Prístupnosť a navigácia | Preveriť poradie a presuny fokusu, návrat gestom, chybové a úspešné oznamy a ovládanie VoiceOver. Prístupnostný strom sám nepotvrdzuje hovorený výsledok. Opraviť konkrétne nálezy; zostávajúce skúšky preniesť do kontroly fyzického iPhonu. |
| 3. Kontext pri zadávaní | Pri dopĺňaní alebo úprave staršieho tankovania zobraziť relevantných susedov namiesto samotného posledného záznamu. Preveriť zrozumiteľnosť dátumu, oboch režimov ceny a medzier; zachovať existujúce výpočtové a transakčné pravidlá. |
| 4. Vlastný iOS development build | Pripraviť konfiguráciu a návod. Pred registráciou dohodnúť bundle ID a podpisovanie, potom overiť build mimo Expo Go. |
| 5. Fyzický iPhone | Overiť zápis, opravy, mazanie, reštart, JSON zálohu a obnovu cez Súbory, CSV a zachovanie dát pri aktualizácii aplikácie. Dokončiť klávesnicu, VoiceOver a veľký text na zariadení. |
| 6. Uzavretá beta | Po odstránení blokujúcich nálezov pripraviť TestFlight, informácie o súkromí a spätnú väzbu. So súhlasom používateľa zapojiť vodičov počas viacerých tankovaní; hodnotiť rýchlosť zápisu a pochopenie spotreby a medzier. |

Rutinné technické kontroly vykonáva prednostne agent v samostatnom QA prostredí. Používateľa zapájame najmä do hodnotenia pohodlia, zrozumiteľnosti a úkonov vyžadujúcich jeho účet alebo fyzické zariadenie. Dokončené a primerane overené úlohy agent commitne; push vykonáva používateľ.

Viac vozidiel, Android, cloudová synchronizácia, OCR, platené funkcie a verejné vydanie sú mimo tohto najbližšieho plánu. Registrácia, distribúcia a publikovanie vyžadujú samostatné konkrétne rozhodnutie; táto roadmapa ich sama nespúšťa.
