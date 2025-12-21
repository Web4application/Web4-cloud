#!/bin/bash

# CONFIG
ICLOUD_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Web4Project"
REPO_DIR="$HOME/projects/web4-project"
BRANCH="main"

echo "Starting iCloud → GitHub sync..."

# Move to repo
cd "$REPO_DIR" || exit 1

# Sync files (mirror iCloud into repo)
rsync -av --delete "$ICLOUD_DIR/" "$REPO_DIR/icloud/"

# Git operations
git add .
git commit -m "Auto-sync from iCloud $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin "$BRANCH"

echo "Sync complete."
