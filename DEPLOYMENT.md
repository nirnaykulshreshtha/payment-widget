# Payment Widget Deployment Guide

## Overview

This guide explains how to deploy the payment widget package to GitHub as a separate repository for use in other projects.

## The Problem with `extract-to-separate-repo.sh`

The original script has a critical flaw:
- Creates a NEW git repository every time it runs
- Cannot push updates to an existing GitHub repo
- Loses all history on subsequent runs
- Forces you to delete and recreate the remote repo each time

## The Solution: `deploy-to-github.sh`

Simple deployment script that initializes git directly in the payment-widget directory and manages updates smoothly.

### Key Features

1. **Direct Git Integration**: Initializes git in the package directory itself
2. **Rebuilds Package**: Automatically rebuilds TypeScript before committing
3. **Incremental Updates**: Can push multiple updates to the same GitHub repo
4. **Safe Merging**: Pulls remote changes before pushing updates
5. **Clean Commits**: Proper commit history with descriptive messages
6. **Simple Workflow**: Just 3 commands for complete deployment

## Workflow

### Step 1: Initialize (First Time Only)

```bash
cd ui/packages/payment-widget
./deploy-to-github.sh nirnaykulshreshtha payment-widget init
```

This will:
- Build the package
- Initialize git in the current directory
- Add the GitHub remote
- Stage all files
- Create initial commit
- Set up main branch

### Step 2: Push to GitHub

```bash
git push -u origin main
```

Or use the script:
```bash
./deploy-to-github.sh nirnaykulshreshtha payment-widget push
```

### Step 3: Update and Deploy Changes

After making changes to the payment widget:

```bash
# Build, stage, commit changes
./deploy-to-github.sh nirnaykulshreshtha payment-widget update

# Push to GitHub
git push origin main
```

Or do both in one command:
```bash
./deploy-to-github.sh nirnaykulshreshtha payment-widget update && \
  ./deploy-to-github.sh nirnaykulshreshtha payment-widget push
```

## How It Works

### Initial Setup (`init`)
1. Builds the package
2. Creates `.gitignore` file
3. Initializes git repository
4. Adds GitHub remote
5. Stages all files
6. Creates initial commit
7. Sets branch to main

### Update Process (`update`)
1. **Rebuilds package** - Compiles TypeScript to dist/
2. Pulls latest changes from remote (if any)
3. Merges remote changes safely
4. Stages all local changes
5. Prompts for commit message
6. Commits changes
7. Ready to push

### Push Process (`push`)
1. Verifies remote exists
2. Pushes current branch to GitHub
3. Confirms success

## Real-World Example

```bash
# First time setup
cd ui/packages/payment-widget
./deploy-to-github.sh nirnaykulshreshtha payment-widget init
git push -u origin main

# Later: Make code changes, then...
cd ui/packages/payment-widget
./deploy-to-github.sh nirnaykulshreshtha payment-widget update  # Build, commit
git push origin main  # Push to GitHub

# Or: Quick update + push
./deploy-to-github.sh nirnaykulshreshtha payment-widget update && git push origin main
```

## Important Notes

### Git Repository Location
- Git is initialized **directly in** `ui/packages/payment-widget/`
- No separate temp directory needed
- Full git history is preserved in the same directory
- Can use standard git commands anytime

### What Gets Committed
- ✅ Source files (`src/`)
- ✅ Build output (`dist/`)
- ✅ Config files (`package.json`, `tsconfig.json`)
- ✅ Documentation (`docs/`)
- ✅ `.gitignore` (automatically created)
- ❌ `node_modules/` (ignored)
- ❌ `*.tsbuildinfo` (ignored)
- ❌ Script files (ignored)

### Git History
- Full commit history preserved in the package directory
- Each update creates a new commit
- Pulls and merges remote changes before committing
- Clean history of all package versions

### Build Process
- **Always rebuilds** the package before committing
- Uses `npm run build` to compile TypeScript
- Ensures `dist/` contains latest changes
- Build output is committed to git

### Git Integration
Once initialized, you can use standard git commands:
```bash
git status          # Check changes
git log             # View history
git diff            # See differences
git commit -a       # Manual commit (but script handles this)
git push origin main # Manual push (or use script)
```

## Using the Deployed Package

Once deployed to GitHub, you can install it in other projects:

```bash
npm install git+https://github.com/nirnaykulshreshtha/payment-widget.git
```

Or with a specific version/commit:

```bash
npm install git+https://github.com/nirnaykulshreshtha/payment-widget.git#v0.1.0
```

## Troubleshooting

### "Repository already exists" Error
If git is already initialized, just use `update` command:
```bash
./deploy-to-github.sh nirnaykulshreshtha payment-widget update
```

### "Could not fetch from remote"
This can happen on the first push. Just continue and push manually:
```bash
git push -u origin main
```

### Changes Not Showing Up
1. Make sure you pushed: `git push origin main`
2. Check remote status: `git remote -v`
3. Verify commits: `git log --oneline`
4. Check branch: `git branch --show-current`

### Package Not Updating After Push
- Rebuild is automatic, but verify dist/ has latest files
- Check commit includes dist/ folder: `git ls-files dist/`
- Ensure build succeeds: `npm run build`

### Want to Start Fresh
To completely reset the deployment:
```bash
rm -rf .git              # Delete local git repo
./deploy-to-github.sh ... init  # Reinitialize
git push -u origin main --force  # Force push (careful!)
```

### Script Fails on Build
Make sure dependencies are installed:
```bash
npm install
npm run build
```

## Comparison: Old vs New Script

| Feature | extract-to-separate-repo.sh | deploy-to-github.sh |
|---------|----------------------------|---------------------|
| Initial push | ✅ Yes | ✅ Yes |
| Update same repo | ❌ No | ✅ Yes |
| Preserve history | ❌ No | ✅ Yes |
| Interactive commits | ❌ No | ✅ Yes |
| Auto-push option | ❌ No | ✅ Yes |
| Safe merging | ❌ No | ✅ Yes |
| Temp directory needed | ✅ Yes | ❌ No |
| Simple workflow | ❌ No | ✅ Yes |
| Standard git commands | ❌ No | ✅ Yes |
| Rebuilds package | ❌ No | ✅ Yes |

## Best Practices

1. **Always rebuild before pushing** - The script does this automatically
2. **Write descriptive commit messages** when prompted
3. **Review changes** before pushing (`git diff`)
4. **Test the package** before pushing updates
5. **Use standard git commands** for full control
6. **Document version changes** in commit messages
7. **Tag releases** in the GitHub repo for version management
8. **Keep git history clean** - Don't force push

