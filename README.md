# Lexiconic - Untranslatable Words

A beautiful, interactive web application for exploring untranslatable words from languages around the world. Discover words that capture unique concepts and emotions that don't have direct English equivalents.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alanagoyals-projects/v0-untranslatable-words-website)

## What is Lexiconic?

Lexiconic is a curated collection of untranslatable words—terms from various languages that express concepts, feelings, or situations that lack a direct translation in English. Each word includes:

- **Native script and pronunciation** - Audio pronunciation with phonetic transcription
- **Definition and context** - Detailed explanation of meaning and usage
- **Language information** - Language family and origin
- **English approximations** - Closest English equivalent
- **Semantic search** - Find words by meaning using AI-powered embeddings

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

3. **Set up environment variables** (optional, only needed for generating pronunciations)
   ```bash
   # Create .env.local file
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npm run generate-pronunciations` - Generate audio for all words
- `npm run regenerate-pronunciations` - Regenerate audio for changed words

## Adding New Words

To add words to the collection:

1. Edit `/public/data/words.json` following the existing schema
2. Run `npm run generate-pronunciations` to create audio files
3. The app will automatically pick up the new words on next load

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