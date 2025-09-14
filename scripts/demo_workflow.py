#!/usr/bin/env python3
"""
Demo script showing the complete workflow for adding new words and generating embeddings.
This script demonstrates the process without actually calling the OpenAI API.
"""

import json
import os
from typing import Dict, List

def demo_word_extraction():
    """Demo the word extraction process."""
    print("🔍 STEP 1: Word Extraction Demo")
    print("=" * 50)
    
    # Load existing dataset
    try:
        with open('public/data/words-with-embeddings.json', 'r', encoding='utf-8') as f:
            existing_words = json.load(f)
        print(f"📚 Loaded existing dataset: {len(existing_words)} words")
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return
    
    # Sample new words (from the blog post)
    new_blog_words = [
        {
            "word": "Fernweh",
            "language": "German",
            "definition": "The ache for distant places; the craving for travel",
            "region": "Germany",
            "category": "emotion/travel"
        },
        {
            "word": "Hygge",
            "language": "Danish", 
            "definition": "A cozy quality that makes a person feel content and comfortable",
            "region": "Denmark",
            "category": "lifestyle/emotion"
        },
        {
            "word": "Ikigai",  # This should be a duplicate
            "language": "Japanese",
            "definition": "Life purpose; reason for being",
            "region": "Japan", 
            "category": "life/philosophy"
        }
    ]
    
    print(f"🆕 New words from blog: {len(new_blog_words)} words")
    
    # Check for duplicates
    existing_words_lower = {word.get('word', '').lower() for word in existing_words}
    duplicates = []
    new_words = []
    
    for word in new_blog_words:
        if word['word'].lower() in existing_words_lower:
            duplicates.append(word['word'])
        else:
            new_words.append(word)
    
    print(f"🔄 Duplicates found: {len(duplicates)} - {duplicates}")
    print(f"✨ New words to add: {len(new_words)}")
    for word in new_words:
        print(f"   - {word['word']} ({word['language']})")
    
    return new_words, existing_words

def demo_standardization(new_words: List[Dict]):
    """Demo the standardization process."""
    print("\n🔧 STEP 2: Data Standardization Demo")
    print("=" * 50)
    
    standardized_words = []
    for word in new_words:
        standardized = {
            "word": word.get('word', ''),
            "native_script": word.get('word', ''),
            "transliteration": word.get('transliteration', ''),
            "language": word.get('language', ''),
            "family": word.get('family', ''),
            "category": word.get('category', ''),
            "definition": word.get('definition', ''),
            "literal": word.get('literal', ''),
            "usage_notes": word.get('usage_notes', ''),
            "example_native": word.get('example_native', ''),
            "example_gloss": word.get('example_gloss', ''),
            "english_approx": word.get('english_approx', ''),
            "loanword_in_english": "False",
            "disputed": "False", 
            "region": word.get('region', ''),
            "closest_english_paraphrase": word.get('definition', ''),
            "sources": "https://www.theintrepidguide.com/untranslatable-words-ultimate-list/",
            "needs_citation": "False",
        }
        standardized_words.append(standardized)
        
        print(f"📝 Standardized: {standardized['word']}")
        print(f"   Definition: {standardized['definition']}")
        print(f"   Language: {standardized['language']}")
        print(f"   Region: {standardized['region']}")
        print(f"   Category: {standardized['category']}")
        print()
    
    return standardized_words

def demo_embedding_preparation(standardized_words: List[Dict]):
    """Demo the embedding text preparation."""
    print("🤖 STEP 3: Embedding Preparation Demo")
    print("=" * 50)
    
    for word_data in standardized_words:
        # Create embedding text
        parts = []
        
        if word_data.get('word'):
            parts.append(f"Word: {word_data['word']}")
        if word_data.get('language'):
            parts.append(f"Language: {word_data['language']}")
        if word_data.get('region'):
            parts.append(f"Region: {word_data['region']}")
        if word_data.get('definition'):
            parts.append(f"Definition: {word_data['definition']}")
        if word_data.get('category'):
            parts.append(f"Category: {word_data['category']}")
        
        embedding_text = " | ".join(parts)
        
        print(f"🔤 Embedding text for '{word_data['word']}':")
        print(f"   {embedding_text}")
        print(f"   📏 Length: {len(embedding_text)} characters")
        print()

