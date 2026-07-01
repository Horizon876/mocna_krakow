export type MotionTier = "full" | "lite" | "reduced";


export function getMotionTier(): MotionTier {
  if (typeof document === "undefined") return "full";
  const tier = document.documentElement.dataset.motion;
  if (tier === "lite" || tier === "reduced") return tier;
  return "full";
}


export function isMotionLite(): boolean {
  const tier = getMotionTier();
  return tier === "lite" || tier === "reduced";
}
