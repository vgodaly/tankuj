# Kontext susedných tankovaní

Implementácia 2. 11. 2026 podľa [návrhu formulára](ux-design.md#formulár) a [pravidiel chronológie](calculations.md#poradie-a-validácia).

Pomoc pod tachometrom uvádza predchádzajúce a nasledujúce evidované tankovanie, každé s dátumom a kilometrami. Pri novom najnovšom zázname je dostupný iba predchodca; pred prvým záznamom iba nasledovník. Pri úprave sa pôvodný záznam podľa ID vynechá, takže sa neuvádza ako vlastný sused ani duplicita.

Poradie sa priebežne prepočíta podľa zadaného dátumu a v rovnakom dni podľa tachometra. Ak je v tento deň tankovanie a tachometer zatiaľ chýba alebo má neplatný formát či rozsah, pomoc uvádza počet záznamov v danom dni a vyžiada doplnenie tachometra. Ak záznamy v daný deň nie sú, na určenie susedov stačí dátum. Neplatný alebo budúci dátum skryje starých susedov a ponúkne opravu dátumu.

Pri rovnakom tachometri sa navyše pomenuje existujúce tankovanie, aj keď má iný dátum. Pomoc nie je potvrdením platnosti vstupov: konfliktné kilometre/dátum a duplicity naďalej odmieta `buildRefuel`, aj pri zápise v transakcii. Na kontext netreba vyplnené litre ani cenu. Ceny, výpočty, medzery, SQLite schéma a formát záloh sa nemenia.

Prázdna evidencia vysvetlí prvé tankovanie; pri úprave jediného záznamu sa uvedie, že ide o jediné tankovanie. Celá pomoc je aj prístupnostným hintom poľa. Pri chybe tachometra zostáva kontext viditeľný pod chybou a hint obsahuje obe správy, aby bolo možné opraviť konflikt podľa susedov. Kontext sa neoznamuje násilne pri každom napísanom znaku.

## Overenie

Šesť nových doménových testov pokrýva neusporiadaný vstup bez mutácie, hranice histórie, viac záznamov v deň, chýbajúci/neplatný/nulový tachometer, zmenu dátumu a kilometrov pri úprave, vynechanie vlastného ID, duplicitu v inom dni, neplatný/budúci dátum, prázdnu históriu a zachovanie odmietnutia konfliktu pri uložení. Prešli typová kontrola a všetkých 75 testov.

Prešiel aj iOS JS/Hermes export. Agent na Tankuj Restore QA (iPhone 17, iOS 27.0, Expo Go 58.0.7) cez UI overil:

- Úpravu B s 10 200 km: predchodca 10 000 km, nasledovník 10 500 km, oba s dátumom 1. 11.; vlastný záznam sa neuvádza.
- Dočasných 10 800 km: susedia sa zmenili na 10 500 a 11 000 km.
- Duplicitných 10 500 km: pomenované existujúce tankovanie a odmietnutie uloženia. Chyba aj kontext zostali viditeľné; prístupnostný hint obsahoval obe správy.
- Zmenu dátumu na 31. 10.: iba nasledovník 1. 11./10 000 km. Vymazanie dátumu odstránilo neaktuálny kontext. Pri opätovnom dátume 1. 11. a prázdnom tachometri pomoc uviedla 3 ostatné tankovania v tento deň a požiadala doplniť tachometer.
- Zalamovanie textu susedov pri Text Size 11 a presun k ďalšiemu poľu; nejde o skúšku celého 320-bodového toku ani softvérovej klávesnice.
- Nový prázdny formulár s dátumom 2. 11.: iba predchodca 1. 11./11 000 km, bez prevzatia tachometra do vstupu.

Testovacia úprava sa zahodila a nové tankovanie sa neuložilo. Zostali 4 tankovania, 163,20 €, 102 l, 1,600 €/l a 6,20 l/100 km za 1 000 km/2 intervaly. Vrátené Text Size 3; Light a VoiceOver off zostali zachované. Pôvodný používateľov simulátor sa nespúšťal ani nemenil.

Ide o cielenú skúšku agenta cez UI, nie o nové automatizované UI regresné testy. Vlastný natívny build, fyzický iPhone a hovorený výstup VoiceOver sa týmto krokom neoverujú.
