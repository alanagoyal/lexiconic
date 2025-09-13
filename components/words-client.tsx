"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useQueryState, parseAsString } from "nuqs"
import { SearchFilter } from "@/components/search-filter"
import { WordRow } from "@/components/word-row"
import { 
  searchWordsBySimilarity,
  type WordWithEmbedding 
} from "@/lib/semantic-search"

export interface WordData {
  word: string
  native_script: string
  transliteration: string
  language: string
  family: string
  category: string
  definition: string
  literal: string
  usage_notes: string
  example_native: string
  example_gloss: string
  english_approx: string
  loanword_in_english: string
  disputed: string
  region: string
  closest_english_paraphrase: string
  sources: string
  needs_citation: string
}


interface WordsClientProps {
  words: WordWithEmbedding[]
}

export function WordsClient({ words }: WordsClientProps) {
  const [searchTerm, setSearchTerm] = useQueryState(
    "q",
    parseAsString.withDefault(""),
    { history: "push" }
  )
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [displayedWords, setDisplayedWords] = useState<WordWithEmbedding[]>(words)
  const [isSearching, setIsSearching] = useState(false)
  const searchIdRef = useRef(0)

  // Lightweight session cache: query -> indexes into `words`.
  // Prevent re-fetch/spinner on refresh for previously searched queries.
  const DATASET_VERSION = useMemo(() => {
    const first = words[0]
    const last = words[words.length - 1]
    return [
      words.length,
      first?.word ?? "",
      first?.language ?? "",
      last?.word ?? "",
      last?.language ?? "",
    ].join("|")
  }, [words])

  const CACHE_PREFIX = "bw:search:indexes:" as const

  const readCachedIndexes = (query: string): number[] | null => {
    try {
      if (typeof window === "undefined") return null
      const raw = sessionStorage.getItem(CACHE_PREFIX + query)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { v: number; dv: string; idx: number[] }
      if (!parsed || parsed.v !== 1 || parsed.dv !== DATASET_VERSION || !Array.isArray(parsed.idx)) {
        return null
      }
      return parsed.idx.filter((n) => Number.isInteger(n) && n >= 0 && n < words.length)
    } catch {
      return null
    }
  }

  const writeCachedIndexes = (query: string, indexes: number[]) => {
    try {
      if (typeof window === "undefined") return
      const payload = JSON.stringify({ v: 1, dv: DATASET_VERSION, idx: indexes })
      sessionStorage.setItem(CACHE_PREFIX + query, payload)
    } catch {
      // ignore storage errors
    }
  }

  // Generate search embedding and perform hybrid search
  const performSearch = async (query: string, id: number) => {
    if (!query) {
      setDisplayedWords(words)
      return
    }

    try {
      // Get embedding for search query
      const response = await fetch('/api/search-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const { embedding } = await response.json()
        
        // Semantic search with pre-computed embeddings
        const semanticResults = searchWordsBySimilarity(words, embedding, 0.15, 30)
        
        // Keyword search
        const keywordResults = words.filter((word) => {
          const searchLower = query.toLowerCase()
          return word.word.toLowerCase().includes(searchLower) ||
                 word.native_script.toLowerCase().includes(searchLower) ||
                 word.definition.toLowerCase().includes(searchLower) ||
                 word.language.toLowerCase().includes(searchLower) ||
                 (word.transliteration && word.transliteration.toLowerCase().includes(searchLower)) ||
                 (word.closest_english_paraphrase && word.closest_english_paraphrase.toLowerCase().includes(searchLower)) ||
                 (word.english_approx && word.english_approx.toLowerCase().includes(searchLower))
        })

        // Combine results (semantic first, then keyword)
        const combined = [...semanticResults]
        keywordResults.forEach(kwResult => {
          if (!combined.some(semResult => semResult.word === kwResult.word)) {
            combined.push(kwResult)
          }
        })

        if (searchIdRef.current === id) {
          setDisplayedWords(combined)
          // Cache compact index list so refresh shows results instantly
          const indexMap = new Map<WordWithEmbedding, number>()
          words.forEach((w, i) => indexMap.set(w, i))
          const indexes = combined
            .map((w) => indexMap.get(w))
            .filter((n): n is number => typeof n === "number")
          writeCachedIndexes(query, indexes)
        }
      } else {
        throw new Error('Search API failed')
      }
    } catch (error) {
      console.error('Semantic search failed, using keyword only:', error)
      
      // Fallback to keyword search
      const keywordResults = words.filter((word) => {
        const searchLower = query.toLowerCase()
        return word.word.toLowerCase().includes(searchLower) ||
               word.native_script.toLowerCase().includes(searchLower) ||
               word.definition.toLowerCase().includes(searchLower) ||
               word.language.toLowerCase().includes(searchLower) ||
               (word.transliteration && word.transliteration.toLowerCase().includes(searchLower)) ||
               (word.closest_english_paraphrase && word.closest_english_paraphrase.toLowerCase().includes(searchLower)) ||
               (word.english_approx && word.english_approx.toLowerCase().includes(searchLower))
      })
      if (searchIdRef.current === id) {
        setDisplayedWords(keywordResults)
        const indexMap = new Map<WordWithEmbedding, number>()
        words.forEach((w, i) => indexMap.set(w, i))
        const indexes = keywordResults
          .map((w) => indexMap.get(w))
          .filter((n): n is number => typeof n === "number")
        writeCachedIndexes(query, indexes)
      }
    } finally {
      if (searchIdRef.current === id) {
        setIsSearching(false)
      }
    }
  }

  // Debounced search
  useEffect(() => {
    // If search is cleared, immediately reset without loader
    if (!searchTerm) {
      setIsSearching(false)
      setDisplayedWords(words)
      return
    }

    // Use cached results immediately if available for this query
    const cached = readCachedIndexes(searchTerm)
    if (cached && cached.length > 0) {
      const resolved = cached.map((i) => words[i]).filter(Boolean)
      setDisplayedWords(resolved)
      setIsSearching(false)
      return
    }

    const timeoutId = setTimeout(() => {
      const id = ++searchIdRef.current
      setIsSearching(true)
      performSearch(searchTerm, id)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Show spinner immediately on input; cancel stale in-flight searches on clear
  const handleSearchChange = (term: string) => {
    const trimmed = term.trim()
    if (trimmed === "") {
      // Invalidate any in-flight searches so they can't update state
      searchIdRef.current += 1
      setIsSearching(false)
      setDisplayedWords(words)
    } else {
      setIsSearching(true)
    }
    setSearchTerm(term)
  }


  const handleRowExpand = (wordId: string) => {
    setExpandedRowId(expandedRowId === wordId ? null : wordId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header and Search - sticky together */}
      <div className="sticky top-0 z-10 bg-background">
        <header className="border-b border-border bg-background">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h1 className="monuments-title text-2xl font-bold text-foreground font-playfair">
                BETWEEN WORDS
              </h1>
            </div>
          </div>
        </header>

        {/* Search - full width */}
        <div className="border-b border-border bg-background">
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            totalWords={words.length}
            filteredCount={displayedWords.length}
            isSearching={isSearching}
          />
        </div>
      </div>

      {/* Words List - full width grid layout with lightweight virtualization */}
      <main>
        {displayedWords.length > 0 ? (
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
        )}
      </main>

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
