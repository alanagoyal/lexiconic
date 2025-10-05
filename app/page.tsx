export const dynamic = "force-static";

import { Suspense } from "react";
import { WordsClient } from "@/components/words-client";
import { loadWords } from "@/lib/load-words";

async function WordsWrapper() {
  const words = await loadWords();
  return <WordsClient words={words} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center"></div>
      }
    >
      <WordsWrapper />
    </Suspense>
  );
}
