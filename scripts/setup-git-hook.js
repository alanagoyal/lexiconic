#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setupPostCommitHook() {
  try {
    // Get the git directory
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
    const hooksDir = path.join(gitDir, 'hooks');
    const hookPath = path.join(hooksDir, 'post-commit');
    const scriptPath = path.join(process.cwd(), 'scripts', 'post-commit-hook.sh');

    console.log('🔧 Setting up post-commit hook...');
    console.log(`📁 Git hooks directory: ${hooksDir}`);
    console.log(`🔗 Hook path: ${hookPath}`);
    console.log(`📜 Script path: ${scriptPath}`);

    // Ensure hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      console.log('📁 Creating hooks directory...');
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    // Check if post-commit hook already exists
    if (fs.existsSync(hookPath)) {
      console.log('⚠️  post-commit hook already exists');

      // Read existing hook to check if it's our hook
      const existingContent = fs.readFileSync(hookPath, 'utf8');
      if (existingContent.includes('post-commit-hook.sh')) {
        console.log('✅ Our post-commit hook is already installed');
        return;
      } else {
        // Backup existing hook
        const backupPath = `${hookPath}.backup.${Date.now()}`;
        fs.copyFileSync(hookPath, backupPath);
        console.log(`💾 Backed up existing hook to: ${backupPath}`);
      }
    }

    // Verify our script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Script not found at: ${scriptPath}`);
      process.exit(1);
    }

    // Create the hook content that calls our script
    const hookContent = `#!/bin/bash

# Auto-generated post-commit hook
# This hook runs the embedding generation script when words.json is modified

# Get the absolute path to the repository root
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Run our post-commit script
"$REPO_ROOT/scripts/post-commit-hook.sh"
`;

    // Write the hook
    fs.writeFileSync(hookPath, hookContent);

    // Make it executable
    fs.chmodSync(hookPath, 0o755);

    console.log('✅ Post-commit hook installed successfully!');
    console.log('');
    console.log('🎯 The hook will now:');
    console.log('   • Monitor commits for changes to public/data/words.json');
    console.log('   • Automatically generate embeddings when changes are detected');
    console.log('   • Update public/data/words-with-embeddings.json');
    console.log('');
    console.log('📝 Note: You\'ll need to set the OPENAI_API_KEY environment variable');
    console.log('   for the embedding generation to work.');
    console.log('');
    console.log('🧪 To test the hook, make a change to words.json and commit it.');

  } catch (error) {
    console.error('❌ Error setting up post-commit hook:', error.message);
    process.exit(1);
  }
}

// Check if we're in a git repository
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ This is not a git repository');
  process.exit(1);
}

setupPostCommitHook();