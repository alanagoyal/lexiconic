"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, BookOpen, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface WordTileProps {
  word: WordData
  isExpanded: boolean
  onToggle: () => void
}

export function WordTile({ word, isExpanded, onToggle }: WordTileProps) {
  return (
    <Card
      className={cn(
        "word-tile cursor-pointer transition-all duration-300 ease-in-out",
        "hover:shadow-lg border-border/50 bg-card/80 backdrop-blur-sm",
        isExpanded ? "col-span-full row-span-2 md:col-span-2" : "aspect-square",
      )}
      onClick={onToggle}
    >
      <CardContent className="p-4 h-full flex flex-col justify-between">
        {!isExpanded ? (
          // Collapsed tile view
          <div className="flex flex-col justify-center items-center text-center h-full space-y-2">
            <div className="native-script text-2xl md:text-3xl font-medium text-card-foreground">
              {word.native_script || word.word}
            </div>
            {word.transliteration && word.transliteration !== word.word && (
              <div className="text-sm text-muted-foreground italic">{word.transliteration}</div>
            )}
            <div className="text-xs text-muted-foreground font-medium">{word.language}</div>
          </div>
        ) : (
          // Expanded tile view
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="native-script text-3xl md:text-4xl font-medium text-card-foreground mb-2">
                  {word.native_script || word.word}
                </h3>
                {word.transliteration && word.transliteration !== word.word && (
                  <p className="text-lg text-muted-foreground italic mb-1">{word.transliteration}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>{word.language}</span>
                  {word.region && word.region !== "—" && (
                    <>
                      <span>•</span>
                      <span>{word.region}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {word.category && word.category !== "—" && (
                  <Badge variant="secondary" className="text-xs">
                    {word.category}
                  </Badge>
                )}
                {word.disputed === "True" && (
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                    Disputed
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Definition
                </h4>
                <p className="text-sm text-foreground leading-relaxed">{word.definition}</p>
              </div>

              {word.literal && word.literal !== "—" && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Literal Translation</h4>
                  <p className="text-sm text-muted-foreground italic">"{word.literal}"</p>
                </div>
              )}

              {word.english_approx && word.english_approx !== "—" && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Closest English Equivalent</h4>
                  <p className="text-sm text-muted-foreground">{word.english_approx}</p>
                </div>
              )}

              {word.usage_notes && word.usage_notes !== "—" && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Usage Notes</h4>
                  <p className="text-xs text-muted-foreground">{word.usage_notes}</p>
                </div>
              )}

              {word.sources && word.sources !== "—" && (
                <div className="pt-2 border-t border-border/50">
                  <a
                    href={word.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Source
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
