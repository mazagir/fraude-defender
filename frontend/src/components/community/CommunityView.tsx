import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGlobe, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

interface CommunityViewProps {
  reports: any[];
  selectedCountry: string;
  setSelectedCountry: (c: string) => void;
  latamThreats: Record<string, { threatType: string; attacks: number; risk: string }>;
  onCreateReport: (payload: Record<string, unknown>) => Promise<void>;
  token: string | null;
}

export default function CommunityView({
  reports, selectedCountry, setSelectedCountry,
  latamThreats, onCreateReport, token,
}: CommunityViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phone_number: "", domain: "", bank_account: "", description: "" });
  const [successMsg, setSuccessMsg] = useState("");

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    if (!form.phone_number && !form.domain && !form.bank_account) {
      alert("Por favor ingresa al menos un indicador (teléfono, dominio o cuenta bancaria).");
      return;
    }

    let calculatedLevel = "MEDIUM";
    const desc = form.description.toLowerCase();
    if (desc.includes("extorsion") || desc.includes("amenaza") || desc.includes("montadeudas")) {
      calculatedLevel = "CRITICAL";
    } else if (desc.includes("sorteo") || desc.includes("gane") || desc.includes("phishing")) {
      calculatedLevel = "HIGH";
    }

    const payload = {
      phone_number: form.phone_number,
      domain: form.domain,
      bank_account: form.bank_account,
      description: form.description,
      risk_level: calculatedLevel,
    };

    await onCreateReport(payload);
    setSuccessMsg("¡Reporte enviado exitosamente a la comunidad!");
    setForm({ phone_number: "", domain: "", bank_account: "", description: "" });
    setTimeout(() => {
      setSuccessMsg("");
      setShowForm(false);
    }, 2000);
  };

  // Extract statistics
  const topNumbers: Record<string, number> = {};
  const topDomains: Record<string, number> = {};
  reports.forEach((r) => {
    if (r.phone_number) topNumbers[r.phone_number] = (topNumbers[r.phone_number] || 0) + 1;
    if (r.domain) topDomains[r.domain] = (topDomains[r.domain] || 0) + 1;
  });

  const sortedNumbers = Object.entries(topNumbers).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sortedDomains = Object.entries(topDomains).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // LATAM Map marker coordinates
  const markers = [
    { name: "Colombia", x: 140, y: 110 },
    { name: "México", x: 50, y: 50 },
    { name: "Perú", x: 130, y: 160 },
    { name: "Chile", x: 140, y: 270 },
    { name: "Argentina", x: 170, y: 260 },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Alertas y Mapa de la Comunidad</h2>
          <p className="text-xs text-slate-500 mt-1">Comparte incidentes sospechosos e investiga amenazas activas en Latinoamérica.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-xl font-bold tracking-wide text-xs transition-all cursor-pointer shadow-md shadow-red-950/20"
        >
          {showForm ? "Cerrar Panel" : "⚠️ Denunciar Estafa"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleReport} className="bg-[#070911]/90 border border-red-500/20 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-2">
                <FaExclamationTriangle /> Registrar Indicador de Fraude
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Teléfono Sospechoso</label>
                  <input
                    placeholder="Ej: +57310..."
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Dominio / URL</label>
                  <input
                    placeholder="Ej: login-verificacion.click"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Cuenta Recaudo (Bancos)</label>
                  <input
                    placeholder="Ej: Nequi 312..."
                    value={form.bank_account}
                    onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Descripción de la estafa *</label>
                <textarea
                  rows={3}
                  placeholder="Detalla cómo operan (ej. Amenazan con enviar fotos a mis contactos de WhatsApp si no pago interés)..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  required
                />
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                  <FaCheckCircle /> {successMsg}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md"
                >
                  {token ? "Inyectar Reporte Validado" : "Enviar Denuncia Anónima"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LATAM Map & Local Scams Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LATAM Map Vector Container */}
        <div className="lg:col-span-3 bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[380px] relative overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 z-10">
            <FaGlobe className="text-blue-500 animate-spin-slow" /> Mapa de Calor de Amenazas LATAM
          </h3>

          <div className="flex-grow flex items-center justify-center relative scale-110">
            <svg viewBox="0 0 300 350" className="w-full h-[280px] opacity-40">
              <path d="M 20 40 Q 40 40 60 50 Q 50 70 30 70 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <path d="M 60 50 L 80 80 L 100 80 L 110 90" fill="none" stroke="#334155" strokeWidth="1" />
              <path d="M 110 90 Q 180 90 200 150 Q 220 220 180 320 Q 140 340 130 310 Q 120 220 110 170 Q 100 120 110 90 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <path d="M 50 50 Q 100 80 140 110" fill="none" stroke="#b91c1c" strokeWidth="1" strokeDasharray="3 3" className="animate-pulse" />
              <path d="M 140 110 Q 110 200 130 160" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 4" />
              <path d="M 130 160 Q 150 220 170 260" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
            </svg>

            {markers.map((mark) => (
              <button
                key={mark.name}
                onClick={() => setSelectedCountry(mark.name)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 focus:outline-none cursor-pointer group"
                style={{ left: `${mark.x}px`, top: `${mark.y}px` }}
              >
                <span className="flex h-5 w-5 relative items-center justify-center">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${selectedCountry === mark.name ? "bg-red-500" : "bg-cyan-500"}`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${selectedCountry === mark.name ? "bg-red-500" : "bg-cyan-400"} shadow-md border border-slate-950`} />
                </span>
                <span className="absolute left-6 -top-2 bg-slate-950/90 border border-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono text-slate-300 pointer-events-none opacity-80 group-hover:opacity-100 whitespace-nowrap">
                  {mark.name}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Haz clic en un marcador para filtrar datos
          </div>
        </div>

        {/* Local Scams Details */}
        <div className="lg:col-span-2 bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[380px]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-900 pb-2.5 mb-3 flex items-center justify-between">
              <span>📌 Telemetría: {selectedCountry}</span>
              <span className="text-[9px] text-cyan-400 font-mono">EN VIVO</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Principales Estafas Detectadas</div>
                <div className="text-sm font-bold text-slate-200 mt-1">{latamThreats[selectedCountry].threatType}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Volumen de Ataques Semanal</div>
                <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">{latamThreats[selectedCountry].attacks} incidentes</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Severidad Regional</div>
                <div className="mt-1">
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                    latamThreats[selectedCountry].risk === "Crítico"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }`}>
                    {latamThreats[selectedCountry].risk.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#05070c] border border-slate-900 rounded-2xl p-3 text-[11px] text-slate-400 flex items-center gap-2 italic">
            <span className="text-xs">💡</span>
            "Cuidado con mensajes de texto de familiares en problemas pidiendo transferencias."
          </div>
        </div>
      </div>

      {/* Rankings tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            📱 Números de Extorsión Frecuentes
          </h3>
          <div className="space-y-2">
            {sortedNumbers.map(([num, count], i) => (
              <div key={i} className="flex justify-between items-center bg-[#05070c] border border-slate-900 p-3 rounded-2xl font-mono text-xs">
                <span className="text-slate-300 font-semibold">{num}</span>
                <span className="text-[10px] text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30">
                  {count} Denuncias
                </span>
              </div>
            ))}
            {sortedNumbers.length === 0 && (
              <div className="py-12 text-center text-slate-600 text-xs italic">Aún no hay reportes suficientes.</div>
            )}
          </div>
        </div>

        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            🌐 Dominios Phishing más Reportados
          </h3>
          <div className="space-y-2">
            {sortedDomains.map(([dom, count], i) => (
              <div key={i} className="flex justify-between items-center bg-[#05070c] border border-slate-900 p-3 rounded-2xl font-mono text-xs">
                <span className="text-slate-300 truncate max-w-[65%]">{dom}</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-900/30">
                  {count} Denuncias
                </span>
              </div>
            ))}
            {sortedDomains.length === 0 && (
              <div className="py-12 text-center text-slate-600 text-xs italic">Aún no hay reportes de dominios.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
