# Data Scripts (Node only)

This project manages two dataset files:

- `public/data/words.json` — source of truth (no embeddings)
- `public/data/words-with-embeddings.json` — generated with embeddings (used by the app)

## Generate embeddings

- Requires `OPENAI_API_KEY` in the environment
- Run: `npm run generate:embeddings`
- Implementation: `scripts/generate-embeddings.mjs` (uses OpenAI `text-embedding-3-small`)

## CI automation

The workflow in `.github/workflows/generate-embeddings.yml` regenerates `words-with-embeddings.json` whenever `public/data/words.json` changes and pushes the updated file back to the branch.
