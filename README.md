# MOCna! — społeczna kawiarnia specialty

Wielostronicowa witryna (MPA) zbudowana w **Astro + Tailwind CSS + React (Astro Islands) + Framer Motion**, z **Astro View Transitions** dla płynnych przejść klasy premium.

> „Najpierw człowiek. Potem kawa. Zawsze w tej kolejności.”

---

## 1. Wizja artystyczna i User Flow

**Styl: Organic Modernism.** Czysta biel jako oddech, grafit `#333` zamiast czerni, a do tego pełna, dokładna paleta marki z logo. Sekcje nie są odcinane prostą linią — przechodzą jedna w drugą **krzywymi Béziera** (`OrganicDivider`), tła wypełniają rozmyte, morfujące **bloby** inspirowane skrzydłami logo, a całość spina subtelny **watermark patternu** i stała **tekstura szumu (~3%)**, która zabija „cyfrową sterylność”.

**User Flow strony głównej** prowadzi emocjonalnie: mocny *statement* (Hero) → *dlaczego* (misja + animowane liczniki) → *co się dzieje* (wydarzenia) → *zabierz MOC do domu* (sklep) → **showstopper** budujący zaufanie (czarno-białe portrety, które ożywają kolorem) → dowód społeczny (media) → zmysły (galeria kawiarni) → konwersja (wsparcie). Każdy krok ma jasny, „custom made” CTA — nic nie wygląda jak gotowy komponent z biblioteki.

Dostępność i wydajność są częścią premium: `prefers-reduced-motion`, widoczny focus w kolorze marki, skip-link, a JavaScript ładuje się **tylko** na wyspach, które tego wymagają (liczniki, showstopper).

## 2. Struktura projektu

```
mocna/
├─ astro.config.mjs          # integracje: tailwind + react, prefetch, islands
├─ tailwind.config.mjs       # ścisła paleta marki, fluid typo, animacje (glow/szum)
├─ tsconfig.json             # aliasy @components / @layouts / @data
├─ package.json
├─ public/
│  ├─ brand/                 # PRAWDZIWE assety marki (SVG + PNG)
│  │  ├─ logo-kolor.svg / logo-white.svg
│  │  ├─ pattern.svg / pattern.png      # watermark
│  │  └─ skrzydla-01.svg / skrzydla-02.svg
│  └─ photos/                # tu wgraj zdjęcia (zespół, kawiarnia…)
└─ src/
   ├─ styles/global.css      # fonty, warstwy, komponenty, view transitions
   ├─ data/site.ts           # JEDNO źródło prawdy: nav(12), kolory, stats, stories…
   ├─ layouts/BaseLayout.astro
   ├─ components/
   │  ├─ NoiseOverlay.astro   • FlyingNav.astro    • Footer.astro
   │  ├─ HeroSection.astro    • BentoMission.astro • Counter.tsx (island)
   │  ├─ EventsTiles.astro    • ShopPreview.astro
   │  ├─ StoriesShowstopper.tsx (island) • StoriesSection.astro
   │  ├─ MediaWall.astro      • CafeGallery.astro  • SupportCards.astro
   │  ├─ BrandBlobs.astro     • OrganicDivider.astro
   │  └─ Photo.astro • PageHero.astro • SectionHeading.astro
   └─ pages/                  # 12 podstron menu
      ├─ index.astro          ├─ o-mocnej.astro    ├─ kawiarnia.astro
      ├─ rezerwacja.astro     ├─ wydarzenia.astro  ├─ sklep.astro
      ├─ catering.astro       ├─ szkolenia.astro   ├─ w-mediach.astro
      ├─ wolontariat.astro    ├─ wesprzyj.astro    └─ kontakt.astro
```

## 3. Paleta marki (dokładne wartości z logo)

| Token | HEX | Zastosowanie |
|---|---|---|
| `orange` | `#f39200` | główny akcent / CTA |
| `red` | `#de3c42` | energia, akcenty |
| `yellow` | `#ffde00` | miękkie tła, przełamania |
| `blue` | `#2c5ea9` | akcent / skrzydła logo |
| `green` | `#00955e` | akcent / „realny wpływ” |
| `pink` | `#e8afcd` | akcent / cukiernia |
| `graphite` | `#333333` | tekst (ZAKAZ `#000`) |
| `white` | `#ffffff` | tło bazowe |

## 4. Jak uruchomić

Wymagany **Node.js 18.20+ lub 20+** wraz z `npm` (na tej maszynie `npm` nie był zainstalowany — patrz niżej).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # produkcyjny build do ./dist
npm run preview    # podgląd buildu
```

### Brak npm? Zainstaluj Node (Windows, winget)

```powershell
winget install OpenJS.NodeJS.LTS
# zamknij i otwórz ponownie terminal, potem:
npm install
npm run dev
```

### Zmienne środowiskowe

Skopiuj `.env.example` do `.env` i uzupełnij:

| Zmienna | Opis |
|---|---|
| `DATABASE_URL` | PostgreSQL (Neon, Supabase, Vercel Postgres) |
| `SESSION_SECRET` | Losowy sekret sesji admina (min. 32 znaki) |
| `ADMIN_PASSWORD_HASH_B64` | Hash bcrypt hasła admina w base64 |
| `BLOB_READ_WRITE_TOKEN` | Opcjonalnie lokalnie; na Vercel — po podłączeniu Blob Storage |

Schemat bazy:

```bash
npm run db:push
```

## 5. Deploy na Vercel

1. Wypchnij repozytorium na GitHub i zaimportuj projekt w [Vercel](https://vercel.com).
2. Framework zostanie wykryty automatycznie (Astro).
3. W **Settings → Environment Variables** dodaj zmienne z `.env.example`.
4. Utwórz bazę **Vercel Postgres** (lub podłącz Neon/Supabase) i ustaw `DATABASE_URL`.
5. Uruchom `npm run db:push` lokalnie z produkcyjnym `DATABASE_URL` (jednorazowo).
6. W **Storage → Blob** utwórz store — token `BLOB_READ_WRITE_TOKEN` zostanie dodany automatycznie.
7. Deploy — build: `npm run build`, adapter: `@astrojs/vercel/serverless`.

Panel admina: `/admin/login`

## 6. Podmiana placeholderów na prawdziwe zdjęcia

Komponent `Photo.astro` renderuje markowy placeholder, dopóki nie podasz zdjęcia.
Wgraj plik do `public/photos/` i podaj `src`:

```astro
<Photo src="/photos/zespol.jpg" alt="Zespół MOCnej" mask="blob" ratio="4/5" />
```

## 7. Architektura wysp (Astro Islands)

Tylko dwa komponenty wysyłają JS do klienta — i to dopiero, gdy wjadą w viewport:

- `Counter.tsx` → `client:visible` (animowane liczniki)
- `StoriesShowstopper.tsx` → `client:visible` (poziomy parallax + modal historii)

Reszta witryny to czysty, statyczny HTML/CSS. Nawigacja, formularze i menu mobilne używają minimalnych skryptów inline, re-inicjowanych po `astro:after-swap` (View Transitions).
