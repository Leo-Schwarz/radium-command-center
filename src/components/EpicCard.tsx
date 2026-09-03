import React from 'react';
import { ChevronDown, ChevronUp, User, CircleDot } from 'lucide-react';
import type { Epic, ProgressSnapshot } from '../types';
import TaskItem from './TaskItem';

interface EpicCardProps {
  epic: Epic;
  progress: ProgressSnapshot;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleTask: (taskId: string) => void;
  onOpenTask?: (taskId: string) => void;
  showCompleted?: boolean;
}

const statusConfig: Record<string, { label: string; cls: string; bg: string; border: string }> = {
  not_started: { label: 'Not Started', cls: 'text-gray-400 dark:text-white/35', bg: 'bg-black/[0.03] dark:bg-white/[0.03]', border: 'border-gray-200 dark:border-white/[0.06]' },
  in_progress: { label: 'In Progress', cls: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  completed: { label: 'Completed', cls: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
};

const EpicCard: React.FC<EpicCardProps> = ({
  epic,
  progress,
  isExpanded,
  onToggleExpand,
  onToggleTask,
  onOpenTask,
  showCompleted = true,
}) => {
  const status = statusConfig[epic.status];
  const visibleTasks = showCompleted ? epic.tasks : epic.tasks.filter(t => !t.completed);
  const pct = Math.round(progress.percentage);
  const hasOnlyOneTask = epic.tasks.length === 1;

  // Determine progress bar color
  const progressColor = pct === 100 ? '#34c759' : pct > 50 ? '#3b82f6' : pct > 0 ? '#ffcc00' : 'rgba(128,128,128,0.18)';

  return (
    <div className="bg-gray-50 dark:bg-[#131315] border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
      <div
        onClick={onToggleExpand}
        className="p-5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Progress ring-like number — hidden for single-task epics */}
          {!hasOnlyOneTask && (
            <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] flex flex-col items-center justify-center">
              <div className="text-[17px] font-semibold text-gray-900 dark:text-white tabular-nums leading-none">
                {pct}
              </div>
              <span className="text-gray-400 dark:text-white/25 text-[9px] mt-0.5">%</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <h4 className="text-[14px] font-medium text-gray-800 dark:text-white/85 truncate">{epic.title}</h4>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.cls} ${status.bg} ${status.border}`}>
                {status.label}
              </span>
            </div>
            <p className="text-[12px] text-gray-400 dark:text-white/30 line-clamp-1 leading-relaxed">{epic.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-white/30">
                <User size={11} className="text-gray-300 dark:text-white/20" />
                <span>{epic.owner}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-white/30">
                <CircleDot size={11} className="text-gray-300 dark:text-white/20" />
                <span>{progress.completed}/{progress.total} {progress.total === 1 ? 'task' : 'tasks'}</span>
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center text-gray-400 dark:text-white/30 flex-shrink-0">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {/* Progress bar — hidden for single-task epics */}
        {!hasOnlyOneTask && (
          <div className="mt-4 h-[3px] bg-gray-200 dark:bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%`, backgroundColor: progressColor }}
            />
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-200 dark:border-white/[0.05]">
          {visibleTasks.length === 0 && (
            <p className="text-[12px] text-gray-400 dark:text-white/20 py-4 text-center">No open tasks.</p>
          )}
          <div className="divide-y divide-gray-200 dark:divide-white/[0.04]">
            {visibleTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={onToggleTask} onOpen={onOpenTask ? () => onOpenTask(task.id) : undefined} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EpicCard;