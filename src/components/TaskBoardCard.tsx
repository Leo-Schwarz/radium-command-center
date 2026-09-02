import React from 'react';
import type { Task } from '../types';

const tagColors: Record<string, { bg: string; text: string; border: string }> = {
  urgent: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  blocked: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  week: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

interface TaskBoardCardProps {
  task: Task;
  milestoneTitle: string;
  epicTitle: string;
  onToggle?: (taskId: string) => void;
  onOpen?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

const TaskBoardCard: React.FC<TaskBoardCardProps> = ({ task, milestoneTitle, epicTitle, onToggle, onOpen, draggable, onDragStart, className }) => {
  return (
    <div
      onClick={onOpen}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`flex items-start gap-3 py-3.5 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02] transition-colors rounded-lg -mx-2 px-2 group cursor-pointer ${className || ''}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(task.id); }}
        className={`
          mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center transition-all rounded-[4px]
          ${task.completed ? 'bg-white' : onToggle ? 'border-2 border-white/25 hover:border-white/50' : 'border-2 border-white/10'}
        `}
        disabled={!onToggle}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && (
          <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4.5l1.5 1.5 3-3.5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${task.completed ? 'line-through text-white/25' : 'text-white/80'}`}>
          {task.title}
        </p>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
          <span className="text-[11px] text-white/40 font-medium">{milestoneTitle.replace(/^M\d+\s+/, '')}</span>
          <span className="text-white/10">·</span>
          <span className="text-[11px] text-white/30 truncate max-w-[160px]">{epicTitle}</span>
          {task.assignee && (
            <>
              <span className="text-white/10">·</span>
              <span className="text-[11px] text-white/30">{task.assignee}</span>
            </>
          )}
          {task.channel && (
            <>
              <span className="text-white/10">·</span>
              <span className="text-[11px] text-white/25">{task.channel}</span>
            </>
          )}
          {task.tags.map(tag => {
            const colors = tagColors[tag];
            if (!colors) return null;
            return (
              <span
                key={tag}
                className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TaskBoardCard;