def demo_github_action():
    """Demo the GitHub Action workflow."""
    print("⚙️  STEP 4: GitHub Action Integration Demo")
    print("=" * 50)
    
    workflow_path = ".github/workflows/update-embeddings.yml"
    if os.path.exists(workflow_path):
        print(f"✅ GitHub Action workflow exists: {workflow_path}")
        
        print("\n📋 Workflow will trigger on:")
        print("   - Push to main/develop with changes to public/data/*words*.json")  
        print("   - Pull requests to main with data changes")
        print("   - Manual dispatch")
        
        print("\n🔄 Workflow process:")
        print("   1. Detect changes to words data files")
        print("   2. Set up Python environment")
        print("   3. Install OpenAI dependency")
        print("   4. Generate embeddings using OpenAI API")
        print("   5. Commit updated embeddings file")
        print("   6. Push changes back to repository")
        
        print("\n🔑 Requirements:")
        print("   - OPENAI_API_KEY repository secret")
        print("   - GitHub Actions write permissions")
    else:
        print(f"❌ GitHub Action workflow not found: {workflow_path}")

def demo_cost_estimate(num_words: int = 100):
    """Demo cost estimation for embeddings."""
    print(f"\n💰 STEP 5: Cost Estimation Demo ({num_words} words)")
    print("=" * 50)
    
    # Rough estimates based on OpenAI pricing
    avg_tokens_per_word = 75  # Conservative estimate
    total_tokens = num_words * avg_tokens_per_word
    cost_per_1k_tokens = 0.0001  # OpenAI embedding cost
    estimated_cost = (total_tokens / 1000) * cost_per_1k_tokens
    
    print(f"📊 Estimation:")
    print(f"   - Words to process: {num_words}")
    print(f"   - Average tokens per word: {avg_tokens_per_word}")
    print(f"   - Total tokens: {total_tokens:,}")
    print(f"   - Cost per 1K tokens: ${cost_per_1k_tokens}")
    print(f"   - Estimated total cost: ${estimated_cost:.4f}")
    
    if estimated_cost < 0.01:
        print("   💡 Very affordable for small batches!")
    elif estimated_cost < 1.00:
        print("   💰 Reasonable cost for medium batches")
    else:
        print("   💸 Consider processing in smaller batches")

def main():
    """Run the complete demo workflow."""
    print("🌟 UNTRANSLATABLE WORDS PROCESSING DEMO")
    print("=" * 60)
    print("This demo shows the complete workflow without calling APIs\n")
    
    try:
        # Step 1: Word extraction
        new_words, existing_words = demo_word_extraction()
        
        if not new_words:
            print("No new words to process in this demo.")
            return
        
        # Step 2: Standardization
        standardized_words = demo_standardization(new_words)
        
        # Step 3: Embedding preparation
        demo_embedding_preparation(standardized_words)
        
        # Step 4: GitHub Action info
        demo_github_action()
        
        # Step 5: Cost estimation
        demo_cost_estimate(len(standardized_words))
        
        print("\n🎯 SUMMARY")
        print("=" * 50)
        print(f"✅ Current dataset: {len(existing_words)} words")
        print(f"✅ New words ready: {len(standardized_words)} words")
        print(f"✅ Scripts created: extract_blog_words.py, generate_embeddings.py")
        print(f"✅ GitHub Action: Automatic embedding generation")
        print(f"✅ Documentation: scripts/README.md")
        
        print("\n🚀 READY TO USE!")
        print("1. Populate BLOG_WORDS_DATA in extract_blog_words.py")
        print("2. Set OPENAI_API_KEY environment variable")
        print("3. Run extraction and embedding scripts")
        print("4. Or just commit data changes - GitHub Actions will handle the rest!")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")

if __name__ == "__main__":
    main()