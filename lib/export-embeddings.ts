import type { WordWithEmbedding } from '@/components/words-client'

// Function to export embeddings to JSON file
export function exportEmbeddingsToJSON(words: WordWithEmbedding[]): string {
  const dataToExport = words.map(word => ({
    ...word,
    // Keep embeddings but remove searchableText (can be regenerated)
    searchableText: undefined
  }))
  
  return JSON.stringify(dataToExport, null, 2)
}

// Function to download embeddings as JSON file
export function downloadEmbeddings(words: WordWithEmbedding[], filename: string = 'words-with-embeddings.json') {
  const jsonData = exportEmbeddingsToJSON(words)
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  URL.revokeObjectURL(url)
}

// Function to copy embeddings to clipboard
export async function copyEmbeddingsToClipboard(words: WordWithEmbedding[]): Promise<void> {
  const jsonData = exportEmbeddingsToJSON(words)
  
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(jsonData)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = jsonData
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}