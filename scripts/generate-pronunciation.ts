#!/usr/bin/env npx tsx

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { WordDataWithoutEmbedding } from '../types/word';

// Load environment variables from .env.local
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
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

// Check if OPENAI_API_KEY is set
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables or .env.local');
  console.error('   Please add OPENAI_API_KEY=your_key_here to your .env.local file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use centralized types from /types/word.ts

// Generate a safe filename from a word
function generateAudioFileName(word: string): string {
  const hash = crypto.createHash('md5').update(word).digest('hex');
  return `${hash}.mp3`;
}

// Generate pronunciation for a single word
async function generatePronunciation(wordObj: WordDataWithoutEmbedding, outputPath: string): Promise<void> {
  try {
    // Use phonetic spelling if available, otherwise fall back to the word itself
    const input = wordObj.phonetic || wordObj.word;
    
    const mp3 = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: input,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    console.error(`   Error generating pronunciation for "${wordObj.word}":`, error);
    throw error;
  }
}

// Check if a word needs a pronunciation file
function needsPronunciation(word: WordDataWithoutEmbedding, pronunciationsDir: string): boolean {
  // If no pronunciation field, it needs one
  if (!word.pronunciation) {
    return true;
  }

  // If pronunciation field exists, check if the file actually exists
  const pronunciationPath = path.join(pronunciationsDir, word.pronunciation);
  return !existsSync(pronunciationPath);
}

// Main function to generate pronunciations for words that need them
async function generatePronunciations(forceAll = false) {
  try {
    // Read words from JSON
    const wordsPath = path.join(process.cwd(), 'public/data/words.json');
    const wordsContent = await fs.readFile(wordsPath, 'utf-8');
    const words: WordDataWithoutEmbedding[] = JSON.parse(wordsContent);

    // Create pronunciations directory if it doesn't exist
    const pronunciationsDir = path.join(process.cwd(), 'public/pronunciations');
    await fs.mkdir(pronunciationsDir, { recursive: true });

    // Create backup before modifying
    const backupPath = path.join(process.cwd(), 'public/data/backup/words-backup-' + Date.now() + '.json');
    const backupDir = path.dirname(backupPath);
    if (!existsSync(backupDir)) {
      await fs.mkdir(backupDir, { recursive: true });
    }
    await fs.copyFile(wordsPath, backupPath);
    console.log(`→ Created backup: ${path.relative(process.cwd(), backupPath)}`);

    // Find words that need pronunciations (all if forceAll, otherwise only missing)
    const wordsToProcess = forceAll 
      ? words 
      : words.filter(word => needsPronunciation(word, pronunciationsDir));

    if (wordsToProcess.length === 0) {
      console.log('→ All words already have pronunciations');
      // Delete backup if nothing to process
      await fs.unlink(backupPath);
      return;
    }

    console.log(`→ Processing ${wordsToProcess.length} pronunciation(s)${forceAll ? ' (--all mode)' : ''}`);

    let generatedCount = 0;
    let reusedCount = 0;

    // Generate pronunciations for words that need them
    for (const wordObj of wordsToProcess) {
      const fileName = generateAudioFileName(wordObj.word);
      const outputPath = path.join(pronunciationsDir, fileName);

      // In forceAll mode, regenerate everything. Otherwise, reuse if file exists
      const shouldReuse = !forceAll && wordObj.pronunciation === fileName && existsSync(outputPath);

      if (shouldReuse) {
        console.log(`  ✓ Using existing: ${wordObj.word}`);
        reusedCount++;
      } else {
        const inputInfo = wordObj.phonetic ? `${wordObj.word} (${wordObj.phonetic})` : wordObj.word;
        console.log(`  • Generating: ${inputInfo}`);
        await generatePronunciation(wordObj, outputPath);
        wordObj.pronunciation = fileName;
        generatedCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (generatedCount > 0) {
      // Write updated words back to JSON
      await fs.writeFile(wordsPath, JSON.stringify(words, null, 2));
      console.log(`→ Generated ${generatedCount} pronunciation(s)${reusedCount > 0 ? `, used ${reusedCount} existing` : ''}`);
    } else if (reusedCount > 0) {
      console.log(`→ Used ${reusedCount} existing pronunciation(s)`);
    }

    // Delete backup after successful completion
    await fs.unlink(backupPath);
  } catch (error) {
    console.error('Error generating pronunciations:', error);
    process.exit(1);
  }
}

// Run the script
const forceAll = process.argv.includes('--all');
generatePronunciations(forceAll);
