# Klikateľný návrh Tankuj

Súbor tankuj-prototype.html je HTML fragment s lokálnym stavom pre návrh používateľského toku. Rovnaký zdroj sa dá zobraziť priamo v chate aj v lokálnom prehliadači.

Z koreňa repozitára spusti:

~~~bash
python3 design/preview.py
~~~

Potom otvor http://127.0.0.1:8765. Ukončenie servera: Ctrl+C. Server počúva iba na lokálnom rozhraní a nepotrebuje žiadne externé balíčky ani sieťové služby.

## Čo sa dá vyskúšať

- V prepínači nad aplikáciou vyber prvé otvorenie, prvý záznam, čiastočné alebo vynechané tankovanie, chybu zápisu, načítanie či nedostupné údaje.
- Preklikaj onboarding, prehľad, históriu, detail, štatistiky a nastavenia.
- Pridaj alebo uprav tankovanie vrátane jednotkovej ceny, desatinnej čiarky a validácie voči susedom.
- Skús zavrieť zmenený formulár alebo vymazať skutočné tankovanie a pozri vplyv na spotrebu.
- V scenári chyby zápisu skús rovnaké uloženie zopakovať.
- Prejdi potvrdenie obnovy ukážkovej zálohy a návrh zdieľania.

V inline náhľade podporujúcom ovládanie návrhu je dostupná aj voľba zväčšeného textu. V samostatnom prehliadači možno použiť jeho zväčšenie.

## Hranice prototypu

- Nie je to React Native aplikácia ani produkčné analytické jadro. Výpočty slúžia na správanie návrhu; produkčná presnosť peňazí a doménové testy sa implementujú samostatne podľa špecifikácie.
- Údaje sú vymyslené, referenčný deň je 19. 10. 2026. Prepnutie scenára nahradí údaje v náhľade.
- Stav je v pamäti stránky; inline host ho môže obnoviť vo svojom náhľade. Nie je to databáza ani spoľahlivá záloha.
- Export/zdieľanie a výber zálohy sú simulované obrazovky, nevytvárajú súbory. Obnova pracuje s pevnou ukážkovou históriou.
- Zlyhanie zápisu, načítanie a nedostupná databáza sú simulované. Nejde o test SQLite ani migrácií.
- Text a ovládanie ukazujú zamýšľaný tok. Systémová klávesnica, VoiceOver, safe areas a natívna navigácia ešte vyžadujú overenie v mobilnej aplikácii.

Rozhodnutia pre implementáciu a plán používateľského overenia sú v [návrhu UX](../docs/ux-design.md).
