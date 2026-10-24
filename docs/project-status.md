# Stav projektu a rozhodnutia

Posledná aktualizácia: 24. 10. 2026.

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
| Stack | Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6 | Používateľ založil predvolenú Expo šablónu v priečinku mobile |
| Ukladanie | Lokálna SQLite, bez backendu | Offline prevádzka a jednoduchší prvý rozsah |
| Účet | Bez registrácie | Nízka bariéra prvého použitia |
| MVP | Jedno auto, benzín/diesel, km/l/EUR | Pracovný predpoklad na obmedzenie rozsahu |
| Presnosť | Metóda medzi plnými nádržami, explicitné medzery | Dôveryhodnosť výsledkov |
| Platby | Oddelené od hodnoty spotrebovaného paliva | Záznamy neudávajú mesačné zostatky v nádrži |
| Ochrana dát | CSV export a JSON záloha s obnovou | Dlhodobá hodnota histórie |
| Analytika produktu | Najprv pozorovanie a spätná väzba | Nepridávať telemetriu bez konkrétnej potreby |
| Monetizácia | Bez platieb a reklám v prvej bete | Najprv overenie užitočnosti a návratov |

Tieto položky rozlišujú výslovnú preferenciu používateľa od pracovných predpokladov; nejde o tvrdenie, že používateľ osobitne schválil každý detail. Verzie stacku vychádzajú z vytvorenej šablóny; produkčné kontroly závislostí ešte neprebehli. Doménová architektúra a schéma databázy ešte nie sú implementované. Názov a slug aplikácie sú zatiaľ predvolené mobile; vlastný bundle ID ešte nie je nastavený.

## Dokončené

- Používateľ vytvoril Expo projekt v priečinku mobile a spustil Metro server.
- Plný Xcode je aktívny. Agent v Device Hub prepol zobrazenie na klasický iPhone 17 a zavrel nápovedu a vývojové menu Expo Go; následne overil obrazovku „Welcome to Expo“.
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
- Node.js 24.21.0 a npm 11.19.0 sú dostupné. Aktívny Xcode 27.1, build 27A9275, bol overený cez xcodebuild.
- Dňa 24. 10. 2026 overená odpoveď Metro servera na /status a nainštalované Expo Go 58.0.7 na iPhone 17 s iOS 27.0. iPhone Duo s iOS 27.1 je vypnutý.
- Spustenie predvolenej aplikácie overené v simulátore pomocou zobrazenia Device Hub a prístupnostného stromu. Toto nie je lokálny natívny build ani overenie na fyzickom iPhone.
- Príčina predchádzajúcich timeoutov simctl openurl nie je potvrdená; aplikácia sa už zobrazila. V tomto kroku sa nemenila sieťová konfigurácia ani sa nemazali dáta simulátora.

- Pred prípravou dokumentácie bol pracovný strom čistý a vetva sledovala `origin/main`.
- Produkčné výpočtové jadro zatiaľ neexistuje; referenčné prípady v špecifikácii ešte nie sú automatizované doménové testy.
- Overené lokálne odkazy v Markdown dokumentácii, ukončenia súborov a neprítomnosť nadbytočných medzier na konci riadkov.
- Natívny build, produkčné doménové testy, test na fyzickom zariadení a nasadenie ešte neprebehli.

## Otvorené body a riziká

- Overiť jednoduchosť formulára a zrozumiteľnosť plnej nádrže a medzier na prototype.
- Pri dátovom modeli výslovne vyriešiť zachovanie medzier pri vymazaní a presune záznamov.
- Skontrolovať kompatibilitu vytvorenej šablóny a päť závažných nálezov npm audit hlásených pri inštalácii. Nespúšťať automaticky npm audit fix --force.
- Overiť navrhnutý vizuálny systém, úzke displeje a zväčšený text vizuálnou kontrolou a na zariadení.
- Pred registráciou aplikácie určiť bundle ID a konfiguráciu podpisovania.
- Pred verejným vydaním overiť názov, zvoliť licenciu repozitára a pripraviť informácie o súkromí.
- Odhady roadmapy nie sú pevné termíny; beta závisí od reálnych intervalov tankovania.

## Ďalší krok

Skontrolovať vytvorený mobilný projekt a závislosti, potom preniesť odsúhlasený návrh UI a implementovať prvý funkčný tok tankovania. Pri významných úpravách overiť typy, relevantné testy a správanie v simulátore. Dokumentácia ani prototyp nezakladajú súhlas na publikovanie, platené operácie alebo deštruktívne zásahy.
