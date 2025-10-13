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
- `npm run add-word "word" "Language" "source"` - Add a new word with automatic generation
- `npm run generate` - Generate all missing metadata, pronunciations, and embeddings
- `npm run generate-metadata` - Generate metadata for words missing it
- `npm run generate-pronunciations` - Generate audio for words missing it
- `npm run generate-embeddings` - Generate embeddings for words with changed content

## Adding New Words

### Method 1: CLI (Recommended)

The easiest way to add a word is to use the CLI tool:

```bash
npm run add-word "saudade" "Portuguese" "https://example.com/source"
```

**What it does:**
1. Validates inputs and checks for duplicates
2. Creates a temporary backup of `words.json`
3. Generates comprehensive metadata via Braintrust AI
4. Generates pronunciation audio via OpenAI TTS
5. Generates semantic embeddings via OpenAI
6. Rolls back on error or cleans up backup on success

**Then commit:**
```bash
git add .
git commit -m "add saudade"
git push
```

### Method 2: Manually Add + Generate Metadata

If you prefer to manually edit the JSON:

**1. Add minimal entry to `/public/data/words.json`:**
```json
{
  "word": "saudade",
  "language": "Portuguese",
  "source": "https://example.com/source"
}
```

**2. Run generation (processes only what's needed):**
```bash
npm run generate
```

This runs three scripts in sequence, each processing only words that need processing:
- `generate-metadata` - Fills in missing metadata fields
- `generate-pronunciations` - Creates missing audio files
- `generate-embeddings` - Generates missing/changed embeddings

**3. Commit the changes:**
```bash
git add .
git commit -m "add saudade"
```

### Method 3: Manually Add Metadata

If you have your own metadata but want to generate only pronunciation and embeddings:

**1. Add complete metadata entry to `/public/data/words.json`:**
```json
{
  "word": "saudade",
  "language": "Portuguese",
  "source": "https://example.com/source",
  "family": "Indo-European",
  "category": "Emotion",
  "definition": "A deep emotional state of nostalgic or profound melancholic longing for something or someone that one cares for and/or loves.",
  "literal": "Longing, missing, nostalgia",
  "usage_notes": "Often associated with Portuguese and Brazilian culture, expressing the feeling of missing something that may never return.",
  "english_approx": "nostalgia, longing, yearning",
  "phonetic": "saw-ˈdɑ-dʒi",
  "location": "Portugal",
  "lat": 39.3999,
  "lng": -8.2245
}
```

**2. Generate only pronunciation and embeddings:**
```bash
# Generate just pronunciation audio
npm run generate-pronunciations

# Generate just embeddings
npm run generate-embeddings
```

**3. Commit the changes:**
```bash
git add .
git commit -m "add saudade"
```

## Updating Words

### Updating All Words

If you want to regenerate metadata, pronunciations, or embeddings for all words (e.g., after updating prompts):

```bash
# Regenerate all metadata
npm run generate-metadata -- --all

# Regenerate all pronunciations
npm run generate-pronunciations -- --all

# Regenerate all embeddings
npm run generate-embeddings -- --all
```

### Updating Specific Fields

The `scripts/deprecated/` directory contains granular scripts for regenerating individual metadata fields. These are useful when you need to update or fix specific fields without regenerating all metadata:

**Available Scripts:**

- **`generate-definitions.ts`** - Regenerates only the `definition` field
- **`generate-phonetics.ts`** - Regenerates only the `phonetic` field
- **`generate-usage-notes.ts`** - Regenerates only the `usage_notes` field
- **`generate-locations.ts`** - Regenerates only the `location` field

**Requirements:**
- `BRAINTRUST_API_KEY` must be set in `.env.local`
- All scripts create automatic backups in `/public/data/backup/` before making changes (deleted on success)

**Usage Examples:**

```bash
# Regenerate definitions for words missing this field only (default)
npx tsx scripts/deprecated/generate-definitions.ts

# Regenerate definitions for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-definitions.ts -- --all

# Regenerate phonetics for words missing this field only (default)
npx tsx scripts/deprecated/generate-phonetics.ts

# Regenerate phonetics for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-phonetics.ts -- --all

# Regenerate usage notes for words missing this field only (default)
npx tsx scripts/deprecated/generate-usage-notes.ts

# Regenerate usage notes for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-usage-notes.ts -- --all

# Regenerate locations for words missing this field only (default)
npx tsx scripts/deprecated/generate-locations.ts

# Regenerate locations for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-locations.ts -- --all
```

**When to use:**
- After updating a specific Braintrust prompt
- To fix incorrect data in a specific field
- To add a field to words that are missing it
- When testing changes to field generation logic

**Note:** These scripts are considered "deprecated" because the main workflow uses `generate-metadata.ts` which handles all fields at once. However, they remain useful for targeted updates.

## Project Structure

```
lexiconic/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page with server-side sorting
│   ├── layout.tsx         # Root layout
│   └── api/               # API routes for search, pronunciations, etc.
├── braintrust/            # Braintrust prompts
├── components/            # React components
│   ├── words-client.tsx   # Main client component
│   ├── words-list.tsx     # List view
│   ├── map-view.tsx       # Map visualization
│   └── ...                # Other UI components
├── hooks/                 # Custom React hooks
│   ├── use-device-type.ts # Device type detection
│   └── use-url-state.ts   # URL state management
├── lib/                   # Utility functions
│   ├── load-words.ts      # Server-side word loading
│   └── semantic-search.ts # Embedding and search logic
├── public/
│   ├── data/
│   │   ├── words.json           # Word metadata (no embeddings)
│   │   └── embeddings.json      # Embeddings map (word → vector)
│   ├── images/
│   │   └── og.png               # Open Graph image
│   └── pronunciations/          # MP3 pronunciation files
└── scripts/                     # Utility scripts
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit pull requests with new words, features, or improvements.