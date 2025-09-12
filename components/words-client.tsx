"use client"

import { useState, useEffect } from "react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [displayedWords, setDisplayedWords] = useState<WordWithEmbedding[]>(words)

  // Generate search embedding and perform hybrid search
  const performSearch = async (query: string) => {
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
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])


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
            onSearchChange={setSearchTerm}
            totalWords={words.length}
            filteredCount={displayedWords.length}
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

