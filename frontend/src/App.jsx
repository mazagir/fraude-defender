import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaShieldAlt, FaTerminal, FaSync, FaExclamationTriangle, FaCheckCircle, 
  FaInfoCircle, FaMap, FaUser, FaChartLine, FaRobot, FaLock, FaGlobe, 
  FaBrain, FaEye, FaPowerOff, FaBug, FaDatabase, FaPlus, FaChevronRight, FaTimes, FaUserPlus,
  FaTrash
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "https://fraude-defender-api.onrender.com";

const riskColor = { alto: "#ff4d6d", medio: "#ffb547", bajo: "#00e5b4" };
const riskBg   = { alto: "rgba(255,77,109,0.12)", medio: "rgba(255,181,71,0.12)", bajo: "rgba(0,229,180,0.1)" };

function getRiskLevel(score) {
  if (score >= 70) return "alto";
  if (score >= 40) return "medio";
  return "bajo";
}

function buildMonthlyData(reports) {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const map = {};
  months.forEach((m) => { map[m] = { name: m, alto: 0, medio: 0, bajo: 0 }; });
  reports.forEach((r) => {
    const date = new Date(r.created_at || Date.now());
    const key = months[date.getMonth()];
    const lvl = getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0);
    if (map[key]) map[key][lvl]++;
  });
  return Object.values(map);
}

function buildTrendData(reports) {
  const days = {};
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toLocaleDateString("es-CO", { weekday: "short" });
    days[key] = { name: key, reportes: 0 };
  }
  reports.forEach((r) => {
    const d = new Date(r.created_at || Date.now());
    if (now - d.getTime() <= 7 * 86400000) {
      const key = d.toLocaleDateString("es-CO", { weekday: "short" });
      if (days[key]) days[key].reportes++;
    }
  });
  return Object.values(days);
}

// ─── API FETCH con token explícito ─────────────────────────────────────────
async function apiFetch(url, token, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
}

