#!/bin/bash

# Post-commit hook to regenerate embeddings when words.json is modified

# Get the list of files changed in the last commit
changed_files=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Check if words.json was modified
if echo "$changed_files" | grep -q "public/data/words.json"; then
    echo "🔄 words.json was modified, regenerating embeddings..."

    # Change to the repository root directory
    cd "$(git rev-parse --show-toplevel)"

    # Check if OPENAI_API_KEY is set
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "⚠️  OPENAI_API_KEY environment variable is not set"
        echo "   Skipping embedding generation. Set OPENAI_API_KEY to enable automatic embedding generation."
        exit 0
    fi

    # Check if npx and tsx are available
    if ! command -v npx &> /dev/null; then
        echo "❌ npx not found. Please install Node.js and npm."
        exit 1
    fi

    # Run the embedding generation script
    echo "🤖 Generating embeddings using OpenAI..."
    if npx tsx scripts/generate-embeddings.ts; then
        echo "✅ Embeddings generated successfully"

        # Check if there are changes to words-with-embeddings.json
        if git diff --quiet public/data/words-with-embeddings.json; then
            echo "📄 No changes to embeddings file"
        else
            echo "📝 words-with-embeddings.json has been updated"
            echo "   You may want to commit these changes:"
            echo "   git add public/data/words-with-embeddings.json"
            echo "   git commit -m 'chore: update embeddings after words.json changes'"
        fi
    else
        echo "❌ Failed to generate embeddings"
        exit 1
    fi
else
    echo "📄 words.json was not modified, skipping embedding generation"
fi