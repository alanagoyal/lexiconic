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
Words are stored in two separate files for optimal performance:

**`/public/data/words.json`** - All word metadata (fast initial load ~236KB):
- Word in native script and romanization
- Language, language family, and geographic location
- Definition, literal meaning, and usage notes
- Pronunciation audio file references (stored in `/public/pronunciations/`)

**`/public/data/embeddings.json`** - Pre-computed embeddings only (~14MB):
- Map of word → embedding vector + hash
- Loaded in background via SWR for semantic search
- Separate to keep words.json small and editable

### Semantic Search
The app uses AI embeddings to enable semantic search:
1. Each word's content is converted to a vector embedding (stored separately in embeddings.json)
2. When you search, your query is also embedded
3. Results are ranked by cosine similarity to find conceptually related words
4. Embeddings are pre-computed and loaded in background for fast searches
5. Word metadata loads instantly (~236KB), embeddings load progressively (~14MB)

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

1. **Generates metadata** for new words (phonetic, definition, family, category, literal, usage_notes, english_approx, location) - requires `BRAINTRUST_API_KEY`
2. **Generates pronunciations** for new/changed words (requires `OPENAI_API_KEY`)
3. **Regenerates embeddings** intelligently - only when semantic fields change (requires `OPENAI_API_KEY`)
4. **Stages all updated files** for you to review and commit

The hook gracefully skips steps if API keys are missing.

For detailed information about each script, see [scripts/README.md](scripts/README.md).

## Adding New Words

### Required Fields (You Must Provide)

When adding a new word to `/public/data/words.json`, you **must** manually provide these fields:

```json
{
  "word": "saudade",              // The word in its native script/romanization
  "language": "Portuguese",       // The language name
  "source": "https://..."         // Source URL
}
```

**Note:** The metadata generation script will now automatically generate all other required fields including `family`, `category`, `definition`, `literal`, `usage_notes`, `english_approx`, `phonetic`, and `location`.

### Auto-Generated Fields (Scripts Handle These)

The following fields are **automatically generated** by scripts (leave them out or set to empty strings):

- `"family"` - Language family (e.g., "Indo-European")
- `"category"` - Semantic category (e.g., "emotion/longing")
- `"definition"` - Detailed definition
- `"literal"` - Literal translation
- `"usage_notes"` - Cultural context and usage
- `"english_approx"` - Closest English approximation
- `"phonetic"` - IPA phonetic spelling
- `"location"` - Geographic location or origin
- `"pronunciation"` - Audio file path (MP3)

**Embeddings are stored separately in `/public/data/embeddings.json`** as a map of word → embedding data. This keeps the main words.json file small and editable.

**Most fields are generated by `generate-metadata.ts`** (requires `BRAINTRUST_API_KEY`)
**Audio files are generated by `generate-pronunciations.ts`** (requires `OPENAI_API_KEY`)
**Embeddings are generated by `generate-embeddings.ts`** and stored in `embeddings.json` (requires `OPENAI_API_KEY`)

### Workflow: CLI Tool (Recommended)

Use the built-in CLI to add words with automatic generation:

```bash
npm run add-word -- "word" "Language" "https://source-url"
```

This single command handles everything automatically!

### Workflow: With Git Hook

1. Edit `/public/data/words.json` and add your new word with minimal fields (word, language, source)
2. Commit your changes: `git add public/data/words.json && git commit -m "add new words"`
3. The post-commit hook automatically generates all metadata, pronunciations, and embeddings
4. Review the staged changes and commit them when ready

### Workflow: Manual Process

If you prefer to run scripts manually:

1. Edit `/public/data/words.json` with your new word (minimal fields)
2. Run `npm run generate-metadata` - Generates all metadata fields
3. Run `npm run generate-pronunciations` - Generates audio files
4. Run `npm run generate-embeddings` - Generates embeddings

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
│   ├── data/
│   │   ├── words.json           # Word metadata (no embeddings)
│   │   └── embeddings.json      # Embeddings map (word → vector)
│   └── pronunciations/          # MP3 pronunciation files
└── scripts/                     # Utility scripts
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit pull requests with new words, features, or improvements.