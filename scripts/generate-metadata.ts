#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { initLogger, invoke } from 'braintrust';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Braintrust logger
initLogger({
  projectName: "lexiconic",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

interface WordData {
  word: string;
  language: string;
  native_script?: string;
  family?: string;
  category?: string;
  definition?: string;
  literal?: string;
  usage_notes?: string;
  english_approx?: string;
  phonetic?: string;
  pronunciation?: string;
  sources?: string;
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
  location: string;
  lat: number;
  lng: number;
}

interface GenerationResult {
  updated: number;
  metadata: Record<string, BraintrustMetadata>;
}

// Schema for the Braintrust metadata response
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
  location: z.string(),
  lat: z.number(),
  lng: z.number(),
});

/**
 * Get metadata for a single word using Braintrust
 */
async function getMetadataFromBraintrust(word: string, language: string): Promise<BraintrustMetadata | null> {
  try {
    // First try without schema validation to see what we get back
    const result = await invoke({
      projectName: "lexiconic",
      slug: "generate-metadata-4263",
      input: { word, language },
    });
    
    // If result is a string, parse it as JSON
    let metadata = result;
    if (typeof result === 'string') {
      try {
        metadata = JSON.parse(result);
      } catch (parseError) {
        console.error(`Failed to parse JSON response for ${word}:`, result);
        return null;
      }
    }
    
    // Validate the parsed metadata
    const validated = metadataSchema.parse(metadata);
    return validated as BraintrustMetadata;
  } catch (error) {
    console.error(`Error getting metadata for ${word} (${language}):`, (error as Error).message);
    return null;
  }
}

/**
 * Check if a word needs metadata generation
 */
function needsMetadata(word: WordData): boolean {
  // A word needs metadata if any of the core fields don't exist or are empty
  const requiredFields = [
    'phonetic',
    'definition',
    'family',
    'category',
    'literal',
    'usage_notes',
    'english_approx',
    'location',
    'lat',
    'lng'
  ];

  for (const field of requiredFields) {
    const value = word[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return true;
    }
  }

  return false;
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
 * Generate metadata for ALL words that don't have complete metadata
 */
async function generateMetadataForAllWords(): Promise<GenerationResult> {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    console.error('❌ BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
    process.exit(1);
  }

  const wordsPath = path.join(__dirname, '../public/data/words.json');
  
  // Create backup before modifying
  const backupPath = path.join(__dirname, '../public/data/backup/words-backup-' + Date.now() + '.json');
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.copyFileSync(wordsPath, backupPath);
  console.log(`→ Created backup: ${path.relative(process.cwd(), backupPath)}`);

  const words: WordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  // Find ALL words that need metadata
  const wordsToProcess = words.filter(word => needsMetadata(word));

  if (wordsToProcess.length === 0) {
    console.log('→ All words already have complete metadata');
    return { updated: 0, metadata: {} };
  }

  console.log(`→ Processing ${wordsToProcess.length} word(s) to generate metadata`);

  const metadata: Record<string, BraintrustMetadata> = {};
  let processedCount = 0;

  // Process each word
  for (const wordData of wordsToProcess) {
    processedCount++;
    console.log(`  • [${processedCount}/${wordsToProcess.length}] Generating metadata for: ${wordData.word}`);

    const metadataResult = await getMetadataFromBraintrust(wordData.word, wordData.language);

    if (metadataResult) {
      metadata[wordData.word] = metadataResult;
    } else {
      console.log(`   Error generating metadata for "${wordData.word}"`);
    }

    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update words.json file with all metadata fields
  let updatedCount = 0;
  words.forEach(word => {
    if (metadata.hasOwnProperty(word.word)) {
      const meta = metadata[word.word];
      // Update all fields from the metadata
      word.family = meta.family;
      word.category = meta.category;
      word.definition = meta.definition;
      word.literal = meta.literal;
      word.usage_notes = meta.usage_notes;
      word.english_approx = meta.english_approx;
      word.phonetic = meta.phonetic;
      word.location = meta.location;
      word.lat = meta.lat;
      word.lng = meta.lng;
      
      // Remove transliteration field if it exists (replaced by phonetic)
      if (word.transliteration) {
        delete word.transliteration;
      }
      
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    // Write updated data back
    fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
    console.log(`→ Generated metadata for ${updatedCount} word(s)`);
  }

  return { updated: updatedCount, metadata };
}

/**
 * Generate metadata for new words detected in the last commit
 */
async function generateMetadataForNewWords(): Promise<GenerationResult> {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    console.error('❌ BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
    process.exit(1);
  }

  const newWords = getNewWords();

  if (newWords.length === 0) {
    console.log('→ No new or changed words detected');
    return { updated: 0, metadata: {} };
  }

  console.log(`→ Processing ${newWords.length} word(s) for metadata`);

  const wordsPath = path.join(__dirname, '../public/data/words.json');
  
  // Create backup before modifying
  const backupPath = path.join(__dirname, '../public/data/backup/words-backup-' + Date.now() + '.json');
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.copyFileSync(wordsPath, backupPath);
  console.log(`→ Created backup: ${path.relative(process.cwd(), backupPath)}`);

  const words: WordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  const metadata: Record<string, BraintrustMetadata> = {};

  // Process each new word
  for (const newWord of newWords) {
    const wordData = words.find(w => w.word === newWord);
    if (!wordData) {
      console.log(`   Warning: "${newWord}" not found in words.json`);
      continue;
    }

    // Check if word needs metadata
    if (!needsMetadata(wordData)) {
      console.log(`  ✓ Using existing: ${newWord}`);
      continue;
    }

    console.log(`  • Generating: ${wordData.word}`);

    const metadataResult = await getMetadataFromBraintrust(wordData.word, wordData.language);

    if (metadataResult) {
      metadata[wordData.word] = metadataResult;
    } else {
      console.log(`   Error generating metadata for "${wordData.word}"`);
    }

    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update words.json file with all metadata fields
  let updatedCount = 0;
  words.forEach(word => {
    if (metadata.hasOwnProperty(word.word)) {
      const meta = metadata[word.word];
      // Update all fields from the metadata
      word.family = meta.family;
      word.category = meta.category;
      word.definition = meta.definition;
      word.literal = meta.literal;
      word.usage_notes = meta.usage_notes;
      word.english_approx = meta.english_approx;
      word.phonetic = meta.phonetic;
      word.location = meta.location;
      word.lat = meta.lat;
      word.lng = meta.lng;
      
      // Remove transliteration field if it exists (replaced by phonetic)
      if (word.transliteration) {
        delete word.transliteration;
      }
      
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    // Write updated data back
    fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
    const skippedCount = newWords.length - updatedCount;
    if (skippedCount > 0) {
      console.log(`→ Generated metadata for ${updatedCount} word(s), used ${skippedCount} existing`);
    } else {
      console.log(`→ Generated metadata for ${updatedCount} word(s)`);
    }
  }

  return { updated: updatedCount, metadata };
}

/**
 * Main function
 */
async function main(): Promise<GenerationResult> {
  try {
    // Check if we should process all words or just new words
    const args = process.argv.slice(2);
    if (args.includes('--all-words')) {
      const result = await generateMetadataForAllWords();
      return result;
    } else {
      const result = await generateMetadataForNewWords();
      return result;
    }
  } catch (error) {
    console.error('   Error:', (error as Error).message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { getMetadataFromBraintrust, generateMetadataForNewWords, generateMetadataForAllWords };

// Run if called directly
if (require.main === module) {
  main();
}
