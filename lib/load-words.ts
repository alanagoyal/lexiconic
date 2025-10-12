import type { WordWithEmbedding, WordDataWithoutEmbedding } from '@/types/word'
import { createSearchableText } from './semantic-search'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load words without embeddings for fast initial page load
export async function loadWords(): Promise<WordWithEmbedding[]> {
  const filePath = join(process.cwd(), 'public', 'data', 'words.json')
  const fileContents = readFileSync(filePath, 'utf8')
  const words: WordDataWithoutEmbedding[] = JSON.parse(fileContents)
  console.log('Loaded words without embeddings for fast initial load')

  // Convert to WordWithEmbedding by adding empty embeddings and searchableText
  return words.map(word => ({
    ...word,
    embedding: [],
    embeddingHash: '',
    searchableText: createSearchableText(word)
  }))
}