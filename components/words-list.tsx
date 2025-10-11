import { WordRow } from "@/components/word-row";
import type { WordWithEmbedding } from "@/lib/semantic-search";

interface WordsListProps {
  words: WordWithEmbedding[];
  viewMode: "list" | "grid";
  expandedRowId?: string | null;
  onToggleExpand?: (wordId: string) => void;
  isSearching?: boolean;
}

export function WordsList({
  words,
  viewMode,
  expandedRowId,
  onToggleExpand,
  isSearching = false,
}: WordsListProps) {
  // Only show "No words found" if search is complete and no results
  if (words.length === 0 && !isSearching) {
    return (
      <div className="p-16 text-center">
        <div className="text-muted-foreground text-sm">No words found</div>
        <div className="text-muted-foreground text-xs mt-2">
          Try adjusting your search terms or filters
        </div>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-border [&>*:last-child>*]:border-b-0">
        {words.map((word, index) => {
          const wordId = `${word.word}-${index}`;
          return (
            <div key={wordId} className="word-grid-item">
              <WordRow
                word={word}
                isExpanded={expandedRowId === wordId}
                onToggleExpand={() => onToggleExpand?.(wordId)}
                viewMode="grid"
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="[&>*:last-child>*]:border-b-0">
      {words.map((word, index) => {
        const wordId = `${word.word}-${index}`;
        return (
          <div key={wordId}>
            <WordRow
              word={word}
              isExpanded={expandedRowId === wordId}
              onToggleExpand={() => onToggleExpand?.(wordId)}
              viewMode="list"
            />
          </div>
        );
      })}
    </div>
  );
}
