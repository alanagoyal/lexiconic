// DEPRECATED: This script is no longer needed as the native_script field has been removed.
// The word field now contains the word in its native script directly.

const fs = require('fs');
const path = require('path');

// Function to detect if a string contains non-Latin characters
function hasNonLatinChars(str) {
    // Check for characters outside basic Latin range (including accented characters)
    // This regex matches characters that are NOT in the basic Latin, Latin-1 Supplement, 
    // Latin Extended-A, and Latin Extended-B ranges, plus some common punctuation
    return /[^\u0000-\u024F\u1E00-\u1EFF\s\-'']/.test(str);
}

// Function to normalize word entries
function normalizeWords() {
    const wordsPath = path.join(__dirname, 'public/data/words.json');
    
    // Create backup
    const backupPath = path.join(__dirname, `public/data/words_backup_${Date.now()}.json`);
    fs.copyFileSync(wordsPath, backupPath);
    console.log(`Backup created: ${backupPath}`);
    
    // Read the words file
    const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
    
    let changesCount = 0;
    const changes = [];
    
    wordsData.forEach((entry, index) => {
        const originalWord = entry.word;
        const originalNativeScript = entry.native_script;
        const originalTransliteration = entry.transliteration;
        
        // Check if word field contains transliteration but native_script has the actual native script
        const wordHasNonLatin = hasNonLatinChars(entry.word);
        const nativeScriptHasNonLatin = hasNonLatinChars(entry.native_script);
        
        // Case 1: word field has Latin chars but native_script has non-Latin chars
        // This means we need to swap them
        if (!wordHasNonLatin && nativeScriptHasNonLatin && entry.word !== entry.native_script) {
            // Swap word and native_script
            entry.word = entry.native_script;
            
            // If transliteration is empty or same as original word, use original word as transliteration
            if (!entry.transliteration || entry.transliteration === entry.native_script) {
                entry.transliteration = originalWord;
            }
            
            changesCount++;
            changes.push({
                index: index + 1,
                language: entry.language,
                originalWord: originalWord,
                newWord: entry.word,
                originalTransliteration: originalTransliteration,
                newTransliteration: entry.transliteration,
                reason: 'Swapped word and native_script'
            });
        }
        // Case 2: Both word and native_script have non-Latin chars and are the same
        // Check if transliteration needs to be set from somewhere
        else if (wordHasNonLatin && entry.word === entry.native_script) {
            // This is already correct, but check if transliteration is missing
            if (!entry.transliteration && originalWord !== entry.native_script) {
                // This shouldn't happen in our current data, but just in case
                console.log(`Note: Entry ${index + 1} (${entry.language}) already has native script in word field`);
            }
        }
        // Case 3: word has non-Latin but native_script has Latin (unusual case)
        else if (wordHasNonLatin && !nativeScriptHasNonLatin && entry.word !== entry.native_script) {
            // In this case, word is already correct, but native_script might be the transliteration
            if (!entry.transliteration || entry.transliteration === entry.word) {
                entry.transliteration = entry.native_script;
                entry.native_script = entry.word; // Keep native_script same as word
                
                changesCount++;
                changes.push({
                    index: index + 1,
                    language: entry.language,
                    originalWord: originalWord,
                    newWord: entry.word,
                    originalTransliteration: originalTransliteration,
                    newTransliteration: entry.transliteration,
                    reason: 'Fixed transliteration field'
                });
            }
        }
    });
    
    // Write the updated data back to the file
    fs.writeFileSync(wordsPath, JSON.stringify(wordsData, null, 2), 'utf8');
    
    // Report changes
    console.log(`\nNormalization complete!`);
    console.log(`Total entries processed: ${wordsData.length}`);
    console.log(`Entries modified: ${changesCount}`);
    
    if (changes.length > 0) {
        console.log('\nChanges made:');
        changes.forEach(change => {
            console.log(`${change.index}. ${change.language}: "${change.originalWord}" → "${change.newWord}"`);
            console.log(`   Transliteration: "${change.originalTransliteration}" → "${change.newTransliteration}"`);
            console.log(`   Reason: ${change.reason}\n`);
        });
    }
    
    return {
        totalEntries: wordsData.length,
        changesCount: changesCount,
        changes: changes
    };
}

// Run the normalization
if (require.main === module) {
    try {
        normalizeWords();
    } catch (error) {
        console.error('Error during normalization:', error);
        process.exit(1);
    }
}

module.exports = { normalizeWords };
