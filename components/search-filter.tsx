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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search words, definitions, or languages..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Languages
                {selectedLanguages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {selectedLanguages.length}
                  </Badge>
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
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Categories
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {selectedCategories.length}
                  </Badge>
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalWords} words
        </span>
        {hasActiveFilters && <span className="text-primary">Filters active</span>}
      </div>
    </div>
  )
}
