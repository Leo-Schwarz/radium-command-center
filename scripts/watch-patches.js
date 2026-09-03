#!/usr/bin/env node
// scripts/watch-patches.js
// Watches the repo root for new apply-*.py patches from Drive sync and auto-executes them.
//
// Usage:
//   npm run watch:patches          # foreground, press Ctrl+C to stop
//   nohup npm run watch:patches &  # background (remember the PID)

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PROCESSED_DIR = path.join(ROOT, 'scripts', 'processed-patches');
const DASHBOARD_JSON = path.join(ROOT, 'public', 'data', 'dashboard-data.json');
const BACKUP_JSON = path.join(ROOT, 'public', 'data', 'dashboard-data.json.bak');
const POLL_INTERVAL_MS = 30_000;
const STABILITY_WAIT_MS = 5_000; // wait for Drive sync to finish writing

if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

function getPendingPatches() {
  return fs
    .readdirSync(ROOT)
    .filter((f) => /^apply-\d{4}-\d{2}-\d{2}\.py$/.test(f))
    .map((f) => path.join(ROOT, f));
}

function isFileStable(filePath) {
  return new Promise((resolve) => {
    let previous;
    try {
      previous = fs.statSync(filePath).size;
    } catch {
      resolve(false);
      return;
    }
    setTimeout(() => {
      try {
        const current = fs.statSync(filePath).size;
        resolve(previous === current && current > 0);
      } catch {
        resolve(false);
      }
    }, STABILITY_WAIT_MS);
  });
}

function backupDashboard() {
  if (fs.existsSync(DASHBOARD_JSON)) {
    fs.copyFileSync(DASHBOARD_JSON, BACKUP_JSON);
    return true;
  }
  return false;
}

function restoreBackup() {
  if (fs.existsSync(BACKUP_JSON)) {
    fs.copyFileSync(BACKUP_JSON, DASHBOARD_JSON);
    console.log('  🔄 Backup restored');
  }
}

async function processPatch(filePath) {
  const basename = path.basename(filePath);
  console.log(`\n📦 Found patch: ${basename}`);

  const stable = await isFileStable(filePath);
  if (!stable) {
    console.log('  ⏳ File still syncing, will retry next poll...');
    return false;
  }

  const hadBackup = backupDashboard();
  if (hadBackup) {
    console.log('  💾 Backup created');
  }

  // ── Apply ──
  try {
    console.log('  🔄 Applying patch...');
    execSync(`python3 "${filePath}" --write`, { cwd: ROOT, stdio: 'inherit' });
    console.log('  ✅ Patch applied');
  } catch (err) {
    console.error(`  ❌ Patch failed: ${err.message}`);
    restoreBackup();
    moveToFailed(filePath);
    return false;
  }

  // ── Build ──
  try {
    console.log('  🔨 Running npm run build...');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    console.log('  ✅ Build successful');
  } catch (err) {
    console.error(`  ⚠️ Build failed: ${err.message}`);
    // Patch applied but build broke — leave file so it’s visible; user can fix + rerun
    return false;
  }

  // ── Move to processed ──
  const dest = path.join(PROCESSED_DIR, basename);
  fs.renameSync(filePath, dest);
  console.log(`  ✅ Done — moved to scripts/processed-patches/${basename}`);

  // ── Summary ──
  try {
    const data = JSON.parse(fs.readFileSync(DASHBOARD_JSON, 'utf8'));
    const taskCount = data.milestones.reduce(
      (acc, m) => acc + m.epics.reduce((eacc, e) => eacc + e.tasks.length, 0),
      0
    );
    console.log(`  📊 Dashboard now has ${taskCount} tasks, lastUpdated: ${data.lastUpdated}`);
  } catch {
    // ignore
  }

  return true;
}

function moveToFailed(filePath) {
  const basename = path.basename(filePath);
  const dest = path.join(PROCESSED_DIR, basename + '.failed');
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(filePath, dest);
  console.log(`  📁 Moved to scripts/processed-patches/${basename}.failed`);
}

// ── main loop ───────────────────────────────────────────
async function main() {
  console.log('🔍 Patch Watcher started');
  console.log(`   Watching: ${ROOT}`);
  console.log(`   Interval: ${POLL_INTERVAL_MS / 1000}s`);
  console.log('   Press Ctrl+C to stop\n');

  const seen = new Set();

  while (true) {
    const patches = getPendingPatches();

    for (const patch of patches) {
      if (seen.has(patch)) continue;
      seen.add(patch);

      try {
        await processPatch(patch);
      } catch (err) {
        console.error(`\nUnexpected error processing ${path.basename(patch)}:`, err.message);
        try { moveToFailed(patch); } catch {}
      }
    }

    // Clean up seen set — remove files that no longer exist (already processed / deleted)
    for (const p of seen) {
      if (!fs.existsSync(p)) seen.delete(p);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
