import type { KnowledgeDoc } from '../types';

interface Props {
  doc: KnowledgeDoc;
  onClick: () => void;
  milestoneTitles?: Record<string, string>;
}

const sourceColors: Record<string, string> = {
  claude: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/20',
  fireflies: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20',
  manual: 'bg-black/[0.06] text-gray-600 border-gray-300 dark:bg-white/10 dark:text-white/60 dark:border-white/10',
  hubspot: 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/20',
  linkedin: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20',
  'google-ads': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20',
  contentsquare: 'bg-pink-500/10 text-pink-700 border-pink-500/20 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/20',
  other: 'bg-black/[0.06] text-gray-600 border-gray-300 dark:bg-white/10 dark:text-white/60 dark:border-white/10',
};

export default function KnowledgeDocCard({ doc, onClick, milestoneTitles }: Props) {
  const sourceClass = sourceColors[doc.source] || sourceColors.other;
  const preview = doc.content.slice(0, 140).replace(/[#*`]/g, '');

  return (
    <button
      onClick={onClick}
      className="w-full text-left group bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/[0.08] rounded-xl p-4 
                 hover:border-gray-400 dark:hover:border-white/20 hover:bg-black/[0.03] dark:bg-white/[0.03] transition-all duration-200
                 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[13px] font-medium text-gray-900 dark:text-white/90 leading-tight group-hover:text-white transition-colors">
          {doc.title}
        </h3>
        <span className={`shrink-0 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border ${sourceClass}`}>
          {doc.source}
        </span>
      </div>

      <p className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed mb-3 line-clamp-2">
        {preview}{doc.content.length > 140 ? '…' : ''}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {doc.linkedMilestoneIds.map(msId => (
            <span
              key={msId}
              className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.06] text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/[0.06]"
            >
              {milestoneTitles?.[msId] || msId}
            </span>
          ))}
          {doc.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.04] text-gray-400 dark:text-white/30"
            >
              {tag}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-[10px] text-gray-300 dark:text-white/20">+{doc.tags.length - 3}</span>
          )}
        </div>
        <span className="text-[10px] text-gray-300 dark:text-white/20 tabular-nums">{doc.createdAt}</span>
      </div>
    </button>
  );
}
