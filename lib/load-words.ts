import type { WordWithEmbedding } from './semantic-search'
import { createSearchableText } from './semantic-search'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load words WITHOUT embeddings for fast initial page load
export async function loadWordsWithoutEmbeddings(): Promise<WordWithEmbedding[]> {
  const filePath = join(process.cwd(), 'public', 'data', 'words.json')
  const fileContents = readFileSync(filePath, 'utf8')
  const words: any[] = JSON.parse(fileContents)
  console.log('Loaded words without embeddings (fast initial load)')

  // Add empty embeddings and searchableText for initial render
  return words.map(word => ({
    ...word,
    embedding: [],
    embeddingHash: '',
    searchableText: createSearchableText(word)
  }))
}

// Load words with embeddings from local JSON file
export async function loadWords(): Promise<WordWithEmbedding[]> {
  const filePath = join(process.cwd(), 'public', 'data', 'words-with-embeddings.json')
  const fileContents = readFileSync(filePath, 'utf8')
  const wordsWithEmbeddings: WordWithEmbedding[] = JSON.parse(fileContents)
  console.log('Loaded words with pre-computed embeddings')

  // Ensure searchableText exists
  return wordsWithEmbeddings.map(word => ({
    ...word,
    searchableText: word.searchableText || createSearchableText(word)
  }))
}