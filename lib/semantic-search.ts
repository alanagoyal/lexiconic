import type { WordData, WordWithEmbedding } from '@/types/word'

export type { WordWithEmbedding }

// Cosine similarity calculation
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Create searchable text from word data
export function createSearchableText(word: WordData): string {
  const parts = [
    word.word,
    word.definition,
    word.language,
    word.category,
    word.english_approx,
    word.literal,
    word.phonetic,
  ].filter(Boolean)
  
  return parts.join(' ')
}

// Generate embedding for a word
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate embedding')
  }

  const data = await response.json()
  return data.embedding
}

// Search words using semantic similarity
export function searchWordsBySimilarity(
  words: WordWithEmbedding[],
  queryEmbedding: number[],
  threshold: number = 0.3,
  limit: number = 50
): WordWithEmbedding[] {
  const wordSimilarities = words
    .filter(word => word.embedding)
    .map(word => ({
      word,
      similarity: cosineSimilarity(word.embedding!, queryEmbedding)
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return wordSimilarities.map(item => item.word)
}