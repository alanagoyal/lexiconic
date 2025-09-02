import type { WordWithEmbedding } from '@/components/words-client'
import { createSearchableText } from './semantic-search'

// Load words with embeddings from local JSON file
export async function loadWords(): Promise<WordWithEmbedding[]> {
  const response = await fetch('/data/words-with-embeddings.json', {
    cache: 'force-cache'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to load words: ${response.status}`)
  }

  const wordsWithEmbeddings: WordWithEmbedding[] = await response.json()
  console.log('Loaded words with pre-computed embeddings')
  
  // Ensure searchableText exists
  return wordsWithEmbeddings.map(word => ({
    ...word,
    searchableText: word.searchableText || createSearchableText(word)
  }))
}