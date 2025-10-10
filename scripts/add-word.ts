#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initLogger, invoke } from 'braintrust';
import { z } from 'zod';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Braintrust logger
initLogger({
  projectName: "lexiconic",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

interface WordData {
  word: string;
  language: string;
  sources: string;
  family?: string;
  category?: string;
  definition?: string;
  literal?: string;
  usage_notes?: string;
  english_approx?: string;
  phonetic?: string;
  pronunciation?: string;
  embedding?: number[];
  embeddingHash?: string;
  [key: string]: any;
}

interface BraintrustMetadata {
  word: string;
  language: string;
  family: string;
  category: string;
  definition: string;
  literal: string;
  usage_notes: string;
  english_approx: string;
  phonetic: string;
}

const metadataSchema = z.object({
  word: z.string(),
  language: z.string(),
  family: z.string(),
  category: z.string(),
  definition: z.string(),
  literal: z.string(),
  usage_notes: z.string(),
  english_approx: z.string(),
  phonetic: z.string(),
});

async function generateMetadata(word: string, language: string): Promise<BraintrustMetadata> {
  console.log(`  • Generating metadata for: ${word}`);
  
  const result = await invoke({
    projectName: "lexiconic",
    slug: "generate-metadata-4263",
    input: { word, language },
  });
  
  // Parse if it's a JSON string
  let metadata = result;
  if (typeof result === 'string') {
    metadata = JSON.parse(result);
  }
  
  return metadataSchema.parse(metadata);
}

async function generatePronunciation(word: string): Promise<string> {
  console.log(`  • Generating pronunciation for: ${word}`);
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const mp3 = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'alloy',
    input: word,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  const hash = crypto.createHash('md5').update(word).digest('hex');
  const fileName = `${hash}.mp3`;
  const pronunciationsDir = path.join(__dirname, '../public/pronunciations');
  
  if (!fs.existsSync(pronunciationsDir)) {
    fs.mkdirSync(pronunciationsDir, { recursive: true });
  }
  
  const outputPath = path.join(pronunciationsDir, fileName);
  fs.writeFileSync(outputPath, buffer);
  
  return fileName;
}

async function generateEmbedding(wordData: WordData): Promise<{ embedding: number[], hash: string }> {
  console.log(`  • Generating embedding for: ${wordData.word}`);
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Create comprehensive text for embedding
  const parts = [
    `Word: ${wordData.word}`,
    wordData.phonetic && wordData.phonetic !== wordData.word ? `Phonetic: ${wordData.phonetic}` : '',
    `Language: ${wordData.language}`,
    `Category: ${wordData.category}`,
    `Definition: ${wordData.definition}`,
    wordData.literal && wordData.literal !== '—' ? `Literal meaning: ${wordData.literal}` : '',
    wordData.usage_notes ? `Usage: ${wordData.usage_notes}` : '',
    wordData.english_approx ? `Similar to: ${wordData.english_approx}` : '',
  ].filter(Boolean);
  
  const embeddingText = parts.join('. ');
  const hash = crypto.createHash('sha256').update(embeddingText).digest('hex');
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: embeddingText,
  });
  
  return { 
    embedding: response.data[0].embedding,
    hash 
  };
}

async function addWord(word: string, language: string, source: string) {
  console.log(`\n📝 Adding word: "${word}" (${language})\n`);

  // Validate inputs
  if (!word || !language || !source) {
    console.error('❌ Error: word, language, and source are all required');
    console.error('Usage: npm run add-word -- <word> <language> <source>');
    process.exit(1);
  }

  // Check API keys
  if (!process.env.BRAINTRUST_API_KEY) {
    console.error('❌ BRAINTRUST_API_KEY not found in .env.local');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }

  const wordsPath = path.join(__dirname, '../public/data/words.json');
  const embeddingsPath = path.join(__dirname, '../public/data/words-with-embeddings.json');
  
  // Read existing words
  let words: WordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  let wordsWithEmbeddings: WordData[] = [];
  try {
    wordsWithEmbeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
  } catch {
    // File might not exist yet
  }

  // Check if word already exists
  if (words.some(w => w.word === word)) {
    console.error(`❌ Error: Word "${word}" already exists in words.json`);
    process.exit(1);
  }

  // Create backup
  const backupPath = path.join(__dirname, '../public/data/backup/words-backup-' + Date.now() + '.json');
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.copyFileSync(wordsPath, backupPath);
  console.log(`✅ Created backup: ${path.relative(process.cwd(), backupPath)}\n`);

  try {
    // Step 1: Generate metadata
    console.log('📋 Step 1/3: Generating metadata...');
    const metadata = await generateMetadata(word, language);
    console.log('✅ Metadata generated\n');

    // Step 2: Generate pronunciation
    console.log('🔊 Step 2/3: Generating pronunciation...');
    const pronunciationFile = await generatePronunciation(word);
    console.log('✅ Pronunciation generated\n');

    // Create complete word object
    const completeWord: WordData = {
      word,
      language,
      sources: source,
      family: metadata.family,
      category: metadata.category,
      definition: metadata.definition,
      literal: metadata.literal,
      usage_notes: metadata.usage_notes,
      english_approx: metadata.english_approx,
      phonetic: metadata.phonetic,
      pronunciation: pronunciationFile,
    };

    // Step 3: Generate embedding
    console.log('🤖 Step 3/3: Generating embedding...');
    const { embedding, hash } = await generateEmbedding(completeWord);
    console.log('✅ Embedding generated\n');

    // Add to words.json
    words.push(completeWord);
    fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));

    // Add to words-with-embeddings.json
    wordsWithEmbeddings.push({
      ...completeWord,
      embedding,
      embeddingHash: hash,
    });
    fs.writeFileSync(embeddingsPath, JSON.stringify(wordsWithEmbeddings, null, 2));

    console.log('✨ All generation complete!\n');

    // Delete backup after successful completion
    fs.unlinkSync(backupPath);
    console.log('🗑️  Cleaned up backup file\n');

    // Prompt for commit
    console.log('📝 Ready to commit. Run:');
    console.log(`   git add .`);
    console.log(`   git commit -m "add ${word}"`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during generation:', error);
    console.error('\nRolling back changes...');
    fs.copyFileSync(backupPath, wordsPath);
    console.error('✅ Rolled back to backup');
    fs.unlinkSync(backupPath);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: npm run add-word -- <word> <language> <source>');
  console.error('Example: npm run add-word -- "jayus" "Indonesian" "https://example.com/source"');
  process.exit(1);
}

const [word, language, source] = args;

addWord(word, language, source);
