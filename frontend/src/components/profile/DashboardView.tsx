import { motion } from "framer-motion";
import { FaShieldAlt, FaGlobe, FaTrophy, FaLock, FaFire, FaCopy, FaCheck } from "react-icons/fa";
import { useState, Suspense, lazy } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import RiskBadge from "../shared/RiskBadge";
import LockedSection from "../shared/LockedCard";
import CyberRadarSkeleton from "../shared/CyberRadarSkeleton";
import { getRiskLevel, riskColor } from "../../constants/riskConfig";
import { LOCKED_SECTIONS } from "../../constants/lockedSectionConfig";
import type { LockedSectionId } from "../../constants/lockedSectionConfig";
import type { UserData } from "../../types";
const WorldThreatMap = lazy(() => import("../WorldThreatMap"));

interface ScanHistoryItem {
  id: number;
  type: string;
  query: string;
  score: number;
  level: string;
  date: string;
}

interface DashboardViewProps {
  token: string | null;
  user: UserData | null;
  reports: any[];
  scanHistory: ScanHistoryItem[];
  userReputation: number;
  userLevel: string;
  unlockedBadges: string[];
  setAuthMode: (m: string) => void;
  streak: number;
  mfaActive: boolean;
  mfaQrCode: string;
  mfaSecret: string;
  mfaUri: string;
  showMfaSetup: boolean;
  setShowMfaSetup: (s: boolean) => void;
  mfaVerifyCode: string;
  setMfaVerifyCode: (s: string) => void;
  setupMfa: () => void;
  enableMfa: () => void;
  disableMfa: () => void;
  verifyMfaLogin: () => void;
  mfaPartialToken: string;
}

const badgeDetails: Record<string, { label: string; desc: string; icon: string }> = {
  escudo_inicial: { label: "Escudo Inicial", desc: "Realizaste tu primer escaneo contra estafas.", icon: "🛡️" },
  defensor_registrado: { label: "Héroe Registrado", desc: "Activaste tu cuenta de autodefensa.", icon: "🔐" },
  cazador_phishing: { label: "Cazador de Phishing", desc: "Detectaste una URL de alto riesgo.", icon: "🕷️" },
  primer_reporte: { label: "Primer Reporte", desc: "Reportaste un IoC sospechoso a la base de datos.", icon: "🤝" },
};

const LEADERBOARD = [
  { pais: "México", reports: 2108, risk: "Crítico" },
  { pais: "Argentina", reports: 1450, risk: "Alto" },
  { pais: "Colombia", reports: 1244, risk: "Alto" },
  { pais: "Perú", reports: 890, risk: "Medio" },
  { pais: "Chile", reports: 720, risk: "Medio" },
];

