import { useState, useCallback, useMemo } from 'react';
import type { DashboardData, Epic, Milestone, Task } from '../types';
import type { FirefliesSyncPatch, HubSpotSyncPatch, LinkedInSyncPatch } from '../types/sync';

const COMPLETIONS_KEY = 'radium-cc-completions-v1';

type CompletionRecord = { completed: boolean; completedAt?: string };

function loadCompletions(): Record<string, CompletionRecord> {
  try {
    return JSON.parse(localStorage.getItem(COMPLETIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCompletions(map: Record<string, CompletionRecord>) {
  try {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(map));
  } catch {
    /* ignore storage errors */
  }
}

function applyCompletions(data: DashboardData): DashboardData {
  const completions = loadCompletions();
  const keys = Object.keys(completions);
  if (keys.length === 0) return data;

  const next: DashboardData = JSON.parse(JSON.stringify(data));
  for (const ms of next.milestones) {
    for (const ep of ms.epics) {
      for (const t of ep.tasks) {
        const saved = completions[t.id];
        if (saved) {
          t.completed = saved.completed;
          t.completedAt = saved.completedAt;
        }
      }
    }
  }
  return next;
}

export function useDashboardState(initialData: DashboardData) {
  const [data, setData] = useState<DashboardData>(() => applyCompletions(initialData));

  const computeEpicProgress = useCallback((epic: Epic) => {
    const total = epic.tasks.length;
    const completed = epic.tasks.filter(t => t.completed).length;
    return { total, completed, percentage: total === 0 ? 0 : (completed / total) * 100 };
  }, []);

  const computeMilestoneProgress = useCallback((milestone: Milestone) => {
    let total = 0;
    let completed = 0;
    milestone.epics.forEach(epic => {
      epic.tasks.forEach(t => {
        total++;
        if (t.completed) completed++;
      });
    });
    return { total, completed, percentage: total === 0 ? 0 : (completed / total) * 100 };
  }, []);

  const overallProgress = useMemo(() => {
    let total = 0;
    let completed = 0;
    data.milestones.forEach(ms => {
      ms.epics.forEach(ep => {
        ep.tasks.forEach(t => {
          total++;
          if (t.completed) completed++;
        });
      });
    });
    return { total, completed, percentage: total === 0 ? 0 : (completed / total) * 100 };
  }, [data]);

  const toggleTask = useCallback((taskId: string) => {
    setData(prev => {
      const completions = loadCompletions();
      const next: DashboardData = {
        ...prev,
        milestones: prev.milestones.map(ms => ({
          ...ms,
          epics: ms.epics.map(ep => ({
            ...ep,
            tasks: ep.tasks.map(t => {
              if (t.id === taskId) {
                const nowCompleted = !t.completed;
                const completedAt = nowCompleted ? new Date().toISOString() : undefined;
                completions[t.id] = { completed: nowCompleted, completedAt };
                return { ...t, completed: nowCompleted, completedAt };
              }
              if (t.subtasks) {
                const subIndex = t.subtasks.findIndex(s => s.id === taskId);
                if (subIndex >= 0) {
                  const nowCompleted = !t.subtasks[subIndex].completed;
                  const completedAt = nowCompleted ? new Date().toISOString() : undefined;
                  completions[taskId] = { completed: nowCompleted, completedAt };
                  const newSubtasks = [...t.subtasks];
                  newSubtasks[subIndex] = { ...newSubtasks[subIndex], completed: nowCompleted, completedAt };
                  return { ...t, subtasks: newSubtasks };
                }
              }
              return t;
            }),
          })),
        })),
      };
      saveCompletions(completions);
      return next;
    });
  }, []);

  /**
   * Merge a Fireflies sync patch into the dashboard data.
   * Creates a new epic under the matched milestone for each meeting,
   * with action items as tasks.
   */
  const applySyncPatch = useCallback((patch: FirefliesSyncPatch) => {
    setData(prev => {
      // Deep-clone so we don't mutate frozen objects
      const next: DashboardData = JSON.parse(JSON.stringify(prev));
      let didUpdate = false;

      for (const group of patch.taskGroups) {
        const ms = next.milestones.find(m => m.id === group.milestoneId);
        if (!ms) continue;

        // Check if an epic for this meeting already exists to avoid dups
        const epicId = `ff-${group.meetingId}`;
        const existing = ms.epics.find(ep => ep.id === epicId);
        if (existing) continue;

        const due = new Date(Date.now() + 3 * 864e5).toISOString().split('T')[0];
        const tasks: Task[] = group.actionItems.map((item, i) => ({
          id: `ff-${group.meetingId}-${i}`,
          title: item,
          description: `From: ${group.meetingTitle} · ${group.meetingDate}`,
          completed: false,
          assignee: 'Unassigned',
          priority: 'high',
          dueDate: due,
          tags: ['fireflies'],
          channel: 'Meeting',
          bucket: 'now',
        }));

        ms.epics.push({
          id: epicId,
          title: group.meetingTitle,
          description: `${group.actionItems.length} task(s) derived from Fireflies · ${group.meetingDate}`,
          owner: 'Fireflies',
          status: 'in_progress',
          tasks,
        });

        didUpdate = true;
      }

      if (didUpdate) {
        next.lastUpdated = patch.lastSyncAt;
      }
      return applyCompletions(next);
    });
  }, []);

  /**
   * Merge a HubSpot sync patch into the dashboard data.
   * Creates or updates epics under matched milestones for deals,
   * contacts, and companies.
   */
  const applyHubSpotPatch = useCallback((patch: HubSpotSyncPatch) => {
    setData(prev => {
      const next: DashboardData = JSON.parse(JSON.stringify(prev));
      let didUpdate = false;

      for (const group of patch.taskGroups) {
        const ms = next.milestones.find(m => m.id === group.milestoneId);
        if (!ms) continue;

        const epicId = `hs-${group.sourceId}`;
        const existingEpicIndex = ms.epics.findIndex(ep => ep.id === epicId);
        const due = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];

        const newTasks: Task[] = group.tasks.map((item, i) => ({
          id: `hs-${group.sourceId}-${i}`,
          title: item,
          description: `From HubSpot · ${group.sourceType}: ${group.sourceTitle}`,
          completed: false,
          assignee: 'Unassigned',
          priority: 'high',
          dueDate: due,
          tags: ['hubspot'],
          channel: 'CRM',
          bucket: 'now',
        }));

        if (existingEpicIndex >= 0) {
          // Merge: add only tasks not already present by title
          const existing = ms.epics[existingEpicIndex];
          const existingTitles = new Set(existing.tasks.map(t => t.title));
          const tasksToAdd = newTasks.filter(t => !existingTitles.has(t.title));
          if (tasksToAdd.length > 0) {
            existing.tasks.push(...tasksToAdd);
            existing.description = `${existing.tasks.length} task(s) from HubSpot · ${group.sourceType}`;
            didUpdate = true;
          }
        } else {
          ms.epics.push({
            id: epicId,
            title: group.sourceTitle,
            description: `${group.tasks.length} task(s) from HubSpot · ${group.sourceType}`,
            owner: 'HubSpot',
            status: 'in_progress',
            tasks: newTasks,
          });
          didUpdate = true;
        }
      }

      if (didUpdate) {
        next.lastUpdated = patch.lastSyncAt;
      }
      return applyCompletions(next);
    });
  }, []);

  /**
   * Merge a LinkedIn sync patch into the dashboard data.
   * Creates or updates epics under matched milestones for company/member posts.
   */
  const applyLinkedInPatch = useCallback((patch: LinkedInSyncPatch) => {
    setData(prev => {
      const next: DashboardData = JSON.parse(JSON.stringify(prev));
      let didUpdate = false;

      for (const group of patch.taskGroups) {
        const ms = next.milestones.find(m => m.id === group.milestoneId);
        if (!ms) continue;

        const epicId = `li-${group.sourceId}`;
        const existingEpicIndex = ms.epics.findIndex(ep => ep.id === epicId);
        const due = new Date(Date.now() + 3 * 864e5).toISOString().split('T')[0];

        const newTasks: Task[] = group.tasks.map((item, i) => ({
          id: `li-${group.sourceId}-${i}`,
          title: item,
          description: `From LinkedIn · ${group.sourceType}: ${group.sourceTitle}`,
          completed: false,
          assignee: 'Unassigned',
          priority: 'high',
          dueDate: due,
          tags: ['linkedin'],
          channel: 'Social',
          bucket: 'now',
        }));

        if (existingEpicIndex >= 0) {
          const existing = ms.epics[existingEpicIndex];
          const existingTitles = new Set(existing.tasks.map(t => t.title));
          const tasksToAdd = newTasks.filter(t => !existingTitles.has(t.title));
          if (tasksToAdd.length > 0) {
            existing.tasks.push(...tasksToAdd);
            existing.description = `${existing.tasks.length} task(s) from LinkedIn · ${group.sourceType}`;
            didUpdate = true;
          }
        } else {
          ms.epics.push({
            id: epicId,
            title: group.sourceTitle,
            description: `${group.tasks.length} task(s) from LinkedIn · ${group.sourceType}`,
            owner: 'LinkedIn',
            status: 'in_progress',
            tasks: newTasks,
          });
          didUpdate = true;
        }
      }

      if (didUpdate) {
        next.lastUpdated = patch.lastSyncAt;
      }
      return applyCompletions(next);
    });
  }, []);

  return {
    data,
    overallProgress,
    computeEpicProgress,
    computeMilestoneProgress,
    toggleTask,
    applySyncPatch,
    applyHubSpotPatch,
    applyLinkedInPatch,
  };
}