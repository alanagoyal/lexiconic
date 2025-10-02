export const dynamic = "force-static";

import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { loadWordsWithoutEmbeddings } from "@/lib/load-words";

export default async function HomePage() {
  // Load words without embeddings for fast initial page load
  // The client will fetch embeddings in the background using SWR
  const initialWords = await loadWordsWithoutEmbeddings();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center"></div>
      }
    >
      <WordsClient initialWords={initialWords} />
    </Suspense>
  );
}
