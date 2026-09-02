import React, { useState } from 'react';
import type { Milestone, ProgressSnapshot } from '../types';
import EpicCard from './EpicCard';
import TaskItem from './TaskItem';

interface MilestoneSectionProps {
  milestone: Milestone;
  progress: ProgressSnapshot;
  computeEpicProgress: (epic: Milestone['epics'][0]) => ProgressSnapshot;
  onToggleTask: (taskId: string) => void;
  onOpenTask?: (taskId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showCompleted?: boolean;
  statusColor?: string;
}

const statusDotColor: Record<string, string> = {
  ok: '#34c759',
  partial: '#ffcc00',
  unproven: '#8e8e93',
  failing: '#ff3b30',
};

const MilestoneSection: React.FC<MilestoneSectionProps> = ({
  milestone,
  progress,
  computeEpicProgress,
  onToggleTask,
  onOpenTask,
  isExpanded = true,
  onToggleExpand,
  showCompleted = true,
}) => {
  const [expandedEpicId, setExpandedEpicId] = useState<string | null>(null);

  const toggleEpic = (id: string) => {
    setExpandedEpicId(prev => (prev === id ? null : id));
  };

  const num = milestone.title.match(/^M(\d+)/)?.[1] ?? '';
  const name = milestone.title.replace(/^M\d+\s+/, '');
  const pct = Math.round(progress.percentage);
  const dotColor = statusDotColor[milestone.status] ?? '#8e8e93';

  return (
    <section className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
              <span className="text-[13px] font-semibold text-white/50 tabular-nums">{num.padStart(2, '0')}</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[18px] font-medium tracking-tight text-white/90">{name}</h3>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}40` }}
                />
              </div>
              <p className="text-[12px] text-white/30 mt-0.5">
                {progress.completed} of {progress.total} tasks · {milestone.epics.length} epics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[22px] font-light tabular-nums text-white/80 leading-none">
                {pct}<span className="text-white/30 text-[13px] ml-0.5">%</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`text-white/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Progress bar in header */}
        <div className="mx-6 mb-5 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percentage}%`,
              backgroundColor: pct === 100 ? '#34c759' : pct > 50 ? '#3b82f6' : '#ffcc00',
            }}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <p className="text-[13px] text-white/40 leading-relaxed mb-6 max-w-2xl">
            {milestone.description}
          </p>

          <div className="space-y-3">
            {milestone.epics
              .filter(epic => showCompleted || epic.tasks.some(t => !t.completed))
              .map(epic => {
                const visibleTasks = showCompleted ? epic.tasks : epic.tasks.filter(t => !t.completed);
                if (visibleTasks.length === 1) {
                  return (
                    <div key={epic.id} className="bg-[#131315] border border-white/[0.06] rounded-xl overflow-hidden">
                      <div className="px-5 py-3">
                        <TaskItem
                          task={visibleTasks[0]}
                          onToggle={onToggleTask}
                          onOpen={onOpenTask ? () => onOpenTask(visibleTasks[0].id) : undefined}
                        />
                      </div>
                    </div>
                  );
                }
                return (
                  <EpicCard
                    key={epic.id}
                    epic={epic}
                    progress={computeEpicProgress(epic)}
                    isExpanded={expandedEpicId === epic.id}
                    onToggleExpand={() => toggleEpic(epic.id)}
                    onToggleTask={onToggleTask}
                    onOpenTask={onOpenTask}
                    showCompleted={showCompleted}
                  />
                );
              })}
          </div>
        </div>
      )}
    </section>
  );
};

export default MilestoneSection;
