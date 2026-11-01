# Stav projektu a rozhodnutia

Posledná aktualizácia: 1. 11. 2026.

## Obnovenie vývoja na novom Macu

- Používateľ obnovil vývoj po presune na nový Mac; pozastavenie z 24. 10. už neplatí.
- Agent overil prostredie: Mac17,3, arm64, 16 GB RAM, macOS 27.2 (26B123), Node.js 24.22.1, npm 11.19.1 a Xcode 27.2 (27B52). Verzie zodpovedajú používateľom hlásenému novému prostrediu.
- Repozitár je v `/Users/v/Developer/tankuj`, remote je `https://github.com/vgodaly/tankuj.git`. Pri začatí kontroly bola vetva `main` zhodná s lokálnou referenciou `origin/main` (bez fetch); jedinou necommitnutou zmenou bolo `unstable_settings.anchor: 'index'` namiesto `initialRouteName` v `mobile/src/app/_layout.tsx`. Táto požadovaná zmena je zahrnutá do obnovenia práce.
- Používateľ potvrdil úspešné `npm ci`, 35 testov a spustenie aplikácie cez Expo Go na novom Macu. Agent samostatne zopakoval `npm run typecheck` a `npm test`: typová kontrola aj všetkých 35 doménových/SQLite testov prešli. Node hlási upozornenie MODULE_TYPELESS_PACKAGE_JSON; testy nezlyhali.
- Agent overil spustený simulátor iPhone 17 s iOS 27.0. Samotná kontrola bežiaceho simulátora neoveruje mobilný tok; výsledky následného manuálneho testu používateľa sú uvedené nižšie. Fyzické zariadenie nebolo testované.
- Pripravený [manuálny scenár](manual-verification.md) pre pridanie, úpravu, oba dôvody vymazania, spotrebu a zachovanie údajov po ukončení a opätovnom otvorení Expo Go. Používateľ 1. 11. potvrdil uloženie A/B/C a očakávané výsledky: po B 80 € bez spotreby, po C 6,00 l/100 km za 500 km, 1 interval, 112 € a 70 l. Používateľ tiež potvrdil úpravu B na 12 l a 19,20 € s prepočtom na 6,40 l/100 km, 115,20 € a 72 l; všetky kontrolované údaje zostali zachované po úplnom zatvorení Expo Go a opätovnom otvorení Tankuj v simulátore. Používateľ potvrdil aj zrušenie a vykonanie vymazania chybného D bez vzniku medzery, potom vymazanie skutočného B: 2 záznamy, 96 €, 60 l a nedostupná spotreba s upozornením na neúplnú evidenciu. Tento stav zostal zachovaný po úplnom zatvorení a opätovnom otvorení Expo Go. Používateľ napokon potvrdil obnovenie merania C–E: 3 záznamy, 144 €, 90 l, jediný platný interval 500 km so spotrebou 6,00 l/100 km a zachované upozornenie na staršiu medzeru, aj po opätovnom otvorení. Vedený scenár je dokončený; nejde o úplnú kontrolu navigácie, prístupnosti ani fyzického zariadenia.
- Git neobsahuje SQLite údaje zo starého simulátora. JSON záloha a obnova sú teraz implementované; hlavný tok uloženia a obnovy cez mobilné UI používateľ úspešne overil v simulátore, vrátane zachovania údajov a medzery po opätovnom otvorení. CSV export zostáva otvorený.

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

- Verzovaná JSON záloha a atomická obnova celého datasetu so zachovaním vozidla, ID, presných vstupov a medzier. Nová obrazovka je dostupná z nastavení aj pred vytvorením vozidla; obsahuje kontrolu súboru, náhľad, možnosť zálohovať súčasné údaje a konečné potvrdenie nahradenia. Detaily a limity sú v [špecifikácii implementácie](backup-and-restore.md). SQLite schéma zostáva v1.
- Úprava tankovania so zachovaním ID a pôvodného režimu ceny; vymazanie s rozlíšením chyby a skutočného tankovania, dvojstupňovým potvrdením a transakčným zachovaním medzier. Prepočty vychádzajú z aktuálnej histórie. Existujúca SQLite schéma v1 sa nemení.
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

