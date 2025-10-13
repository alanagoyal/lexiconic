#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { initLogger, invoke } from 'braintrust';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Initialize Braintrust logger
initLogger({
  projectName: "lexiconic",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

interface WordData {
  word: string;
  language: string;
  usage_notes?: string;
}

interface GenerationResult {
  updated: number;
  usageNotes: Record<string, string>;
}

// Helper function to get usage notes using braintrust
async function getUsageNotesFromBraintrust(word: string, language: string): Promise<string> {
  const result = await invoke({
    projectName: "lexiconic",
    slug: "generate-usage-note",
    input: { word, language },
    schema: z.string(),
  });
  return result;
}

/**
 * Get usage notes for a single word using Braintrust
 */
async function getUsageNotes(word: string, language: string): Promise<string | null> {
  try {
    const usageNotes = await getUsageNotesFromBraintrust(word, language);
    return usageNotes;
  } catch (error) {
    console.error(`Error getting usage notes for ${word} (${language}):`, (error as Error).message);
    return null;
  }
}

/**
 * Get new words from git diff
 */
function getNewWords(): string[] {
  try {
    // Get the diff of words.json in the last commit
    const diff = execSync('git diff HEAD~1 HEAD -- public/data/words.json', {
      encoding: 'utf-8',
    });

    if (!diff) {
      console.log('No changes to words.json detected');
      return [];
    }

    // Parse the diff to find new words (added entries)
    const newWords = new Set<string>();
    const lines = diff.split('\n');

    for (const line of lines) {
      // Look for added lines with "word" field
      if (line.startsWith('+') && line.includes('"word"')) {
        const match = line.match(/"word":\s*"([^"]+)"/);
        if (match && match[1]) {
          newWords.add(match[1]);
        }
      }
    }

    return Array.from(newWords);
  } catch (error) {
    console.error('Error getting git diff:', error);
    return [];
  }
}

/**
 * Generate usage notes for ALL words
 */
async function generateUsageNotesForAllWords(): Promise<GenerationResult> {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    console.error('❌ BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
    process.exit(1);
  }

  const wordsPath = path.join(__dirname, '../../public/data/words.json');
  
  // Create backup before modifying
  const backupPath = path.join(__dirname, '../../public/data/backup/words-backup-' + Date.now() + '.json');
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.copyFileSync(wordsPath, backupPath);
  console.log(`→ Created backup: ${path.relative(process.cwd(), backupPath)}`);

  const words: WordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  // Process ALL words (force regeneration)
  const wordsToProcess = words;

  console.log(`→ Processing ${wordsToProcess.length} word(s) to generate usage notes`);

  const usageNotes: Record<string, string> = {};
  let processedCount = 0;

  // Process each word
  for (const wordData of wordsToProcess) {
    processedCount++;
    console.log(`  • [${processedCount}/${wordsToProcess.length}] Generating usage notes for: ${wordData.word}`);

    const notes = await getUsageNotes(wordData.word, wordData.language);

    if (notes) {
      usageNotes[wordData.word] = notes;
    } else {
      console.log(`   Error generating usage notes for "${wordData.word}"`);
    }

    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update words.json file - add usage_notes field
  let updatedCount = 0;
  words.forEach(word => {
    if (usageNotes.hasOwnProperty(word.word)) {
      word.usage_notes = usageNotes[word.word];
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    // Write updated data back
    fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
    console.log(`→ Generated ${updatedCount} usage note(s)`);
  }

  return { updated: updatedCount, usageNotes };
}

/**
 * Generate usage notes for new words detected in the last commit
 */
async function generateUsageNotesForNewWords(): Promise<GenerationResult> {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    console.error('❌ BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
    process.exit(1);
  }

  const newWords = getNewWords();

  if (newWords.length === 0) {
    console.log('→ No new or changed words detected');
    return { updated: 0, usageNotes: {} };
  }

  console.log(`→ Processing ${newWords.length} usage note(s)`);

  const wordsPath = path.join(__dirname, '../../public/data/words.json');
  
  // Create backup before modifying
  const backupPath = path.join(__dirname, '../../public/data/backup/words-backup-' + Date.now() + '.json');
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.copyFileSync(wordsPath, backupPath);
  console.log(`→ Created backup: ${path.relative(process.cwd(), backupPath)}`);

  const words: WordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  const usageNotes: Record<string, string> = {};

  // Process each new word
  for (const newWord of newWords) {
    const wordData = words.find(w => w.word === newWord);
    if (!wordData) {
      console.log(`   Warning: "${newWord}" not found in words.json`);
      continue;
    }

    // Skip if word already has usage notes
    if (wordData.usage_notes &&
        wordData.usage_notes.trim() !== '' &&
        !wordData.usage_notes.startsWith('TODO:') &&
        !wordData.usage_notes.includes('[placeholder]')) {
      console.log(`  ✓ Using existing: ${newWord}`);
      continue;
    }

    console.log(`  • Generating: ${wordData.word}`);

    const notes = await getUsageNotes(wordData.word, wordData.language);

    if (notes) {
      usageNotes[wordData.word] = notes;
    } else {
      console.log(`   Error generating usage notes for "${wordData.word}"`);
    }

    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update words.json file
  let updatedCount = 0;
  words.forEach(word => {
    if (usageNotes.hasOwnProperty(word.word)) {
      word.usage_notes = usageNotes[word.word];
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    // Write updated data back
    fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
    const skippedCount = newWords.length - updatedCount;
    if (skippedCount > 0) {
      console.log(`→ Generated ${updatedCount} usage note(s), used ${skippedCount} existing`);
    } else {
      console.log(`→ Generated ${updatedCount} usage note(s)`);
    }
  }

  return { updated: updatedCount, usageNotes };
}

/**
 * Main function
 */
async function main(): Promise<GenerationResult> {
  try {
    // Check if we should process all words or just new words
    const args = process.argv.slice(2);
    if (args.includes('--all-words')) {
      const result = await generateUsageNotesForAllWords();
      return result;
    } else {
      const result = await generateUsageNotesForNewWords();
      return result;
    }
  } catch (error) {
    console.error('   Error:', (error as Error).message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { getUsageNotes, generateUsageNotesForNewWords, generateUsageNotesForAllWords };

// Run if called directly
if (require.main === module) {
  main();
}
