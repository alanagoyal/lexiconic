import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Simple LRU cache for embeddings
class EmbeddingCache {
  private cache = new Map<string, number[]>()
  private maxSize = 100

  get(key: string): number[] | undefined {
    const value = this.cache.get(key)
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: string, value: number[]): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // Add to end
    this.cache.set(key, value)
    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }
}

const embeddingCache = new EmbeddingCache()

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Normalize query for cache key (lowercase, trim)
    const cacheKey = query.toLowerCase().trim()

    // Check cache first
    const cachedEmbedding = embeddingCache.get(cacheKey)
    if (cachedEmbedding) {
      return NextResponse.json({
        embedding: cachedEmbedding,
        cached: true,
      })
    }

    // Generate new embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float',
    })

    const embedding = response.data[0].embedding

    // Store in cache
    embeddingCache.set(cacheKey, embedding)

    return NextResponse.json({
      embedding,
      cached: false,
    })
  } catch (error) {
    console.error('Error generating search embedding:', error)
    return NextResponse.json(
      { error: 'Failed to generate search embedding' },
      { status: 500 }
    )
  }
}