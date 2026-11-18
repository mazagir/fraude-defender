import { motion } from "framer-motion";
import { FaShieldAlt, FaTimes, FaUserPlus, FaUserSecret } from "react-icons/fa";

interface ReportSuccessModalProps {
  onRegister: () => void;
  onDismiss: () => void;
}

export default function ReportSuccessModal({ onRegister, onDismiss }: ReportSuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#070911] border border-emerald-500/30 rounded-3xl w-full max-w-md p-7 relative shadow-2xl shadow-emerald-500/5 space-y-6 text-center"
      >
        <button onClick={onDismiss} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-sm" aria-label="Cerrar">
          <FaTimes />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20 animate-pulse">
          🛡️
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-extrabold text-slate-100">Denuncia Recibida</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tu reporte ayuda a proteger a toda la comunidad LATAM.
          </p>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-1">
          <div className="text-2xl font-extrabold text-emerald-400">+30 XP</div>
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            Reputación Ciudadana
          </div>
        </div>

        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 text-left">
          <p className="text-xs text-slate-300 font-bold mb-2">🔓 Crea una cuenta gratis y obtén:</p>
          <ul className="text-[10px] text-slate-400 space-y-1.5 font-mono">
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Historial de escaneos guardado</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Estadísticas personalizadas de riesgo</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Mapa mundial de amenazas en vivo</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Insignias y racha de actividad</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button onClick={onRegister}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2">
            <FaUserPlus /> Crear Cuenta Gratis
          </button>
          <button onClick={onDismiss}
            className="w-full py-2.5 rounded-xl border border-slate-800 bg-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 font-semibold text-[11px] tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-2">
            <FaUserSecret /> Seguir como Invitado
          </button>
          <p className="text-[9px] text-slate-600 text-center font-mono">Sin compromiso — Nunca pedimos tu tarjeta</p>
        </div>
      </motion.div>
    </div>
  );
}