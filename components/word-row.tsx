"use client";

import { ExternalLink } from "lucide-react";

interface WordData {
  word: string;
  native_script: string;
  transliteration: string;
  language: string;
  family: string;
  category: string;
  definition: string;
  literal: string;
  usage_notes: string;
  example_native: string;
  example_gloss: string;
  english_approx: string;
  loanword_in_english: string;
  disputed: string;
  region: string;
  closest_english_paraphrase: string;
  sources: string;
  needs_citation: string;
}

interface WordRowProps {
  word: WordData;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function WordRow({ word, isExpanded, onToggleExpand }: WordRowProps) {

  return (
    <div
      className="word-row cursor-pointer border-b border-border"
      onClick={onToggleExpand}
    >
      {/* Main Grid Layout - responsive design */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[120px] md:min-h-[120px]">
        {/* Mobile Layout - stacked */}
        <div className="md:hidden p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-sm">
              <div className="text-foreground font-medium">{word.language}</div>
              {word.category && word.category !== "—" && (
                <div className="text-muted-foreground">{word.category}</div>
              )}
              {word.region && word.region !== "—" && (
                <div className="text-muted-foreground text-xs">
                  {word.region}
                </div>
              )}
            </div>
          </div>

          <div className="text-left space-y-2 py-4">
            <div className="native-script text-3xl text-foreground truncate w-full">
              {word.native_script || word.word}
            </div>
            {word.transliteration &&
              word.transliteration !== word.word &&
              word.transliteration !== "—" && (
                <div className="text-sm text-muted-foreground">
                  {word.transliteration}
                </div>
              )}
          </div>

          <div className="word-definition text-base text-foreground leading-relaxed pt-2">
            {word.definition}
          </div>
        </div>

        {/* Desktop Layout - 3-column grid */}
        <div className="hidden md:contents">
          {/* Left Column - Native Word */}
          <div className="col-span-4 p-4 flex items-center justify-start">
            <div className="text-left space-y-2 w-full max-w-full">
              <div className="native-script text-4xl md:text-5xl text-foreground truncate w-full">
                {word.native_script || word.word}
              </div>
              {word.transliteration &&
                word.transliteration !== word.word &&
                word.transliteration !== "—" && (
                  <div className="text-sm text-muted-foreground">
                    {word.transliteration}
                  </div>
                )}
            </div>
          </div>

          {/* Center Column - Definition */}
          <div className="col-span-5 p-4 flex items-center border-l border-border">
            <div className="word-definition text-lg md:text-xl text-foreground leading-relaxed">
              {word.definition}
            </div>
          </div>

          {/* Right Column - Language/Category Info */}
          <div className="col-span-3 p-4 flex flex-col justify-center space-y-1 text-sm border-l border-border">
            <div className="text-foreground font-medium">{word.language}</div>
            {word.category && word.category !== "—" && (
              <div className="text-muted-foreground">{word.category}</div>
            )}
            {word.region && word.region !== "—" && (
              <div className="text-muted-foreground text-xs">{word.region}</div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content - responsive layout */}
      {isExpanded && (
        <div className="bg-muted/10">
          {/* Mobile Expanded Content */}
          <div className="md:hidden p-4">
            <div className="space-y-4">
              {word.literal && word.literal !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Literal Translation
                  </h4>
                  <p className="text-sm text-foreground">{word.literal}</p>
                </div>
              )}

              {word.english_approx && word.english_approx !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    English Approximation
                  </h4>
                  <p className="text-sm text-foreground">{word.english_approx}</p>
                </div>
              )}

              {word.example_native && word.example_native !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Example
                  </h4>
                  <p className="native-script text-sm text-foreground">
                    {word.example_native}
                  </p>
                  {word.example_gloss && word.example_gloss !== "—" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {word.example_gloss}
                    </p>
                  )}
                </div>
              )}

              {word.usage_notes && word.usage_notes !== "—" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Usage Notes
                  </h4>
                  <p className="text-sm text-foreground">{word.usage_notes}</p>
                </div>
              )}

              <div className="space-y-2">
                {word.disputed === "True" && (
                  <div className="text-xs text-foreground border-l-2 border-border pl-2">
                    Note: This translation is disputed
                  </div>
                )}
                {word.loanword_in_english === "True" && (
                  <div className="text-xs text-muted-foreground">
                    This word exists as a loanword in English
                  </div>
                )}
              </div>

              {word.sources && word.sources !== "—" && (
                <div>
                  <a
                    href={word.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium mb-2 text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Source <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Expanded Content */}
          <div className="hidden md:block">
            <div className="grid grid-cols-12">
              <div className="col-span-4 p-4">
                <div className="space-y-4">
                  {word.literal && word.literal !== "—" && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Literal Translation
                      </h4>
                      <p className="text-sm text-foreground">{word.literal}</p>
                    </div>
                  )}

                  {word.english_approx && word.english_approx !== "—" && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        English Approximation
                      </h4>
                      <p className="text-sm text-foreground">{word.english_approx}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-5 p-4 border-l border-border">
                <div className="space-y-4">
                  {word.usage_notes && word.usage_notes !== "—" && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Usage Notes
                      </h4>
                      <p className="text-sm text-foreground">
                        {word.usage_notes}
                      </p>
                    </div>
                  )}

                  {word.example_native && word.example_native !== "—" && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Example
                      </h4>
                      <p className="native-script text-sm text-foreground">
                        {word.example_native}
                      </p>
                      {word.example_gloss && word.example_gloss !== "—" && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {word.example_gloss}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-3 p-4 border-l border-border">
                <div className="space-y-2">
                  {word.sources && word.sources !== "—" && (
                    <div>
                      <a
                        href={word.sources}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium mb-2 text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  <div className="space-y-2">
                    {word.disputed === "True" && (
                      <div className="text-xs text-foreground border-l-2 border-border pl-2">
                        Note: This translation is disputed
                      </div>
                    )}
                    {word.loanword_in_english === "True" && (
                      <div className="text-xs text-muted-foreground">
                        This word exists as a loanword in English
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
