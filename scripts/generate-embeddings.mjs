#!/usr/bin/env node
/**
 * Generate embeddings for the dataset at public/data/words.json
 * and write to public/data/words-with-embeddings.json
 *
 * Requires env OPENAI_API_KEY.
 */

import fs from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'

const INPUT_PATH = path.join(process.cwd(), 'public', 'data', 'words.json')
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'words-with-embeddings.json')

function createSearchableText(word) {
  const parts = [
    word.word,
    word.definition,
    word.language,
    word.category,
    word.transliteration,
    word.closest_english_paraphrase,
    word.english_approx,
  ].filter(Boolean)
  return parts.join(' ')
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY')
    process.exit(1)
  }
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input dataset not found: ${INPUT_PATH}`)
    process.exit(1)
  }

  const client = new OpenAI({ apiKey })
  const words = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))
  console.log(`[emb] Loaded ${words.length} words from words.json`)

  const BATCH_SIZE = 100
  const results = []
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE)
    const inputs = batch.map(createSearchableText)
    console.log(`[emb] Requesting embeddings for items ${i}..${i + batch.length - 1}`)
    const resp = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: inputs,
      encoding_format: 'float',
    })
    const vectors = resp.data.map(d => d.embedding)
    for (let j = 0; j < batch.length; j++) {
      const item = { ...batch[j], embedding: vectors[j] }
      results.push(item)
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2))
  console.log(`[emb] Wrote embeddings to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

