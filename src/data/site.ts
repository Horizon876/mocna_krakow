// ---------------------------------------------------------------------------
//  Centralne dane witryny MOCna! – jedno źródło prawdy dla nawigacji i treści
// ---------------------------------------------------------------------------

export const BRAND = {
  name: "MOCna!",
  tagline: "miejsce, gdzie kawa spotyka człowieka",
  email: "hej@mocna.org",
  phone: "+48 600 100 200",
  address: "ul. Przykładowa 12, 31-000 Kraków",
  hours: [
    { d: "Pon – Pt", h: "8:00 – 19:00" },
    { d: "Sobota", h: "9:00 – 18:00" },
    { d: "Niedziela", h: "10:00 – 16:00" },
  ],
  socials: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ],
  // Mapa Google (embed) – centrum Krakowa jako placeholder
  mapEmbed:
    "https://www.google.com/maps?q=Rynek+G%C5%82%C3%B3wny+Krak%C3%B3w&output=embed",
} as const;

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

export type NavItem = { label: string; href: string };

// Dokładnie 12 podstron menu głównego
export const NAV: NavItem[] = [
  { label: "Start", href: "/" },
  { label: "O MOCnej", href: "/o-mocnej" },
  { label: "Kawiarnia", href: "/kawiarnia" },
  { label: "Rezerwacja", href: "/rezerwacja" },
  { label: "Wydarzenia", href: "/wydarzenia" },
  { label: "Sklep", href: "/sklep" },
  { label: "Catering", href: "/catering" },
  { label: "Szkolenia", href: "/szkolenia" },
  { label: "W mediach", href: "/w-mediach" },
  { label: "Wolontariat", href: "/wolontariat" },
  { label: "Projekty", href: "/projekty" },
  { label: "Wesprzyj", href: "/wesprzyj" },
  { label: "Kontakt", href: "/kontakt" },
];

export type Stat = { value: number; suffix?: string; label: string; color: string };

export const STATS: Stat[] = [
  { value: 7, label: "osób z niepełnosprawnościami zatrudnionych", color: COLORS.orange },
  { value: 50, suffix: "+", label: "zorganizowanych wydarzeń", color: COLORS.red },
  { value: 800, suffix: "+", label: "uczestników warsztatów", color: COLORS.green },
  { value: 24000, suffix: "+", label: "filiżanek kawy pełnych MOCy", color: COLORS.blue },
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

export type MediaItem = { outlet: string; title: string; href: string; accent: keyof typeof COLORS };

export const MEDIA: MediaItem[] = [
  { outlet: "TVP Kraków", title: "Kawiarnia, która zatrudnia i zmienia życie", href: "#", accent: "blue" },
  { outlet: "Integracja", title: "MOCna! — godność przez pracę", href: "#", accent: "orange" },
  { outlet: "Radio Kraków", title: "Specialty z misją w sercu miasta", href: "#", accent: "red" },
  { outlet: "Magiczny Kraków", title: "Miejsce, które warto odwiedzić", href: "#", accent: "green" },
  { outlet: "Gazeta Krakowska", title: "Tu kawa spotyka człowieka", href: "#", accent: "pink" },
  { outlet: "Onet", title: "Ekonomia społeczna od kuchni", href: "#", accent: "yellow" },
];

export type Product = { name: string; price: string; tag: string; color: keyof typeof COLORS; emoji: string };

export const PRODUCTS: Product[] = [
  { name: "Kawa MOCna! — Blend Sezonowy", price: "44 zł", tag: "Ziarno specialty", color: "orange", emoji: "☕" },
  { name: "Voucher prezentowy", price: "od 50 zł", tag: "Najlepszy prezent", color: "red", emoji: "🎁" },
  { name: "Kubek ceramiczny MOCna!", price: "59 zł", tag: "Rękodzieło", color: "blue", emoji: "🥤" },
  { name: "Świeca sojowa", price: "39 zł", tag: "Robione ręcznie", color: "green", emoji: "🕯️" },
  { name: "Rękodzieło uczestników", price: "od 25 zł", tag: "Unikat", color: "pink", emoji: "🧶" },
  { name: "Ciasto na zamówienie", price: "od 89 zł", tag: "Cukiernia Klaudii", color: "yellow", emoji: "🍰" },
];
