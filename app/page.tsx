export const dynamic = "force-static"

import { WordsClient } from "@/components/words-client"
import { ErrorBoundary, SearchErrorFallback } from "@/components/error-boundary"
import { loadWords } from "@/lib/load-words"

export default async function HomePage() {
  const words = await loadWords()

  return (
    <ErrorBoundary fallback={SearchErrorFallback}>
      <WordsClient words={words} />
    </ErrorBoundary>
  )
}
