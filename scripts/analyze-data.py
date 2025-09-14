import requests
import csv
import json
from io import StringIO

# Fetch the CSV data
url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untranslatable%20Words%20with%20Sources-Qg29WupfgFGdmHN545eqNO3O0rS39g.csv"
response = requests.get(url)
csv_content = response.text

# Parse CSV
csv_reader = csv.DictReader(StringIO(csv_content))
words_data = list(csv_reader)

print(f"[v0] Total words in dataset: {len(words_data)}")
print(f"[v0] Sample word: {words_data[0] if words_data else 'No data'}")

# Analyze the data structure
if words_data:
    sample_word = words_data[0]
    print(f"[v0] Available fields: {list(sample_word.keys())}")
    
    # Count languages
    languages = set(word['language'] for word in words_data if word['language'])
    print(f"[v0] Number of languages: {len(languages)}")
    
    # Count categories
    categories = set(word['category'] for word in words_data if word['category'])
    print(f"[v0] Number of categories: {len(categories)}")

# Save processed data as JSON for the frontend
with open('public/words-data.json', 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print("[v0] Data processed and saved to public/words-data.json")
