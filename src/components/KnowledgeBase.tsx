import { useState, useMemo, useEffect } from 'react';
import { Search, BookOpen, Tag, ArrowLeft } from 'lucide-react';
import type { KnowledgeDoc, Milestone } from '../types';
import KnowledgeDocCard from './KnowledgeDocCard';
import KnowledgeDocDetail from './KnowledgeDocDetail';

interface Props {
  docs: KnowledgeDoc[];
  milestones: Milestone[];
  onBack: () => void;
}
export default function KnowledgeBase({ docs, milestones, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const milestoneTitles = useMemo(() => {
    const map: Record<string, string> = {};
    milestones.forEach(m => { map[m.id] = m.title; });
    return map;
  }, [milestones]);

  const epicTitles = useMemo(() => {
    const map: Record<string, string> = {};
    milestones.forEach(m => { m.epics.forEach(ep => { map[ep.id] = ep.title; }); });
    return map;
  }, [milestones]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    docs.forEach(d => d.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [docs]);

  const allSources = useMemo(() => {
    const set = new Set<string>();
    docs.forEach(d => set.add(d.source));
    return Array.from(set).sort();
  }, [docs]);

  const filtered = useMemo(() => {
    let result = [...docs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (activeTag) result = result.filter(d => d.tags.includes(activeTag));
    if (activeSource) result = result.filter(d => d.source === activeSource);
    if (activeMilestone) result = result.filter(d => d.linkedMilestoneIds.includes(activeMilestone));
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [docs, search, activeTag, activeSource, activeMilestone]);

  const selectedDoc = selectedDocId ? docs.find(d => d.id === selectedDocId) : null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        document.getElementById('kb-search')?.focus();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors mb-4">
            <ArrowLeft size={13} />
            Back to dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={20} className="text-white/50" />
            <h1 className="text-[22px] font-semibold text-white/90 tracking-tight">Knowledge Base</h1>
            <span className="text-[12px] text-white/30 tabular-nums bg-white/[0.04] px-2 py-0.5 rounded-md">
              {docs.length} doc{docs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[13px] text-white/40 max-w-xl">
            Strategy docs, meeting notes, research, and decisions. Linked to milestones and epics so context stays next to the work.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              id="kb-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents… (press / to focus)"
              className="w-full bg-[#0f0f11] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={activeMilestone || ''}
              onChange={e => setActiveMilestone(e.target.value || null)}
              className="bg-[#0f0f11] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-white/60 focus:outline-none focus:border-white/20"
            >
              <option value="">All Pillars</option>
              {milestones.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>

            {allSources.map(src => (
              <button
                key={src}
                onClick={() => setActiveSource(activeSource === src ? null : src)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors uppercase tracking-wide font-semibold ${activeSource === src ? 'bg-white/15 text-white/80 border-white/25' : 'bg-white/[0.04] text-white/40 border-white/[0.06] hover:border-white/15'}`}
              >
                {src}
              </button>
            ))}

            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-colors ${activeTag === tag ? 'bg-white/15 text-white/80 border-white/25' : 'bg-white/[0.04] text-white/40 border-white/[0.06] hover:border-white/15'}`}
              >
                <Tag size={9} />
                {tag}
              </button>
            ))}

            {(activeTag || activeSource || activeMilestone) && (
              <button
                onClick={() => { setActiveTag(null); setActiveSource(null); setActiveMilestone(null); }}
                className="text-[10px] text-white/30 hover:text-white/60 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(doc => (
              <KnowledgeDocCard key={doc.id} doc={doc} milestoneTitles={milestoneTitles} onClick={() => setSelectedDocId(doc.id)} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <BookOpen size={32} className="mx-auto text-white/10 mb-3" />
            <p className="text-[13px] text-white/30">No documents match your filters.</p>
            <button
              onClick={() => { setSearch(''); setActiveTag(null); setActiveSource(null); setActiveMilestone(null); }}
              className="text-[12px] text-white/40 hover:text-white/70 mt-2 underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {selectedDoc && (
          <KnowledgeDocDetail doc={selectedDoc} milestoneTitles={milestoneTitles} epicTitles={epicTitles} onClose={() => setSelectedDocId(null)} />
        )}

      </div>
    </div>
  );
}

