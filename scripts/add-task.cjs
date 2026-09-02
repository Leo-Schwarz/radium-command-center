const fs = require('fs');
const path = require('path');

const DATA_PATH = process.argv[2] || path.join(__dirname, '..', 'public', 'data', 'dashboard-data.json');
const d = JSON.parse(fs.readFileSync(DATA_PATH));

const ms = d.milestones.find(m => m.id === 'ms-02');
if (!ms) { console.log('ms-02 not found'); process.exit(1); }

let inbox = ms.epics.find(e => e.id === 'ep-ms-02-claude');
if (!inbox) {
  inbox = {
    id: 'ep-ms-02-claude',
    title: 'Claude Inbox',
    description: 'Tasks created from Claude conversations',
    owner: 'Claude',
    status: 'in_progress',
    tasks: []
  };
  ms.epics.push(inbox);
}

let max = 0;
d.milestones.forEach(m => m.epics.forEach(ep => ep.tasks.forEach(t => {
  const m = t.id.match(/^T(\d+)$/);
  if (m) max = Math.max(max, parseInt(m[1], 10));
})));
const nextId = 'T' + String(max + 1).padStart(3, '0');

inbox.tasks.push({
  id: nextId,
  title: 'Wire up MCP server in Claude Desktop config and verify task creation',
  description: 'Add the radium-command-center MCP server to ~/Library/Application Support/Claude/claude_desktop_config.json, restart Claude Desktop, and test the create_task tool by saying "add a task to the dashboard".',
  completed: false,
  assignee: 'Leo',
  priority: 'high',
  dueDate: '2026-09-09',
  tags: ['urgent', 'week'],
  channel: 'Claude',
  bucket: 'now'
});

inbox.description = inbox.tasks.length + ' task(s)';
d.lastUpdated = new Date().toISOString().split('T')[0];

fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2));
console.log('Added', nextId, 'to', ms.title, '>', inbox.title);
