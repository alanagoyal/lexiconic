"use client";

import { useState, useEffect, useDeferredValue } from "react";
import { SearchFilter } from "@/components/search-filter";
import { WordsList } from "@/components/words-list";
import { LexiconicHeader } from "@/components/header";
import {
  searchWordsBySimilarity,
  type WordWithEmbedding,
} from "@/lib/semantic-search";
import dynamic from "next/dynamic";
import { WordDetailDialog } from "@/components/word-detail-dialog";
import useSWR from "swr";
import { useRouter } from "next/navigation";

const MapView = dynamic(
  () =>
    import("@/components/map-view").then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-120px)] relative bg-muted/20 flex flex-col items-center justify-center">
        <div className="text-muted-foreground text-sm mb-6 font-playfair uppercase tracking-wider">
          Loading Map
        </div>
        <div className="w-64 h-px bg-border relative overflow-hidden">
          <div
            className="absolute inset-0 bg-foreground origin-left animate-pulse"
            style={{
              animation: "progress-bar 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    ),
  }
);

export interface WordData {
  word: string;
  native_script: string;
  language: string;
  family: string;
  category: string;
  definition: string;
  literal: string;
  usage_notes: string;
  english_approx: string;
  sources: string;
  pronunciation: string;
  phonetic: string;
  embedding: number[];
  embeddingHash: string;
}

interface WordsClientProps {
  words: WordWithEmbedding[];
  initialViewMode: "list" | "map" | "grid";
  initialSortMode: "none" | "asc" | "desc" | "random";
  initialSeed: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type SortMode = "none" | "asc" | "desc" | "random";

function seededRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

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
      if (seed) {
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

export function WordsClient({
  words,
  initialViewMode,
  initialSortMode,
  initialSeed,
}: WordsClientProps) {
  const router = useRouter();

  const [viewMode, setViewMode] = useState(initialViewMode);
  const [sortMode, setSortMode] = useState(initialSortMode);
  const [seed, setSeed] = useState(initialSeed);

  // Load embeddings in the background with SWR
  const { data: wordsWithEmbeddings } = useSWR<WordWithEmbedding[]>(
    "/lexiconic/api/words-with-embeddings",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Use words with embeddings if available, otherwise use initial words
  const activeWords = wordsWithEmbeddings || words;

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [displayedWords, setDisplayedWords] = useState<WordWithEmbedding[]>(words);
  const [isSearching, setIsSearching] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordWithEmbedding | null>(null);

  // Initialize URL params on mount if seed is not in URL
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has('seed') && initialSeed) {
      const params = new URLSearchParams();
      params.set('view', initialViewMode);
      params.set('sort', initialSortMode);
      params.set('seed', initialSeed);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, []);

  // Perform keyword search
  const performKeywordSearch = (query: string): WordWithEmbedding[] => {
    const searchLower = query.toLowerCase();
    return activeWords.filter(
      (word) =>
        word.word.toLowerCase().includes(searchLower) ||
        word.native_script.toLowerCase().includes(searchLower) ||
        word.definition.toLowerCase().includes(searchLower) ||
        word.language.toLowerCase().includes(searchLower) ||
        word.phonetic.toLowerCase().includes(searchLower) ||
        (word.english_approx &&
          word.english_approx.toLowerCase().includes(searchLower)) ||
        (word.literal && word.literal.toLowerCase().includes(searchLower))
    );
  };

  // Perform semantic search
  const performSemanticSearch = async (
    query: string
  ): Promise<WordWithEmbedding[]> => {
    try {
      const response = await fetch("/lexiconic/api/search-embedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Search API failed");

      const { embedding } = await response.json();
      const semanticResults = searchWordsBySimilarity(
        activeWords,
        embedding,
        0.25,
        30
      );
      const keywordResults = performKeywordSearch(query);

      // Combine results (semantic first, then keyword)
      const combined = [...semanticResults];
      keywordResults.forEach((kwResult) => {
        if (!combined.some((semResult) => semResult.word === kwResult.word)) {
          combined.push(kwResult);
        }
      });

      return combined;
    } catch (error) {
      console.error("Semantic search failed, using keyword only:", error);
      return performKeywordSearch(query);
    }
  };

  // Simple search effect with debouncing
  useEffect(() => {
    if (!deferredSearchTerm.trim()) {
      setIsSearching(false);
      setDisplayedWords(words);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await performSemanticSearch(deferredSearchTerm);
        // Apply current sort mode to search results
        const sortedResults = sortWords(results, sortMode);
        setDisplayedWords(sortedResults);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [deferredSearchTerm, activeWords, sortMode, words]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleClear = () => {
    setSearchTerm("");
  };

  const handleRowExpand = (wordId: string) => {
    setExpandedRowId(expandedRowId === wordId ? null : wordId);
  };

  const updateURLParams = (updates: {
    view?: string;
    sort?: string;
    seed?: string;
  }) => {
    const params = new URLSearchParams();
    params.set("view", updates.view || viewMode);
    params.set("sort", updates.sort || sortMode);
    params.set("seed", updates.seed || seed);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleSortModeChange = (newSortMode: SortMode) => {
    if (newSortMode === "none") {
      setSortMode("asc");
      updateURLParams({ sort: "asc" });
      return;
    }

    // Don't allow shuffle animation if already shuffling
    if (newSortMode === "random" && isShuffling) return;

    setSortMode(newSortMode);

    // Only do shuffle animation for random mode
    if (newSortMode === "random") {
      const currentScrollY = window.scrollY;
      setIsShuffling(true);

      // Generate new seed for new random order
      const newSeed = Date.now().toString();
      setSeed(newSeed);

      const shuffleInterval = setInterval(() => {
        const tempShuffled = sortWords(displayedWords, "random");
        setDisplayedWords(tempShuffled);
        window.scrollTo(0, currentScrollY);
      }, 100);

      setTimeout(() => {
        clearInterval(shuffleInterval);
        // Set final seeded order
        const finalOrder = sortWords(displayedWords, "random", newSeed);
        setDisplayedWords(finalOrder);
        setIsShuffling(false);
        window.scrollTo(0, currentScrollY);
        // Update URL after shuffle animation completes
        updateURLParams({ sort: "random", seed: newSeed });
      }, 1000);
    } else {
      updateURLParams({ sort: newSortMode });
    }
  };

  const handleViewModeChange = (newViewMode: "list" | "map" | "grid") => {
    setViewMode(newViewMode);
    updateURLParams({ view: newViewMode });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header and Search - sticky together */}
      <div className="sticky top-0 z-10 bg-background">
        <LexiconicHeader
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          sortMode={sortMode}
          onSortModeChange={handleSortModeChange}
          isShuffling={isShuffling}
        />

        {/* Search - full width */}
        <div className="border-b border-border bg-background">
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onClear={handleClear}
            totalWords={words.length}
            filteredCount={displayedWords.length}
            isSearching={isSearching}
          />
        </div>
      </div>

      {/* Content - either list, grid, or map view */}
      <main className="min-h-[calc(100vh-120px)] pb-16">
        {viewMode === "map" ? (
          <MapView
            words={displayedWords}
            onWordClick={(word) => setSelectedWord(word)}
          />
        ) : (
          <WordsList
            words={displayedWords}
            viewMode={viewMode}
            expandedRowId={expandedRowId}
            onToggleExpand={handleRowExpand}
          />
        )}
      </main>

      {/* Word detail dialog for map view */}
      <WordDetailDialog
        word={selectedWord}
        open={selectedWord !== null}
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
}
