import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { loadWords } from "@/lib/load-words";
import type { WordWithEmbedding } from "@/lib/semantic-search";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
  searchParams: Promise<{ view?: string; sort?: string; seed?: string; q?: string }>;
}) {
  const words = await loadWords();

  // Await searchParams before accessing its properties
  const params = await searchParams;

  // Detect mobile from user-agent header
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Parse URL params server-side
  let viewMode = (params.view as "list" | "map" | "grid") || "list";
  const sortMode = (params.sort as SortMode) || "random";
  const searchQuery = params.q || "";

  // Redirect to list view if mobile and trying to access grid or map view
  if (isMobile && (viewMode === "grid" || viewMode === "map")) {
    const newParams = new URLSearchParams();
    newParams.set("view", "list");
    if (params.sort) newParams.set("sort", params.sort);
    if (params.seed) newParams.set("seed", params.seed);
    if (params.q) newParams.set("q", params.q);
    redirect(`/?${newParams.toString()}`);
  }

  // Only generate seed if not provided and sort is random
  const seed = params.seed || (sortMode === "random" ? Date.now().toString() : "");

  // Apply sorting server-side
  const sortedWords = sortWords(words, sortMode, sortMode === "random" ? seed : undefined);

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
        initialSeed={seed}
        initialSearchQuery={searchQuery}
      />
    </Suspense>
  );
}
