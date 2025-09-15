import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

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