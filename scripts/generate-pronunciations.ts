import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Word {
  word: string;
  native_script: string;
  transliteration: string;
  language: string;
  [key: string]: any;
}

// Generate a safe filename from a word
function generateAudioFileName(word: string): string {
  // Create a hash of the word for the filename to avoid special character issues
  const hash = crypto.createHash('md5').update(word).digest('hex');
  return `${hash}.mp3`;
}

// Generate pronunciation for a single word
async function generatePronunciation(word: string, outputPath: string): Promise<void> {
  try {
    console.log(`Generating pronunciation for: ${word}`);

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: word,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(outputPath, buffer);

    console.log(`✓ Saved pronunciation to: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to generate pronunciation for "${word}":`, error);
    throw error;
  }
}

// Main function to generate all pronunciations
async function generateAllPronunciations() {
  try {
    // Read words from JSON
    const wordsPath = path.join(process.cwd(), 'public/data/words.json');
    const wordsContent = await fs.readFile(wordsPath, 'utf-8');
    const words: Word[] = JSON.parse(wordsContent);

    // Create pronunciations directory if it doesn't exist
    const pronunciationsDir = path.join(process.cwd(), 'public/pronunciations');
    await fs.mkdir(pronunciationsDir, { recursive: true });

    // Create a mapping file to link words to their audio files
    const mapping: Record<string, string> = {};

    console.log(`\nGenerating pronunciations for ${words.length} words...\n`);

    // Generate pronunciations for each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const fileName = generateAudioFileName(word.word);
      const outputPath = path.join(pronunciationsDir, fileName);

      // Skip if file already exists
      try {
        await fs.access(outputPath);
        console.log(`⊘ Skipping "${word.word}" (already exists)`);
        mapping[word.word] = fileName;
        continue;
      } catch {
        // File doesn't exist, generate it
      }

      await generatePronunciation(word.word, outputPath);
      mapping[word.word] = fileName;

      // Add a small delay to avoid rate limiting
      if (i < words.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Save the mapping file
    const mappingPath = path.join(pronunciationsDir, 'mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`\n✓ Saved pronunciation mapping to: ${mappingPath}`);

    console.log(`\n✅ Successfully generated ${Object.keys(mapping).length} pronunciations`);
  } catch (error) {
    console.error('Error generating pronunciations:', error);
    process.exit(1);
  }
}

// Run the script
generateAllPronunciations();
