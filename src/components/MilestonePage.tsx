import React from 'react';
import type { Milestone, Epic, KnowledgeDoc } from '../types';
import MilestoneSection from './MilestoneSection';
import MilestoneKnowledgePanel from './MilestoneKnowledgePanel';

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

      <div className="max-w-[1400px] mx-auto px-6 py-8 w-full">
        <MilestoneSection
          milestone={milestone}
          progress={computeMilestoneProgress(milestone)}
          computeEpicProgress={computeEpicProgress}
          onToggleTask={onToggleTask}
          onOpenTask={onOpenTask}
          isExpanded={true}
          onToggleExpand={() => {}}
          showCompleted={true}
        />
        {onOpenKnowledgeDoc && (
          <MilestoneKnowledgePanel
            docs={knowledgeDocs}
            milestoneId={milestone.id}
            epicIds={milestone.epics.map(ep => ep.id)}
            onOpenDoc={onOpenKnowledgeDoc}
          />
        )}
      </div>
    </div>
  );
};

export default MilestonePage;
