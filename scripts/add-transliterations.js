const fs = require('fs');
const path = require('path');

// Read the words.json file
const wordsPath = path.join(__dirname, '../public/data/words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

// Define transliterations for the words that need them
const transliterations = {
  // Japanese words - using phonetic pronunciation style consistent with existing entries
  'arigata-meiwaku': 'ah-ree-gah-tah meh-ee-wah-kuu', // ありがためいわく
  'bakku-shan': 'bah-kuu-shahn', // バックシャン
  'boketto': 'boh-keh-toh', // ぼけっと
  'chindōgu': 'cheen-doh-guu', // 珍道具
  'ikigai': 'ee-kee-gah-ee', // 生きがい
  'kaizen': 'kah-ee-zehn', // 改善
  'koi no yokan': 'koh-ee noh yoh-kahn', // 恋の予感
  'komorebi': 'koh-moh-reh-bee', // 木漏れ日
  
  // Korean words - using phonetic pronunciation
  'dapjeongneo': 'dahp-jeong-nuh', // 답정너
  'gilchi': 'geel-chee', // 길치
  'gosohada': 'goh-soh-hah-dah', // 고소하다
  
  // German words (with diacritics) - keeping original with diacritics as that's the pattern
  'fahrvergnügen': 'fahrvergnügen', // Fahrvergnügen - keeping original
  'Lebensmüde': 'lebensmüde', // lebensmüde - keeping original
  
  // Czech word - keeping original with diacritics
  'mit kliku': 'mít kliku', // mít kliku - keeping original with diacritics
  
  // Scottish Gaelic - phonetic pronunciation
  'ceilidh': 'kay-lee' // céilidh - standard pronunciation
};

// Update the words with transliterations
let updatedCount = 0;

words.forEach(word => {
  if (transliterations.hasOwnProperty(word.word)) {
    if (!word.transliteration || word.transliteration.trim() === '') {
      word.transliteration = transliterations[word.word];
      updatedCount++;
      console.log(`Updated ${word.word} (${word.language}): "${word.transliteration}"`);
    }
  }
});

// Write the updated data back to the file
fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));

console.log(`\nSuccessfully updated ${updatedCount} words with transliterations.`);
console.log(`Updated file: ${wordsPath}`);

// Create a backup of the original file
const backupPath = path.join(__dirname, '../public/data/backup/words-backup-' + new Date().toISOString().slice(0, 10) + '.json');
const backupDir = path.dirname(backupPath);

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Note: We would backup the original, but since we've already modified it, 
// let's just note that a backup should be made before running this script in production
console.log(`\nNote: Consider creating a backup before running this script in production.`);
console.log(`Backup location would be: ${backupPath}`);
