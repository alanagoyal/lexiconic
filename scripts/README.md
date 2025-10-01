# Scripts

This folder contains scripts for managing the Lexiconic word database.

## Core Scripts

### `generate-embeddings.ts`

Generates semantic embeddings for words in `public/data/words.json` and outputs them to `public/data/words-with-embeddings.json`.

**Usage:**
```bash
npx tsx scripts/generate-embeddings.ts
```

**When to run:**
- Automatically runs via post-commit hook when `public/data/words.json` changes
- Can also be run manually

**Smart regeneration:**
- Embeddings are based on: word, transliteration, language, category, definition, literal meaning, usage notes, English approximation, examples, and English paraphrase
- A hash of these fields is stored with each embedding
- Only regenerates when the hash changes (i.e., semantic content changed)
- Otherwise reuses existing embeddings for efficiency

**Requirements:**
- `OPENAI_API_KEY` in `.env.local`

---

### `generate-pronunciations.ts`

Generates audio pronunciation files for new or changed words.

**Usage:**
```bash
npx tsx scripts/generate-pronunciations.ts
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

### `generate-definitions.ts`

Generates definitions for new words using Braintrust AI.

**Usage:**
```bash
npx tsx scripts/generate-definitions.ts
```

**When to run:**
- Automatically runs via post-commit hook when `public/data/words.json` changes
- Can also be run manually

**Behavior:**
- Detects new words from the last git commit
- Only generates definitions for words that don't have one
- Skips words with existing valid definitions
- Updates `public/data/words.json` with new definitions

**Requirements:**
- `BRAINTRUST_API_KEY` in `.env.local`

---

## Git Hook

### `post-commit`

Post-commit hook that automatically runs pronunciation, definition, and embedding generation when `public/data/words.json` is modified.

**Setup:**

To install the hook, run:
```bash
cp scripts/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

**What it does:**
1. Detects if `public/data/words.json` was modified in the last commit
2. Runs `generate-pronunciations.ts` for new/changed words
3. Runs `generate-definitions.ts` for new words
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

### Adding new words:

1. Edit `public/data/words.json` to add new words
2. Commit your changes: `git add public/data/words.json && git commit -m "add new words"`
3. The post-commit hook automatically:
   - Generates pronunciations for new/changed words
   - Generates definitions for new words without definitions
   - Regenerates embeddings for words with changed semantic fields
   - Stages all updated files (words.json, pronunciations/, words-with-embeddings.json)
4. The hook stages the files but doesn't commit them automatically - you can review and commit them when ready

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

- **All scripts** run automatically via the post-commit hook when `public/data/words.json` changes
- **Embeddings** are intelligently regenerated only when semantic fields change
- **Pronunciations** are generated for new or changed words
- **Definitions** are generated only for new words without existing definitions
- All scripts gracefully handle missing API keys
