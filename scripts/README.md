# Scripts

This folder contains scripts for managing the Lexiconic word database.

## Quick Start

To add a new word:
```bash
npm run add-word -- "word" "Language" "https://source-url"
```

This single command will add the word, generate all metadata, pronunciation, and embeddings automatically.

---

## Core Scripts

### `add-word.ts`

CLI tool to add new words with automatic metadata, pronunciation, and embedding generation.

**Usage:**
```bash
npm run add-word -- "jayus" "Indonesian" "https://example.com/source"
```

**What it does:**
1. Validates inputs and checks for duplicates
2. Creates a temporary backup of `words.json`
3. Adds the minimal word entry
4. Runs metadata generation (via Braintrust)
5. Generates pronunciation audio (via OpenAI TTS)
6. Generates semantic embeddings (via OpenAI)
7. Rolls back on error or cleans up backup on success

**Requirements:**
- `BRAINTRUST_API_KEY` in `.env.local`
- `OPENAI_API_KEY` in `.env.local`

---

### `generate-metadata.ts`

Generates comprehensive metadata for ALL words missing any metadata using the Braintrust `generate-metadata-4263` prompt. Used internally by `add-word.ts` but can also be run standalone to backfill any missing metadata.

**Usage:**
```bash
npm run generate-metadata
```

**What it generates:**
- `phonetic` - IPA phonetic spelling
- `definition` - Detailed word definition
- `family` - Language family
- `category` - Semantic category
- `literal` - Literal translation
- `usage_notes` - Cultural context and usage
- `english_approx` - English approximation
- `location` - Geographic location or origin
- `lat` - Latitude coordinate for the location
- `lng` - Longitude coordinate for the location

**Requirements:**
- `BRAINTRUST_API_KEY` in `.env.local`

---

### `generate-pronunciations.ts`

Generates audio pronunciation files for new or changed words. Used internally by `add-word.ts` but can also be run standalone.

**Usage:**
```bash
npm run generate-pronunciations
```

**Behavior:**
- Detects new or changed words from the last git commit
- Generates MP3 files in `public/pronunciations/`
- Updates the `pronunciation` field in `public/data/words.json`
- Skips words that already have pronunciations

**Requirements:**
- `OPENAI_API_KEY` in `.env.local`

---

### `generate-embeddings.ts`

Generates semantic embeddings for words in `public/data/words.json` and outputs them to `public/data/words-with-embeddings.json`. Used internally by `add-word.ts` but can also be run standalone.

**Usage:**
```bash
npm run generate-embeddings
```

**Smart regeneration:**
- Embeddings are based on: word, phonetic, language, category, definition, literal meaning, usage notes, English approximation, examples, and English paraphrase
- A hash of these fields is stored with each embedding
- Only regenerates when the hash changes (i.e., semantic content changed)
- Otherwise reuses existing embeddings for efficiency

**Requirements:**
- `OPENAI_API_KEY` in `.env.local`

---

## Environment Variables

Required API keys in `.env.local`:

```bash
OPENAI_API_KEY=your_openai_key_here
BRAINTRUST_API_KEY=your_braintrust_key_here
```

---

## Workflow

### Adding new words (Recommended):

Use the CLI to add words with automatic generation:

```bash
npm run add-word -- "jayus" "Indonesian" "https://example.com/source"
```

This will:
1. Add the minimal word entry to `words.json`
2. Generate comprehensive metadata (phonetic, definition, family, category, etc.)
3. Generate audio pronunciation file
4. Generate semantic embeddings
5. Create temporary backup (auto-deleted on success or used for rollback on error)

Then simply commit everything:
```bash
git add .
git commit -m "add jayus"
git push
```

**Benefits:**
- Single command to add a word
- Runs all generation steps in the correct order
- Automatic rollback if any step fails
- Clear progress output
- No risk of double-execution

### Alternative: Manual method

You can also manually add words to `public/data/words.json`:

1. Add a minimal entry with `word`, `language`, and `sources`:
   ```json
   {
     "word": "jayus",
     "language": "Indonesian",
     "sources": "https://example.com/source"
   }
   ```
2. Run generation manually:
   ```bash
   npm run generate:all
   ```
3. Commit the changes:
   ```bash
   git add .
   git commit -m "add jayus"
   ```

### Manual generation:

You can also run the full pipeline manually:
```bash
npm run generate:all
```

Or run individual steps:
```bash
npm run generate-metadata        # Generate metadata for ALL words missing it
npm run generate-pronunciations  # Generate audio files
npm run generate-embeddings      # Generate semantic embeddings
```

### Updating existing words:

1. Edit `public/data/words.json`
2. Commit your changes
3. The post-commit hook automatically:
   - Regenerates pronunciations if the word itself changed
   - Regenerates embeddings if semantic fields changed
   - Stages all updated files
4. Review and commit the updates when ready

---

## Notes

- **Metadata generation** uses a single Braintrust prompt to generate all metadata fields at once, making it faster and more consistent
- **Embeddings** are intelligently regenerated only when semantic fields change
- **Pronunciations** are generated for new or changed words using OpenAI TTS
- All scripts gracefully handle missing API keys
- Temporary backups are created during `add-word` operations but automatically cleaned up on success
- **Deprecated scripts**: The following scripts have been moved to `scripts/deprecated/`: