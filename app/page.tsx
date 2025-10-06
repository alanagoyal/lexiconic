import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { Footer } from "@/components/footer";
import { loadWords } from "@/lib/load-words";
import type { WordWithEmbedding } from "@/lib/semantic-search";

type SortMode = "none" | "asc" | "desc" | "random";

function sortWords(
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
      // Use seeded random for consistent randomization
      if (seed) {
        const seededRandom = (str: string) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          return Math.abs(hash) / 2147483647;
        };
        return sorted.sort((a, b) => {
          const hashA = seededRandom(seed + a.word);
          const hashB = seededRandom(seed + b.word);
          return hashA - hashB;
        });
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
  searchParams: { view?: string; sort?: string; seed?: string };
}) {
  const words = await loadWords();

  // Parse URL params server-side
  const viewMode = (searchParams.view as "list" | "map" | "grid") || "list";
  const sortMode = (searchParams.sort as SortMode) || "random";

  // Only generate seed if not provided and sort is random
  const seed = searchParams.seed || (sortMode === "random" ? Date.now().toString() : "");

  // Apply sorting server-side
  const sortedWords = sortWords(words, sortMode, sortMode === "random" ? seed : undefined);

  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center"></div>
        }
      >
        <WordsClient
          words={sortedWords}
          initialViewMode={viewMode}
          initialSortMode={sortMode}
          initialSeed={seed}
        />
      </Suspense>
      <Footer />
    </div>
  );
}
