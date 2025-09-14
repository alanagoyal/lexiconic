# Data Processing Scripts

This directory contains scripts for managing the untranslatable words dataset and embeddings.

## Scripts Overview

### 1. `extract_blog_words.py`
Extracts untranslatable words from blog posts and adds them to the existing dataset while avoiding duplicates.

**Usage:**
```bash
python scripts/extract_blog_words.py public/data/words-with-embeddings.json
```

**Features:**
- Detects and reports duplicate words
- Standardizes word format to match existing dataset schema
- Creates a new dataset file without embeddings for processing
- Configurable source attribution

**Manual Setup Required:**
You need to manually populate the `BLOG_WORDS_DATA` list in the script with words from the blog post. The script includes a sample format to follow.

### 2. `generate_embeddings.py`
Generates OpenAI embeddings for words in the dataset.

**Prerequisites:**
- OpenAI API key set as environment variable: `export OPENAI_API_KEY='your-key-here'`
- Install required package: `pip install openai`

**Usage:**
```bash
python scripts/generate_embeddings.py public/data/words-updated.json
```

**Features:**
- Skips words that already have embeddings
- Comprehensive text representation for better embeddings
- Progress tracking and error handling
- Rate limiting for API compliance
- Generates rich semantic embeddings combining multiple word fields

### 3. `analyze-data.py`
Existing script for analyzing and processing CSV data from external sources.

## GitHub Actions Integration

The repository includes a GitHub Action workflow (`.github/workflows/update-embeddings.yml`) that:

1. **Triggers on:**
   - Push to main/develop branches with changes to `public/data/*words*.json`
   - Pull requests to main branch with data changes
   - Manual workflow dispatch

2. **Process:**
   - Detects changes to words data files
   - Automatically generates embeddings using OpenAI API
   - Commits the updated embeddings file
   - Pushes changes back to the repository

3. **Requirements:**
   - `OPENAI_API_KEY` must be set as a repository secret
   - GitHub Actions must have write permissions to the repository

## Data Format

### Input Format (from blog/sources)
```json
{
  "word": "Saudade",
  "language": "Portuguese",
  "definition": "A deep emotional state of longing for something absent",
  "region": "Brazil/Portugal",
  "category": "emotion"
}
```

### Output Format (standardized with embeddings)
```json
{
  "word": "Saudade",
  "native_script": "Saudade",
  "transliteration": "",
  "language": "Portuguese",
  "family": "Romance",
  "category": "emotion",
  "definition": "A deep emotional state of longing for something absent",
  "literal": "",
  "usage_notes": "",
  "example_native": "",
  "example_gloss": "",
  "english_approx": "",
  "loanword_in_english": "False",
  "disputed": "False",
  "region": "Brazil/Portugal",
  "closest_english_paraphrase": "longing",
  "sources": "https://www.theintrepidguide.com/untranslatable-words-ultimate-list/",
  "needs_citation": "False",
  "embedding": [0.023, -0.041, 0.012, ...]
}
```

## Workflow Example

1. **Add new words:**
   ```bash
   # Edit extract_blog_words.py to add new words to BLOG_WORDS_DATA
   python scripts/extract_blog_words.py public/data/words-with-embeddings.json
   ```

2. **Generate embeddings:**
   ```bash
   export OPENAI_API_KEY='your-api-key'
   python scripts/generate_embeddings.py public/data/words-updated.json
   ```

3. **Commit changes:**
   ```bash
   git add public/data/
   git commit -m "Add new untranslatable words with embeddings"
   git push
   ```

4. **Or use automation:**
   - Just commit the raw words data
   - GitHub Actions will automatically generate and commit embeddings

## Cost Considerations

- OpenAI embeddings cost approximately $0.0001 per 1K tokens
- Each word typically uses 50-100 tokens for embedding generation
- 100 new words ≈ $0.50-1.00 in API costs

## Troubleshooting

### Common Issues

1. **Missing OpenAI API Key:**
   - Set environment variable: `export OPENAI_API_KEY='your-key'`
   - For GitHub Actions: Add as repository secret

2. **Rate Limiting:**
   - Script includes automatic rate limiting
   - OpenAI allows 3000 requests per minute for embeddings

3. **File Not Found:**
   - Check file paths are correct
   - Ensure JSON files are valid format

4. **GitHub Action Fails:**
   - Check repository secrets include `OPENAI_API_KEY`
   - Verify GitHub Actions has write permissions
   - Check workflow logs for specific errors