"use client";

import { Button } from "@/components/ui/button";
import {
  Shuffle,
  ArrowUpAZ,
  ArrowDownZA,
  List,
  Map as MapIcon,
} from "lucide-react";
import Link from "next/link";

interface LexiconicHeaderProps {
  viewMode: "list" | "map";
  onViewModeChange: (mode: "list" | "map") => void;
  sortMode: "none" | "asc" | "desc" | "random";
  onSortModeChange: (mode: "none" | "asc" | "desc" | "random") => void;
  isShuffling: boolean;
}

export function LexiconicHeader({
  viewMode,
  onViewModeChange,
  sortMode,
  onSortModeChange,
  isShuffling,
}: LexiconicHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Link href="/?view=list" className="native-script text-3xl font-bold text-foreground font-playfair">
            LEXICONIC
          </Link>
          <div className="flex items-center gap-2">
            {viewMode === "list" && (
              <div className="flex items-center gap-1 border border-border rounded-md p-1">
                <Button
                  variant={sortMode === "random" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onSortModeChange("random")}
                  title="Randomize order"
                  aria-label="Randomize order"
                  className="h-7 w-7"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button
                  variant={
                    sortMode === "asc" || sortMode === "desc"
                      ? "default"
                      : "ghost"
                  }
                  size="icon"
                  onClick={() => {
                    if (sortMode === "none") {
                      onSortModeChange("asc");
                    } else if (sortMode === "asc") {
                      onSortModeChange("desc");
                    } else if (sortMode === "desc") {
                      onSortModeChange("none");
                    } else {
                      onSortModeChange("asc");
                    }
                  }}
                  title={sortMode === "desc" ? "Sort A-Z" : "Sort Z-A"}
                  aria-label={sortMode === "desc" ? "Sort A-Z" : "Sort Z-A"}
                  className="h-7 w-7"
                >
                  {sortMode === "desc" ? (
                    <ArrowDownZA className="h-4 w-4" />
                  ) : (
                    <ArrowUpAZ className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* View toggle buttons - always on the right, hidden on mobile */}
            <div className="hidden md:flex items-center gap-1 border border-border rounded-md p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("list")}
                title="List view"
                aria-label="List view"
                className="h-7 w-7"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("map")}
                title="Map view"
                aria-label="Map view"
                className="h-7 w-7"
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
