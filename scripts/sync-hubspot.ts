import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root
process.loadEnvFile(path.join(__dirname, '..', '.env'));

const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('❌ Missing HUBSPOT_ACCESS_TOKEN in .env file');
  console.error('   1. Go to HubSpot Settings → Integrations → Private Apps');
  console.error('   2. Create a Private App with CRM read scopes');
  console.error('   3. Copy the access token and add it to .env');
  process.exit(1);
}

const HUBSPOT_BASE = 'https://api.hubapi.com';

// ─── Milestone keyword mapping (CRM-enriched) ───
const KEYWORDS: Record<string, string[]> = {
  'ms-01': ['owner','ownership','accountable','engineering time','funding','goal','accountability'],
  'ms-02': ['product','developer','switch','price','pricing','feature','API','SDK','dx'],
  'ms-03': ['market fit','corporate card','buy','purchase','ICP','buyer','decision','deal','revenue','sales','pipeline'],
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

// ─── HubSpot API helpers ───
async function hubspotGet(endpoint: string) {
  const r = await fetch(`${HUBSPOT_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`HubSpot GET ${r.status}: ${r.statusText} — ${endpoint}`);
  return r.json();
}

async function hubspotSearch(objectType: string, body: unknown) {
  const r = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/${objectType}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HubSpot Search ${r.status}: ${r.statusText} — ${objectType}`);
  return r.json();
}

// ─── Data fetchers ───
async function fetchOpenDeals(stageMap: Map<string, string>) {
  let results: unknown[] = [];
  try {
    const j = await hubspotSearch('deals', {
      filterGroups: [{
        filters: [{ propertyName: 'hs_is_closed', operator: 'EQ', value: 'false' }],
      }],
      properties: ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate', 'hs_lead_status', 'hubspot_owner_id'],
      limit: 100,
    });
    results = j.results || [];
  } catch {
    console.warn('   ⚠️  hs_is_closed search failed, falling back to deal list (may include closed deals)');
    const j = await hubspotGet('/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,pipeline,closedate,hs_lead_status,hubspot_owner_id');
    results = j.results || [];
  }
  return results.map((d: any) => {
    const props = d.properties || {};
    return { ...d, _stageLabel: stageMap.get(props.dealstage) || props.dealstage || 'unknown' };
  });
}

async function fetchRecentContacts(sinceMs: number) {
  const sinceISO = new Date(sinceMs).toISOString();
  const j = await hubspotSearch('contacts', {
    filterGroups: [{
      filters: [{ propertyName: 'lastmodifieddate', operator: 'GTE', value: sinceISO }],
    }],
    properties: ['firstname', 'lastname', 'email', 'company', 'hs_lead_status'],
    sorts: [{ propertyName: 'lastmodifieddate', direction: 'DESCENDING' }],
    limit: 100,
  });
  return (j.results || []) as any[];
}

async function fetchRecentCompanies(sinceMs: number) {
  const sinceISO = new Date(sinceMs).toISOString();
  const j = await hubspotSearch('companies', {
    filterGroups: [{
      filters: [{ propertyName: 'lastmodifieddate', operator: 'GTE', value: sinceISO }],
    }],
    properties: ['name', 'industry', 'website', 'numberofemployees'],
    sorts: [{ propertyName: 'lastmodifieddate', direction: 'DESCENDING' }],
    limit: 100,
  });
  return (j.results || []) as any[];
}

async function fetchDealStageMap() {
  try {
    const j = await hubspotGet('/crm/v3/pipelines/deals');
    const map = new Map<string, string>();
    for (const p of j.results || []) {
      for (const s of p.stages || []) map.set(s.id, s.label);
    }
    return map;
  } catch {
    return new Map<string, string>();
  }
}

// ─── Patch builder ───
function buildPatch(deals: any[], contacts: any[], companies: any[]) {
  const groups: any[] = [];
  let minDate: string | null = null;
  let maxDate: string | null = null;

  // Deals → one epic per deal
  for (const deal of deals) {
    const props = deal.properties || {};
    const dealName = props.dealname || 'Unnamed Deal';
    const amount = props.amount ? `$${Number(props.amount).toLocaleString()}` : '';
    const stage = deal._stageLabel;
    const closeDate = props.closedate ? props.closedate.split('T')[0] : null;

    const msId = findMilestone(dealName);
    if (!msId) continue;

    const dateStr = closeDate || new Date().toISOString().split('T')[0];
    if (!minDate || dateStr < minDate) minDate = dateStr;
    if (!maxDate || dateStr > maxDate) maxDate = dateStr;

    const tasks = [`Advance deal: ${dealName}${amount ? ` (${amount})` : ''} — currently in ${stage}`];
    if (props.hs_lead_status) tasks.push(`Review lead status: ${props.hs_lead_status}`);

    groups.push({
      sourceId: deal.id,
      sourceType: 'deal',
      sourceTitle: dealName,
      milestoneId: msId,
      tasks,
    });
  }

  // Contacts → grouped by milestone
  const contactsByMs = new Map<string, any[]>();
  for (const contact of contacts) {
    const props = contact.properties || {};
    const fullName = `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Unnamed Contact';
    const text = `${fullName} ${props.company || ''} ${props.email || ''}`;
    const msId = findMilestone(text);
    if (!msId) continue;
    if (!contactsByMs.has(msId)) contactsByMs.set(msId, []);
    contactsByMs.get(msId)!.push({ ...contact, _computedName: fullName });
  }

  for (const [msId, msContacts] of contactsByMs) {
    const dateStr = new Date().toISOString().split('T')[0];
    if (!minDate || dateStr < minDate) minDate = dateStr;
    if (!maxDate || dateStr > maxDate) maxDate = dateStr;

    groups.push({
      sourceId: `contacts-${msId}`,
      sourceType: 'contact',
      sourceTitle: `Contact Follow-ups (${msContacts.length})`,
      milestoneId: msId,
      tasks: msContacts.map((c: any) => {
        const props = c.properties || {};
        const name = c._computedName;
        const company = props.company ? ` @ ${props.company}` : '';
        const email = props.email ? ` <${props.email}>` : '';
        return `Follow up with ${name}${company}${email}`;
      }),
    });
  }

  // Companies → grouped by milestone
  const companiesByMs = new Map<string, any[]>();
  for (const company of companies) {
    const props = company.properties || {};
    const name = props.name || 'Unnamed Company';
    const text = `${name} ${props.industry || ''}`;
    const msId = findMilestone(text);
    if (!msId) continue;
    if (!companiesByMs.has(msId)) companiesByMs.set(msId, []);
    companiesByMs.get(msId)!.push(company);
  }

  for (const [msId, msCompanies] of companiesByMs) {
    const dateStr = new Date().toISOString().split('T')[0];
    if (!minDate || dateStr < minDate) minDate = dateStr;
    if (!maxDate || dateStr > maxDate) maxDate = dateStr;

    groups.push({
      sourceId: `companies-${msId}`,
      sourceType: 'company',
      sourceTitle: `Company Reviews (${msCompanies.length})`,
      milestoneId: msId,
      tasks: msCompanies.map((c: any) => {
        const props = c.properties || {};
        const n = props.name || 'Unnamed Company';
        const industry = props.industry ? ` (${props.industry})` : '';
        return `Review account: ${n}${industry}`;
      }),
    });
  }

  const dateRange = minDate && maxDate
    ? (minDate === maxDate ? minDate : `${minDate} to ${maxDate}`)
    : 'latest batch';

  return { lastSyncAt: new Date().toISOString(), recordDateRange: dateRange, taskGroups: groups };
}

// ─── Main ───
async function main() {
  const lookbackHrs = parseInt(process.env.SYNC_LOOKBACK_HOURS || '24', 10);
  const sinceMs = Date.now() - lookbackHrs * 60 * 60 * 1000;

  console.log('🔶 HubSpot Sync Started');
  console.log(`   Lookback: ${lookbackHrs}h · Since: ${new Date(sinceMs).toISOString()}\n`);

  const stageMap = await fetchDealStageMap();

  const [deals, contacts, companies] = await Promise.all([
    fetchOpenDeals(stageMap),
    fetchRecentContacts(sinceMs),
    fetchRecentCompanies(sinceMs),
  ]);

  console.log(`📊 ${deals.length} deal(s)`);
  console.log(`👤 ${contacts.length} contact(s)`);
  console.log(`🏢 ${companies.length} company(ies)\n`);

  const patch = buildPatch(deals, contacts, companies);
  const out = path.join(__dirname, '..', 'public', 'data', 'synced-hubspot.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(patch, null, 2));

  const totalTasks = patch.taskGroups.reduce((n: number, g: any) => n + g.tasks.length, 0);
  console.log(`🧠 ${patch.taskGroups.length} group(s) mapped to milestones`);
  console.log(`✅ ${totalTasks} tasks derived`);
  console.log(`💾 Saved to public/data/synced-hubspot.json\n`);

  for (const g of patch.taskGroups) {
    const short = g.sourceTitle.length > 48 ? g.sourceTitle.slice(0, 48) + '…' : g.sourceTitle;
    console.log(`   • ${short} → ${g.milestoneId} (${g.tasks.length} tasks)`);
  }

  const unmatchedDeals = deals.filter((d: any) => !findMilestone(d.properties?.dealname || ''));
  if (unmatchedDeals.length > 0) {
    console.log(`\n⚠️  ${unmatchedDeals.length} deal(s) didn't match any milestone.`);
  }
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });

