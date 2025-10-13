#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { initLogger, invoke } from 'braintrust';
import { z } from 'zod';
import dotenv from 'dotenv';
import type { PartialWordData, BraintrustMetadata } from '../types/word';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Braintrust logger
initLogger({
  projectName: "lexiconic",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

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
      slug: "generate-metadata",
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
function needsMetadata(word: PartialWordData): boolean {
  // A word needs metadata if any of the core fields don't exist or are empty
  const requiredFields = [
    'phonetic',
    'definition',
    'family',
    'category',
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
 * Generate metadata for words that don't have complete metadata
 * @param forceAll - If true, regenerate metadata for ALL words
 */
async function generateMetadataForAllWords(forceAll = false): Promise<GenerationResult> {
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

  const words: PartialWordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  // Find words that need metadata (all words if forceAll, otherwise only missing metadata)
  const wordsToProcess = forceAll ? words : words.filter(word => needsMetadata(word));

  if (wordsToProcess.length === 0) {
    console.log('→ All words already have complete metadata');
    // Delete backup if nothing to process
    fs.unlinkSync(backupPath);
    return { updated: 0, metadata: {} };
  }

  console.log(`→ Processing ${wordsToProcess.length} word(s) to generate metadata${forceAll ? ' (--all mode)' : ''}`);

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

  // Delete backup after successful completion
  fs.unlinkSync(backupPath);

  return { updated: updatedCount, metadata };
}

/**
 * Main function
 */
async function main(): Promise<GenerationResult> {
  try {
    // Check for --all flag
    const forceAll = process.argv.includes('--all');
    const result = await generateMetadataForAllWords(forceAll);
    return result;
  } catch (error) {
    console.error('   Error:', (error as Error).message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { getMetadataFromBraintrust, generateMetadataForAllWords };

// Run if called directly
if (require.main === module) {
  main();
}
