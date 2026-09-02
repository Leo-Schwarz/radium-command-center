import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root
process.loadEnvFile(path.join(__dirname, '..', '.env'));

const API_KEY = process.env.FIREFLIES_API_KEY;
if (!API_KEY) {
  console.error('❌ Missing FIREFLIES_API_KEY in .env file');
  console.error('   Get your key at https://app.fireflies.ai/settings');
  process.exit(1);
}

const FIREFLIES_URL = 'https://api.fireflies.ai/graphql';

// ─── Milestone keyword mapping ───
const KEYWORDS: Record<string, string[]> = {
  'ms-01': ['owner','ownership','accountable','engineering time','funding','goal','accountability'],
  'ms-02': ['product','developer','switch','price','pricing','feature','API','SDK','dx'],
  'ms-03': ['market fit','corporate card','buy','purchase','ICP','buyer','decision'],
  'ms-04': ['instrumentation','tracking','event','analytics','segment','mixpanel','metrics'],
  'ms-05': ['funnel','landing','signup','activation','onboarding','conversion','trial'],
  'ms-06': ['content','community','education','blog','docs','tutorial','SEO','newsletter'],
  'ms-07': ['distribution','channel','organic','owned','traffic','acquisition','partnership'],
  'ms-08': ['message','promise','copy','messaging','value prop','positioning','brand'],
};

function findMilestone(text: string) {
  const t = text.toLowerCase();
  let best: {id:string;score:number}|undefined;
  for (const [id, kws] of Object.entries(KEYWORDS)) {
    let s = 0;
    for (const kw of kws) if (t.includes(kw.toLowerCase())) s += kw.split(' ').length;
    if (s > 0 && (!best || s > best.score)) best = {id, score:s};
  }
  return best?.id;
}

// ─── Fireflies GraphQL client ───
async function fetchTranscripts() {
  const query = `
    query {
      transcripts {
        id
        title
        date
        summary {
          action_items
          overview
          topics_discussed
        }
      }
    }
  `;
  const r = await fetch(FIREFLIES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
  const j = await r.json() as any;
  if (j.errors?.length) {
    console.error('GraphQL errors:', JSON.stringify(j.errors, null, 2));
    throw new Error(j.errors[0].message);
  }
  return j.data?.transcripts || [];
}

function toArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
  if (typeof v === 'string') return v.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  return [];
}

// ─── Build the sync patch ───
function buildPatch(transcripts: any[], sinceMs: number) {
  const since = new Date(sinceMs);
  const groups: any[] = [];
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const t of transcripts) {
    const actionItems = toArray(t.summary?.action_items);
    if (actionItems.length === 0) continue;

    const meetingDate = t.date ? new Date(t.date) : null;
    if (!meetingDate || meetingDate.getTime() < sinceMs) continue;

    const dateStr = meetingDate.toISOString().split('T')[0];
    if (!minDate || dateStr < minDate) minDate = dateStr;
    if (!maxDate || dateStr > maxDate) maxDate = dateStr;

    const text = `${t.title||''} ${t.summary?.overview||''}`;
    const msId = findMilestone(text);
    if (!msId) continue;

    groups.push({
      meetingId: t.id,
      meetingTitle: t.title || 'Untitled Meeting',
      meetingDate: dateStr,
      milestoneId: msId,
      actionItems,
    });
  }

  const dateRange = minDate && maxDate
    ? (minDate === maxDate ? minDate : `${minDate} to ${maxDate}`)
    : 'latest batch';

  return { lastSyncAt: new Date().toISOString(), meetingDateRange: dateRange, taskGroups: groups };
}

// ─── Main ───
async function main() {
  const lookbackHrs = parseInt(process.env.SYNC_LOOKBACK_HOURS || '24', 10);
  const sinceMs = Date.now() - lookbackHrs * 60 * 60 * 1000;

  console.log('🔥 Fireflies Sync Started');
  console.log(`   Lookback: ${lookbackHrs}h · Since: ${new Date(sinceMs).toISOString()}\n`);

  const ts = await fetchTranscripts();
  console.log(`📡 ${ts.length} total meetings in Fireflies\n`);

  const patch = buildPatch(ts, sinceMs);
  const out = path.join(__dirname, '..', 'public', 'data', 'synced-tasks.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(patch, null, 2));

  const matched = ts.filter((t:any) => {
    const d = t.date ? new Date(t.date).getTime() : 0;
    return d >= sinceMs && toArray(t.summary?.action_items).length > 0 && findMilestone(`${t.title||''} ${t.summary?.overview||''}`);
  });

  console.log(`🧠 ${patch.taskGroups.length} meeting(s) with action items mapped to milestones`);
  console.log(`✅ ${patch.taskGroups.reduce((n:number, g:any) => n + g.actionItems.length, 0)} tasks derived`);
  console.log(`💾 Saved to public/data/synced-tasks.json\n`);

  for (const g of patch.taskGroups) {
    const short = g.meetingTitle.length > 48 ? g.meetingTitle.slice(0,48)+'…' : g.meetingTitle;
    console.log(`   • ${short} → ${g.milestoneId} (${g.actionItems.length} tasks)`);
  }

  const unmatchedMeetings = ts.filter((t:any) => {
    const d = t.date ? new Date(t.date).getTime() : 0;
    return d >= sinceMs && !findMilestone(`${t.title||''} ${t.summary?.overview||''}`);
  });

  if (unmatchedMeetings.length > 0) {
    console.log(`\n⚠️  ${unmatchedMeetings.length} meeting(s) in window didn't match any milestone.`);
  }
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });