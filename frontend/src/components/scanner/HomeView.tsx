import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLink, FaEnvelope, FaWhatsapp, FaQrcode, FaBrain, FaTrophy, FaSearch, FaShareAlt,
} from "react-icons/fa";
import RiskBadge from "../shared/RiskBadge";
import UrgencyCTA from "./UrgencyCTA";
import { trackEvent } from "../../services/analytics";
import { riskColor } from "../../constants/riskConfig";
import type { ScanResult } from "../../types";

interface HomeViewProps {
  scanType: string;
  setScanType: (t: string) => void;
  scanInput: string;
  setScanInput: (s: string) => void;
  emailDetails: { sender: string; subject: string; body: string };
  setEmailDetails: (d: { sender: string; subject: string; body: string }) => void;
  selectedQrCase: string;
  setSelectedQrCase: (s: string) => void;
  isScanning: boolean;
  scanLogs: string[];
  scanResult: ScanResult | null;
  setScanResult: (r: ScanResult | null) => void;
  runQuickScan: () => void;
  onRegisterPrompt: () => void;
  token: string | null;
}

const GLASS = "bg-[#070911]/60 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-black/20";

const actions = [
  { id: "url", label: "Analizar URL", icon: <FaLink />, placeholder: "Ej. https://banco-nacion-seguridad.tk/verificar", example: "https://cobranza-legal-rapida.xyz/pago?cedula=123456" },
  { id: "message", label: "Analizar SMS / Texto", icon: <FaEnvelope />, placeholder: "Pega el SMS sospechoso aquí...", example: "BANCOLOMBIA: Su cuenta sera bloqueada. Verifique ahora: bit.ly/3xK9zLm" },
  { id: "whatsapp", label: "Analizar WhatsApp", icon: <FaWhatsapp />, placeholder: "Pega el texto de extorsión aquí...", example: "Hola! Ganaste un premio de $50.000.000 COP en el sorteo EXITO. Reclama: https://premios-exito.win" },
  { id: "email", label: "Analizar Correo", icon: <FaEnvelope />, placeholder: "Detalles del correo electrónico", example: "De: soporte@paypal-fake.com\nAsunto: Actividad sospechosa detectada\nSu cuenta ha sido comprometida. Verifique sus credenciales." },
  { id: "qr", label: "Escanear QR", icon: <FaQrcode />, placeholder: "Selecciona un caso de ejemplo...", example: "" },
];

const qrCases = [
  { value: "QR de menu de restaurante que redirige a 'restaurant-pago-movil.top' — phishing de pagos moviles", label: "Colombia — QR en restaurante que roba datos de Nequi/Daviplata" },
  { value: "QR pegado en cajero automático que redirige a 'bancoconsola-verificacion.xyz/otp' — robo de OTP bancario", label: "México — QR en cajero que suplanta banco" },
  { value: "QR de bono de supermercado falso que redirige a 'sorteo-falabella-falso.com' — phishing de sorteos", label: "Chile — QR falso de sorteo Falabella" },
  { value: "QR de facturas de luz ANDE Paraguay que redirige a 'ande-paraguay-electricidad.com' — robo de datos", label: "Paraguay — QR de factura ANDE falsa" },
];

