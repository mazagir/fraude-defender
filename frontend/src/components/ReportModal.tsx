import { useState } from "react";
import { FaExclamationTriangle, FaRobot, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import RiskBadge from "./RiskBadge";

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

export default function ReportModal({ onClose, onSubmit }: ReportModalProps) {
  const [form, setForm] = useState({ telefono_sospechoso: "", dominio: "", descripcion: "", banco_recaudo: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiLevel, setAiLevel] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const triggerAiScan = () => {
    if (!form.descripcion.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      let score = 30;
      const desc = form.descripcion.toLowerCase();
      const dom = form.dominio.toLowerCase();

      if (dom.includes(".xyz") || dom.includes(".click")) score += 30;
      if (desc.includes("estafa") || desc.includes("amenaza") || desc.includes("montadeudas")) score += 25;
      if (form.telefono_sospechoso.startsWith("+") && !form.telefono_sospechoso.startsWith("+57")) score += 15;

      score = Math.min(score, 100);
      setAiScore(score);
      setAiLevel(score >= 70 ? "alto" : score >= 40 ? "medio" : "bajo");
      setIsScanning(false);
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!form.descripcion.trim()) {
      setError("La descripción es requerida.");
      return;
    }
    if (!form.telefono_sospechoso && !form.dominio && !form.banco_recaudo) {
      setError("Debes ingresar al menos un indicador (teléfono, dominio o cuenta bancaria).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        phone_number: form.telefono_sospechoso,
        bank_account: form.banco_recaudo,
        domain: form.dominio,
        description: form.descripcion,
        risk_level: aiLevel.toUpperCase() || "BAJO",
      };

      await onSubmit(payload);
      onClose();
    } catch (e) {
      setError((e as Error)?.message || "Error al crear reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans select-none">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-[#070911] border border-slate-800/80 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[95vh] flex flex-col"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer text-sm z-10">
          <FaTimes />
        </button>

        <div className="p-6 pb-4 border-b border-slate-900 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">🛡️</div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Registrar Indicador IoC</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">AegisShield Risk Engine</p>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto shrink">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block mb-1">Descripción del Incidente *</label>
            <textarea
              rows={3}
              placeholder="Ej: Amenazas mediante WhatsApp cobrando cobro abusivo gota a gota..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              onBlur={triggerAiScan}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block mb-1">Teléfono Sospechoso</label>
              <input
                placeholder="+57312..."
                value={form.telefono_sospechoso}
                onChange={(e) => setForm({ ...form, telefono_sospechoso: e.target.value })}
                onBlur={triggerAiScan}
                className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block mb-1">Dominio / URL</label>
              <input
                placeholder="ejemplo.xyz"
                value={form.dominio}
                onChange={(e) => setForm({ ...form, dominio: e.target.value })}
                onBlur={triggerAiScan}
                className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block mb-1">Banco / Cuenta de Recaudo</label>
            <input
              placeholder="Nequi, Daviplata, Bancolombia..."
              value={form.banco_recaudo}
              onChange={(e) => setForm({ ...form, banco_recaudo: e.target.value })}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex items-center justify-between relative overflow-hidden min-h-[64px]">
            {isScanning ? (
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-xs font-mono text-cyan-400">Analizando indicadores con IA...</span>
              </div>
            ) : aiScore !== null ? (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Evaluación de Riesgo Previa</div>
                  <div className="text-xs font-bold text-slate-300 mt-1 flex items-center gap-1.5">
                    Riesgo Detectado: <RiskBadge level={aiLevel} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Puntuación Heurística</div>
                  <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{aiScore}/100</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs font-mono flex items-center gap-2">
                <FaRobot /> Rellena los datos para activar el pre-análisis de IA.
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-sans">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button onClick={onClose} className="px-4 py-2.5 border border-slate-850 bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 rounded-xl text-xs font-bold cursor-pointer transition-all">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || isScanning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? "Registrando..." : "Confirmar e Inyectar IoC"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

