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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const availableLanguages = useMemo(() => {
    const languages = new Set(words.map((word) => word.language).filter(Boolean))
    return Array.from(languages).sort()
  }, [words])

  const availableCategories = useMemo(() => {
    const categories = new Set(
      words.map((word) => word.category).filter((cat) => cat && cat !== "—"),
    )
    return Array.from(categories).sort()
  }, [words])

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

      const matchesLanguage =
        selectedLanguages.length === 0 ||
        selectedLanguages.includes(word.language)
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(word.category)

      return matchesSearch && matchesLanguage && matchesCategory
    })
  }, [words, searchTerm, selectedLanguages, selectedCategories])

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language],
    )
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - responsive design */}
      <header className="border-b border-border bg-background">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="monuments-title text-xs md:text-base text-foreground">
              BETWEEN WORDS
            </h1>
          </div>
        </div>
      </header>

      {/* Search and Filters - responsive padding */}
      <div className="border-b border-border bg-background">
        <div className="px-4 md:px-6 py-4">
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedLanguages={selectedLanguages}
            onLanguageToggle={handleLanguageToggle}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            availableLanguages={availableLanguages}
            availableCategories={availableCategories}
            totalWords={words.length}
            filteredCount={filteredWords.length}
          />
        </div>
      </div>

      {/* Words List - full width grid layout with lightweight virtualization */}
      <main>
        {filteredWords.length > 0 ? (
          <div>
            {filteredWords.map((word, index) => (
              <div
                key={`${word.word}-${index}`}
                id={`word-${word.word}`}
                className="virtualized-item"
              >
                <WordRow word={word} />
              </div>
            ))}
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

