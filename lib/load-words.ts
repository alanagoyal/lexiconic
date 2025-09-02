import type { WordWithEmbedding } from './semantic-search'
import { createSearchableText } from './semantic-search'
import { readFileSync } from 'fs'
import { join } from 'path'

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