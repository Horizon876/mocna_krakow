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
  orangeInk: "#df7400",
  red: "#de3c42",
  yellow: "#ffde00",
  blue: "#2c5ea9",
  green: "#00955e",
  pink: "#e8afcd",
  graphite: "#333333",
} as const;

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
  { label: "Wesprzyj", href: "/wesprzyj" },
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
      { label: "Wesprzyj", href: "/wesprzyj" },
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
  {
    value: 7,
    label: "osób z niepełnosprawnościami zatrudnionych",
    color: COLORS.orange,
    accent: "orange",
    tileSize: "wide",
  },
  {
    value: 50,
    suffix: "+",
    label: "zorganizowanych wydarzeń",
    color: COLORS.red,
    accent: "red",
    tileSize: "compact",
  },
  {
    value: 800,
    suffix: "+",
    label: "uczestników warsztatów",
    color: COLORS.green,
    accent: "green",
    tileSize: "compact",
  },
  {
    value: 24000,
    suffix: "+",
    label: "filiżanek kawy pełnych MOCy",
    color: COLORS.yellow,
    accent: "yellow",
    tileSize: "compact",
  },
];

export type EventCard = {
  icon: string;
  title: string;
  desc: string;
  color: keyof typeof COLORS;
  href: string;
};

export const EVENT_KINDS: EventCard[] = [
  {
    icon: "🎤",
    title: "Koncerty",
    desc: "Kameralne wieczory z muzyką na żywo.",
    color: "orange",
    href: "/wydarzenia#koncerty",
  },
  {
    icon: "🎨",
    title: "Warsztaty",
    desc: "Latte art, ceramika, rękodzieło.",
    color: "red",
    href: "/wydarzenia#warsztaty",
  },
  {
    icon: "🧠",
    title: "Szkolenia",
    desc: "Barista, obsługa, kompetencje miękkie.",
    color: "blue",
    href: "/szkolenia",
  },
  {
    icon: "💛",
    title: "Grupy wsparcia",
    desc: "Bezpieczna przestrzeń i rozmowa.",
    color: "yellow",
    href: "/wydarzenia#wsparcie",
  },
  {
    icon: "📖",
    title: "Spotkania autorskie",
    desc: "Książki, kawa i dobre historie.",
    color: "green",
    href: "/wydarzenia#spotkania",
  },
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
    teaser:
      "Od pierwszego dnia wie, jak nazywa się stały gość i jaka kawa go ucieszy.",
    quote: "Tu po raz pierwszy poczułam, że jestem potrzebna.",
    body: "Karolina dołączyła do zespołu jako jedna z pierwszych. Dziś prowadzi szkolenia z latte art dla nowych uczestników i zna stałych gości po imieniu. Praca w MOCnej dała jej stabilizację, rytm dnia i poczucie sprawczości.",
  },
  {
    slug: "wiktor",
    name: "Wiktor",
    role: "Mistrz parzenia alternatyw",
    accent: "blue",
    teaser:
      "Drip, aeropress, chemex — przy nim każda metoda staje się małym rytuałem.",
    quote: "Kawa nauczyła mnie cierpliwości do siebie.",
    body: "Wiktor odpowiada za kawę przelewową i ścieżkę specialty. Z ogromną precyzją prowadzi degustacje i tłumaczy gościom różnice między ziarnami. W MOCnej znalazł zajęcie, które łączy jego skupienie z pasją.",
  },
  {
    slug: "adam",
    name: "Adam",
    role: "Serce zaplecza",
    accent: "green",
    teaser:
      "Dba o to, żeby wszystko działało — zanim ktokolwiek zdąży zauważyć problem.",
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
    teaser:
      "Koncert, warsztat, spotkanie autorskie — to ona sprawia, że wszystko gra.",
    quote: "Najbardziej lubię moment, gdy sala pełna jest ludzi.",
    body: "Magda koordynuje wydarzenia i wita gości. Z naturalną ciepłą energią buduje atmosferę, dla której ludzie wracają. Praca dała jej przestrzeń, by rozwinąć skrzydła w kontakcie z ludźmi.",
  },
  {
    slug: "szymon",
    name: "Szymon",
    role: "Twarz porannej zmiany",
    accent: "yellow",
    teaser:
      "Pierwszy uśmiech, jaki widzisz o ósmej rano. Działa lepiej niż espresso.",
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
  /** Kadrowanie zdjęcia w kafelku, np. "center 15%" */
  photoPosition?: string;
  accent: keyof typeof COLORS;
};

