#!/usr/bin/env python3
"""
Generate embeddings for untranslatable words dataset using OpenAI's text-embedding-ada-002 model.
This script processes a JSON file of words and adds embedding vectors to each word entry.
"""

import json
import sys
import os
import time
from typing import Dict, List
import openai
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def load_words_dataset(filepath: str) -> List[Dict]:
    """Load the words dataset from JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {filepath} not found.")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file: {e}")
        sys.exit(1)

def create_embedding_text(word_data: Dict) -> str:
    """
    Create a comprehensive text representation of the word for embedding generation.
    This combines multiple fields to create a rich semantic representation.
    """
    parts = []
    
    # Core word information
    if word_data.get('word'):
        parts.append(f"Word: {word_data['word']}")
    
    if word_data.get('transliteration'):
        parts.append(f"Pronunciation: {word_data['transliteration']}")
    
    if word_data.get('language'):
        parts.append(f"Language: {word_data['language']}")
    
    if word_data.get('region'):
        parts.append(f"Region: {word_data['region']}")
    
    # Definition and meaning
    if word_data.get('definition'):
        parts.append(f"Definition: {word_data['definition']}")
    
    if word_data.get('literal'):
        parts.append(f"Literal meaning: {word_data['literal']}")
    
    if word_data.get('closest_english_paraphrase'):
        parts.append(f"English equivalent: {word_data['closest_english_paraphrase']}")
    
    # Context and usage
    if word_data.get('category'):
        parts.append(f"Category: {word_data['category']}")
    
    if word_data.get('usage_notes'):
        parts.append(f"Usage: {word_data['usage_notes']}")
    
    if word_data.get('example_gloss'):
        parts.append(f"Example: {word_data['example_gloss']}")
    
    return " | ".join(parts)

def generate_embedding(text: str, retry_count: int = 3) -> List[float]:
    """Generate embedding for given text using OpenAI's embedding model."""
    for attempt in range(retry_count):
        try:
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=text,
                encoding_format="float"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < retry_count - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise e

def process_words_with_embeddings(words: List[Dict], batch_size: int = 10) -> List[Dict]:
    """
    Process all words to add embeddings, with progress tracking and error handling.
    """
    total_words = len(words)
    processed_words = []
    
    print(f"Processing {total_words} words...")
    
    for i, word_data in enumerate(words):
        # Skip if embedding already exists
        if 'embedding' in word_data and word_data['embedding']:
            print(f"[{i+1}/{total_words}] Skipping {word_data.get('word', 'unknown')} - embedding exists")
            processed_words.append(word_data)
            continue
        
        try:
            # Create text for embedding
            embedding_text = create_embedding_text(word_data)
            
            # Generate embedding
            print(f"[{i+1}/{total_words}] Generating embedding for: {word_data.get('word', 'unknown')}")
            embedding = generate_embedding(embedding_text)
            
            # Add embedding to word data
            word_with_embedding = word_data.copy()
            word_with_embedding['embedding'] = embedding
            processed_words.append(word_with_embedding)
            
            # Rate limiting - OpenAI allows 3000 RPM for embeddings
            if (i + 1) % batch_size == 0:
                print(f"Processed {i + 1} words, sleeping briefly...")
                time.sleep(1)
                
        except Exception as e:
            print(f"Error processing word '{word_data.get('word', 'unknown')}': {e}")
            # Add word without embedding to avoid losing data
            processed_words.append(word_data)
            continue
    
    return processed_words

def save_words_with_embeddings(words: List[Dict], output_path: str):
    """Save the words dataset with embeddings to JSON file."""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(words, f, ensure_ascii=False, indent=2)
        print(f"Dataset with embeddings saved to: {output_path}")
    except Exception as e:
        print(f"Error saving file: {e}")
        sys.exit(1)

def main():
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("Error: OPENAI_API_KEY environment variable not set.")
        print("Please set your OpenAI API key:")
        print("export OPENAI_API_KEY='your-api-key-here'")
        sys.exit(1)
    
    if len(sys.argv) != 2:
        print("Usage: python generate_embeddings.py <input_json_file>")
        print("Example: python generate_embeddings.py public/data/words-updated.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Generate output filename
    if input_file.endswith('.json'):
        output_file = input_file.replace('.json', '-with-embeddings.json')
    else:
        output_file = f"{input_file}-with-embeddings.json"
    
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    
    # Load dataset
    words = load_words_dataset(input_file)
    print(f"Loaded {len(words)} words from dataset")
    
    # Count existing embeddings
    existing_embeddings = sum(1 for word in words if word.get('embedding'))
    print(f"Found {existing_embeddings} existing embeddings")
    
    if existing_embeddings == len(words):
        print("All words already have embeddings!")
        return
    
    # Process words to add embeddings
    words_with_embeddings = process_words_with_embeddings(words)
    
    # Save result
    save_words_with_embeddings(words_with_embeddings, output_file)
    
    # Summary
    final_embeddings = sum(1 for word in words_with_embeddings if word.get('embedding'))
    print(f"\nSummary:")
    print(f"- Total words: {len(words_with_embeddings)}")
    print(f"- Words with embeddings: {final_embeddings}")
    print(f"- Success rate: {final_embeddings/len(words_with_embeddings)*100:.1f}%")

if __name__ == "__main__":
    main()