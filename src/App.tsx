import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { mockDashboardData } from './data/mockData';
import { useDashboardState } from './hooks/useDashboardState';
import type { Task, Milestone, DashboardData, KnowledgeDoc } from './types';
import TaskBoardCard from './components/TaskBoardCard';
import PillarOverviewCard from './components/PillarOverviewCard';
import CompletedTasksArchive from './components/CompletedTasksArchive';
import TaskDetailModal from './components/TaskDetailModal';
import MilestonePage from './components/MilestonePage';
import KnowledgeBase from './components/KnowledgeBase';
import KnowledgeDocDetail from './components/KnowledgeDocDetail';
import MarketingStats from './components/MarketingStats';
import TaskCompletionSummary from './components/TaskCompletionSummary';
import type { FirefliesSyncPatch, HubSpotSyncPatch, LinkedInSyncPatch } from './types/sync';
import type { MarketingStats as MarketingStatsType } from './types/marketing';
import {
  buildAuthUrl,
  isLinkedInCallback,
  exchangeCodeForToken,
  getStoredToken,
  storeToken,
  buildLinkedInPatch,
} from './utils/linkedinAuth';


function buildTaskIndex(milestones: Milestone[]) {
  const result: Record<string, { task: Task; milestone: Milestone; epic: Milestone['epics'][0] }> = {};
  milestones.forEach(ms => {
    ms.epics.forEach(ep => {
      ep.tasks.forEach(t => {
        result[t.id] = { task: t, milestone: ms, epic: ep };
      });
    });
  });
  return result;
}

type FilterTag = 'all' | 'blocked' | 'urgent' | 'week' | 'hubspot' | 'linkedin';