export const TEAM: TeamMember[] = [
  {
    slug: "kasia-kubicka",
    name: "Kasia Kubicka",
    desc: "Założycielka Fundacji MOCna!, trenerka, coachka i liderka społeczna. Od lat działa na rzecz osób z niepełnosprawnościami, tworząc miejsca, które dają szansę na rozwój, pracę i budowanie niezależności.",
    photo: "/photos/Kasia%20Prezeska%20Fundacji.jpg",
    accent: "orange",
  },
  {
    slug: "tadeusz",
    name: "Tadeusz",
    desc: "Współtwórca MOCnej! i cicha siła stojącą za wieloma działaniami Fundacji. Wspiera organizację od strony technicznej, logistycznej i organizacyjnej, zawsze gotowy do działania tam, gdzie jest potrzebny.",
    photo: "/photos/Tadeusz%20fundator%20Fundacji.jpg",
    accent: "blue",
  },
  {
    slug: "michal-menadzer",
    name: "Michał",
    desc: "Menadżer. Wspiera rozwój przedsiębiorstwa społecznego, organizację pracy zespołu oraz realizację nowych przedsięwzięć. Dba o to, aby misja społeczna szła w parze z profesjonalnym zarządzaniem.",
    photo: "/photos/Micha%C5%82%20menad%C5%BCer.jpg",
    photoPosition: "center 8%",
    accent: "red",
  },
  {
    slug: "maja",
    name: "Maja",
    desc: "Lorem ipsum",
    photo: "/photos/Maja.jpg",
    photoPosition: "center 14%",
    accent: "green",
  },
  {
    slug: "karolina",
    name: "Karolina",
    desc: "Od uczestniczki rehabilitacji do pracy w kawiarni.",
    photo: "/photos/Karolina.jpg",
    accent: "pink",
  },
  {
    slug: "wiktor",
    name: "Wiktor",
    desc: "Koordynator wydarzeń i ambasador samodzielności.",
    photo: "/photos/Wiktor.jpg",
    accent: "blue",
  },
  {
    slug: "adam",
    name: "Adam",
    desc: "Buduje swoje doświadczenie zawodowe każdego dnia.",
    photo: "/photos/Adam.jpg",
    accent: "orange",
  },
  {
    slug: "klaudia",
    name: "Klaudia",
    desc: "Łączy pracę z organizacją szkoleń i działań Fundacji. Wspiera rozwój MOCnej i budowanie relacji z uczestnikami oraz partnerami.",
    photo: "/photos/Klaudia.jpg",
    accent: "green",
  },
  {
    slug: "michal-barista",
    name: "Michał",
    desc: "Barista, kelner i pasjonat wypieków. W MOCnej! łączy pracę z ludźmi z zamiłowaniem do tworzenia domowych słodkości.",
    photo: "/photos/Micha%C5%82%20kelner.jpg",
    photoPosition: "center 18%",
    accent: "pink",
  },
  {
    slug: "szymon",
    name: "Szymon",
    desc: "Odpowiada za działania promocyjne i wspiera organizację wydarzeń. Wnosi kreatywność, energię i świeże spojrzenie na komunikację.",
    photo: "/photos/Szymon.jpg",
    photoPosition: "center 16%",
    accent: "red",
  },
  {
    slug: "magda",
    name: "Magda",
    desc: "Współtworzy atmosferę MOCnej, dbając o obsługę gości i codzienne funkcjonowanie kawiarni. Jej otwartość i serdeczność sprawiają, że każdy czuje się mile widziany.",
    photo: "/photos/Magda.jpg",
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
  {
    name: "TVP 3 Kraków",
    logo: "/photos/logo_tvp.jpg",
    href: "https://www.youtube.com/watch?v=2JFTrlK3lbQ",
  },
  {
    name: "Integracja",
    logo: "/photos/integracja.png",
    href: "https://niepelnosprawni.pl/artykuly/moja-piekna-corka",
  },
  {
    name: "Kraków.pl",
    logo: "/media/logos/krakow.png",
    href: "https://krakow.pl/dzielnica_v_krowodrza/299043,2318,komunikat,zajrzyj_do_kawiarni_mocna_i_wspieraj_osoby_z_niepelnosprawnosciami.html",
  },
  {
    name: "Onet",
    logo: "/media/logos/onet.png",
    href: "https://www.onet.pl/styl-zycia/krakowdlawas/po-wypadku-corki-w-krakowie-stworzyli-miejsce-pelne-zycia/fzcfm2v,0666d3f1",
  },
  {
    name: "PFRON",
    logo: "/media/logos/pfron.jpg",
    href: "https://www.pfron.org.pl/komunikaty-z-regionu/szczegoly-komunikatu/news/symboliczne-otwarcie-kawiarni-mocna/",
  },
  {
    name: "Radio Wnet",
    logo: "/media/logos/radiownet.png",
    href: "https://wnet.fm/2025/07/11/mocna-wyjatkowa-kawiarnia-na-krakowskiej-krowodrzy",
  },
  {
    name: "Radio Eska",
    logo: "/media/logos/eska.png",
    href: "https://krakow.eska.pl/nowe-wyjatkowe-miejsce-na-mapie-krakowa-kawiarnia-mocna-zatrudnia-osoby-z-niepelnosprawnoscia-galeria-aa-sx38-GkYm-YZPa.html",
  },
  {
    name: "Gość Niedzielny",
    logo: "/media/logos/gosc.jpg",
    href: "https://krakow.gosc.pl/doc/9485232.Kawiarnia-MOCna-Miejsce-ze-smakiem-ze-sztuka-i-z-sercem#google_vignette",
  },
  {
    name: "Razem z Tobą",
    logo: "/media/logos/razemztoba.jpg",
    href: "https://razemztoba.pl/__trashed-5/",
  },
  {
    name: "Facebook",
    logo: "/media/logos/facebook.png",
    href: "https://www.facebook.com/watch/?v=1987932185382868",
  },
  {
    name: "Instagram",
    logo: "/media/logos/instagram.jpg",
    href: "https://www.instagram.com/reels/DRuxAdNjdNG/",
  },
  {
    name: "Małopolskie24",
    logo: "/media/logos/malopolskie.png",
    href: "https://www.malopolskie24info.pl/2025/09/25/kawiarnia-mocna-w-krakowie-miejsce-pracy-i-wsparcia-dla-osob-z-niepelnosprawnosciami/",
  },
  {
    name: "Kraków.pl (Otofoto)",
    logo: "/media/logos/krakow.png",
    href: "https://www.krakow.pl/otofotokronika/245508,1313,562039,3260,otofoto.html",
  },
  {
    name: "Orły Gastronomii",
    logo: "/media/logos/orly.png",
    href: "https://www.orlygastronomii.pl/profile-748465-mocna-krakow",
  },
];

export type MediaItem = {
  outlet: string;
  title: string;
  href: string;
  accent: keyof typeof COLORS;
};

export const MEDIA: MediaItem[] = [
  {
    outlet: "Integracja",
    title: "Moja piękna córka",
    href: "https://niepelnosprawni.pl/artykuly/moja-piekna-corka",
    accent: "orange",
  },
  {
    outlet: "Kraków.pl",
    title: "Zajrzyj do kawiarni MOCna i wspieraj osoby z niepełnosprawnościami",
    href: "https://krakow.pl/dzielnica_v_krowodrza/299043,2318,komunikat,zajrzyj_do_kawiarni_mocna_i_wspieraj_osoby_z_niepelnosprawnosciami.html",
    accent: "blue",
  },
  {
    outlet: "Onet",
    title: "Po wypadku córki stworzyli miejsce pełne życia",
    href: "https://www.onet.pl/styl-zycia/krakowdlawas/po-wypadku-corki-w-krakowie-stworzyli-miejsce-pelne-zycia/fzcfm2v,0666d3f1",
    accent: "yellow",
  },
  {
    outlet: "PFRON",
    title: "Symboliczne otwarcie kawiarni MOCna",
    href: "https://www.pfron.org.pl/komunikaty-z-regionu/szczegoly-komunikatu/news/symboliczne-otwarcie-kawiarni-mocna/",
    accent: "green",
  },
  {
    outlet: "Radio Wnet",
    title: "MOCna – wyjątkowa kawiarnia na krakowskiej Krowodrzy",
    href: "https://wnet.fm/2025/07/11/mocna-wyjatkowa-kawiarnia-na-krakowskiej-krowodrzy",
    accent: "red",
  },
  {
    outlet: "Radio Eska",
    title: "Nowe, wyjątkowe miejsce na mapie Krakowa",
    href: "https://krakow.eska.pl/nowe-wyjatkowe-miejsce-na-mapie-krakowa-kawiarnia-mocna-zatrudnia-osoby-z-niepelnosprawnoscia-galeria-aa-sx38-GkYm-YZPa.html",
    accent: "pink",
  },
  {
    outlet: "Gość Niedzielny",
    title: "Kawiarnia MOCna. Miejsce ze smakiem, sztuką i sercem",
    href: "https://krakow.gosc.pl/doc/9485232.Kawiarnia-MOCna-Miejsce-ze-smakiem-ze-sztuka-i-z-sercem#google_vignette",
    accent: "blue",
  },
  {
    outlet: "Razem z Tobą",
    title: "Artykuł o kawiarni",
    href: "https://razemztoba.pl/__trashed-5/",
    accent: "orange",
  },
  {
    outlet: "TVP 3 Kraków",
    title: "Reportaż o MOCnej",
    href: "https://www.youtube.com/watch?v=2JFTrlK3lbQ",
    accent: "red",
  },
  {
    outlet: "Facebook",
    title: "Kraków.pl - materiał wideo",
    href: "https://www.facebook.com/watch/?v=1987932185382868",
    accent: "blue",
  },
  {
    outlet: "Instagram",
    title: "Kraków się wydarza",
    href: "https://www.instagram.com/reels/DRuxAdNjdNG/",
    accent: "pink",
  },
  {
    outlet: "Kraków.pl",
    title: "Otofoto kronika",
    href: "https://www.krakow.pl/otofotokronika/245508,1313,562039,3260,otofoto.html",
    accent: "blue",
  },
  {
    outlet: "Małopolskie24",
    title: "Kawiarnia MOCna – miejsce pracy i wsparcia",
    href: "https://www.malopolskie24info.pl/2025/09/25/kawiarnia-mocna-w-krakowie-miejsce-pracy-i-wsparcia-dla-osob-z-niepelnosprawnosciami/",
    accent: "green",
  },
  {
    outlet: "Orły Gastronomii",
    title: "Profil kawiarni MOCna",
    href: "https://www.orlygastronomii.pl/profile-748465-mocna-krakow",
    accent: "yellow",
  },
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
  {
    id: "herbata-owocowa",
    name: "Herbata owocowa",
    price: "44 zł",
    tag: "Ziarno specialty",
    color: "orange",
    emoji: "☕",
    image: "/photos/herbata.png",
  },
  {
    id: "voucher-prezentowy",
    name: "Voucher prezentowy",
    price: "od 50 zł",
    tag: "Najlepszy prezent",
    color: "red",
    emoji: "🎁",
    image: "/photos/voucher.png",
  },
  {
    id: "kubek-ceramiczny",
    name: "Kubek ceramiczny MOCna!",
    price: "59 zł",
    tag: "Rękodzieło",
    color: "blue",
    emoji: "🥤",
    image: "/photos/kubek.png",
  },
  {
    id: "swieca-sojowa",
    name: "Świeca sojowa",
    price: "39 zł",
    tag: "Robione ręcznie",
    color: "green",
    emoji: "🕯️",
  },
  {
    id: "rekodzielo-uczestnikow",
    name: "Rękodzieło uczestników",
    price: "od 25 zł",
    tag: "Unikat",
    color: "pink",
    emoji: "🧶",
  },
  {
    id: "ciasto-na-zamowienie",
    name: "Ciasto na zamówienie",
    price: "od 89 zł",
    tag: "Cukiernia Klaudii",
    color: "yellow",
    emoji: "🍰",
  },
];
