#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
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
  native_script: string;
  transliteration: string;
  language: string;
  family: string;
  category: string;
  definition: string;
  literal: string;
  usage_notes: string;
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
  return `${word.word} (${word.transliteration}) - ${word.definition}. ${word.usage_notes} Example: ${word.example_gloss}`;
}

async function generateEmbeddingsForWords() {
  try {
    console.log('Reading words.json...');
    const wordsPath = join(process.cwd(), 'public', 'data', 'words.json');
    const embeddingsPath = join(process.cwd(), 'public', 'data', 'words-with-embeddings.json');

    const wordsData = JSON.parse(readFileSync(wordsPath, 'utf8')) as Word[];
    console.log(`Found ${wordsData.length} words to process`);

    // Load existing embeddings if they exist
    let existingEmbeddings: WordWithEmbedding[] = [];
    try {
      existingEmbeddings = JSON.parse(readFileSync(embeddingsPath, 'utf8')) as WordWithEmbedding[];
      console.log(`Found ${existingEmbeddings.length} existing embeddings`);
    } catch (error) {
      console.log('No existing embeddings file found, creating new one');
    }

    // Create a map of existing embeddings by word
    const embeddingMap = new Map<string, WordWithEmbedding>();
    existingEmbeddings.forEach(item => {
      embeddingMap.set(item.word, item);
    });

    const wordsWithEmbeddings: WordWithEmbedding[] = [];
    let processedCount = 0;
    let newEmbeddingsCount = 0;

    for (const word of wordsData) {
      const existing = embeddingMap.get(word.word);

      if (existing) {
        // Use existing embedding but update other fields in case they changed
        wordsWithEmbeddings.push({
          ...word,
          embedding: existing.embedding
        });
        console.log(`Using existing embedding for: ${word.word}`);
      } else {
        // Generate new embedding
        console.log(`Generating embedding for: ${word.word}...`);
        const embeddingText = createEmbeddingText(word);
        const embedding = await generateEmbedding(embeddingText);

        wordsWithEmbeddings.push({
          ...word,
          embedding
        });

        newEmbeddingsCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`Processed ${processedCount}/${wordsData.length} words`);
      }
    }

    console.log('Writing embeddings to file...');
    writeFileSync(embeddingsPath, JSON.stringify(wordsWithEmbeddings, null, 2));

    console.log(`✅ Successfully processed ${wordsData.length} words`);
    console.log(`📊 Generated ${newEmbeddingsCount} new embeddings`);
    console.log(`♻️ Reused ${wordsData.length - newEmbeddingsCount} existing embeddings`);

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