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
 * Find words that need definitions (empty, placeholder, or forced regeneration)
 */
function findWordsNeedingDefinitions(forceRegenerate = false) {
  const wordsPath = path.join(__dirname, '../public/data/words.json');
  const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  
  return words.filter(word => {
    if (forceRegenerate) return true;
    
    // Check if definition is missing, empty, or contains placeholder text
    const definition = word.definition;
    return !definition || 
           definition.trim() === '' || 
           definition.includes('Literally, "—"') ||
           definition === '—' ||
           definition.startsWith('TODO:') ||
           definition.includes('[placeholder]');
  });
}

/**
 * Generate definitions for all words that need them
 * @param {boolean} forceRegenerate - If true, regenerate all definitions
 */
async function generateAllDefinitions(forceRegenerate = false) {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    throw new Error('BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }

  const wordsNeeding = findWordsNeedingDefinitions(forceRegenerate);
  
  if (wordsNeeding.length === 0) {
    console.log('✅ All words already have definitions');
    return { updated: 0, definitions: {} };
  }

  const action = forceRegenerate ? 'Regenerating' : 'Generating';
  console.log(`🤖 ${action} definitions for ${wordsNeeding.length} words using Braintrust...\n`);
  
  const definitions = {};
  
  // Process each word
  for (const wordData of wordsNeeding) {
    console.log(`Processing: ${wordData.word} (${wordData.language})`);
    
    const definition = await getDefinition(
      wordData.word,
      wordData.language
    );
    
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
  const wordsPath = path.join(__dirname, '../public/data/words.json');
  const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  
  let updatedCount = 0;
  words.forEach(word => {
    if (definitions.hasOwnProperty(word.word)) {
      word.definition = definitions[word.word];
      updatedCount++;
    }
  });
  
  // Write updated data back
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
  
  console.log(`✅ Successfully updated ${updatedCount} words with definitions`);
  
  return { updated: updatedCount, definitions };
}

/**
 * Main function
 */
async function main() {
  try {
    // Check for force regenerate flag
    const forceRegenerate = process.argv.includes('--force') || process.argv.includes('-f');
    const result = await generateAllDefinitions(forceRegenerate);
    
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
module.exports = { getDefinition, generateAllDefinitions };

// Run if called directly
if (require.main === module) {
  main();
}
