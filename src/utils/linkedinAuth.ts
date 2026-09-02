import type { LinkedInSyncPatch, LinkedInTaskGroup } from "../types/sync";

const CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID || "";
const REDIRECT_URI = `${window.location.origin}/linkedin-callback`;
const OAUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

// LinkedIn has gated most read APIs behind approved products.
// The only self-service (no-approval) scopes are OpenID Connect
// (openid, profile, email) and Share on LinkedIn (w_member_social).
// Organization/member post reading requires Community Management API
// and Member Data Portability API products, which must be requested
// manually in the Developer Portal and are often denied.
const SCOPES = "openid profile email w_member_social";

function generateState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildAuthUrl(): string {
  const state = generateState();
  sessionStorage.setItem("linkedin_oauth_state", state);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    scope: SCOPES,
  });
  return `${OAUTH_URL}?${params.toString()}`;
}

export function isLinkedInCallback(): boolean {
  return window.location.pathname === "/linkedin-callback";
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export async function exchangeCodeForToken(
  code: string,
  clientSecret: string
): Promise<LinkedInTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: CLIENT_ID,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

export function getStoredToken(): string | null {
  return localStorage.getItem("linkedin_access_token");
}

export function storeToken(token: string): void {
  localStorage.setItem("linkedin_access_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("linkedin_access_token");
}

// ─── Data fetching ───

async function linkedInApi<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.linkedin.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202306",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn API ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function fetchOrganizations(token: string) {
  try {
    const data = await linkedInApi<{ elements?: Array<{ organizationalTarget?: string }> }>(
      "/v2/organizationalEntityAcls?q=roleAssignee",
      token
    );

    const orgs: Array<{ urn: string; name: string }> = [];
    for (const el of data.elements || []) {
      const urn = el.organizationalTarget;
      if (!urn) continue;
      const id = urn.replace("urn:li:organization:", "");
      try {
        const orgData = await linkedInApi<{ localizedName?: string; vanityName?: string }>(
          `/v2/organizations/${id}`,
          token
        );
        orgs.push({
          urn,
          name: orgData.localizedName || orgData.vanityName || `Org ${id}`,
        });
      } catch {
        orgs.push({ urn, name: `Org ${id}` });
      }
    }
    return orgs;
  } catch {
    return [];
  }
}

async function fetchCompanyPosts(token: string, orgUrn: string) {
  try {
    const encodedUrn = encodeURIComponent(orgUrn);
    const data = await linkedInApi<{ elements?: Array<{ id: string; commentary?: string; createdAt?: number; lifecycleState?: string }> }>(
      `/rest/posts?author=${encodedUrn}&q=author&count=10`,
      token
    );
    return (data.elements || []).filter((p) => p.lifecycleState === "PUBLISHED");
  } catch {
    return [];
  }
}

async function fetchMemberProfile(token: string): Promise<{ id: string; name?: string } | null> {
  // Try legacy v2/me first (requires r_liteprofile — gated)
  try {
    const me = await linkedInApi<{ id?: string; localizedFirstName?: string; localizedLastName?: string }>("/v2/me", token);
    if (me.id) {
      const name = [me.localizedFirstName, me.localizedLastName].filter(Boolean).join(" ") || undefined;
      return { id: me.id, name };
    }
  } catch { /* fallthrough */ }

  // Fallback to OpenID Connect userinfo (works with openid/profile/email scopes)
  try {
    const userinfo = await linkedInApi<{ sub?: string; name?: string }>("/v2/userinfo", token);
    if (userinfo.sub) {
      return { id: userinfo.sub, name: userinfo.name || undefined };
    }
  } catch { /* fallthrough */ }

  return null;
}

async function fetchMemberPosts(token: string) {
  try {
    const profile = await fetchMemberProfile(token);
    if (!profile) return [];
    const personUrn = `urn:li:person:${profile.id}`;
    const data = await linkedInApi<{ elements?: Array<{ id: string; commentary?: string; createdAt?: number; lifecycleState?: string }> }>(
      `/rest/posts?author=${encodeURIComponent(personUrn)}&q=author&count=10`,
      token
    );
    return (data.elements || []).filter((p) => p.lifecycleState === "PUBLISHED");
  } catch {
    return [];
  }
}

// ─── Milestone mapping ───

const KEYWORD_MAP: Record<string, string[]> = {
  "ms-03": ["ad", "advertising", "paid", "campaign", "spend", "cpm", "cpc", "conversion"],
  "ms-05": ["education", "nurture", "teach", "tutorial", "guide", "docs"],
  "ms-06": ["community", "content", "social", "post", "linkedin", "engage", "share"],
  "ms-01": ["sales", "pipeline", "revenue", "deal", "funnel", "owner"],
};

function mapPostToMilestone(title: string): string {
  const lower = title.toLowerCase();
  let bestMatch = "ms-06";
  let bestScore = 0;

  for (const [msId, keywords] of Object.entries(KEYWORD_MAP)) {
    const score = keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = msId;
    }
  }

  return bestMatch;
}

// ─── Sync building ───

export async function buildLinkedInPatch(token: string): Promise<LinkedInSyncPatch> {
  const now = new Date().toISOString();
  const taskGroups: LinkedInTaskGroup[] = [];

  const orgs = await fetchOrganizations(token);

  for (const org of orgs) {
    const posts = await fetchCompanyPosts(token, org.urn);
    for (const post of posts) {
      const title = (post.commentary || "LinkedIn Post").substring(0, 80);
      const postId = post.id.replace("urn:li:share:", "").replace("urn:li:ugcPost:", "");
      taskGroups.push({
        sourceId: postId,
        sourceType: "company_post",
        sourceTitle: title,
        milestoneId: mapPostToMilestone(title),
        tasks: [
          "Engage with comments and reactions",
          "Share to relevant communities / Slacks",
          "Add to nurture sequence or follow-up playbook",
        ],
      });
    }
  }

  const memberPosts = await fetchMemberPosts(token);
  for (const post of memberPosts) {
    const title = (post.commentary || "LinkedIn Post").substring(0, 80);
    const postId = post.id.replace("urn:li:share:", "").replace("urn:li:ugcPost:", "");
    if (taskGroups.some((g) => g.sourceId === postId)) continue;

    taskGroups.push({
      sourceId: postId,
      sourceType: "member_post",
      sourceTitle: title,
      milestoneId: mapPostToMilestone(title),
      tasks: [
        "Reply to comments within 20 minutes",
        "Cross-post to relevant communities",
        "Add top comments to nurture content backlog",
      ],
    });
  }

  return {
    lastSyncAt: now,
    recordDateRange: `${new Date(Date.now() - 30 * 864e5).toISOString()} to ${now}`,
    taskGroups,
  };
}
