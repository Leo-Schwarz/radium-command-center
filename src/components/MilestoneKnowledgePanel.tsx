import { BookOpen, FileText } from 'lucide-react';
import type { KnowledgeDoc } from '../types';

interface Props {
  docs: KnowledgeDoc[];
  milestoneId: string;
  epicIds?: string[];
  onOpenDoc: (docId: string) => void;
}

function tagColour(tag: string): string {
  if (['strategy', 'positioning', 'messaging', 'playbook', 'framework'].includes(tag))
    return 'bg-indigo-500/15 text-indigo-300/60';
  if (['conversion', 'signup', 'funnel', 'retention', 'expansion'].includes(tag))
    return 'bg-emerald-500/15 text-emerald-300/60';
  if (['paid-ads', 'google-ads', 'linkedin', 'seo', 'content', 'owned-demand'].includes(tag))
    return 'bg-amber-500/15 text-amber-300/60';
  if (['analytics', 'measurement', 'tracking', 'setup'].includes(tag))
    return 'bg-sky-500/15 text-sky-300/60';
  return 'bg-white/[0.06] text-white/25';
}

export default function MilestoneKnowledgePanel({ docs, milestoneId, epicIds, onOpenDoc }: Props) {
  const linked = docs.filter(d =>
    d.linkedMilestoneIds.includes(milestoneId) ||
    (epicIds && d.linkedEpicIds.some(epId => epicIds.includes(epId)))
  );

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-white/50" />
          <h3 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-white/60">
            Documents
          </h3>
        </div>
        <span className="text-[10px] text-white/30 tabular-nums bg-white/[0.04] px-2 py-0.5 rounded-full">
          {linked.length}
        </span>
      </div>

      <div className="px-1 pb-1">
        {linked.length === 0 ? (
          <div className="text-center py-8 px-2">
            <FileText size={22} className="text-white/10 mx-auto mb-2.5" />
            <p className="text-[11px] text-white/25 leading-relaxed">
              No documents linked to this pillar yet.
            </p>
            <p className="text-[10px] text-white/15 mt-1">
              Add docs in the Knowledge Base and link them here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {linked.map(doc => (
              <button
                key={doc.id}
                onClick={() => onOpenDoc(doc.id)}
                className="w-full text-left flex items-start gap-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] rounded-lg px-3 py-2.5 transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-white/[0.08] transition-colors">
                  <BookOpen size={12} className="text-white/30 group-hover:text-white/50 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-white/65 group-hover:text-white/90 leading-snug transition-colors line-clamp-2">
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    {doc.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${tagColour(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
