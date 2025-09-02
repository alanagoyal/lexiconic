import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float',
    })

    return NextResponse.json({
      embedding: response.data[0].embedding,
    })
  } catch (error) {
    console.error('Error generating search embedding:', error)
    return NextResponse.json(
      { error: 'Failed to generate search embedding' },
      { status: 500 }
    )
  }
}