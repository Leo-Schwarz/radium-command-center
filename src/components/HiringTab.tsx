import { useState, useMemo } from 'react';
import {
  Briefcase, Users, ChevronDown, ChevronUp, Star,
  MapPin, AlertCircle, CheckCircle2, XCircle,
  PauseCircle, Clock, Mail, ExternalLink, Search, ArrowLeft,
} from 'lucide-react';
import type { HiringRole, CandidateStatus, HiringRoleStatus } from '../types';

interface Props { data: HiringRole[]; onBack: () => void; }

const statusCfg: Record<HiringRoleStatus, { label: string; dot: string; bg: string }> = {
  open:   { label: 'Open',   dot: 'bg-emerald-400', bg: 'bg-emerald-500/8 text-emerald-300/70 border-emerald-500/15' },
  hiring: { label: 'Hiring', dot: 'bg-sky-400',    bg: 'bg-sky-500/8 text-sky-300/70 border-sky-500/15' },
  filled: { label: 'Filled', dot: 'bg-white/40',   bg: 'bg-white/5 text-white/40 border-white/10' },
  paused: { label: 'Paused', dot: 'bg-amber-400',  bg: 'bg-amber-500/8 text-amber-300/70 border-amber-500/15' },
};

const candIcon = (s: CandidateStatus) => {
  if (s === 'hired')    return <CheckCircle2 size={12} className="text-emerald-400" />;
  if (s === 'rejected') return <XCircle      size={12} className="text-red-400/70" />;
  if (s === 'on-hold')  return <PauseCircle  size={12} className="text-amber-400" />;
  if (s === 'interview')return <Users        size={12} className="text-sky-400" />;
  if (s === 'offer')    return <CheckCircle2 size={12} className="text-violet-400" />;
  if (s === 'screening')return <Clock        size={12} className="text-white/30" />;
  return <AlertCircle size={12} className="text-white/20" />;
};

const candBg = (s: CandidateStatus) => {
  if (s === 'hired')    return 'bg-emerald-500/8 text-emerald-300/70 border-emerald-500/15';
  if (s === 'rejected') return 'bg-red-500/8 text-red-300/70 border-red-500/15';
  if (s === 'on-hold')  return 'bg-amber-500/8 text-amber-300/70 border-amber-500/15';
  if (s === 'interview')return 'bg-sky-500/8 text-sky-300/70 border-sky-500/15';
  if (s === 'offer')    return 'bg-violet-500/8 text-violet-300/70 border-violet-500/15';
  if (s === 'screening')return 'bg-white/[0.04] text-white/50 border-white/[0.06]';
  return 'bg-white/[0.04] text-white/30 border-white/[0.06]';
};

const prioBg: Record<string, string> = {
  critical: 'bg-red-400/12 text-red-300/70 border-red-400/20',
  high:     'bg-orange-400/12 text-orange-300/70 border-orange-400/20',
  medium:   'bg-amber-400/12 text-amber-300/70 border-amber-400/20',
  low:      'bg-white/[0.04] text-white/40 border-white/[0.08]',
};


