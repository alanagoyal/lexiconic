const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// You'll need to install the OpenAI package: npm install openai
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this environment variable
});

// Read the missing transliterations file
const missingTransliterationsPath = path.join(__dirname, '../public/data/missing-transliterations.json');
const missingData = JSON.parse(fs.readFileSync(missingTransliterationsPath, 'utf8'));

// Read the words.json file
const wordsPath = path.join(__dirname, '../public/data/words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

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
          content: "You are a linguistics expert specializing in transliteration and phonetic transcription. Provide accurate, consistent transliterations using hyphens to separate syllables."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.1, // Low temperature for consistency
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error getting transliteration for ${word}:`, error.message);
    return null;
  }
}

async function generateAllTransliterations() {
  console.log(`Generating transliterations for ${missingData.words.length} words...\n`);
  
  const transliterations = {};
  
  // Process each word that needs transliteration
  for (const wordData of missingData.words) {
    console.log(`Getting transliteration for: ${wordData.word} (${wordData.language})`);
    console.log(`Native script: ${wordData.native_script}`);
    
    const transliteration = await getTransliteration(
      wordData.word,
      wordData.native_script,
      wordData.language
    );
    
    if (transliteration) {
      transliterations[wordData.word] = transliteration;
      console.log(`✓ Transliteration: ${transliteration}\n`);
    } else {
      console.log(`✗ Failed to get transliteration\n`);
    }
    
    // Add a small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return transliterations;
}

async function updateWordsWithTransliterations(transliterations) {
  let updatedCount = 0;
  
  words.forEach(word => {
    if (transliterations.hasOwnProperty(word.word)) {
      if (!word.transliteration || word.transliteration.trim() === '') {
        word.transliteration = transliterations[word.word];
        updatedCount++;
        console.log(`Updated ${word.word}: "${word.transliteration}"`);
      }
    }
  });
  
  // Write the updated data back to the file
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
  
  console.log(`\nSuccessfully updated ${updatedCount} words with AI-generated transliterations.`);
  
  // Save the transliterations for reference
  const transliterationsPath = path.join(__dirname, '../public/data/ai-generated-transliterations.json');
  fs.writeFileSync(transliterationsPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    model: "gpt-4o-mini",
    transliterations: transliterations
  }, null, 2));
  
  console.log(`Transliterations saved to: ${transliterationsPath}`);
}

async function main() {
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    console.log('Please set it by running: export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }
  
  try {
    console.log('Starting AI-powered transliteration generation...\n');
    
    const transliterations = await generateAllTransliterations();
    
    console.log('\n=== GENERATED TRANSLITERATIONS ===');
    Object.entries(transliterations).forEach(([word, transliteration]) => {
      console.log(`${word}: ${transliteration}`);
    });
    
    console.log('\nUpdating words.json file...');
    await updateWordsWithTransliterations(transliterations);
    
    console.log('\n✅ All done! Transliterations have been generated and saved.');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { getTransliteration, generateAllTransliterations };
