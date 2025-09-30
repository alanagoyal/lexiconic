const fs = require('fs');
const path = require('path');
const { findWordsNeedingTransliterations, findAllNonLatinWords } = require('./check-transliterations');
const { initLogger, invoke } = require('braintrust');
const { z } = require('zod');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Braintrust logger
initLogger({
  projectName: "lexiconic",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

// Helper function to transliterate word using braintrust
async function transliterateWord(word) {
  const result = await invoke({
    projectName: "lexiconic",
    slug: "transliterate-word-96ce",
    input: { word },
    schema: z.object({
      transliteration: z.string()
    }),
  });
  return result.transliteration;
}

/**
 * Get transliteration for a single word using Braintrust
 */
async function getTransliteration(word, nativeScript, language) {
  try {
    const transliteration = await transliterateWord(word);
    return transliteration;
  } catch (error) {
    console.error(`Error getting transliteration for ${word}:`, error.message);
    return null;
  }
}

/**
 * Generate transliterations for all words that need them
 * @param {boolean} forceRegenerate - If true, regenerate all transliterations for non-Latin words
 */
async function generateAllTransliterations(forceRegenerate = false) {
  // Check if Braintrust API key is set
  if (!process.env.BRAINTRUST_API_KEY) {
    throw new Error('BRAINTRUST_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }

  const wordsNeeding = forceRegenerate ? findAllNonLatinWords() : findWordsNeedingTransliterations();
  
  if (wordsNeeding.length === 0) {
    console.log('✅ All words already have transliterations');
    return { updated: 0, transliterations: {} };
  }

  const action = forceRegenerate ? 'Regenerating' : 'Generating';
  console.log(`🤖 ${action} transliterations for ${wordsNeeding.length} words using Braintrust...\n`);
  
  const transliterations = {};
  
  // Process each word
  for (const wordData of wordsNeeding) {
    console.log(`Processing: ${wordData.word} (${wordData.language})`);
    
    const transliteration = await getTransliteration(
      wordData.word,
      wordData.native_script,
      wordData.language
    );
    
    if (transliteration) {
      transliterations[wordData.word] = transliteration;
      console.log(`✓ ${transliteration}\n`);
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
    if (transliterations.hasOwnProperty(word.word)) {
      if (forceRegenerate || !word.transliteration || word.transliteration.trim() === '') {
        word.transliteration = transliterations[word.word];
        updatedCount++;
      }
    }
  });
  
  // Write updated data back
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
  
  console.log(`✅ Successfully updated ${updatedCount} words with transliterations`);
  
  return { updated: updatedCount, transliterations };
}

/**
 * Main function
 */
async function main() {
  try {
    // Check for force regenerate flag
    const forceRegenerate = process.argv.includes('--force') || process.argv.includes('-f');
    const result = await generateAllTransliterations(forceRegenerate);
    
    if (result.updated > 0) {
      console.log(`\n📝 Updated ${result.updated} transliterations in words.json`);
      console.log('💡 You may want to commit these changes');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { getTransliteration, generateAllTransliterations };

// Run if called directly
if (require.main === module) {
  main();
}
