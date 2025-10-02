import type { WordWithEmbedding } from './semantic-search'
import { createSearchableText } from './semantic-search'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load words without embeddings for fast initial page load
export async function loadWords(): Promise<WordWithEmbedding[]> {
  const filePath = join(process.cwd(), 'public', 'data', 'words.json')
  const fileContents = readFileSync(filePath, 'utf8')
  const words: WordWithEmbedding[] = JSON.parse(fileContents)
  console.log('Loaded words without embeddings for fast initial load')

  // Ensure searchableText exists, add empty embeddings
  return words.map(word => ({
    ...word,
    embedding: word.embedding || [],
    embeddingHash: word.embeddingHash || '',
    searchableText: word.searchableText || createSearchableText(word)
  }))
}