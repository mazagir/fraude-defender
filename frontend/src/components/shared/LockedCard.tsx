import { motion } from "framer-motion";
import { FaLock, FaUserPlus } from "react-icons/fa";
import type { ReactNode } from "react";

interface LockedSectionProps {
  children: ReactNode;
  ctaText: string;
  benefitText: string;
  isLocked: boolean;
  onCtaClick: () => void;
}

export default function LockedSection({ children, ctaText, benefitText, isLocked, onCtaClick }: LockedSectionProps) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative group">
      <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", WebkitFilter: "blur(6px)" }}>
        {children}
      </div>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] rounded-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/50 flex items-center justify-center text-lg shadow-xl backdrop-blur-sm ring-4 ring-cyan-950">
          <FaLock className="text-cyan-400" />
        </div>
        <p className="text-[11px] text-slate-300 font-bold text-center max-w-[240px] leading-relaxed">
          {benefitText}
        </p>
        <button onClick={onCtaClick}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 hover:scale-105 flex items-center gap-2 active:scale-95">
          <FaUserPlus /> {ctaText}
        </button>
      </motion.div>
    </div>
  );
}
