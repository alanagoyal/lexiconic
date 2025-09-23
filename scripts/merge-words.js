#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Merge and deduplicate two word JSON files based on the "word" field
 * Priority: words-new.json takes precedence over words.json for duplicates
 */

const DATA_DIR = path.join(__dirname, '../public/data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const WORDS_NEW_FILE = path.join(DATA_DIR, 'words-new.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'words-merged.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');

function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    process.exit(1);
  }
}

function saveJsonFile(filePath, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    console.log(`✅ Saved ${data.length} entries to ${filePath}`);
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
    process.exit(1);
  }
}

function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Backup original files
  fs.copyFileSync(WORDS_FILE, path.join(BACKUP_DIR, `words-${timestamp}.json`));
  fs.copyFileSync(WORDS_NEW_FILE, path.join(BACKUP_DIR, `words-new-${timestamp}.json`));
  
  console.log(`📦 Created backups in ${BACKUP_DIR}`);
}

function mergeAndDedupe(wordsArray, wordsNewArray) {
  console.log(`📊 Processing ${wordsArray.length} entries from words.json`);
  console.log(`📊 Processing ${wordsNewArray.length} entries from words-new.json`);
  
  // Create a Map to track unique words (case-sensitive)
  const wordMap = new Map();
  
  // First, add all entries from words.json
  wordsArray.forEach((entry, index) => {
    if (!entry.word) {
      console.warn(`⚠️  Entry at index ${index} in words.json missing 'word' field:`, entry);
      return;
    }
    wordMap.set(entry.word, { ...entry, source: 'words.json' });
  });
  
  // Then add entries from words-new.json, overwriting duplicates
  let duplicatesCount = 0;
  wordsNewArray.forEach((entry, index) => {
    if (!entry.word) {
      console.warn(`⚠️  Entry at index ${index} in words-new.json missing 'word' field:`, entry);
      return;
    }
    
    if (wordMap.has(entry.word)) {
      duplicatesCount++;
      console.log(`🔄 Duplicate found: "${entry.word}" - using version from words-new.json`);
    }
    
    wordMap.set(entry.word, { ...entry, source: 'words-new.json' });
  });
  
  // Convert back to array and remove the source field
  const mergedArray = Array.from(wordMap.values()).map(entry => {
    const { source, ...cleanEntry } = entry;
    return cleanEntry;
  });
  
  // Sort alphabetically by word for consistency
  mergedArray.sort((a, b) => a.word.localeCompare(b.word));
  
  console.log(`\n📈 Merge Summary:`);
  console.log(`   Original words.json: ${wordsArray.length} entries`);
  console.log(`   Original words-new.json: ${wordsNewArray.length} entries`);
  console.log(`   Duplicates found: ${duplicatesCount}`);
  console.log(`   Final merged result: ${mergedArray.length} entries`);
  console.log(`   Net new words added: ${mergedArray.length - wordsArray.length}`);
  
  return mergedArray;
}

function main() {
  console.log('🚀 Starting word file merge and deduplication...\n');
  
  // Load both files
  const wordsArray = loadJsonFile(WORDS_FILE);
  const wordsNewArray = loadJsonFile(WORDS_NEW_FILE);
  
  // Validate that both are arrays
  if (!Array.isArray(wordsArray) || !Array.isArray(wordsNewArray)) {
    console.error('❌ Both files must contain JSON arrays');
    process.exit(1);
  }
  
  // Create backup
  createBackup();
  
  // Merge and deduplicate
  const mergedArray = mergeAndDedupe(wordsArray, wordsNewArray);
  
  // Save merged result
  saveJsonFile(OUTPUT_FILE, mergedArray);
  
  console.log(`\n✨ Merge completed successfully!`);
  console.log(`📁 Merged file saved as: ${OUTPUT_FILE}`);
  console.log(`📁 Original files backed up to: ${BACKUP_DIR}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the merged file: ${OUTPUT_FILE}`);
  console.log(`2. If satisfied, replace the original files with the merged version`);
}

if (require.main === module) {
  main();
}

module.exports = { mergeAndDedupe, loadJsonFile, saveJsonFile };
