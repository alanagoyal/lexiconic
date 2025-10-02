"use client"

import { useState, useEffect, useDeferredValue, Suspense } from "react"
import { SearchFilter } from "@/components/search-filter"
import { WordRow } from "@/components/word-row"
import { Button } from "@/components/ui/button"
import { Shuffle, ArrowUpAZ, ArrowDownZA, List, Map as MapIcon } from "lucide-react"
import {
  searchWordsBySimilarity,
  type WordWithEmbedding
} from "@/lib/semantic-search"
import dynamic from "next/dynamic"
import { WordDetailDialog } from "@/components/word-detail-dialog"

const MapView = dynamic(() => import("@/components/map-view").then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center">Loading map...</div>
})

export interface WordData {
  word: string
  native_script: string
  language: string
  family: string
  category: string
  definition: string
  literal: string
  usage_notes: string
  english_approx: string
  sources: string
  pronunciation: string
  phonetic: string
  embedding: number[]
  embeddingHash: string
}


interface WordsClientProps {
  words: WordWithEmbedding[]
}

export function WordsClient({ words }: WordsClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [displayedWords, setDisplayedWords] = useState<WordWithEmbedding[]>(words)
  const [isSearching, setIsSearching] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [selectedWord, setSelectedWord] = useState<WordWithEmbedding | null>(null)

  // Perform keyword search
  const performKeywordSearch = (query: string): WordWithEmbedding[] => {
    const searchLower = query.toLowerCase()
    return words.filter((word) => 
      word.word.toLowerCase().includes(searchLower) ||
      word.native_script.toLowerCase().includes(searchLower) ||
      word.definition.toLowerCase().includes(searchLower) ||
      word.language.toLowerCase().includes(searchLower) ||
      word.phonetic.toLowerCase().includes(searchLower) ||
      (word.english_approx && word.english_approx.toLowerCase().includes(searchLower)) ||
      (word.literal && word.literal.toLowerCase().includes(searchLower))
    )
  }

  // Perform semantic search
  const performSemanticSearch = async (query: string): Promise<WordWithEmbedding[]> => {
    try {
      const response = await fetch('/lexiconic/api/search-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) throw new Error('Search API failed')

      const { embedding } = await response.json()
      const semanticResults = searchWordsBySimilarity(words, embedding, 0.25, 30)
      const keywordResults = performKeywordSearch(query)

      // Combine results (semantic first, then keyword)
      const combined = [...semanticResults]
      keywordResults.forEach(kwResult => {
        if (!combined.some(semResult => semResult.word === kwResult.word)) {
          combined.push(kwResult)
        }
      })

      return combined
    } catch (error) {
      console.error('Semantic search failed, using keyword only:', error)
      return performKeywordSearch(query)
    }
  }

  // Simple search effect with debouncing
  useEffect(() => {
    if (!deferredSearchTerm.trim()) {
      setIsSearching(false)
      setDisplayedWords(words)
      return
    }

    setIsSearching(true)

    const timeoutId = setTimeout(async () => {
      try {
        const results = await performSemanticSearch(deferredSearchTerm)
        setDisplayedWords(results)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [deferredSearchTerm, words])

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
  }

  const handleClear = () => {
    setSearchTerm("")
  }


  const handleRowExpand = (wordId: string) => {
    setExpandedRowId(expandedRowId === wordId ? null : wordId)
  }

  const handleRandomize = () => {
    if (isShuffling) return

    setIsShuffling(true)
    const originalWords = [...displayedWords]
    const finalShuffled = [...displayedWords].sort(() => Math.random() - 0.5)

    // Shuffle animation: rapidly change order for 1 second
    const shuffleInterval = setInterval(() => {
      const tempShuffled = [...originalWords].sort(() => Math.random() - 0.5)
      setDisplayedWords(tempShuffled)
    }, 100) // Shuffle every 100ms for a fast animation

    // After 1 second, settle on the final random order
    setTimeout(() => {
      clearInterval(shuffleInterval)
      setDisplayedWords(finalShuffled)
      setIsShuffling(false)
    }, 1000)
  }

  const handleSortAscending = () => {
    const sorted = [...displayedWords].sort((a, b) => a.word.localeCompare(b.word))
    setDisplayedWords(sorted)
  }

  const handleSortDescending = () => {
    const sorted = [...displayedWords].sort((a, b) => b.word.localeCompare(a.word))
    setDisplayedWords(sorted)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header and Search - sticky together */}
      <div className="sticky top-0 z-10 bg-background">
        <header className="border-b border-border bg-background">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h1 className="monuments-title text-2xl font-bold text-foreground font-playfair">
                LEXICONIC
              </h1>
              <div className="flex items-center gap-2">
                {/* Sorting buttons - only show in list view */}
                {viewMode === "list" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRandomize}
                      title="Randomize order"
                      aria-label="Randomize order"
                      disabled={isShuffling}
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSortAscending}
                      title="Sort A-Z"
                      aria-label="Sort A-Z"
                    >
                      <ArrowUpAZ className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSortDescending}
                      title="Sort Z-A"
                      aria-label="Sort Z-A"
                    >
                      <ArrowDownZA className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* View toggle buttons - always on the right, hidden on mobile */}
                <div className="hidden md:flex items-center gap-1 border border-border rounded-md p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    title="List view"
                    aria-label="List view"
                    className="h-7 w-7"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("map")}
                    title="Map view"
                    aria-label="Map view"
                    className="h-7 w-7"
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

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
      <main>
        {viewMode === "list" ? (
          displayedWords.length > 0 ? (
            <div>
              {displayedWords.map((word, index) => {
                const wordId = `${word.word}-${index}`
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
                )
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="text-muted-foreground text-sm">No words found</div>
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
      <footer className="bg-background">
        <div className="px-6 py-8 text-center">
          <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
            A digital exploration of linguistic untranslatability
          </div>
        </div>
      </footer>
    </div>
  )
}