// ─── COMPONENT: RISK BADGE ────────────────────────────────────────────────
function RiskBadge({ level }) {
  const l = (level || "bajo").toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${riskBg[l]} border-white/5`} style={{ color: riskColor[l] || riskColor.bajo }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: riskColor[l] || riskColor.bajo }} />
      {l.toUpperCase()}
    </span>
  );
}

// ─── COMPONENT: LANDING VIEW ─────────────────────────────────────────────
function LandingView({ onLaunch, onPublicView }) {
  const [stats, setStats] = useState({ attacks: 489122, speed: 12, detection: 99.98 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        attacks: prev.attacks + Math.floor(Math.random() * 3) + 1
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 cyber-grid relative overflow-hidden flex flex-col font-sans select-none">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
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

      {/* Hero Section */}
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

        {/* CTAs */}
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

        {/* Live Counters */}
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

      {/* Features showcase */}
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

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-600 border-t border-slate-900/80 bg-slate-950">
        © 2026 AegisShield Threat Intelligence Platform. Reservados todos los derechos. Seguridad de nivel gubernamental.
      </footer>
    </div>
  );
}

// ─── COMPONENT: LOGIN & REGISTER VIEW ──────────────────────────────────────
function LoginView({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", nombre: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAction = async () => {
    if (!form.username || !form.password || (isRegister && !form.nombre)) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (isRegister) {
        // REGISTRO
        const res = await fetch(`${API_BASE}/api/v1/auth/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: form.nombre, email: form.username, password: form.password })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Error en el registro.");
        }
        setSuccess("Registro exitoso. Inicia sesión ahora.");
        setIsRegister(false);
      } else {
        // INICIO SESIÓN
        const body = new URLSearchParams({ username: form.username, password: form.password });
        const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
          method: "POST",
          body,
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        if (!res.ok) throw new Error("Credenciales inválidas");
        const data = await res.json();
        const receivedToken = data.access_token || data.token || Object.values(data)[0];
        if (!receivedToken) throw new Error("No se recibió token del servidor");
        onLogin(receivedToken);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070c] cyber-grid flex items-center justify-center p-4 text-slate-200 select-none relative">
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute w-full h-full scanline-overlay pointer-events-none opacity-[0.12]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl glass-panel glow-blue relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-blue-500/10 mb-4 animate-pulse">🛡️</div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Consola AegisShield</h2>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-mono">SOC ACCESO RESTRINGIDO</p>
        </div>

        <div className="space-y-4 font-sans">
          {isRegister && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1.5">Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Ingresa tu nombre" 
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleAction()}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1.5">Correo Corporativo</label>
            <input 
              type="email" 
              placeholder="nombre@empresa.com" 
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1.5">Contraseña de Seguridad</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400">
              <FaExclamationTriangle /> {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              <FaCheckCircle /> {success}
            </motion.div>
          )}

          <button 
            onClick={handleAction} 
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold tracking-wider uppercase text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
          >
            {loading ? "Procesando..." : isRegister ? "Registrar Credenciales" : "Acceder al Sistema"}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800/60 text-center">
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
            }}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
          >
            {isRegister ? (
              <>¿Ya tienes cuenta? <span className="font-bold text-blue-400">Inicia Sesión</span></>
            ) : (
              <>¿No tienes credenciales? <span className="font-bold text-cyan-400">Registrar cuenta</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── COMPONENT: SIDEBAR ───────────────────────────────────────────────────
function Sidebar({ view, setView, reportsCount, onLogout, isOpen, setIsOpen }) {
  const navItems = [
    { id: "dashboard", icon: <FaTerminal />, label: "Consola SOC" },
    { id: "reportes",  icon: <FaShieldAlt />, label: "Indicadores IoC", badge: reportsCount },
    { id: "amenazas",  icon: <FaExclamationTriangle />, label: "Vectores de Ataque" },
    { id: "intel",     icon: <FaBrain />, label: "Threat Intelligence" },
  ];
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[230px] border-r border-slate-800/80 bg-[#070911]/95 flex flex-col flex-shrink-0 h-screen transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} backdrop-blur-md`}>
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/10 text-lg">🛡️</div>
            <div>
              <div className="font-extrabold text-sm text-slate-100 tracking-wide">AegisShield</div>
              <div className="text-[8px] text-cyan-400 tracking-[2px] font-bold uppercase">SOC CONTROL</div>
            </div>
          </div>
          <button className="md:hidden text-slate-400 text-xl" onClick={() => setIsOpen(false)}><FaTimes /></button>
        </div>
      <nav className="flex-1 p-4 space-y-1.5 font-sans">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-2.5 mb-2.5">SISTEMA</div>
        {navItems.map((item) => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              view === item.id 
                ? "bg-blue-600/10 text-cyan-400 border border-blue-500/20 shadow-inner" 
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-transparent"
            }`}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
            {item.badge > 0 && (
              <span className="ml-auto bg-red-500/90 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      {/* User Session Info */}
      <div className="p-4 border-t border-slate-800/50 space-y-3 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 text-xs font-bold font-mono">AN</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-300 truncate">Analista SOC</div>
            <div className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVO
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full py-2 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <FaPowerOff size={10} /> Cerrar Consola
        </button>
      </div>
    </aside>
    </>
  );
}

// ─── COMPONENT: WORLD THREAT HOTSPOT MAP (CINEMATIC SVG) ────────────────────
function WorldThreatMap() {
  const [beacons, setBeacons] = useState([
    { id: 1, x: 220, y: 150, risk: "alto", name: "EE.UU. (East)" },
    { id: 2, x: 310, y: 260, risk: "alto", name: "Colombia (Bogotá Hub)" },
    { id: 3, x: 480, y: 120, risk: "medio", name: "Alemania (Frankfurt)" },
    { id: 4, x: 720, y: 180, risk: "bajo", name: "Japón (Tokyo Server)" },
    { id: 5, x: 350, y: 310, risk: "alto", name: "Brasil (São Paulo)" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBeacons(prev => prev.map(b => {
        if (Math.random() > 0.6) {
          const risks = ["alto", "medio", "bajo"];
          return { ...b, risk: risks[Math.floor(Math.random() * risks.length)] };
        }
        return b;
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative bg-[#070911] border border-slate-800/80 rounded-2xl p-5 overflow-hidden flex flex-col justify-between h-[300px]">
      <div className="absolute inset-0 cyber-grid-dots opacity-20 pointer-events-none" />
      <div className="flex justify-between items-center mb-2 z-10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FaGlobe className="text-blue-500 animate-spin-slow" /> Threat Hotspot Map
        </h3>
        <div className="flex gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Alto</span>
          <span className="flex items-center gap-1 text-yellow-400"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Medio</span>
          <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Bajo</span>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center relative">
        {/* World Map SVG Mock */}
        <svg viewBox="0 0 900 400" className="w-full h-full max-h-[220px] opacity-25">
          {/* North America */}
          <path d="M120 70 L 190 60 L 260 80 L 280 140 L 240 180 L 180 160 L 160 110 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* South America */}
          <path d="M260 210 L 310 220 L 360 270 L 340 360 L 310 370 L 280 290 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Europe */}
          <path d="M430 70 L 490 60 L 530 110 L 480 160 L 440 120 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Africa */}
          <path d="M440 180 L 510 180 L 560 230 L 530 320 L 490 320 L 460 230 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Asia */}
          <path d="M540 60 L 780 70 L 820 180 L 760 270 L 680 280 L 580 220 L 540 150 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Connections lines */}
          <path d="M 310 260 Q 400 100 480 120" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="5 5" className="animate-pulse" />
          <path d="M 220 150 Q 260 200 310 260" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 310 260 Q 500 280 720 180" fill="none" stroke="#00e5b4" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Pulse Beacons */}
        {beacons.map(b => (
          <div 
            key={b.id} 
            className="absolute"
            style={{ 
              left: `${(b.x / 900) * 100}%`, 
              top: `${(b.y / 400) * 100}%` 
            }}
          >
            <span className={`flex h-4 w-4 relative items-center justify-center -translate-x-1/2 -translate-y-1/2`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                b.risk === "alto" ? "bg-red-500" : b.risk === "medio" ? "bg-yellow-500" : "bg-emerald-500"
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                b.risk === "alto" ? "bg-red-500" : b.risk === "medio" ? "bg-yellow-500" : "bg-emerald-500"
              } shadow-md`} />
            </span>
            <div className="absolute left-3 -top-2 scale-75 origin-left bg-slate-950/90 border border-slate-800 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-slate-300 hidden md:block select-none pointer-events-none">
              {b.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENT: EXPLAINABLE AI REASONING PANEL ─────────────────────────────
function AIReasoningPanel({ selectedReport }) {
  // Datos mock para cuando no hay reporte seleccionado
  const defaultReport = {
    descripcion: "Reporte de prueba: dominio de cobro abusivo gota a gota.",
    phone_number: "+573129871109",
    bank_account: "Nequi - 3129871109",
    domain: "rapicreditos-colombia.xyz",
    risk_score: 84
  };

  const r = selectedReport || defaultReport;
  const level = getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0);
  const color = riskColor[level];

  return (
    <div className="bg-[#070911] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 font-sans select-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FaBrain className="text-cyan-400 animate-pulse" /> AI Threat Assessment
        </h3>
        <span className="text-[10px] text-cyan-400/80 bg-cyan-950/20 border border-cyan-800/30 px-2 py-0.5 rounded font-mono font-bold">
          EXPLAINABLE AI
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Progress Gauge */}
        <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
            <circle 
              cx="40" cy="40" r="34" 
              stroke={color} 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - (r.score_riesgo ?? r.risk_score ?? 70) / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-mono" style={{ color }}>{r.score_riesgo ?? r.risk_score ?? 70}%</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider">Confianza</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Indicador Evaluado</div>
          <div className="text-sm font-bold text-slate-200 truncate mt-0.5">
            {r.dominio ?? r.domain ? (r.dominio ?? r.domain) : r.telefono_sospechoso ?? r.phone_number ? (r.telefono_sospechoso ?? r.phone_number) : "Multiple IoC"}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed italic">
            "{r.descripcion ?? r.description}"
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs border-t border-slate-800/50 pt-3">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Factores de Riesgo Clave</div>
        
        <div className="flex justify-between items-center py-1 border-b border-slate-900">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> TLD de Alto Riesgo
          </span>
          <span className="font-mono text-cyan-400 font-bold">Si (.xyz / .click)</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-900">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> Coincidencia de Patrón Estafa
          </span>
          <span className="font-mono text-cyan-400 font-bold">Alto</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-900">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> Geolocalización de Llamada
          </span>
          <span className="font-mono text-slate-300">LATAM (Colombia)</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" /> Banco Recaudador Asociado
          </span>
          <span className="font-mono text-yellow-400 font-bold">{r.banco_recaudo ?? r.bank_account ? "Registrado" : "No detectado"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: DASHBOARD VIEW ─────────────────────────────────────────────
function DashboardView({ reports, onTriggerAttackSimulation, isSimulatingAttack }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [simulatedLogs, setSimulatedLogs] = useState([
    { id: 1, time: "10:52:10", type: "info", text: "Iniciando AegisShield SOC Core..." },
    { id: 2, time: "10:52:12", type: "success", text: "Conexión Supabase DB - OK." },
    { id: 3, time: "10:52:18", type: "warning", text: "Búsqueda sospechosa detectada en lista negra." },
    { id: 4, time: "10:52:25", type: "danger", text: "Phishing detectado en el dominio: rapicredito.xyz" }
  ]);

  const total  = reports.length;
  const altos  = reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "alto").length;
  const medios = reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "medio").length;
  const bajos  = reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "bajo").length;
  
  const monthlyData = buildMonthlyData(reports);
  const trendData   = buildTrendData(reports);
  
  const pieData = [
    { name: "Alto",  value: altos || 1,  color: "#ff4d6d" },
    { name: "Medio", value: medios || 1, color: "#ffb547" },
    { name: "Bajo",  value: bajos || 1,  color: "#00e5b4" },
  ];

  // Logs stream simulator
  useEffect(() => {
    const pool = [
      { type: "info", text: "Escaneando indicadores de compromiso (IoC)..." },
      { type: "success", text: "Envenenador de base de datos ejecutó contramedida activa." },
      { type: "warning", text: "Tráfico inusual detectado desde IP de hosting en AWS." },
      { type: "danger", text: "Dominio fraudulento reportado: Nequi-verificacion.xyz" },
      { type: "info", text: "Sincronizando logs con feeds de CrowdStrike y SentinelOne." },
      { type: "warning", text: "Múltiples solicitudes fallidas al endpoint de autenticación." },
      { type: "danger", text: "Alerta de fraude: número de teléfono +57 301 984 8122 asociado a extorsiones." }
    ];

    const interval = setInterval(() => {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      setSimulatedLogs(prev => [
        { id: Date.now(), time: timeStr, ...randomItem },
        ...prev.slice(0, 30) // Cap at 30 logs
      ]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Escuchar cuando el usuario gatilla simulación de ataque
  useEffect(() => {
    if (isSimulatingAttack) {
      const now = new Date();
      const timeStr = () => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      };
      
      setSimulatedLogs(prev => [
        { id: Date.now(), time: timeStr(), type: "danger", text: "🚨 [ATTACK SIMULATION] SQL injection attempt on /api/v1/auth/login" },
        { id: Date.now() + 1, time: timeStr(), type: "danger", text: "🚨 [ATTACK SIMULATION] Potential phishing campaign detected: 'Daviplata Regalos'" },
        { id: Date.now() + 2, time: timeStr(), type: "danger", text: "🚨 [ATTACK SIMULATION] Threat engine flagged brute force: 100+ requests/sec" },
        ...prev
      ]);
    }
  }, [isSimulatingAttack]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Reportes", val: total, color: "#2563eb", icon: <FaShieldAlt className="text-blue-500" />, desc: "IoCs en base de datos" },
          { label: "Alertas Críticas", val: altos, color: "#ff4d6d", icon: <FaExclamationTriangle className="text-red-500" />, desc: "Requieren atención" },
          { label: "Riesgo Medio", val: medios, color: "#ffb547", icon: <FaInfoCircle className="text-yellow-500" />, desc: "En observación" },
          { label: "Bajo Control", val: bajos, color: "#00e5b4", icon: <FaCheckCircle className="text-emerald-500" />, desc: "Bajo riesgo" }
        ].map((m, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-[#070911] border border-slate-800/80 glow-border-blue relative overflow-hidden transition-all duration-300 font-sans shadow-md"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }} />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{m.label}</p>
                <h2 className="text-3xl font-bold font-mono tracking-tight text-slate-200 mt-2">{m.val}</h2>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{m.desc}</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/60 text-lg">
                {m.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts & Radar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-[#070911] border border-slate-800/80 rounded-2xl p-5 select-none relative overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaChartLine className="text-blue-500" /> Tendencia de Amenazas (7 Días)
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 px-2 py-0.5 rounded font-mono font-bold">
              LIVE
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.03)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ background: '#090d16', border: '1px solid rgba(99,130,255,0.15)', borderRadius: '12px', fontSize: '11px', color: '#e8ecf8' }} 
                itemStyle={{ color: '#00e5b4' }}
              />
              <Area type="monotone" dataKey="reportes" stroke="#2563eb" strokeWidth={2} fill="url(#gradBlue)" dot={{ fill: "#2563eb", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Threat Radar / Distribution Chart */}
        <div className="bg-[#070911] border border-slate-800/80 rounded-2xl p-5 select-none relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaBug className="text-red-500 animate-pulse" /> Threat Analysis Radar
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[160px]">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" 
                  innerRadius={48} 
                  outerRadius={65} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#090d16', border: '1px solid rgba(99,130,255,0.15)', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-[10px] font-mono border-t border-slate-900 pt-3 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#ff4d6d]" /> Alto</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#ffb547]" /> Medio</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#00e5b4]" /> Bajo</div>
          </div>
        </div>
      </div>

      {/* Map and AI Explainability Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorldThreatMap />
        <AIReasoningPanel selectedReport={selectedReport} />
      </div>

      {/* Telemetry Console & Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Terminal/Log Consol */}
        <div className="lg:col-span-2 bg-[#070911] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-[350px]">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaTerminal className="text-cyan-400" /> Live Threat Console
            </h3>
            <button 
              onClick={onTriggerAttackSimulation}
              className="text-[9px] font-bold uppercase tracking-wider bg-red-950/40 border border-red-500/30 hover:bg-red-900/20 text-red-400 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Simular Ataque
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px] leading-relaxed scrollbar-thin">
            {simulatedLogs.map((log) => (
              <div key={log.id} className="flex gap-2.5 items-start">
                <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                <span className={`flex-shrink-0 px-1 py-0.2 rounded text-[9px] font-bold ${
                  log.type === "danger" ? "bg-red-500/10 text-red-400" :
                  log.type === "warning" ? "bg-yellow-500/10 text-yellow-400" :
                  log.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-slate-300 break-words">{log.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Report Table */}
        <div className="lg:col-span-3 bg-[#070911] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-[350px]">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaDatabase className="text-blue-500" /> Últimos Indicadores IoC
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">Haz clic para evaluar en IA</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                  <th className="py-2.5 font-bold">ID</th>
                  <th className="py-2.5 font-bold">Indicador / Dominio</th>
                  <th className="py-2.5 font-bold">Riesgo</th>
                  <th className="py-2.5 font-bold text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs font-sans">
                {reports.slice(0, 7).map((r, idx) => {
                  const level = getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0);
                  return (
                    <tr 
                      key={r.id ?? idx} 
                      onClick={() => setSelectedReport(r)}
                      className={`hover:bg-slate-900/30 transition-colors cursor-pointer group ${
                        selectedReport?.id === r.id ? "bg-slate-900/40" : ""
                      }`}
                    >
                      <td className="py-3 font-mono text-slate-500">#{r.id}</td>
                      <td className="py-3 font-medium text-slate-200">
                        <div className="max-w-[200px] truncate">{r.dominio || r.telefono_sospechoso || "MULTIPLE"}</div>
                        <div className="text-[10px] text-slate-500 max-w-[200px] truncate">{r.descripcion}</div>
                      </td>
                      <td className="py-3"><RiskBadge level={level} /></td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                          <FaEye size={10} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500 text-xs font-mono">
                      No hay reportes registrados en Supabase.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: REPORTES VIEW ──────────────────────────────────────────────
function ReportesView({ reports, onDelete, token, onOpenModal }) {
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("todos");

  const filtered = reports.filter((r) => {
    const level = getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0);
    const matchRisk = filterRisk === "todos" || level === filterRisk;
    const q = search.toLowerCase();
    const matchSearch = !q 
      || (r.descripcion || "").toLowerCase().includes(q) 
      || String(r.id).includes(q) 
      || (r.telefono_sospechoso || "").includes(q) 
      || (r.dominio || "").includes(q);
    return matchRisk && matchSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#070911] border border-slate-800/80 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Base de Datos de Amenazas</h2>
          <p className="text-xs text-slate-500 mt-1">Busca, filtra y administra Indicadores de Compromiso (IoCs) del SOC.</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 rounded-xl font-bold tracking-wide text-xs transition-all cursor-pointer shadow-md"
        >
          <FaPlus size={11} /> Nuevo Reporte
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 w-full justify-between">
        <input 
          placeholder="🔍 Buscar amenaza (ID, Teléfono, Dominio)..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#070911] border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors" 
        />
        <div className="flex gap-2 flex-wrap">
          {["todos","alto","medio","bajo"].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilterRisk(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filterRisk === f 
                  ? "bg-blue-600/10 text-cyan-400 border-blue-500/30" 
                  : "bg-[#070911] text-slate-400 border-slate-800/80 hover:bg-slate-900/40"
              }`}
            >
              {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#070911] border border-slate-800/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-850 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <th className="p-4 font-bold">ID</th>
                <th className="p-4 font-bold">Descripción de la Amenaza</th>
                <th className="p-4 font-bold">Teléfono</th>
                <th className="p-4 font-bold">Dominio</th>
                <th className="p-4 font-bold">Score</th>
                <th className="p-4 font-bold">Riesgo</th>
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              <AnimatePresence>
                {filtered.map((r, i) => {
                  const level = getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0);
                  const fecha = r.created_at ? new Date(r.created_at).toLocaleDateString("es-CO") : "—";
                  return (
                    <motion.tr 
                      key={r.id} 
                      initial={{ opacity: 0, y: 6 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }} 
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-slate-900/20 transition-colors group"
                    >
                      <td className="p-4 font-mono text-slate-500">#{r.id}</td>
                      <td className="p-4 font-medium text-slate-200 max-w-[200px] truncate" title={r.descripcion}>
                        {r.descripcion}
                      </td>
                      <td className="p-4 font-mono text-slate-400">{r.telefono_sospechoso || "—"}</td>
                      <td className="p-4 text-slate-400 font-medium">{r.dominio || "—"}</td>
                      <td className="p-4 font-bold font-mono" style={{ color: riskColor[level] }}>
                        {r.score_riesgo ?? r.risk_score ?? 0}
                      </td>
                      <td className="p-4"><RiskBadge level={level} /></td>
                      <td className="p-4 text-slate-500 font-mono">{fecha}</td>
                      <td className="p-4 text-right">
                        {token && (
                          <button 
                            onClick={() => onDelete(r.id)} 
                            className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 p-2 rounded-xl transition-all cursor-pointer"
                            title="Eliminar IoC"
                          >
                            <FaTrash size={11} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500 text-xs font-mono">
                    No se encontraron IoCs registrados.
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

// ─── COMPONENT: AMENAZAS VIEW ──────────────────────────────────────────────
function AmenazasView({ reports }) {
  const telefonos = {}, dominios = {};
  reports.forEach((r) => {
    if (r.telefono_sospechoso) telefonos[r.telefono_sospechoso] = (telefonos[r.telefono_sospechoso] || 0) + 1;
    if (r.dominio) dominios[r.dominio] = (dominios[r.dominio] || 0) + 1;
  });
  
  const topTel = Object.entries(telefonos).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const topDom = Object.entries(dominios).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const altos  = reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "alto").slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans select-none">
      {/* Top Telephones */}
      <div className="bg-[#070911] border border-slate-800/80 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
          📱 Teléfonos más Reportados
        </h3>
        {topTel.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">Sin datos registrados aún.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topTel.map(([t, c]) => ({ name: t.slice(-10), count: c }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.03)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#090d16', border: '1px solid rgba(99,130,255,0.15)', borderRadius: '8px', fontSize: '10px' }} />
              <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Domains */}
      <div className="bg-[#070911] border border-slate-800/80 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
          🌐 Dominios más Reportados
        </h3>
        {topDom.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">Sin datos registrados aún.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topDom.map(([d, c]) => ({ name: d.length > 15 ? d.slice(0, 12) + "..." : d, count: c }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.03)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#090d16', border: '1px solid rgba(99,130,255,0.15)', borderRadius: '8px', fontSize: '10px' }} />
              <Bar dataKey="count" fill="#00e5b4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Critical Threats List */}
      <div className="lg:col-span-2 bg-[#070911] border border-slate-800/80 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          🔥 Amenazas Críticas de Alta Prioridad
        </h3>
        <div className="space-y-3">
          {altos.map((r, i) => (
            <motion.div 
              key={r.id} 
              initial={{ opacity: 0, x: -8 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.05 }}
              className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-slate-200">{r.descripcion}</div>
                <div className="flex gap-4 text-[10px] text-slate-500 font-mono mt-1">
                  {r.telefono_sospechoso && <span>📱 {r.telefono_sospechoso}</span>}
                  {r.dominio && <span>🌐 {r.dominio}</span>}
                  {r.banco_recaudo && <span>🏦 {r.banco_recaudo}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-red-400">Score: {r.score_riesgo ?? r.risk_score}%</span>
                <RiskBadge level="alto" />
              </div>
            </motion.div>
          ))}
          {altos.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">No hay amenazas críticas registradas.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: THREAT INTEL VIEW ──────────────────────────────────────────
function ThreatIntelView({ reports }) {
  const blacklistTel = [...new Set(reports.filter((r) => r.telefono_sospechoso).map((r) => r.telefono_sospechoso))];
  const blacklistDom = [...new Set(reports.filter((r) => r.dominio).map((r) => r.dominio))];
  const blacklistBan = [...new Set(reports.filter((r) => r.banco_recaudo ?? r.bank_account).map((r) => r.banco_recaudo ?? r.bank_account))];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans select-none">
      {[
        { title: "📵 Teléfonos Bloqueados", items: blacklistTel, icon: "📱", color: "text-red-400" },
        { title: "🌐 Dominios en Lista Negra", items: blacklistDom, icon: "🌐", color: "text-blue-400" },
        { title: "🏦 Cuentas Identificadas", items: blacklistBan, icon: "🏦", color: "text-emerald-400" }
      ].map((list, i) => (
        <div key={i} className="bg-[#070911] border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[400px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
            <span>{list.icon} {list.title}</span>
            <span className="font-mono text-[10px] text-slate-500">({list.items.length})</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {list.items.map((item, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 font-mono text-xs flex justify-between items-center">
                <span className="text-slate-300 truncate max-w-[80%]">{item}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              </div>
            ))}
            {list.items.length === 0 && (
              <div className="py-24 text-center text-slate-600 text-xs font-mono">Sin registros guardados.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPONENT: MODAL REGISTRO DE REPORTE ──────────────────────────────────
function ReportModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ telefono_sospechoso: "", dominio: "", descripcion: "", banco_recaudo: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiScore, setAiScore] = useState(null);
  const [aiLevel, setAiLevel] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Simulación de escaneo/análisis de IA local pre-submit
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
    if (!form.descripcion.trim()) { setError("La descripción es requerida."); return; }
    if (!form.telefono_sospechoso && !form.dominio && !form.banco_recaudo) {
      setError("Debes ingresar al menos un indicador (teléfono, dominio o cuenta bancaria).");
      return;
    }
    setLoading(true); setError("");
    try {
      // Mapea los campos esperados por el backend en snake_case inglés
      const payload = {
        phone_number: form.telefono_sospechoso,
        bank_account: form.banco_recaudo,
        domain: form.dominio,
        description: form.descripcion,
        risk_level: aiLevel.toUpperCase() || "BAJO"
      };
      await onSubmit(payload);
      onClose();
    }
    catch (e) {
      setError(e.message || "Error al crear reporte.");
    }
    finally {
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

          {/* AI Pre-evaluation scanning */}
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
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 border border-slate-850 bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
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

// ─── COMPONENT: PUBLIC REPORTS VIEW ──────────────────────────────────────
function PublicReportsView({ onBack, onNewReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPublic() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/reportes/publico/listar`);
        if (res.ok) {
          const data = await res.json();
          setReports(data.slice(0, 50)); // Mostrar los últimos 50
        }
      } catch (e) {
        console.error("Error cargando reportes públicos", e);
      }
      setLoading(false);
    }
    loadPublic();
  }, []);

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-200 cyber-grid flex flex-col font-sans relative">
      <header className="w-full py-4 md:py-5 px-4 md:px-6 border-b border-slate-800/60 flex flex-col md:flex-row justify-between items-center bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 gap-3 md:gap-0">
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-lg border border-slate-700">👁️</div>
          <div>
            <div className="font-extrabold text-lg text-slate-100">Portal Público de Denuncias</div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">AegisShield</div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={onNewReport} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-red-900/50 flex-1 md:flex-none justify-center">
            <FaExclamationTriangle /> Denunciar
          </button>
          <button onClick={onBack} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs transition-colors cursor-pointer flex-1 md:flex-none justify-center">
            Volver
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaShieldAlt className="text-blue-500"/> Últimas Alertas Comunitarias</h2>
        {loading ? (
          <div className="text-center py-20 text-slate-500 animate-pulse font-mono">Cargando base de datos pública...</div>
        ) : (
          <div className="grid gap-4">
            {reports.map((r, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <RiskBadge level={r.risk_level ?? r.riesgo} />
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="font-bold text-slate-100">{r.domain ?? r.phone_number ?? "Múltiples IoCs"}</span> - {r.description}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Score Riesgo</div>
                  <div className="text-xl font-bold font-mono text-cyan-400">{r.risk_score ?? r.score_riesgo ?? "N/A"}/100</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [inConsole, setInConsole]   = useState(false);
  const [inPublicView, setInPublicView] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [token, setToken]           = useState(() => localStorage.getItem("aegis_token") || "");
  const [view, setView]             = useState("dashboard");
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [error, setError]           = useState("");
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);

  // ── fetch con token explícito para evitar race condition ──
  const fetchReports = useCallback(async (tkn) => {
    const t = tkn !== undefined ? tkn : token;
    if (!t) return;
    setLoading(true); setError("");
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/reportes`, t);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        // Normaliza nombres de campos para que la UI funcione con el backend
        setReports(
          list.map((r) => ({
            ...r,
            telefono_sospechoso: r.telefono_sospechoso ?? r.phone_number,
            banco_recaudo: r.banco_recaudo ?? r.bank_account,
            dominio: r.dominio ?? r.domain,
            descripcion: r.descripcion ?? r.description,
            score_riesgo: r.score_riesgo ?? r.risk_score,
            riesgo: r.riesgo ?? r.risk_level,
          }))
        );
      } else if (res.status === 401) {
        setError("Sesión expirada. Inicia sesión de nuevo.");
      } else {
        setError("Error al cargar reportes.");
      }
    } catch {
      setError("No se pudo conectar con la API.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchReports(token);
    const iv = setInterval(() => fetchReports(token), 30000);
    return () => clearInterval(iv);
  }, [token, fetchReports]);

  const handleLogin = (newToken) => {
    localStorage.setItem("aegis_token", newToken);
    setToken(newToken);
    setTimeout(() => fetchReports(newToken), 100);
  };

  const handleLogout = () => {
    setToken(""); 
    localStorage.removeItem("aegis_token"); 
    setReports([]);
    setInConsole(false);
  };

  const handleCreateReport = async (form) => {
    const res = await apiFetch(`${API_BASE}/api/v1/reportes`, token, { 
      method: "POST", 
      body: JSON.stringify(form) 
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Error al crear reporte");
    }
    await fetchReports(token);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el reporte #${id}?`)) return;
    const res = await apiFetch(`${API_BASE}/api/v1/reportes/${id}`, token, { method: "DELETE" });
    if (res.ok) await fetchReports(token);
  };

  const handleTriggerAttackSimulation = async () => {
    setIsSimulatingAttack(true);
    try {
      const mockThreats = [
        {
          description: "🚨 [SIMULATED ATTACK] Inyección SQL & Fuerza Bruta detectada.",
          phone_number: "+573009990000",
          domain: "sqli-attack-source.xyz",
          bank_account: "Nequi - 3009990000",
          risk_level: "alto"
        },
        {
          description: "🚨 [SIMULATED ATTACK] Campaña activa de phishing imitando portal corporativo.",
          phone_number: "+573155554444",
          domain: "verificar-aegis-shield.click",
          bank_account: "Daviplata - 3155554444",
          risk_level: "alto"
        }
      ];

      for (const threat of mockThreats) {
        await handleCreateReport(threat);
      }
    } catch (e) {
      console.error("Error al simular ataque en base de datos:", e);
    }
    setTimeout(() => setIsSimulatingAttack(false), 2000); // Reset after 2s
  };

  // 1. Mostrar landing page si el usuario no ha hecho click en "Iniciar Consola" ni en "Ver Reportes Públicos"
  if (!inConsole && !inPublicView && !token) {
    return <LandingView 
      onLaunch={() => setInConsole(true)} 
      onPublicView={() => setInPublicView(true)}
    />;
  }

  // 1.5 Vista pública anónima
  if (inPublicView && !token) {
    return (
      <>
        <PublicReportsView 
          onBack={() => setInPublicView(false)} 
          onNewReport={() => setShowModal(true)} 
        />
        <AnimatePresence>
          {showModal && (
            <ReportModal 
              onClose={() => setShowModal(false)} 
              onSubmit={async (form) => {
                const res = await fetch(`${API_BASE}/api/v1/reportes/publico`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(form)
                });
                if (res.ok) {
                  setShowModal(false);
                  setInPublicView(false);
                  setTimeout(() => setInPublicView(true), 100); // Hacky reload
                } else {
                  throw new Error("Error registrando denuncia");
                }
              }} 
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // 2. Si dio click en iniciar consola pero no está autenticado, pide login
  if (!token) {
    return <LoginView onLogin={handleLogin} />;
  }

  const viewTitles = { 
    dashboard: "SOC Command Center", 
    reportes: "Módulo de Reportes IoC", 
    amenazas: "Vectores de Amenazas Activos", 
    intel: "Threat Intelligence Feeds" 
  };

  return (
    <div className="flex min-h-screen bg-[#05070c] text-slate-100 font-sans relative overflow-hidden select-none">
      {/* Screen Red Flash Overlay on attack simulation */}
      <AnimatePresence>
        {isSimulatingAttack && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        view={view} 
        setView={(v) => { setView(v); setIsSidebarOpen(false); }} 
        reportsCount={reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "alto").length} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header console */}
        <header className="h-[60px] bg-[#070911]/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-slate-400 hover:text-slate-200 text-xl"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <div className="text-sm font-bold text-slate-200">{viewTitles[view]}</div>
              <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
                AegisShield Platform · {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {loading && <div className="text-[10px] text-slate-500 font-mono animate-pulse">⟳ Cargando...</div>}
            {error && <div className="text-[10px] text-red-400 font-mono">{error}</div>}
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> CONECTADO
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-[11px] rounded-lg tracking-wide transition-all cursor-pointer shadow-md"
            >
              + Nuevo Reporte
            </button>
          </div>
        </header>

        {/* Content body */}
        <main className="p-4 md:p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={view} 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }} 
              transition={{ duration: 0.18 }}
            >
              {view === "dashboard" && (
                <DashboardView 
                  reports={reports} 
                  onTriggerAttackSimulation={handleTriggerAttackSimulation}
                  isSimulatingAttack={isSimulatingAttack}
                />
              )}
              {view === "reportes" && (
                <ReportesView 
                  reports={reports} 
                  onDelete={handleDelete} 
                  token={token} 
                  onOpenModal={() => setShowModal(true)} 
                />
              )}
              {view === "amenazas" && <AmenazasView reports={reports} />}
              {view === "intel" && <ThreatIntelView reports={reports} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showModal && (
          <ReportModal 
            onClose={() => setShowModal(false)} 
            onSubmit={handleCreateReport} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
