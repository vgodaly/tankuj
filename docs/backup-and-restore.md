# JSON záloha a obnova

Implementované 1. 11. 2026. Kontroly kódu a testy v Node prešli; používateľ následne úspešne overil hlavný mobilný tok uloženia a obnovy v simulátore cez Expo Go vrátane zachovania medzery a údajov po opätovnom otvorení. Podrobné výsledky a zostávajúce kontroly sú v [manuálnom overení](manual-backup-verification.md). CSV export zostáva samostatnou úlohou.

## Používateľský tok

- Nastavenia → Záloha a obnova. Pri prvom spustení je dostupné aj „Mám zálohu – obnoviť údaje“.
- Vytvorenie zálohy načíta konzistentný snapshot v SQLite transakcii, vytvorí JSON súbor v cache a otvorí systémové zdieľanie. Používateľ vyberie trvalé miesto, napríklad Uložiť do Súborov. Súbor v cache môže systém odstrániť a nie je trvalou zálohou.
- Záloha je manuálna a nešifrovaná; obrazovka to uvádza. Automatická synchronizácia nevzniká.
- Zrušenie zdieľania alebo výberu súboru nemení databázu. API zdieľania neoznamuje, či bol súbor naozaj uložený; aplikácia preto netvrdí úspešné uloženie zálohy po samotnom zatvorení zdieľania.
- Výber jedného súboru vytvorí čitateľnú kópiu v cache. Po kontrole sa táto kópia odstráni; zdrojový dokument sa nemaže. Typ súboru sa určuje obsahom, nie príponou.
- Po úspešnej validácii sa zobrazí vozidlo, palivo, počet tankovaní, dátumy od–do a počet bodov medzier. Používateľ môže zálohovať súčasné údaje, vybrať iný súbor, zrušiť obnovu alebo pokračovať na konečné potvrdenie nahradenia.
- Obnova nahrádza celý dataset vrátane vozidla a medzier. Nezlučuje dve histórie. Prázdna záloha môže vrátiť aplikáciu do stavu bez vozidla; aj pri nej sa vyžaduje potvrdenie nahradenia.
- Pri chybe zápisu sa celá transakcia vráti a pôvodná evidencia zostane zachovaná. Náhľad zálohy zostane dostupný na opakovanie. Počas operácie sa blokuje opakované spustenie a odchod z obrazovky.

## Formát v1

JSON obsahuje presne tieto polia:

| Pole | Obsah |
| --- | --- |
| `format` | Reťazec `tankuj` |
| `version` | Číslo `1`, nezávislé od verzie SQLite schémy |
| `exportedAt` | UTC čas vytvorenia vo formáte `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `vehicle` | `null` alebo objekt `id`, `name`, `fuel`; stabilné ID jediného vozidla v SQLite v1 je `1` |
| `refuels` | Záznamy s `id`, `date`, `odometerKm`, `volumeMl`, `amountCents`, `full`, `priceMode`, `unitPriceMilli` |
| `gaps` | Všetky body neúplnosti s `id` a `atOdometerKm`, aj body po poslednom tankovaní |

Objemy sú celé mililitre, sumy celé centy a zadané jednotkové ceny celé tisíciny EUR/l. V režime `amount` je `unitPriceMilli` vždy `null`; v režime `unit` sa overí zhoda uloženej sumy s presným half-up výpočtom. Obnova zachová ID a vstupy; spotreba aj súhrny sa odvodia znova. Existujúci model neukladá časy vytvorenia/úprav záznamov, preto ich záloha nevymýšľa.

Validátor odmieta chýbajúce aj neznáme polia, nesprávne typy bez konverzie, neplatné dátumy, budúce tankovania podľa lokálneho dňa zariadenia, hodnoty mimo doménových rozsahov, rozpornú chronológiu, duplicitné ID tankovaní alebo medzier a duplicitný tachometer. ID tankovaní a medzier majú oddelené priestory. Samostatné body medzier nie sú povinne naviazané na tankovanie. Bez vozidla nie sú povolené žiadne tankovania ani medzery.

Limit súboru je 10 MiB a každé pole histórie má najviac 10 000 položiek. Tieto limity platia aj pri exporte; veľkosť sa kontroluje v UTF-8. ID sú kladné bezpečné celé čísla menšie než `Number.MAX_SAFE_INTEGER`. Medzery podporujú rozsah tachometra 0–9 999 999 km.

## Ukladanie a overenie

Schéma SQLite zostáva v1 bez migrácie. Repository opakuje validáciu pred otvorením obnovovacej transakcie. Vymazanie starých údajov, zápis vozidla, tankovaní s pôvodnými ID, medzier a načítanie výsledku sú v jednej exkluzívnej transakcii. React stav sa nahradí až po úspešnom dokončení. SQLite sekvencie zostávajú spravované databázou, aby nové záznamy nekolidovali s obnovenými ID.

Kontroly 1. 11. 2026:

- `npm run typecheck`: prešlo.
- `npm test`: všetkých 46 testov prešlo, z toho 11 nových pre validáciu, export a obnovu.
- Doménové testy: presné vstupy a pôvodné ceny, ID, medzery, zhodné výpočty, prázdne histórie, neplatný JSON/verzia/typy, duplicitné ID, chronológia a limity vrátane UTF-8.
- SQLite testy v Node: úplné nahradenie, obnovenie do prázdnej DB, prázdna záloha, odmietnutie pred transakciou, rollback pri zlyhaní zápisu vozidla/tankovania/medzery, opakovanie, nové ID, opätovné otvorenie súboru a budúce meranie po obnovenej medzere.
- `npx expo export --platform ios`: prešlo. Ide o vytvorenie JS/Hermes balíka, nie o natívny build ani test na zariadení.
- `npm audit`: 15 nálezov (1 low, 11 moderate, 3 high); nálezy závislostí zostávajú otvorené. Automatická oprava sa nevykonala.
- Manuálne overenie používateľom v Expo Go: uloženie do Súborov, výber a náhľad zálohy, zrušenie výberu a obnovy, konečné potvrdenie aj úplná obnova úspešne prešli. Po zmene E na 50 € sa obnovením pôvodnej zálohy vrátilo 48 € a celkové platby zo 146 € na 144 €; zostali 3 tankovania, 90 l, jeden interval 500 km so spotrebou 6,00 l/100 km a staršia medzera. Rovnaký stav používateľ potvrdil po úplnom zatvorení a otvorení Expo Go.
- Používateľ potvrdil aj zrušenie zdieľania a následné uloženie zálohy súčasných údajov z náhľadu. Náhľad pôvodnej zálohy zostal dostupný a po zrušení obnovy zostali 3 tankovania a 144 €.
- Manuálne zostáva overiť odmietnutie neplatného súboru/verzie a obnovu pri prvom spustení. Android, fyzický iPhone a natívny build neboli testované.

Použité API: [Expo DocumentPicker](https://docs.expo.dev/versions/v58.0.0/sdk/document-picker/), [Expo FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/) a [Expo Sharing](https://docs.expo.dev/versions/v58.0.0/sdk/sharing/). Pribudli priame závislosti `expo-document-picker`, `expo-file-system` a `expo-sharing` kompatibilné so SDK 58; aktualizovaný je aj lockfile. Prijímanie zdieľania cez natívnu share extension sa nezapína.
