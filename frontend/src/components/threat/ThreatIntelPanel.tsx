import { useState } from "react";
import { motion } from "framer-motion";
import { FaBolt, FaGlobeAmericas, FaShieldAlt, FaSignal, FaArrowUp, FaArrowDown } from "react-icons/fa";
import RiskBadge from "../shared/RiskBadge";

const kpiItems = [
  { key: "usuarios_protegidos", label: "Usuarios protegidos", icon: <FaShieldAlt />, delta: 12 },
  { key: "incidentes_semanales", label: "Incidentes semanales", icon: <FaBolt />, delta: -5 },
  { key: "iocs_activos", label: "IoCs activos", icon: <FaSignal />, delta: 8 },
  { key: "paises_monitoreados", label: "Paises monitoreados", icon: <FaGlobeAmericas />, delta: 0 },
];

interface IntelEvent {
  id?: string | number;
  severity?: string;
  category?: string;
  description?: string;
  ioc?: { value?: string };
  country?: string;
  risk_score?: number;
  timestamp: string;
}

interface IntelData {
  kpis?: Record<string, number>;
  events?: IntelEvent[];
}

interface ThreatIntelPanelProps {
  intel?: { kpis?: any; events?: IntelEvent[] };
  loading?: boolean;
  error?: string | null;
}

export default function ThreatIntelPanel({ intel, loading, error }: ThreatIntelPanelProps) {
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);
  const events = intel?.events || [];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiItems.map((item) => {
          const value = intel?.kpis?.[item.key] ?? 0;
          const isHovered = hoveredKpi === item.key;
          const deltaUp = item.delta > 0;

          return (
            <motion.div
              key={item.key}
              onMouseEnter={() => setHoveredKpi(item.key)}
              onMouseLeave={() => setHoveredKpi(null)}
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-[#070911]/70 border border-slate-800/70 rounded-xl p-4 relative overflow-hidden cursor-default transition-colors hover:border-cyan-500/30 hover:bg-[#070911]/90"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>{item.label}</span>
                <span className="text-cyan-400">{item.icon}</span>
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">
                {value.toLocaleString("es-CO")}
              </div>

              {item.delta !== 0 && (
                <div className={`flex items-center gap-1 mt-1 text-[10px] font-mono font-semibold ${deltaUp ? "text-emerald-400" : "text-red-400"}`}>
                  {deltaUp ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                  <span>{Math.abs(item.delta)}% vs semana ant.</span>
                </div>
              )}

              <motion.div
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 4 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 pointer-events-none rounded-xl"
              />
            </motion.div>
          );
        })}
      </div>

      <div className="bg-[#070911]/70 border border-slate-800/70 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Threat Intelligence Feed</h2>
            <p className="text-[11px] text-slate-500">Eventos derivados de reportes comunitarios y motor heuristico</p>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">
            {loading ? "SYNC" : error ? "FALLBACK" : "LIVE"}
          </span>
        </div>

        <div className="divide-y divide-slate-900">
          {events.slice(0, 8).map((event) => (
            <div key={event.id} className="grid grid-cols-1 md:grid-cols-[110px_140px_1fr_120px] gap-3 px-4 py-3 items-center hover:bg-slate-900/30 transition-colors">
              <RiskBadge level={event.severity} />
              <div className="text-xs text-slate-300 font-semibold">{event.category}</div>
              <div className="min-w-0">
                <div className="text-xs text-slate-200 truncate">{event.ioc?.value || event.description}</div>
                <div className="text-[10px] text-slate-500 truncate">{event.country} · Score {event.risk_score ?? 0}</div>
              </div>
              <time className="text-[10px] text-slate-500 font-mono md:text-right">
                {new Date(event.timestamp).toLocaleString("es-CO", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
