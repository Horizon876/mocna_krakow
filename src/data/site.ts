// ---------------------------------------------------------------------------
//  Centralne dane witryny MOCna! – jedno źródło prawdy dla nawigacji i treści
// ---------------------------------------------------------------------------

export const BRAND = {
  name: "MOCna!",
  tagline: "miejsce, gdzie kawa spotyka człowieka",
  email: "kawiarniamocna@gmail.com",
  phone: "+48 786 507 513",
  address: "ul. Rzeczna 11A, 30-021 Kraków",
  hours: [
    { d: "Pon – Pt", h: "9:00 – 19:00" },
    { d: "Sobota", h: "9:00 – 19:00" },
    { d: "Niedziela", h: "9:00 – 19:00" },
  ],
  socials: [
    {
      label: "Facebook",
      href: "https://www.facebook.com/p/Mocna-Krak%C3%B3w-61575248613935",
    },
    { label: "Instagram", href: "https://www.instagram.com/mocna.krakow/" },
  ],
  mapEmbed:
    "https://www.google.com/maps?q=Kawiarnia+MOCna!+Rzeczna+11A+Krak%C3%B3w&hl=pl&z=16&output=embed",
  mapLink: "https://share.google/iZ7yLHhxWEjOwHZGf",
} as const;

/** Godziny otwarcia — źródło dla skryptu otwarte/zamknięte (0 = niedziela … 6 = sobota). */
export const OPEN_HOURS = [
  { label: "Pon – Pt", days: [1, 2, 3, 4, 5], open: "9:00", close: "19:00" },
  { label: "Sobota", days: [6], open: "9:00", close: "19:00" },
  { label: "Niedziela", days: [0], open: "9:00", close: "19:00" },
] as const;

export const WEEKDAY_LABELS = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
] as const;

// Dokładne kolory marki (z pliku logo)
export const COLORS = {
  orange: "#f39200",
  red: "#de3c42",
  yellow: "#ffde00",
  blue: "#2c5ea9",
  green: "#00955e",
  pink: "#e8afcd",
  graphite: "#333333",
} as const;

/** Sekcje strony głównej linkowane z menu — własne przewinięcie zamiast domyślnej kotwicy. */
export const HOME_SECTION_SCROLL = {
  poznajMocna: {
    id: "poznaj-mocna",
    /** px w dół od górnej krawędzi sekcji (ukrywa hero, wyląduj na treści „O MOCnej”). */
    extraOffset: 38,
  },
  mocnaWMediach: {
    id: "mocna-w-mediach",
    extraOffset: 0,
  },
  wesprzyjNas: {
    id: "wesprzyj-nas",
    extraOffset: 0,
  },
} as const;

export type NavItem = { label: string; href: string };

// Dokładnie 12 podstron menu głównego
export const NAV: NavItem[] = [
  { label: "Start", href: "/" },
  { label: "O MOCnej", href: "/#poznaj-mocna" },
  { label: "Kawiarnia", href: "/kawiarnia" },
  { label: "Rezerwacja", href: "/rezerwacja" },
  { label: "Wydarzenia", href: "/wydarzenia" },
  { label: "Sklep", href: "/sklep" },
  { label: "Catering", href: "/catering" },
  { label: "Szkolenia", href: "/szkolenia" },
  { label: "W mediach", href: "/#mocna-w-mediach" },
  { label: "Wolontariat", href: "/wolontariat" },
  { label: "Projekty", href: "/projekty" },
  { label: "Wesprzyj", href: "/#wesprzyj-nas" },
  { label: "Kontakt", href: "/kontakt" },
];

export type FooterSection = { title: string; links: NavItem[] };

/** Stopka — logiczne grupy linków. */
export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "O nas",
    links: [
      { label: "Start", href: "/" },
      { label: "O MOCnej", href: "/#poznaj-mocna" },
      { label: "Ludzie MOCnej", href: "/ludziemocnej" },
      { label: "W mediach", href: "/#mocna-w-mediach" },
      { label: "Projekty", href: "/projekty" },
      { label: "Wolontariat", href: "/wolontariat" },
    ],
  },
  {
    title: "Oferta",
    links: [
      { label: "Kawiarnia", href: "/kawiarnia" },
      { label: "Rezerwacja", href: "/rezerwacja" },
      { label: "Wydarzenia", href: "/wydarzenia" },
      { label: "Sklep", href: "/sklep" },
      { label: "Catering", href: "/catering" },
      { label: "Szkolenia", href: "/szkolenia" },
    ],
  },
  {
    title: "Informacje",
    links: [
      { label: "Wesprzyj", href: "/#wesprzyj-nas" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
      { label: "Regulamin", href: "/regulamin" },
    ],
  },
];