- Pri doplnení JSON zálohy a obnovy 1. 11. 2026 prešla typová kontrola, všetkých 46 doménových/SQLite testov a export iOS JS/Hermes balíka. Nových 11 testov pokrýva validáciu, presné ceny a ID, medzery, nahradenie, odmietnutie pred transakciou, rollback pri chybe v jednotlivých častiach obnovy, opakovanie a zachovanie po opätovnom otvorení databázového súboru. Tieto automatizované kontroly sú overením kódu a SQLite v Node. Používateľ následne 1. 11. potvrdil uloženie zálohy do Súborov, načítanie náhľadu, zrušenie výberu a obnovy, konečné potvrdenie aj úspešné nahradenie zmenených údajov: E z 50 € späť na 48 €, platby zo 146 € na 144 €, 3 tankovania, 90 l, spotreba 6,00 l/100 km za 500 km, 1 interval a zachovaná staršia medzera. Rovnaký stav zostal po úplnom zatvorení a otvorení Expo Go v simulátore. Agent výsledky priamo nepozoroval; fyzický iPhone nebol testovaný. Používateľ potvrdil aj zrušenie zdieľania, následné uloženie zálohy súčasných údajov z náhľadu a zachovanie náhľadu pôvodnej zálohy; po zrušení obnovy zostali 3 tankovania a 144 €. Pre negatívne overenie sú v Súboroch simulátora pripravené dva syntetické súbory (nepodporovaná verzia a neplatný JSON); ich odmietnutie s očakávanými správami prešlo v Node. Agent následne oba súbory sám vybral cez mobilné UI, overil očakávané chyby a zmiznutie starého náhľadu; v prehľade a štatistikách zostali 3 tankovania, 144 €, 90 l, 6,00 l/100 km, 1 interval za 500 km a staršia medzera. Tento agentom vykonaný UI test nie je nový automatizovaný regresný test. Zostávajúce kontroly rozlišuje [manuálny scenár zálohy](manual-backup-verification.md).
- Po inštalácii modulov pre súbory aktuálny `npm audit` hlási 15 nálezov (1 low, 11 moderate, 3 high). Nálezy zostávajú otvorené; automatická oprava sa nevykonala.
- Pri kontrole prototypu prešlo 13 skupín interakčných scenárov v jsdom a 14 výpočtov kontrastu textu voči povrchu. Podrobnosti a obmedzenia sú v [kontrole prototypu](prototype-review.md).
- Vizuálna kontrola v prehliadači nebola dokončená: dostupný prehliadač odmietol lokálny súbor. Rozloženie, systémová klávesnica a VoiceOver ešte vyžadujú overenie.
- Historické prostredie na starom Macu: Node.js 24.21.0, npm 11.19.0 a Xcode 27.1 (27A9275). Aktuálne verzie sú uvedené v časti o obnovení vývoja.
- Dňa 24. 10. 2026 overená odpoveď Metro servera na /status a nainštalované Expo Go 58.0.7 na iPhone 17 s iOS 27.0. iPhone Duo s iOS 27.1 je vypnutý.
- Spustenie predvolenej aplikácie overené v simulátore pomocou zobrazenia Device Hub a prístupnostného stromu. Toto nie je lokálny natívny build ani overenie na fyzickom iPhone.
- Po prenose UI vizuálne overená skutočná úvodná obrazovka Tankuj na iPhone 17 v Expo Go. Bez vloženia testovacích tankovaní do používateľovej histórie.
- Pre prvý funkčný tok prešla typová kontrola a všetkých 23 doménových a SQLite integračných testov vrátane rollbacku a opätovného otvorenia databázového súboru. V tom čase ešte neboli zápis z formulára a reštart s údajmi manuálne overené; vedený scenár používateľ dokončil 1. 11. v Expo Go.
- Pred commitom mobilnej šablóny prešla typová kontrola tsc --noEmit. Overené ignorovanie lokálnych priečinkov, zhoda závislostí v package.json a lockfile, JSON syntax a vybrané vzory prihlasovacích údajov vo verzovaných súboroch.
- Lint zatiaľ nie je nakonfigurovaný. Offline kontrola expo install --check nevypísala nezhody, ale sama upozorňuje na obmedzenú spoľahlivosť offline validácie; nenahrádza úplnú kontrolu závislostí a npm audit.
- Príčina predchádzajúcich timeoutov simctl openurl nie je potvrdená; aplikácia sa už zobrazila. V tomto kroku sa nemenila sieťová konfigurácia ani sa nemazali dáta simulátora.

