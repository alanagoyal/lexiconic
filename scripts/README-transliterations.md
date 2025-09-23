# Transliteration Scripts

This directory contains scripts to find and generate transliterations for words with native scripts.

## Scripts

### 1. `find-missing-transliterations.js`
Analyzes the `words.json` file to identify words that have native scripts in non-Latin characters but are missing transliterations.

**Usage:**
```bash
node scripts/find-missing-transliterations.js
```

**Output:**
- Console output showing all words needing transliterations
- Creates `public/data/missing-transliterations.json` with detailed results

### 2. `generate-transliterations-with-ai.js`
Uses GPT-4o-mini to automatically generate accurate transliterations for words that need them.

**Prerequisites:**
1. Set your OpenAI API key as an environment variable:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

**Usage:**
```bash
node scripts/generate-transliterations-with-ai.js
```

**What it does:**
- Reads the missing transliterations data
- Calls GPT-4o-mini for each word to get accurate phonetic transliterations
- Updates the `words.json` file with the new transliterations
- Saves the AI-generated transliterations to `public/data/ai-generated-transliterations.json`

**Features:**
- Uses consistent phonetic formatting (e.g., "ah-ree-gah-tah")
- Handles different languages appropriately
- Includes rate limiting to be respectful to the API
- Provides detailed logging of the process

### 3. `add-transliterations.js`
Manual script with predefined transliterations (backup option if AI approach isn't available).

## Current Status

As of the last run, there are **15 words** that need transliterations:

- **Japanese (8 words)**: arigata-meiwaku, bakku-shan, boketto, chindōgu, ikigai, kaizen, koi no yokan, komorebi
- **Korean (3 words)**: dapjeongneo, gilchi, gosohada  
- **German (2 words)**: fahrvergnügen, Lebensmüde
- **Czech (1 word)**: mit kliku
- **Scottish Gaelic (1 word)**: ceilidh

## Recommended Workflow

1. First, run the finder script to see current status:
   ```bash
   node scripts/find-missing-transliterations.js
   ```

2. Set up your OpenAI API key and run the AI generation:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   node scripts/generate-transliterations-with-ai.js
   ```

3. Verify the results by checking the updated `words.json` file

## Notes

- The AI script includes a 1-second delay between API calls to be respectful
- All transliterations follow a consistent hyphenated format for phonetic clarity
- The system preserves existing transliterations and only fills in missing ones
- Backup files are recommended before running bulk updates
