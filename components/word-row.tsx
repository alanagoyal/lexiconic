"use client";

import { ExternalLink, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { WordData } from "@/components/words-client";

interface WordRowProps {
  word: WordData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  viewMode?: "list" | "grid";
}

export function WordRow({ word, isExpanded, onToggleExpand, viewMode = "list" }: WordRowProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePronounce = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (isPlaying) return;

    if (!word.pronunciation) {
      console.error("No pronunciation file available for word:", word.word);
      return;
    }

    try {
      setIsPlaying(true);

      const audioUrl = `/lexiconic/pronunciations/${word.pronunciation}`;
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        console.error("Failed to load pronunciation audio");
        setIsPlaying(false);
      };

      await audio.play();
    } catch (error) {
      console.error("Pronunciation error:", error);
      setIsPlaying(false);
    }
  };

  const handleWordClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePronounce();
  };

  if (viewMode === "grid") {
    return (
      <div className="word-card border-r border-b border-border p-4 space-y-3 h-full">
        {/* Language and Category */}
        <div className="space-y-1 text-sm">
          <div className="text-foreground font-medium">{word.language}</div>
          {word.category && word.category !== "—" && (
            <div className="text-muted-foreground">{word.category}</div>
          )}
        </div>

        {/* Native Word */}
        <div className="text-left space-y-2">
          <div className="native-script text-2xl text-foreground">
            {word.word.toLowerCase()}
          </div>
          {word.phonetic &&
            word.phonetic.trim() !== "" &&
            word.phonetic !== "—" && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                {word.phonetic}
                <Volume2
                  className={`h-4 w-4 cursor-pointer ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                  onClick={handleWordClick}
                />
              </div>
            )}
        </div>

        {/* Definition */}
        <div className="word-definition text-sm text-foreground leading-relaxed font-playfair flex-1">
          {word.definition}
        </div>
      </div>
    );
  }

  // Original list view layout
  return (
    <div className="word-row border-b border-border w-full">
      {/* Main Grid Layout - responsive design */}
      <div
        className="grid grid-cols-1 md:grid-cols-12 min-h-[120px] md:min-h-[120px] cursor-pointer"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} details for ${
          word.word
        }`}
      >
        {/* Mobile Layout - stacked */}
        <div className="md:hidden p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-sm">
              <div className="text-foreground font-medium">{word.language}</div>
              {word.category && word.category !== "—" && (
                <div className="text-muted-foreground">{word.category}</div>
              )}
            </div>
          </div>

          <div className="text-left space-y-2 py-4">
            <div className="native-script text-3xl text-foreground truncate">
              {word.word.toLowerCase()}
            </div>
            {word.phonetic &&
              word.phonetic.trim() !== "" &&
              word.phonetic !== "—" && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {word.phonetic}
                  <Volume2
                    className={`h-4 w-4 cursor-pointer ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                    onClick={handleWordClick}
                  />
                </div>
              )}
          </div>

          <div className="word-definition text-base text-foreground leading-relaxed pt-2 font-playfair">
            {word.definition}
          </div>
        </div>

        {/* Desktop Layout - 3-column grid */}
        <div className="hidden md:contents">
          {/* Left Column - Native Word */}
          <div className="col-span-4 p-4 flex items-center justify-start">
            <div className="text-left space-y-2 w-full max-w-full">
              <div className="native-script text-4xl md:text-5xl text-foreground truncate">
                {word.word.toLowerCase()}
              </div>
              {word.phonetic &&
                word.phonetic.trim() !== "" &&
                word.phonetic !== "—" && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    {word.phonetic}
                    <Volume2
                      className={`h-4 w-4 cursor-pointer ${
                        isPlaying ? "animate-pulse" : ""
                      }`}
                      onClick={handleWordClick}
                    />
                  </div>
                )}
            </div>
          </div>

          {/* Center Column - Definition */}
          <div className="col-span-5 p-4 flex items-center border-l border-border">
            <div className="word-definition text-lg md:text-xl text-foreground leading-relaxed font-playfair">
              {word.definition}
            </div>
          </div>

          {/* Right Column - Language/Category Info */}
          <div className="col-span-3 p-4 flex flex-col justify-center space-y-1 text-sm border-l border-border">
            <div className="text-foreground font-medium">{word.language}</div>
            {word.category && word.category !== "—" && (
              <div className="text-muted-foreground">{word.category}</div>
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
                  <p className="text-sm text-foreground">
                    {word.english_approx}
                  </p>
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

              {word.sources && word.sources !== "—" && (
                <div>
                  <a
                    href={word.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium mb-2 text-muted-foreground inline-flex items-center gap-1"
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
                      <p className="text-sm text-foreground">
                        {word.english_approx}
                      </p>
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
                        className="text-sm font-medium mb-2 text-muted-foreground inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
