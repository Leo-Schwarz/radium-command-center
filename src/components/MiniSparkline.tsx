/**
 * Tiny SVG sparkline for embedding in metric cards.
 * Renders a smooth line + optional area fill beneath.
 */

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

export default function MiniSparkline({
  data,
  width = 80,
  height = 28,
  color = '#a78bfa',
  fillOpacity = 0.15,
}: MiniSparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padX = 2;
  const padY = 2;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * plotW;
    const y = padY + plotH - ((v - min) / range) * plotH;
    return `${x},${y}`;
  });

  const areaPoints = `${points[0].split(',')[0]},${height} ` + points.join(' ') + ` ${points[points.length - 1].split(',')[0]},${height}`;

  return (
    <svg width={width} height={height} className="block">
      <polygon points={areaPoints} fill={color} opacity={fillOpacity} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
