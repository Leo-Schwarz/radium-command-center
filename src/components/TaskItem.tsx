import React from 'react';
import type { Task } from '../types';

const tagColors: Record<string, { bg: string; text: string; border: string }> = {
  urgent: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  blocked: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  week: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onOpen?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onOpen }) => {
  return (
    <div onClick={onOpen} className={`flex items-start gap-3 py-3 transition-colors hover:bg-white/[0.02] rounded-lg -mx-1 px-1 ${onOpen ? 'cursor-pointer' : ''} ${task.completed ? 'opacity-40' : 'opacity-100'}`}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={`
          mt-1 flex-shrink-0 w-4 h-4 flex items-center justify-center transition-all rounded-[4px]
          ${task.completed ? 'bg-white' : 'border-2 border-white/25 hover:border-white/50'}
        `}
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
          <span className="text-[11px] text-white/40 font-medium">{task.assignee}</span>
          {task.dueDate && (
            <>
              <span className="text-white/10">·</span>
              <span className="text-[11px] text-white/30">
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </>
          )}
          {task.channel && (
            <>
              <span className="text-white/10">·</span>
              <span className="text-[11px] text-white/30">{task.channel}</span>
            </>
          )}
          {task.priority === 'high' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/15 font-medium">
              High
            </span>
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

export default TaskItem;
