export const dynamic = "force-static"

import { WordsClient } from "@/components/words-client"
import { loadWords } from "@/lib/load-words"

export default async function HomePage() {
  const words = await loadWords()

  return <WordsClient words={words} />
}
