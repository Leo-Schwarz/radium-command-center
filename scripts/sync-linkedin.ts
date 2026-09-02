import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, '..', '.env'));

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('Missing LINKEDIN_ACCESS_TOKEN in .env file');
  console.error('For browser OAuth: click Connect LinkedIn in the dashboard UI.');
  console.error('For server-side sync, add a long-lived token to .env:');
  console.error('LINKEDIN_ACCESS_TOKEN=your_token_here');
  process.exit(1);
}

const LINKEDIN_BASE = 'https://api.linkedin.com';

// Milestone keyword mapping
const KEYWORDS: Record<string, string[]> = {
  'ms-03': ['ad', 'advertising', 'paid', 'campaign', 'spend', 'cpm', 'cpc', 'conversion'],
  'ms-05': ['education', 'nurture', 'teach', 'tutorial', 'guide', 'docs'],
  'ms-06': ['community', 'content', 'social', 'post', 'linkedin', 'engage', 'share'],
  'ms-01': ['sales', 'pipeline', 'revenue', 'deal', 'funnel', 'owner'],
};

function findMilestone(text: string) {
  const t = text.toLowerCase();
  let best: { id: string; score: number } | undefined;
  for (const [id, kws] of Object.entries(KEYWORDS)) {
    let s = 0;
    for (const kw of kws) if (t.includes(kw.toLowerCase())) s += kw.split(' ').length;
    if (s > 0 && (!best || s > best.score)) best = { id, score: s };
  }
  return best?.id;
}

// API helpers
async function linkedInApi<T>(path: string): Promise<T> {
  const r = await fetch(`${LINKEDIN_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202306',
    },
  });
  if (!r.ok) throw new Error(`LinkedIn API ${r.status}: ${r.statusText} -- ${path}`);
  return r.json();
}

interface Org {
  urn: string;
  name: string;
}

async function fetchOrganizations(): Promise<Org[]> {
  try {
    const data = await linkedInApi<{ elements?: Array<{ organizationalTarget?: string }> }>(
      '/v2/organizationalEntityAcls?q=roleAssignee'
    );
    const orgs: Org[] = [];
    for (const el of data.elements || []) {
      const urn = el.organizationalTarget;
      if (!urn) continue;
      const id = urn.replace('urn:li:organization:', '');
      try {
        const orgData = await linkedInApi<{ localizedName?: string; vanityName?: string }>(
          `/v2/organizations/${id}`
        );
        orgs.push({ urn, name: orgData.localizedName || orgData.vanityName || `Org ${id}` });
      } catch {
        orgs.push({ urn, name: `Org ${id}` });
      }
    }
    return orgs;
  } catch {
    return [];
  }
}

async function fetchCompanyPosts(orgUrn: string) {
  try {
    const data = await linkedInApi<{ elements?: Array<{ id: string; commentary?: string; createdAt?: number; lifecycleState?: string }> }>(
      `/rest/posts?author=${encodeURIComponent(orgUrn)}&q=author&count=10`
    );
    return (data.elements || []).filter((p) => p.lifecycleState === 'PUBLISHED');
  } catch {
    return [];
  }
}

async function fetchMemberProfile(): Promise<{ id: string } | null> {
  // Legacy v2/me requires r_liteprofile (gated)
  try {
    const me = await linkedInApi<{ id?: string }>('/v2/me');
    if (me.id) return { id: me.id };
  } catch { /* fallthrough */ }
  // OpenID Connect userinfo works with openid/profile/email scopes
  try {
    const info = await linkedInApi<{ sub?: string }>('/v2/userinfo');
    if (info.sub) return { id: info.sub };
  } catch { /* fallthrough */ }
  return null;
}

async function fetchMemberPosts() {
  try {
    const profile = await fetchMemberProfile();
    if (!profile) return [];
    const personUrn = `urn:li:person:${profile.id}`;
    const data = await linkedInApi<{ elements?: Array<{ id: string; commentary?: string; createdAt?: number; lifecycleState?: string }> }>(
      `/rest/posts?author=${encodeURIComponent(personUrn)}&q=author&count=10`
    );
    return (data.elements || []).filter((p) => p.lifecycleState === 'PUBLISHED');
  } catch {
    return [];
  }
}

async function buildPatch() {
  const now = new Date().toISOString();
  const taskGroups: Array<{
    sourceId: string;
    sourceType: 'company_post' | 'member_post';
    sourceTitle: string;
    milestoneId: string;
    tasks: string[];
  }> = [];

  const orgs = await fetchOrganizations();
  console.log(`Found ${orgs.length} organization(s)`);

  for (const org of orgs) {
    const posts = await fetchCompanyPosts(org.urn);
    console.log(`  ${org.name}: ${posts.length} post(s)`);
    for (const post of posts) {
      const title = (post.commentary || 'LinkedIn Post').substring(0, 80);
      const postId = post.id.replace('urn:li:share:', '').replace('urn:li:ugcPost:', '');
      const msId = findMilestone(title) || 'ms-06';
      taskGroups.push({
        sourceId: postId,
        sourceType: 'company_post',
        sourceTitle: title,
        milestoneId: msId,
        tasks: [
          'Engage with comments and reactions',
          'Share to relevant communities / Slacks',
          'Add to nurture sequence or follow-up playbook',
        ],
      });
    }
  }

  const memberPosts = await fetchMemberPosts();
  console.log(`Found ${memberPosts.length} member post(s)`);
  for (const post of memberPosts) {
    const title = (post.commentary || 'LinkedIn Post').substring(0, 80);
    const postId = post.id.replace('urn:li:share:', '').replace('urn:li:ugcPost:', '');
    if (taskGroups.some((g) => g.sourceId === postId)) continue;
    const msId = findMilestone(title) || 'ms-06';
    taskGroups.push({
      sourceId: postId,
      sourceType: 'member_post',
      sourceTitle: title,
      milestoneId: msId,
      tasks: [
        'Reply to comments within 20 minutes',
        'Cross-post to relevant communities',
        'Add top comments to nurture content backlog',
      ],
    });
  }

  return {
    lastSyncAt: now,
    recordDateRange: `${new Date(Date.now() - 30 * 864e5).toISOString()} to ${now}`,
    taskGroups,
  };
}

async function main() {
  console.log('LinkedIn Sync Started\n');
  const patch = await buildPatch();

  const out = path.join(__dirname, '..', 'public', 'data', 'synced-linkedin.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(patch, null, 2));

  const totalTasks = patch.taskGroups.reduce((n, g) => n + g.tasks.length, 0);
  console.log(`\n${patch.taskGroups.length} group(s) mapped to milestones`);
  console.log(`${totalTasks} tasks derived`);
  console.log(`Saved to public/data/synced-linkedin.json\n`);

  for (const g of patch.taskGroups) {
    const short = g.sourceTitle.length > 48 ? g.sourceTitle.slice(0, 48) + '...' : g.sourceTitle;
    console.log(`  ${short} -> ${g.milestoneId} (${g.tasks.length} tasks)`);
  }
}

main().catch((e) => {
  console.error('\nError:', e.message);
  process.exit(1);
});
