import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { loadWords } from "@/lib/load-words";

export default async function HomePage() {
  const words = await loadWords();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center"></div>
      }
    >
      <WordsClient words={words} />
    </Suspense>
  );
}