function DashboardContent({ initialData }: { initialData: DashboardData }) {
  const { data, computeEpicProgress, computeMilestoneProgress, toggleTask, updateTask, applySyncPatch, applyHubSpotPatch, applyLinkedInPatch } =
    useDashboardState(initialData);

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [activeTag, setActiveTag] = useState<FilterTag>('all');
  const [, setSyncApplied] = useState(false);
  const [liLoading, setLiLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'all-tasks' | 'knowledge-base' | 'marketing-stats'>('dashboard');
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedKnowledgeDocId, setSelectedKnowledgeDocId] = useState<string | null>(null);
  const [marketingStats, setMarketingStats] = useState<MarketingStatsType | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Build task index from original data (so completed state reflects realtime)
  const taskIndex = buildTaskIndex(data.milestones);
  const allTasks = Object.values(taskIndex).map(x => x.task);
  const openTasks = allTasks.filter(t => !t.completed);
  const completedTasks = useMemo(() => {
    return Object.values(taskIndex)
      .filter(({ task }) => task.completed)
      .sort((a, b) => {
        const aTime = a.task.completedAt ? new Date(a.task.completedAt).getTime() : 0;
        const bTime = b.task.completedAt ? new Date(b.task.completedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [data]);

  const completedCount = allTasks.filter(t => t.completed).length;
  const hsCount = allTasks.filter(t => t.tags.includes('hubspot') && !t.completed).length;
  const liCount = allTasks.filter(t => t.tags.includes('linkedin') && !t.completed).length;

  // Load Fireflies sync patch and merge into milestone/epic structure
  useEffect(() => {
    fetch('/data/synced-tasks.json')
      .then(async res => (res.ok ? (res.json() as Promise<FirefliesSyncPatch>) : null))
      .then(patch => {
        if (patch && patch.taskGroups?.length) {
          applySyncPatch(patch);
          setSyncApplied(true);
        }
      })
      .catch(() => { /* No synced data yet — silently ignore */ });
  }, [applySyncPatch]);

  // Load knowledge base index
  useEffect(() => {
    fetch('/data/knowledge/index.json')
      .then(async res => (res.ok ? (res.json() as Promise<{ docs: KnowledgeDoc[] }>) : null))
      .then(index => {
        if (index?.docs) setKnowledgeDocs(index.docs);
      })
      .catch(() => { /* No knowledge base yet */ });
  }, []);

  // Load HubSpot sync patch and merge into milestone/epic structure
  useEffect(() => {
    fetch('/data/synced-hubspot.json')
      .then(async res => (res.ok ? (res.json() as Promise<HubSpotSyncPatch>) : null))
      .then(patch => {
        if (patch && patch.taskGroups?.length) {
          applyHubSpotPatch(patch);
          setSyncApplied(true);
        }
      })
      .catch(() => { /* No synced data yet — silently ignore */ });
  }, [applyHubSpotPatch]);

  // Load static LinkedIn sync patch (nightly cron writes this)
  useEffect(() => {
    fetch('/data/synced-linkedin.json')
      .then(async res => (res.ok ? (res.json() as Promise<LinkedInSyncPatch>) : null))
      .then(patch => {
        if (patch && patch.taskGroups?.length) {
          applyLinkedInPatch(patch);
          setSyncApplied(true);
        }
      })
      .catch(() => { /* No synced data yet — silently ignore */ });
  }, [applyLinkedInPatch]);

  // Load marketing stats snapshot
  useEffect(() => {
    fetch('/data/marketing-stats.json')
      .then(async res => (res.ok ? (res.json() as Promise<MarketingStatsType>) : null))
      .then(stats => {
        if (stats) setMarketingStats(stats);
      })
      .catch(() => { /* No marketing stats yet — silently ignore */ });
  }, []);

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    if (!isLinkedInCallback()) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const storedState = sessionStorage.getItem('linkedin_oauth_state');

    if (error) {
      window.alert(`LinkedIn OAuth error: ${error}`);
      window.history.replaceState({}, '', '/');
      return;
    }

    if (!code || !state || state !== storedState) {
      window.history.replaceState({}, '', '/');
      return;
    }

    const secret = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET;
    if (!secret) {
      window.alert('Missing LINKEDIN_CLIENT_SECRET in .env');
      window.history.replaceState({}, '', '/');
      return;
    }

    exchangeCodeForToken(code, secret)
      .then(tokenRes => {
        storeToken(tokenRes.access_token);
        sessionStorage.removeItem('linkedin_oauth_state');
        window.history.replaceState({}, '', '/');
        // Trigger a page reload to refresh state
        window.location.reload();
      })
      .catch(err => {
        window.alert(`LinkedIn login failed: ${err.message}`);
        window.history.replaceState({}, '', '/');
      });
  }, []);

  // Load existing stored LinkedIn token and attempt a live sync
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    buildLinkedInPatch(token)
      .then(patch => {
        if (patch.taskGroups.length > 0) {
          applyLinkedInPatch(patch);
          setSyncApplied(true);
        }
      })
      .catch(err => {
        console.warn('LinkedIn sync failed:', err.message);
      });
  }, [applyLinkedInPatch]);

  

  const handleLinkedInAction = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      // Not connected — start OAuth flow
      window.location.href = buildAuthUrl();
      return;
    }
    // Connected — re-sync
    setLiLoading(true);
    try {
      const patch = await buildLinkedInPatch(token);
      if (patch.taskGroups.length > 0) {
        applyLinkedInPatch(patch);
        setSyncApplied(true);
      } else {
        window.alert('No LinkedIn posts found.\n\nReading posts requires LinkedIn Community Management API + Member Data Portability API products, which are gated and must be manually approved by LinkedIn.\n\nYour app is already linked to the verified Radium page — if Products are still greyed out, you likely need Super Admin rights on the Company Page (not just Admin). Ask Adam Hendin to confirm your role or request the products himself.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      window.alert(`LinkedIn sync failed: ${msg}`);
    } finally {
      setLiLoading(false);
    }
  }, [applyLinkedInPatch]);

  const openMilestoneTab = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('milestone', id);
    url.hash = '';
    window.open(url.toString(), '_blank');
  }, []);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        setActiveTag('all');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const milestoneProgress = data.milestones.map(ms => ({
    ms,
    progress: computeMilestoneProgress(ms),
    tasks: ms.epics.flatMap(e => e.tasks),
  }));

  const filteredTasks = useMemo(() => {
    let tasks = allTasks.filter(t => !t.completed && !t.tags.includes('fireflies'));
    if (activeTag !== 'all') {
      tasks = tasks.filter(t => t.tags.includes(activeTag));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignee?.toLowerCase().includes(q)
      );
    }
    return tasks;
  }, [allTasks, activeTag, searchQuery]);

  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const milestoneId = urlParams.get('milestone');
  const selectedTaskInfo = selectedTaskId ? taskIndex[selectedTaskId] : null;

  const overallPct = allTasks.length === 0 ? 0 : (completedCount / allTasks.length) * 100;

  const urgentTasks = useMemo(() => allTasks.filter(t => !t.completed && t.tags.includes('urgent')), [allTasks]);

  // Weekly Planner: 5-day columns + backlog
  const plannerColumns = useMemo(() => {
    const offsets = [0, 1, 2, 3, 4];
    return offsets.map(offset => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offset);
      const iso = d.toISOString().split('T')[0];
      const tasks = openTasks.filter(t => t.dueDate === iso);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const labels = ['Today', 'Tomorrow', '3 days', '4 days', '5 days'];
      return { label: labels[offset], subtitle: `${dayName}, ${monthDay}`, iso, tasks };
    });
  }, [openTasks]);

  const plannerBacklog = useMemo(() => {
    const futureIsos: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      futureIsos.push(d.toISOString().split('T')[0]);
    }
    return openTasks.filter(t => !t.dueDate || !futureIsos.includes(t.dueDate));
  }, [openTasks]);

  if (milestoneId) {
    const milestone = data.milestones.find(m => m.id === milestoneId);
    if (milestone) {
      return (
        <>
          <MilestonePage
            milestone={milestone}
            allMilestones={data.milestones}
            computeEpicProgress={computeEpicProgress}
            computeMilestoneProgress={computeMilestoneProgress}
            onToggleTask={toggleTask}
            onOpenTask={(taskId) => setSelectedTaskId(taskId)}
            knowledgeDocs={knowledgeDocs}
            onOpenKnowledgeDoc={(docId) => setSelectedKnowledgeDocId(docId)}
          />
          {selectedTaskInfo && (
            <TaskDetailModal
              task={selectedTaskInfo.task}
              milestoneTitle={selectedTaskInfo.milestone.title}
              epicTitle={selectedTaskInfo.epic.title}
              onClose={() => setSelectedTaskId(null)}
              onToggle={toggleTask}
              onUpdate={updateTask}
            />
          )}
        </>
      );
    }
  }

  // Build epic title map for knowledge doc detail
  const epicTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    data.milestones.forEach(ms => ms.epics.forEach(ep => { map[ep.id] = ep.title; }));
    return map;
  }, [data.milestones]);

  const completedTaskIds = useMemo(() => {
    const ids = new Set<string>();
    data.milestones.forEach(m =>
      m.epics.forEach(ep =>
        ep.tasks.forEach(t => { if (t.completed) ids.add(t.id); })
      )
    );
    return ids;
  }, [data]);

  const selectedKnowledgeDoc = selectedKnowledgeDocId ? knowledgeDocs.find(d => d.id === selectedKnowledgeDocId) : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white/90">
      <div className="px-4 md:px-8 lg:px-12 pt-6 md:pt-10 pb-10 mx-auto">

        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <img src="/Radium-logo-light.svg" alt="Radium Logo" className="h-10" />
          <div className="flex items-center gap-3">
            {/* Overall Progress Pill */}
            <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2">
              <div className="w-28 h-2.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${overallPct}%`,
                    backgroundColor: overallPct >= 80 ? '#34c759' : overallPct >= 40 ? '#3b82f6' : '#ffcc00',
                  }}
                />
              </div>
              <span className="text-[12px] font-medium tabular-nums text-white/50">{Math.round(overallPct)}%</span>
            </div>
            <span className="text-[10px] text-white/20 uppercase tracking-wider hidden sm:inline">PLG Tracker</span>
          </div>
        </header>

        {/* View Tabs */}
        <div className="flex border-b border-white/[0.08] mb-8">
          <button
            onClick={() => { setActiveView('dashboard'); setSearchQuery(''); setActiveTag('all'); }}
            className={`flex-1 text-center py-3 text-[13px] font-medium tracking-wide transition-colors cursor-pointer ${
              activeView === 'dashboard'
                ? 'text-white/80 border-b-2 border-white/30'
                : 'text-white/30 hover:text-white/55'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('all-tasks')}
            className={`flex-1 text-center py-3 text-[13px] font-medium tracking-wide transition-colors cursor-pointer ${
              activeView === 'all-tasks'
                ? 'text-white/80 border-b-2 border-white/30'
                : 'text-white/30 hover:text-white/55'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveView('knowledge-base')}
            className={`flex-1 text-center py-3 text-[13px] font-medium tracking-wide transition-colors cursor-pointer ${
              activeView === 'knowledge-base'
                ? 'text-white/80 border-b-2 border-white/30'
                : 'text-white/30 hover:text-white/55'
            }`}
          >
            Knowledge Base {knowledgeDocs.length > 0 && (
              <span className="ml-1 text-[10px] text-white/30 tabular-nums">{knowledgeDocs.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveView('marketing-stats')}
            className={`flex-1 text-center py-3 text-[13px] font-medium tracking-wide transition-colors cursor-pointer ${
              activeView === 'marketing-stats'
                ? 'text-white/80 border-b-2 border-white/30'
                : 'text-white/30 hover:text-white/55'
            }`}
          >
            Marketing Stats
          </button>
        </div>

        {activeView === 'all-tasks' && (
        <>
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-40 bg-[#050505] py-4 mb-10 -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12 border-b border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 focus-within:border-white/20 transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/20 flex-shrink-0">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, epics, milestones"
                  className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/20 outline-none"
                />
                <span className="text-[10px] text-white/15 font-medium px-1.5 py-0.5 rounded bg-white/[0.05]">/</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {(['all','blocked','urgent','week','hubspot','linkedin'] as FilterTag[]).map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(prev => prev === tag ? 'all' : tag)}
                  className={`text-[11px] tracking-[0.05em] uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeTag === tag
                      ? 'bg-white/[0.08] border-white/[0.12] text-white/80'
                      : 'bg-transparent border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                  }`}
                >
                  {tag === 'all' ? 'All' : tag}
                </button>
              ))}
              <div className="w-[1px] h-4 bg-white/[0.08] mx-1" />
              <button
                onClick={() => setShowArchive(!showArchive)}
                className={`text-[11px] tracking-[0.05em] uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  showArchive
                    ? 'bg-white/[0.08] border-white/[0.12] text-white/80'
                    : 'bg-transparent border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                }`}
              >
                {showArchive ? 'Hide Archive' : 'Archive'}
                {completedCount > 0 && (
                  <span className="ml-1 text-[10px] bg-white/[0.08] text-white/50 px-1.5 py-0.5 rounded-md tabular-nums">
                    {completedCount}
                  </span>
                )}
              </button>
            </div>

            {/* Expand / Collapse */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleLinkedInAction}
                disabled={liLoading}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                  getStoredToken()
                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/15'
                    : 'bg-transparent border-white/[0.08] text-white/30 hover:text-sky-400 hover:border-sky-500/15'
                } ${liLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {liLoading ? (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
                {getStoredToken() ? 'Sync LinkedIn' : 'Connect LinkedIn'}
              </button>

            </div>
          </div>
        </div>
        </>
        )}

        {activeView === 'dashboard' && (
        <>
        {/* Pillars Overview — card grid */}
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40">
              The 8 Core Pillars
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-white/50">{Math.round(overallPct)}%</span>
              <span className="text-[10px] text-white/20 uppercase tracking-wider">overall</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {milestoneProgress.map(({ ms, progress, tasks }) => (
              <PillarOverviewCard
                key={ms.id}
                milestone={ms}
                progress={progress}
                tasks={tasks}
                onClick={() => openMilestoneTab(ms.id)}
              />
            ))}
          </div>
        </section>

        {/* Urgent & This Week */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-14">
          {/* Urgent */}
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" style={{ boxShadow: '0 0 6px rgba(248,113,113,0.4)' }} />
                <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50">Urgent</h2>
              </div>
              <span className="text-[11px] font-medium text-white/30 tabular-nums px-2 py-0.5 rounded-md bg-white/[0.04]">{urgentTasks.length}</span>
            </div>
            <div>
              {urgentTasks.map(task => (
                <TaskBoardCard key={task.id} task={task} milestoneTitle={taskIndex[task.id].milestone.title} epicTitle={taskIndex[task.id].epic.title} onToggle={toggleTask} onOpen={() => setSelectedTaskId(task.id)} />
              ))}
              {urgentTasks.length === 0 && <p className="text-[13px] text-white/20 py-4 text-center">No urgent tasks.</p>}
            </div>
          </div>
          {/* Weekly Planner */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-purple-400" style={{ boxShadow: '0 0 6px rgba(192,132,252,0.4)' }} />
              <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50">Weekly Planner</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {plannerColumns.map(col => (
                <div key={col.iso} className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-4 flex flex-col min-h-[140px]">
                  <div className="mb-3">
                    <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50">{col.label}</h3>
                    <p className="text-[11px] text-white/25 mt-0.5">{col.subtitle}</p>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    {col.tasks.map(task => (
                      <TaskBoardCard key={task.id} task={task} milestoneTitle={taskIndex[task.id].milestone.title} epicTitle={taskIndex[task.id].epic.title} onToggle={toggleTask} onOpen={() => setSelectedTaskId(task.id)} />
                    ))}
                    {col.tasks.length === 0 && (
                      <p className="text-[12px] text-white/15 py-3 text-center italic">No tasks</p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between">
                    <span className="text-[10px] text-white/30 tabular-nums">{col.tasks.length} tasks</span>
                  </div>
                </div>
              ))}
              {/* Backlog */}
              <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-4 flex flex-col min-h-[140px]">
                <div className="mb-3">
                  <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50">Backlog</h3>
                  <p className="text-[11px] text-white/25 mt-0.5">No date set</p>
                </div>
                <div className="flex-1 space-y-0.5">
                  {plannerBacklog.map(task => (
                    <TaskBoardCard key={task.id} task={task} milestoneTitle={taskIndex[task.id].milestone.title} epicTitle={taskIndex[task.id].epic.title} onToggle={toggleTask} onOpen={() => setSelectedTaskId(task.id)} />
                  ))}
                  {plannerBacklog.length === 0 && (
                    <p className="text-[12px] text-white/15 py-3 text-center italic">No tasks</p>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="text-[10px] text-white/30 tabular-nums">{plannerBacklog.length} tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Completion Summary */}
        <TaskCompletionSummary
          tasks={Object.values(taskIndex)}
          onToggle={toggleTask}
          onOpen={(id) => setSelectedTaskId(id)}
        />
        </>
        )}

        {activeView === 'all-tasks' && (
        <>
        {/* Task Board */}
        <div className="mb-14">
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/30" />
                <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50">
                  {activeTag === 'all' ? 'All Tasks' : activeTag === 'blocked' ? 'Blocked Tasks' : activeTag === 'urgent' ? 'Critical Tasks' : activeTag === 'week' ? 'This Week' : activeTag === 'hubspot' ? 'HubSpot Tasks' : 'LinkedIn Tasks'}
                </h2>
              </div>
              <span className="text-[11px] font-medium text-white/30 tabular-nums px-2 py-0.5 rounded-md bg-white/[0.04]">
                {filteredTasks.length}
              </span>
            </div>
            <div>
              {filteredTasks.map(task => (
                <TaskBoardCard
                  key={task.id}
                  task={task}
                  milestoneTitle={taskIndex[task.id].milestone.title}
                  epicTitle={taskIndex[task.id].epic.title}
                  onToggle={toggleTask}
                  onOpen={() => setSelectedTaskId(task.id)}
                />
              ))}
              {filteredTasks.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-white/20">No tasks match the current filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}


        {showArchive && (
          <CompletedTasksArchive
            tasks={completedTasks}
            onToggle={toggleTask}
          />
        )}

        {activeView === 'knowledge-base' && (
          <KnowledgeBase
            docs={knowledgeDocs}
            milestones={data.milestones}
            onBack={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'marketing-stats' && marketingStats && (
          <MarketingStats stats={marketingStats} />
        )}

        {/* Footer */}
        {activeView !== 'knowledge-base' && activeView !== 'marketing-stats' && (
          <footer className="mt-20 pt-6 border-t border-white/[0.06]">
            <p className="text-[10px] tracking-[0.1em] text-white/20">
              Updated {data.lastUpdated} · {openTasks.length} open · {allTasks.length} total · {data.milestones.length} pillars{hsCount > 0 ? ` · ${hsCount} from HubSpot` : ''}{liCount > 0 ? ` · ${liCount} from LinkedIn` : ''}{knowledgeDocs.length > 0 ? ` · ${knowledgeDocs.length} knowledge docs` : ''}
            </p>
          </footer>
        )}

        {selectedTaskInfo && (
          <TaskDetailModal
            task={selectedTaskInfo.task}
            milestoneTitle={selectedTaskInfo.milestone.title}
            epicTitle={selectedTaskInfo.epic.title}
            onClose={() => setSelectedTaskId(null)}
            onToggle={toggleTask}
            onUpdate={updateTask}
          />
        )}

        {selectedKnowledgeDoc && (
          <KnowledgeDocDetail
            doc={selectedKnowledgeDoc}
            milestoneTitles={useMemo(() => {
              const map: Record<string, string> = {};
              data.milestones.forEach(m => { map[m.id] = m.title; });
              return map;
            }, [data.milestones])}
            epicTitles={epicTitleMap}
            completedTaskIds={completedTaskIds}
            onClose={() => setSelectedKnowledgeDocId(null)}
          />
        )}

      </div>
    </div>
  );
}

function App() {
  const [initialData, setInitialData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/data/dashboard-data.json')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not found');
      })
      .then((d: DashboardData) => setInitialData(d))
      .catch(() => setInitialData(mockDashboardData));
  }, []);

  if (!initialData) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          <span className="text-sm text-white/50">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return <DashboardContent initialData={initialData} />;
}

export default App;
