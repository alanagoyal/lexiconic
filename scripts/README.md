# Scripts

This folder contains scripts for managing the Lexiconic word database.

## Core Scripts

### `generate-metadata.ts` ⭐️ NEW

Generates comprehensive metadata for new words using the Braintrust `generate-metadata-4263` prompt. This replaces the separate `generate-phonetics.ts` and `generate-definitions.ts` scripts.

**Usage:**
```bash
# Generate metadata for new words detected from git
npm run generate-metadata

# Generate metadata for ALL words missing any metadata
npm run generate-metadata:all
```

**When to run:**
- Automatically runs via post-commit hook when `public/data/words.json` changes
- Can also be run manually

**What it generates:**
- `phonetic` - IPA phonetic spelling
- `definition` - Detailed word definition
- `family` - Language family
- `category` - Semantic category
- `literal` - Literal translation
- `usage_notes` - Cultural context and usage
- `english_approx` - English approximation

**Behavior:**
- Detects new words from the last git commit (or processes all words with `--all-words` flag)
- Only generates metadata for words missing required fields
- Skips words with existing valid metadata
- Creates a backup of `words.json` before making changes
- Updates `public/data/words.json` with new metadata

**Requirements:**
- `BRAINTRUST_API_KEY` in `.env.local`

---

### `generate-pronunciations.ts`

Generates audio pronunciation files for new or changed words.

**Usage:**
```bash
npm run generate-pronunciations
```

**When to run:**
- Automatically runs via post-commit hook when `public/data/words.json` changes
- Can also be run manually

**Behavior:**
- Detects new or changed words from the last git commit
- Generates MP3 files in `public/pronunciations/`
- Updates the `pronunciation` field in `public/data/words.json`
- Skips words that already have pronunciations

**Requirements:**
- `OPENAI_API_KEY` in `.env.local`

---

### `generate-embeddings.ts`

Generates semantic embeddings for words in `public/data/words.json` and outputs them to `public/data/words-with-embeddings.json`.

**Usage:**
```bash
npm run generate-embeddings
```

**When to run:**
- Automatically runs via post-commit hook when `public/data/words.json` changes
- Can also be run manually

**Smart regeneration:**
- Embeddings are based on: word, phonetic, language, category, definition, literal meaning, usage notes, English approximation, examples, and English paraphrase
- A hash of these fields is stored with each embedding
- Only regenerates when the hash changes (i.e., semantic content changed)
- Otherwise reuses existing embeddings for efficiency

**Requirements:**
- `OPENAI_API_KEY` in `.env.local`

---

## Git Hook

### `post-commit`

Post-commit hook that automatically runs metadata, pronunciation, and embedding generation when `public/data/words.json` is modified.

**Setup:**

To install the hook, run:
```bash
cp scripts/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

**What it does:**
1. Detects if `public/data/words.json` was modified in the last commit
2. Runs `generate-metadata.ts` for new words (generates phonetics, definitions, family, category, etc.)
3. Runs `generate-pronunciations.ts` for new/changed words
4. Runs `generate-embeddings.ts` to regenerate embeddings for words with changed semantic fields
5. Automatically stages all updated files

**Note:** The hook will skip steps if API keys are not configured.

---

## Environment Variables

Required API keys in `.env.local`:

```bash
OPENAI_API_KEY=your_openai_key_here
BRAINTRUST_API_KEY=your_braintrust_key_here
```

---

## Workflow

### Adding new words (Easy Mode 🎯):

1. Add a minimal word entry to `public/data/words.json` with just `word` and `language` fields:
   ```json
   {
     "word": "jayus",
     "language": "Indonesian"
   }
   ```
2. Commit your changes: `git add public/data/words.json && git commit -m "add jayus"`
3. The post-commit hook automatically:
   - **Generates comprehensive metadata** (phonetic, definition, family, category, literal, usage_notes, english_approx)
   - **Generates audio pronunciation** file
   - **Generates semantic embedding** for search
   - Stages all updated files (words.json, pronunciations/, words-with-embeddings.json)
4. Review the generated content and commit: `git commit -m "chore: update metadata, pronunciations, and embeddings"`

### Manual generation:

You can also run the full pipeline manually:
```bash
npm run generate:all
```

Or run individual steps:
```bash
npm run generate-metadata          # Generate metadata for new words
npm run generate-metadata:all      # Generate metadata for ALL words missing it
npm run generate-pronunciations    # Generate audio files
npm run generate-embeddings        # Generate semantic embeddings
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
- Backups are automatically created before modifying `words.json`

---

## Legacy Scripts (Deprecated)

The following scripts are kept for reference but are replaced by `generate-metadata.ts`:
- `generate-phonetics.ts` - Now handled by `generate-metadata.ts`
- `generate-definitions.ts` - Now handled by `generate-metadata.ts`
