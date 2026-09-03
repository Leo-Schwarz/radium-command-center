#!/bin/bash
# Wrapper for com.radium.patchwatcher LaunchAgent
# Hardcodes PATH and working directory to avoid LaunchAgent environment issues

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "/Users/leoschwarz/Library/CloudStorage/GoogleDrive-leo@leoschwarz.ca/My Drive/01 External Clients/Radium/VS Build/radium-command-center"
exec node scripts/watch-patches.js
