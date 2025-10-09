# Lexiconic

Lexiconic is a digital exploration of untranslatable words - terms from various languages that express concepts, feelings, or situations that lack a direct translation in English. Each word includes:

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alanagoyals-projects/v0-untranslatable-words-website)

## Features

- **Multiple viewing modes**: List, grid, and interactive map visualization
- **Semantic search**: Search by meaning, not just keywords
- **Audio pronunciations**: Hear how each word is pronounced
- **Flexible sorting**: Alphabetical, reverse, or randomized (with consistent seeds)
- **Responsive design**: Beautiful interface across all devices
- **Rich word data**: Includes categories, literal translations, and usage notes

## How It Works

### Data Structure
Words are stored in `/public/data/words.json` with the following information:
- Word in native script and romanization
- Language and language family
- Definition, literal meaning, and usage notes
- Pronunciation audio files (stored in `/public/pronunciations/`)
- Pre-computed embeddings for semantic search

### Semantic Search
The app uses AI embeddings to enable semantic search:
1. Each word's content is converted to a vector embedding
2. When you search, your query is also embedded
3. Results are ranked by cosine similarity to find conceptually related words
4. Embeddings are pre-computed and stored for fast searches

### Architecture
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Maps**: Mapbox GL for geographic visualization
- **Search**: Client-side semantic search with SWR for data fetching
- **Audio**: OpenAI TTS for pronunciation generation

## Running Locally

### Prerequisites
- Node.js 18+ and npm
- (Optional) OpenAI API key for pronunciation generation

### Important: `/lexiconic` Base Path

**This project is currently configured to be hosted at `/lexiconic` (not at the root).**

If you want to run it locally at the root path (recommended for local development), you'll need to make the following changes:

1. **Remove the basePath in `next.config.mjs`:**
   ```javascript
   // Change this:
   basePath: '/lexiconic',

   // To this:
   // basePath: '', // or remove the line entirely
   ```

2. **Update hardcoded paths in the codebase:**
   - `app/api/og/route.tsx` - Remove `/lexiconic` from font and image paths
   - Any other references to `/lexiconic` in your code

3. **Update environment variables:**
   ```bash
   # For local development, you can omit NEXT_PUBLIC_VERCEL_URL
   # or set it to your local URL:
   NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lexiconic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure for local development** (see "Important: `/lexiconic` Base Path" above)
   - Comment out or remove `basePath: '/lexiconic'` in `next.config.mjs`
   - Search for `/lexiconic` in the codebase and update paths as needed

4. **Set up environment variables**
   Create a `.env.local` file:
   ```bash
   # Required for pronunciation generation
   OPENAI_API_KEY=your_openai_api_key_here

   # Required for map view functionality
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

   # Required for running certain scripts (generate-definitions, generate-phonetics)
   BRAINTRUST_API_KEY=your_braintrust_api_key_here

   # Optional - defaults to localhost:3000 in development
   NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
   ```

   **Getting API Keys:**
   - **OpenAI**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
   - **Mapbox**: Get from [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens/)
   - **Braintrust**: Get from [braintrust.dev](https://www.braintrust.dev/)

   **Note:** The map view won't work without `NEXT_PUBLIC_MAPBOX_TOKEN`. Pronunciation generation and some scripts won't work without their respective API keys.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - If you removed the basePath: [http://localhost:3000](http://localhost:3000)
   - If you kept the basePath: [http://localhost:3000/lexiconic](http://localhost:3000/lexiconic)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npm run generate-pronunciations` - Generate audio for all words
- `npm run regenerate-pronunciations` - Regenerate audio for changed words

## Automation & Git Hooks

This project uses a **post-commit hook** to automatically generate pronunciations, phonetics, definitions, and embeddings when you modify `public/data/words.json`.

### Setting Up the Git Hook

```bash
cp scripts/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

### How It Works

When you commit changes to `public/data/words.json`, the hook automatically:

1. **Generates pronunciations** for new/changed words (requires `OPENAI_API_KEY`)
2. **Generates phonetic spellings** for new words without phonetics (requires `BRAINTRUST_API_KEY`)
3. **Generates definitions** for new words without definitions (requires `BRAINTRUST_API_KEY`)
4. **Regenerates embeddings** intelligently - only when semantic fields change (requires `OPENAI_API_KEY`)
5. **Stages all updated files** for you to review and commit

The hook gracefully skips steps if API keys are missing.

For detailed information about each script, see [scripts/README.md](scripts/README.md).

## Adding New Words

### Required Fields (You Must Provide)

When adding a new word to `/public/data/words.json`, you **must** manually provide these fields:

```json
{
  "word": "saudade",              // The word in its native script/romanization
  "native_script": "saudade",     // The word in native script (same as word if Latin alphabet)
  "language": "Portuguese",       // The language name
  "family": "Indo-European",      // The language family
  "category": "emotion/longing",  // Category (e.g., emotion, time, social, nature)
  "literal": "longing",           // Literal translation (optional, can be "")
  "usage_notes": "",              // Usage context (optional, can be "")
  "english_approx": "nostalgia",  // Closest English word/phrase
  "sources": "https://..."        // Source URL
}
```

### Auto-Generated Fields (Scripts Handle These)

The following fields are **automatically generated** by scripts (leave them out or set to empty strings):

- `"definition"` - Generated by `generate-definitions.ts` (requires `BRAINTRUST_API_KEY`)
- `"phonetic"` - Generated by `generate-phonetics.ts` (requires `BRAINTRUST_API_KEY`)
- `"pronunciation"` - Generated by `generate-pronunciations.ts` (requires `OPENAI_API_KEY`)
- `"embedding"` and `"embeddingHash"` - Generated by `generate-embeddings.ts` (requires `OPENAI_API_KEY`)

### Workflow: With Git Hook (Recommended)

1. Edit `/public/data/words.json` and add your new word with only the **required fields** above
2. Commit your changes: `git add public/data/words.json && git commit -m "add new words"`
3. The post-commit hook automatically generates all the auto-generated fields
4. Review the staged changes and commit them when ready

### Workflow: Manual Process

If you haven't set up the git hook, you can run scripts manually:

1. Edit `/public/data/words.json` with your new word (required fields only)
2. Run `npx tsx scripts/generate-definitions.ts`
3. Run `npx tsx scripts/generate-phonetics.ts`
4. Run `npx tsx scripts/generate-pronunciations.ts`
5. Run `npx tsx scripts/generate-embeddings.ts`

## Project Structure

```
lexiconic/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page with server-side sorting
│   ├── layout.tsx         # Root layout
│   └── api/               # API routes for search, pronunciations, etc.
├── components/            # React components
│   ├── words-client.tsx   # Main client component
│   ├── words-list.tsx     # List view
│   ├── map-view.tsx       # Map visualization
│   └── ...                # Other UI components
├── lib/                   # Utility functions
│   ├── load-words.ts      # Server-side word loading
│   └── semantic-search.ts # Embedding and search logic
├── public/
│   ├── data/              # Word data and embeddings
│   └── pronunciations/    # MP3 pronunciation files
└── scripts/               # Utility scripts
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit pull requests with new words, features, or improvements.