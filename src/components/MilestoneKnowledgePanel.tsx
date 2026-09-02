import { BookOpen } from 'lucide-react';
import type { KnowledgeDoc } from '../types';

interface Props {
  docs: KnowledgeDoc[];
  milestoneId: string;
  epicIds?: string[];
  onOpenDoc: (docId: string) => void;
}

export default function MilestoneKnowledgePanel({ docs, milestoneId, epicIds, onOpenDoc }: Props) {
  const linked = docs.filter(d =>
    d.linkedMilestoneIds.includes(milestoneId) ||
    (epicIds && d.linkedEpicIds.some(epId => epicIds.includes(epId)))
  );

  if (linked.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={13} className="text-white/40" />
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50">
          Linked Knowledge ({linked.length})
        </h3>
      </div>
      <div className="space-y-2">
        {linked.map(doc => (
          <button
            key={doc.id}
            onClick={() => onOpenDoc(doc.id)}
            className="w-full text-left flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3.5 py-2.5
                       hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group"
          >
            <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0">
              <BookOpen size={11} className="text-white/30 group-hover:text-white/50 transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-white/70 group-hover:text-white/90 truncate transition-colors">
                {doc.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] uppercase tracking-wide text-white/30 font-semibold">{doc.source}</span>
                {doc.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[9px] px-1 rounded bg-white/[0.06] text-white/25">{tag}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
