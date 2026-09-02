import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Milestone, Epic, KnowledgeDoc } from '../types';
import MilestoneSection from './MilestoneSection';
import MilestoneKnowledgePanel from './MilestoneKnowledgePanel';
import TaskItem from './TaskItem';

interface MilestonePageProps {
  milestone: Milestone;
  allMilestones: Milestone[];
  computeEpicProgress: (epic: Epic) => { total: number; completed: number; percentage: number };
  computeMilestoneProgress: (milestone: Milestone) => { total: number; completed: number; percentage: number };
  onToggleTask: (taskId: string) => void;
  onOpenTask?: (taskId: string) => void;
  knowledgeDocs?: KnowledgeDoc[];
  onOpenKnowledgeDoc?: (docId: string) => void;
}

const MilestonePage: React.FC<MilestonePageProps> = ({
  milestone,
  allMilestones,
  computeEpicProgress,
  computeMilestoneProgress,
  onToggleTask,
  onOpenTask,
  knowledgeDocs = [],
  onOpenKnowledgeDoc,
}) => {
  const navItemClass = (isActive: boolean) =>
    `flex-1 text-center py-3.5 text-[13px] font-medium transition-colors whitespace-nowrap px-4 cursor-pointer ${
      isActive
        ? 'text-white/80 border-b-2 border-white/30'
        : 'text-white/30 hover:text-white/55'
    }`;

  return (
    <div className="min-h-screen bg-[#08080a]">
      {/* Full-width pillar nav */}
      <div className="w-full border-b border-white/[0.08] bg-[#0a0a0c] overflow-x-auto">
        <div className="flex min-w-full">
          <a href="/" className={navItemClass(false)}>
            Dashboard
          </a>
          {allMilestones.map(ms => {
            const isActive = ms.id === milestone.id;
            const name = ms.title.replace(/^M\d+\s+/, '');
            return (
              <a key={ms.id} href={`?milestone=${ms.id}`} className={navItemClass(isActive)}>
                {name}
              </a>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-8 w-full">
        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <MilestoneSection
              milestone={milestone}
              progress={computeMilestoneProgress(milestone)}
              computeEpicProgress={computeEpicProgress}
              onToggleTask={onToggleTask}
              onOpenTask={onOpenTask}
              isExpanded={true}
              onToggleExpand={() => {}}
              showCompleted={false}
            />

            {/* Completed section */}
            {(() => {
              const completedGroups = milestone.epics
                .map(epic => ({ epic, tasks: epic.tasks.filter(t => t.completed) }))
                .filter(g => g.tasks.length > 0);
              const totalCompleted = completedGroups.reduce((sum, g) => sum + g.tasks.length, 0);
              if (totalCompleted === 0) return null;
              return (
                <section className="mt-10">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 size={13} className="text-green-400/60" />
                    <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40">Completed</h2>
                    <span className="text-[10px] text-white/25 tabular-nums ml-1">{totalCompleted}</span>
                  </div>
                  <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
                    <div className="divide-y divide-white/[0.04]">
                      {completedGroups.map(({ epic, tasks }) =>
                        tasks.map(task => (
                          <div key={task.id} className="flex items-start gap-3 py-3">
                            <div className="flex-1 min-w-0">
                              <TaskItem
                                task={task}
                                onToggle={onToggleTask}
                                onOpen={onOpenTask ? () => onOpenTask(task.id) : undefined}
                              />
                            </div>
                            <span className="text-[10px] text-white/20 mt-1 flex-shrink-0">{epic.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              );
            })()}
          </div>

          {/* Sidebar — knowledge docs */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-6">
              {onOpenKnowledgeDoc && (
                <MilestoneKnowledgePanel
                  docs={knowledgeDocs}
                  milestoneId={milestone.id}
                  epicIds={milestone.epics.map(ep => ep.id)}
                  onOpenDoc={onOpenKnowledgeDoc}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MilestonePage;
