/**
 * Task represents the atomic unit of work.
 * Flat structure designed for easy API serialization.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string; // ISO date string — when task was marked done
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // ISO date string
  tags: string[]; // e.g. ['urgent','blocked','week']
  channel?: string;
  bucket?: string;
  subtasks?: Task[]; // optional nested sub-tasks for complex work items
}

/**
 * Epic groups related tasks under a theme.
 */
export interface Epic {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  owner: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

/**
 * Milestone represents a major PLG initiative phase.
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string; // ISO date string
  epics: Epic[];
  icon: string; // lucide icon name
  status: 'ok' | 'partial' | 'unproven' | 'failing';
}

/**
 * Dashboard data wrapper — what a real API would return.
 */
export interface DashboardData {
  milestones: Milestone[];
  lastUpdated: string;
}

/**
 * Computed progress for any level of the hierarchy.
 */
export interface ProgressSnapshot {
  total: number;
  completed: number;
  percentage: number;
}

// ─── Knowledge Base ───

/**
 * A knowledge document — strategy docs, meeting notes, research,
 * anything Leo wants to preserve and link to work items.
 */
export interface KnowledgeDoc {
  id: string;              // e.g. "kd-001"
  title: string;
  content: string;         // markdown body
  source: 'claude' | 'fireflies' | 'manual' | 'hubspot' | 'linkedin' | 'google-ads' | 'contentsquare' | 'other';
  sourceUrl?: string;      // optional link to original (Fireflies URL, etc.)
  tags: string[];          // free-form tags for filtering
  linkedMilestoneIds: string[];  // ms-01, ms-02, etc.
  linkedEpicIds: string[];       // ep-01-1, ep-02-3, etc.
  linkedTaskIds: string[];       // T001, T002, etc.
  createdAt: string;       // ISO date
  updatedAt: string;       // ISO date
  author?: string;
}

/**
 * Index file that lists all knowledge docs.
 */
export interface KnowledgeIndex {
  docs: KnowledgeDoc[];
  lastUpdated: string;
}

// ─── Hiring Tracker ───

export type CandidateStatus =
  | 'new'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'on-hold';

export type HiringRoleStatus = 'open' | 'hiring' | 'filled' | 'paused';

export interface HiringCandidate {
  id: string;
  name: string;
  email?: string;
  linkedIn?: string;
  roleId: string;
  status: CandidateStatus;
  source: string; // e.g. "AngelList", "Referral", "LinkedIn outbound"
  notes: string;
  rating?: number; // 1-5
  appliedAt?: string; // ISO date
  stageHistory: { stage: CandidateStatus; date: string; note?: string }[];
}

export interface HiringRole {
  id: string;
  title: string;
  department: string;
  status: HiringRoleStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string; // "Remote (EU)", "London", "Berlin"
  salaryRange: string; // "€60k–€80k"
  description: string;
  requirements: string[];
  niceToHave: string[];
  owner: string;
  linkedPillarIds: string[];
  notes: string;
  postedAt?: string; // ISO date
  candidates: HiringCandidate[];
}

export interface HiringData {
  roles: HiringRole[];
  lastUpdated: string;
}