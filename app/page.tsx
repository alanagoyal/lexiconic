export const dynamic = "force-static"

import { WordsClient } from "@/components/words-client"
import { loadWords } from "@/lib/load-words"
import { Suspense } from "react"

export default async function HomePage() {
  const words = await loadWords()

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <WordsClient words={words} />
    </Suspense>
  )
}