function ExpandedRole({ role }: { role: HiringRole }) {
  return (
    <div className="px-5 pb-5">
      <div className="ml-12 space-y-5">
        <p className="text-[12px] text-white/50 leading-relaxed">{role.description}</p>
        <div>
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30 mb-2">Requirements</h4>
          <div className="space-y-1.5">
            {role.requirements.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-white/25 mt-1.5 shrink-0" />
                <p className="text-[12px] text-white/55">{r}</p>
              </div>
            ))}
          </div>
        </div>
        {role.niceToHave.length>0 && (
          <div>
            <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30 mb-2">Nice to Have</h4>
            <div className="flex flex-wrap gap-1.5">
              {role.niceToHave.map((it, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-white/35 border border-white/[0.06]">{it}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-start gap-6 text-[11px] text-white/35 pt-2 border-t border-white/[0.04]">
          <div><span className="uppercase tracking-wide text-white/20 text-[9px]">Owner</span> <span className="text-white/50 ml-1">{role.owner}</span></div>
          {role.notes && <div><span className="uppercase tracking-wide text-white/20 text-[9px]">Notes</span> <span className="text-white/40 ml-1">{role.notes}</span></div>}
        </div>

        {role.candidates.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30 mb-2 flex items-center gap-1.5"><Users size={10}/> Candidates ({role.candidates.length})</h4>
            <div className="space-y-2">
              {role.candidates.map(c => (
                <div key={c.id} className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-semibold text-white/50">{c.name.charAt(0)}</div>
                      <div>
                        <p className="text-[13px] font-medium text-white/70">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${candBg(c.status)}`}>{candIcon(c.status)} {c.status}</span>
                          <span className="text-[10px] text-white/25">{c.source}</span>
                          {c.rating && (
                            <span className="flex items-center gap-0.5">
                              {Array.from({length:5}).map((_,i) => (
                                <Star key={i} size={9} className={i<c.rating!?'text-amber-400/60':'text-white/10'} fill={i<c.rating!?'currentColor':'none'}/>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors" title="Email">
                          <Mail size={11} className="text-white/35" />
                        </a>
                      )}
                      {c.linkedIn && (
                        <a href={c.linkedIn} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors" title="LinkedIn">
                          <ExternalLink size={11} className="text-white/35" />
                        </a>
                      )}
                    </div>
                  </div>
                  {c.stageHistory.length > 1 && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.04]">
                      <div className="flex items-center gap-1.5">
                        {c.stageHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${h.stage==='rejected'?'bg-red-400/50':h.stage==='hired'?'bg-emerald-400':h.stage==='offer'?'bg-violet-400':h.stage==='interview'?'bg-sky-400':'bg-white/20'}`}/>
                            <span className="text-[9px] text-white/25">{h.date.slice(5)}</span>
                            {i < c.stageHistory.length - 1 && <span className="w-3 h-[1px] bg-white/[0.06] mx-0.5"/>}
                          </div>
                        ))}
                      </div>
                      {c.notes && <p className="text-[11px] text-white/30 mt-2 leading-relaxed">{c.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HiringTab({ data, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [expandRole, setExpandRole] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all'|'open'|'hiring'|'with-candidates'>('all');

  const filtered = useMemo(() => {
    let r = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x => x.title.toLowerCase().includes(q) || x.department.toLowerCase().includes(q) || x.candidates.some(c => c.name.toLowerCase().includes(q)));
    }
    if (activeFilter === 'open') r = r.filter(x => x.status === 'open');
    if (activeFilter === 'hiring') r = r.filter(x => x.status === 'hiring');
    if (activeFilter === 'with-candidates') r = r.filter(x => x.candidates.length > 0);
    return r;
  }, [data, search, activeFilter]);

  const totalCandidates = data.reduce((s, r) => s + r.candidates.length, 0);
  const activeRoles = data.filter(r => r.status === 'open' || r.status === 'hiring').length;

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <div className="px-6 py-8 w-full">
        <div className="mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors mb-4">
            <ArrowLeft size={13} /> Back to dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase size={20} className="text-white/60" />
            <h1 className="text-[22px] font-semibold text-white/90">Hiring</h1>
          </div>
          <p className="text-[13px] text-white/40">{activeRoles} active role{activeRoles!==1?'s':''} · {totalCandidates} candidate{totalCandidates!==1?'s':''} in pipeline</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 flex-1 max-w-lg">
            <Search size={14} className="text-white/20 flex-shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles or candidates" className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/25 outline-none" />
          </div>
          <div className="flex items-center gap-2">
            {(['all','open','hiring','with-candidates'] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(p => p===f?'all':f)} className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${activeFilter===f?'bg-white/[0.06] border-white/[0.12] text-white/70':'bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50'}`}>
                {f==='all'?'All':f==='with-candidates'?'With Candidates':f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(role => {
            const cfg = statusCfg[role.status];
            const isOpen = expandRole === role.id;
            return (
              <div key={role.id} className={`bg-white/[0.02] border rounded-xl overflow-hidden transition-all ${isOpen?'border-white/[0.12]':'border-white/[0.06] hover:border-white/[0.10]'}`}>
                <button onClick={() => setExpandRole(isOpen?null:role.id)} className="w-full text-left">
                  <div className="px-5 py-4 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase size={13} className="text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-semibold text-white/80">{role.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${cfg.bg}`}><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`}/>{cfg.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${prioBg[role.priority]||prioBg.medium}`}>{role.priority}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[11px] text-white/40">{role.department}</span>
                        <span className="text-[11px] text-white/20">·</span>
                        <span className="text-[11px] text-white/40 flex items-center gap-1"><MapPin size={10}/>{role.location}</span>
                        <span className="text-[11px] text-white/20">·</span>
                        <span className="text-[11px] text-white/40">{role.salaryRange}</span>
                        {role.candidates.length>0&&<><span className="text-[11px] text-white/20">·</span><span className="text-[11px] text-white/50 flex items-center gap-1"><Users size={10}/>{role.candidates.length} candidate{role.candidates.length!==1?'s':''}</span></>}
                      </div>
                    </div>
                    {isOpen?<ChevronUp size={16} className="text-white/30 mt-1"/>:<ChevronDown size={16} className="text-white/30 mt-1"/>}
                  </div>
                </button>
                {isOpen && <ExpandedRole role={role} />}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <Briefcase size={32} className="mx-auto text-white/10 mb-3" />
            <p className="text-[13px] text-white/30">No roles match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

