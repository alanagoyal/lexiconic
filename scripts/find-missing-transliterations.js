const fs = require('fs');
const path = require('path');

// Read the words.json file
const wordsPath = path.join(__dirname, '../public/data/words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

// Function to check if a string contains non-Latin characters
function hasNonLatinScript(text) {
  // Check for common non-Latin scripts
  const nonLatinRegex = /[\u0080-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u10A0-\u10FF\u1100-\u11FF\u1200-\u137F\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1A20-\u1AAF\u1B00-\u1B7F\u1B80-\u1BBF\u1BC0-\u1BFF\u1C00-\u1C4F\u1C50-\u1C7F\u1CC0-\u1CCF\u1CD0-\u1CFF\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u1F00-\u1FFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u20D0-\u20FF\u2100-\u214F\u2150-\u218F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2400-\u243F\u2440-\u245F\u2460-\u24FF\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27C0-\u27EF\u27F0-\u27FF\u2800-\u28FF\u2900-\u297F\u2980-\u29FF\u2A00-\u2AFF\u2B00-\u2BFF\u2C00-\u2C5F\u2C60-\u2C7F\u2C80-\u2CFF\u2D00-\u2D2F\u2D30-\u2D7F\u2D80-\u2DDF\u2DE0-\u2DFF\u2E00-\u2E7F\u2E80-\u2EFF\u2F00-\u2FDF\u2FF0-\u2FFF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\u3130-\u318F\u3190-\u319F\u31A0-\u31BF\u31C0-\u31EF\u31F0-\u31FF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA4D0-\uA4FF\uA500-\uA63F\uA640-\uA69F\uA6A0-\uA6FF\uA700-\uA71F\uA720-\uA7FF\uA800-\uA82F\uA830-\uA83F\uA840-\uA87F\uA880-\uA8DF\uA8E0-\uA8FF\uA900-\uA92F\uA930-\uA95F\uA960-\uA97F\uA980-\uA9DF\uA9E0-\uA9FF\uAA00-\uAA5F\uAA60-\uAA7F\uAA80-\uAADF\uAAE0-\uAAFF\uAB00-\uAB2F\uAB30-\uAB6F\uAB70-\uABBF\uABC0-\uABFF\uAC00-\uD7AF\uD7B0-\uD7FF\uF900-\uFAFF\uFB00-\uFB4F\uFB50-\uFDFF\uFE00-\uFE0F\uFE10-\uFE1F\uFE20-\uFE2F\uFE30-\uFE4F\uFE50-\uFE6F\uFE70-\uFEFF\uFF00-\uFFEF]/;
  return nonLatinRegex.test(text);
}

// Find words with native scripts that need transliterations
const wordsNeedingTransliteration = words.filter(word => {
  // Check if native_script is different from the word and contains non-Latin characters
  const hasNonLatinNativeScript = hasNonLatinScript(word.native_script);
  const nativeScriptDifferentFromWord = word.native_script !== word.word;
  const missingTransliteration = !word.transliteration || word.transliteration.trim() === '';
  
  return hasNonLatinNativeScript && nativeScriptDifferentFromWord && missingTransliteration;
});

console.log(`Found ${wordsNeedingTransliteration.length} words with native scripts that need transliterations:\n`);

wordsNeedingTransliteration.forEach((word, index) => {
  console.log(`${index + 1}. ${word.word}`);
  console.log(`   Native Script: ${word.native_script}`);
  console.log(`   Language: ${word.language}`);
  console.log(`   Current Transliteration: "${word.transliteration}"`);
  console.log('');
});

// Also create a summary by language
const byLanguage = {};
wordsNeedingTransliteration.forEach(word => {
  if (!byLanguage[word.language]) {
    byLanguage[word.language] = [];
  }
  byLanguage[word.language].push(word);
});

console.log('\n=== SUMMARY BY LANGUAGE ===');
Object.keys(byLanguage).sort().forEach(language => {
  console.log(`${language}: ${byLanguage[language].length} words`);
  byLanguage[language].forEach(word => {
    console.log(`  - ${word.word} (${word.native_script})`);
  });
  console.log('');
});

// Save results to a file for reference
const results = {
  total_words_needing_transliteration: wordsNeedingTransliteration.length,
  words: wordsNeedingTransliteration.map(word => ({
    word: word.word,
    native_script: word.native_script,
    language: word.language,
    family: word.family,
    current_transliteration: word.transliteration
  })),
  by_language: byLanguage
};

fs.writeFileSync(
  path.join(__dirname, '../public/data/missing-transliterations.json'),
  JSON.stringify(results, null, 2)
);

console.log(`\nResults saved to: ${path.join(__dirname, '../public/data/missing-transliterations.json')}`);
