#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
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
  transliteration?: string;
  phonetic?: string;
  [key: string]: any;
}

interface GenerationResult {
  updated: number;
  phonetics: Record<string, string>;
}

// Helper function to get phonetic spelling using braintrust
async function getPhoneticFromBraintrust(word: string): Promise<string> {
  const result = await invoke({
    projectName: "lexiconic",
    slug: "generate-phonetic",
    input: { word },
    schema: z.string(),
  });
  return result;
}

/**
 * Get phonetic spelling for a single word using Braintrust
 */
async function getPhonetic(word: string, language: string): Promise<string | null> {
  try {
    const phonetic = await getPhoneticFromBraintrust(word);
    return phonetic;
  } catch (error) {
    console.error(`Error getting phonetic spelling for ${word} (${language}):`, (error as Error).message);
    return null;
  }
}


/**
 * Generate phonetic spellings for words missing them or all words
 */
async function generatePhonetics(forceAll: boolean = false): Promise<GenerationResult> {
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

  // Filter words that need processing
  const wordsToProcess = forceAll ? words : words.filter(word => 
    !word.phonetic ||
    word.phonetic.trim() === '' ||
    word.phonetic === '—' ||
    word.phonetic.startsWith('TODO:') ||
    word.phonetic.includes('[placeholder]')
  );

  if (wordsToProcess.length === 0) {
    console.log('→ All words already have phonetic spellings');
    fs.unlinkSync(backupPath);
    console.log('→ Deleted backup (no changes needed)');
    return { updated: 0, phonetics: {} };
  }

  console.log(`→ Processing ${wordsToProcess.length} phonetic spelling(s)${forceAll ? ' (all words)' : ' (missing only)'}`);

  const phonetics: Record<string, string> = {};
  let processedCount = 0;

  // Process each word
  for (const wordData of wordsToProcess) {
    processedCount++;
    console.log(`  • [${processedCount}/${wordsToProcess.length}] Generating: ${wordData.word}`);

    const phonetic = await getPhonetic(wordData.word, wordData.language);

    if (phonetic) {
      phonetics[wordData.word] = phonetic;
    } else {
      console.log(`   Error generating phonetic spelling for "${wordData.word}"`);
    }

    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update words.json file - add phonetic field and remove transliteration if it exists
  let updatedCount = 0;
  words.forEach(word => {
    if (phonetics.hasOwnProperty(word.word)) {
      word.phonetic = phonetics[word.word];
      // Remove the transliteration field if it exists
      if (word.transliteration) {
        delete word.transliteration;
      }
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    // Write updated data back
    fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
    console.log(`→ Generated ${updatedCount} phonetic spelling(s)`);
  }

  // Delete backup on success
  fs.unlinkSync(backupPath);
  console.log('→ Deleted backup (completed successfully)');

  return { updated: updatedCount, phonetics };
}

/**
 * Main function
 */
async function main(): Promise<GenerationResult> {
  try {
    const args = process.argv.slice(2);
    const forceAll = args.includes('--all');
    const result = await generatePhonetics(forceAll);
    return result;
  } catch (error) {
    console.error('   Error:', (error as Error).message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { getPhonetic, generatePhonetics };

// Run if called directly
if (require.main === module) {
  main();
}
