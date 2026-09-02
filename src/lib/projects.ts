import { asc } from "drizzle-orm";
import { db } from "../db";
import { projects } from "../db/schema";
import { COLORS } from "../data/site";
import {
  CONTENT_CACHE_KEYS,
  getCachedContent,
  refreshCachedContent,
} from "./content-cache";

export type ProjectMetaItem = { label: string; value: string };

export type ProjectCard = {
  title: string;
  opis: string;
  punkty?: string[];
  dodatkowyOpis?: string;
  finansowanie?: string;
  meta: ProjectMetaItem[];
  color: keyof typeof COLORS;
  textColor?: "white" | "black";
  metaTitle?: string;
  logo?: string;
  logoAlt?: string;
  logoClass?: string;
  logoPosition?: string;
  logoPdf?: string;
  link?: string | null;
  linkLabel?: string;
};

/** Domyślne projekty (seed gdy tabela pusta). */
export const DEFAULT_PROJECTS: ProjectCard[] = [
  {
    color: "blue",
    title: "Wigilia Pełna MOCy",
    opis: "Fundacja MOCna! zorganizowała warsztaty tworzenia ozdób i kartek świątecznych oraz przygotowała świąteczne boksy z potrawami wykonanymi przez pracowników Kawiarni Społecznej MOCna! — osoby z niepełnosprawnościami aktywnie uczestniczące w życiu zawodowym i społecznym.",
    meta: [
      { label: "Całkowita wartość", value: "16 000,00 zł" },
      { label: "Dofinansowanie Miasta Krakowa", value: "10 000,00 zł" },
      { label: "Wkład własny Fundacji", value: "6 000,00 zł" },
    ],
    logo: "/media/logos/krakow.png",
    logoAlt: "Logo Miasta Krakowa",
    link: "https://www.facebook.com/share/r/1JAkWULoAY/",
    linkLabel: "Zobacz relację",
  },
  {
    color: "red",
    title: "Mental Fest 2026",
    opis: "Fundacja MOCna! realizuje działania związane z udziałem w Mental Fest 2026 — wydarzeniu promującym zdrowie psychiczne, integrację społeczną i inkluzywność. Organizacja prowadzi działania edukacyjne, warsztatowe i integracyjne skierowane do mieszkańców Krakowa.",
    meta: [
      { label: "Wartość zadania", value: "7 300,00 zł" },
      { label: "Dofinansowanie", value: "7 300,00 zł" },
      { label: "Data umowy", value: "07.05.2026 r." },
      { label: "Źródło", value: "Budżet państwa · PROO 2018–2030" },
    ],
    logo: "/media/logos/logo_proo_mental_fest.png",
    logoAlt: "Logotyp dofinansowania PROO",
    logoPdf: "/media/logos/PROO_zestawienie_2_plik_edytowalny_KOLOR.pdf",
  },
  {
    color: "green",
    title: "MOC relacji",
    opis: "Fundacja MOCna! realizuje projekt „MOC relacji – wsparcie osób z niepełnosprawnościami w budowaniu bliskości i samostanowienia” w ramach konkursu grantowego „Lokalne Inicjatywy mają MOC!”. Celem projektu jest wzmacnianie kompetencji społecznych, komunikacyjnych i relacyjnych osób z niepełnosprawnościami, wspieranie ich samostanowienia oraz budowanie większej świadomości wśród rodzin, opiekunów i specjalistów.",
    punkty: [
      "warsztaty „Relacje, emocje i komunikacja” dla osób z niepełnosprawnościami,",
      "warsztaty „Jak wspierać dorosłość i autonomię” dla rodziców i opiekunów,",
      "szkolenie „Granice, zgoda i sytuacje trudne” dla kadry,",
      "otwarte spotkanie środowiskowe integrujące osoby z niepełnosprawnościami, rodziny oraz lokalną społeczność.",
    ],
    dodatkowyOpis:
      "Projekt odpowiada na potrzebę tworzenia bezpiecznej przestrzeni do rozmowy o relacjach, emocjach, bliskości, prawie do decydowania o sobie oraz budowania satysfakcjonującego życia społecznego osób z niepełnosprawnościami.",
    meta: [
      { label: "Wartość dofinansowania", value: "37 840,00 zł" },
      { label: "Realizator projektu", value: "Fundacja MOCna!" },
      { label: "Operator konkursu", value: "Fundacja Centrum Rehabilitacji Znowu w Biegu" },
    ],
    logo: "/media/logos/logo_moc_relacji.png",
    logoAlt: "Logotypy partnerów MOC relacji",
    logoClass: "aspect-[576/128] h-auto",
    finansowanie:
      "Sfinansowano ze środków Państwowego Funduszu Rehabilitacji Osób Niepełnosprawnych w ramach konkursu „Lokalne Inicjatywy mają MOC!”.",
    link: null,
  },
  {
    color: "blue",
    title: "MOC głosu, MOC pracy",
    opis: "Fundacja MOCna! realizuje projekt „MOC głosu, MOC pracy – cykl podcastów aktywizujących osoby z niepełnosprawnościami i ich otoczenie”.",
    meta: [
      { label: "Realizator projektu", value: "Fundacja MOCna!" },
      { label: "Tryb", value: "Małe Granty (pozakonkursowy)" },
      { label: "Źródło", value: "Województwo Małopolskie" },
    ],
    logo: "/media/logos/logo_malopolska.png",
    logoAlt: "Logo Województwa Małopolskiego",
    logoClass: "p-6",
    finansowanie:
      "Zadanie publiczne realizowane w trybie pozakonkursowym tzw. „Małych Grantów” na podstawie art. 19a ustawy z dnia 24 kwietnia 2003 r. o działalności pożytku publicznego i o wolontariacie oraz zgodnie z Regulaminem określonym w Zarządzeniu Nr 70/2022 Marszałka Województwa Małopolskiego.",
    link: null,
  },
];

