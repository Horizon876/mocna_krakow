/**
 * Po mutacji treści w panelu: odświeża lokalny snapshot i (w prod) ISR.
 */
import { refreshCafeCache } from "./cafe-gallery";
import { refreshHomepageCache } from "./homepage-photos";
import { refreshMediaCache } from "./media-logos";
import { refreshProjectsCache } from "./projects";
import {
  revalidateCafePage,
  revalidateHomePage,
  revalidateProjectsPage,
  revalidateTeamPage,
} from "./revalidate-pages";
import { refreshTeamCache } from "./team";

export type ContentKind = "team" | "projects" | "cafe" | "media" | "home";

export async function publishContentChange(
  kind: ContentKind,
  requestUrl: string | URL,
): Promise<void> {
  try {
    if (kind === "team") await refreshTeamCache();
    else if (kind === "projects") await refreshProjectsCache();
    else if (kind === "media") await refreshMediaCache();
    else if (kind === "home") await refreshHomepageCache();
    else await refreshCafeCache();
  } catch (error) {
    console.error(`[publishContentChange] refresh ${kind}:`, error);
  }

  try {
    const origin = new URL(requestUrl).origin;
    if (kind === "team") await revalidateTeamPage(origin);
    else if (kind === "projects") await revalidateProjectsPage(origin);
    else if (kind === "media" || kind === "home") await revalidateHomePage(origin);
    else await revalidateCafePage(origin);
  } catch (error) {
    console.error(`[publishContentChange] revalidate ${kind}:`, error);
  }
}
