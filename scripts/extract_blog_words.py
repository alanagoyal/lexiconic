#!/usr/bin/env python3
"""
Script to extract untranslatable words from The Intrepid Guide blog post
and add them to the existing dataset while avoiding duplicates.

Manual data entry for blog post: 
https://www.theintrepidguide.com/untranslatable-words-ultimate-list/
"""

import json
import sys
from typing import Dict, List, Set

# Sample words from the blog post that need to be manually populated
# This is a partial list - you'll need to add the complete list from the blog
BLOG_WORDS_DATA = [
    {
        "word": "Abbiocco",
        "language": "Italian",
        "definition": "The drowsiness that comes after a big meal",
        "region": "Italy",
        "category": "food/emotion"
    },
    {
        "word": "Age-otori",
        "language": "Japanese", 
        "definition": "To look worse after a haircut",
        "region": "Japan",
        "category": "appearance"
    },
    {
        "word": "Akihi",
        "language": "Hawaiian",
        "definition": "To get driving directions, walk away, and immediately forget them",
        "region": "Hawaii",
        "category": "memory/behavior"
    },
    {
        "word": "Apapachar",
        "language": "Spanish",
        "definition": "To tenderly hug with one's soul",
        "region": "Mexico",
        "category": "affection"
    },
    {
        "word": "Arbejdsglæde",
        "language": "Danish",
        "definition": "The joy and satisfaction derived from work",
        "region": "Denmark", 
        "category": "work/emotion"
    },
    # Add more words here from the complete blog post...
    # This is just a sample to demonstrate the structure
]

def load_existing_dataset(filepath: str) -> List[Dict]:
    """Load the existing words dataset."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {filepath} not found. Starting with empty dataset.")
        return []

def normalize_word_for_comparison(word: str) -> str:
    """Normalize word for duplicate comparison."""
    return word.lower().strip()

def find_duplicates(existing_words: List[Dict], new_words: List[Dict]) -> Set[str]:
    """Find duplicate words between existing and new datasets."""
    existing_normalized = {
        normalize_word_for_comparison(word.get('word', '')) 
        for word in existing_words
    }
    
    duplicates = set()
    for new_word in new_words:
        normalized = normalize_word_for_comparison(new_word.get('word', ''))
        if normalized in existing_normalized:
            duplicates.add(new_word.get('word', ''))
    
    return duplicates

def standardize_blog_word(blog_word: Dict) -> Dict:
    """Convert blog word format to match existing dataset structure."""
    return {
        "word": blog_word.get('word', ''),
        "native_script": blog_word.get('word', ''),  # Assuming same as word for now
        "transliteration": blog_word.get('transliteration', ''),
        "language": blog_word.get('language', ''),
        "family": blog_word.get('family', ''),  # Will need to be filled
        "category": blog_word.get('category', ''),
        "definition": blog_word.get('definition', ''),
        "literal": blog_word.get('literal', ''),
        "usage_notes": blog_word.get('usage_notes', ''),
        "example_native": blog_word.get('example_native', ''),
        "example_gloss": blog_word.get('example_gloss', ''),
        "english_approx": blog_word.get('english_approx', ''),
        "loanword_in_english": "False",  # Default assumption
        "disputed": "False",  # Default assumption
        "region": blog_word.get('region', ''),
        "closest_english_paraphrase": blog_word.get('definition', ''),  # Use definition as fallback
        "sources": "https://www.theintrepidguide.com/untranslatable-words-ultimate-list/",
        "needs_citation": "False",
        # Note: embedding will be added by separate script
    }

def main():
    if len(sys.argv) != 2:
        print("Usage: python extract_blog_words.py <path_to_existing_dataset>")
        sys.exit(1)
    
    existing_dataset_path = sys.argv[1]
    
    # Load existing dataset
    existing_words = load_existing_dataset(existing_dataset_path)
    print(f"Loaded {len(existing_words)} existing words")
    
    # Check for duplicates
    duplicates = find_duplicates(existing_words, BLOG_WORDS_DATA)
    if duplicates:
        print(f"Found {len(duplicates)} duplicate words: {list(duplicates)}")
    
    # Filter out duplicates and standardize format
    new_words = []
    for blog_word in BLOG_WORDS_DATA:
        if blog_word.get('word', '') not in duplicates:
            standardized_word = standardize_blog_word(blog_word)
            new_words.append(standardized_word)
    
    print(f"Adding {len(new_words)} new words to dataset")
    
    # Create output dataset without embeddings (embeddings will be added separately)
    output_path = existing_dataset_path.replace('-with-embeddings', '')
    if output_path == existing_dataset_path:
        output_path = existing_dataset_path.replace('.json', '-updated.json')
    
    # Combine datasets (remove embeddings from existing words for consistency)
    combined_words = []
    
    # Add existing words without embeddings
    for word in existing_words:
        word_copy = word.copy()
        if 'embedding' in word_copy:
            del word_copy['embedding']
        combined_words.append(word_copy)
    
    # Add new words
    combined_words.extend(new_words)
    
    # Save combined dataset
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(combined_words, f, ensure_ascii=False, indent=2)
    
    print(f"Updated dataset saved to: {output_path}")
    print(f"Total words: {len(combined_words)}")
    print("\nNext steps:")
    print("1. Manually populate BLOG_WORDS_DATA with complete list from blog post")
    print("2. Run embedding generation script to add embeddings")
    print("3. Replace the original file with the embedded version")

if __name__ == "__main__":
    main()