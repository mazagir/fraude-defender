import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaTerminal } from "react-icons/fa";

export default function LandingView({ onLaunch, onPublicView }) {
  const [stats, setStats] = useState({ attacks: 489122, speed: 12, detection: 99.98 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        attacks: prev.attacks + Math.floor(Math.random() * 3) + 1,
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 cyber-grid relative overflow-hidden flex flex-col font-sans select-none">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none" />

      <header className="w-full py-5 px-6 md:px-12 flex justify-between items-center border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-xl font-bold">🛡️</div>
          <div>
            <div className="font-extrabold text-lg tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">AegisShield</div>
            <div className="text-[9px] text-cyan-400 tracking-[3px] font-bold uppercase">Threat Intelligence</div>
          </div>
        </div>
        <button
          onClick={onLaunch}
          className="relative group overflow-hidden px-5 py-2.5 rounded-xl border border-blue-500/30 bg-blue-950/40 text-sm font-bold tracking-wide hover:border-cyan-400/50 transition-all cursor-pointer shadow-md"
        >
          <span className="relative z-10 flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
            <FaTerminal className="text-cyan-400 animate-pulse" /> INICIAR CONSOLA
          </span>
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-blue-600/20 to-emerald-500/20 transition-transform duration-500" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            IA & Detección de Amenazas Activa
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold leading-tight tracking-tight">
            AegisShield <br className="hidden md:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 drop-shadow-md">
              AI-Powered Threat Intelligence
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
            Mitigación avanzada de fraudes financieros, envenenamiento inteligente de bases de datos de estafadores ("montadeudas") y monitoreo automatizado de IoCs en tiempo real.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full justify-center"
        >
          <button
            onClick={onPublicView}
            className="px-8 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-extrabold text-base tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer shadow-lg border border-slate-600 flex items-center justify-center gap-2"
          >
            <FaEye /> Ver Reportes (Público)
          </button>
          <button
            onClick={onLaunch}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-slate-950 font-extrabold text-base tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            Acceder al SOC Command Center
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl mt-20 border border-slate-800/60 bg-slate-900/30 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="text-center py-2">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Amenazas Mitigadas</div>
            <div className="text-3xl font-bold font-mono text-cyan-400 mt-2">{stats.attacks.toLocaleString()}</div>
          </div>
          <div className="text-center py-2 border-y sm:border-y-0 sm:border-x border-slate-800/60">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Latencia de Detección</div>
            <div className="text-3xl font-bold font-mono text-blue-400 mt-2">{stats.speed} ms</div>
          </div>
          <div className="text-center py-2">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Efectividad de IA</div>
            <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">{stats.detection}%</div>
          </div>
        </motion.div>
      </main>

      <section className="w-full px-6 md:px-12 py-16 bg-slate-950/80 border-t border-slate-900 relative z-10 flex-shrink-0">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
            <h3 className="text-lg font-bold text-slate-200">Motor de Riesgo Heurístico</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Algoritmo impulsado por IA que escanea de forma proactiva números, dominios y cuentas en busca de patrones sospechosos.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
            <h3 className="text-lg font-bold text-slate-200">Defensa Activa (Decoys)</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Poisoning automatizado contra servidores de estafadores inyectando perfiles falsos para saturar e inutilizar sus bases de datos.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-purple-500/30 hover:bg-slate-900/60 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
            <h3 className="text-lg font-bold text-slate-200">Integración Corporativa</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Endpoints REST y soporte para X-API-KEY dual que permite conectar plataformas externas al SOC central en milisegundos.
            </p>
          </div>
        </div>
      </section>

      <footer className="w-full py-6 text-center text-xs text-slate-600 border-t border-slate-900/80 bg-slate-950">
        © 2026 AegisShield Threat Intelligence Platform. Reservados todos los derechos. Seguridad de nivel gubernamental.
      </footer>
    </div>
  );
}

