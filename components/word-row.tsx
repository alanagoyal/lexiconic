"use client"

import { useState } from "react"
import { ChevronDown, ExternalLink } from "lucide-react"

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

interface WordRowProps {
  word: WordData
}

export function WordRow({ word }: WordRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-b border-border/20 hover:bg-muted/20 transition-colors">
      <div className="grid grid-cols-12 gap-4 py-8 px-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Left Column - Word Info */}
        <div className="col-span-12 md:col-span-3 space-y-1">
          <div className="text-sm text-muted-foreground font-medium">{word.language}</div>
          <div className="text-sm text-muted-foreground">{word.category && word.category !== "—" && word.category}</div>
          {word.region && word.region !== "—" && <div className="text-xs text-muted-foreground/70">{word.region}</div>}
        </div>

        {/* Center Column - Native Script */}
        <div className="col-span-12 md:col-span-4 flex items-center">
          <div className="space-y-2">
            <div className="text-2xl md:text-3xl font-serif text-foreground">{word.native_script || word.word}</div>
            {word.transliteration && word.transliteration !== word.word && word.transliteration !== "—" && (
              <div className="text-sm text-muted-foreground italic">{word.transliteration}</div>
            )}
          </div>
        </div>

        {/* Right Column - Definition */}
        <div className="col-span-12 md:col-span-5 flex items-center justify-between">
          <div className="text-lg md:text-xl font-serif text-foreground leading-relaxed">{word.definition}</div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform ml-4 flex-shrink-0 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-8 border-t border-border/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-4">
              {word.literal && word.literal !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Literal Translation</h4>
                  <p className="text-foreground">{word.literal}</p>
                </div>
              )}

              {word.english_approx && word.english_approx !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">English Approximation</h4>
                  <p className="text-foreground">{word.english_approx}</p>
                </div>
              )}

              {word.example_native && word.example_native !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Example</h4>
                  <p className="text-foreground font-serif">{word.example_native}</p>
                  {word.example_gloss && word.example_gloss !== "—" && (
                    <p className="text-sm text-muted-foreground mt-1">{word.example_gloss}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {word.usage_notes && word.usage_notes !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Usage Notes</h4>
                  <p className="text-sm text-foreground">{word.usage_notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                {word.family && word.family !== "—" && (
                  <span className="px-2 py-1 bg-muted rounded text-muted-foreground">{word.family} family</span>
                )}
                {word.disputed === "True" && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Disputed</span>
                )}
                {word.loanword_in_english === "True" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Loanword in English</span>
                )}
              </div>

              {word.sources && word.sources !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Sources</h4>
                  <a
                    href={word.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View source <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
