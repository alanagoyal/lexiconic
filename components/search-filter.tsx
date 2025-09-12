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
        placeholder="Search words, definitions, or languages..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border-none bg-background text-base px-4 py-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      
      {searchTerm && (
        <div className="absolute bottom-2 right-6 text-xs text-muted-foreground flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="32"
                  strokeDashoffset="32"
                  className="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 0 1 8-8v8z"
                  fill="currentColor"
                  className="opacity-75"
                />
              </svg>
              <span className="pointer-events-none">Searching...</span>
            </div>
          ) : (
            <span className="pointer-events-none">
              Showing {filteredCount} of {totalWords} words
            </span>
          )}
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
