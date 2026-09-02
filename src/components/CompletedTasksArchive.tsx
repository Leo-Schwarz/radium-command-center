import React from 'react';
import type { Task, Milestone, Epic } from '../types';

interface CompletedTasksArchiveProps {
  tasks: Array<{ task: Task; milestone: Milestone; epic: Epic }>;
  onToggle: (taskId: string) => void;
}

const CompletedTasksArchive: React.FC<CompletedTasksArchiveProps> = ({ tasks, onToggle }) => {
  if (tasks.length === 0) {
    return (
      <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl py-16 text-center">
        <p className="text-[15px] text-white/30">No completed tasks yet.</p>
        <p className="text-[11px] text-white/15 mt-1">Finished tasks will appear here.</p>
      </div>
    );
  }

  // Group by milestone, then epic
  const byMilestone = tasks.reduce((acc, item) => {
    const msKey = item.milestone.id;
    if (!acc[msKey]) {
      acc[msKey] = { milestone: item.milestone, byEpic: {} };
    }
    const epicKey = item.epic.id;
    if (!acc[msKey].byEpic[epicKey]) {
      acc[msKey].byEpic[epicKey] = { epic: item.epic, tasks: [] };
    }
    acc[msKey].byEpic[epicKey].tasks.push(item);
    return acc;
  }, {} as Record<string, { milestone: Milestone; byEpic: Record<string, { epic: Epic; tasks: typeof tasks }> }>);

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40">
          Completed Tasks Archive
        </h2>
        <span className="text-[11px] text-white/25 tabular-nums bg-white/[0.04] px-2 py-0.5 rounded-md">
          {tasks.length} total
        </span>
      </div>

      {Object.values(byMilestone).map(({ milestone, byEpic }) => (
        <div key={milestone.id} className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-white/70">{milestone.title}</h3>
            <span className="text-[11px] text-white/30 tabular-nums">
              {Object.values(byEpic).reduce((n, g) => n + g.tasks.length, 0)} tasks
            </span>
          </div>
          <div className="px-6 py-5 space-y-5">
            {Object.values(byEpic).map(({ epic, tasks: epicTasks }) => (
              <div key={epic.id}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-[12px] font-medium text-white/40">{epic.title}</h4>
                  <span className="text-[10px] text-white/20 tabular-nums">
                    {epicTasks.length} done
                  </span>
                </div>
                <div className="space-y-1 divide-y divide-white/[0.03]">
                  {epicTasks.map(({ task }) => (
                    <div key={task.id} className="flex items-start gap-3 py-2.5 group">
                      <button
                        onClick={() => onToggle(task.id)}
                        className="mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center transition-all rounded-[4px] bg-white hover:scale-110 cursor-pointer"
                        title="Mark as not done"
                      >
                        <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4.5l1.5 1.5 3-3.5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] leading-snug text-white/40 line-through">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.completedAt && (
                            <span className="text-[10px] text-white/20">
                              {new Date(task.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          {task.assignee !== 'Unassigned' && (
                            <>
                              <span className="text-white/[0.06]">·</span>
                              <span className="text-[10px] text-white/20">{task.assignee}</span>
                            </>
                          )}
                          <span className="text-white/[0.06]">·</span>
                          <span className="text-[10px] text-white/20">{task.channel || 'Task'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default CompletedTasksArchive;
