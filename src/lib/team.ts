import { asc } from "drizzle-orm";
import { db } from "../db";
import { teamMembers } from "../db/schema";
import { TEAM, type TeamMember } from "../data/site";
import {
  CONTENT_CACHE_KEYS,
  getCachedContent,
  refreshCachedContent,
} from "./content-cache";

/** Wstawia domyślne kafelki z site.ts, gdy tabela jest pusta. */
export async function ensureTeamSeeded(): Promise<void> {
  const existing = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .limit(1);
  if (existing.length > 0) return;

  await Promise.all(
    TEAM.map((member, index) =>
      db.insert(teamMembers).values({
        slug: member.slug,
        name: member.name,
        description: member.desc,
        photoUrl: member.photo ?? null,
        photoPosition: member.photoPosition ?? null,
        accent: member.accent,
        sortOrder: index,
      }),
    ),
  );
}

async function loadTeamFromDb(): Promise<TeamMember[]> {
  await ensureTeamSeeded();
  const rows = await db
    .select()
    .from(teamMembers)
    .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.createdAt));

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    desc: row.description,
    photo: row.photoUrl ?? undefined,
    photoPosition: row.photoPosition ?? undefined,
    accent: row.accent as TeamMember["accent"],
  }));
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return getCachedContent(CONTENT_CACHE_KEYS.team, loadTeamFromDb);
}

export async function refreshTeamCache(): Promise<TeamMember[]> {
  return refreshCachedContent(CONTENT_CACHE_KEYS.team, loadTeamFromDb);
}

export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
