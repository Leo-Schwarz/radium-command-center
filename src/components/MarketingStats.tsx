import { useState, useMemo } from 'react';
import { Users, Target, Zap, Globe, Link2, Calendar } from 'lucide-react';
import type { MarketingStats as MS } from '../types/marketing';
import MetricCard from './MetricCard';
import FunnelChart from './FunnelChart';
import MiniSparkline from './MiniSparkline';

function SectionHeader({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-white/30" />
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40">{label}</h3>
      </div>
      {children}
    </div>
  );
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

interface MarketingStatsProps {
  stats: MS;
}

export default function MarketingStats({ stats }: MarketingStatsProps) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const lastSync = useMemo(() => {
    const d = new Date(stats.lastSyncAt);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, [stats.lastSyncAt]);

  const hubspotContactSpark = stats.hubspot.contactHistory.map(p => p.value);
  const linkedInSpark = stats.linkedin.weeklyHistory.map(p => p.value);
  const websiteSpark = stats.website.dailySessions.map(p => p.value);
  const signupSpark = stats.product.eventHistory.signup.map(p => p.value);
  const apiKeySpark = stats.product.eventHistory.apiKeyCreated.map(p => p.value);
  const tokenSpark = stats.product.eventHistory.firstTokenUsage.map(p => p.value);

  // Paid vs organic split
  const paidSplit = stats.googleAds.paidVsOrganicSignups.find(s => s.source === 'paid');
  const organicSplit = stats.googleAds.paidVsOrganicSignups.find(s => s.source === 'organic');
  const totalSignups7d = (paidSplit?.signups7d ?? 0) + (organicSplit?.signups7d ?? 0);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="text-[22px] font-semibold text-white/90 tracking-tight">PLG Stats</h1>
          <p className="text-[12px] text-white/30 mt-0.5">Signups · Activation · Product · Paid · Organic</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            {(['7d', '30d', '90d'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors ${
                  range === r ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-white/20">
            <Calendar size={11} />
            <span className="text-[10px]">Synced {lastSync}</span>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-10">
        <MetricCard label="Signups (7d)" value={`${stats.kpis.weeklySignups}`} accent="blue" sparklineData={signupSpark} />
        <MetricCard label="Activations (7d)" value={`${stats.kpis.weeklyActivations}`} sub="API key created" accent="purple" sparklineData={apiKeySpark} />
        <MetricCard label="Qualified Acts" value={`${stats.kpis.weeklyQualifiedActivations}`} sub="First token usage" accent="green" sparklineData={tokenSpark} />
        <MetricCard label="Activation Rate" value={`${stats.kpis.activationRate}%`} sub="signup → api key" accent="white" />
        <MetricCard label="Qualified Rate" value={`${stats.kpis.qualifiedActivationRate}%`} sub="signup → token" accent="orange" />
        <MetricCard label="CPA (Signup)" value={`$${stats.kpis.costPerSignup}`} sub="paid / signups" accent="red" />
        <MetricCard label="Organic Split" value={`${stats.kpis.organicVsPaidSplit}%`} sub="of all signups" accent="green" />
      </section>

      {/* ─── HubSpot (Lead Source Tracking) ─── */}
      <section className="mb-10">
        <SectionHeader icon={Users} label="HubSpot — Lead Source" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <MetricCard label="Total Contacts" value={formatNumber(stats.hubspot.totalContacts)} accent="white" sparklineData={hubspotContactSpark} />
          <MetricCard label="New (7d)" value={`${stats.hubspot.newContacts7d}`} accent="blue" />
          <MetricCard label="New (30d)" value={`${stats.hubspot.newContacts30d}`} accent="purple" />
          <MetricCard label="Product Events" value={`${stats.hubspot.productEvents7d.reduce((a, e) => a + e.count, 0)}`} accent="green" />
          <MetricCard label="Signups Tracked" value={`${stats.hubspot.productEvents7d.find(e => e.event === 'Signup Form Submit')?.count ?? 0}`} accent="green" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Contact Growth */}
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
            <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Contact Growth</h4>
            <MiniSparkline data={hubspotContactSpark} color="#60a5fa" width={520} height={90} fillOpacity={0.08} />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-white/20">{stats.hubspot.contactHistory[0]?.date}</span>
              <span className="text-[10px] text-white/20">{stats.hubspot.contactHistory[stats.hubspot.contactHistory.length - 1]?.date}</span>
            </div>
          </div>

          {/* Product Events */}
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
            <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Product Events (7d)</h4>
            <div className="space-y-2">
              {stats.hubspot.productEvents7d.map(e => (
                <div key={e.event} className="flex items-center justify-between">
                  <span className="text-[11px] text-white/50">{e.event}</span>
                  <span className="text-[11px] font-medium text-white/70 tabular-nums">{e.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Google Ads (Acquisition) ─── */}
      <section className="mb-10">
        <SectionHeader icon={Target} label="Google Ads — Acquisition" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <MetricCard label="Spend (7d)" value={formatCurrency(stats.googleAds.totalSpend7d)} accent="red" />
          <MetricCard label="Spend (30d)" value={formatCurrency(stats.googleAds.totalSpend30d)} accent="orange" />
          <MetricCard label="Signups (7d)" value={`${stats.googleAds.totalSignups7d}`} accent="blue" />
          <MetricCard label="Cost/Signup" value={`$${stats.googleAds.avgCostPerSignup7d.toFixed(0)}`} accent="purple" />
          <MetricCard label="CTR" value={`${stats.googleAds.avgCtr7d}%`} accent="white" />
          <MetricCard label="CPC" value={`$${stats.googleAds.avgCpc7d.toFixed(2)}`} accent="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          {/* Campaigns Table */}
          <div className="lg:col-span-2 bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5 overflow-x-auto">
            <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-3">Campaigns</h4>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-2 text-[10px] font-medium tracking-[0.08em] uppercase text-white/25">Campaign</th>
                  <th className="pb-2 text-[10px] font-medium tracking-[0.08em] uppercase text-white/25 text-right">Spend</th>
                  <th className="pb-2 text-[10px] font-medium tracking-[0.08em] uppercase text-white/25 text-right">Signups</th>
                  <th className="pb-2 text-[10px] font-medium tracking-[0.08em] uppercase text-white/25 text-right">CTR</th>
                  <th className="pb-2 text-[10px] font-medium tracking-[0.08em] uppercase text-white/25 text-right">CPS</th>
                </tr>
              </thead>
              <tbody>
                {stats.googleAds.campaigns.map(c => (
                  <tr key={c.id} className="border-b border-white/[0.04]">
                    <td className="py-2">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${c.status === 'ENABLED' ? 'bg-green-400/70' : 'bg-white/15'}`} />
                      <span className="text-[11px] text-white/60">{c.name}</span>
                    </td>
                    <td className="py-2 text-[11px] text-white/40 tabular-nums text-right">{formatCurrency(c.spend7d)}</td>
                    <td className="py-2 text-[11px] text-white/40 tabular-nums text-right">{c.signups7d}</td>
                    <td className="py-2 text-[11px] text-white/40 tabular-nums text-right">{c.ctr}%</td>
                    <td className="py-2 text-[11px] text-white/40 tabular-nums text-right">{c.costPerSignup > 0 ? `$${c.costPerSignup.toFixed(0)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            {/* Conversion Breakdown */}
            <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
              <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-3">Conversions</h4>
              {stats.googleAds.conversionBreakdown.map(cb => (
                <div key={cb.name} className="flex items-center justify-between mb-1.5 last:mb-0">
                  <span className="text-[11px] text-white/40">{cb.name}</span>
                  <span className="text-[11px] font-medium text-white/60 tabular-nums">{cb.count}</span>
                </div>
              ))}
            </div>

            {/* Paid vs Organic */}
            <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
              <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-3">Paid vs Organic</h4>
              <div className="space-y-2">
                {stats.googleAds.paidVsOrganicSignups.map(s => (
                  <div key={s.source}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-white/30 uppercase tracking-wide">{s.source}</span>
                      <span className="text-[11px] text-white/60 tabular-nums">{s.signups7d}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.source === 'paid' ? 'bg-blue-400/60' : 'bg-emerald-400/60'}`}
                        style={{ width: `${totalSignups7d > 0 ? (s.signups7d / totalSignups7d) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/20 mt-0.5">{s.signups30d} in 30d</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LinkedIn ─── */}
      <section className="mb-10">
        <SectionHeader icon={Link2} label="LinkedIn" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <MetricCard label="Followers" value={formatNumber(stats.linkedin.followers)} sub={`+${stats.linkedin.followerGrowth7d} 7d`} accent="blue" />
          <MetricCard label="Impressions (7d)" value={formatNumber(stats.linkedin.impressions7d)} accent="purple" sparklineData={linkedInSpark} />
          <MetricCard label="Clicks (7d)" value={`${stats.linkedin.clicks7d}`} accent="white" />
          <MetricCard label="CTR" value={`${stats.linkedin.ctr}%`} accent="green" />
          <MetricCard label="Eng. Rate" value={`${stats.linkedin.avgEngagementRate}%`} accent="orange" />
          <MetricCard label="Lead Forms" value={`${stats.linkedin.leadGenForms7d}`} accent="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Weekly Trend */}
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
            <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">12-Week Impressions</h4>
            <div className="flex items-end gap-[3px] h-24">
              {stats.linkedin.weeklyHistory.map((pt, i) => {
                const max = Math.max(...stats.linkedin.weeklyHistory.map(p => p.value), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end group">
                    <div
                      className="w-full bg-blue-400/40 rounded-sm transition-all group-hover:bg-blue-400/60"
                      style={{ height: `${(pt.value / max) * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
            <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Recent Posts</h4>
            <div className="space-y-2">
              {stats.linkedin.recentPosts.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/50 truncate max-w-[280px]">{p.title}</p>
                    <p className="text-[10px] text-white/20">{p.date}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-white/30 tabular-nums">{formatNumber(p.impressions)}</span>
                    <span className="text-[10px] text-white/30 tabular-nums">{p.clicks} clicks</span>
                    <span className="text-[10px] text-white/30 tabular-nums">{p.reactions}♥</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Website ─── */}
      <section className="mb-10">
        <SectionHeader icon={Globe} label="Website" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <MetricCard label="Sessions (7d)" value={formatNumber(stats.website.sessions7d)} accent="blue" sparklineData={websiteSpark} />
          <MetricCard label="Sessions (30d)" value={formatNumber(stats.website.sessions30d)} accent="purple" />
          <MetricCard label="Unique Visitors" value={formatNumber(stats.website.uniqueVisitors7d)} accent="green" />
          <MetricCard label="Bounce Rate" value={`${stats.website.bounceRate}%`} accent="white" />
          <MetricCard label="Avg Session" value={`${Math.floor(stats.website.avgSessionSeconds / 60)}m ${stats.website.avgSessionSeconds % 60}s`} accent="orange" />
          <MetricCard label="Signups from Web" value={`${stats.website.funnel.find(s => s.stage === 'Sign up')?.visitors ?? 0}`} accent="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Top Pages */}
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
            <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Top Pages</h4>
            <div className="space-y-2">
              {stats.website.pages.map(page => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-white/30 flex-shrink-0 w-16 truncate">{page.path}</span>
                    <div className="h-1.5 w-16 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400/60 rounded-full" style={{ width: `${stats.website.sessions7d > 0 ? (page.sessions7d / stats.website.sessions7d) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[11px] text-white/40 tabular-nums">{page.sessions7d.toLocaleString()} ses</span>
                    <span className="text-[10px] text-white/25">{page.bounceRate}% bounce</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PLG Funnel */}
          <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
            <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">PLG Funnel</h4>
            <FunnelChart stages={stats.website.funnel} maxVisitors={Math.max(...stats.website.funnel.map(s => s.visitors), 1)} />
          </div>
        </div>
      </section>

      {/* ─── Product ─── */}
      <section className="mb-10">
        <SectionHeader icon={Zap} label="Product Metrics" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3 mb-5">
          <MetricCard label="Signups (7d)" value={`${stats.product.signups7d}`} sub={`${stats.product.signups30d} 30d`} accent="blue" sparklineData={signupSpark} />
          <MetricCard label="API Keys (7d)" value={`${stats.product.apiKeyCreated7d}`} accent="purple" sparklineData={apiKeySpark} />
          <MetricCard label="First Token (7d)" value={`${stats.product.firstTokenUsage7d}`} accent="green" sparklineData={tokenSpark} />
          <MetricCard label="First Spend (7d)" value={`${stats.product.firstSpend7d}`} accent="orange" />
          <MetricCard label="Activation" value={`${stats.product.activationRate}%`} sub="signup → api key" accent="white" />
          <MetricCard label="Qualified Act." value={`${stats.product.qualifiedActivationRate}%`} sub="signup → token" accent="red" />
          <MetricCard label="Paid Act." value={`${stats.product.paidActivationRate}%`} sub="signup → spend" accent="green" />
          <MetricCard label="WAU" value={`${stats.product.weeklyActiveUsers}`} accent="blue" />
        </div>

        <div className="bg-[#0f0f11] border border-white/[0.08] rounded-2xl p-5">
          <h4 className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">7-Day Event History</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-white/20 mb-2">Signups</p>
              <MiniSparkline data={signupSpark} color="#a78bfa" width={280} height={60} fillOpacity={0.12} />
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-white/20 mb-2">API Key Created</p>
              <MiniSparkline data={apiKeySpark} color="#60a5fa" width={280} height={60} fillOpacity={0.12} />
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-white/20 mb-2">First Token Usage</p>
              <MiniSparkline data={tokenSpark} color="#4ade80" width={280} height={60} fillOpacity={0.12} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
