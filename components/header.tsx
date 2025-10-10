"use client";

import { Button } from "@/components/ui/button";
import {
  Shuffle,
  ArrowUpAZ,
  ArrowDownZA,
  List,
  Map as MapIcon,
  Grid3X3,
} from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";

interface LexiconicHeaderProps {
  viewMode: "list" | "map" | "grid";
  onViewModeChange: (mode: "list" | "map" | "grid") => void;
  sortMode: "none" | "asc" | "desc" | "random";
  onSortModeChange: (mode: "none" | "asc" | "desc" | "random") => void;
  onClearSearch: () => void;
}

export function LexiconicHeader({
  viewMode,
  onViewModeChange,
  sortMode,
  onSortModeChange,
  onClearSearch,
}: LexiconicHeaderProps) {
  const { isMobile, mounted } = useDeviceType();

  const handleLogoClick = () => {
    onViewModeChange("list");
    onClearSearch();
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleLogoClick}
            className="native-script text-3xl font-bold text-foreground font-playfair cursor-pointer hover:opacity-80 transition-opacity"
          >
            LEXICONIC
          </button>
          <div className="flex items-center gap-2">
            {(viewMode === "list" || viewMode === "grid") && (
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
                  variant={sortMode === "asc" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onSortModeChange("asc")}
                  title="Sort A-Z"
                  aria-label="Sort A-Z"
                  className="h-7 w-7"
                >
                  <ArrowUpAZ className="h-4 w-4" />
                </Button>
                <Button
                  variant={sortMode === "desc" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onSortModeChange("desc")}
                  title="Sort Z-A"
                  aria-label="Sort Z-A"
                  className="h-7 w-7"
                >
                  <ArrowDownZA className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* View toggle buttons - only show on desktop (based on screen size) */}
            {mounted && !isMobile && (
            <div className="flex items-center gap-1 border border-border rounded-md p-1">
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
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("grid")}
                title="Grid view"
                aria-label="Grid view"
                className="h-7 w-7"
              >
                <Grid3X3 className="h-4 w-4" />
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
