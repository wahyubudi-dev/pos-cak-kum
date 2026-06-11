export function popularityToLoveTier(popularity: number): 0 | 1 | 2 | 3 {
  if (popularity >= 15) return 3;
  if (popularity >= 5) return 2;
  if (popularity >= 1) return 1;
  return 0;
}
