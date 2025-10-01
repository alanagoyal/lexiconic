#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { initLogger, invoke } = require('braintrust');
const { z } = require('zod');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Braintrust logger
initLogger({
  projectName: "lexiconic",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

// Helper function to get definition using braintrust
async function getDefinitionFromBraintrust(word, language) {
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
async function getDefinition(word, language) {
  try {
    const definition = await getDefinitionFromBraintrust(word, language);
    return definition;
  } catch (error) {
    console.error(`Error getting definition for ${word} (${language}):`, error.message);
    return null;
  }
}

/**
 * Get new words from git diff
 */
function getNewWords() {
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
    const newWords = new Set();
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
 * Generate definitions for new words detected in the last commit
 */
async function generateDefinitionsForNewWords() {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    console.error('❌ BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
    process.exit(1);
  }

  const newWords = getNewWords();

  if (newWords.length === 0) {
    console.log('No new words detected, skipping definition generation.');
    return { updated: 0, definitions: {} };
  }

  console.log(`🤖 Generating definitions for ${newWords.length} new words using Braintrust...\n`);

  const wordsPath = path.join(__dirname, '../public/data/words.json');
  const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  const definitions = {};

  // Process each new word
  for (const newWord of newWords) {
    const wordData = words.find(w => w.word === newWord);
    if (!wordData) {
      console.log(`⚠️  Word "${newWord}" not found in words.json`);
      continue;
    }

    // Skip if word already has a definition
    if (wordData.definition &&
        wordData.definition.trim() !== '' &&
        wordData.definition !== '—' &&
        !wordData.definition.startsWith('TODO:') &&
        !wordData.definition.includes('[placeholder]') &&
        !wordData.definition.includes('Literally, "—"')) {
      console.log(`⊘ Skipping "${newWord}" (already has definition)`);
      continue;
    }

    console.log(`Processing: ${wordData.word} (${wordData.language})`);

    const definition = await getDefinition(wordData.word, wordData.language);

    if (definition) {
      definitions[wordData.word] = definition;
      console.log(`✓ ${definition.substring(0, 100)}${definition.length > 100 ? '...' : ''}\n`);
    } else {
      console.log(`✗ Failed\n`);
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
    console.log(`✅ Successfully updated ${updatedCount} words with definitions`);
  }

  return { updated: updatedCount, definitions };
}

/**
 * Main function
 */
async function main() {
  try {
    const result = await generateDefinitionsForNewWords();

    if (result.updated > 0) {
      console.log(`\n📝 Updated ${result.updated} definitions in words.json`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { getDefinition, generateDefinitionsForNewWords };

// Run if called directly
if (require.main === module) {
  main();
}
