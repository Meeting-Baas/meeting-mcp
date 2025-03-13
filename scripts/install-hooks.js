#!/usr/bin/env node

/**
 * Script to install pre-commit hooks for code formatting
 *
 * This sets up a Git hook to automatically format your code
 * before committing using Prettier.
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Git hooks directory
const gitHooksPath = path.resolve(__dirname, '../.git/hooks');
const preCommitPath = path.join(gitHooksPath, 'pre-commit');

// Pre-commit hook script content
const preCommitScript = `#!/bin/sh
# Pre-commit hook to format code with Prettier

# Get all staged files
FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E "\\.(js|ts|jsx|tsx|json)$")

if [ -n "$FILES" ]; then
  echo "🔍 Formatting staged files with Prettier..."
  npx prettier --write $FILES
  # Add the formatted files back to staging
  git add $FILES
  echo "✅ Formatting complete"
fi
`;

async function installHooks() {
  try {
    // Check if .git directory exists
    try {
      await fs.access(path.resolve(__dirname, '../.git'));
    } catch (error) {
      console.error('❌ No .git directory found. Are you in a Git repository?');
      process.exit(1);
    }

    // Ensure hooks directory exists
    try {
      await fs.access(gitHooksPath);
    } catch (error) {
      await fs.mkdir(gitHooksPath, { recursive: true });
      console.log(`📁 Created hooks directory: ${gitHooksPath}`);
    }

    // Write pre-commit hook
    await fs.writeFile(preCommitPath, preCommitScript, 'utf8');

    // Make it executable
    await new Promise((resolve, reject) => {
      exec(`chmod +x ${preCommitPath}`, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    console.log('✅ Pre-commit hook installed successfully');
  } catch (error) {
    console.error('❌ Error installing hooks:', error);
    process.exit(1);
  }
}

// Execute the function
installHooks().catch(console.error);
