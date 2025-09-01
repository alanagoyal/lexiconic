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
    <div className="w-full">
      <Input
        placeholder="Search words, definitions, or languages..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border-none bg-background text-base px-6 py-4 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      
      <div className="px-6 py-2 text-xs text-muted-foreground">
        Showing {filteredCount} of {totalWords} words
      </div>
    </div>
  )
}
