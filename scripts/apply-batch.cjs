/**
 * apply-batch.cjs
 * Idempotent batch importer. Reads batch-tasks-YYYY-MM-DD.json, skips
 * tasks already on the board, inserts new ones by anchorTaskId, rebuilds.
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/leoschwarz/Library/CloudStorage/GoogleDrive-leo@leoschwarz.ca/My Drive/01 External Clients/Radium/VS Build';
const DATA_FILE = path.join(BASE_DIR, 'radium-command-center/public/data/dashboard-data.json');
const ARCHIVE_DIR = path.join(BASE_DIR, 'radium-command-center/scripts/processed-patches');
const BATCH_FILE = process.argv[2];

if (!BATCH_FILE) {
  console.error('Usage: node apply-batch.cjs <batch-file.json>');
  process.exit(1);
}

const batch = JSON.parse(fs.readFileSync(BATCH_FILE, 'utf-8'));
const dashboard = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// Build set of existing task IDs
const existingIds = new Set();
for (const milestone of dashboard.milestones) {
  for (const epic of milestone.epics) {
    for (const t of epic.tasks) existingIds.add(t.id);
  }
}

let tasksAdded = 0;
let tasksSkipped = 0;
let errors = [];

for (const task of batch.tasks) {
  if (!task.id || !task.title || !task.anchorTaskId) {
    errors.push(`Missing required fields in ${task.id || '?'}: ${JSON.stringify(task)}`);
    continue;
  }
  if (existingIds.has(task.id)) {
    console.log(`  ⚪ Skipped ${task.id} (already exists)`);
    tasksSkipped++;
    continue;
  }
  let foundEpic = null;
  let anchorIndex = -1;
  for (const milestone of dashboard.milestones) {
    for (const epic of milestone.epics) {
      const idx = epic.tasks.findIndex(t => t.id === task.anchorTaskId);
      if (idx !== -1) {
        foundEpic = epic;
        anchorIndex = idx;
        break;
      }
    }
    if (foundEpic) break;
  }
  if (!foundEpic) {
    errors.push(`Anchor task ${task.anchorTaskId} not found for ${task.id}`);
    continue;
  }
  const newTask = {
    id: task.id,
    title: task.title,
    description: task.description || '',
    completed: task.status === 'completed' || task.status === 'done',
    assignee: task.assignee || 'Leo',
    priority: task.priority || 'medium',
    dueDate: task.dueDate || '',
    tags: task.tags || [],
    channel: task.channel || 'general',
    bucket: task.bucket || 'p3',
  };
  const insertPos = task.insertAfter ? anchorIndex + 1 : anchorIndex;
  foundEpic.tasks.splice(insertPos, 0, newTask);
  tasksAdded++;
  console.log(`  ✅ Inserted ${task.id} into epic "${foundEpic.title}" at position ${insertPos}`);
}

if (errors.length > 0) {
  console.error('\nErrors:');
  errors.forEach(e => console.error('  ' + e));
}

console.log(`\n  Added: ${tasksAdded}, Skipped (already exist): ${tasksSkipped}, Errored: ${errors.length}`);

if (tasksAdded > 0) {
  dashboard.lastUpdated = new Date().toISOString().split('T')[0];
  let totalTasks = 0;
  for (const milestone of dashboard.milestones) {
    for (const epic of milestone.epics) totalTasks += epic.tasks.length;
  }
  console.log(`  Total tasks on board: ${totalTasks}`);

  const backupPath = DATA_FILE.replace('.json', `-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(dashboard, null, 2));
  console.log(`  Backup: ${path.basename(backupPath)}`);

  fs.writeFileSync(DATA_FILE, JSON.stringify(dashboard, null, 2));
  console.log(`  Updated dashboard`);

  console.log('\nBuilding...');
  const { execSync } = require('child_process');
  const buildDir = path.join(BASE_DIR, 'radium-command-center');
  try {
    execSync('npx vite build', { cwd: buildDir, stdio: 'inherit' });
    console.log('\n✅ Batch applied successfully.');
  } catch (e) {
    console.error('\n⚠️ Build failed with code', e.status);
    fs.copyFileSync(backupPath, DATA_FILE);
    console.log('  Restored from backup.');
    process.exit(1);
  }
} else {
  console.log('\nNothing to add. Rebuild skipped.');
}

// Archive the batch file whether it added anything or not
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
const archived = path.join(ARCHIVE_DIR, path.basename(BATCH_FILE));
fs.renameSync(BATCH_FILE, archived);
console.log(`  Archived batch to ${archived}`);


