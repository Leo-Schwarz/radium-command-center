interface FunnelStage {
  stage: string;
  visitors: number;
  conversionToNext?: number | null;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  maxVisitors: number;
}

export default function FunnelChart({ stages, maxVisitors }: FunnelChartProps) {
  const colors = [
    'bg-blue-500/20 border-blue-400/30',
    'bg-purple-500/20 border-purple-400/30',
    'bg-emerald-500/20 border-emerald-400/30',
    'bg-amber-500/20 border-amber-400/30',
    'bg-rose-500/20 border-rose-400/30',
  ];

  return (
    <div className="flex flex-col gap-1.5">
      {stages.map((s, i) => {
        const widthPct = maxVisitors > 0 ? (s.visitors / maxVisitors) * 100 : 0;
        const colorCls = colors[i % colors.length];
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <div className="flex-1">
              <div
                className={`h-8 rounded-md border ${colorCls} flex items-center px-3 transition-all`}
                style={{ width: `${Math.max(widthPct, 8)}%` }}
              >
                <span className="text-[11px] font-medium text-gray-800 dark:text-white/80 whitespace-nowrap tabular-nums">
                  {s.visitors.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-32 flex-shrink-0">
              <p className="text-[11px] font-medium text-gray-600 dark:text-white/60">{s.stage}</p>
              {s.conversionToNext != null && (
                <p className="text-[10px] text-gray-400 dark:text-white/30">
                  {s.conversionToNext.toFixed(1)}% → next
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
