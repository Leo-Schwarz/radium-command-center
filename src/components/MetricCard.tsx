import MiniSparkline from './MiniSparkline';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  accent?: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'white';
}

const accentMap = {
  purple: { line: '#a78bfa', bg: 'bg-purple-500/[0.08]', text: 'text-purple-300' },
  blue:   { line: '#60a5fa', bg: 'bg-blue-500/[0.08]',   text: 'text-blue-300' },
  green:  { line: '#4ade80', bg: 'bg-green-500/[0.08]',  text: 'text-green-300' },
  orange: { line: '#fb923c', bg: 'bg-orange-500/[0.08]', text: 'text-orange-300' },
  red:    { line: '#f87171', bg: 'bg-red-500/[0.08]',    text: 'text-red-300' },
  white:  { line: '#e5e5e5', bg: 'bg-white/[0.04]',      text: 'text-white/60' },
};

export default function MetricCard({ label, value, sub, sparklineData, sparklineColor, accent = 'white' }: MetricCardProps) {
  const a = accentMap[accent];
  return (
    <div className={`${a.bg} border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-white/30 mb-1">{label}</p>
          <p className="text-[20px] font-semibold text-white/90 tabular-nums tracking-tight">{value}</p>
          {sub && <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="flex-shrink-0 pt-1">
            <MiniSparkline data={sparklineData} color={sparklineColor || a.line} width={72} height={28} />
          </div>
        )}
      </div>
    </div>
  );
}
