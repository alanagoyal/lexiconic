#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Deduplicate words.json based on the "word" field
 */

const DATA_DIR = path.join(__dirname, '../public/data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
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
  const backupPath = path.join(BACKUP_DIR, `words-before-dedupe-${timestamp}.json`);
  
  fs.copyFileSync(WORDS_FILE, backupPath);
  console.log(`📦 Created backup: ${backupPath}`);
  
  return backupPath;
}

function dedupeWords(wordsArray) {
  console.log(`📊 Processing ${wordsArray.length} entries from words.json`);
  
  // Create a Map to track unique words (case-insensitive)
  const wordMap = new Map();
  const duplicates = [];
  const caseChanges = [];
  
  wordsArray.forEach((entry, index) => {
    if (!entry.word) {
      console.warn(`⚠️  Entry at index ${index} missing 'word' field:`, entry);
      return;
    }
    
    const originalWord = entry.word;
    const lowercaseWord = originalWord.toLowerCase();
    
    // Check if we need to change the case
    if (originalWord !== lowercaseWord) {
      caseChanges.push(`"${originalWord}" → "${lowercaseWord}"`);
    }
    
    // Update the word to lowercase
    const normalizedEntry = { ...entry, word: lowercaseWord };
    
    if (wordMap.has(lowercaseWord)) {
      duplicates.push(originalWord);
      console.log(`🔄 Duplicate found: "${originalWord}" (normalized: "${lowercaseWord}") - keeping first occurrence`);
    } else {
      wordMap.set(lowercaseWord, normalizedEntry);
    }
  });
  
  // Convert back to array
  const deduplicatedArray = Array.from(wordMap.values());
  
  // Sort alphabetically by word for consistency
  deduplicatedArray.sort((a, b) => a.word.localeCompare(b.word));
  
  console.log(`\n📈 Deduplication Summary:`);
  console.log(`   Original entries: ${wordsArray.length}`);
  console.log(`   Duplicates found: ${duplicates.length}`);
  console.log(`   Case changes made: ${caseChanges.length}`);
  console.log(`   Final deduplicated entries: ${deduplicatedArray.length}`);
  console.log(`   Entries removed: ${wordsArray.length - deduplicatedArray.length}`);
  
  if (caseChanges.length > 0) {
    console.log(`\n🔤 Case changes made:`);
    caseChanges.forEach(change => console.log(`   - ${change}`));
  }
  
  if (duplicates.length > 0) {
    console.log(`\n🔍 Duplicate words found:`);
    duplicates.forEach(word => console.log(`   - ${word}`));
  }
  
  return deduplicatedArray;
}

function main() {
  console.log('🚀 Starting word deduplication...\n');
  
  // Load words file
  const wordsArray = loadJsonFile(WORDS_FILE);
  
  // Validate that it's an array
  if (!Array.isArray(wordsArray)) {
    console.error('❌ words.json must contain a JSON array');
    process.exit(1);
  }
  
  // Create backup
  const backupPath = createBackup();
  
  // Deduplicate
  const deduplicatedArray = dedupeWords(wordsArray);
  
  // Save deduplicated result back to original file
  saveJsonFile(WORDS_FILE, deduplicatedArray);
  
  console.log(`\n✨ Deduplication completed successfully!`);
  console.log(`📁 Updated file: ${WORDS_FILE}`);
  console.log(`📁 Original backed up to: ${backupPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { dedupeWords, loadJsonFile, saveJsonFile };