export default function DashboardView({
  token, user, reports, scanHistory,
  userReputation, userLevel, unlockedBadges,
  setAuthMode, streak,
  mfaActive, mfaQrCode, mfaSecret, mfaUri, showMfaSetup, setShowMfaSetup,
  mfaVerifyCode, setMfaVerifyCode,
  setupMfa, enableMfa, disableMfa, verifyMfaLogin, mfaPartialToken,
}: DashboardViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySecret = () => {
    if (mfaSecret) {
      navigator.clipboard.writeText(mfaSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const criticalCount = reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "critical").length;
  const highCount = reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "alto").length;
  const mediumCount = reports.filter((r) => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "medio").length;

  const historyAverage =
    scanHistory.length > 0
      ? Math.round(scanHistory.reduce((acc, h) => acc + h.score, 0) / scanHistory.length)
      : 0;

  const personalRiskText = historyAverage >= 70 ? "Alerta" : historyAverage >= 40 ? "Moderado" : "Seguro";
  const personalRiskColor = historyAverage >= 70 ? "#ff4d6d" : historyAverage >= 40 ? "#ffb547" : "#00e5b4";

  const trendData = scanHistory.slice(-10).reverse().map((h, i) => ({
    name: `#${i + 1}`,
    score: h.score,
  }));

  const typeCounts: Record<string, number> = {};
  scanHistory.forEach((h) => { typeCounts[h.type] = (typeCounts[h.type] || 0) + 1; });
  const chartData = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

  const isGuest = !token;
  const locked = (id: LockedSectionId) => ({
    ...LOCKED_SECTIONS[id],
    isLocked: isGuest,
    onCtaClick: () => setAuthMode("register"),
  });

  const RiskScoreMeter = (
    <div className="flex flex-col items-center justify-center flex-grow w-full">
      <div className="flex items-center justify-center py-4">
        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="46" stroke="rgba(255,255,255,0.03)" strokeWidth="7" fill="transparent" />
            <circle cx="56" cy="56" r="46" stroke={personalRiskColor} strokeWidth="7" fill="transparent" strokeDasharray={`${2 * Math.PI * 46}`} strokeDashoffset={`${2 * Math.PI * 46 * (1 - (historyAverage || 10) / 100)}`} strokeLinecap="round" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold font-mono" style={{ color: personalRiskColor }}>{historyAverage}%</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Estado</span>
          </div>
        </div>
      </div>
      <div className="text-center text-xs font-bold text-slate-400 border-t border-slate-900 pt-3 w-full">
        Nivel de Exposición: <span style={{ color: personalRiskColor }}>{personalRiskText}</span>
      </div>
    </div>
  );

  const ThreatStats = (
    <div className="flex flex-col justify-between flex-grow w-full">
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-900">
          <span className="text-slate-400 text-xs">Críticas / Inmediatas</span>
          <span className="font-mono text-xs font-bold text-red-500">{criticalCount}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-900">
          <span className="text-slate-400 text-xs">Riesgo Alto</span>
          <span className="font-mono text-xs font-bold text-orange-400">{highCount}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-900">
          <span className="text-slate-400 text-xs">En Observación</span>
          <span className="font-mono text-xs font-bold text-yellow-400">{mediumCount}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-slate-400 text-xs">Total IoCs Registrados</span>
          <span className="font-mono text-xs font-bold text-cyan-400">{reports.length}</span>
        </div>
      </div>
      <div className="text-[10px] text-slate-500 font-mono text-center">Última sincronización: Hace unos segundos</div>
    </div>
  );

  const BadgesGrid = (
    <div className="grid grid-cols-4 gap-3 py-2 flex-grow items-center w-full">
      {Object.keys(badgeDetails).map((bKey) => {
        const b = badgeDetails[bKey];
        const unlocked = unlockedBadges.includes(bKey);
        return (
          <div key={bKey} className={`flex flex-col items-center justify-center p-2.5 rounded-xl border relative group cursor-help overflow-hidden ${unlocked ? "bg-slate-900/40 border-cyan-500/20" : "bg-[#05070c] border-slate-800/60"}`}>
            <span className="text-2xl transition-all duration-300" style={unlocked ? {} : { filter: "blur(3px)", opacity: 0.35 }}>{b.icon}</span>
          </div>
        );
      })}
    </div>
  );

  const TrendChartSection = (
    <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Tendencia de Riesgo (últimos escaneos)</h3>
      {trendData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "12px" }} />
            <Line type="monotone" dataKey="score" stroke="#00e5b4" strokeWidth={2} dot={{ fill: "#00e5b4", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-slate-600 text-xs font-mono">Sin datos de tendencia</div>
      )}
    </div>
  );

  const TypeChartSection = (
    <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Escaneos por Tipo</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="type" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "12px" }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-slate-600 text-xs font-mono">Sin escaneos aún</div>
      )}
    </div>
  );

  const WorldMapSection = (
    <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <FaGlobe className="text-emerald-400" /> Mapa Mundial de Amenazas
      </h3>
      <div className="relative">
        {isGuest ? (
          <CyberRadarSkeleton onCtaClick={() => setAuthMode("register")} />
        ) : (
          <Suspense fallback={<div className="h-[300px] bg-[#05070c] rounded-2xl flex items-center justify-center text-xs text-slate-500">Cargando mapa...</div>}>
            <WorldThreatMap />
          </Suspense>
        )}
      </div>
    </div>
  );

  const LeaderboardSection = (
    <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <FaTrophy className="text-yellow-500" /> Leaderboard Semanal por País
      </h3>
      <div className="space-y-2">
        {LEADERBOARD.map((entry, i) => (
          <div key={entry.pais} className="flex items-center justify-between bg-[#05070c] border border-slate-900 p-3 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-500 w-6 text-center">#{i + 1}</span>
              <span className="text-xs font-bold text-slate-200">{entry.pais}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-400 font-mono">{entry.reports.toLocaleString()} reportes</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${entry.risk === "Crítico" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"}`}>{entry.risk}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-3xl shadow-lg border border-slate-700 font-bold text-slate-950">
            {token ? user?.nombre?.slice(0, 2) : "AN"}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-200">
              {token ? `¡Hola, ${user?.nombre}!` : "Invitado"}
            </h2>
            <div className="flex gap-2 items-center justify-center md:justify-start mt-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-[10px] font-bold">
                {userLevel}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {userReputation} Reputación XP
              </span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-500">
            <span>Rango de Ciberdefensa</span>
            <span className="text-cyan-400">{userReputation} / 300 XP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((userReputation / 300) * 100, 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full shadow-sm shadow-cyan-400/30"
            />
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <FaFire className="text-orange-400 text-xs" />
              <span className="text-[10px] font-bold text-orange-400">{streak} día{streak !== 1 ? "s" : ""} de racha</span>
              <span className="text-[9px] text-slate-500 font-mono">· ¡Sigue así!</span>
            </div>
          )}
          {isGuest && (
            <div className="pt-2">
              <button onClick={() => setAuthMode("register")}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-slate-950 font-bold text-[9px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-md">
                + Crear Cuenta Gratis
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[280px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FaShieldAlt className="text-blue-500" /> Risk Score Personal
          </h3>
          <LockedSection {...locked("riskScore")}>{RiskScoreMeter}</LockedSection>
        </div>

        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[280px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FaGlobe className="text-cyan-400" /> Amenazas en Observación
          </h3>
          <LockedSection {...locked("amenazas")}>{ThreatStats}</LockedSection>
        </div>

        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[280px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FaTrophy className="text-yellow-500 animate-pulse" /> Mis Logros e Insignias
          </h3>
          <LockedSection {...locked("insignias")}>{BadgesGrid}</LockedSection>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LockedSection {...locked("trends")}>{TrendChartSection}</LockedSection>
        <LockedSection {...locked("trends")}>{TypeChartSection}</LockedSection>
      </div>

      {WorldMapSection}

      <LockedSection {...locked("leaderboard")}>{LeaderboardSection}</LockedSection>

      {token && (
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <FaLock className="text-emerald-400" /> Autenticación de Dos Factores (2FA)
            </h3>
            {mfaActive && (
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                ACTIVO
              </span>
            )}
          </div>

          {!showMfaSetup ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {mfaActive
                  ? "La autenticación de dos factores está activa. Se solicitará un código TOTP al iniciar sesión."
                  : "Aumenta la seguridad de tu cuenta con autenticación de dos factores vía app de autenticación (Google Authenticator, Authy, etc.)."}
              </p>
              <div className="flex gap-2">
                {!mfaActive ? (
                  <button onClick={setupMfa}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-[10px] tracking-wide uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10">
                    Activar 2FA
                  </button>
                ) : (
                  <button onClick={disableMfa}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold text-[10px] tracking-wide uppercase rounded-xl transition-all cursor-pointer">
                    Desactivar 2FA
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {mfaPartialToken ? (
                <div>
                  <p className="text-xs text-yellow-400 mb-3 font-bold">
                    Esta cuenta requiere 2FA. Ingresa el código de tu app de autenticación.
                  </p>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="000000"
                      value={mfaVerifyCode}
                      onChange={(e) => setMfaVerifyCode(e.target.value)}
                      className="w-32 bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors font-mono text-center tracking-[0.3em]"
                      maxLength={6} />
                    <button onClick={verifyMfaLogin}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-[10px] tracking-wide uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10">
                      Verificar
                    </button>
                  </div>
                </div>
              ) : mfaQrCode ? (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <img src={mfaQrCode} alt="QR para 2FA" className="w-40 h-40 rounded-xl border border-slate-800" />
                    <span className="text-[8px] text-slate-500 font-mono">Escanea con tu app</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    <p className="text-xs text-slate-400">
                      1. Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc.)
                    </p>
                    <p className="text-xs text-slate-400">
                      2. O ingresa manualmente esta clave secreta en tu app:
                    </p>
                    <div className="flex items-center gap-2 bg-[#05070c] border border-slate-800 rounded-xl px-4 py-2.5">
                      <code className="text-xs font-mono text-cyan-400 break-all flex-1">{mfaSecret}</code>
                      <button onClick={handleCopySecret} className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer" title="Copiar secreto">
                        {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                      </button>
                    </div>
                    {mfaUri && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        URI: <span className="text-cyan-400 break-all">{mfaUri}</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">
                      3. Ingresa el código de 6 dígitos generado por la app para verificar:
                    </p>
                    <div className="flex gap-2 items-center">
                      <input type="text" placeholder="000000"
                        value={mfaVerifyCode}
                        onChange={(e) => setMfaVerifyCode(e.target.value)}
                        className="w-32 bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors font-mono text-center tracking-[0.3em]"
                        maxLength={6} />
                      <button onClick={enableMfa}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-[10px] tracking-wide uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10">
                        Verificar y Activar
                      </button>
                      <button onClick={() => setShowMfaSetup(false)}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-bold text-[10px] tracking-wide uppercase rounded-xl transition-all cursor-pointer">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-6">
        <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Historial de Análisis Personal
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Últimos escaneos</span>
        </div>

        <LockedSection {...locked("historial")}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-2">Tipo</th>
                <th className="py-2">Elemento Escaneado</th>
                <th className="py-2">Puntuación</th>
                <th className="py-2">Severidad</th>
                <th className="py-2 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">Regístrate para ver tu historial completo</td>
              </tr>
            </tbody>
          </table>
        </LockedSection>
      </div>
    </div>
  );
}
