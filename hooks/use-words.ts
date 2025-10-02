"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import type { WordWithEmbedding } from "@/lib/semantic-search";
import { createSearchableText } from "@/lib/semantic-search";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWords(initialWords: WordWithEmbedding[]) {
  const [words, setWords] = useState<WordWithEmbedding[]>(initialWords);
  const [isLoadingEmbeddings, setIsLoadingEmbeddings] = useState(true);

  // Fetch words with embeddings in the background
  const { data: wordsWithEmbeddings } = useSWR<WordWithEmbedding[]>(
    "/data/words-with-embeddings.json",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (wordsWithEmbeddings) {
      // Ensure searchableText exists
      const processedWords = wordsWithEmbeddings.map((word) => ({
        ...word,
        searchableText: word.searchableText || createSearchableText(word),
      }));
      setWords(processedWords);
      setIsLoadingEmbeddings(false);
    }
  }, [wordsWithEmbeddings]);

  return { words, isLoadingEmbeddings };
}
