import { riskColor, riskBg } from '../../constants/riskConfig';

export default function RiskBadge({ level }) {
  const l = (level || 'bajo').toLowerCase();
  const displayLabels = { critical: 'CRÍTICO', alto: 'ALTO', medio: 'MEDIO', bajo: 'BAJO' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold border-white/5`}
      style={{ color: riskColor[l] || riskColor.bajo, backgroundColor: riskBg[l] || riskBg.bajo }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: riskColor[l] || riskColor.bajo }}
      />
      {displayLabels[l] || l.toUpperCase()}
    </span>
  );
}
