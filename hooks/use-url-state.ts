import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ViewMode = "list" | "map" | "grid";
type SortMode = "none" | "asc" | "desc" | "random";

interface URLState {
  view: ViewMode;
  sort: SortMode;
}

const DEFAULT_VIEW: ViewMode = "list";
const DEFAULT_SORT: SortMode = "random";

export function useURLState() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read from URL params
  const view = (searchParams.get("view") as ViewMode) || DEFAULT_VIEW;
  const sort = (searchParams.get("sort") as SortMode) || DEFAULT_SORT;

  // Validate and normalize params
  const validView: ViewMode = ["list", "map", "grid"].includes(view)
    ? view
    : DEFAULT_VIEW;
  const validSort: SortMode = ["none", "asc", "desc", "random"].includes(sort)
    ? sort
    : DEFAULT_SORT;

  useEffect(() => {
    // Initialize URL params if they don't exist
    if (!searchParams.has("view") || !searchParams.has("sort")) {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("view")) params.set("view", DEFAULT_VIEW);
      if (!params.has("sort")) params.set("sort", DEFAULT_SORT);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, []);

  const updateURLState = (updates: Partial<URLState>) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.view !== undefined) {
      params.set("view", updates.view);
    }
    if (updates.sort !== undefined) {
      params.set("sort", updates.sort);
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return {
    view: validView,
    sort: validSort,
    updateURLState,
  };
}
