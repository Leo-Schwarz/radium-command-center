import type { KnowledgeDoc } from '../types';

interface Props {
  doc: KnowledgeDoc;
  onClick: () => void;
  milestoneTitles?: Record<string, string>;
}

const sourceColors: Record<string, string> = {
  claude: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  fireflies: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  manual: 'bg-white/10 text-white/60 border-white/10',
  hubspot: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  linkedin: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  'google-ads': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  contentsquare: 'bg-pink-500/15 text-pink-300 border-pink-500/20',
  other: 'bg-white/10 text-white/60 border-white/10',
};

export default function KnowledgeDocCard({ doc, onClick, milestoneTitles }: Props) {
  const sourceClass = sourceColors[doc.source] || sourceColors.other;
  const preview = doc.content.slice(0, 140).replace(/[#*`]/g, '');

  return (
    <button
      onClick={onClick}
      className="w-full text-left group bg-[#0f0f11] border border-white/[0.08] rounded-xl p-4 
                 hover:border-white/20 hover:bg-white/[0.03] transition-all duration-200
                 focus:outline-none focus:ring-1 focus:ring-white/20"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[13px] font-medium text-white/90 leading-tight group-hover:text-white transition-colors">
          {doc.title}
        </h3>
        <span className={`shrink-0 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border ${sourceClass}`}>
          {doc.source}
        </span>
      </div>

      <p className="text-[12px] text-white/40 leading-relaxed mb-3 line-clamp-2">
        {preview}{doc.content.length > 140 ? '…' : ''}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {doc.linkedMilestoneIds.map(msId => (
            <span
              key={msId}
              className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 border border-white/[0.06]"
            >
              {milestoneTitles?.[msId] || msId}
            </span>
          ))}
          {doc.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30"
            >
              {tag}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-[10px] text-white/20">+{doc.tags.length - 3}</span>
          )}
        </div>
        <span className="text-[10px] text-white/20 tabular-nums">{doc.createdAt}</span>
      </div>
    </button>
  );
}
