import { WordsClient } from "@/components/words-client";
import { loadWords } from "@/lib/load-words";
import { sortWords, generateRandomSeed, type SortMode } from "@/lib/sort-words";

type ViewMode = "list" | "map" | "grid";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string; seed?: string }>;
}) {
  const words = await loadWords();
  const params = await searchParams;

  const viewMode = (params.view as ViewMode) || "list";
  const sortMode = (params.sort as SortMode) || "random";
  const seed = params.seed;

  // Generate a new seed for random sort if one doesn't exist
  const randomSeed = sortMode === "random" && !seed ? generateRandomSeed() : seed;

  // Sort words on the server
  const sortedWords = sortWords(words, sortMode, randomSeed);

  return (
    <WordsClient
      initialWords={sortedWords}
      initialViewMode={viewMode}
      initialSortMode={sortMode}
      initialSeed={randomSeed}
    />
  );
}
