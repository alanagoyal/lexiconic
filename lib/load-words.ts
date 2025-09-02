import type { WordData, WordWithEmbedding } from '@/components/words-client'
import { createSearchableText } from './semantic-search'

// Try to load words with embeddings from local file first, fallback to CSV
export async function loadWords(): Promise<WordWithEmbedding[]> {
  try {
    // Try to load from local JSON file with embeddings
    const localDataResponse = await fetch('/data/words-with-embeddings.json', {
      cache: 'force-cache'
    })
    
    if (localDataResponse.ok) {
      const wordsWithEmbeddings: WordWithEmbedding[] = await localDataResponse.json()
      console.log('Loaded words with pre-computed embeddings from local file')
      
      // Regenerate searchableText if missing
      return wordsWithEmbeddings.map(word => ({
        ...word,
        searchableText: word.searchableText || createSearchableText(word)
      }))
    }
  } catch (error) {
    console.log('Local embeddings file not found, falling back to CSV')
  }

  // Fallback: Load from remote CSV (original behavior)
  const csvResponse = await fetch(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untranslatable%20Words%20with%20Sources-Qg29WupfgFGdmHN545eqNO3O0rS39g.csv",
    {
      cache: "force-cache",
      headers: { Accept: "text/csv,text/plain,*/*" },
    }
  )

  if (!csvResponse.ok) {
    throw new Error(`Failed to fetch CSV: ${csvResponse.status}`)
  }

  const csvText = await csvResponse.text()
  const words = parseCSV(csvText)
  
  console.log('Loaded words from CSV (no embeddings)')
  return words.map(word => ({
    ...word,
    searchableText: createSearchableText(word)
  }))
}

function parseCSV(csvText: string): WordData[] {
  const lines = csvText.split("\n").filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0]
    .split(",")
    .map((h) => h.replace(/"/g, "").trim())

  const parsed: WordData[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.replace(/^"|"$/g, "").trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.replace(/^"|"$/g, "").trim())

    if (values.length >= headers.length) {
      const wordObj: any = {}
      headers.forEach((header, index) => {
        wordObj[header] = values[index] || ""
      })

      if (wordObj.word && wordObj.definition) {
        parsed.push(wordObj as WordData)
      }
    }
  }

  return parsed
}