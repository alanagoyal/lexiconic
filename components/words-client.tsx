"use client";

import { useState, useEffect, useDeferredValue, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Initialize viewMode to "list" by default to match server rendering
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [displayedWords, setDisplayedWords] = useState<WordWithEmbedding[]>(
    () => {
      // Sort words alphabetically by default
      return [...words].sort((a, b) => a.word.localeCompare(b.word));
    }
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [sortMode, setSortMode] = useState<"none" | "asc" | "desc" | "random">(
    "asc"
  );
  const [selectedWord, setSelectedWord] = useState<WordWithEmbedding | null>(
    null
  );
  const [isMounted, setIsMounted] = useState(false);

  // Track mounted state and sync with URL changes
  useEffect(() => {
    setIsMounted(true);
    // Only read URL parameters after component has mounted to avoid hydration issues
    const viewParam = searchParams.get("view");
    if (viewParam === "map" || viewParam === "list") {
      setViewMode(viewParam);
    }
    
    // Read sort parameter from URL
    const sortParam = searchParams.get("sort");
    if (sortParam === "asc" || sortParam === "desc" || sortParam === "random" || sortParam === "none") {
      setSortMode(sortParam);
      
      // Apply the sort immediately if we have words
      if (activeWords.length > 0) {
        // Store current scroll position before applying sort
        const currentScrollY = window.scrollY;
        
        let sortedWords = [...activeWords];
        if (sortParam === "asc") {
          sortedWords.sort((a, b) => a.word.localeCompare(b.word));
        } else if (sortParam === "desc") {
          sortedWords.sort((a, b) => b.word.localeCompare(a.word));
        } else if (sortParam === "random") {
          sortedWords.sort(() => Math.random() - 0.5);
        }
        // For "none", keep the original order (which is already alphabetical)
        setDisplayedWords(sortedWords);
        
        // Restore scroll position after a brief delay to allow DOM to update
        setTimeout(() => {
          window.scrollTo(0, currentScrollY);
        }, 0);
      }
    }
  }, [searchParams, activeWords]);

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
      // Reset to words with current sort mode from URL
      const currentSortMode = searchParams.get("sort") || "asc";
      const currentScrollY = window.scrollY;
      let sortedWords = [...activeWords];
      
      if (currentSortMode === "asc") {
        sortedWords.sort((a, b) => a.word.localeCompare(b.word));
      } else if (currentSortMode === "desc") {
        sortedWords.sort((a, b) => b.word.localeCompare(a.word));
      } else if (currentSortMode === "random") {
        sortedWords.sort(() => Math.random() - 0.5);
      }
      
      setDisplayedWords(sortedWords);
      setSortMode(currentSortMode as "none" | "asc" | "desc" | "random");
      
      // Restore scroll position after clearing search
      if (currentSortMode === "random") {
        setTimeout(() => {
          window.scrollTo(0, currentScrollY);
        }, 0);
      }
      return;
    }

    setIsSearching(true);
    // Don't reset sort mode when performing search - preserve current setting

    const timeoutId = setTimeout(async () => {
      try {
        const results = await performSemanticSearch(deferredSearchTerm);
        // Apply current sort mode to search results
        const currentSortMode = searchParams.get("sort") || "asc";
        const currentScrollY = window.scrollY;
        let sortedResults = [...results];
        
        if (currentSortMode === "asc") {
          sortedResults.sort((a, b) => a.word.localeCompare(b.word));
        } else if (currentSortMode === "desc") {
          sortedResults.sort((a, b) => b.word.localeCompare(a.word));
        } else if (currentSortMode === "random") {
          sortedResults.sort(() => Math.random() - 0.5);
        }
        
        setDisplayedWords(sortedResults);
        
        // Restore scroll position after search with random sort
        if (currentSortMode === "random") {
          setTimeout(() => {
            window.scrollTo(0, currentScrollY);
          }, 0);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [deferredSearchTerm, activeWords, searchParams]);

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
    setSortMode(newSortMode);

    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (newSortMode === "none") {
      // For "none", we'll actually set to "asc" as the default
      params.set("sort", "asc");
    } else {
      params.set("sort", newSortMode);
    }
    router.replace(`?${params.toString()}`, { scroll: false });

    if (newSortMode === "none") {
      // Reset to ascending sort (default state)
      const sorted = [...displayedWords].sort((a, b) =>
        a.word.localeCompare(b.word)
      );
      setDisplayedWords(sorted);
      setSortMode("asc"); // Immediately set to asc since that's our default
      return;
    } else if (newSortMode === "asc") {
      const sorted = [...displayedWords].sort((a, b) =>
        a.word.localeCompare(b.word)
      );
      setDisplayedWords(sorted);
    } else if (newSortMode === "desc") {
      const sorted = [...displayedWords].sort((a, b) =>
        b.word.localeCompare(a.word)
      );
      setDisplayedWords(sorted);
    } else if (newSortMode === "random") {
      if (isShuffling) return;

      // Store current scroll position before starting shuffle animation
      const currentScrollY = window.scrollY;
      
      setIsShuffling(true);
      const originalWords = [...displayedWords];
      const finalShuffled = [...displayedWords].sort(() => Math.random() - 0.5);

      // Shuffle animation: rapidly change order for 1 second
      const shuffleInterval = setInterval(() => {
        const tempShuffled = [...originalWords].sort(() => Math.random() - 0.5);
        setDisplayedWords(tempShuffled);
        // Maintain scroll position during animation
        window.scrollTo(0, currentScrollY);
      }, 100); // Shuffle every 100ms for a fast animation

      // After 1 second, settle on the final random order and keep random mode active
      setTimeout(() => {
        clearInterval(shuffleInterval);
        setDisplayedWords(finalShuffled);
        setIsShuffling(false);
        // Restore scroll position after final shuffle
        window.scrollTo(0, currentScrollY);
        // sortMode is already set to "random" at the beginning of this function
      }, 1000);
    }
  };

  const handleViewModeChange = (newViewMode: "list" | "map") => {
    setViewMode(newViewMode);

    // Update URL without navigation or scroll
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newViewMode);
    router.replace(`?${params.toString()}`, { scroll: false });
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
      <main className="min-h-[calc(100vh-120px)]">
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
                    id={`word-${word.word}`}
                    className="virtualized-item"
                  >
                    <WordRow
                      word={word}
                      isExpanded={expandedRowId === wordId}
                      onToggleExpand={() => handleRowExpand(wordId)}
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
        ) : (
          <MapView
            words={displayedWords}
            onWordClick={(word) => setSelectedWord(word)}
          />
        )}
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
