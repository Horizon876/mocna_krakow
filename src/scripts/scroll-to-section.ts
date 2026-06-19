import { HOME_SECTION_SCROLL } from "@data/site";

export function getNavOffset(): number {
  return window.matchMedia("(min-width: 640px)").matches ? 72 : 64;
}

function getSectionExtraOffset(id: string): number {
  const match = Object.values(HOME_SECTION_SCROLL).find((s) => s.id === id);
  return match?.extraOffset ?? 0;
}

export function scrollToSectionEl(
  el: HTMLElement,
  extraOffset = 0,
  behavior: ScrollBehavior = "smooth",
) {
  const top =
    el.getBoundingClientRect().top +
    window.scrollY -
    getNavOffset() +
    extraOffset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

export function scrollToSectionFromHash(behavior: ScrollBehavior = "smooth") {
  const id = window.location.hash.slice(1);
  if (!id) return;

  const el = document.getElementById(id);
  if (!el) return;

  requestAnimationFrame(() => {
    scrollToSectionEl(el, getSectionExtraOffset(id), behavior);
  });
}

function getHomeSectionIdFromHref(href: string | null): string | null {
  if (!href) return null;
  for (const section of Object.values(HOME_SECTION_SCROLL)) {
    const hash = `#${section.id}`;
    if (href === `/${hash}` || href === hash) return section.id;
  }
  return null;
}

function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

/** Na stronie głównej przejmuje klik — bez domyślnego scrolla, który zostawia hero. */
function handleInPageSectionClick(event: MouseEvent) {
  const anchor = (event.target as Element | null)?.closest("a");
  if (!anchor) return;

  const sectionId = getHomeSectionIdFromHref(anchor.getAttribute("href"));
  if (!sectionId || normalizePath(window.location.pathname) !== "/") return;

  event.preventDefault();

  const hash = `#${sectionId}`;
  if (window.location.hash !== hash) {
    history.pushState(null, "", hash);
  }

  const el = document.getElementById(sectionId);
  if (el) scrollToSectionEl(el, getSectionExtraOffset(sectionId));
}

let bound = false;

export function initSectionScroll() {
  scrollToSectionFromHash("instant");

  if (bound) return;
  bound = true;

  document.addEventListener("click", handleInPageSectionClick);
  window.addEventListener("hashchange", () =>
    scrollToSectionFromHash("smooth"),
  );
}
