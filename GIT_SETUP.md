# Git Setup Guide

## Initial Git Setup

Your repository is not yet initialized. Here's how to set it up:

### Step 1: Initialize Git Repository

```bash
git init
```

### Step 2: Rename Branch to Main

```bash
git branch -M main
```

### Step 3: Add Remote Repository

```bash
git remote add origin https://github.com/smamidigumpula/FinpilotAI.git
```

### Step 4: Stage Files

```bash
git add .
```

### Step 5: Initial Commit

```bash
git commit -m "Initial commit: Atlas Household CFO application"
```

### Step 6: Push to GitHub

```bash
git push -u origin main
```

## Complete Setup Script

Run these commands in sequence:

```bash
# Initialize repository
git init

# Set main branch
git branch -M main

# Add remote (if not already added)
git remote add origin https://github.com/smamidigumpula/FinpilotAI.git

# Stage all files
git add .

# Make initial commit
git commit -m "Initial commit: Atlas Household CFO application with Docker support"

# Push to GitHub
git push -u origin main
```

## Verify Setup

```bash
# Check remote
git remote -v

# Check branch
git branch

# Check status
git status
```

## Important: Before First Push

Make sure `.env.local` is in `.gitignore` (it already is):

```bash
# Verify .env.local is ignored
git check-ignore .env.local
```

This should output: `.env.local`

## Troubleshooting

### Remote Already Exists

If you get "remote origin already exists":

```bash
# Remove existing remote
git remote remove origin

# Add again
git remote add origin https://github.com/smamidigumpula/FinpilotAI.git
```

### Authentication Issues

If you get authentication errors:

1. **Using HTTPS**: You'll need a Personal Access Token
   - GitHub → Settings → Developer settings → Personal access tokens
   - Create token with `repo` permissions
   - Use token as password when prompted

2. **Using SSH**: Set up SSH keys
   ```bash
   # Change remote to SSH
   git remote set-url origin git@github.com:smamidigumpula/FinpilotAI.git
   ```

### Large File Warnings

If you get warnings about large files, check `.gitignore` includes:
- `node_modules/`
- `.next/`
- `dist/`
- `build/`

## Next Steps After Push

1. ✅ Code is on GitHub
2. ⏭️ Set up CI/CD (optional)
3. ⏭️ Configure branch protection (optional)
4. ⏭️ Add collaborators (optional)