#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import type { WordDataWithoutEmbedding, EmbeddingsMap } from '../types/word';

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

// Use centralized types from /types/word.ts

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

function createEmbeddingText(word: WordDataWithoutEmbedding): string {
  // Create comprehensive text for embedding that includes all semantic information
  const parts = [
    `Word: ${word.word}`,
    word.phonetic && word.phonetic !== word.word ? `Phonetic: ${word.phonetic}` : '',
    `Language: ${word.language}`,
    `Category: ${word.category}`,
    `Definition: ${word.definition}`,
    word.usage_notes ? `Usage: ${word.usage_notes}` : '',
    word.english_approx ? `Similar to: ${word.english_approx}` : '',
  ].filter(Boolean);
  
  return parts.join('. ');
}

function createTextHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function generateEmbeddingsForWords(forceAll = false) {
  try {
    const wordsPath = join(process.cwd(), 'public', 'data', 'words.json');
    const embeddingsPath = join(process.cwd(), 'public', 'data', 'embeddings.json');

    // Create backup before modifying
    const backupPath = join(process.cwd(), 'public', 'data', 'backup', 'embeddings-backup-' + Date.now() + '.json');
    const backupDir = join(process.cwd(), 'public', 'data', 'backup');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }
    if (existsSync(embeddingsPath)) {
      copyFileSync(embeddingsPath, backupPath);
      console.log(`→ Created backup: ${join('public', 'data', 'backup', basename(backupPath))}`);
    }

    const wordsData = JSON.parse(readFileSync(wordsPath, 'utf8')) as WordDataWithoutEmbedding[];

    // Load existing embeddings if they exist
    let existingEmbeddings: EmbeddingsMap = {};
    try {
      existingEmbeddings = JSON.parse(readFileSync(embeddingsPath, 'utf8')) as EmbeddingsMap;
    } catch (error) {
      // No existing embeddings file
    }

    // First pass: determine what needs to be regenerated
    const wordsNeedingGeneration: WordDataWithoutEmbedding[] = [];
    const wordsToReuse: WordDataWithoutEmbedding[] = [];

    for (const word of wordsData) {
      const existing = existingEmbeddings[word.word];
      const embeddingText = createEmbeddingText(word);
      const currentHash = createTextHash(embeddingText);

      // Check if we need to regenerate the embedding
      const needsRegeneration = forceAll || !existing || !existing.embeddingHash || existing.embeddingHash !== currentHash;

      if (existing && !needsRegeneration) {
        wordsToReuse.push(word);
      } else {
        wordsNeedingGeneration.push(word);
      }
    }

    // Show summary upfront
    if (wordsNeedingGeneration.length === 0) {
      console.log(`→ No new or changed words detected`);
      // Delete backup if nothing to process
      if (existsSync(backupPath)) {
        unlinkSync(backupPath);
      }
    } else {
      console.log(`→ Processing ${wordsNeedingGeneration.length} embedding(s)${forceAll ? ' (--all mode)' : ''}`);
    }

    const newEmbeddingsMap: EmbeddingsMap = {};
    let processedCount = 0;

    // Process words that need generation
    for (const word of wordsNeedingGeneration) {
      const embeddingText = createEmbeddingText(word);
      const currentHash = createTextHash(embeddingText);

      console.log(`  • Generating: ${word.word}`);

      const embedding = await generateEmbedding(embeddingText);

      newEmbeddingsMap[word.word] = {
        embedding,
        embeddingHash: currentHash
      };

      processedCount++;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add reused embeddings
    for (const word of wordsToReuse) {
      const existing = existingEmbeddings[word.word];
      const embeddingText = createEmbeddingText(word);
      const currentHash = createTextHash(embeddingText);

      console.log(`  ✓ Using existing: ${word.word}`);

      newEmbeddingsMap[word.word] = {
        embedding: existing.embedding,
        embeddingHash: currentHash
      };
    }

    const newEmbeddingsCount = wordsNeedingGeneration.length;
    const reusedCount = wordsData.length - newEmbeddingsCount;

    writeFileSync(embeddingsPath, JSON.stringify(newEmbeddingsMap, null, 2));

    if (newEmbeddingsCount > 0) {
      console.log(`→ Generated ${newEmbeddingsCount} embedding(s), used ${reusedCount} existing`);
    } else {
      console.log(`→ Used ${reusedCount} existing embedding(s)`);
    }

    // Delete backup after successful completion
    if (existsSync(backupPath)) {
      unlinkSync(backupPath);
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

const forceAll = process.argv.includes('--all');
generateEmbeddingsForWords(forceAll);