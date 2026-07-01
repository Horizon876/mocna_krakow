# MOCna! – Architektura E-Commerce i CMS Premium
> Studium Przypadku (Case Study)

[Wersja Produkcyjna](https://www.mocnakrakow.pl/)
[Prezentacja Wideo](https://example.com)

## Opis Projektu

Niniejsze repozytorium zawiera kod źródłowy aplikacji **MOCna!** – serwisu internetowego zaprojektowanego na potrzeby fundacji oraz kawiarni społecznej. System łączy w sobie nowoczesną witrynę wizerunkową, autorski moduł e-commerce, system rezerwacji stolików z interaktywną mapą, rezerwacje biletów na wydarzenia oraz dedykowany panel administratora z podziałem na role, przy jednoczesnym zachowaniu najwyższych standardów Core Web Vitals.

## Główne Funkcjonalności Systemu

### 1. Panel Administracyjny z Podziałem na Role (RBAC) i Zarządzanie Zamówieniami
System implementuje mechanizm kontroli dostępu oparty na rolach (Role-Based Access Control) realizowany po stronie serwera:
- **Rola: Pracownik (Pracownik)**: Posiada uprawnienia do obsługi zamówień sklepowych, rezerwacji stolików oraz skanowania i walidacji biletów. Zmiana statusu zamówienia w panelu (np. na status "w realizacji") automatycznie generuje i wysyła dedykowany e-mail powiadomieniowy do klienta za pośrednictwem zintegrowanego systemu wysyłki.
- **Rola: Administrator (Admin)**: Posiada pełne uprawnienia deweloperskie i biznesowe, w tym możliwość edycji i aktualizacji kluczowych sekcji wizerunkowych na stronie głównej oraz zarządzania konfiguracją systemową.

### 2. Moduł E-Commerce z Bramką Płatniczą i Integracją Logistyczną
W pełni funkcjonalny sklep internetowy zintegrowany z zewnętrznymi usługodawcami:
- **Płatności online**: Pełna integracja z bramką **Stripe** obsługująca bezpieczne płatności kartowe oraz cyfrowe portfele bezpośrednio na stronie transakcji.
- **Wybór przesyłki (InPost)**: Integracja z widgetem API **InPost** umożliwiająca klientowi dynamiczny wybór paczkomatu docelowego z interaktywnej mapy punktów odbioru podczas przechodzenia przez koszyk zakupowy (Checkout).

### 3. Rezerwacja Stolików z Ochroną przed Race Conditions i Łatwym Anulowaniem
Proces rezerwacji stolików został zaprojektowany z myślą o spójności danych transakcyjnych:
- Wizualny interfejs wyboru stolików oparty na interaktywnej mapie (SVG/React) reagujący w czasie rzeczywistym na zajętość miejsc w wybranym przedziale czasowym.
- **Ochrona przed wyścigami (Race Conditions)**: Logika API rezerwacji weryfikuje dostępność zasobu bezpośrednio w bazie danych. Wykorzystanie unikalnych indeksów kompozytowych PostgreSQL (constraint `table_slot`) gwarantuje, że ten sam stolik nie zostanie zarezerwowany dwukrotnie na ten sam przedział czasowy, nawet w przypadku jednoczesnych zapytań (concurrency).
- **Prosty system odwoływania**: Każdy e-mail potwierdzający zawiera spersonalizowany, bezpieczny link z tokenem uniemożliwiającym sfałszowanie żądania. Kliknięcie w link pozwala użytkownikowi na natychmiastowe i bezproblemowe anulowanie rezerwacji jednym kliknięciem.

### 4. Generator Biletów z Ochroną przed Race Conditions, Kodami QR i Walidacją
Moduł eventowy automatyzuje proces dystrybucji wejściówek:
- **Ochrona przed nadmiarową rezerwacją**: System weryfikuje dostępną pulę wolnych miejsc w bazie danych przed zapisem transakcji biletowej, zapobiegając nadmiarowej rezerwacji (overbooking) przy jednoczesnych zakupach.
- Po dokonaniu rezerwacji system generuje unikalny numer biletu, na którego bazie tworzony jest kod QR (Base64 PNG), wysyłany bezpośrednio w wiadomości e-mail do klienta.
- Dedykowany endpoint walidacyjny pozwala pracownikom kawiarni skanować kody QR urządzeniem mobilnym i sprawdzać status oraz ważność biletu w czasie rzeczywistym.

### 5. Transakcyjny System Powiadomień E-mail
Komunikacja z użytkownikiem końcowym jest zautomatyzowana i oparta na szablonach e-mail:
- Integracja z dostawcą **Resend API**.
- Automatyczne powiadomienia o statusie zamówienia (złożenie zamówienia, płatność, wysyłka, realizacja).
- Potwierdzenia rezerwacji stolików wraz z unikalnym tokenem umożliwiającym bezpieczne anulowanie rezerwacji bezpośrednio z poziomu wiadomości e-mail.

---

## Architektura i Stack Technologiczny

Aplikacja została oparta na architekturze "server-first" w celu dostarczenia użytkownikowi zoptymalizowanego kodu HTML bez zbędnego narzutu JavaScript na kliencie, stosując selektywne nawadnianie (hydration).

### Główne Technologie
- **Astro (v4.x)**: Główny framework realizujący statyczne generowanie stron (SSG) oraz renderowanie po stronie serwera (SSR). Wykorzystanie architektury wyspowej (Island Architecture) pozwala na ładowanie kodu JS dla interaktywnych elementów Reacta wyłącznie w miejscach, gdzie jest to niezbędne.
- **React (v18)**: Używany wyłącznie do dynamicznych i stanowych komponentów interfejsu (np. koszyk zakupowy, interaktywna mapa stolików, formularze zakupowe).
- **TypeScript**: Gwarantuje ścisłe typowanie w całym projekcie, eliminując błędy na etapie kompilacji i standaryzując kontrakty danych.

### Baza Danych i Trwałość Danych
- **PostgreSQL**: Relacyjna baza danych obsługująca transakcje zamówień, rezerwacji oraz użytkowników.
- **Drizzle ORM**: Lekki i w pełni typowany ORM zapewniający maksymalną wydajność zapytań SQL bez narzutu ciężkich warstw abstrakcji.

### Style i Animacje
- **Tailwind CSS**: Narzędziowy framework CSS dostarczający spójny i łatwy w utrzymaniu system tokenów projektowych (Design System).
- **Framer Motion**: Wykorzystany do implementacji zaawansowanych mikrointerakcji oraz przejść animowanych wewnątrz dynamicznych komponentów React.

### Infrastruktura i CI/CD
- **Vercel**: Wdrożenie w architekturze Edge Network z funkcjami Serverless do obsługi API i endpointów SSR.
- **Vercel Blob**: Bezpieczne przechowywanie multimediów, zdjęć oraz materiałów prasowych.

---

## Kluczowe Rozwiązania Techniczne

### 1. Architektura Wyspowa (Island Architecture)
Większość serwisu ładuje się jako czysty, statyczny plik HTML. Elementy wymagające dynamicznej interakcji, takie jak `TableMapPicker` czy proces podsumowania zamówienia, są nawadniane na kliencie przy użyciu dyrektyw `client:load` oraz `client:visible`.

### 2. Zautomatyzowany Pakiet QA (Quality Assurance)
Projekt posiada zintegrowane środowisko testowe w celu zagwarantowania stabilności regresji:
- **Testy jednostkowe i integracyjne**: Oparte na frameworku `Vitest` oraz `React Testing Library`. Weryfikują one krytyczną logikę biznesową (np. kryptograficzna walidacja sesji, parsowanie i sanitacja danych adresowych).
- **Testy E2E (End-to-End)**: Oparte na `Playwright`. Scenariusze automatycznie symulują pełne ścieżki użytkownika (np. zabezpieczenia panelu administratora oraz integralność elementów strony głównej) w rzeczywistych przeglądarkach.

### 3. Bezpieczeństwo i Autoryzacja Sesji
W celu uniknięcia zewnętrznych zależności wdrożono autorskie mechanizmy uwierzytelniania w oparciu o bezpieczne pliki cookies z flagą HTTP-Only, autoryzowane za pomocą podpisów kryptograficznych HMAC-SHA256.

### 4. Optymalizacja Wydajności Mediów
Serwis wykorzystuje zautomatyzowane generowanie wariantów grafik w nowoczesnym formacie WebP wraz z odpowiednio dopasowanymi atrybutami `srcset`, co gwarantuje błyskawiczne renderowanie layoutu na urządzeniach mobilnych i desktopowych.

---

## Konfiguracja Lokalna i Uruchomienie

### Wymagania Wstępne
- Node.js (zalecana wersja v22.x LTS)
- Aktywna instancja bazy PostgreSQL (lokalna lub połączenie sieciowe)

### Instalacja i Pierwsze Kroki
```bash
# Instalacja zależności
npm install

# Przygotowanie zmiennych środowiskowych
cp .env.example .env.local

# Wdrożenie schematu bazy danych
npm run db:push

# Uruchomienie serwera deweloperskiego
npm run dev
```

### Wykonywanie Testów
```bash
# Uruchomienie testów jednostkowych
npm run test

# Uruchomienie testów End-to-End
npm run test:e2e
```

## Utrzymanie i Rozwój Kodu
Repozytorium podlega ścisłym regułom jakości kodu. Każda zmiana w kodzie (Pull Request) musi spełniać kryteria formatowania ESLint/Prettier oraz pomyślnie przejść testy jednostkowe Vitest i integracyjne Playwright.
