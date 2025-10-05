import type { WordWithEmbedding } from "@/lib/semantic-search";
import { createHash } from "crypto";

export type SortMode = "none" | "asc" | "desc" | "random";

// Deterministic random sort based on a seed
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

export function sortWords(
  words: WordWithEmbedding[],
  mode: SortMode,
  seed?: string
): WordWithEmbedding[] {
  const sorted = [...words];

  switch (mode) {
    case "asc":
      return sorted.sort((a, b) => a.word.localeCompare(b.word));
    case "desc":
      return sorted.sort((a, b) => b.word.localeCompare(a.word));
    case "random":
      if (seed) {
        // Deterministic shuffle for server-side rendering
        const random = seededRandom(seed);
        return sorted.sort(() => random() - 0.5);
      } else {
        // Client-side random shuffle
        return sorted.sort(() => Math.random() - 0.5);
      }
    case "none":
    default:
      return sorted;
  }
}

// Generate a random seed for server-side random sorting
export function generateRandomSeed(): string {
  return createHash("sha256")
    .update(Math.random().toString())
    .digest("hex")
    .substring(0, 16);
}
