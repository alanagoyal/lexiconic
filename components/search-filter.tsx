"use client"
import { Input } from "@/components/ui/input"

interface SearchFilterProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  totalWords: number
  filteredCount: number
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  totalWords,
  filteredCount,
}: SearchFilterProps) {
  return (
    <div className="w-full relative">
      <Input
        placeholder="Search words, definitions, or languages..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border-none bg-background text-base px-6 py-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      
      {searchTerm && (
        <div className="absolute bottom-2 right-6 text-xs text-muted-foreground flex items-center gap-2">
          <span className="pointer-events-none">
            Showing {filteredCount} of {totalWords} words
          </span>
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
