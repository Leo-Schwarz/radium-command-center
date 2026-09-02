#!/bin/bash
# Auto-push local changes to GitHub every hour
# Runs silently in the background

DIR="/Users/leoschwarz/Library/CloudStorage/GoogleDrive-leo@leoschwarz.ca/My Drive/01 External Clients/Radium/VS Build/radium-command-center"
cd "$DIR" || exit 1

# Only push if there are actual changes
if git status --porcelain | grep -q .; then
  git add -A
  git commit -m "auto: sync from drive [$(date -u '+%Y-%m-%d %H:%M UTC')]"
  git push origin main
fi
