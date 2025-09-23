# Transliteration Scripts

Automated scripts to ensure all words with native scripts have proper transliterations.

## Scripts

### `check-transliterations.js`
Scans `words.json` to find words with non-Latin native scripts that are missing transliterations.

**Usage:**
```bash
node scripts/check-transliterations.js
```

**Returns:**
- Exit code 0: All words have transliterations
- Exit code 1: Some words need transliterations (lists them)

### `generate-transliterations.js`
Uses GPT-4o-mini to automatically generate missing transliterations and updates `words.json`.

**Prerequisites:**
- Set `OPENAI_API_KEY` in your `.env.local` file

**Usage:**
```bash
node scripts/generate-transliterations.js
```

**Features:**
- Generates phonetic transliterations with hyphens (e.g., "ko-mo-re-bi")
- Handles multiple languages (Japanese, Korean, Chinese, Arabic, Hebrew, etc.)
- Updates `words.json` automatically
- Includes rate limiting for API calls

## Integration

These scripts are automatically run by the **post-commit hook** when `words.json` is modified:

1. **Check**: Scans for missing transliterations
2. **Generate**: Creates missing transliterations using AI
3. **Update**: Stages changes to `words.json`
4. **Continue**: Proceeds with embedding generation

## Manual Usage

To check current status:
```bash
node scripts/check-transliterations.js
```

To generate missing transliterations:
```bash
node scripts/generate-transliterations.js
```

The system ensures that every word with a native script in non-Latin characters has an appropriate phonetic transliteration for better accessibility and pronunciation guidance.
