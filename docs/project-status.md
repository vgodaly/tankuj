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
| Ukladanie | Lokálna SQLite cez expo-sqlite 58, bez backendu | Offline prevádzka a jednoduchší prvý rozsah |
| Účet | Bez registrácie | Nízka bariéra prvého použitia |
| MVP | Jedno auto, benzín/diesel, km/l/EUR | Pracovný predpoklad na obmedzenie rozsahu |
| Presnosť | Metóda medzi plnými nádržami, explicitné medzery | Dôveryhodnosť výsledkov |
| Platby | Oddelené od hodnoty spotrebovaného paliva | Záznamy neudávajú mesačné zostatky v nádrži |
| Ochrana dát | CSV export a JSON záloha s obnovou | Dlhodobá hodnota histórie |
| Analytika produktu | Najprv pozorovanie a spätná väzba | Nepridávať telemetriu bez konkrétnej potreby |
| Monetizácia | Bez platieb a reklám v prvej bete | Najprv overenie užitočnosti a návratov |

Tieto položky rozlišujú výslovnú preferenciu používateľa od pracovných predpokladov; nejde o tvrdenie, že používateľ osobitne schválil každý detail. Verzie stacku vychádzajú z vytvorenej šablóny. Prvé doménové jadro a SQLite schéma sú implementované; úplná kontrola závislostí a npm audit ostáva otvorená. Názov a slug aplikácie sú Tankuj/tankuj; interná schéma odkazu zostáva mobile a vlastný bundle ID ešte nie je nastavený.

## Dokončené

- Prvý funkčný mobilný tok: úvod, prehľad, pridanie tankovania, potvrdenie, história, detail a základné štatistiky. UI používa návrh Tankuj a nezačína s demo údajmi.
- Lokálne ukladanie vozidla, tankovaní a medzier do SQLite; presné centy, mililitre a jednotkové ceny. Výpočty a repository sú oddelené od UI.
- Podrobnosti a aktuálne obmedzenia sú v [prvom mobilnom toku](mobile-first-flow.md).

- Používateľ vytvoril Expo projekt v priečinku mobile a spustil Metro server.
- Mobilná šablóna vrátane package-lock.json, zdrojov, konfigurácie a pôvodných assetov je zaradená do hlavného Git repozitára. Závislosti node_modules a lokálne dáta .expo sú ignorované.
- Opravená typová nekompatibilita ref v prevzatom webovom TabButton: typ ref sa odvodzuje priamo od komponentu Pressable.
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
- Po prenose UI vizuálne overená skutočná úvodná obrazovka Tankuj na iPhone 17 v Expo Go. Bez vloženia testovacích tankovaní do používateľovej histórie.
- Pre prvý funkčný tok prešla typová kontrola a všetkých 23 doménových a SQLite integračných testov vrátane rollbacku a opätovného otvorenia databázového súboru. Natívny zápis z formulára a reštart s údajmi ešte neboli manuálne overené.
- Pred commitom mobilnej šablóny prešla typová kontrola tsc --noEmit. Overené ignorovanie lokálnych priečinkov, zhoda závislostí v package.json a lockfile, JSON syntax a vybrané vzory prihlasovacích údajov vo verzovaných súboroch.
- Lint zatiaľ nie je nakonfigurovaný. Offline kontrola expo install --check nevypísala nezhody, ale sama upozorňuje na obmedzenú spoľahlivosť offline validácie; nenahrádza úplnú kontrolu závislostí a npm audit.
- Príčina predchádzajúcich timeoutov simctl openurl nie je potvrdená; aplikácia sa už zobrazila. V tomto kroku sa nemenila sieťová konfigurácia ani sa nemazali dáta simulátora.

- Pred prípravou dokumentácie bol pracovný strom čistý a vetva sledovala `origin/main`.
- Časť referenčných prípadov výpočtov už pokrývajú automatizované doménové testy; úpravy, vymazanie a zálohy ešte nie sú implementované.
- Overené lokálne odkazy v Markdown dokumentácii, ukončenia súborov a neprítomnosť nadbytočných medzier na konci riadkov.
- Natívny build, test na fyzickom zariadení a nasadenie ešte neprebehli.

## Otvorené body a riziká

- Overiť jednoduchosť formulára a zrozumiteľnosť plnej nádrže a medzier na prototype.
- Pri dátovom modeli výslovne vyriešiť zachovanie medzier pri vymazaní a presune záznamov.
- Skontrolovať kompatibilitu vytvorenej šablóny a päť závažných nálezov npm audit hlásených pri inštalácii. Nespúšťať automaticky npm audit fix --force.
- Overiť navrhnutý vizuálny systém, úzke displeje a zväčšený text vizuálnou kontrolou a na zariadení.
- Pred registráciou aplikácie určiť bundle ID a konfiguráciu podpisovania.
- Pred verejným vydaním overiť názov, zvoliť licenciu repozitára a pripraviť informácie o súkromí.
- Odhady roadmapy nie sú pevné termíny; beta závisí od reálnych intervalov tankovania.

## Ďalší krok

Manuálne overiť zápis tankovaní a zachovanie po reštarte, doplniť úpravy/vymazanie so zachovaním medzier a export/obnovu. Skontrolovať nálezy npm audit pred širšou betou. Dokumentácia ani prototyp nezakladajú súhlas na publikovanie, platené operácie alebo deštruktívne zásahy.
