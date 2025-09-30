#!/bin/bash

# Post-commit hook to regenerate embeddings when words.json is modified

# Get the list of files changed in the last commit
changed_files=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Check if words.json was modified
if echo "$changed_files" | grep -q "public/data/words.json"; then
    echo "🔄 words.json was modified, regenerating embeddings..."

    # Change to the repository root directory
    cd "$(git rev-parse --show-toplevel)"

    # Check if OPENAI_API_KEY is set or if .env.local exists
    if [ -z "$OPENAI_API_KEY" ] && [ ! -f ".env.local" ]; then
        echo "⚠️  OPENAI_API_KEY not found in environment variables or .env.local"
        echo "   Skipping embedding generation. Add OPENAI_API_KEY to your .env.local file to enable automatic embedding generation."
        exit 0
    fi

    # Check if npx and tsx are available
    if ! command -v npx &> /dev/null; then
        echo "❌ npx not found. Please install Node.js and npm."
        exit 1
    fi

    # Check for missing transliterations first
    echo "🔍 Checking for missing transliterations..."
    if node scripts/check-transliterations.js; then
        echo "✅ All transliterations are present"
    else
        echo "⚠️  Some words need transliterations"
        echo "🤖 Generating missing transliterations using GPT-4o-mini..."
        
        if node scripts/generate-transliterations.js; then
            echo "✅ Transliterations generated successfully"
            
            # Check if words.json was updated
            if git diff --quiet public/data/words.json; then
                echo "📄 No transliterations were added"
            else
                echo "📝 words.json has been updated with new transliterations"
                echo "   Staging the changes..."
                git add public/data/words.json
            fi
        else
            echo "❌ Failed to generate transliterations"
            echo "   Continuing with embedding generation..."
        fi
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
            echo "   git commit -m 'chore: update embeddings and transliterations after words.json changes'"
        fi
    else
        echo "❌ Failed to generate embeddings"
        exit 1
    fi

    # Run the pronunciation regeneration script
    echo "🔊 Regenerating pronunciations for changed words..."
    if npx tsx scripts/regenerate-changed-pronunciations.ts; then
        echo "✅ Pronunciations regenerated successfully"

        # Check if there are new pronunciation files
        if git diff --quiet public/pronunciations/; then
            echo "📄 No changes to pronunciation files"
        else
            echo "📝 Pronunciation files have been updated"
            echo "   You may want to commit these changes:"
            echo "   git add public/pronunciations/"
            echo "   git commit --amend --no-edit"
        fi
    else
        echo "⚠️  Failed to regenerate pronunciations (continuing anyway)"
    fi
else
    echo "📄 words.json was not modified, skipping embedding generation"
fi