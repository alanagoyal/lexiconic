const { getTransliteration } = require('./generate-transliterations-with-ai');

async function testSingleWord() {
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    console.log('Please set it by running: export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  // Test with one word
  const testWord = 'ikigai';
  const testNativeScript = '生きがい';
  const testLanguage = 'Japanese';

  console.log('Testing AI transliteration generation...\n');
  console.log(`Word: ${testWord}`);
  console.log(`Native Script: ${testNativeScript}`);
  console.log(`Language: ${testLanguage}\n`);

  try {
    const transliteration = await getTransliteration(testWord, testNativeScript, testLanguage);
    
    if (transliteration) {
      console.log(`✅ Generated transliteration: ${transliteration}`);
    } else {
      console.log('❌ Failed to generate transliteration');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testSingleWord();
