#!/bin/bash

# Enhanced deployment script for payment-widget to separate GitHub repository
# Initializes this directory as a git repo and manages deployment to GitHub
# Usage: ./deploy-to-github.sh <github-username> <repo-name>

set -e

GITHUB_USER=$1
REPO_NAME=$2
ACTION="${3:-}"

if [ -z "$GITHUB_USER" ] || [ -z "$REPO_NAME" ]; then
  echo "Usage: ./deploy-to-github.sh <github-username> <repo-name> [init|update|push]"
  echo "  init   - Initialize git repo and set up remote (first time)"
  echo "  update - Build, stage, and commit changes"
  echo "  push   - Push changes to GitHub (default action)"
  echo ""
  echo "Example:"
  echo "  ./deploy-to-github.sh nirnaykulshreshtha payment-widget init"
  echo "  ./deploy-to-github.sh nirnaykulshreshtha payment-widget push"
  exit 1
fi

REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Payment Widget Deployment"
echo "📦 Repository: ${REPO_URL}"
echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Ensure .gitignore exists
if [ ! -f .gitignore ]; then
  echo "📝 Creating .gitignore..."
  cat > .gitignore << EOF
node_modules/
*.tsbuildinfo
dist/
.git/
extract-to-separate-repo.sh
deploy-to-github.sh
EOF
fi

# Build the package first
if [ ! -d "./dist" ]; then
  echo "📦 Building package..."
  npm run build || {
    echo "❌ Build failed. Make sure dependencies are installed."
    exit 1
  }
else
  echo "📦 Rebuilding package..."
  npm run build || {
    echo "❌ Build failed. Make sure dependencies are installed."
    exit 1
  }
fi

# Initialize or update git repo
if [ "$ACTION" == "init" ] || [ ! -d ".git" ]; then
  echo ""
  echo "🔧 Initializing git repository..."
  
  # Initialize git if needed
  if [ ! -d ".git" ]; then
    git init
  fi
  
  # Add remote if not exists
  if ! git remote get-url origin &> /dev/null; then
    git remote add origin "$REPO_URL"
  else
    git remote set-url origin "$REPO_URL"
  fi
  
  # Stage all files
  git add .
  
  # Commit if there are changes
  if [ -n "$(git status --porcelain)" ]; then
    git commit -m "Initial commit: payment widget package v0.1.0"
  fi
  
  git branch -M main
  
  echo ""
  echo "✅ Repository initialized!"
  echo ""
  echo "📋 Next step: Push to GitHub"
  echo "   git push -u origin main"
  echo ""
  echo "Or run: ./deploy-to-github.sh ${GITHUB_USER} ${REPO_NAME} push"
  
elif [ "$ACTION" == "update" ] || [ -z "$ACTION" ]; then
  echo ""
  echo "🔄 Updating repository..."
  
  # Pull latest changes if any
  if git ls-remote --exit-code origin main &> /dev/null; then
    echo "📥 Pulling latest changes..."
    git fetch origin main || echo "⚠️  Could not fetch from remote"
    
    # Try to merge
    if git merge origin/main --no-edit 2>/dev/null; then
      echo "✅ Merged remote changes"
    else
      echo "⚠️  No remote changes to merge"
    fi
  fi
  
  # Stage all changes
  git add .
  
  if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "📝 Changes to commit:"
    git status --short
    
    # If ACTION is update or empty, prompt for commit message
    read -p "Enter commit message: " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
      COMMIT_MSG="Update payment widget package"
    fi
    
    git commit -m "$COMMIT_MSG"
    
    echo ""
    echo "✅ Changes committed!"
  else
    echo "✅ No changes to commit"
  fi
  
  echo ""
  echo "📋 Next step: Push to GitHub"
  echo "   git push origin main"
  echo ""
  echo "Or run: ./deploy-to-github.sh ${GITHUB_USER} ${REPO_NAME} push"
  
elif [ "$ACTION" == "push" ]; then
  echo ""
  echo "🚀 Pushing to GitHub..."
  
  if ! git ls-remote --exit-code origin main &> /dev/null; then
    echo "❌ Remote repository doesn't exist yet. Run 'init' first:"
    echo "   ./deploy-to-github.sh ${GITHUB_USER} ${REPO_NAME} init"
    exit 1
  fi
  
  git push origin main
  echo ""
  echo "✅ Successfully pushed to ${REPO_URL}"
fi

echo ""
echo "📍 Current branch: $(git branch --show-current)"
echo "📍 Remote: $(git remote get-url origin)"

