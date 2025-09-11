"use client"
import { Input } from "@/components/ui/input"

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
  return (
    <div className="w-full relative">
      <Input
        placeholder="Search words, definitions, or languages…"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border-none bg-background text-base px-4 py-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label="Search words, definitions, or languages"
        aria-describedby="search-results-count"
        type="search"
        inputMode="search"
      />
      
      {searchTerm && (
        <div 
          id="search-results-count"
          className="absolute bottom-2 right-6 text-xs text-muted-foreground flex items-center gap-2"
        >
          <span className="pointer-events-none">
            {isSearching ? 'Searching…' : `Showing ${filteredCount} of ${totalWords} words`}
          </span>
          <button
            onClick={() => onSearchChange("")}
            className="pointer-events-auto hover:text-foreground transition-colors cursor-pointer text-sm touch-action-manipulation"
            aria-label="Clear search"
            type="button"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
