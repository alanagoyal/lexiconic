#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { initLogger, invoke } from 'braintrust';
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
  location?: string;
  [key: string]: any;
}

/**
 * Get location for a single word using Braintrust
 */
async function getLocationFromBraintrust(word: string, language: string): Promise<string | null> {
  try {
    const result = await invoke({
      projectName: "lexiconic",
      slug: "generate-location-7320",
      input: { word, language },
    });
    
    // Handle different result types
    if (typeof result === 'string') {
      return result.trim();
    }
    
    // If result is an object, try to extract the location field
    if (typeof result === 'object' && result !== null) {
      // Try common field names
      if ('location' in result && typeof result.location === 'string') {
        return result.location.trim();
      }
      // Try parsing as JSON string if it's stringified
      try {
        const parsed = JSON.parse(JSON.stringify(result));
        if (parsed.location) {
          return parsed.location.trim();
        }
      } catch {
        // If parsing fails, just continue
      }
      console.error(`Object result for ${word} does not contain 'location' field:`, result);
      return null;
    }
    
    console.error(`Unexpected result type for ${word}:`, typeof result);
    return null;
  } catch (error) {
    console.error(`Error getting location for ${word} (${language}):`, (error as Error).message);
    return null;
  }
}

/**
 * Generate locations for all words
 */
async function generateLocations() {
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

  // Filter words that don't already have a location
  const wordsToProcess = words.filter(word => !word.location || word.location.trim() === '');

  if (wordsToProcess.length === 0) {
    console.log('→ All words already have locations');
    return;
  }

  console.log(`→ Processing ${wordsToProcess.length} word(s) to generate locations`);

  let processedCount = 0;
  let successCount = 0;

  // Process each word
  for (const wordData of wordsToProcess) {
    processedCount++;
    console.log(`  • [${processedCount}/${wordsToProcess.length}] Generating location for: ${wordData.word}`);

    const location = await getLocationFromBraintrust(wordData.word, wordData.language);

    if (location) {
      wordData.location = location;
      successCount++;
      console.log(`    ✓ Location: ${location}`);
    } else {
      console.log(`    ✗ Failed to generate location`);
    }

    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Write updated data back
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
  console.log(`→ Successfully generated locations for ${successCount}/${wordsToProcess.length} word(s)`);
  
  if (successCount < wordsToProcess.length) {
    console.log(`⚠️  ${wordsToProcess.length - successCount} word(s) failed to generate locations`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await generateLocations();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
