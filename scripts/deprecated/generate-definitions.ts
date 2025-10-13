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
  definition?: string;
}

interface GenerationResult {
  updated: number;
  definitions: Record<string, string>;
}

// Helper function to get definition using braintrust
async function getDefinitionFromBraintrust(word: string, language: string): Promise<string> {
  const result = await invoke({
    projectName: "lexiconic",
    slug: "translate-3bf0",
    input: { word, language },
    schema: z.string(),
  });
  return result;
}

/**
 * Get definition for a single word using Braintrust
 */
async function getDefinition(word: string, language: string): Promise<string | null> {
  try {
    const definition = await getDefinitionFromBraintrust(word, language);
    return definition;
  } catch (error) {
    console.error(`Error getting definition for ${word} (${language}):`, (error as Error).message);
    return null;
  }
}


/**
 * Generate definitions for words missing them or all words
 */
async function generateDefinitions(forceAll: boolean = false): Promise<GenerationResult> {
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
    !word.definition ||
    word.definition.trim() === '' ||
    word.definition === '—' ||
    word.definition.startsWith('TODO:') ||
    word.definition.includes('[placeholder]') ||
    word.definition.includes('Literally, "—"')
  );

  if (wordsToProcess.length === 0) {
    console.log('→ All words already have definitions');
    fs.unlinkSync(backupPath);
    console.log('→ Deleted backup (no changes needed)');
    return { updated: 0, definitions: {} };
  }

  console.log(`→ Processing ${wordsToProcess.length} definition(s)${forceAll ? ' (all words)' : ' (missing only)'}`);

  const definitions: Record<string, string> = {};
  let processedCount = 0;

  // Process each word
  for (const wordData of wordsToProcess) {
    processedCount++;
    console.log(`  • [${processedCount}/${wordsToProcess.length}] Generating: ${wordData.word}`);

    const definition = await getDefinition(wordData.word, wordData.language);

    if (definition) {
      definitions[wordData.word] = definition;
    } else {
      console.log(`   Error generating definition for "${wordData.word}"`);
    }

    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update words.json file
  let updatedCount = 0;
  words.forEach(word => {
    if (definitions.hasOwnProperty(word.word)) {
      word.definition = definitions[word.word];
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    // Write updated data back
    fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
    console.log(`→ Generated ${updatedCount} definition(s)`);
  }

  // Delete backup on success
  fs.unlinkSync(backupPath);
  console.log('→ Deleted backup (completed successfully)');

  return { updated: updatedCount, definitions };
}

/**
 * Main function
 */
async function main(): Promise<GenerationResult> {
  try {
    const args = process.argv.slice(2);
    const forceAll = args.includes('--all');
    const result = await generateDefinitions(forceAll);
    return result;
  } catch (error) {
    console.error('   Error:', (error as Error).message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { getDefinition, generateDefinitions };

// Run if called directly
if (require.main === module) {
  main();
}
