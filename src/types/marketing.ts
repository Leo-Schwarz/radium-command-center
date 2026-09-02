/**
 * Marketing Stats — PLG-only snapshot.
 * No pipeline/deal stage data. Tracks acquisition, activation, and engagement
 * across paid, organic, social, and product channels.
 */

export interface HistoryPoint {
  date: string;
  value: number;
}

// ─── HubSpot (lead source + product events only) ───

export interface HubSpotMetrics {
  totalContacts: number;
  newContacts7d: number;
  newContacts30d: number;
  // product event counts from HubSpot (map to offline conversions)
  productEvents7d: { event: string; count: number }[];
  contactHistory: HistoryPoint[];
}

// ─── Google Ads ───

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  spend7d: number;
  spend30d: number;
  impressions7d: number;
  clicks7d: number;
  signups7d: number; // conversion = signup (or closest proxy)
  ctr: number;
  cpc: number;
  costPerSignup: number;
}

export interface GoogleAdsMetrics {
  totalSpend7d: number;
  totalSpend30d: number;
  totalImpressions7d: number;
  totalClicks7d: number;
  totalSignups7d: number;
  avgCtr7d: number;
  avgCpc7d: number;
  avgCostPerSignup7d: number;
  campaigns: GoogleAdsCampaign[];
  conversionBreakdown: { name: string; count: number }[];
  paidVsOrganicSignups: { source: 'paid' | 'organic'; signups7d: number; signups30d: number }[];
}

// ─── LinkedIn ───

export interface LinkedInPost {
  id: string;
  title: string;
  date: string;
  impressions: number;
  clicks: number;
  reactions: number;
  comments: number;
}

export interface LinkedInMetrics {
  followers: number;
  followerGrowth7d: number;
  impressions7d: number;
  clicks7d: number;
  engagements7d: number;
  ctr: number;
  leadGenForms7d: number;
  avgEngagementRate: number;
  recentPosts: LinkedInPost[];
  weeklyHistory: HistoryPoint[];
}

// ─── Website ───

export interface WebsitePage {
  path: string;
  sessions7d: number;
  bounceRate: number;
  avgTimeSeconds: number;
}

export interface WebsiteMetrics {
  sessions7d: number;
  sessions30d: number;
  uniqueVisitors7d: number;
  bounceRate: number;
  avgSessionSeconds: number;
  pages: WebsitePage[];
  // PLG funnel: landing → signup → api key → first token → first spend
  funnel: {
    stage: string;
    visitors: number;
    conversionToNext?: number | null;
  }[];
  dailySessions: HistoryPoint[];
}

// ─── Product ───

export interface ProductMetrics {
  signups7d: number;
  signups30d: number;
  apiKeyCreated7d: number;
  firstTokenUsage7d: number;
  firstSpend7d: number;
  activationRate: number; // signup → api key
  qualifiedActivationRate: number; // signup → first token usage
  paidActivationRate: number; // signup → first spend
  weeklyActiveUsers: number;
  eventHistory: {
    signup: HistoryPoint[];
    apiKeyCreated: HistoryPoint[];
    firstTokenUsage: HistoryPoint[];
  };
}

// ─── KPI Summary (PLG only) ───

export interface KpiSummary {
  weeklySignups: number;
  weeklyActivations: number; // api key created
  weeklyQualifiedActivations: number; // first token usage
  activationRate: number;
  qualifiedActivationRate: number;
  costPerSignup: number; // ad spend / signups
  organicVsPaidSplit: number; // % organic signups
}

// ─── Top-level snapshot ───

export interface MarketingStats {
  lastSyncAt: string;
  dateRange: '7d' | '30d' | '90d';
  hubspot: HubSpotMetrics;
  googleAds: GoogleAdsMetrics;
  linkedin: LinkedInMetrics;
  website: WebsiteMetrics;
  product: ProductMetrics;
  kpis: KpiSummary;
}
