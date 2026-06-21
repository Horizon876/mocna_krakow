export type MotionTier = "full" | "lite" | "reduced";

export function detectMotionTier(): MotionTier {
  if (typeof window === "undefined") return "full";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
    mozConnection?: { saveData?: boolean; effectiveType?: string };
    webkitConnection?: { saveData?: boolean; effectiveType?: string };
  };

  const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  const saveData = conn?.saveData === true;
  const slowNet = /^(slow-2g|2g)$/.test(conn?.effectiveType ?? "");
  const lowMem =
    typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCpu = (nav.hardwareConcurrency || 8) <= 4;
  const narrow = window.matchMedia("(max-width: 768px)").matches;

  if (saveData || slowNet || lowMem || (narrow && lowCpu)) {
    return "lite";
  }

  return "full";
}

export function applyMotionTier(tier?: MotionTier): MotionTier {
  const resolved = tier ?? detectMotionTier();
  document.documentElement.dataset.motion = resolved;
  return resolved;
}

export function getMotionTier(): MotionTier {
  if (typeof document === "undefined") return "full";
  const tier = document.documentElement.dataset.motion;
  if (tier === "lite" || tier === "reduced") return tier;
  return "full";
}

export function isMotionReduced(): boolean {
  return getMotionTier() === "reduced";
}

export function isMotionLite(): boolean {
  const tier = getMotionTier();
  return tier === "lite" || tier === "reduced";
}
