# Stav projektu a rozhodnutia

Posledná aktualizácia: 19. 10. 2026.

## Cieľ

Pomôcť vodičovi rýchlo zapisovať tankovania, dôverovať vypočítanej spotrebe a postupne porozumieť vývoju nákladov. Prioritou je nízke úsilie pri zadávaní a návrat pri ďalšom tankovaní.

## Repozitár

- GitHub: https://github.com/vgodaly/tankuj
- Viditeľnosť: public podľa používateľa.
- Vetva: `main`, nastavené sledovanie `origin/main`.
- Používateľ sprevádzkoval manuálny push cez HTTPS.
- Verejná licencia zatiaľ nebola zvolená.
- Po dokončení úlohy a primeranom overení agent automaticky vytvorí commit so stručným a výstižným názvom. `git push` vykonáva používateľ.

## Pracovné rozhodnutia

| Oblasť | Pracovný základ | Dôvod |
| --- | --- | --- |
| Názov | Tankuj, repo `tankuj` | Nadväzuje na produktový koncept |
| Platformy | Najprv iOS, neskôr Android | Výslovná preferencia používateľa; má Apple Developer Program |
| Stack | React Native + Expo + TypeScript | Návrh z predchádzajúcej roadmapy pre spoločný základ |
| Ukladanie | Lokálna SQLite, bez backendu | Offline prevádzka a jednoduchší prvý rozsah |
| Účet | Bez registrácie | Nízka bariéra prvého použitia |
| MVP | Jedno auto, benzín/diesel, km/l/EUR | Pracovný predpoklad na obmedzenie rozsahu |
| Presnosť | Metóda medzi plnými nádržami, explicitné medzery | Dôveryhodnosť výsledkov |
| Platby | Oddelené od hodnoty spotrebovaného paliva | Záznamy neudávajú mesačné zostatky v nádrži |
| Ochrana dát | CSV export a JSON záloha s obnovou | Dlhodobá hodnota histórie |
| Analytika produktu | Najprv pozorovanie a spätná väzba | Nepridávať telemetriu bez konkrétnej potreby |
| Monetizácia | Bez platieb a reklám v prvej bete | Najprv overenie užitočnosti a návratov |

Tieto položky rozlišujú výslovnú preferenciu používateľa od pracovných predpokladov; nejde o tvrdenie, že používateľ osobitne schválil každý detail. Verzie závislostí zatiaľ nie sú vybrané ani overené. Architektúra, schéma databázy a identifikátor aplikácie ešte nie sú implementované.

## Dokončené

- Navrhnutý hlavný používateľský tok, obrazovky, potvrdenia, stavy a základ vizuálneho systému v [návrhu UX](ux-design.md).
- Pripravený [klikateľný prototyp](../design/README.md) so simulovanými dátami a lokálnym náhľadom bez závislostí aplikácie.

- Prečítaný pôvodný produktový koncept a nadväzujúca roadmapa.
- Prázdny projekt prepojený s GitHubom; používateľ pridal testovací `test.md`.
- Vytvorený prvý pracovný návrh špecifikácie MVP, výpočtových pravidiel a implementačných úloh.
- Pravidlá spolupráce vrátane automatických commitov uložené do koreňového `AGENTS.md`.
- Pridaný `.gitignore` pre závislosti, Expo lokálne súbory, buildy, logy, lokálne `.env` a podpisovacie kľúče. Vzory `.env.example`, lockfiles a natívne zdrojové priečinky zostávajú verzovateľné.

## Overenie

- Pri kontrole prototypu prešlo 13 skupín interakčných scenárov v jsdom a 14 výpočtov kontrastu textu voči povrchu. Podrobnosti a obmedzenia sú v [kontrole prototypu](prototype-review.md).
- Vizuálna kontrola v prehliadači nebola dokončená: dostupný prehliadač odmietol lokálny súbor. Rozloženie, systémová klávesnica a VoiceOver ešte vyžadujú overenie.
- Node.js 24.21.0 a npm 11.19.0 sú dostupné. Aktívne sú iba Xcode Command Line Tools; plný Xcode nie je aktívny. Kompatibilita s budúcou verziou Expo ešte nebola overená.

- Pred prípravou dokumentácie bol pracovný strom čistý a vetva sledovala `origin/main`.
- Produkčné výpočtové jadro zatiaľ neexistuje; referenčné prípady v špecifikácii ešte nie sú automatizované doménové testy.
- Overené lokálne odkazy v Markdown dokumentácii, ukončenia súborov a neprítomnosť nadbytočných medzier na konci riadkov.
- Zatiaľ nebol vytvorený mobilný projekt, spustený simulátor, overený iPhone ani vykonaný build či nasadenie.

## Otvorené body a riziká

- Overiť jednoduchosť formulára a zrozumiteľnosť plnej nádrže a medzier na prototype.
- Pri dátovom modeli výslovne vyriešiť zachovanie medzier pri vymazaní a presune záznamov.
- Overiť aktuálne verzie, kompatibilitu a prostredie pri zakladaní aplikácie.
- Overiť navrhnutý vizuálny systém, úzke displeje a zväčšený text vizuálnou kontrolou a na zariadení.
- Pred registráciou aplikácie určiť bundle ID a konfiguráciu podpisovania.
- Pred verejným vydaním overiť názov, zvoliť licenciu repozitára a pripraviť informácie o súkromí.
- Odhady roadmapy nie sú pevné termíny; beta závisí od reálnych intervalov tankovania.

## Ďalší krok

Prejsť klikateľný návrh a získať spätnú väzbu, potom založiť Expo projekt s overenými verziami. Nakonfigurovať plný Xcode pred lokálnym iOS buildom. Dokumentácia ani prototyp nezakladajú súhlas na publikovanie, platené operácie alebo deštruktívne zásahy.
