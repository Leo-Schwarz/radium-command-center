import React from 'react';
import { X, Calendar, User, Tag, ArrowUpCircle, Layers } from 'lucide-react';
import type { Task } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  milestoneTitle: string;
  epicTitle: string;
  onClose: () => void;
  onToggle: (taskId: string) => void;
}

const tagColors: Record<string,{bg:string;text:string;border:string}> = {
  urgent: { bg:'bg-red-500/10', text:'text-red-400', border:'border-red-500/20' },
  blocked:{ bg:'bg-amber-500/10',text:'text-amber-400',border:'border-amber-500/20'},
  week:   { bg:'bg-purple-500/10',text:'text-purple-400',border:'border-purple-500/20'},
  hubspot:{ bg:'bg-amber-500/10',text:'text-amber-400',border:'border-amber-500/20'},
  linkedin:{bg:'bg-sky-500/10',  text:'text-sky-400',   border:'border-sky-500/20'},
};

const priorityConfig = {
  low:    { label:'Low',    cls:'text-white/40 bg-white/[0.04]' },
  medium: { label:'Medium', cls:'text-blue-400 bg-blue-500/10' },
  high:   { label:'High',   cls:'text-red-400 bg-red-500/10' },
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, milestoneTitle, epicTitle, onClose, onToggle }) => {
  if (!task) return null;
  const priority = priorityConfig[task.priority];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         onClick={(e)=>{ if (e.target===e.currentTarget) onClose(); }}>
      <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-start gap-4">
            <button onClick={()=>onToggle(task.id)} className={`mt-1 flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all rounded-[5px] ${task.completed?'bg-white':'border-2 border-white/25 hover:border-white/50'}`}>
              {task.completed && <svg width="11" height="11" viewBox="0 0 8 8" fill="none"><path d="M1.5 4.5l1.5 1.5 3-3.5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <div>
              <h2 className={`text-[16px] font-medium leading-snug ${task.completed?'line-through text-white/30':'text-white/90'}`}>{task.title}</h2>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2">
                <span className="text-[11px] text-white/40 font-medium">{milestoneTitle.replace(/^M\d+\s+/,'')}</span>
                <span className="text-white/10">·</span>
                <span className="text-[11px] text-white/30">{epicTitle}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors flex-shrink-0"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30 mb-2">Description</h3>
            <p className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {task.assignee && <div className="flex items-center gap-2"><User size={13} className="text-white/20"/><span className="text-[12px] text-white/50">{task.assignee}</span></div>}
            {task.dueDate && <div className="flex items-center gap-2"><Calendar size={13} className="text-white/20"/><span className="text-[12px] text-white/50">{new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span></div>}
            {task.channel && <div className="flex items-center gap-2"><Tag size={13} className="text-white/20"/><span className="text-[12px] text-white/50">{task.channel}</span></div>}
            <div className="flex items-center gap-2"><ArrowUpCircle size={13} className="text-white/20"/><span className={`text-[12px] font-medium px-2 py-0.5 rounded-md border ${priority.cls} border-white/[0.06]`}>{priority.label}</span></div>
          </div>
          {task.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {task.tags.map(tag=>{const c=tagColors[tag];if(!c)return null;return <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${c.bg} ${c.text} ${c.border}`}>{tag.charAt(0).toUpperCase()+tag.slice(1)}</span>;})}
            </div>
          )}
          {task.subtasks && task.subtasks.length>0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Layers size={12} className="text-white/30"/><h3 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">Subtasks ({task.subtasks.filter(s=>s.completed).length}/{task.subtasks.length})</h3></div>
              <div className="divide-y divide-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden">
                {task.subtasks.map(sub=> (
                  <div key={sub.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${sub.completed?'opacity-40':''}`}>
                    <button onClick={()=>onToggle(sub.id)} className={`flex-shrink-0 w-4 h-4 flex items-center justify-center transition-all rounded-[4px] ${sub.completed?'bg-white':'border-2 border-white/25 hover:border-white/50'}`}>
                      {sub.completed && <svg width="9" height="9" viewBox="0 0 8 8" fill="none"><path d="M1.5 4.5l1.5 1.5 3-3.5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span className={`text-[13px] ${sub.completed?'line-through text-white/25':'text-white/70'}`}>{sub.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;

