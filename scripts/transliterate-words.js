#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Use LLM to determine if a word needs transliteration and generate it if needed
 */
async function processWordTransliteration(wordEntry) {
  // Skip if already has transliteration
  if (wordEntry.transliteration && wordEntry.transliteration.trim() !== '') {
    return { needsTransliteration: false, transliteration: wordEntry.transliteration };
  }

  const prompt = `Analyze this word and provide a transliteration if needed:

Word: "${wordEntry.word}"
Native Script: "${wordEntry.native_script}"
Language: ${wordEntry.language}

Rules:
1. If the word uses Latin script (like English, Spanish, German, French, Italian, etc.), even with diacritics, respond with: NO_TRANSLITERATION_NEEDED
2. If the word uses non-Latin script (Chinese, Japanese, Korean, Arabic, Russian, Hebrew, etc.), provide a phonetic transliteration using hyphens to separate syllables

Examples:
- "commovente" (Italian) → NO_TRANSLITERATION_NEEDED
- "Fahrvergnügen" (German) → NO_TRANSLITERATION_NEEDED  
- "珍道具" (Japanese) → chin-doh-gu
- "Здравствуйте" (Russian) → zdrah-stvuy-tye
- "مرحبا" (Arabic) → mar-ha-ban
- "안녕하세요" (Korean) → an-nyeong-ha-se-yo

Respond with either "NO_TRANSLITERATION_NEEDED" or the phonetic transliteration:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a linguistics expert. Determine if a word needs transliteration and provide it if needed. Respond with either 'NO_TRANSLITERATION_NEEDED' or the phonetic transliteration using hyphens."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.1,
    });

    const result = response.choices[0].message.content.trim();
    
    if (result === 'NO_TRANSLITERATION_NEEDED') {
      return { needsTransliteration: false, transliteration: '' };
    } else {
      return { needsTransliteration: true, transliteration: result };
    }
  } catch (error) {
    console.error(`Error processing transliteration for ${wordEntry.word}:`, error.message);
    return { needsTransliteration: false, transliteration: '' };
  }
}


/**
 * Create backup of words.json before making changes
 */
function createBackup(wordsPath) {
  const backupDir = path.join(path.dirname(wordsPath), 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `words-before-transliteration-${timestamp}.json`);
  
  fs.copyFileSync(wordsPath, backupPath);
  console.log(`📦 Created backup: ${backupPath}`);
  
  return backupPath;
}

/**
 * Process all words and generate transliterations where needed
 */
async function processTransliterations() {
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }

  const wordsPath = path.join(__dirname, '../public/data/words.json');
  
  if (!fs.existsSync(wordsPath)) {
    throw new Error(`Words file not found: ${wordsPath}`);
  }

  // Load words
  const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  console.log(`📚 Loaded ${words.length} words from words.json`);

  // Find words that don't have transliterations yet
  const wordsToProcess = words.filter(word => !word.transliteration || word.transliteration.trim() === '');
  
  if (wordsToProcess.length === 0) {
    console.log('✅ All words already have transliterations processed');
    return { updated: 0, skipped: 0, noTransliterationNeeded: 0, total: words.length };
  }

  console.log(`\n🔍 Processing ${wordsToProcess.length} words without transliterations...\n`);

  // Create backup before making changes
  createBackup(wordsPath);

  let updatedCount = 0;
  let skippedCount = 0;
  let noTransliterationNeeded = 0;

  // Process each word
  for (const wordEntry of wordsToProcess) {
    console.log(`Processing: ${wordEntry.word} (${wordEntry.language})`);
    
    const result = await processWordTransliteration(wordEntry);
    
    if (result.needsTransliteration) {
      // Find the word in the original array and update it
      const wordIndex = words.findIndex(w => w.word === wordEntry.word);
      if (wordIndex !== -1) {
        words[wordIndex].transliteration = result.transliteration;
        updatedCount++;
        console.log(`✓ Added transliteration: ${result.transliteration}\n`);
      }
    } else if (result.transliteration === '') {
      // No transliteration needed (Latin script)
      noTransliterationNeeded++;
      console.log(`✓ No transliteration needed (Latin script)\n`);
    } else {
      skippedCount++;
      console.log(`✗ Failed or already has transliteration\n`);
    }
    
    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Write updated data back to file
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
  
  console.log(`\n✨ Transliteration process completed!`);
  console.log(`📊 Results:`);
  console.log(`   - Total words: ${words.length}`);
  console.log(`   - Words processed: ${wordsToProcess.length}`);
  console.log(`   - Transliterations added: ${updatedCount}`);
  console.log(`   - No transliteration needed (Latin script): ${noTransliterationNeeded}`);
  console.log(`   - Failed/skipped: ${skippedCount}`);

  return { updated: updatedCount, skipped: skippedCount, noTransliterationNeeded, total: words.length };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting intelligent transliteration process...\n');
    
    const result = await processTransliterations();
    
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
module.exports = { 
  processWordTransliteration, 
  processTransliterations 
};

// Run if called directly
if (require.main === module) {
  main();
}
