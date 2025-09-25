#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to alphabetize the words dataset based on the 'transliteration' field (a->z)
 * Falls back to the 'word' field when transliteration is empty
 * Creates a backup before making changes and provides detailed reporting
 */

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');

function createBackup() {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `words-before-alphabetization-${timestamp}.json`);
    
    fs.copyFileSync(WORDS_FILE, backupFile);
    console.log(`✅ Backup created: ${path.relative(process.cwd(), backupFile)}`);
    return backupFile;
}

function loadWords() {
    try {
        const data = fs.readFileSync(WORDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error loading words file:', error.message);
        process.exit(1);
    }
}

function saveWords(words) {
    try {
        const jsonString = JSON.stringify(words, null, 2);
        fs.writeFileSync(WORDS_FILE, jsonString, 'utf8');
        console.log(`✅ Alphabetized words saved to: ${path.relative(process.cwd(), WORDS_FILE)}`);
    } catch (error) {
        console.error('❌ Error saving words file:', error.message);
        process.exit(1);
    }
}

function getSortingKey(wordObj) {
    // Use transliteration if available and not empty, otherwise fall back to word
    const transliteration = wordObj.transliteration?.trim();
    return transliteration && transliteration !== '' ? transliteration : wordObj.word;
}

function analyzeOrder(words) {
    let correctlyOrdered = 0;
    let outOfOrder = [];
    
    for (let i = 1; i < words.length; i++) {
        const prevSortKey = getSortingKey(words[i - 1]).toLowerCase();
        const currentSortKey = getSortingKey(words[i]).toLowerCase();
        
        // Use the same comparison logic as the sorting function
        const comparison = prevSortKey.localeCompare(currentSortKey, 'en', {
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: false
        });
        
        if (comparison <= 0) {
            correctlyOrdered++;
        } else {
            outOfOrder.push({
                index: i,
                word: words[i].word,
                previousWord: words[i - 1].word,
                sortKey: getSortingKey(words[i]),
                previousSortKey: getSortingKey(words[i - 1])
            });
        }
    }
    
    return { correctlyOrdered, outOfOrder };
}

function alphabetizeWords(words) {
    console.log('📊 Analyzing current order...');
    const beforeAnalysis = analyzeOrder(words);
    
    console.log(`📈 Before alphabetization:`);
    console.log(`   - Total words: ${words.length}`);
    console.log(`   - Correctly ordered pairs: ${beforeAnalysis.correctlyOrdered}/${words.length - 1}`);
    console.log(`   - Out of order entries: ${beforeAnalysis.outOfOrder.length}`);
    
    if (beforeAnalysis.outOfOrder.length > 0) {
        console.log('\n🔍 Examples of out-of-order entries:');
        beforeAnalysis.outOfOrder.slice(0, 5).forEach(item => {
            console.log(`   - "${item.word}" [${item.sortKey}] comes after "${item.previousWord}" [${item.previousSortKey}]`);
        });
        if (beforeAnalysis.outOfOrder.length > 5) {
            console.log(`   ... and ${beforeAnalysis.outOfOrder.length - 5} more`);
        }
    }
    
    console.log('\n🔄 Alphabetizing words...');
    
    // Sort the words array alphabetically by the transliteration field (with fallback to word field)
    // Using localeCompare with specific options to handle accented characters properly
    const sortedWords = [...words].sort((a, b) => {
        const sortKeyA = getSortingKey(a).toLowerCase();
        const sortKeyB = getSortingKey(b).toLowerCase();
        return sortKeyA.localeCompare(sortKeyB, 'en', {
            sensitivity: 'base', // Ignore case and accents for primary sorting
            numeric: true,
            ignorePunctuation: false
        });
    });
    
    // Analyze the changes made
    let changedPositions = 0;
    const positionChanges = [];
    
    for (let i = 0; i < words.length; i++) {
        const originalWord = words[i].word;
        const newIndex = sortedWords.findIndex(w => w.word === originalWord);
        
        if (i !== newIndex) {
            changedPositions++;
            positionChanges.push({
                word: originalWord,
                from: i + 1, // 1-indexed for human readability
                to: newIndex + 1
            });
        }
    }
    
    console.log(`\n📈 After alphabetization:`);
    console.log(`   - Total words: ${sortedWords.length}`);
    console.log(`   - Words that changed position: ${changedPositions}`);
    console.log(`   - Words that stayed in place: ${words.length - changedPositions}`);
    
    if (changedPositions > 0) {
        console.log('\n🔄 Position changes (showing first 10):');
        positionChanges.slice(0, 10).forEach(change => {
            console.log(`   - "${change.word}": position ${change.from} → ${change.to}`);
        });
        if (positionChanges.length > 10) {
            console.log(`   ... and ${positionChanges.length - 10} more position changes`);
        }
    }
    
    // Verify the result is properly sorted
    const afterAnalysis = analyzeOrder(sortedWords);
    console.log(`\n✅ Verification:`);
    console.log(`   - Correctly ordered pairs: ${afterAnalysis.correctlyOrdered}/${sortedWords.length - 1}`);
    console.log(`   - Out of order entries: ${afterAnalysis.outOfOrder.length}`);
    
    return sortedWords;
}

function main() {
    console.log('🔤 Starting alphabetization of words dataset...\n');
    
    // Check if words file exists
    if (!fs.existsSync(WORDS_FILE)) {
        console.error(`❌ Words file not found: ${WORDS_FILE}`);
        process.exit(1);
    }
    
    // Create backup
    const backupFile = createBackup();
    
    // Load words
    console.log('📚 Loading words...');
    const words = loadWords();
    
    if (!Array.isArray(words)) {
        console.error('❌ Words file does not contain a valid array');
        process.exit(1);
    }
    
    if (words.length === 0) {
        console.log('⚠️  Words array is empty, nothing to alphabetize');
        return;
    }
    
    // Validate that words have the expected structure
    const invalidWords = words.filter(word => !word.word || typeof word.word !== 'string');
    if (invalidWords.length > 0) {
        console.error(`❌ Found ${invalidWords.length} words without valid 'word' field`);
        process.exit(1);
    }
    
    // Count how many words use transliteration vs word for sorting
    let usingTransliteration = 0;
    let usingWord = 0;
    words.forEach(word => {
        const transliteration = word.transliteration?.trim();
        if (transliteration && transliteration !== '') {
            usingTransliteration++;
        } else {
            usingWord++;
        }
    });
    
    console.log(`📊 Sorting strategy:`);
    console.log(`   - Words using transliteration for sorting: ${usingTransliteration}`);
    console.log(`   - Words using word field for sorting: ${usingWord}`);
    
    // Alphabetize
    const alphabetizedWords = alphabetizeWords(words);
    
    // Save the alphabetized words
    saveWords(alphabetizedWords);
    
    console.log('\n🎉 Alphabetization complete!');
    console.log(`📁 Backup saved to: ${path.relative(process.cwd(), backupFile)}`);
    console.log(`📁 Updated file: ${path.relative(process.cwd(), WORDS_FILE)}`);
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { alphabetizeWords, analyzeOrder };
