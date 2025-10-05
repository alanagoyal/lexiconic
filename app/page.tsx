import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { loadWords } from "@/lib/load-words";
import type { WordWithEmbedding } from "@/lib/semantic-search";

// Seeded random number generator for consistent random order
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Helper function to sort words based on mode
function sortWords(
  wordsToSort: WordWithEmbedding[],
  mode: "none" | "asc" | "desc" | "random",
  seed?: number
): WordWithEmbedding[] {
  const sorted = [...wordsToSort];
  switch (mode) {
    case "asc":
      return sorted.sort((a, b) => a.word.localeCompare(b.word));
    case "desc":
      return sorted.sort((a, b) => b.word.localeCompare(a.word));
    case "random":
      if (seed !== undefined) {
        const random = seededRandom(seed);
        return sorted.sort(() => random() - 0.5);
      }
      return sorted.sort(() => Math.random() - 0.5);
    case "none":
    default:
      return sorted;
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const words = await loadWords();
  const params = await searchParams;

  // Parse URL params with defaults
  const viewMode = (params.view as "list" | "map" | "grid") || "list";
  const sortMode = (params.sort as "none" | "asc" | "desc" | "random") || "random";

  // Get or generate seed for random sorting
  const seed = params.seed ? parseInt(params.seed as string, 10) : Date.now();

  // Sort words server-side
  const sortedWords = sortWords(words, sortMode, seed);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center"></div>
      }
    >
      <WordsClient
        words={sortedWords}
        initialViewMode={viewMode}
        initialSortMode={sortMode}
        randomSeed={seed}
      />
    </Suspense>
  );
}
