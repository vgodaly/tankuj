# Navigácia a prístupnosť mobilného UI

Kontrola 1. 11. 2026 na samostatnom Tankuj Restore QA (iPhone 17, iOS 27.0, Expo Go 58.0.7). Ide o cielenú kontrolu obrazoviek a prístupnostného stromu, nie o úplný audit VoiceOver ani používateľskú štúdiu.

## Opravy

- Nastavenia a detail tankovania používajú „← Späť“. Pôvodné názvy „Prehľad“ a „História“ nezodpovedali skutočnému návratu, keď bola obrazovka otvorená z inej sekcie. Návrat do predchádzajúcej obrazovky aj náhradná cesta pri priamom otvorení zostávajú zachované.
- Prístupný názov riadka tankovania obsahuje dátum, sumu, tachometer, litre na tri desatinné miesta a údaj o plnej alebo čiastočnej nádrži. Tieto viditeľné údaje predtým explicitný názov čiastočne skrýval.
- Metrika spája názov s hodnotou a jednotkou do jedného prístupného textu. Celková spotreba vo štatistikách má samostatne zrozumiteľný názov vrátane jednotky; nedostupná hodnota má slovné vysvetlenie.
- Hlavné tlačidlo si ponecháva prístupný názov aj počas zobrazenia indikátora práce. Rozbalenie ďalších možností formulára poskytuje stav `expanded`.
- Pri systémovom zväčšení nad 1,5 sa hlavné záložky usporiadajú pod seba. Pri najväčšom texte sa tak ich názvy nelámu uprostred slov. Horný riadok so značkou a nastaveniami sa môže zalomiť.
- Značka a hlavný nadpis sa zväčšujú najviac dvojnásobne, aby nevytláčali obsah a nezalamovali krátke názvy obrazoviek po jednotlivých písmenách. Bežný text, polia a názvy navigácie si ponechávajú systémové zväčšenie bez nového limitu.

Použité vlastnosti `accessible`, `accessibilityLabel` a `accessibilityState` vychádzajú z [dokumentácie React Native](https://reactnative.dev/docs/accessibility). Zmeny nezasahujú do výpočtov, SQLite schémy ani formátu záloh.

## Vykonané UI scenáre

| Scenár | Výsledok |
| --- | --- |
| Štatistiky → Nastavenia → Späť | Návrat do štatistík; opravený názov tlačidla. |
| História → detail čiastočného tankovania → úprava | Správne hodnoty a stav plnej nádrže; v strome je tachometer aj presné litre. |
| Zmena spôsobu ceny → Ponechať | Pôvodná suma 19,20 € a režim sumy zostali. |
| Rozbalenie ďalších možností | Dostupný dátum a prepínač vynechaného tankovania; strom uvádza `expanded`. |
| Dočasná zmena 12 l na 13 l → Zrušiť → Pokračovať v úprave | Zobrazilo sa potvrdenie a 13 l zostalo vo formulári. |
| Opätovné Zrušiť → Zahodiť | Návrat do detailu s pôvodnými 12 l a 19,20 €, bez uloženia zmeny. |
| História → nové tankovanie → uložiť prázdne | Chyby pri troch poliach aj v ich prístupných hintoch; kurzor na tachometri. |
| Softvérová číselná a desatinná klávesnica | Aktívne pole viditeľné nad klávesnicou; posunutie ju zatvorilo a sprístupnilo tlačidlo uloženia. |
| Najväčší systémový text, slider Text Size 11 | História a štatistiky, čitateľné hlavné názvy, všetky tri navigačné akcie dostupné a posúvateľný obsah. |
| Tmavý režim | Vizuálne skontrolované štatistiky a formulár vrátane chýb, vstupov a klávesnice. |
| História → Nastavenia → Záloha a obnova → Späť → Späť | Návrat cez nastavenia do pôvodnej histórie; zoskupené metriky zálohy sú v strome. |

Na konci zostali 4 tankovania, 163,20 €, 102 l, 1,600 €/l a spotreba 6,20 l/100 km za 1 000 km/2 intervaly. Skúšobné zmeny sa neuložili, pôvodná používateľova evidencia sa nemenila. V QA boli obnovené pôvodné hodnoty Text Size 3 a Light.

## Kontroly kódu a hranice overenia

Prešli typová kontrola, existujúcich 63 doménových/SQLite testov a iOS JS/Hermes export. Počet automatizovaných testov sa nemení; vyššie uvedené skúšky vykonal agent cez UI, nejde o nové automatizované regresné testy. Existujúce upozornenie Node na typ modulov zostáva.

Prístupnostný strom potvrdzuje názvy a niektoré stavy, nie kvalitu hovorených oznamov, poradie gest a presun fokusu VoiceOver. Prechodný stav tlačidla počas zápisu je skontrolovaný v kóde; nebol cielene spomalený na UI skúšku. Natívny build, fyzický iPhone a Android sa týmto krokom neoverovali.

Následná [kontrola úzkeho rozloženia](responsive-layout-review.md) doplnila prispôsobenie veľkých súm a nadpisov, voľby a prepínače pod sebou pri veľkom texte a skúšku klávesnice na iPhone 13 mini. Rozlišuje dočasný obsah so šírkou 320 bodov od natívneho rozmeru zariadenia.

Zostáva celý tok pri šírke 320 bodov, celá aplikácia pri najväčšom texte, VoiceOver gestá, návrat gestom, fokus po navigácii a oznamy pri chybách súborov. Pri úprave staršieho tankovania formulár zatiaľ uvádza iba posledný záznam; kontext časových susedov zostáva ďalším vylepšením podľa návrhu UX. Hlavný tok uloženia, mazania a súborových operácií už má samostatné overenia v projektovom stave.
