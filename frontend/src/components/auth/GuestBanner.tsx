import { motion } from 'framer-motion';
import { FaUserSecret, FaTimes } from 'react-icons/fa';

interface GuestBannerProps {
  onRegister: () => void;
  onDismiss: () => void;
}

export default function GuestBanner({ onRegister, onDismiss }: GuestBannerProps) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
    >
      <div className="bg-[#0a0f1e]/95 border border-blue-500/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-2xl shadow-blue-500/10 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <FaUserSecret className="text-cyan-400 text-base" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-200 leading-tight">Estás protegido como Invitado</p>
            <p className="text-[10px] text-slate-400 truncate">Regístrate para guardar tu historial y desbloquear insignias</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onRegister}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-bold text-[10px] uppercase tracking-wide cursor-pointer transition-all hover:from-blue-500 hover:to-cyan-400 shadow-md">
            Registrarme
          </button>
          <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <FaTimes size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
