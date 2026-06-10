import { motion, AnimatePresence } from "framer-motion";
import {
  FaLink, FaEnvelope, FaWhatsapp, FaQrcode, FaBrain, FaTrophy,
} from "react-icons/fa";
import RiskBadge from "../shared/RiskBadge";
import UrgencyCTA from "./UrgencyCTA";
import { riskColor } from "../../constants/riskConfig";

export default function HomeView({
  scanType, setScanType, scanInput, setScanInput,
  emailDetails, setEmailDetails,
  selectedQrCase, setSelectedQrCase,
  isScanning, scanLogs, scanResult, setScanResult,
  runQuickScan, onRegisterPrompt, token,
}) {
  const actions = [
    { id: "url", label: "Analizar URL", icon: <FaLink />, placeholder: "Ej. http://soporte-nequibanca-alerta.xyz" },
    { id: "message", label: "Analizar SMS / Texto", icon: <FaEnvelope />, placeholder: "Pega el SMS sospechoso de paquetería o trabajo aquí..." },
    { id: "whatsapp", label: "Analizar WhatsApp", icon: <FaWhatsapp />, placeholder: "Pega el texto de extorsión o reclutamiento gota a gota..." },
    { id: "email", label: "Analizar Correo", icon: <FaEnvelope />, placeholder: "Detalles del correo electrónico" },
    { id: "qr", label: "Escanear QR", icon: <FaQrcode />, placeholder: "Sube o selecciona un caso de QR sospechoso" },
  ];

  const qrCases = [
    { value: "QR Menú de restaurante que redirige a 'restaurant-pago-movil.top'", label: "QR Menú de restaurante físico sospechoso" },
    { value: "QR Pegado en cajero automático que redirige a 'bancoconsola-verificacion.xyz/otp'", label: "QR Pegado en cajero o ventanilla bancaria" },
    { value: "QR recibido por correo para reclamar un bono de compra de $150 USD en supermercado", label: "QR de Bono de supermercado falso" },
  ];

  const activeAction = actions.find((a) => a.id === scanType);

  return (
    <div className="space-y-8 font-sans">
      {/* Dynamic Header Pitch */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Protege tus cuentas de <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 drop-shadow-md">
            Estafas y Phishing con IA
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base font-light">
          Analiza gratis enlaces bancarios falsos, extorsiones de WhatsApp, montadeudas y correos sospechosos en segundos con nuestra IA optimizada para fraudes reales en LATAM.
        </p>
      </div>

      {/* Quick Actions Grid Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => { setScanType(action.id); setScanResult(null); setScanInput(""); }}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer select-none ${
              scanType === action.id
                ? "bg-gradient-to-b from-blue-950/40 to-cyan-950/20 border-cyan-400/50 text-cyan-300 shadow-md shadow-blue-500/5"
                : "bg-[#070911]/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700/50 hover:bg-[#070911]/80"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              scanType === action.id ? "bg-cyan-500/10 text-cyan-300 animate-pulse" : "bg-slate-900 text-slate-400"
            }`}>
              {action.icon}
            </div>
            <span className="text-[11px] font-bold tracking-wide">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main Glassmorphic Input Widget */}
      <div className="max-w-3xl mx-auto bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="text-cyan-400 text-sm">{activeAction.icon}</span>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{activeAction.label}</h3>
          </div>

          {scanType === "email" ? (
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Remitente / Email del Emisor</label>
                <input
                  type="text"
                  placeholder="Ej: alertaseguridad@bancolombia-bloqueo.com"
                  value={emailDetails.sender}
                  onChange={(e) => setEmailDetails({ ...emailDetails, sender: e.target.value })}
                  className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Asunto del Correo</label>
                  <input
                    type="text"
                    placeholder="Ej: SUSPENSIÓN INMEDIATA DE CUENTA"
                    value={emailDetails.subject}
                    onChange={(e) => setEmailDetails({ ...emailDetails, subject: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1 font-bold">Cuerpo / Texto del Correo</label>
                  <input
                    type="text"
                    placeholder="Ej: Hemos detectado actividad sospechosa..."
                    value={emailDetails.body}
                    onChange={(e) => setEmailDetails({ ...emailDetails, body: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
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
                className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-500/50 transition-colors"
              >
                <option value="">-- Selecciona una plantilla de código QR para escanear --</option>
                {qrCases.map((c, i) => (
                  <option key={i} value={c.value}>{c.label}</option>
                ))}
              </select>
              <div className="border-2 border-dashed border-slate-800 rounded-2xl py-8 flex flex-col items-center justify-center text-slate-500 text-center cursor-pointer hover:border-cyan-500/30 transition-all">
                <FaQrcode className="text-4xl mb-2 text-slate-600" />
                <span className="text-xs">O sube una captura de pantalla del código QR para decodificarlo</span>
              </div>
            </div>
          ) : (
            <textarea
              rows={4}
              placeholder={activeAction.placeholder}
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full bg-[#05070c] border border-slate-850 rounded-2xl px-5 py-4 text-xs text-slate-200 outline-none focus:border-cyan-500/30 transition-all font-sans"
            />
          )}

          <div className="flex flex-col items-end gap-2 pt-2">
            <button
              onClick={runQuickScan}
              disabled={isScanning}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-lg shadow-blue-500/10 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <FaBrain className="text-slate-950" /> Analizar con AgiShield AI
                </>
              )}
            </button>
            {/* 🔴 CTA de urgencia */}
            <UrgencyCTA />
          </div>
        </div>

        {/* Dynamic Scanning Log overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#070911]/95 z-25 flex flex-col items-center justify-center p-6 text-center select-none"
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

      {/* --- ANALYSIS REPORT RESULT --- */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-[#070911] border border-slate-800/80 rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Header result */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FaBrain className="text-cyan-400" /> Evaluación de Riesgo de la IA
                </h3>
                <RiskBadge level={scanResult.level} />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Score Progress Radial Gauge */}
                <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="64" cy="64" r="54"
                      stroke={riskColor[scanResult.level.toLowerCase()] || riskColor.bajo}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - scanResult.score / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold font-mono" style={{ color: riskColor[scanResult.level.toLowerCase()] }}>
                      {scanResult.score}%
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">Confianza</span>
                  </div>
                </div>

                {/* Explanation block */}
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h4 className="text-sm font-extrabold text-slate-200">¿Qué significa este resultado?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "{scanResult.explanation}"
                  </p>
                </div>
              </div>

              {/* Indicators and Actions lists */}
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

              {/* GROWTH HOOK: Persuasive Registration Banner */}
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
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wide cursor-pointer transition-all shrink-0 shadow-md shadow-blue-500/10"
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
