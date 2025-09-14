#!/usr/bin/env python3
"""
Test script to verify the data processing setup is working correctly.
"""

import json
import os
from extract_blog_words import BLOG_WORDS_DATA, standardize_blog_word, find_duplicates

def test_data_structure():
    """Test that the blog words data has the correct structure."""
    print("Testing data structure...")
    
    required_fields = ['word', 'language', 'definition']
    
    for i, word_data in enumerate(BLOG_WORDS_DATA):
        for field in required_fields:
            if not word_data.get(field):
                print(f"❌ Word {i}: Missing required field '{field}'")
                return False
    
    print(f"✅ All {len(BLOG_WORDS_DATA)} sample words have required fields")
    return True

def test_standardization():
    """Test that blog words can be standardized correctly."""
    print("Testing word standardization...")
    
    if not BLOG_WORDS_DATA:
        print("❌ No sample data to test")
        return False
    
    sample_word = BLOG_WORDS_DATA[0]
    standardized = standardize_blog_word(sample_word)
    
    # Check required fields are present
    required_fields = [
        'word', 'language', 'definition', 'sources'
    ]
    
    for field in required_fields:
        if not standardized.get(field):
            print(f"❌ Standardized word missing field: {field}")
            return False
    
    print(f"✅ Word standardization working: {standardized['word']}")
    return True

def test_duplicate_detection():
    """Test duplicate detection functionality."""
    print("Testing duplicate detection...")
    
    # Create a fake existing dataset with one duplicate
    fake_existing = [
        {'word': BLOG_WORDS_DATA[0]['word'].lower()}  # Same word, different case
    ]
    
    duplicates = find_duplicates(fake_existing, BLOG_WORDS_DATA)
    
    if len(duplicates) != 1:
        print(f"❌ Expected 1 duplicate, found {len(duplicates)}")
        return False
    
    print(f"✅ Duplicate detection working: found '{list(duplicates)[0]}'")
    return True

def test_existing_dataset_format():
    """Test that we can read the existing dataset format."""
    print("Testing existing dataset compatibility...")
    
    dataset_path = 'public/data/words-with-embeddings.json'
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        return False
    
    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            print("❌ Dataset should be a list")
            return False
        
        if not data:
            print("❌ Dataset is empty")
            return False
        
        # Check first word has expected structure
        first_word = data[0]
        expected_fields = ['word', 'language', 'definition', 'embedding']
        
        for field in expected_fields:
            if field not in first_word:
                print(f"❌ Missing field in existing data: {field}")
                return False
        
        print(f"✅ Existing dataset format compatible ({len(data)} words)")
        return True
        
    except Exception as e:
        print(f"❌ Error reading dataset: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Running setup tests...\n")
    
    tests = [
        test_data_structure,
        test_standardization, 
        test_duplicate_detection,
        test_existing_dataset_format
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with error: {e}")
            failed += 1
        print()
    
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed! Setup is ready.")
        print("\n📋 Next steps:")
        print("1. Populate BLOG_WORDS_DATA in extract_blog_words.py with complete word list")
        print("2. Set OPENAI_API_KEY environment variable") 
        print("3. Run: python scripts/extract_blog_words.py public/data/words-with-embeddings.json")
        print("4. Run: python scripts/generate_embeddings.py public/data/words-updated.json")
    else:
        print("❌ Some tests failed. Please fix issues before proceeding.")

if __name__ == "__main__":
    main()