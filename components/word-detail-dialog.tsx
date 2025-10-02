"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { WordWithEmbedding } from "@/lib/semantic-search"

interface WordDetailDialogProps {
  word: WordWithEmbedding | null
  open: boolean
  onClose: () => void
}

export function WordDetailDialog({ word, open, onClose }: WordDetailDialogProps) {
  if (!word) return null

  const playAudio = () => {
    if (word.pronunciation) {
      const audio = new Audio(`/lexiconic/pronunciations/${word.pronunciation}`)
      audio.play().catch(() => {
        console.warn("Could not play audio")
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="native-script text-3xl md:text-4xl font-medium text-foreground mb-2">
            {word.native_script}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phonetic and language info */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {word.phonetic && (
                <button
                  onClick={playAudio}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
                  title="Click to play pronunciation"
                >
                  <span>{word.phonetic}</span>
                  {word.pronunciation && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{word.language.toLowerCase()}</Badge>
              {word.category && <Badge variant="outline">{word.category}</Badge>}
            </div>
          </div>

          {/* Definition */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Definition
            </h3>
            <p className="text-sm leading-relaxed text-foreground">{word.definition}</p>
          </div>

          {/* Literal translation */}
          {word.literal && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Literal Translation
              </h3>
              <p className="text-sm text-foreground">{word.literal}</p>
            </div>
          )}

          {/* English approximation */}
          {word.english_approx && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                English Approximation
              </h3>
              <p className="text-sm text-foreground">{word.english_approx}</p>
            </div>
          )}

          {/* Usage notes */}
          {word.usage_notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Usage Notes
              </h3>
              <p className="text-sm text-foreground">{word.usage_notes}</p>
            </div>
          )}

          {/* Sources */}
          {word.sources && (
            <div>
              <a
                href={word.sources}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                Source <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
