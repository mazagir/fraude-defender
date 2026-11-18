import { riskColor, riskBg } from '../../constants/riskConfig';

interface RiskBadgeProps {
  level?: string;
}

export default function RiskBadge({ level = 'bajo' }: RiskBadgeProps) {
  const aliases: Record<string, string> = {
    low: 'bajo',
    medium: 'medio',
    high: 'alto',
    critical: 'critical',
  };
  const rawLevel = level.toLowerCase();
  const normalizedLevel = aliases[rawLevel] || rawLevel;
  const displayLabels: Record<string, string> = { critical: 'CRITICO', alto: 'ALTO', medio: 'MEDIO', bajo: 'BAJO' };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold border-white/5"
      style={{
        color: riskColor[normalizedLevel] || riskColor.bajo,
        backgroundColor: riskBg[normalizedLevel] || riskBg.bajo,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: riskColor[normalizedLevel] || riskColor.bajo }}
      />
      {displayLabels[normalizedLevel] || normalizedLevel.toUpperCase()}
    </span>
  );
}