export default function HomeView({
  scanType, setScanType, scanInput, setScanInput,
  emailDetails, setEmailDetails,
  selectedQrCase, setSelectedQrCase,
  isScanning, scanLogs, scanResult, setScanResult,
  runQuickScan, onRegisterPrompt, token,
}: HomeViewProps) {
  const activeAction = actions.find((a) => a.id === scanType)!;
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");

  const handleShareResult = async () => {
    if (!scanResult) return;
    trackEvent("result_shared", { level: scanResult.level, score: scanResult.score, scan_type: scanType });
    const text = [
      "🛡️ AgielShield — Resultado del análisis",
      "",
      `Riesgo: ${scanResult.level} (${scanResult.score}%)`,
      `"${scanResult.explanation}"`,
      "",
      "Verifica tus enlaces y mensajes sospechosos gratis:",
      window.location.origin,
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "AgielShield", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareStatus("copied");
        window.setTimeout(() => setShareStatus("idle"), 2500);
      }
    } catch { /* el usuario canceló o el navegador bloqueó el acceso */ }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HERO */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
          Protege tus cuentas de{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 drop-shadow-md">
            Estafas y Phishing con IA
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base font-light leading-relaxed">
          Analiza gratis enlaces bancarios falsos, extorsiones de WhatsApp, montadeudas y correos sospechosos en segundos con nuestra IA optimizada para fraudes reales en LATAM.
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => { setScanType(action.id); setScanResult(null); setScanInput(""); }}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 cursor-pointer select-none ${
              scanType === action.id
                ? "bg-gradient-to-b from-blue-950/50 to-cyan-950/30 border-cyan-400/60 text-cyan-300 shadow-md shadow-cyan-500/10 backdrop-blur-md"
                : "bg-[#070911]/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700/60 hover:bg-[#070911]/70 hover:backdrop-blur-md hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${
              scanType === action.id
                ? "bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-400/20"
                : "bg-slate-900/80 text-slate-400 group-hover:bg-slate-800"
            }`}>
              {action.icon}
            </div>
            <span className="text-[11px] font-bold tracking-wide leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {/* INPUT WIDGET */}
      <div className={`max-w-3xl mx-auto ${GLASS} rounded-3xl p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-sm text-cyan-400">
              {activeAction.icon}
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{activeAction.label}</h3>
          </div>

          {scanType === "email" ? (
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1.5">Remitente / Email del Emisor</label>
                <input
                  type="text"
                  placeholder="Ej: alertaseguridad@bancolombia-bloqueo.com"
                  value={emailDetails.sender}
                  onChange={(e) => setEmailDetails({ ...emailDetails, sender: e.target.value })}
                  className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500/40 focus:shadow-[0_0_12px_rgba(6,182,212,0.08)] transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1.5">Asunto del Correo</label>
                  <input
                    type="text"
                    placeholder="Ej: SUSPENSIÓN INMEDIATA DE CUENTA"
                    value={emailDetails.subject}
                    onChange={(e) => setEmailDetails({ ...emailDetails, subject: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500/40 focus:shadow-[0_0_12px_rgba(6,182,212,0.08)] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1.5">Cuerpo / Texto del Correo</label>
                  <input
                    type="text"
                    placeholder="Ej: Hemos detectado actividad sospechosa..."
                    value={emailDetails.body}
                    onChange={(e) => setEmailDetails({ ...emailDetails, body: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500/40 focus:shadow-[0_0_12px_rgba(6,182,212,0.08)] transition-all"
                  />
                </div>
              </div>
            </div>
          ) : scanType === "qr" ? (
            <div className="space-y-4">
              <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Selecciona un escenario de código QR fraudulento a escanear</label>
              <select
                value={selectedQrCase}
                onChange={(e) => setSelectedQrCase(e.target.value)}
                className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-500/40 transition-all"
              >
                <option value="">-- Selecciona una plantilla de código QR para escanear --</option>
                {qrCases.map((c, i) => (
                  <option key={i} value={c.value}>{c.label}</option>
                ))}
              </select>
              <div className="border-2 border-dashed border-slate-700/80 rounded-2xl py-8 flex flex-col items-center justify-center text-slate-500 text-center cursor-pointer hover:border-cyan-500/30 transition-all hover:bg-cyan-500/5">
                <FaQrcode className="text-4xl mb-2 text-slate-600" />
                <span className="text-xs">O sube una captura de pantalla del código QR para decodificarlo</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                rows={3}
                placeholder={activeAction.placeholder}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full bg-[#05070c] border border-slate-700/80 rounded-2xl px-5 py-4 text-xs text-slate-200 outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all font-sans placeholder:text-slate-600 placeholder:text-center leading-relaxed resize-none"
              />
              <div className="absolute right-3 bottom-3 text-[9px] text-slate-600 font-mono pointer-events-none">
                {scanInput.length} caracteres
              </div>
            </div>
          )}

          <div className="flex flex-col items-end gap-2 pt-2">
            <button
              onClick={runQuickScan}
              disabled={isScanning}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 flex items-center gap-2 active:scale-[0.98]"
            >
              {isScanning ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <FaSearch className="text-slate-950" /> Analizar con AgielShield
                </>
              )}
            </button>
            <UrgencyCTA />
          </div>
        </div>

        {/* SCANNING OVERLAY */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#070911]/95 z-25 flex flex-col items-center justify-center p-6 text-center select-none rounded-3xl"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-500/5 flex items-center justify-center mb-6 relative">
                <span className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-cyan-500/5 opacity-50" />
              </div>
              <div className="max-w-md space-y-2 font-mono text-[10px] text-cyan-400/90 text-left">
                {scanLogs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2"
                  >
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SCAN RESULT */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className={`${GLASS} rounded-3xl p-6 space-y-6 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center border-b border-slate-800 pb-3 gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FaBrain className="text-cyan-400" /> Evaluación de Riesgo de la IA
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleShareResult}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer border active:scale-[0.97] ${
                      shareStatus === "copied"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/5"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {shareStatus === "copied" ? "✓ ¡Copiado!" : (<><FaShareAlt /> Compartir</>)}
                    </span>
                  </button>
                  <RiskBadge level={scanResult.level} />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="64" cy="64" r="54"
                      stroke={riskColor[scanResult.level.toLowerCase()] || riskColor.critical}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - scanResult.score / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold font-mono" style={{ color: riskColor[scanResult.level.toLowerCase()] || riskColor.critical }}>
                      {scanResult.score}%
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">Confianza</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h4 className="text-sm font-extrabold text-slate-200">¿Qué significa este resultado?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "{scanResult.explanation}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-900">
                <div className="space-y-3">
                  <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Indicadores Sospechosos</h5>
                  <div className="space-y-1.5">
                    {scanResult.indicators.map((ind, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-slate-300 items-start">
                        <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                        <span>{ind}</span>
                      </div>
                    ))}
                    {scanResult.indicators.length === 0 && (
                      <div className="text-xs text-slate-500 italic">No se hallaron amenazas conocidas.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Recomendaciones del SOC</h5>
                  <div className="space-y-1.5">
                    {scanResult.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-slate-300 items-start">
                        <span className="text-emerald-400 mt-1 flex-shrink-0">✓</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {scanResult.veredicto_dominio && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 mt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🌐</span>
                    <h5 className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Verificación de Dominio (autenticidad)</h5>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {scanResult.veredicto_dominio.es_real === true && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wide">Dominio legítimo verificado</span>
                    )}
                    {scanResult.veredicto_dominio.es_real === false && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wide">⚠ Dominio fraudulento / imitación</span>
                    )}
                    {scanResult.veredicto_dominio.es_real === null && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-700/20 border border-slate-600/30 text-slate-400 text-[10px] font-bold uppercase tracking-wide">Dominio no asociado a entidad financiera</span>
                    )}
                    {scanResult.veredicto_dominio.marca_imita && (
                      <span className="text-xs text-slate-300">Intenta suplantar a <b className="text-red-400">{scanResult.veredicto_dominio.marca_imita}</b></span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {scanResult.veredicto_dominio.razones?.map((razon: string, idx: number) => (
                      <div key={idx} className="flex gap-2 text-xs text-slate-400 items-start">
                        <span className="text-amber-400 mt-1 flex-shrink-0">🔎</span>
                        <span>{razon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!token && (
                <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-5 mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <h5 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 justify-center md:justify-start">
                      <FaTrophy /> ¡Obtén tu Insignia de Guardia Alerta!
                    </h5>
                    <p className="text-[11px] text-slate-400 max-w-md">
                      Regístrate gratis para almacenar este análisis, activar alertas tempranas automáticas de fraudes por WhatsApp y subir de nivel en la comunidad.
                    </p>
                  </div>
                  <button
                    onClick={onRegisterPrompt}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wide cursor-pointer transition-all shrink-0 shadow-md shadow-blue-500/10 active:scale-[0.98]"
                  >
                    Registrarme Gratis
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
