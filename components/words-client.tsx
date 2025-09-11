"use client"

import { useState, useEffect, useDeferredValue, Suspense } from "react"
import { useQueryState, parseAsString } from 'nuqs'
import { VList } from 'virtua'
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
  // URL state management for search
  const [searchTerm, setSearchTerm] = useQueryState('q', parseAsString.withDefault(''))
  const deferredSearchTerm = useDeferredValue(searchTerm)
  
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [displayedWords, setDisplayedWords] = useState<WordWithEmbedding[]>(words)
  const [isSearching, setIsSearching] = useState(false)

  // Generate search embedding and perform hybrid search
  const performSearch = async (query: string) => {
    if (!query) {
      setDisplayedWords(words)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
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

        setDisplayedWords(combined)
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
      setDisplayedWords(keywordResults)
    } finally {
      setIsSearching(false)
    }
  }

  // Search with deferred value for performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(deferredSearchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [deferredSearchTerm])


  const handleRowExpand = (wordId: string) => {
    setExpandedRowId(expandedRowId === wordId ? null : wordId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-2 rounded z-50"
      >
        Skip to content
      </a>
      
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
            onSearchChange={setSearchTerm}
            totalWords={words.length}
            filteredCount={displayedWords.length}
            isSearching={isSearching}
          />
        </div>
      </div>

      {/* Words List - virtualized for performance */}
      <main id="main-content" role="main" aria-label="Words list">
        {/* Screen reader announcement for search results */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {isSearching && "Searching…"}
          {!isSearching && displayedWords.length > 0 && `Showing ${displayedWords.length} of ${words.length} words`}
          {!isSearching && displayedWords.length === 0 && searchTerm && "No words found"}
        </div>
        
        {displayedWords.length > 0 ? (
          // Use virtualization for lists > 100 items per agent.md guidelines
          displayedWords.length > 100 ? (
            <VList style={{ height: 'calc(100vh - 200px)' }} className="overflow-auto">
              {displayedWords.map((word, index) => {
                const wordId = `${word.word}-${index}`
                return (
                  <div key={wordId} className="virtualized-item">
                    <WordRow 
                      word={word} 
                      isExpanded={expandedRowId === wordId}
                      onToggleExpand={() => handleRowExpand(wordId)}
                    />
                  </div>
                )
              })}
            </VList>
          ) : (
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
          )
        ) : (
          <div className="p-16 text-center">
            <div className="text-muted-foreground text-sm">
              {searchTerm ? 'No words found' : 'No words available'}
            </div>
            {searchTerm && (
              <div className="text-muted-foreground text-xs mt-2">
                Try adjusting your search terms
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="px-6 py-8 text-center">
          <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
            A digital exploration of linguistic untranslatability
          </div>
        </div>
      </footer>
    </div>
  )
}

