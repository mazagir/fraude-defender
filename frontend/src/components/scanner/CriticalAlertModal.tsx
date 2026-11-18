import { motion } from 'framer-motion';
import { FaSkull, FaTimes } from 'react-icons/fa';
import type { ScanResult } from '../../types';

interface CriticalAlertModalProps {
  result: ScanResult;
  onClose: () => void;
}

export default function CriticalAlertModal({ result, onClose }: CriticalAlertModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-[#0d0510] border border-red-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-red-500/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />

        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <FaSkull className="text-red-400 text-xl animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-wide">⚠ Amenaza Crítica Detectada</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Nivel de riesgo: CRÍTICO — Actúa ahora</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
              <FaTimes size={14} />
            </button>
          </div>

          <div className="flex items-center gap-4 bg-red-950/20 border border-red-500/15 rounded-2xl p-4">
            <div className="text-4xl font-extrabold font-mono text-red-400">{result.score}%</div>
            <div className="flex-1 space-y-1">
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.score}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                />
              </div>
              <p className="text-[9px] text-slate-400 font-mono">{result.explanation?.slice(0, 100)}...</p>
            </div>
          </div>

          {result.recommendations?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Acción inmediata</p>
              <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-300 border border-slate-800 flex gap-2">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                <span>{result.recommendations[0]}</span>
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs tracking-wider uppercase transition-all cursor-pointer">
            Entendido — Tomar Precauciones
          </button>
        </div>
      </motion.div>
    </div>
  );
}
