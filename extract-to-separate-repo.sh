#!/bin/bash

# Script to extract payment-widget package to a separate GitHub repository
# Usage: ./extract-to-separate-repo.sh <github-username> <repo-name>

set -e

GITHUB_USER=$1
REPO_NAME=$2

if [ -z "$GITHUB_USER" ] || [ -z "$REPO_NAME" ]; then
  echo "Usage: ./extract-to-separate-repo.sh <github-username> <repo-name>"
  echo "Example: ./extract-to-separate-repo.sh myusername payment-widget"
  exit 1
fi

echo "🚀 Extracting payment-widget to separate repository..."
echo "📦 Repository: https://github.com/${GITHUB_USER}/${REPO_NAME}"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Working in: $TEMP_DIR"

# Copy package files (excluding node_modules, but including dist)
cd "$(dirname "$0")"

# Ensure dist folder exists by building
if [ ! -d "./dist" ]; then
  echo "📦 Building package first..."
  npm run build || {
    echo "❌ Build failed. Make sure you're in the payment-widget directory and have run npm install."
    exit 1
  }
fi

rsync -av --exclude='node_modules' \
         --exclude='*.tsbuildinfo' \
         --exclude='.git' \
         --exclude='extract-to-separate-repo.sh' \
         ./ "$TEMP_DIR/"

cd "$TEMP_DIR"

# Initialize git
git init
git add .
git commit -m "Initial commit: payment widget package v0.1.0"

# Add remote and push
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
git branch -M main

echo ""
echo "✅ Package extracted successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create the repository on GitHub: https://github.com/new"
echo "   Name: $REPO_NAME"
echo ""
echo "2. Push the code:"
echo "   cd $TEMP_DIR"
echo "   git push -u origin main"
echo ""
echo "3. Install in your other project:"
echo "   npm install git+https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
echo ""
echo "💡 The files are ready in: $TEMP_DIR"
echo "   You can review them before pushing to GitHub"

