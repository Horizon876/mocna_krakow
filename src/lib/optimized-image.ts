const RASTER_EXT = /\.(jpe?g|png|webp)$/i;

export type OptimizedVariant = {
  width: number;
  src: string;
};

function publicRelPath(src: string): string {
  return src.replace(/^\//, "").replace(/\\/g, "/");
}

function stemFromPublic(src: string): string {
  return publicRelPath(src).replace(/\.[^.]+$/, "");
}

/** Czy mamy wygenerowane warianty WebP w public/_optimized/ */
export function isOptimizableImage(src: string): boolean {
  return RASTER_EXT.test(src) && !src.startsWith("/_optimized/");
}

export function optimizedVariants(src: string, widths: number[]): OptimizedVariant[] {
  if (!isOptimizableImage(src)) {
    return [];
  }
  const stem = stemFromPublic(src);
  return widths.map((width) => ({
    width,
    src: `/_optimized/${stem}-${width}.webp`,
  }));
}

export function optimizedSrcset(variants: OptimizedVariant[]): string {
  return variants.map((v) => `${v.src} ${v.width}w`).join(", ");
}

export function pickFallbackSrc(src: string, variants: OptimizedVariant[]): string {
  if (variants.length === 0) return src;
  return variants[variants.length - 1]?.src ?? src;
}

/** Logo w sekcji mediów — max ~176px (2x: 352) */
export const LOGO_IMAGE_WIDTHS = [128, 256] as const;
export const LOGO_IMAGE_SIZES = "(max-width: 640px) 98px, (max-width: 1024px) 130px, 176px";

/** Zdjęcia editorial / hero */
export const PHOTO_IMAGE_WIDTHS = [480, 960, 1440] as const;
export const BENTO_PHOTO_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 660px";
export const HERO_PHOTO_SIZES = "(max-width: 1024px) 0px, 1005px";
