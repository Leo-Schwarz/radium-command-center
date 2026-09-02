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