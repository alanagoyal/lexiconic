import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { WordDataWithoutEmbedding, EmbeddingsMap, WordWithEmbedding } from '@/types/word'
import { createSearchableText } from '@/lib/semantic-search'

export async function GET() {
  try {
    // Load words metadata
    const wordsPath = join(process.cwd(), 'public', 'data', 'words.json')
    const words: WordDataWithoutEmbedding[] = JSON.parse(readFileSync(wordsPath, 'utf8'))

    // Load embeddings map
    const embeddingsPath = join(process.cwd(), 'public', 'data', 'embeddings.json')
    const embeddingsMap: EmbeddingsMap = JSON.parse(readFileSync(embeddingsPath, 'utf8'))

    // Merge embeddings with word data
    const wordsWithEmbeddings: WordWithEmbedding[] = words.map(word => {
      const embeddingData = embeddingsMap[word.word]
      return {
        ...word,
        embedding: embeddingData?.embedding || [],
        embeddingHash: embeddingData?.embeddingHash || '',
        searchableText: createSearchableText(word)
      }
    })

    return NextResponse.json(wordsWithEmbeddings)
  } catch (error) {
    console.error('Error loading words with embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to load words with embeddings' },
      { status: 500 }
    )
  }
}