export function parseMetaJson(raw: string | null | undefined): ProjectMetaItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ProjectMetaItem =>
          item &&
          typeof item === "object" &&
          typeof item.label === "string" &&
          typeof item.value === "string",
      )
      .map((item) => ({ label: item.label, value: item.value }));
  } catch {
    return [];
  }
}

export function parseBulletPointsJson(
  raw: string | null | undefined,
): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  } catch {
    return [];
  }
}

/** Format formularza: "Etykieta | Wartość" w każdej linii. */
export function metaFromFormText(text: string | undefined): ProjectMetaItem[] {
  if (!text?.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf("|");
      if (sep === -1) return { label: line, value: "" };
      return {
        label: line.slice(0, sep).trim(),
        value: line.slice(sep + 1).trim(),
      };
    })
    .filter((m) => m.label.length > 0);
}

export function metaToFormText(meta: ProjectMetaItem[]): string {
  return meta.map((m) => `${m.label} | ${m.value}`).join("\n");
}

export function bulletPointsFromFormText(text: string | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function bulletPointsToFormText(points: string[]): string {
  return points.join("\n");
}

export async function ensureProjectsSeeded(): Promise<void> {
  const existing = await db.select({ id: projects.id }).from(projects).limit(1);
  if (existing.length > 0) return;

  await Promise.all(
    DEFAULT_PROJECTS.map((project, index) =>
      db.insert(projects).values({
        title: project.title,
        description: project.opis,
        bulletPoints: project.punkty?.length
          ? JSON.stringify(project.punkty)
          : null,
        extraDescription: project.dodatkowyOpis ?? null,
        fundingNote: project.finansowanie ?? null,
        meta: JSON.stringify(project.meta ?? []),
        color: project.color,
        textColor: project.textColor ?? "white",
        metaTitle: project.metaTitle ?? "Dofinansowanie",
        logoUrl: project.logo ?? null,
        logoAlt: project.logoAlt ?? null,
        logoClass: project.logoClass ?? null,
        logoPosition: project.logoPosition ?? null,
        logoPdfUrl: project.logoPdf ?? null,
        link: project.link ?? null,
        linkLabel: project.linkLabel ?? null,
        sortOrder: index,
      }),
    ),
  );
}

export async function getProjects(): Promise<ProjectCard[]> {
  return getCachedContent(CONTENT_CACHE_KEYS.projects, loadProjectsFromDb);
}

export async function refreshProjectsCache(): Promise<ProjectCard[]> {
  return refreshCachedContent(CONTENT_CACHE_KEYS.projects, loadProjectsFromDb);
}

async function loadProjectsFromDb(): Promise<ProjectCard[]> {
  await ensureProjectsSeeded();
  const rows = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.sortOrder), asc(projects.createdAt));

  return rows.map((row) => ({
    title: row.title,
    opis: row.description,
    punkty: parseBulletPointsJson(row.bulletPoints),
    dodatkowyOpis: row.extraDescription ?? undefined,
    finansowanie: row.fundingNote ?? undefined,
    meta: parseMetaJson(row.meta),
    color: row.color as ProjectCard["color"],
    textColor: (row.textColor === "black" ? "black" : "white") as
      | "white"
      | "black",
    metaTitle: row.metaTitle || "Dofinansowanie",
    logo: row.logoUrl ?? undefined,
    logoAlt: row.logoAlt ?? undefined,
    logoClass: row.logoClass ?? undefined,
    logoPosition: row.logoPosition ?? undefined,
    logoPdf: row.logoPdfUrl ?? undefined,
    link: row.link || null,
    linkLabel: row.linkLabel ?? undefined,
  }));
}
