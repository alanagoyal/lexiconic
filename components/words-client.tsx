"use client";

import { useState, useEffect, useDeferredValue, Suspense } from "react";
import { SearchFilter } from "@/components/search-filter";
import { WordRow } from "@/components/word-row";
import { LexiconicHeader } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  searchWordsBySimilarity,
  type WordWithEmbedding,
} from "@/lib/semantic-search";
import dynamic from "next/dynamic";
import { WordDetailDialog } from "@/components/word-detail-dialog";
import useSWR from "swr";

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
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function WordsClient({ words }: WordsClientProps) {
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
  const [viewMode, setViewMode] = useState<"list" | "map" | "grid">("list");
  const [sortMode, setSortMode] = useState<"none" | "asc" | "desc" | "random">("random");

  // Helper function to sort words based on mode
  const sortWords = (wordsToSort: WordWithEmbedding[], mode: "none" | "asc" | "desc" | "random"): WordWithEmbedding[] => {
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
  };

  const [displayedWords, setDisplayedWords] = useState<WordWithEmbedding[]>(() => {
    return sortWords(words, "random");
  });

  const [randomOrder, setRandomOrder] = useState<WordWithEmbedding[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordWithEmbedding | null>(
    null
  );
  const [isMounted, setIsMounted] = useState(false);

  // Track mounted state
  useEffect(() => {
    setIsMounted(true);
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
      // Reset to words with current sort mode
      let sortedWords: WordWithEmbedding[];

      if (sortMode === "random") {
        // Use stored random order if available, otherwise create new one
        if (randomOrder.length > 0 && randomOrder.length === activeWords.length) {
          sortedWords = [...randomOrder];
        } else {
          sortedWords = sortWords(activeWords, "random");
          setRandomOrder([...sortedWords]);
        }
      } else {
        sortedWords = sortWords(activeWords, sortMode);
      }

      setDisplayedWords(sortedWords);
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
  }, [deferredSearchTerm, activeWords, sortMode, randomOrder]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleClear = () => {
    setSearchTerm("");
  };

  const handleRowExpand = (wordId: string) => {
    setExpandedRowId(expandedRowId === wordId ? null : wordId);
  };

  const handleSortModeChange = (
    newSortMode: "none" | "asc" | "desc" | "random"
  ) => {
    if (newSortMode === "none") {
      // Reset to ascending sort (default state)
      setSortMode("asc");
      const sorted = sortWords(displayedWords, "asc");
      setDisplayedWords(sorted);
      setRandomOrder([]);
      return;
    }

    setSortMode(newSortMode);

    if (newSortMode === "asc" || newSortMode === "desc") {
      const sorted = sortWords(displayedWords, newSortMode);
      setDisplayedWords(sorted);
      setRandomOrder([]);
    } else if (newSortMode === "random") {
      if (isShuffling) return;

      // Store current scroll position before starting shuffle animation
      const currentScrollY = window.scrollY;

      setIsShuffling(true);
      const originalWords = [...displayedWords];
      const finalShuffled = sortWords(displayedWords, "random");

      // Shuffle animation: rapidly change order for 1 second
      const shuffleInterval = setInterval(() => {
        const tempShuffled = sortWords(originalWords, "random");
        setDisplayedWords(tempShuffled);
        // Maintain scroll position during animation
        window.scrollTo(0, currentScrollY);
      }, 100);

      // After 1 second, settle on the final random order
      setTimeout(() => {
        clearInterval(shuffleInterval);
        setDisplayedWords(finalShuffled);
        setRandomOrder([...finalShuffled]);
        setIsShuffling(false);
        // Restore scroll position after final shuffle
        window.scrollTo(0, currentScrollY);
      }, 1000);
    }
  };

  const handleViewModeChange = (newViewMode: "list" | "map" | "grid") => {
    setViewMode(newViewMode);
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

      {/* Content - either list or map view */}
      <main className="min-h-[calc(100vh-120px)] pb-16">
        {!isMounted ? (
          <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center"></div>
        ) : viewMode === "list" ? (
          displayedWords.length > 0 ? (
            <div>
              {displayedWords.map((word, index) => {
                const wordId = `${word.word}-${index}`;
                return (
                  <div
                    key={wordId}
                    className="virtualized-item"
                  >
                    <WordRow
                      word={word}
                      isExpanded={expandedRowId === wordId}
                      onToggleExpand={() => handleRowExpand(wordId)}
                      viewMode="list"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="text-muted-foreground text-sm">
                No words found
              </div>
              <div className="text-muted-foreground text-xs mt-2">
                Try adjusting your search terms or filters
              </div>
            </div>
          )
        ) : viewMode === "grid" ? (
          displayedWords.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-border">
                {displayedWords.map((word, index) => {
                  const wordId = `${word.word}-${index}`;
                  return (
                    <div
                      key={wordId}
                      className="word-grid-item"
                    >
                      <WordRow
                        word={word}
                        isExpanded={expandedRowId === wordId}
                        onToggleExpand={() => handleRowExpand(wordId)}
                        viewMode="grid"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="text-muted-foreground text-sm">
                No words found
              </div>
              <div className="text-muted-foreground text-xs mt-2">
                Try adjusting your search terms or filters
              </div>
            </div>
          )
        ) : viewMode === "map" ? (
          <MapView
            words={displayedWords}
            onWordClick={(word) => setSelectedWord(word)}
          />
        ) : null}
      </main>

      {/* Word detail dialog for map view */}
      <WordDetailDialog
        word={selectedWord}
        open={selectedWord !== null}
        onClose={() => setSelectedWord(null)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
