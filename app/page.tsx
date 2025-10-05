import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { loadWords } from "@/lib/load-words";
import type { WordWithEmbedding } from "@/lib/semantic-search";

// Helper function to sort words based on mode
function sortWords(
  wordsToSort: WordWithEmbedding[],
  mode: "none" | "asc" | "desc" | "random"
): WordWithEmbedding[] {
  const sorted = [...wordsToSort];
  switch (mode) {
    case "asc":
      return sorted.sort((a, b) => a.word.localeCompare(b.word));
    case "desc":
      return sorted.sort((a, b) => b.word.localeCompare(a.word));
    case "random":
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

  // Sort words server-side
  const sortedWords = sortWords(words, sortMode);

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
      />
    </Suspense>
  );
}
