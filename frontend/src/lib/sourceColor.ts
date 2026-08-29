export const SOURCE_COLORS = [
  { bg: "bg-marigold/15", text: "text-marigold-dark" },
  { bg: "bg-teal/15", text: "text-teal" },
  { bg: "bg-coral/15", text: "text-coral" },
  { bg: "bg-ink/10", text: "text-ink" },
];

/** Deterministically maps a source platform name to one of a fixed palette
 * so the same source always gets the same badge color across the app. */
export function sourceColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SOURCE_COLORS[hash % SOURCE_COLORS.length];
}