export type StatAccent = "orange" | "yellow" | "red" | "green" | "blue";

export type StatTileSize = "wide" | "compact";

export type Stat = {
  value: number;
  suffix?: string;
  label: string;
  color: string;
  accent: StatAccent;
  tileSize: StatTileSize;
};

export const STATS: Stat[] = [
  { value: 7, label: "osób z niepełnosprawnościami zatrudnionych", color: COLORS.orange, accent: "orange", tileSize: "wide" },
  { value: 50, suffix: "+", label: "zorganizowanych wydarzeń", color: COLORS.red, accent: "red", tileSize: "compact" },
  { value: 800, suffix: "+", label: "uczestników warsztatów", color: COLORS.green, accent: "green", tileSize: "compact" },
  { value: 24000, suffix: "+", label: "filiżanek kawy pełnych MOCy", color: COLORS.yellow, accent: "yellow", tileSize: "compact" },
];

export type EventCard = {
  icon: string;
  title: string;
  desc: string;
  color: keyof typeof COLORS;
  href: string;
};

export const EVENT_KINDS: EventCard[] = [
  { icon: "🎤", title: "Koncerty", desc: "Kameralne wieczory z muzyką na żywo.", color: "orange", href: "/wydarzenia#koncerty" },
  { icon: "🎨", title: "Warsztaty", desc: "Latte art, ceramika, rękodzieło.", color: "red", href: "/wydarzenia#warsztaty" },
  { icon: "🧠", title: "Szkolenia", desc: "Barista, obsługa, kompetencje miękkie.", color: "blue", href: "/szkolenia" },
  { icon: "💛", title: "Grupy wsparcia", desc: "Bezpieczna przestrzeń i rozmowa.", color: "yellow", href: "/wydarzenia#wsparcie" },
  { icon: "📖", title: "Spotkania autorskie", desc: "Książki, kawa i dobre historie.", color: "green", href: "/wydarzenia#spotkania" },
];

export type Story = {
  slug: string;
  name: string;
  role: string;
  accent: keyof typeof COLORS;
  teaser: string;
  quote: string;
  body: string;
};

