# Grafy štatistík

Implementované 1. 11. 2026 podľa [MVP](mvp.md), [výpočtových pravidiel](calculations.md) a [návrhu UX](ux-design.md).

## Obsah

Na obrazovke Štatistiky sú tri pruhové grafy:

- **Spotreba po intervaloch:** iba platné výsledky existujúcej funkcie `measure`. Dátumy oboch hraníc, oba tachometre, vzdialenosť a započítané litre. Úvodné litre, neuzavreté a neúplné úseky sa nezahŕňajú. Nejde o mesačnú spotrebu.
- **Cena za liter pri tankovaní:** efektívna cena `amountCents × 10 / volumeMl` pri každom zázname, aj čiastočnom. Označená dátumom a tachometrom, so sumou a litrami. Pôvodná zadaná jednotková cena sa na tento graf nepoužíva; zaokrúhlená zaplatená suma môže viesť k inej efektívnej cene. Nejde o trhové ceny.
- **Mesačné platby:** súčet centov podľa uloženého lokálneho kalendárneho dátumu, vrátane úvodných a čiastočných tankovaní. Priebežné mesiace bez záznamov majú nulu a označenie „0 € v evidencii“. Aktuálny mesiac je označený ako prebiehajúci. Bez percentuálneho porovnania rozpracovaného a celého mesiaca.

Mesačná séria siaha od prvého tankovania po aktuálny mesiac. Pri posune hodín zariadenia dozadu zachová aj už uložené neskoršie mesiace. Prázdna história nevytvára umelú nulovú sériu. Čisto kalendárne kľúče sa generujú bez prevodu dní cez UTC a bez zmeny rokov 0–99 konštruktorom `Date`.

Platby a ceny zostávajú dostupné aj pri medzere alebo bez platného merania spotreby. Pôvodné vážené súhrny za celú evidenciu zostávajú pod grafmi a nezávisia od zobrazenej stránky.

## Zobrazenie a prístupnosť

Každý graf má vlastnú spoločnú mierku od nuly po najvyššiu nezaokrúhlenú hodnotu celej svojej série. Stránkovanie mierku nemení. Pruhy sú samostatné; nespojujú nesúvisiace alebo vynechané úseky čiarou. Každá hodnota má číselný údaj, jednotku a rozsah, preto sa informácia neopiera iba o farbu alebo dĺžku pruhu.

Najnovšie údaje sú hore. Zobrazí sa najviac šesť položiek; „Staršie údaje“ a „Novšie údaje“ sprístupňujú zvyšok histórie s údajom o zobrazenom rozsahu. Tlačidlá na koncoch sú neaktívne. Pri skrátení série sa stránka ohraničí dostupným rozsahom. Prázdny graf obsahuje vysvetlenie, nedostupná spotreba nie je nulový pruh.

Jeden riadok je prístupný text zahŕňajúci popis, hodnotu a detail. Dekoratívna stopa pruhu je pre čítačku skrytá. Texty sa môžu zalomiť, používajú systémové zväčšenie a farby svetlého/tmavého režimu. Nie sú pridané animácie, povinné gestá, tooltips ani nové závislosti.

Kód: `mobile/src/components/bar-chart.tsx`, `mobile/src/app/stats.tsx` a `mobile/src/domain/statistics.ts`. Bez zmeny úložiska, migrácie či JSON/CSV formátu.

## Overenie

Kontroly kódu: typová kontrola, všetkých 69 testov a iOS JS/Hermes export. Šesť nových testov overuje presné mesačné centy a počty vrátane prvých/čiastočných tankovaní, neusporiadané vstupy bez mutácie, nuly a prechod rokov, prázdnu/jednozáznamovú históriu, staré roky, posun hodín dozadu, prepočet po zmene dát/obnove a odmietnutie neplatného mesiaca. Výpočty platných intervalov a ich medzier zostávajú pokryté existujúcimi doménovými/SQLite testami.

Agent v Tankuj Restore QA (iPhone 17, iOS 27.0, Expo Go 58.0.7) cez UI overil:

- Skutočné QA údaje: pruhy 6,00 a 6,40 l/100 km, oba 500 km s rôznymi hranicami tachometra; štyri ceny 1,600 €/l a novembrových 163,20 €. Vážený súhrn zostal 6,20 za 1 000 km/2 intervaly, 102 l a 4 tankovania.
- Dočasnú históriu deviatich tankovaní iba v zobrazení, bez zápisu do databázy: sedem platných intervalov po vylúčení úseku s medzerou, deväť cien a jedenásť mesiacov. Overil prechod na poslednú stránku všetkých troch grafov, neaktívne tlačidlá na hranici, návrat na najnovšie mesiace, zachovanie mierky a nulový jún aj november. Tieto skúšobné dáta boli z kódu odstránené pred finálnymi kontrolami.
- Prázdnu históriu iba v zobrazení: vysvetlenia všetkých troch grafov a nedostupnú spotrebu bez falošnej nuly.
- Jediné čiastočné tankovanie iba v zobrazení: 1,005 l pri zadanej cene 1,000 €/l, zaplatené 1,01 €, v grafe správna efektívna cena 1,005 €/l a dostupná mesačná platba bez spotreby.
- Posúvanie a zalomenie obsahu pri najväčšom systémovom texte, číselnú hodnotu/pruh mesačných platieb a tmavý mesačný graf. Prístupnostný strom obsahoval popisy bodov s jednotkami a rozsahmi.

Na konci boli opäť zobrazené pôvodné QA údaje a obnovené Text Size 3/Light. Do databázy QA ani pôvodného používateľovho simulátora sa pri tejto úlohe nezapisovalo. UI scenáre vykonal agent; nie sú novými automatizovanými UI testami.

Fyzický iPhone, Android, šírka 320 bodov a úplné ovládanie VoiceOver/oznamy po stránkovaní ešte nie sú overené. Export JS/Hermes nie je natívny build. Grafy neznamenajú dokončenie všetkých kontrol MVP ani pripravenosť na vydanie.
