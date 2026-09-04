import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, ArrowUpCircle, Layers, Pencil, Check, XCircle } from 'lucide-react';
import type { Task } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  milestoneTitle: string;
  epicTitle: string;
  onClose: () => void;
  onToggle: (taskId: string) => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const tagColors: Record<string,{bg:string;text:string;border:string}> = {
  urgent: { bg:'bg-red-500/10', text:'text-red-400', border:'border-red-500/20' },
  blocked:{ bg:'bg-amber-500/10',text:'text-amber-400',border:'border-amber-500/20'},
  week:   { bg:'bg-purple-500/10',text:'text-purple-400',border:'border-purple-500/20'},
  hubspot:{ bg:'bg-amber-500/10',text:'text-amber-400',border:'border-amber-500/20'},
  linkedin:{bg:'bg-sky-500/10',  text:'text-sky-400',   border:'border-sky-500/20'},
};

const priorityConfig = {
  low:    { label:'Low',    cls:'text-gray-500 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.04]' },
  medium: { label:'Medium', cls:'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  high:   { label:'High',   cls:'text-red-600 dark:text-red-400 bg-red-500/10' },
};

const inputCls = "w-full bg-black/[0.04] dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-gray-800 dark:text-white/80 placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-gray-400 dark:focus:border-white/20 focus:bg-black/[0.06] dark:focus:bg-white/[0.06] transition-colors";
const labelCls = "text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400 dark:text-white/30 mb-2 block";

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, milestoneTitle, epicTitle, onClose, onToggle, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium');

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setEditDueDate(task.dueDate);
      setEditAssignee(task.assignee);
      setEditPriority(task.priority);
      setIsEditing(false);
    }
  }, [task?.id]);

  if (!task) return null;
  const priority = priorityConfig[task.priority];
  const editable = !!onUpdate;

  const handleSave = () => {
    if (!onUpdate) return;
    onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
      dueDate: editDueDate,
      assignee: editAssignee,
      priority: editPriority,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         onClick={(e)=>{ if (e.target===e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-white/[0.06]">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <button onClick={()=>onToggle(task.id)} className={`mt-1 flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all rounded-[5px] ${task.completed?'bg-gray-900 dark:bg-white':'border-2 border-gray-400 dark:border-white/25 hover:border-gray-500 dark:hover:border-white/50'}`}>
              {task.completed && <svg width="11" height="11" viewBox="0 0 8 8" fill="none"><path d="M1.5 4.5l1.5 1.5 3-3.5" className="stroke-white dark:stroke-[#0a0a0a]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className={`${inputCls} text-[16px] font-medium mb-2`}
                  placeholder="Task title"
                />
              ) : (
                <h2 className={`text-[16px] font-medium leading-snug ${task.completed?'line-through text-gray-400 dark:text-white/30':'text-gray-900 dark:text-white/90'}`}>
                  <span className="font-mono text-[13px] text-gray-400 dark:text-white/30 mr-2 select-none">{task.id}</span>
                  {task.title}
                </h2>
              )}
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2">
                <span className="text-[11px] text-gray-500 dark:text-white/40 font-medium">{milestoneTitle.replace(/^M\d+\s+/,'')}</span>
                <span className="text-gray-300 dark:text-white/10">·</span>
                <span className="text-[11px] text-gray-400 dark:text-white/30">{epicTitle}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {editable && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors" title="Edit">
                <Pencil size={13} />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"><X size={14}/></button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className={labelCls}>Description</h3>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className={`${inputCls} min-h-[100px] resize-y`}
                placeholder="Task description"
              />
            ) : (
              <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <div>
                  <h3 className={labelCls}>Assignee</h3>
                  <input value={editAssignee} onChange={e => setEditAssignee(e.target.value)} className={inputCls} placeholder="Assignee" />
                </div>
                <div>
                  <h3 className={labelCls}>Due Date</h3>
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <h3 className={labelCls}>Priority</h3>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value as Task['priority'])} className={`${inputCls} appearance-none`}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/40">
                    <Tag size={13} className="text-gray-300 dark:text-white/20"/>{task.channel || '—'}</div>
                </div>
              </>
            ) : (
              <>
                {task.assignee && <div className="flex items-center gap-2"><User size={13} className="text-gray-300 dark:text-white/20"/><span className="text-[12px] text-gray-500 dark:text-white/50">{task.assignee}</span></div>}
                {task.dueDate && <div className="flex items-center gap-2"><Calendar size={13} className="text-gray-300 dark:text-white/20"/><span className="text-[12px] text-gray-500 dark:text-white/50">{new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span></div>}
                {task.channel && <div className="flex items-center gap-2"><Tag size={13} className="text-gray-300 dark:text-white/20"/><span className="text-[12px] text-gray-500 dark:text-white/50">{task.channel}</span></div>}
                <div className="flex items-center gap-2"><ArrowUpCircle size={13} className="text-gray-300 dark:text-white/20"/><span className={`text-[12px] font-medium px-2 py-0.5 rounded-md border ${priority.cls} border-gray-200 dark:border-white/[0.06]`}>{priority.label}</span></div>
              </>
            )}
          </div>
          {isEditing && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/[0.06]">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                <XCircle size={13} /> Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                <Check size={13} /> Save
              </button>
            </div>
          )}
          {!isEditing && task.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {task.tags.map(tag=>{const c=tagColors[tag];if(!c)return null;return <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${c.bg} ${c.text} ${c.border}`}>{tag.charAt(0).toUpperCase()+tag.slice(1)}</span>;})}
            </div>
          )}
          {task.subtasks && task.subtasks.length>0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Layers size={12} className="text-gray-300 dark:text-white/30"/><h3 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400 dark:text-white/30">Subtasks ({task.subtasks.filter(s=>s.completed).length}/{task.subtasks.length})</h3></div>
              <div className="divide-y divide-gray-200 dark:divide-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                {task.subtasks.map(sub=> (
                  <div key={sub.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${sub.completed?'opacity-40':''}`}>
                    <button onClick={()=>onToggle(sub.id)} className={`flex-shrink-0 w-4 h-4 flex items-center justify-center transition-all rounded-[4px] ${sub.completed?'bg-gray-900 dark:bg-white':'border-2 border-gray-400 dark:border-white/25 hover:border-gray-500 dark:hover:border-white/50'}`}>
                      {sub.completed && <svg width="9" height="9" viewBox="0 0 8 8" fill="none"><path d="M1.5 4.5l1.5 1.5 3-3.5" className="stroke-white dark:stroke-[#0a0a0a]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span className={`text-[13px] ${sub.completed?'line-through text-gray-400 dark:text-white/25':'text-gray-700 dark:text-white/70'}`}>{sub.title}</span>
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
