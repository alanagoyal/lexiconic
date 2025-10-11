#!/usr/bin/env npx tsx

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

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

// Minimal word interface for pronunciation generation
// This script only needs these specific fields
interface Word {
  word: string;
  transliteration: string;
  language: string;
  pronunciation?: string;
  [key: string]: any;
}

// Generate a safe filename from a word
function generateAudioFileName(word: string): string {
  const hash = crypto.createHash('md5').update(word).digest('hex');
  return `${hash}.mp3`;
}

// Generate pronunciation for a single word
async function generatePronunciation(word: string, outputPath: string): Promise<void> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: word,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    console.error(`   Error generating pronunciation for "${word}":`, error);
    throw error;
  }
}

// Get new or changed words from git diff
function getNewOrChangedWords(): string[] {
  try {
    // Get the diff of words.json in the last commit
    const diff = execSync('git diff HEAD~1 HEAD -- public/data/words.json', {
      encoding: 'utf-8',
    });

    if (!diff) {
      console.log('No changes to words.json detected');
      return [];
    }

    // Parse the diff to find new or changed words
    const newOrChangedWords: Set<string> = new Set();
    const lines = diff.split('\n');

    for (const line of lines) {
      // Look for added lines with "word" field (new or changed entries)
      if (line.startsWith('+') && line.includes('"word"')) {
        const match = line.match(/"word":\s*"([^"]+)"/);
        if (match && match[1]) {
          newOrChangedWords.add(match[1]);
        }
      }
    }

    return Array.from(newOrChangedWords);
  } catch (error) {
    console.error('Error getting git diff:', error);
    return [];
  }
}

// Main function to generate pronunciations for new or changed words
async function generatePronunciationsForChangedWords() {
  try {
    const changedWords = getNewOrChangedWords();

    if (changedWords.length === 0) {
      console.log('→ No new or changed words detected');
      return;
    }

    console.log(`→ Processing ${changedWords.length} pronunciation(s)`);

    // Read words from JSON
    const wordsPath = path.join(process.cwd(), 'public/data/words.json');
    const wordsContent = await fs.readFile(wordsPath, 'utf-8');
    const words: Word[] = JSON.parse(wordsContent);

    // Create pronunciations directory if it doesn't exist
    const pronunciationsDir = path.join(process.cwd(), 'public/pronunciations');
    await fs.mkdir(pronunciationsDir, { recursive: true });

    let updatedCount = 0;
    let skippedCount = 0;

    // Generate pronunciations for changed words
    for (const changedWord of changedWords) {
      const wordObj = words.find(w => w.word === changedWord);
      if (!wordObj) {
        console.log(`   Warning: "${changedWord}" not found in words.json`);
        continue;
      }

      const fileName = generateAudioFileName(changedWord);
      const outputPath = path.join(pronunciationsDir, fileName);

      // Check if pronunciation already exists and is up to date
      if (wordObj.pronunciation === fileName) {
        try {
          await fs.access(outputPath);
          console.log(`  ✓ Using existing: ${changedWord}`);
          skippedCount++;
          continue;
        } catch {
          // File doesn't exist, regenerate it
        }
      }

      console.log(`  • Generating: ${changedWord}`);
      await generatePronunciation(changedWord, outputPath);
      wordObj.pronunciation = fileName;
      updatedCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (updatedCount > 0) {
      // Write updated words back to JSON
      await fs.writeFile(wordsPath, JSON.stringify(words, null, 2));
      console.log(`→ Generated ${updatedCount} pronunciation(s), used ${skippedCount} existing`);
    } else if (skippedCount > 0) {
      console.log(`→ Used ${skippedCount} existing pronunciation(s)`);
    }
  } catch (error) {
    console.error('Error generating pronunciations:', error);
    process.exit(1);
  }
}

// Run the script
generatePronunciationsForChangedWords();
