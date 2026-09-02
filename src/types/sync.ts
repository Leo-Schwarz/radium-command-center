/**
 * A group of action items extracted from a single Fireflies meeting,
 * mapped to a milestone so it can be injected as an epic + tasks.
 */
export interface FirefliesTaskGroup {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  milestoneId: string;
  actionItems: string[];
}

/**
 * The patch file written by the sync script and consumed by the dashboard.
 * Contains only derived work items — no meeting card data.
 */
export interface FirefliesSyncPatch {
  lastSyncAt: string;
  meetingDateRange: string;
  taskGroups: FirefliesTaskGroup[];
}

// ─── HubSpot sync types ───

export interface HubSpotTaskGroup {
  sourceId: string;
  sourceType: 'deal' | 'contact' | 'company';
  sourceTitle: string;
  milestoneId: string;
  tasks: string[];
}

export interface HubSpotSyncPatch {
  lastSyncAt: string;
  recordDateRange: string;
  taskGroups: HubSpotTaskGroup[];
}

// ─── LinkedIn sync types ───

export interface LinkedInTaskGroup {
  sourceId: string;
  sourceType: 'company_post' | 'member_post' | 'lead';
  sourceTitle: string;
  milestoneId: string;
  tasks: string[];
}

export interface LinkedInSyncPatch {
  lastSyncAt: string;
  recordDateRange: string;
  taskGroups: LinkedInTaskGroup[];
}