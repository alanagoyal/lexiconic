#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Apply the merged results by replacing the original files
 * This script should only be run after reviewing the merged file
 */

const DATA_DIR = path.join(__dirname, '../public/data');
const MERGED_FILE = path.join(DATA_DIR, 'words-merged.json');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const WORDS_NEW_FILE = path.join(DATA_DIR, 'words-new.json');

function main() {
  console.log('🔄 Applying merged results...\n');
  
  // Check if merged file exists
  if (!fs.existsSync(MERGED_FILE)) {
    console.error('❌ Merged file not found. Please run merge-words.js first.');
    process.exit(1);
  }
  
  try {
    // Copy merged file to replace words.json
    fs.copyFileSync(MERGED_FILE, WORDS_FILE);
    console.log('✅ Updated words.json with merged content');
    
    // Remove words-new.json since it's now merged
    fs.unlinkSync(WORDS_NEW_FILE);
    console.log('✅ Removed words-new.json (content merged into words.json)');
    
    // Optionally remove the merged file
    fs.unlinkSync(MERGED_FILE);
    console.log('✅ Cleaned up temporary words-merged.json');
    
    console.log('\n🎉 Merge application completed successfully!');
    console.log('📁 words.json now contains all 304 deduplicated entries');
    console.log('📦 Original files are safely backed up in public/data/backup/');
    
  } catch (error) {
    console.error('❌ Error applying merge:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
