import { useMemo } from 'react';
import { CheckCircle2, Clock, Target } from 'lucide-react';
import type { Task, Milestone, Epic } from '../types';

interface TaskItem {
  task: Task;
  milestone: Milestone;
  epic: Epic;
}

interface TaskCompletionSummaryProps {
  tasks: TaskItem[];
  onToggle: (taskId: string) => void;
  onOpen: (taskId: string) => void;
}

function daysAgoString(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff}d ago`;
}

function isWithinDays(date: string, daysStart: number, daysEnd: number) {
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= daysStart && diff < daysEnd;
}

export default function TaskCompletionSummary({ tasks, onToggle, onOpen }: TaskCompletionSummaryProps) {
  const { thisWeek, lastWeek, allCompleted, total } = useMemo(() => {
    const completed = tasks.filter(({ task }) => task.completed);
    return {
      thisWeek: completed.filter(({ task }) => task.completedAt && isWithinDays(task.completedAt, 0, 7)),
      lastWeek: completed.filter(({ task }) => task.completedAt && isWithinDays(task.completedAt, 7, 14)),
      allCompleted: completed,
      total: tasks.length,
    };
  }, [tasks]);

  const handleToggle = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    onToggle(taskId);
  };

  const buckets = [
    {
      label: 'This Week',
      sub: 'Last 7 days',
      icon: CheckCircle2,
      color: 'bg-green-400/60',
      items: thisWeek,
      totalTasks: tasks.filter(({ task }) => task.completedAt && isWithinDays(task.completedAt, 0, 7)).length,
    },
    {
      label: 'Last Week',
      sub: '8–14 days ago',
      icon: Clock,
      color: 'bg-blue-400/60',
      items: lastWeek,
      totalTasks: tasks.filter(({ task }) => task.completedAt && isWithinDays(task.completedAt, 7, 14)).length,
    },
    {
      label: 'All Time',
      sub: 'Total progress',
      icon: Target,
      color: 'bg-purple-400/60',
      items: allCompleted,
      totalTasks: total,
    },
  ];

  return (
    <section className="mb-14">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/25" />
        <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-500 dark:text-white/40">Completion Progress</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {buckets.map((bucket) => {
          const completed = bucket.items.length;
          const pct = bucket.totalTasks > 0 ? Math.round((completed / bucket.totalTasks) * 100) : 0;
          const Icon = bucket.icon;

          return (
            <div
              key={bucket.label}
              className="bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={13} className="text-gray-300 dark:text-white/30" />
                  <h3 className="text-[11px] font-medium tracking-[0.08em] uppercase text-gray-500 dark:text-white/40">{bucket.label}</h3>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-white/20">{bucket.sub}</span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[22px] font-semibold text-gray-800 dark:text-white/80 tabular-nums">{completed}</span>
                {bucket.label !== 'All Time' ? (
                  <span className="text-[11px] text-gray-400 dark:text-white/25">done</span>
                ) : (
                  <span className="text-[11px] text-gray-400 dark:text-white/25">of {bucket.totalTasks} total</span>
                )}
                <span className="text-[11px] font-medium text-gray-400 dark:text-white/30 ml-auto tabular-nums">{pct}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full ${bucket.color} rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Mini task list */}
              <div className="space-y-0">
                {bucket.items.slice(0, 5).map(({ task, milestone, epic }) => (
                  <div
                    key={task.id}
                    onClick={() => onOpen(task.id)}
                    className="group flex items-start gap-2.5 py-2 border-b border-gray-200 dark:border-white/[0.04] last:border-0 cursor-pointer"
                  >
                    <button
                      onClick={(e) => handleToggle(e, task.id)}
                      className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border border-green-400/40 bg-green-400/10 flex items-center justify-center cursor-pointer group-hover:border-green-400/60 transition-colors"
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4.5L3 6L6.5 2" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-gray-500 dark:text-white/50 group-hover:text-gray-700 dark:group-hover:text-white/70 transition-colors truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-400 dark:text-white/20 uppercase tracking-wider truncate max-w-[80px]">{milestone.title}</span>
                        <span className="text-gray-300 dark:text-white/10">·</span>
                        <span className="text-[9px] text-gray-400 dark:text-white/20 truncate max-w-[80px]">{epic.title}</span>
                        {task.completedAt && (
                          <>
                            <span className="text-gray-300 dark:text-white/10">·</span>
                            <span className="text-[9px] text-gray-400 dark:text-white/15">{daysAgoString(task.completedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {bucket.items.length === 0 && (
                  <p className="text-[12px] text-gray-400 dark:text-white/15 py-3 text-center">No tasks completed yet.</p>
                )}
                {bucket.items.length > 5 && (
                  <p className="text-[10px] text-gray-400 dark:text-white/15 pt-1 text-center">+{bucket.items.length - 5} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
