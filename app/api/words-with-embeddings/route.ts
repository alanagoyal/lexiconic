import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'data', 'words-with-embeddings.json')
    const fileContents = readFileSync(filePath, 'utf8')
    const wordsWithEmbeddings = JSON.parse(fileContents)

    return NextResponse.json(wordsWithEmbeddings)
  } catch (error) {
    console.error('Error loading words with embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to load words with embeddings' },
      { status: 500 }
    )
  }
}
