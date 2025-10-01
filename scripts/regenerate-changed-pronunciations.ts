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

interface Word {
  word: string;
  native_script: string;
  transliteration: string;
  language: string;
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
    console.log(`Regenerating pronunciation for: ${word}`);

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

// Get changed words from git diff
function getChangedWords(): string[] {
  try {
    // Get the diff of words.json in the last commit
    const diff = execSync('git diff HEAD~1 HEAD -- public/data/words.json', {
      encoding: 'utf-8',
    });

    if (!diff) {
      console.log('No changes to words.json');
      return [];
    }

    // Parse the diff to find changed "word" fields
    const changedWords: Set<string> = new Set();
    const lines = diff.split('\n');

    for (const line of lines) {
      // Look for lines that added or modified a "word" field
      if ((line.startsWith('+') || line.startsWith('-')) && line.includes('"word"')) {
        const match = line.match(/"word":\s*"([^"]+)"/);
        if (match && match[1]) {
          changedWords.add(match[1]);
        }
      }
    }

    return Array.from(changedWords);
  } catch (error) {
    console.error('Error getting git diff:', error);
    return [];
  }
}

// Main function to regenerate pronunciations for changed words
async function regenerateChangedPronunciations() {
  try {
    const changedWords = getChangedWords();

    if (changedWords.length === 0) {
      console.log('No word changes detected, skipping pronunciation regeneration.');
      return;
    }

    console.log(`\nDetected ${changedWords.length} changed words:\n${changedWords.join(', ')}\n`);

    // Create pronunciations directory if it doesn't exist
    const pronunciationsDir = path.join(process.cwd(), 'public/pronunciations');
    await fs.mkdir(pronunciationsDir, { recursive: true });

    // Load existing mapping
    const mappingPath = path.join(pronunciationsDir, 'mapping.json');
    let mapping: Record<string, string> = {};
    try {
      const mappingContent = await fs.readFile(mappingPath, 'utf-8');
      mapping = JSON.parse(mappingContent);
    } catch {
      console.log('No existing mapping found, will create new one');
    }

    // Regenerate pronunciations for changed words
    for (const word of changedWords) {
      const fileName = generateAudioFileName(word);
      const outputPath = path.join(pronunciationsDir, fileName);

      await generatePronunciation(word, outputPath);
      mapping[word] = fileName;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Save updated mapping
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`\n✓ Updated pronunciation mapping`);

    console.log(`\n✅ Successfully regenerated ${changedWords.length} pronunciations`);
  } catch (error) {
    console.error('Error regenerating pronunciations:', error);
    process.exit(1);
  }
}

// Run the script
regenerateChangedPronunciations();
