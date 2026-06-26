import { FaBolt, FaGlobeAmericas, FaShieldAlt, FaSignal } from "react-icons/fa";
import RiskBadge from "../shared/RiskBadge";

const kpiItems = [
  { key: "usuarios_protegidos", label: "Usuarios protegidos", icon: <FaShieldAlt /> },
  { key: "incidentes_semanales", label: "Incidentes semanales", icon: <FaBolt /> },
  { key: "iocs_activos", label: "IoCs activos", icon: <FaSignal /> },
  { key: "paises_monitoreados", label: "Paises monitoreados", icon: <FaGlobeAmericas /> },
];

export default function ThreatIntelPanel({ intel, loading, error }) {
  const events = intel?.events || [];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiItems.map((item) => (
          <div key={item.key} className="bg-[#070911]/70 border border-slate-800/70 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>{item.label}</span>
              <span className="text-cyan-400">{item.icon}</span>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">
              {(intel?.kpis?.[item.key] ?? 0).toLocaleString("es-CO")}
            </div>
          </div>
        ))}
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
            <div key={event.id} className="grid grid-cols-1 md:grid-cols-[110px_140px_1fr_120px] gap-3 px-4 py-3 items-center">
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
