import React from 'react';
import type { Milestone } from '../types';

interface PillarOverviewCardProps {
  milestone: Milestone;
  progress: { total: number; completed: number; percentage: number };
  tasks: Array<{ completed: boolean; tags: string[] }>;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  ok: '#34c759',
  partial: '#ffcc00',
  unproven: '#8e8e93',
  failing: '#ff3b30',
};

const PillarOverviewCard: React.FC<PillarOverviewCardProps> = ({
  milestone,
  progress,
  tasks,
  onClick,
}) => {
  const num = milestone.title.match(/^M(\d+)/)?.[1] ?? '';
  const name = milestone.title.replace(/^M\d+\s+/, '');
  const pct = Math.round(progress.percentage);
  const dotColor = statusColors[milestone.status] ?? '#8e8e93';
  const progressColor = pct === 100 ? '#34c759' : pct > 50 ? '#3b82f6' : pct > 0 ? '#ffcc00' : 'rgba(255,255,255,0.12)';

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-[#0f0f11] border border-white/[0.08] rounded-xl p-5 hover:bg-[#141416] hover:border-white/[0.14] transition-all duration-200 cursor-pointer group"
    >
      {/* Top row: number + status + percentage */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[11px] font-semibold text-white/40 tabular-nums">{num.padStart(2, '0')}</span>
          </div>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}40` }}
          />
        </div>
        <div className="text-right">
          <span className="text-[20px] font-light tabular-nums text-white/70 leading-none group-hover:text-white/90 transition-colors">
            {pct}<span className="text-[11px] text-white/25 ml-0.5">%</span>
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-medium text-white/75 mb-1 group-hover:text-white/90 transition-colors truncate">
        {name}
      </h3>
      <p className="text-[11px] text-white/25 mb-4 line-clamp-1">
        {progress.completed} of {progress.total} tasks
      </p>

      {/* Progress bar */}
      <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress.percentage}%`, backgroundColor: progressColor }}
        />
      </div>

      {/* Task dots */}
      <div className="flex gap-[3px] flex-wrap">
        {tasks.map((t, i) => (
          <div
            key={i}
            className={`w-[4px] h-[4px] rounded-[1px] ${
              t.completed
                ? 'bg-white/40'
                : t.tags.includes('urgent')
                ? 'bg-red-400/60'
                : t.tags.includes('blocked')
                ? 'bg-amber-400/60'
                : 'bg-white/[0.08]'
            }`}
          />
        ))}
      </div>
    </button>
  );
};

export default PillarOverviewCard;