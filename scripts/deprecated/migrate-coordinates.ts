#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Import the coordinates mapping
import { LOCATION_COORDINATES } from '../lib/location-coordinates';

interface WordData {
  word: string;
  location?: string;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

/**
 * Migrate coordinates from LOCATION_COORDINATES to words.json
 */
function migrateCoordinates() {
  const wordsPath = path.join(__dirname, '../public/data/words.json');
  
  // Create backup
  const backupPath = path.join(__dirname, '../public/data/backup/words-backup-' + Date.now() + '.json');
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.copyFileSync(wordsPath, backupPath);
  console.log(`✓ Created backup: ${path.relative(process.cwd(), backupPath)}`);

  // Read words
  const words: WordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  
  let updatedCount = 0;
  let missingCount = 0;
  const missingLocations = new Set<string>();

  // Update each word with coordinates
  words.forEach(word => {
    if (!word.location) {
      console.log(`  ⚠ No location for word: ${word.word}`);
      missingCount++;
      return;
    }

    const coords = LOCATION_COORDINATES[word.location];
    if (coords) {
      word.lat = coords.lat;
      word.lng = coords.lng;
      updatedCount++;
    } else {
      missingLocations.add(word.location);
      missingCount++;
    }
  });

  // Write updated data
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
  
  console.log(`\n✓ Updated ${updatedCount} words with coordinates`);
  
  if (missingLocations.size > 0) {
    console.log(`\n⚠ ${missingCount} words missing coordinates for locations:`);
    Array.from(missingLocations).sort().forEach(loc => {
      const wordsWithLocation = words.filter(w => w.location === loc);
      console.log(`  - "${loc}" (${wordsWithLocation.length} words)`);
    });
    console.log('\nThese will need coordinates generated via Braintrust.');
  }
}

// Run migration
migrateCoordinates();
