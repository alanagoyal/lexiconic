export const dynamic = "force-static"

import { WordsClient, type WordData } from "@/components/words-client"

async function fetchCSV(): Promise<string> {
  const res = await fetch(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untranslatable%20Words%20with%20Sources-Qg29WupfgFGdmHN545eqNO3O0rS39g.csv",
    {
      // Ensure build-time caching for fully static output
      cache: "force-cache",
      headers: { Accept: "text/csv,text/plain,*/*" },
    },
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status}`)
  }
  return res.text()
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

export default async function HomePage() {
  const csvText = await fetchCSV()
  const words = parseCSV(csvText)

  return <WordsClient words={words} />
}
