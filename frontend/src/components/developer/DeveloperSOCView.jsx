import { FaTerminal, FaBrain, FaTrash } from "react-icons/fa";

export default function DeveloperSOCView({
  reports, simulatedLogs, onDelete,
  selectedReport, setSelectedReport,
  onSimulateAttack, isSimulating, token,
}) {
  return (
    <div className="space-y-6 font-sans">
      {/* Developer Banner */}
      <div className="bg-[#18110b] border border-yellow-500/20 rounded-3xl p-5 flex items-center gap-3">
        <span className="text-2xl text-yellow-500">⚠️</span>
        <div>
          <h4 className="text-sm font-bold text-yellow-500">Modo Consola SOC Activo</h4>
          <p className="text-xs text-slate-400 mt-0.5">Sección restringida para auditores, desarrolladores e integraciones B2B empresariales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Real-time Log Stream Console */}
        <div className="lg:col-span-2 bg-[#070911] border border-slate-800/85 rounded-3xl p-5 h-[360px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaTerminal className="text-cyan-400" /> SOC Terminal Telemetría
            </h3>
            <button
              onClick={onSimulateAttack}
              disabled={isSimulating}
              className="text-[9px] font-bold uppercase tracking-wider bg-red-950/30 border border-red-500/30 text-red-400 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              {isSimulating ? "Simulando..." : "Forzar Simulación"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[9px] leading-relaxed scrollbar-thin text-slate-400">
            {simulatedLogs.map((log) => (
              <div key={log.id} className="flex gap-2 items-start">
                <span className="text-slate-600">[{log.time}]</span>
                <span className={`px-1 py-0.2 rounded text-[8px] font-bold font-mono ${
                  log.type === "danger" ? "bg-red-500/10 text-red-400" :
                  log.type === "warning" ? "bg-yellow-500/10 text-yellow-400" :
                  log.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-slate-300 break-all">{log.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable AI Details Widget */}
        <div className="lg:col-span-3 bg-[#070911] border border-slate-800/85 rounded-3xl p-5 h-[360px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaBrain className="text-cyan-400 animate-pulse" /> Explainable AI Assessment
            </h3>
          </div>

          {selectedReport ? (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ID Reporte</span>
                <span className="font-mono font-bold text-slate-300">#{selectedReport.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Objetivo Escaneado</span>
                <span className="font-mono text-cyan-400 font-bold truncate max-w-[180px]">
                  {selectedReport.domain || selectedReport.phone_number || "Múltiple"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Heurística Score</span>
                <span className="font-mono font-bold text-red-400">{selectedReport.risk_score}%</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Descripción Raw</span>
                <p className="text-slate-400 italic bg-[#05070c] border border-slate-900 p-2 rounded-xl text-[11px]">
                  "{selectedReport.description}"
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Indicadores Heurísticos</span>
                <p className="text-slate-400 font-mono text-[10px] bg-[#05070c] border border-slate-900 p-2 rounded-xl">
                  {selectedReport.malicious_indicators || "Ninguno"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <FaBrain size={28} className="mb-2 text-slate-700" />
              Selecciona un IoC de la tabla de la derecha para ver los factores de riesgo de la IA.
            </div>
          )}

          <div className="text-[9px] text-slate-600 font-mono border-t border-slate-900 pt-2 text-center">
            AegisShield Risk Evaluation Core · v2.0
          </div>
        </div>
      </div>

      {/* Database Raw Tables */}
      <div className="bg-[#070911] border border-slate-800/85 rounded-3xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Base de Datos de Indicadores IoC (SQLite / Postgres)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-2.5">ID</th>
                <th className="py-2.5">Descripción</th>
                <th className="py-2.5">Teléfono</th>
                <th className="py-2.5">Dominio</th>
                <th className="py-2.5">Score</th>
                <th className="py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {reports.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`hover:bg-slate-900/40 transition-colors cursor-pointer ${selectedReport?.id === r.id ? "bg-slate-900/30" : ""}`}
                >
                  <td className="py-3 font-mono text-slate-500">#{r.id}</td>
                  <td className="py-3 text-slate-200 max-w-[200px] truncate" title={r.description}>{r.description}</td>
                  <td className="py-3 font-mono text-slate-400">{r.phone_number || "—"}</td>
                  <td className="py-3 font-semibold text-slate-400 truncate max-w-[120px]">{r.domain || "—"}</td>
                  <td className="py-3 font-mono font-bold text-red-400">{r.risk_score ?? r.score_riesgo ?? 0}%</td>
                  <td className="py-3 text-right">
                    {token && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                        className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 p-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <FaTrash size={10} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-mono">
                    Ningún indicador registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
