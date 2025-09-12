"use client"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface SearchFilterProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  totalWords: number
  filteredCount: number
  isSearching?: boolean
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  totalWords,
  filteredCount,
  isSearching = false,
}: SearchFilterProps) {
  const placeholderText = `Showing ${totalWords} of ${totalWords} words`
  return (
    <div className="w-full relative">
      <Input
        placeholder="Search words, definitions, or languages..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border-none bg-background text-base px-4 py-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      
      {searchTerm && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex flex-row-reverse items-center gap-2">
          <div className="relative pointer-events-none">
            {/* Reserve width to avoid layout shift */}
            <span className="invisible block">{placeholderText}</span>
            <div className="absolute inset-0 flex items-center">
              {isSearching ? (
                <Loader2 aria-label="Searching" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>
                  Showing {filteredCount} of {totalWords} words
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onSearchChange("")}
            className="pointer-events-auto hover:text-foreground transition-colors cursor-pointer text-sm"
            aria-label="Clear search"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
