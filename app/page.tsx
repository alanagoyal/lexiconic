"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { WordRow } from "@/components/word-row"
import { SearchFilter } from "@/components/search-filter"
import { Button } from "@/components/ui/button"
import { BookOpen, Languages, Sparkles } from "lucide-react"

interface WordData {
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

const WORDS_PER_PAGE = 20

export default function HomePage() {
  const [words, setWords] = useState<WordData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [displayedCount, setDisplayedCount] = useState(WORDS_PER_PAGE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    const fetchWordsData = async () => {
      try {
        console.log("[v0] Fetching CSV data...")
        const response = await fetch(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untranslatable%20Words%20with%20Sources-Qg29WupfgFGdmHN545eqNO3O0rS39g.csv",
          {
            mode: "cors",
            headers: {
              Accept: "text/csv,text/plain,*/*",
            },
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const csvText = await response.text()
        console.log("[v0] CSV data received, length:", csvText.length)

        // Parse CSV manually with better handling
        const lines = csvText.split("\n").filter((line) => line.trim())
        if (lines.length === 0) {
          throw new Error("Empty CSV file")
        }

        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
        console.log("[v0] Headers:", headers)

        const parsedWords: WordData[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          if (!line.trim()) continue

          // Better CSV parsing
          const values: string[] = []
          let current = ""
          let inQuotes = false

          for (let j = 0; j < line.length; j++) {
            const char = line[j]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              values.push(current.replace(/^"|"$/g, "").trim())
              current = ""
            } else {
              current += char
            }
          }
          values.push(current.replace(/^"|"$/g, "").trim())

          if (values.length >= headers.length) {
            const wordObj: any = {}
            headers.forEach((header, index) => {
              wordObj[header] = values[index] || ""
            })

            if (wordObj.word && wordObj.definition) {
              parsedWords.push(wordObj as WordData)
            }
          }
        }

        console.log("[v0] Parsed words:", parsedWords.length)
        setWords(parsedWords)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Failed to load words data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
        setLoading(false)
      }
    }

    fetchWordsData()
  }, [])

  const availableLanguages = useMemo(() => {
    const languages = new Set(words.map((word) => word.language).filter(Boolean))
    return Array.from(languages).sort()
  }, [words])

  const availableCategories = useMemo(() => {
    const categories = new Set(words.map((word) => word.category).filter((cat) => cat && cat !== "—"))
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
        (word.transliteration && word.transliteration.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.includes(word.language)
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(word.category)

      return matchesSearch && matchesLanguage && matchesCategory
    })
  }, [words, searchTerm, selectedLanguages, selectedCategories])

  const displayedWords = useMemo(() => {
    return filteredWords.slice(0, displayedCount)
  }, [filteredWords, displayedCount])

  const loadMore = useCallback(() => {
    if (displayedCount < filteredWords.length) {
      setIsLoadingMore(true)
      setTimeout(() => {
        setDisplayedCount((prev) => Math.min(prev + WORDS_PER_PAGE, filteredWords.length))
        setIsLoadingMore(false)
      }, 300)
    }
  }, [displayedCount, filteredWords.length])

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(WORDS_PER_PAGE)
  }, [searchTerm, selectedLanguages, selectedCategories])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loadMore])

  // ... existing code for handlers ...
  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]))
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const getRandomWord = () => {
    if (filteredWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredWords.length)
      const randomWord = filteredWords[randomIndex]
      // Scroll to the word
      setTimeout(() => {
        const element = document.getElementById(`word-${randomWord.word}`)
        element?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading the cabinet of curiosities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-medium text-foreground">Failed to load words</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - responsive design */}
      <header className="border-b border-border bg-background">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="monuments-title text-xs md:text-base text-foreground">BETWEEN WORDS</h1>
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

      {/* Words List - full width grid layout */}
      <main>
        {displayedWords.length > 0 ? (
          <div>
            {displayedWords.map((word, index) => (
              <div key={`${word.word}-${index}`} id={`word-${word.word}`}>
                <WordRow word={word} />
              </div>
            ))}

            {/* Load More Indicator */}
            {displayedCount < filteredWords.length && (
              <div className="border-t border-border p-6 text-center">
                {isLoadingMore ? (
                  <div className="text-muted-foreground text-sm">Loading more words...</div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Showing {displayedCount} of {filteredWords.length} words
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="text-muted-foreground text-sm">No words found</div>
            <div className="text-muted-foreground text-xs mt-2">Try adjusting your search terms or filters</div>
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
