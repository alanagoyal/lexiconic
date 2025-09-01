"use client"

import { useMemo, useState } from "react"
import { SearchFilter } from "@/components/search-filter"
import { WordRow } from "@/components/word-row"

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
  words: WordData[]
}

export function WordsClient({ words }: WordsClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const filteredWords = useMemo(() => {
    return words.filter((word) => {
      const matchesSearch =
        !searchTerm ||
        word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.native_script.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (word.transliteration &&
          word.transliteration.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })
  }, [words, searchTerm])


  const handleRowExpand = (wordId: string) => {
    setExpandedRowId(expandedRowId === wordId ? null : wordId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header and Search - sticky together */}
      <div className="sticky top-0 z-10 bg-background">
        <header className="border-b border-border bg-background">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="monuments-title text-lg md:text-2xl font-bold text-foreground font-playfair">
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
            filteredCount={filteredWords.length}
          />
        </div>
      </div>

      {/* Words List - full width grid layout with lightweight virtualization */}
      <main>
        {filteredWords.length > 0 ? (
          <div>
            {filteredWords.map((word, index) => {
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
          <div className="text-xs text-muted-foreground uppercase letter-spacing-wide">
            A digital exploration of linguistic untranslatability
          </div>
        </div>
      </footer>
    </div>
  )
}

