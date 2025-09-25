const fs = require('fs');
const path = require('path');
const { findWordsNeedingTransliterations } = require('./check-transliterations');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get transliteration for a single word using GPT-4o-mini
 */
async function getTransliteration(word, nativeScript, language) {
  const prompt = `Please provide a phonetic transliteration for the following word:

Word: ${word}
Native Script: ${nativeScript}
Language: ${language}

Please provide ONLY the phonetic transliteration using hyphens to separate syllables (e.g., "ah-ree-gah-tah" for Japanese, "dahp-jeong-nuh" for Korean). 

For languages that already use Latin script but have diacritics (like German ü, Czech ř), you can keep the original form or provide a simplified version.

For Scottish Gaelic "ceilidh", provide the pronunciation guide.

Transliteration:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a linguistics expert specializing in transliteration and phonetic transcription. Provide accurate, consistent transliterations using hyphens to separate syllables. Respond with ONLY the transliteration, no extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.1,
    });

    let transliteration = response.choices[0].message.content.trim();
    
    // Clean up any extra text that might be included
    if (transliteration.toLowerCase().includes('transliteration:')) {
      transliteration = transliteration.replace(/.*transliteration:\s*/i, '');
    }
    
    return transliteration;
  } catch (error) {
    console.error(`Error getting transliteration for ${word}:`, error.message);
    return null;
  }
}

/**
 * Generate transliterations for all words that need them
 */
async function generateAllTransliterations() {
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }

  const wordsNeeding = findWordsNeedingTransliterations();
  
  if (wordsNeeding.length === 0) {
    console.log('✅ All words already have transliterations');
    return { updated: 0, transliterations: {} };
  }

  console.log(`🤖 Generating transliterations for ${wordsNeeding.length} words using GPT-4o-mini...\n`);
  
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
      if (!word.transliteration || word.transliteration.trim() === '') {
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
    const result = await generateAllTransliterations();
    
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
