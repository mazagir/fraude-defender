import { FaBrain } from "react-icons/fa";
import { getRiskLevel, riskColor } from "../utils/risk";


export default function AIReasoningPanel({ selectedReport }) {
  const defaultReport = {
    descripcion: "Reporte de prueba: dominio de cobro abusivo gota a gota.",
    phone_number: "+573129871109",
    bank_account: "Nequi - 3129871109",
    domain: "rapicreditos-colombia.xyz",
    risk_score: 84,
  };

  const r = selectedReport || defaultReport;
  const level = getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0);
  const color = riskColor[level];

  return (
    <div className="bg-[#070911] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 font-sans select-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FaBrain className="text-cyan-400 animate-pulse" /> AI Threat Assessment
        </h3>
        <span className="text-[10px] text-cyan-400/80 bg-cyan-950/20 border border-cyan-800/30 px-2 py-0.5 rounded font-mono font-bold">
          EXPLAINABLE AI
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke={color}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - (r.score_riesgo ?? r.risk_score ?? 70) / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-mono" style={{ color }}>
              {r.score_riesgo ?? r.risk_score ?? 70}%
            </span>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider">Confianza</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Indicador Evaluado</div>
          <div className="text-sm font-bold text-slate-200 truncate mt-0.5">
            {r.dominio ?? r.domain
              ? r.dominio ?? r.domain
              : r.telefono_sospechoso ?? r.phone_number
                ? r.telefono_sospechoso ?? r.phone_number
                : "Multiple IoC"}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed italic">
            "{r.descripcion ?? r.description}"
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs border-t border-slate-800/50 pt-3">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Factores de Riesgo Clave</div>

        <div className="flex justify-between items-center py-1 border-b border-slate-900">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> TLD de Alto Riesgo
          </span>
          <span className="font-mono text-cyan-400 font-bold">Si (.xyz / .click)</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-900">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> Coincidencia de Patrón Estafa
          </span>
          <span className="font-mono text-cyan-400 font-bold">Alto</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-900">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> Geolocalización de Llamada
          </span>
          <span className="font-mono text-slate-300">LATAM (Colombia)</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> Banco Recaudador Asociado
          </span>
          <span className="font-mono text-yellow-400 font-bold">
            {r.banco_recaudo ?? r.bank_account ? "Registrado" : "No detectado"}
          </span>
        </div>
      </div>

      {/* Keep RiskBadge import used above; no extra rendering here */}
    </div>
  );
}