export const STORIES: Story[] = [
  {
    slug: "karolina",
    name: "Karolina",
    role: "Baristka, dusza sali",
    accent: "orange",
    teaser: "Od pierwszego dnia wie, jak nazywa się stały gość i jaka kawa go ucieszy.",
    quote: "Tu po raz pierwszy poczułam, że jestem potrzebna.",
    body: "Karolina dołączyła do zespołu jako jedna z pierwszych. Dziś prowadzi szkolenia z latte art dla nowych uczestników i zna stałych gości po imieniu. Praca w MOCnej dała jej stabilizację, rytm dnia i poczucie sprawczości.",
  },
  {
    slug: "wiktor",
    name: "Wiktor",
    role: "Mistrz parzenia alternatyw",
    accent: "blue",
    teaser: "Drip, aeropress, chemex — przy nim każda metoda staje się małym rytuałem.",
    quote: "Kawa nauczyła mnie cierpliwości do siebie.",
    body: "Wiktor odpowiada za kawę przelewową i ścieżkę specialty. Z ogromną precyzją prowadzi degustacje i tłumaczy gościom różnice między ziarnami. W MOCnej znalazł zajęcie, które łączy jego skupienie z pasją.",
  },
  {
    slug: "adam",
    name: "Adam",
    role: "Serce zaplecza",
    accent: "green",
    teaser: "Dba o to, żeby wszystko działało — zanim ktokolwiek zdąży zauważyć problem.",
    quote: "Lubię, kiedy wszystko jest na swoim miejscu.",
    body: "Adam ogarnia logistykę, zamówienia i porządek na zapleczu. To dzięki niemu sala działa płynnie. Praca dała mu poczucie odpowiedzialności i dumę z tego, że zespół na nim polega.",
  },
  {
    slug: "klaudia",
    name: "Klaudia",
    role: "Cukiernia i ciasta na zamówienie",
    accent: "pink",
    teaser: "Jej serniki znikają z witryny szybciej, niż zdążymy je opisać.",
    quote: "Pieczenie to mój język miłości.",
    body: "Klaudia tworzy autorskie ciasta i desery dostępne także na zamówienie. Każdy wypiek to jej mały projekt. W MOCnej rozwinęła talent w prawdziwe rzemiosło.",
  },
  {
    slug: "magda",
    name: "Magda",
    role: "Gospodyni wydarzeń",
    accent: "red",
    teaser: "Koncert, warsztat, spotkanie autorskie — to ona sprawia, że wszystko gra.",
    quote: "Najbardziej lubię moment, gdy sala pełna jest ludzi.",
    body: "Magda koordynuje wydarzenia i wita gości. Z naturalną ciepłą energią buduje atmosferę, dla której ludzie wracają. Praca dała jej przestrzeń, by rozwinąć skrzydła w kontakcie z ludźmi.",
  },
  {
    slug: "szymon",
    name: "Szymon",
    role: "Twarz porannej zmiany",
    accent: "yellow",
    teaser: "Pierwszy uśmiech, jaki widzisz o ósmej rano. Działa lepiej niż espresso.",
    quote: "Dzień dobry mówię tak, żeby ktoś poczuł się lepiej.",
    body: "Szymon otwiera kawiarnię i wita pierwszych gości. Jego pogoda ducha nadaje ton całemu dniu. W MOCnej odnalazł rytm, relacje i miejsce, w którym jest sobą.",
  },
];

export type TeamMember = {
  slug: string;
  name: string;
  desc: string;
  /** Ścieżka w public, np. /photos/ludzie/karolina.jpg */
  photo?: string;
  accent: keyof typeof COLORS;
};

export const TEAM: TeamMember[] = [
  {
    slug: "kasia-kubicka",
    name: "Kasia Kubicka",
    desc: "Założycielka Fundacji MOCna!, trenerka, coachka i liderka społeczna. Od lat działa na rzecz osób z niepełnosprawnościami, tworząc miejsca, które dają szansę na rozwój, pracę i budowanie niezależności.",
    photo: "/photos/kubicka.jpeg",
    accent: "orange",
  },
  {
    slug: "tadeusz",
    name: "Tadeusz",
    desc: "Współtwórca MOCnej! i cicha siła stojącą za wieloma działaniami Fundacji. Wspiera organizację od strony technicznej, logistycznej i organizacyjnej, zawsze gotowy do działania tam, gdzie jest potrzebny.",
    photo: "/photos/tadeusz.jpeg",
    accent: "blue",
  },
  {
    slug: "michal-menadzer",
    name: "Michał",
    desc: "Menadżer. Wspiera rozwój przedsiębiorstwa społecznego, organizację pracy zespołu oraz realizację nowych przedsięwzięć. Dba o to, aby misja społeczna szła w parze z profesjonalnym zarządzaniem.",
    photo: "/photos/michal.jpeg",
    accent: "red",
  },
  {
    slug: "kasia-b",
    name: "Kasia B",
    desc: "Koordynatorka ds. reintegracji i trenerka pracy. Wspiera pracowników w rozwoju zawodowym.",
    photo: "/photos/kasia.jpeg",
    accent: "yellow",
  },
  {
    slug: "maja",
    name: "Maja",
    desc: "Lorem ipsum",
    accent: "green",
  },
  {
    slug: "karolina",
    name: "Karolina",
    desc: "Od uczestniczki rehabilitacji do pracy w kawiarni.",
    accent: "pink",
  },
  {
    slug: "wiktor",
    name: "Wiktor",
    desc: "Koordynator wydarzeń i ambasador samodzielności.",
    accent: "blue",
  },
  {
    slug: "adam",
    name: "Adam",
    desc: "Buduje swoje doświadczenie zawodowe każdego dnia.",
    accent: "orange",
  },
  {
    slug: "klaudia",
    name: "Klaudia",
    desc: "Łączy pracę z organizacją szkoleń i działań Fundacji. Wspiera rozwój MOCnej i budowanie relacji z uczestnikami oraz partnerami.",
    accent: "green",
  },
  {
    slug: "michal-barista",
    name: "Michał",
    desc: "Barista, kelner i pasjonat wypieków. W MOCnej! łączy pracę z ludźmi z zamiłowaniem do tworzenia domowych słodkości.",
    accent: "pink",
  },
  {
    slug: "szymon",
    name: "Szymon",
    desc: "Odpowiada za działania promocyjne i wspiera organizację wydarzeń. Wnosi kreatywność, energię i świeże spojrzenie na komunikację.",
    accent: "red",
  },
  {
    slug: "magda",
    name: "Magda",
    desc: "Współtworzy atmosferę MOCnej, dbając o obsługę gości i codzienne funkcjonowanie kawiarni. Jej otwartość i serdeczność sprawiają, że każdy czuje się mile widziany.",
    accent: "yellow",
  },
];

