# Label Art — Szczęśliwy los

Strona do comiesięcznego losowania jednego zwycięzcy. Początkowa lista zawiera Dawida Wosieka, Grzegorza Ferenca i Weronikę. Można dodawać kolejne osoby.

## Uruchomienie

Otwórz `index.html` w przeglądarce lub uruchom serwer:

```sh
cd /workspace/lotto
python3 -m http.server 8000 --bind 127.0.0.1
```

Nie są potrzebne żadne zależności. Listę początkową definiuje `initial-participants.js`; jest używana tylko przy pierwszym otwarciu.

## Udział i historia

Każda osoba ma status: „Bierze udział”, „Już wygrał(a)” albo „Nie bierze udziału”. Przed pierwszym losowaniem oznacz wcześniejszych zwycięzców. Losowanie obejmuje wyłącznie aktywne osoby; wybrany zwycięzca jest zapisywany i skreślany z listy. Przywrócenie zwycięzcy wymaga potwierdzenia i usuwa jego wpis w historii. Ręcznie oznaczeni wcześniejsi zwycięzcy nie mają przypisanej fikcyjnej daty wygranej — zapis zawiera datę dodania wpisu, a ekran pokazuje „Wcześniejsza wygrana”.

## Zapis i kopie

Lista, statusy i historia są zapisywane w localStorage. Używaj tej samej przeglądarki, profilu i adresu strony. Tryb prywatny, wyczyszczenie danych lub zmiana adresu mogą spowodować brak poprzedniego zapisu. Przy otwieraniu pliku bez serwera zachowanie zapisu zależy od przeglądarki. Po każdym losowaniu pobierz kopię JSON i zachowaj ją. „Wczytaj kopię” pozwala przenieść dane na inny komputer; zastępuje całą listę i historię po potwierdzeniu. Dane nie trafiają na serwer.

Brak możliwości zapisu blokuje losowanie. Zmiana danych w innej karcie wymaga odświeżenia. Korzystaj z jednej karty do losowania.

## Automatyczne pakowanie

`python3 scripts/package.py` zbiera pliki aplikacji i zasoby, zachowuje ich katalogi oraz tworzy gotowy katalog `dist/site` i paczkę `dist/szczesliwy-los.zip`. Każde uruchomienie odtwarza wyłącznie wygenerowany katalog `dist`. Nie trzeba kopiować plików pojedynczo. Dodawane pliki HTML, CSS, JS, obrazy i fonty są dołączane automatycznie.

Po umieszczeniu projektu na GitHub workflow „Przygotuj program do pobrania” uruchamia się przy zmianach na `main` oraz ręcznie w zakładce Actions. Po udanym uruchomieniu udostępnia jeden artefakt `szczesliwy-los`, pobierany jako ZIP z kompletną aplikacją. Workflow nie publikuje strony. Artefakt ma ważność 90 dni; kolejne uruchomienie generuje nowy. Ten mechanizm działa dopiero po wysłaniu projektu i workflow do repozytorium GitHub.

## Strona pod stałym adresem

Workflow „Opublikuj stronę” przygotowuje i publikuje cały projekt po zmianach na `main`. W repozytorium GitHub w **Settings → Pages → Build and deployment → Source** wybierz **GitHub Actions**. Repozytorium musi obsługiwać Pages na używanym planie GitHub. Po wysłaniu plików i poprawnym wdrożeniu strona będzie pod adresem `https://dawidwosiek-hub.github.io/lotto/`. To adres docelowy, a nie potwierdzenie wdrożenia. Status publikacji sprawdź w **Actions → Opublikuj stronę**.

Strona jest publiczna, również jej lista początkowa. Historia i zmiany statusów są przechowywane wyłącznie lokalnie w przeglądarce; aktualizacje strony ich nie zerują. Używaj tego samego adresu i profilu przeglądarki, a po każdym losowaniu zachowaj kopię danych. Aktualizacja pliku z listą początkową nie zastępuje już zapisanej listy w przeglądarce — nowe osoby dodaj przyciskiem w aplikacji.


## Oprawa Label Art

Kolorystyka niebiesko-grafitowa bazuje na przekazanym wzorze logo. Nagłówek zawiera tekst LABEL ART, bez odtworzonego znaku graficznego. Style i skrypty są lokalne, dlatego program działa bez internetu. Zmiana oprawy nie zmienia klucza pamięci ani historii losowań. W stopce znajduje się podpis „Created by. Dawid Wosiek”.
