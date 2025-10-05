import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { loadWords } from "@/lib/load-words";

type ViewMode = "list" | "map" | "grid";
type SortMode = "none" | "asc" | "desc" | "random";

const DEFAULT_VIEW: ViewMode = "list";
const DEFAULT_SORT: SortMode = "random";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string }>;
}) {
  const words = await loadWords();
  const params = await searchParams;

  // Read and validate URL params server-side
  const view = (params.view as ViewMode) || DEFAULT_VIEW;
  const sort = (params.sort as SortMode) || DEFAULT_SORT;

  const validView: ViewMode = ["list", "map", "grid"].includes(view)
    ? view
    : DEFAULT_VIEW;
  const validSort: SortMode = ["none", "asc", "desc", "random"].includes(sort)
    ? sort
    : DEFAULT_SORT;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center"></div>
      }
    >
      <WordsClient words={words} initialView={validView} initialSort={validSort} />
    </Suspense>
  );
}