export type CafePhoto = { src: string; alt: string };

export const CAFE_GALLERY: CafePhoto[] = [
  { src: "/photos/poznaj_mocna.jpeg", alt: "Wnętrze kawiarni MOCna!" },
  { src: "/photos/zespol.jpeg", alt: "Zespół w kawiarni MOCna!" },
];

export type MediaLogo = { name: string; logo: string; href?: string };

export const MEDIA_LOGOS_HOME: MediaLogo[] = [
  { name: "TVP Kraków", logo: "/photos/logo_tvp.jpg", href: "/#mocna-w-mediach" },
  { name: "Integracja", logo: "/photos/integracja.png", href: "/#mocna-w-mediach" },
  { name: "Radio", logo: "/media/logos/radio.svg", href: "/#mocna-w-mediach" },
  { name: "portale miejskie", logo: "/media/logos/portale-miejskie.svg", href: "/#mocna-w-mediach" },
  { name: "artykuły prasowe", logo: "/media/logos/artykuly-prasowe.svg", href: "/#mocna-w-mediach" },
];

export type MediaItem = { outlet: string; title: string; href: string; accent: keyof typeof COLORS };

export const MEDIA: MediaItem[] = [
  { outlet: "TVP Kraków", title: "Kawiarnia, która zatrudnia i zmienia życie", href: "#", accent: "blue" },
  { outlet: "Integracja", title: "MOCna! — godność przez pracę", href: "#", accent: "orange" },
  { outlet: "Radio Kraków", title: "Specialty z misją w sercu miasta", href: "#", accent: "red" },
  { outlet: "Magiczny Kraków", title: "Miejsce, które warto odwiedzić", href: "#", accent: "green" },
  { outlet: "Gazeta Krakowska", title: "Tu kawa spotyka człowieka", href: "#", accent: "pink" },
  { outlet: "Onet", title: "Ekonomia społeczna od kuchni", href: "#", accent: "yellow" },
];

export type Product = {
  id: string;
  name: string;
  price: string;
  tag: string;
  color: keyof typeof COLORS;
  emoji: string;
  image?: string;
};

export const PRODUCTS: Product[] = [
  { id: "herbata-owocowa", name: "Herbata owocowa", price: "44 zł", tag: "Ziarno specialty", color: "orange", emoji: "☕", image: "/photos/herbata.png" },
  { id: "voucher-prezentowy", name: "Voucher prezentowy", price: "od 50 zł", tag: "Najlepszy prezent", color: "red", emoji: "🎁", image: "/photos/voucher.png" },
  { id: "kubek-ceramiczny", name: "Kubek ceramiczny MOCna!", price: "59 zł", tag: "Rękodzieło", color: "blue", emoji: "🥤", image: "/photos/kubek.png" },
  { id: "swieca-sojowa", name: "Świeca sojowa", price: "39 zł", tag: "Robione ręcznie", color: "green", emoji: "🕯️" },
  { id: "rekodzielo-uczestnikow", name: "Rękodzieło uczestników", price: "od 25 zł", tag: "Unikat", color: "pink", emoji: "🧶" },
  { id: "ciasto-na-zamowienie", name: "Ciasto na zamówienie", price: "od 89 zł", tag: "Cukiernia Klaudii", color: "yellow", emoji: "🍰" },
];
