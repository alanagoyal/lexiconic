# lexiconic

lexiconic is a digital exploration of untranslatable words - terms from various languages that express concepts, feelings, or situations that lack a direct translation in english. each word includes:

[![deployed on vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alanagoyals-projects/v0-untranslatable-words-website)

## features

- **multiple viewing modes**: list, grid, and interactive map visualization
- **semantic search**: search by meaning, not just keywords
- **audio pronunciations**: hear how each word is pronounced
- **flexible sorting**: alphabetical, reverse, or randomized (with consistent seeds)
- **responsive design**: beautiful interface across all devices
- **rich word data**: includes categories, literal translations, and usage notes

## how it works

### data structure
words are stored in two separate files for optimal performance:

**`/public/data/words.json`** - all word metadata (fast initial load ~236kb):
- word in native script and romanization
- language, language family, and geographic location
- definition, literal meaning, and usage notes
- pronunciation audio file references (stored in `/public/pronunciations/`)

**`/public/data/embeddings.json`** - pre-computed embeddings only (~14mb):
- map of word → embedding vector + hash
- loaded in background via swr for semantic search
- separate to keep words.json small and editable

### semantic search
the app uses ai embeddings to enable semantic search:
1. each word's content is converted to a vector embedding (stored separately in embeddings.json)
2. when you search, your query is also embedded
3. results are ranked by cosine similarity to find conceptually related words
4. embeddings are pre-computed and loaded in background for fast searches
5. word metadata loads instantly (~236kb), embeddings load progressively (~14mb)

### architecture
- **framework**: next.js 15 with react 19
- **styling**: tailwind css with shadcn/ui components
- **maps**: mapbox gl for geographic visualization
- **search**: client-side semantic search with swr for data fetching
- **audio**: openai tts for pronunciation generation

## running locally

### prerequisites
- node.js 18+ and npm
- (optional) openai api key for pronunciation generation

### important: `/lexiconic` base path

**this project is currently configured to be hosted at `/lexiconic` (not at the root).**

if you want to run it locally at the root path (recommended for local development), you'll need to make the following changes:

1. **remove the `basePath` in `next.config.mjs`:**
   ```javascript
   // Change this:
   basePath: '/lexiconic',

   // To this:
   // basePath: '', // or remove the line entirely
   ```

2. **update hardcoded paths in the codebase:**
   - `app/api/og/route.tsx` - remove `/lexiconic` from font and image paths
   - any other references to `/lexiconic` in your code

3. **update environment variables:**
   ```bash
   # For local development, you can omit NEXT_PUBLIC_VERCEL_URL
   # or set it to your local URL:
   NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
   ```

### installation

1. **clone the repository**
   ```bash
   git clone <repository-url>
   cd lexiconic
   ```

2. **install dependencies**
   ```bash
   npm install
   ```

3. **configure for local development** (see "important: `/lexiconic` base path" above)
   - comment out or remove `basePath: '/lexiconic'` in `next.config.mjs`
   - search for `/lexiconic` in the codebase and update paths as needed

4. **set up environment variables**
   create a `.env.local` file:
   ```bash
   # Required for pronunciation generation
   OPENAI_API_KEY=your_openai_api_key_here

   # Required for map view functionality
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

   # Required for running certain scripts (generate-definition, generate-phonetic)
   BRAINTRUST_API_KEY=your_braintrust_api_key_here

   # Optional - defaults to localhost:3000 in development
   NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
   ```

   **getting api keys:**
   - **openai**: get from [platform.openai.com](https://platform.openai.com/api-keys)
   - **mapbox**: get from [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens/)
   - **braintrust**: get from [braintrust.dev](https://www.braintrust.dev/)

   **note:** the map view won't work without `NEXT_PUBLIC_MAPBOX_TOKEN`. pronunciation generation and some scripts won't work without their respective api keys.

5. **run the development server**
   ```bash
   npm run dev
   ```

6. **open your browser**
   - if you removed the `basePath`: [http://localhost:3000](http://localhost:3000)
   - if you kept the `basePath`: [http://localhost:3000/lexiconic](http://localhost:3000/lexiconic)

### available scripts

- `npm run dev` - start development server
- `npm run build` - build for production
- `npm start` - run production build
- `npm run lint` - run eslint
- `npm run add-word "word" "Language" "source"` - add a new word with automatic generation
- `npm run generate` - generate all missing metadata, pronunciations, and embeddings
- `npm run generate-metadata` - generate metadata for words missing it
- `npm run generate-pronunciation` - generate audio for words missing it
- `npm run generate-embedding` - generate embeddings for words with changed content

## adding new words

### method 1: cli (recommended)

the easiest way to add a word is to use the cli tool:

```bash
npm run add-word "saudade" "Portuguese" "https://example.com/source"
```

**what it does:**
1. validates inputs and checks for duplicates
2. creates a temporary backup of `words.json`
3. generates comprehensive metadata via braintrust ai
4. generates pronunciation audio via openai tts
5. generates semantic embeddings via openai
6. rolls back on error or cleans up backup on success

**then commit:**
```bash
git add .
git commit -m "add saudade"
git push
```

### method 2: manually add + generate metadata

if you prefer to manually edit the json:

**1. add minimal entry to `/public/data/words.json`:**
```json
{
  "word": "saudade",
  "language": "Portuguese",
  "source": "https://example.com/source"
}
```

**2. run generation (processes only what's needed):**
```bash
npm run generate
```

this runs three scripts in sequence, each processing only words that need processing:
- `generate-metadata` - fills in missing metadata fields
- `generate-pronunciation` - creates missing audio files
- `generate-embedding` - generates missing/changed embeddings

**3. commit the changes:**
```bash
git add .
git commit -m "add saudade"
```

### method 3: manually add metadata

if you have your own metadata but want to generate only pronunciation and embeddings:

**1. add complete metadata entry to `/public/data/words.json`:**
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

**2. generate only pronunciation and embeddings:**
```bash
# Generate just pronunciation audio
npm run generate-pronunciation

# Generate just embeddings
npm run generate-embedding
```

**3. commit the changes:**
```bash
git add .
git commit -m "add saudade"
```

## updating words

### updating all words

if you want to regenerate metadata, pronunciations, or embeddings for all words (e.g., after updating prompts):

```bash
# Regenerate all metadata
npm run generate-metadata -- --all

# Regenerate all pronunciations
npm run generate-pronunciation -- --all

# Regenerate all embeddings
npm run generate-embedding -- --all
```

### updating specific fields

the `scripts/deprecated/` directory contains granular scripts for regenerating individual metadata fields. these are useful when you need to update or fix specific fields without regenerating all metadata:

**available scripts:**

- **`generate-definition.ts`** - regenerates only the `definition` field
- **`generate-phonetic.ts`** - regenerates only the `phonetic` field
- **`generate-usage-note.ts`** - regenerates only the `usage_notes` field
- **`generate-location.ts`** - regenerates only the `location` field

**requirements:**
- `BRAINTRUST_API_KEY` must be set in `.env.local`
- all scripts create automatic backups in `/public/data/backup/` before making changes (deleted on success)

**usage examples:**

```bash
# Regenerate definitions for words missing this field only (default)
npx tsx scripts/deprecated/generate-definition.ts

# Regenerate definitions for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-definition.ts -- --all

# Regenerate phonetics for words missing this field only (default)
npx tsx scripts/deprecated/generate-phonetic.ts

# Regenerate phonetics for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-phonetic.ts -- --all

# Regenerate usage notes for words missing this field only (default)
npx tsx scripts/deprecated/generate-usage-note.ts

# Regenerate usage notes for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-usage-note.ts -- --all

# Regenerate locations for words missing this field only (default)
npx tsx scripts/deprecated/generate-location.ts

# Regenerate locations for ALL words (force regeneration)
npx tsx scripts/deprecated/generate-location.ts -- --all
```

**when to use:**
- after updating a specific braintrust prompt
- to fix incorrect data in a specific field
- to add a field to words that are missing it
- when testing changes to field generation logic

**note:** these scripts are considered "deprecated" because the main workflow uses `generate-metadata.ts` which handles all fields at once. however, they remain useful for targeted updates.

## project structure

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

## license

mit

## contributing

contributions are welcome! feel free to submit pull requests with new words, features, or improvements.