#!/usr/bin/env npx tsx

import { promises as fs } from 'fs';
import path from 'path';
import type { WordDataWithoutEmbedding } from '../types/word';

async function cleanPronunciations() {
  try {
    // Read words.json
    const wordsPath = path.join(process.cwd(), 'public/data/words.json');
    const wordsContent = await fs.readFile(wordsPath, 'utf-8');
    const words: WordDataWithoutEmbedding[] = JSON.parse(wordsContent);

    // Get all pronunciation filenames from words.json
    const validPronunciations = new Set<string>();
    const missingPronunciations: string[] = [];

    console.log('\n📋 Checking pronunciations...\n');

    for (const word of words) {
      if (word.pronunciation) {
        validPronunciations.add(word.pronunciation);
      } else {
        missingPronunciations.push(word.word);
      }
    }

    // Read actual files in pronunciations directory
    const pronunciationsDir = path.join(process.cwd(), 'public/pronunciations');
    const files = await fs.readdir(pronunciationsDir);
    const mp3Files = files.filter(f => f.endsWith('.mp3'));

    // Find orphaned files (in folder but not in words.json)
    const orphanedFiles: string[] = [];
    for (const file of mp3Files) {
      if (!validPronunciations.has(file)) {
        orphanedFiles.push(file);
      }
    }

    // Report findings
    console.log(`✅ Total words: ${words.length}`);
    console.log(`✅ Words with pronunciations: ${validPronunciations.size}`);
    console.log(`⚠️  Words missing pronunciations: ${missingPronunciations.length}`);
    console.log(`📁 Total MP3 files: ${mp3Files.length}`);
    console.log(`🗑️  Orphaned files to delete: ${orphanedFiles.length}\n`);

    if (missingPronunciations.length > 0) {
      console.log('Words missing pronunciations:');
      missingPronunciations.forEach(word => console.log(`  - ${word}`));
      console.log('');
    }

    if (orphanedFiles.length > 0) {
      console.log('Orphaned pronunciation files:');
      orphanedFiles.forEach(file => console.log(`  - ${file}`));
      console.log('');

      // Delete orphaned files
      console.log('🗑️  Deleting orphaned files...\n');
      for (const file of orphanedFiles) {
        const filePath = path.join(pronunciationsDir, file);
        await fs.unlink(filePath);
        console.log(`  ✓ Deleted: ${file}`);
      }
      console.log(`\n✅ Deleted ${orphanedFiles.length} orphaned file(s)\n`);
    } else {
      console.log('✅ No orphaned files found!\n');
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`   Words in JSON: ${words.length}`);
    console.log(`   Valid pronunciations: ${validPronunciations.size}`);
    console.log(`   Files after cleanup: ${mp3Files.length - orphanedFiles.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanPronunciations();
