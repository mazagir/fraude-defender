import { FaLock, FaUserPlus } from "react-icons/fa";

interface CyberRadarSkeletonProps {
  onCtaClick?: () => void;
}

export default function CyberRadarSkeleton({ onCtaClick }: CyberRadarSkeletonProps) {
  return (
    <div className="relative w-full h-[300px] bg-[#05070c] rounded-2xl overflow-hidden border border-cyan-900/20">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 border border-dashed border-cyan-500/20 rounded-full" />
          <div className="absolute inset-4 border border-dashed border-cyan-500/25 rounded-full animate-[spin_40s_linear_infinite]" />
          <div className="absolute inset-12 border border-dashed border-cyan-500/30 rounded-full animate-[spin_25s_linear_infinite_reverse]" />
          <div className="absolute inset-20 border border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite]" />
          <div className="absolute inset-28 border border-dashed border-cyan-500/15 rounded-full" />

          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-red-500 rounded-full animate-ping shadow-lg shadow-red-500/50" />
          <div className="absolute top-1/2 right-1/4 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping shadow-lg shadow-yellow-400/50" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping shadow-lg shadow-red-500/50" style={{ animationDelay: "1.2s" }} />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping shadow-lg shadow-cyan-400/50" style={{ animationDelay: "0.8s" }} />

          <div className="absolute top-[45%] left-[45%] w-3 h-3 bg-cyan-500/40 rounded-full blur-sm" />
        </div>
      </div>

      <div className="absolute bottom-3 left-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-emerald-400/70 font-mono tracking-wide">RADAR ACTIVO</span>
      </div>
      <div className="absolute bottom-3 right-4 text-[8px] text-cyan-500/40 font-mono">
        {new Date().toLocaleTimeString("es-ES", { hour12: false })}
      </div>

      {onCtaClick && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col items-center justify-end pb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/50 flex items-center justify-center text-sm shadow-xl backdrop-blur-sm ring-4 ring-cyan-950 mb-2">
            <FaLock className="text-cyan-400" />
          </div>
          <p className="text-[11px] text-slate-300 font-bold text-center max-w-[240px] leading-relaxed mb-3">
            Visualiza ataques de phishing geolocalizados en LATAM
          </p>
          <button onClick={onCtaClick}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 hover:scale-105 flex items-center gap-2 active:scale-95">
            <FaUserPlus /> Desbloquear Mapa en Vivo
          </button>
        </div>
      )}
    </div>
  );
}
