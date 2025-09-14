#!/usr/bin/env node
/**
 * Augment the base dataset with words scraped from:
 * https://www.theintrepidguide.com/untranslatable-words-ultimate-list/
 *
 * - Loads base dataset from public/data/words.json (or derives from words-with-embeddings.json)
 * - Scrapes the blog for (language, word, definition) entries
 * - Normalizes and deduplicates against existing words (by word+language)
 * - Saves updated dataset to public/data/words.json
 */

import fs from 'node:fs'
import path from 'node:path'

const SOURCE_URL = 'https://www.theintrepidguide.com/untranslatable-words-ultimate-list/'

function decodeHtmlEntities(input) {
  if (!input) return ''
  let s = input
  // Numeric decimal entities
  s = s.replace(/&#(\d+);/g, (_, d) => {
    try { return String.fromCodePoint(parseInt(d, 10)) } catch { return _ }
  })
  // Numeric hex entities
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
    try { return String.fromCodePoint(parseInt(h, 16)) } catch { return _ }
  })
  // Named entities (minimal set)
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  return s
}

function stripTags(html) {
  return decodeHtmlEntities(String(html).replace(/<[^>]*>/g, ''))
}

function normalizeKey(word, language) {
  const strip = (s) => (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return `${strip(word)}|${strip(language)}`
}

function looksLikeLanguageHeading(text) {
  // Heuristic: language headings are typically one or two words without punctuation
  const t = (text || '').trim()
  if (!t) return false
  if (/\d|\.|,|:|;|\?|!|\(|\)|\[|\]|\{|\}|\//.test(t)) return false
  const words = t.split(/\s+/)
  if (words.length > 3) return false
  // Allow names like "Mexican Spanish", "Old Norse", etc.
  return true
}

async function fetchHtml(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return await res.text()
}

function extractEntriesFromHtml(html) {
  const entries = []
  // Scan through <h2> and <p> blocks in order
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>|<p[^>]*>([\s\S]*?)<\/p>/gi
  let m
  let currentLanguage = null
  let started = false
  while ((m = re.exec(html)) !== null) {
    const [match, h2Inner, pInner] = m
    if (h2Inner !== undefined) {
      const langText = stripTags(h2Inner)
      if (!started) {
        // Start when we hit the first language-looking heading (e.g., 'Afrikaans')
        if (looksLikeLanguageHeading(langText)) {
          started = true
          currentLanguage = langText
        }
      } else {
        // Within the list, update current language when hitting next heading
        if (looksLikeLanguageHeading(langText)) {
          currentLanguage = langText
        }
      }
      continue
    }

    if (!started || !currentLanguage) continue
    if (pInner !== undefined) {
      const pHtml = pInner
      // Require a <strong>WORD</strong> followed by a dash and description
      if (!/</.test(pHtml)) continue
      const strongMatch = /<strong[^>]*>([\s\S]*?)<\/strong>/i.exec(pHtml)
      if (!strongMatch) continue
      let strongHtml = strongMatch[1] || ''
      strongHtml = strongHtml.replace(/<img[\s\S]*?>/gi, '')
      const wordRaw = stripTags(strongHtml).trim()
      if (!wordRaw) continue
      // Ignore promotional headings like 'Learn X for travel'
      if (/^learn\b/i.test(wordRaw) || /travel/i.test(wordRaw)) continue

      const after = pHtml.split('</strong>')[1] || ''
      let desc = stripTags(after).trim()
      desc = desc.replace(/^[-–—\s]+/, '').trim()
      // require that original HTML had a dash immediately after </strong>
      if (!/<\/strong>\s*[–—-]/.test(pHtml)) continue
      if (!desc || desc.length < 2) continue

      entries.push({ language: currentLanguage, word: wordRaw, definition: desc })
    }
  }
  return entries
}

function ensureBaseWordsJson(basePath, embeddedPath) {
  if (fs.existsSync(basePath)) return
  if (!fs.existsSync(embeddedPath)) {
    throw new Error('No base dataset found. Expected one of:\n' + basePath + '\n' + embeddedPath)
  }
  const raw = fs.readFileSync(embeddedPath, 'utf8')
  const withEmb = JSON.parse(raw)
  const withoutEmb = withEmb.map(({ embedding, searchableText, ...rest }) => rest)
  fs.mkdirSync(path.dirname(basePath), { recursive: true })
  fs.writeFileSync(basePath, JSON.stringify(withoutEmb, null, 2))
  console.log(`[init] Created ${basePath} from existing words-with-embeddings.json`)
}

async function main() {
  const basePath = path.join(process.cwd(), 'public', 'data', 'words.json')
  const embeddedPath = path.join(process.cwd(), 'public', 'data', 'words-with-embeddings.json')

  ensureBaseWordsJson(basePath, embeddedPath)

  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'))
  const existingKeys = new Set(base.map(w => normalizeKey(w.word, w.language)))
  console.log(`[base] Loaded ${base.length} entries from words.json`)

  const html = await fetchHtml(SOURCE_URL)
  const scraped = extractEntriesFromHtml(html)
  console.log(`[scrape] Found ${scraped.length} entries on source page`)

  const newItems = []
  for (const item of scraped) {
    const key = normalizeKey(item.word, item.language)
    if (existingKeys.has(key)) continue
    existingKeys.add(key)
    newItems.push({
      word: item.word,
      native_script: item.word,
      transliteration: '',
      language: item.language,
      family: '',
      category: '',
      definition: item.definition,
      literal: '',
      usage_notes: '',
      example_native: '',
      example_gloss: '',
      english_approx: '',
      loanword_in_english: 'False',
      disputed: 'False',
      region: '',
      closest_english_paraphrase: '',
      sources: SOURCE_URL,
      needs_citation: 'False',
    })
  }

  if (newItems.length === 0) {
    console.log('[merge] No new items to add (after dedupe).')
    return
  }

  const updated = base.concat(newItems)
  fs.writeFileSync(basePath, JSON.stringify(updated, null, 2))
  console.log(`[merge] Added ${newItems.length} new items. New total: ${updated.length}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

