import fs from 'fs';
import path from 'path';

const ts = fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'mockData.ts'), 'utf8');
const idx = ts.indexOf('DashboardData=');
if (idx < 0) {
  throw new Error('Cannot find DashboardData= in mockData.ts');
}

const jsonPart = ts.slice(idx + 'DashboardData='.length).trimEnd();
// Remove trailing semicolon
const cleaned = jsonPart.replace(/;\s*$/, '');
const data = JSON.parse(cleaned);

const outDir = path.join(process.cwd(), 'public', 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'dashboard-data.json'),
  JSON.stringify(data, null, 2)
);

const epicCount = data.milestones.reduce(
  (s: number, m: { epics: unknown[] }) => s + m.epics.length,
  0
);
console.log(
  `Exported dashboard data: ${data.milestones.length} milestones, ${epicCount} epics → public/data/dashboard-data.json`
);
