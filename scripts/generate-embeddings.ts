#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import OpenAI from 'openai';

// Load environment variables from .env.local
function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

// Load .env.local before using environment variables
loadEnvLocal();

interface Word {
  word: string;
  phonetic: string;
  language: string;
  family: string;
  category: string;
  definition: string;
  literal: string;
  usage_notes: string;
  location: string;
  example_native: string;
  example_gloss: string;
  english_approx: string;
  loanword_in_english: string;
  disputed: string;
  region: string;
  closest_english_paraphrase: string;
  sources: string;
  needs_citation: string;
}

interface WordWithEmbedding extends Word {
  embedding: number[];
  embeddingHash?: string; // Hash of the text used to generate the embedding
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

function createEmbeddingText(word: Word): string {
  // Create comprehensive text for embedding that includes all semantic information
  const parts = [
    `Word: ${word.word}`,
    word.phonetic && word.phonetic !== word.word ? `Phonetic: ${word.phonetic}` : '',
    `Language: ${word.language}`,
    `Category: ${word.category}`,
    `Definition: ${word.definition}`,
    word.literal && word.literal !== '—' ? `Literal meaning: ${word.literal}` : '',
    word.usage_notes ? `Usage: ${word.usage_notes}` : '',
    word.english_approx ? `Similar to: ${word.english_approx}` : '',
    word.example_gloss ? `Example: ${word.example_gloss}` : '',
    word.closest_english_paraphrase ? `English equivalent: ${word.closest_english_paraphrase}` : ''
  ].filter(Boolean);
  
  return parts.join('. ');
}

function createTextHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function generateEmbeddingsForWords() {
  try {
    const wordsPath = join(process.cwd(), 'public', 'data', 'words.json');
    const embeddingsPath = join(process.cwd(), 'public', 'data', 'words-with-embeddings.json');

    const wordsData = JSON.parse(readFileSync(wordsPath, 'utf8')) as Word[];

    // Load existing embeddings if they exist
    let existingEmbeddings: WordWithEmbedding[] = [];
    try {
      existingEmbeddings = JSON.parse(readFileSync(embeddingsPath, 'utf8')) as WordWithEmbedding[];
    } catch (error) {
      // No existing embeddings file
    }

    // Create a map of existing embeddings by word
    const embeddingMap = new Map<string, WordWithEmbedding>();
    existingEmbeddings.forEach(item => {
      embeddingMap.set(item.word, item);
    });

    // First pass: determine what needs to be regenerated
    const wordsNeedingGeneration: Word[] = [];
    const wordsToReuse: Array<{ word: Word; existing: WordWithEmbedding }> = [];

    for (const word of wordsData) {
      const existing = embeddingMap.get(word.word);
      const embeddingText = createEmbeddingText(word);
      const currentHash = createTextHash(embeddingText);

      // Check if we need to regenerate the embedding
      const needsRegeneration = !existing || !existing.embeddingHash || existing.embeddingHash !== currentHash;

      if (existing && !needsRegeneration) {
        wordsToReuse.push({ word, existing });
      } else {
        wordsNeedingGeneration.push(word);
      }
    }

    // Show summary upfront
    if (wordsNeedingGeneration.length === 0) {
      console.log(`→ No new or changed words detected`);
    } else {
      console.log(`→ Processing ${wordsNeedingGeneration.length} embedding(s)`);
    }

    const wordsWithEmbeddings: WordWithEmbedding[] = [];
    let processedCount = 0;

    // Process words that need generation
    for (const word of wordsNeedingGeneration) {
      const existing = embeddingMap.get(word.word);
      const embeddingText = createEmbeddingText(word);
      const currentHash = createTextHash(embeddingText);

      console.log(`  • Generating: ${word.word}`);

      const embedding = await generateEmbedding(embeddingText);

      wordsWithEmbeddings.push({
        ...word,
        embedding,
        embeddingHash: currentHash
      });

      processedCount++;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add reused embeddings
    for (const { word, existing } of wordsToReuse) {
      const embeddingText = createEmbeddingText(word);
      const currentHash = createTextHash(embeddingText);

      console.log(`  ✓ Using existing: ${word.word}`);

      wordsWithEmbeddings.push({
        ...word,
        embedding: existing.embedding,
        embeddingHash: currentHash
      });
    }

    const newEmbeddingsCount = wordsNeedingGeneration.length;
    const reusedCount = wordsData.length - newEmbeddingsCount;

    writeFileSync(embeddingsPath, JSON.stringify(wordsWithEmbeddings, null, 2));

    if (newEmbeddingsCount > 0) {
      console.log(`→ Generated ${newEmbeddingsCount} embedding(s), used ${reusedCount} existing`);
    } else {
      console.log(`→ Used ${reusedCount} existing embedding(s)`);
    }

  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    process.exit(1);
  }
}

// Check if OPENAI_API_KEY is set
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables or .env.local');
  console.error('   Please add OPENAI_API_KEY=your_key_here to your .env.local file');
  process.exit(1);
}

generateEmbeddingsForWords();