"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { SearchFilter } from "@/components/search-filter"
import { WordRow } from "@/components/word-row"
import { 
  generateEmbedding, 
  createSearchableText, 
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

export interface WordWithEmbedding extends WordData {
  embedding?: number[]
  searchableText?: string
}

interface WordsClientProps {
  words: WordData[]
}

export function WordsClient({ words }: WordsClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [wordsWithEmbeddings, setWordsWithEmbeddings] = useState<WordWithEmbedding[]>([])
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false)
  const [semanticSearchEnabled, setSemanticSearchEnabled] = useState(false)

  // Generate embeddings for all words
  const generateAllEmbeddings = useCallback(async () => {
    if (isGeneratingEmbeddings) return
    
    setIsGeneratingEmbeddings(true)
    try {
      const batchSize = 10 // Process in batches to avoid overwhelming the API
      const wordsWithEmb: WordWithEmbedding[] = []
      
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize)
        const batchPromises = batch.map(async (word) => {
          const searchableText = createSearchableText(word)
          const embedding = await generateEmbedding(searchableText)
          return {
            ...word,
            embedding,
            searchableText,
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        wordsWithEmb.push(...batchResults)
      }
      
      setWordsWithEmbeddings(wordsWithEmb)
      setSemanticSearchEnabled(true)
    } catch (error) {
      console.error('Failed to generate embeddings:', error)
    } finally {
      setIsGeneratingEmbeddings(false)
    }
  }, [words, isGeneratingEmbeddings])

  const filteredWords = useMemo(async () => {
    if (!searchTerm) {
      return semanticSearchEnabled ? wordsWithEmbeddings : words
    }

    // Use semantic search if enabled and embeddings are available
    if (semanticSearchEnabled && wordsWithEmbeddings.length > 0) {
      try {
        const queryEmbedding = await generateEmbedding(searchTerm)
        const semanticResults = searchWordsBySimilarity(wordsWithEmbeddings, queryEmbedding, 0.2)
        
        // Also include traditional keyword matches
        const keywordResults = words.filter((word) =>
          word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.native_script.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (word.transliteration &&
            word.transliteration.toLowerCase().includes(searchTerm.toLowerCase()))
        )

        // Combine and deduplicate results (semantic first, then keyword)
        const combined = [...semanticResults]
        keywordResults.forEach(kwResult => {
          if (!combined.some(semResult => semResult.word === kwResult.word)) {
            combined.push(kwResult)
          }
        })

        return combined
      } catch (error) {
        console.error('Semantic search failed, falling back to keyword search:', error)
      }
    }

    // Fallback to traditional keyword search
    return words.filter((word) => {
      const matchesSearch =
        word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.native_script.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (word.transliteration &&
          word.transliteration.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })
  }, [words, wordsWithEmbeddings, searchTerm, semanticSearchEnabled])

  // Convert async useMemo result to state
  const [displayedWords, setDisplayedWords] = useState<WordData[]>(words)
  
  useEffect(() => {
    filteredWords.then(setDisplayedWords)
  }, [filteredWords])


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
          <div className="px-4 py-2 border-b border-border bg-background flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={generateAllEmbeddings}
                disabled={isGeneratingEmbeddings || semanticSearchEnabled}
                className="text-sm px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGeneratingEmbeddings ? 'Generating Embeddings...' : 
                 semanticSearchEnabled ? 'Semantic Search Ready' : 
                 'Enable Semantic Search'}
              </button>
              {semanticSearchEnabled && (
                <span className="text-xs text-green-600">✓ Semantic search enabled</span>
              )}
            </div>
            {isGeneratingEmbeddings && (
              <div className="text-xs text-muted-foreground">
                This may take a few minutes for all words...
              </div>
            )}
          </div>
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

