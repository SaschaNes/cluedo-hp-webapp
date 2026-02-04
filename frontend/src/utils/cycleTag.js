/**
 * Backend erlaubt: null | "i" | "m" | "s"
 * Rotation:
 * null -> i -> m -> s (Popup) -> null
 */
export function cycleTag(tag) {
  if (!tag) return "i";
  if (tag === "i") return "m";
  if (tag === "m") return "s";
  return null;
}