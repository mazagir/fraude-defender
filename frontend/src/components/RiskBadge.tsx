import { riskBg, riskColor } from "../utils/risk";

interface RiskBadgeProps {
  level?: string;
}

export default function RiskBadge({ level = "bajo" }: RiskBadgeProps) {
  const l = level.toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${riskBg[l] || riskBg.bajo} border-white/5`}
      style={{ color: riskColor[l] || riskColor.bajo }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: riskColor[l] || riskColor.bajo }}
      />
      {l.toUpperCase()}
    </span>
  );
}

