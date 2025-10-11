"use client"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface SearchFilterProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  onClear: () => void
  totalWords: number
  filteredCount: number
  isSearching?: boolean
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  onClear,
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
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-2">
          {isSearching ? (
            <Loader2 aria-label="Searching" className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <span>Showing {filteredCount} of {totalWords}</span>
          )}
          <button
            onClick={onClear}
            className="hover:text-foreground transition-colors cursor-pointer text-xl min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mb-2"
            aria-label="Clear search"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