- Pred prípravou dokumentácie bol pracovný strom čistý a vetva sledovala `origin/main`.
- Pri doplnení úprav a mazania prešlo všetkých 35 doménových a SQLite integračných testov. Pokrývajú opravy, oba dôvody mazania, prepočty, presuny pri medzerách, rollback aj zachovanie upravených údajov a medzery po vymazaní pri opätovnom otvorení databázového súboru. Vtedy ešte neboli implementované zálohy ani potvrdenie úplnosti konkrétnej medzery; zálohy pribudli 1. 11., potvrdenie úplnosti zostáva otvorené.
- Samostatný simulátor Tankuj QA (iPhone 17, iOS 27.0, Expo Go) umožnil vytvoriť testovacie vozidlo a vyplniť formulár s náhľadom ceny. Pri tomto historickom pokuse zostali úplný zápis, úprava, vymazanie cez mobilné UI a reštart s tankovaniami neoverené pre opakované chyby ovládania okna Device Hub; podrobnosti sú v mobile-first-flow.md. Do pôvodnej používateľovej evidencie sa testovacie tankovania nevkladali.
- Overené lokálne odkazy v Markdown dokumentácii, ukončenia súborov a neprítomnosť nadbytočných medzier na konci riadkov.
- Natívny build, test na fyzickom zariadení a nasadenie ešte neprebehli.

## Otvorené body a riziká

- Overiť jednoduchosť formulára a zrozumiteľnosť plnej nádrže a medzier na prototype.
- Zachovanie medzier pri vymazaní a presune je implementované konzervatívnymi bodmi tachometra. Doplniť rozhranie na výslovné potvrdenie úplnosti konkrétneho úseku; samotná oprava alebo doplnenie záznamu medzeru neodstráni.
- Skontrolovať kompatibilitu vytvorenej šablóny a aktuálnych 15 nálezov npm audit (1 low, 11 moderate, 3 high; stav 1. 11. 2026). Nespúšťať automaticky npm audit fix --force.
- Overiť navrhnutý vizuálny systém, úzke displeje a zväčšený text vizuálnou kontrolou a na zariadení.
- Pred registráciou aplikácie určiť bundle ID a konfiguráciu podpisovania.
- Pred verejným vydaním overiť názov, zvoliť licenciu repozitára a pripraviť informácie o súkromí.
- Odhady roadmapy nie sú pevné termíny; beta závisí od reálnych intervalov tankovania.

## Ďalší krok

Dokončiť zostávajúce manuálne kontroly podľa [scenára zálohy](manual-backup-verification.md): obnova pri prvom spustení na samostatnom QA simulátore. Odmietnutie oboch neplatných súborov už agent samostatne overil cez UI. Rutinné technické scenáre má prednostne testovať agent; používateľa zapájať najmä do hodnotenia zrozumiteľnosti a pohodlia používania. Hlavný tok uloženia a obnovy vrátane zachovania údajov a medzery po zatvorení/otvorení Expo Go je úspešne overený používateľom. Potom doplniť CSV export a potvrdenie úplnosti konkrétnej medzery. Vedený manuálny scenár základného toku a zachovania po reštarte je dokončený; širšie overenie navigácie a prístupnosti zostáva otvorené. Skontrolovať nálezy npm audit pred širšou betou. Dokumentácia ani prototyp nezakladajú súhlas na publikovanie, platené operácie alebo deštruktívne zásahy.
