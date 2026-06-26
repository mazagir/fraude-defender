import { useState } from "react";
import { motion } from "framer-motion";
import { FaBolt, FaGlobeAmericas, FaShieldAlt, FaSignal, FaArrowUp, FaArrowDown } from "react-icons/fa";
import RiskBadge from "../shared/RiskBadge";

const kpiItems = [
  { key: "usuarios_protegidos", label: "Usuarios protegidos", icon: <FaShieldAlt />, delta: 12 },
  { key: "incidentes_semanales", label: "Incidentes semanales", icon: <FaBolt />, delta: -5 },
  { key: "iocs_activos", label: "IoCs activos", icon: <FaSignal />, delta: 8 },
  { key: "paises_monitoreados", label: "Países monitoreados", icon: <FaGlobeAmericas />, delta: 0 },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ThreatIntelPanelProps {
  intel?: any;
  loading?: boolean;
  error?: string | null;
}


export default function ThreatIntelPanel({ intel, loading, error }: ThreatIntelPanelProps) {
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);
  const events: IntelEvent[] = intel?.events || [];

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiItems.map((item) => {
          const value = intel?.kpis?.[item.key] ?? 0;
          const isHovered = hoveredKpi === item.key;
          const deltaUp = item.delta > 0;

          return (
            <motion.div
              key={item.key}
              onMouseEnter={() => setHoveredKpi(item.key)}
              onMouseLeave={() => setHoveredKpi(null)}
              whileHover={{ scale: 1.03, y: -3 }}
              className="bg-[#070911]/70 border border-slate-800/70 rounded-2xl p-5 relative overflow-hidden cursor-default transition-colors hover:border-cyan-500/30 hover:bg-[#070911]/90"
            >
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-2">
                <span>{item.label}</span>
                <span className="text-cyan-400 text-sm">{item.icon}</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
                {value.toLocaleString("es-CO")}
              </div>

              {item.delta !== 0 && (
                <div className={`flex items-center gap-1.5 mt-2 text-xs font-mono font-bold ${deltaUp ? "text-emerald-400" : "text-red-400"}`}>
                  {deltaUp ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                  <span>{Math.abs(item.delta)}% vs semana ant.</span>
                </div>
              )}

              <motion.div
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 4 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 pointer-events-none rounded-2xl"
              />
            </motion.div>
          );
        })}
      </div>

      <div className="bg-[#070911]/70 border border-slate-800/70 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Threat Intelligence Feed</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Eventos derivados de reportes comunitarios y motor heuristico</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : error ? "bg-red-400" : "bg-emerald-400"}`} />
            <span className={`text-[10px] font-mono font-bold ${loading ? "text-yellow-400" : error ? "text-red-400" : "text-emerald-400"}`}>
              {loading ? "SINCRONIZANDO" : error ? "FALLBACK" : "LIVE"}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {events.slice(0, 8).map((event) => (
            <div key={event.id} className="grid grid-cols-1 md:grid-cols-[110px_140px_1fr_120px] gap-3 px-5 py-3.5 items-center hover:bg-slate-900/30 transition-colors">
              <div className="flex-shrink-0">
                <RiskBadge level={event.severity} />
              </div>
              <div className="text-xs text-slate-300 font-semibold truncate">{event.category}</div>
              <div className="min-w-0">
                <div className="text-xs text-slate-200 truncate font-medium">{event.ioc?.value || event.description}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{event.country} · Score {event.risk_score ?? 0}</div>
              </div>
              <time className="text-[10px] text-slate-500 font-mono md:text-right whitespace-nowrap">
                {new Date(event.timestamp).toLocaleString("es-CO", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          ))}
          {events.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-500 text-xs font-mono">
              No hay eventos de amenazas en este momento.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
