import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { KnowledgeDoc } from '../types';

interface Props {
  doc: KnowledgeDoc;
  milestoneTitles?: Record<string, string>;
  epicTitles?: Record<string, string>;
  completedTaskIds?: Set<string>;
  onClose: () => void;
}

export default function KnowledgeDocDetail({ doc, milestoneTitles, epicTitles, completedTaskIds, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Simple markdown-to-HTML converter for display
  const renderMarkdown = (md: string) => {
    let html = md
      .replace(/^### (.*$)/gim, '<h3 class="text-[15px] font-semibold text-white/90 mt-5 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-[17px] font-semibold text-white/90 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-[19px] font-bold text-white mt-4 mb-3">$1</h1>')
      .replace(/^\* (.*$)/gim, '<li class="text-[13px] text-white/70 ml-4 mb-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="text-[13px] text-white/70 ml-4 mb-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/90">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-white/70">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="text-[12px] bg-white/[0.08] text-white/80 px-1 py-0.5 rounded">$1</code>');

    // Wrap consecutive li elements in ul
    html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul class="mb-3">$&</ul>');
    // Add paragraph wrapper for plain text lines
    html = html.replace(/^(?!<[hlu])(.+)$/gim, '<p class="text-[13px] text-white/70 leading-relaxed mb-2">$1</p>');
    return html;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={ref}
        className="relative w-full max-w-2xl max-h-[85vh] bg-[#0f0f11] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.08]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-white/90 leading-snug">{doc.title}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50 border border-white/[0.08] uppercase tracking-wide">
                  {doc.source}
                </span>
                {doc.author && (
                  <span className="text-[11px] text-white/40">by {doc.author}</span>
                )}
                <span className="text-[11px] text-white/30">{doc.createdAt}</span>
                {doc.updatedAt !== doc.createdAt && (
                  <span className="text-[11px] text-white/30">updated {doc.updatedAt}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.12] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Links — hide completed task references */}
          {(() => {
            const visibleTaskIds = doc.linkedTaskIds.filter(tkId => !completedTaskIds?.has(tkId));
            const hasLinks = doc.linkedMilestoneIds.length > 0 || doc.linkedEpicIds.length > 0 || visibleTaskIds.length > 0 || doc.sourceUrl;
            if (!hasLinks) return null;
            return (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {doc.sourceUrl && (
                  <a
                    href={doc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400/70 hover:text-blue-300 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={10} />
                    Source
                  </a>
                )}
                {doc.linkedMilestoneIds.map(msId => (
                  <span key={msId} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 border border-white/[0.06]">
                    {milestoneTitles?.[msId] || msId}
                  </span>
                ))}
                {doc.linkedEpicIds.map(epId => (
                  <span key={epId} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 border border-white/[0.06]">
                    {epicTitles?.[epId] || epId}
                  </span>
                ))}
                {visibleTaskIds.map(tkId => (
                  <span key={tkId} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 border border-white/[0.06]">
                    {tkId}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content) }}
          />

          {doc.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {doc.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.06]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
