#!/usr/bin/env node
// scripts/daily-sync.js
// Orchestrates nightly Fireflies + HubSpot + LinkedIn syncs, updates
// mockData.ts lastUpdated, logs the run, and optionally git-commits.

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env so we can check optional tokens before spawning scripts
process.loadEnvFile(path.join(ROOT, '.env'));

/**
 * Run one of the TypeScript sync scripts via tsx.
 * Stdio is inherited so you see colours and progress in real time.
 */
function run(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', `scripts/${scriptName}`], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

async function main() {
  const timestamp = new Date().toISOString();
  const log = { timestamp, steps: [] };

  console.log(`\n🌙  Radium Daily Sync — ${timestamp}\n`);

  // ─── Fireflies ───
  try {
    console.log('\n▶️  Fireflies…\n');
    await run('sync-fireflies.ts');
    log.steps.push({ name: 'fireflies', status: 'ok' });
  } catch (e) {
    console.error('\n❌ Fireflies failed:', e.message);
    log.steps.push({ name: 'fireflies', status: 'error', error: e.message });
  }

  // ─── HubSpot ───
  try {
    console.log('\n▶️  HubSpot…\n');
    await run('sync-hubspot.ts');
    log.steps.push({ name: 'hubspot', status: 'ok' });
  } catch (e) {
    console.error('\n❌ HubSpot failed:', e.message);
    log.steps.push({ name: 'hubspot', status: 'error', error: e.message });
  }

  // ─── LinkedIn (optional — skip gracefully if no long-lived token) ───
  if (process.env.LINKEDIN_ACCESS_TOKEN) {
    try {
      console.log('\n▶️  LinkedIn…\n');
      await run('sync-linkedin.ts');
      log.steps.push({ name: 'linkedin', status: 'ok' });
    } catch (e) {
      console.error('\n❌ LinkedIn failed:', e.message);
      log.steps.push({ name: 'linkedin', status: 'error', error: e.message });
    }
  } else {
    console.log('\n⏭️  LinkedIn skipped — no LINKEDIN_ACCESS_TOKEN in .env\n');
    log.steps.push({ name: 'linkedin', status: 'skipped' });
  }

  // ─── Update mockData.ts lastUpdated ───
  const mockDataPath = path.join(ROOT, 'src', 'data', 'mockData.ts');
  const mockRaw = fs.readFileSync(mockDataPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const updatedRaw = mockRaw.replace(
    /"lastUpdated":\s*"[^"]*"/,
    `"lastUpdated": "${today}"`
  );
  if (updatedRaw !== mockRaw) {
    fs.writeFileSync(mockDataPath, updatedRaw);
    console.log(`\n✏️  Updated mockData.ts lastUpdated → ${today}`);
    log.steps.push({ name: 'mockData', status: 'updated', lastUpdated: today });
  } else {
    log.steps.push({ name: 'mockData', status: 'unchanged' });
  }

  // ─── Append to sync-log.json ───
  const logPath = path.join(ROOT, 'public', 'data', 'sync-log.json');
  let logs = [];
  try {
    logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  } catch {
    // File doesn't exist yet
  }
  logs.unshift(log);
  if (logs.length > 30) logs = logs.slice(0, 30); // keep last 30 runs
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  console.log(`\n📓  Sync log written → public/data/sync-log.json (${logs.length} entries)`);

  // ─── Auto-commit if dirty and inside a git repo ───
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
    if (status.trim()) {
      execSync('git add public/data/ src/data/mockData.ts', { cwd: ROOT });
      const okCount = log.steps.filter((s) => s.status === 'ok').length;
      execSync(
        `git commit -m "daily-sync: ${today} — ${okCount}/${log.steps.length} sources ok"`,
        { cwd: ROOT }
      );
      console.log(`\n🚀  Committed changes to git`);
    } else {
      console.log(`\nℹ️  Nothing new to commit`);
    }
  } catch (e) {
    console.log(`\n⚠️  Git commit skipped: ${e.message}`);
  }

  const okCount = log.steps.filter((s) => s.status === 'ok').length;
  console.log(`\n✅  Daily sync finished — ${okCount}/${log.steps.length} sources OK\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
