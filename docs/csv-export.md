# CSV export histórie

Implementované a overené 1. 11. 2026. Dostupné cez Nastavenia → Záloha, obnova a CSV export → Exportovať históriu do CSV.

## Správanie a formát

Export načíta aktuálnu históriu v SQLite transakcii a otvorí systémové zdieľanie súboru `tankuj-history-<čas>.csv`. Používateľ vyberie miesto uloženia. Zrušenie zdieľania nie je chyba a nemení evidenciu; aplikácia po zatvorení dialógu netvrdí, že súbor bol určite uložený.

Súbor je UTF-8 s BOM, oddeľovačom je bodkočiarka, desatinným oddeľovačom čiarka a koncom riadka CRLF. Všetky bunky sú v úvodzovkách; vnorené úvodzovky sa zdvojujú. Táto voľba sa hodí k slovenským regionálnym nastaveniam. Pri importe v inom regióne môže byť potrebné vybrať bodkočiarku a slovenské číselné nastavenie. Microsoft popisuje [otváranie UTF-8 s BOM](https://support.microsoft.com/en-us/excel/opening-csv-utf-8-files-correctly-in-excel) a [výber oddeľovača pri importe](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files). Priame otvorenie v Exceli a Numbers ešte nebolo testované.

Záznamy sú od najstaršieho, pri rovnakom dni podľa tachometra. Prázdna história má iba hlavičku. Názov vozidla začínajúci po prípadných bielych/riadiacich znakoch na `=`, `+`, `-` alebo `@` dostane úvodný apostrof, aby ho tabuľkový procesor nevyhodnotil ako vzorec. Ostatné znaky, diakritika, bodkočiarky, úvodzovky a zalomenia riadka sa zachovajú CSV escapovaním.

| Stĺpec | Hodnota |
| --- | --- |
| ID tankovania | Pôvodné ID |
| Vozidlo | Názov vozidla |
| Palivo | Benzín alebo Diesel |
| Dátum | Lokálny deň `YYYY-MM-DD` |
| Tachometer (km) | Celé kilometre |
| Litre (l) | Presné vstupy na 3 desatinné miesta |
| Suma (EUR) | Presné centy na 2 desatinné miesta |
| Zadanie ceny | Suma alebo Cena za liter |
| Zadaná cena (EUR/l) | Pôvodná cena na 3 miesta; prázdna pri režime sumy |
| Efektívna cena (EUR/l) | Zo zaplatenej sumy a litrov, half-up na 3 miesta |
| Plná nádrž | Áno/Nie |
| Medzera pred tankovaním | Áno, ak je bod neúplnosti po predchádzajúcom tachometri a najneskôr pri tomto zázname |
| Medzera po poslednom tankovaní | Áno iba pri poslednom zázname, ak existuje neskorší bod neúplnosti |

CSV je čitateľný export tankovaní, nie presná serializácia všetkých samostatných bodov medzier. CSV import nie je implementovaný. Na úplnú obnovu vrátane ID a polôh medzier slúži JSON záloha; rozhranie tento rozdiel vysvetľuje.

## Overenie

- Typová kontrola prešla; všetkých 52 automatizovaných doménových a SQLite testov prešlo (6 nových pre CSV).
- Nové testy pokrývajú presné jednotky, pôvodnú aj efektívnu cenu, half-up, CSV escapovanie, diakritiku, ochranu pred vzorcami, poradie, medzery vrátane bodu po poslednom zázname, prázdnu históriu a nemennosť databázy.
- Export iOS JS/Hermes balíka prešiel; nejde o vlastný natívny build.
- Agent sám cez UI v Tankuj Restore QA (iPhone 17, iOS 27.0, Expo Go 58.0.7) overil otvorenie zdieľania CSV, jeho zrušenie bez chyby, opakovaný export a uloženie cez Save to Files do On My iPhone.
- Po zdieľaní CSV agent regresne overil otvorenie JSON zdieľania a jeho zrušenie bez chyby. V prehľade a štatistikách zostali všetky očakávané hodnoty aj upozornenie na medzeru.
- Uložený súbor sa následne nezávisle načítal cez Python `csv.DictReader`: UTF-8 BOM, 13 stĺpcov, tri záznamy v správnom poradí, presné súčty 144 € a 90 l, cena 1,600 €/l a správne označenie staršej medzery. Read-only kontrola natívnej SQLite potvrdila nezmenené súčty a body medzier.
- Priame otvorenie v Exceli/Numbers, Android a fyzický iPhone zostávajú neoverené.

Nepribudli závislosti ani migrácia databázy. JSON záloha, obnova a CSV používajú spoločné súborové zdieľanie; cache súbor sa ponechá dostupný prijímajúcej aplikácii a môže ho neskôr odstrániť systém.
