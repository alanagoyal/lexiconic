"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SearchFilterProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedLanguages: string[]
  onLanguageToggle: (language: string) => void
  selectedCategories: string[]
  onCategoryToggle: (category: string) => void
  availableLanguages: string[]
  availableCategories: string[]
  totalWords: number
  filteredCount: number
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  selectedLanguages,
  onLanguageToggle,
  selectedCategories,
  onCategoryToggle,
  availableLanguages,
  availableCategories,
  totalWords,
  filteredCount,
}: SearchFilterProps) {
  const clearFilters = () => {
    onSearchChange("")
    selectedLanguages.forEach((lang) => onLanguageToggle(lang))
    selectedCategories.forEach((cat) => onCategoryToggle(cat))
  }

  const hasActiveFilters = searchTerm || selectedLanguages.length > 0 || selectedCategories.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search words, definitions, or languages..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-border bg-background text-sm"
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="monuments-title text-xs border-border bg-background">
                LANGUAGES
                {selectedLanguages.length > 0 && (
                  <span className="ml-2 text-foreground">
                    ({selectedLanguages.length})
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
              {availableLanguages.map((language) => (
                <DropdownMenuCheckboxItem
                  key={language}
                  checked={selectedLanguages.includes(language)}
                  onCheckedChange={() => onLanguageToggle(language)}
                >
                  {language}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="monuments-title text-xs border-border bg-background">
                CATEGORIES
                {selectedCategories.length > 0 && (
                  <span className="ml-2 text-foreground">
                    ({selectedCategories.length})
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
              {availableCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => onCategoryToggle(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="monuments-title text-xs">
              CLEAR
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalWords} words
        </span>
        {hasActiveFilters && <span className="text-foreground">FILTERS ACTIVE</span>}
      </div>
    </div>
  )
}
