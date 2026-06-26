import { motion } from "framer-motion";
import { FaLock, FaUserPlus } from "react-icons/fa";
import type { ReactNode } from "react";

interface LockedCardProps {
  children: ReactNode;
  title?: string;
  onRegister: () => void;
}

export default function LockedCard({ children, title, onRegister }: LockedCardProps) {
  return (
    <div className="relative group">
      <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", WebkitFilter: "blur(6px)" }}>
        {children}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/40 to-slate-950/80 rounded-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/50 flex items-center justify-center text-lg shadow-xl backdrop-blur-sm">
          <FaLock className="text-cyan-400" />
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-200">
            {title || "Contenido Exclusivo"}
          </p>
          <p className="text-[10px] text-slate-500 font-mono max-w-[220px] mx-auto">
            Crea una cuenta gratis para acceder a estadísticas personalizadas y más herramientas.
          </p>
        </div>

        <button onClick={onRegister}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-slate-950 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-2">
          <FaUserPlus /> Registrarme Gratis
        </button>
      </motion.div>
    </div>
  );
}