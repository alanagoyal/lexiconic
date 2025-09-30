const fs = require('fs');
const path = require('path');
const { initLogger, invoke } = require('braintrust');
const { z } = require('zod');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Braintrust logger
initLogger({
  projectName: "lexiconic",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

// Helper function to clean definition using braintrust
async function cleanDefinition(definition) {
  const result = await invoke({
    projectName: "lexiconic",
    slug: "clean-definition-6423",
    input: { definition },
    schema: z.string(),
  });
  return result;
}

/**
 * Get cleaned definition for a single word using Braintrust
 */
async function getCleanedDefinition(originalDefinition, word) {
  try {
    const cleanedDefinition = await cleanDefinition(originalDefinition);
    return cleanedDefinition;
  } catch (error) {
    console.error(`Error cleaning definition for ${word}:`, error.message);
    return null;
  }
}

/**
 * Clean definitions for all words
 * @param {boolean} forceRegenerate - If true, regenerate all definitions
 */
async function cleanAllDefinitions(forceRegenerate = false) {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    throw new Error('BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }

  // Load words data
  const wordsPath = path.join(__dirname, '../public/data/words.json');
  const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  
  // Filter words that need definition cleaning
  const wordsToProcess = forceRegenerate ? words : words.filter(word => 
    word.definition && word.definition.trim() !== ''
  );
  
  if (wordsToProcess.length === 0) {
    console.log('✅ No words found to process');
    return { updated: 0, cleanedDefinitions: {} };
  }

  const action = forceRegenerate ? 'Regenerating' : 'Cleaning';
  console.log(`🤖 ${action} definitions for ${wordsToProcess.length} words using Braintrust...\n`);
  
  const cleanedDefinitions = {};
  let processedCount = 0;
  
  // Process each word
  for (const wordData of wordsToProcess) {
    processedCount++;
    console.log(`Processing ${processedCount}/${wordsToProcess.length}: ${wordData.word} (${wordData.language})`);
    
    if (!wordData.definition || wordData.definition.trim() === '') {
      console.log(`⚠️ Skipping - no definition found\n`);
      continue;
    }
    
    const cleanedDefinition = await getCleanedDefinition(
      wordData.definition,
      wordData.word
    );
    
    if (cleanedDefinition) {
      cleanedDefinitions[wordData.word] = cleanedDefinition;
      console.log(`✓ Original: ${wordData.definition.substring(0, 100)}${wordData.definition.length > 100 ? '...' : ''}`);
      console.log(`✓ Cleaned:  ${cleanedDefinition.substring(0, 100)}${cleanedDefinition.length > 100 ? '...' : ''}\n`);
    } else {
      console.log(`✗ Failed to clean definition\n`);
    }
    
    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Update words.json file
  let updatedCount = 0;
  words.forEach(word => {
    if (cleanedDefinitions.hasOwnProperty(word.word)) {
      word.definition = cleanedDefinitions[word.word];
      updatedCount++;
    }
  });
  
  // Write updated data back
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
  
  console.log(`✅ Successfully updated ${updatedCount} words with cleaned definitions`);
  
  return { updated: updatedCount, cleanedDefinitions };
}

/**
 * Main function
 */
async function main() {
  try {
    // Check for force regenerate flag
    const forceRegenerate = process.argv.includes('--force') || process.argv.includes('-f');
    const result = await cleanAllDefinitions(forceRegenerate);
    
    if (result.updated > 0) {
      console.log(`\n📝 Updated ${result.updated} definitions in words.json`);
      console.log('💡 You may want to commit these changes');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { getCleanedDefinition, cleanAllDefinitions };

// Run if called directly
if (require.main === module) {
  main();
}
