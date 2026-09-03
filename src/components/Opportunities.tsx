import React, { useMemo, useState } from 'react';
import type { OpportunitiesData, PartnershipTarget, OpportunityPriority } from '../types';

interface OpportunitiesProps {
  data: OpportunitiesData;
}

type FilterPriority = 'all' | OpportunityPriority;

const categoryLabels: Record<string, string> = {
  'dev-tools': 'Dev Tools',
  'saas-ai': 'SaaS with AI',
  'platforms': 'Platforms',
};

const categoryDot: Record<string, string> = {
  'dev-tools': 'bg-violet-500',
  'saas-ai': 'bg-pink-500',
  'platforms': 'bg-amber-500',
};

const priorityConfig: Record<OpportunityPriority, { label: string; cls: string; dot: string }> = {
  high:   { label: 'High',   cls: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/15', dot: 'bg-red-500' },
  medium: { label: 'Medium', cls: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/15', dot: 'bg-blue-500' },
  low:    { label: 'Low',    cls: 'text-gray-500 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08]', dot: 'bg-gray-400 dark:bg-white/30' },
};

const PriorityBadge: React.FC<{ priority: OpportunityPriority }> = ({ priority }) => {
  const cfg = priorityConfig[priority];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${cfg.cls} flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const FilterButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
      active
        ? 'bg-black/[0.06] dark:bg-white/[0.08] border-gray-300 dark:border-white/[0.15] text-gray-800 dark:text-white/80'
        : 'bg-transparent border-gray-200 dark:border-white/[0.06] text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50 hover:border-gray-300 dark:hover:border-white/[0.12]'
    }`}
  >
    {label}
    <span className="text-[10px] text-gray-400 dark:text-white/30 tabular-nums">{count}</span>
  </button>
);

const Opportunities: React.FC<OpportunitiesProps> = ({ data }) => {
  const [ptFilter, setPtFilter] = useState<FilterPriority>('all');
  const [abmFilter, setAbmFilter] = useState<FilterPriority>('all');

  const filteredPartnerships = useMemo(() => {
    if (ptFilter === 'all') return data.partnershipTargets;
    return data.partnershipTargets.filter(p => p.priority === ptFilter);
  }, [data.partnershipTargets, ptFilter]);

  const filteredABM = useMemo(() => {
    if (abmFilter === 'all') return data.abmAccounts;
    return data.abmAccounts.filter(a => a.priority === abmFilter);
  }, [data.abmAccounts, abmFilter]);

  const groupedPartnerships = useMemo(() => {
    const groups: Record<string, PartnershipTarget[]> = {};
    for (const p of filteredPartnerships) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return groups;
  }, [filteredPartnerships]);

  const ptCounts = useMemo(() => ({
    all: data.partnershipTargets.length,
    high: data.partnershipTargets.filter(p => p.priority === 'high').length,
    medium: data.partnershipTargets.filter(p => p.priority === 'medium').length,
    low: data.partnershipTargets.filter(p => p.priority === 'low').length,
  }), [data.partnershipTargets]);

  const abmCounts = useMemo(() => ({
    all: data.abmAccounts.length,
    high: data.abmAccounts.filter(a => a.priority === 'high').length,
    medium: data.abmAccounts.filter(a => a.priority === 'medium').length,
    low: data.abmAccounts.filter(a => a.priority === 'low').length,
  }), [data.abmAccounts]);

  return (
    <div className="space-y-12">
      {/* Partnership Targets */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" style={{ boxShadow: '0 0 6px rgba(139,92,246,0.4)' }} />
              <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-500 dark:text-white/50">
                Partnership Targets
              </h2>
            </div>
            <p className="text-[12px] text-gray-400 dark:text-white/25">
              Companies where a partnership unlocks distribution, co-selling, or product integration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterButton active={ptFilter === 'all'} onClick={() => setPtFilter('all')} label="All" count={ptCounts.all} />
            <FilterButton active={ptFilter === 'high'} onClick={() => setPtFilter('high')} label="High" count={ptCounts.high} />
            <FilterButton active={ptFilter === 'medium'} onClick={() => setPtFilter('medium')} label="Medium" count={ptCounts.medium} />
            <FilterButton active={ptFilter === 'low'} onClick={() => setPtFilter('low')} label="Low" count={ptCounts.low} />
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedPartnerships).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-1.5 h-1.5 rounded-full ${categoryDot[category] || 'bg-gray-400'}`} />
                <h3 className="text-[12px] font-semibold tracking-wide text-gray-600 dark:text-white/60 uppercase">
                  {categoryLabels[category] || category}
                </h3>
                <span className="text-[10px] text-gray-400 dark:text-white/25 tabular-nums">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(target => (
                  <div
                    key={target.id}
                    className="bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/[0.08] rounded-xl p-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#161618]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-[14px] font-semibold text-gray-800 dark:text-white/80 leading-snug">
                        {target.company}
                      </h4>
                      <PriorityBadge priority={target.priority} />
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed mb-2">
                      {target.whyWeCare}
                    </p>
                    {target.notes && (
                      <p className="text-[11px] text-gray-400 dark:text-white/25 italic leading-relaxed border-t border-gray-100 dark:border-white/[0.05] pt-2 mt-2">
                        {target.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredPartnerships.length === 0 && (
            <p className="text-[13px] text-gray-400 dark:text-white/20 py-8 text-center italic">
              No partnership targets match the current filter.
            </p>
          )}
        </div>
      </section>

      {/* ABM Accounts */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.4)' }} />
              <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-500 dark:text-white/50">
                ABM Accounts
              </h2>
            </div>
            <p className="text-[12px] text-gray-400 dark:text-white/25">
              Companies worth direct sales effort — prioritized by estimated ARR and strategic fit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterButton active={abmFilter === 'all'} onClick={() => setAbmFilter('all')} label="All" count={abmCounts.all} />
            <FilterButton active={abmFilter === 'high'} onClick={() => setAbmFilter('high')} label="High" count={abmCounts.high} />
            <FilterButton active={abmFilter === 'medium'} onClick={() => setAbmFilter('medium')} label="Medium" count={abmCounts.medium} />
            <FilterButton active={abmFilter === 'low'} onClick={() => setAbmFilter('low')} label="Low" count={abmCounts.low} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredABM.map(account => (
            <div
              key={account.id}
              className="bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5 transition-colors hover:bg-gray-50 dark:hover:bg-[#161618]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-[14px] font-semibold text-gray-800 dark:text-white/80 leading-snug">
                    {account.company}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-500 dark:text-white/40 font-medium tabular-nums">
                      Est. ARR: {account.estimatedARR}
                    </span>
                  </div>
                </div>
                <PriorityBadge priority={account.priority} />
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-gray-400 dark:text-white/30">Strategic Value</span>
                  <p className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed mt-0.5">
                    {account.strategicValue}
                  </p>
                </div>
                <div className="border-t border-gray-100 dark:border-white/[0.05] pt-2">
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-gray-400 dark:text-white/30">Sales Approach</span>
                  <p className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed mt-0.5">
                    {account.salesApproach}
                  </p>
                </div>
                {account.notes && (
                  <p className="text-[11px] text-gray-400 dark:text-white/25 italic leading-relaxed pt-1">
                    {account.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
          {filteredABM.length === 0 && (
            <div className="col-span-full py-8 text-center">
              <p className="text-[13px] text-gray-400 dark:text-white/20 italic">
                No ABM accounts match the current filter.
              </p>
            </div>
          )}
        </div>
      </section>

      <p className="text-[10px] text-gray-400 dark:text-white/20 tracking-wide">
        Last updated {data.lastUpdated} · {data.partnershipTargets.length} partnership targets · {data.abmAccounts.length} ABM accounts · Move to HubSpot once conversations begin.
      </p>
    </div>
  );
};

export default Opportunities;
