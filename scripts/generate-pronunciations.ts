#!/usr/bin/env npx tsx

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

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

interface Word {
  word: string;
  native_script: string;
  transliteration: string;
  language: string;
  [key: string]: any;
}

// Generate a safe filename from a word
function generateAudioFileName(word: string): string {
  // Create a hash of the word for the filename to avoid special character issues
  const hash = crypto.createHash('md5').update(word).digest('hex');
  return `${hash}.mp3`;
}

// Generate pronunciation for a single word
async function generatePronunciation(word: string, outputPath: string): Promise<void> {
  try {
    console.log(`Generating pronunciation for: ${word}`);

    const mp3 = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: word,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(outputPath, buffer);

    console.log(`✓ Saved pronunciation to: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to generate pronunciation for "${word}":`, error);
    throw error;
  }
}

// Main function to generate all pronunciations
async function generateAllPronunciations() {
  try {
    // Read words from JSON
    const wordsPath = path.join(process.cwd(), 'public/data/words.json');
    const wordsContent = await fs.readFile(wordsPath, 'utf-8');
    const words: Word[] = JSON.parse(wordsContent);

    // Create pronunciations directory if it doesn't exist
    const pronunciationsDir = path.join(process.cwd(), 'public/pronunciations');
    await fs.mkdir(pronunciationsDir, { recursive: true });

    console.log(`\nGenerating pronunciations for ${words.length} words...\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Generate pronunciations for each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const fileName = generateAudioFileName(word.word);
      const outputPath = path.join(pronunciationsDir, fileName);

      // Check if pronunciation field already exists and file exists
      if (word.pronunciation && word.pronunciation === fileName) {
        try {
          await fs.access(outputPath);
          console.log(`⊘ Skipping "${word.word}" (already exists)`);
          skippedCount++;
          continue;
        } catch {
          // File doesn't exist, regenerate it
        }
      }

      await generatePronunciation(word.word, outputPath);
      word.pronunciation = fileName;
      updatedCount++;

      // Add a small delay to avoid rate limiting
      if (i < words.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Write updated words back to JSON
    await fs.writeFile(wordsPath, JSON.stringify(words, null, 2));
    console.log(`\n✓ Updated words.json with pronunciation fields`);

    console.log(`\n✅ Successfully generated ${updatedCount} pronunciations`);
    console.log(`♻️  Skipped ${skippedCount} existing pronunciations`);
  } catch (error) {
    console.error('Error generating pronunciations:', error);
    process.exit(1);
  }
}

// Run the script
generateAllPronunciations();
