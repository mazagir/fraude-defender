import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShieldAlt, FaTerminal, FaExclamationTriangle, FaCheckCircle,
  FaInfoCircle, FaUser, FaChartLine, FaRobot, FaLock, FaGlobe,
  FaBrain, FaEye, FaPowerOff, FaBug, FaDatabase, FaPlus, FaTimes,
  FaTrash, FaQrcode, FaEnvelope, FaWhatsapp, FaLink, FaAward,
  FaTrophy, FaUserShield, FaCode, FaChevronRight, FaFilter
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "https://fraude-defender-api.onrender.com");

const riskColor = { critical: "#ff2a51", alto: "#ff4d6d", medio: "#ffb547", bajo: "#00e5b4" };
const riskBg = { critical: "rgba(255,42,81,0.12)", alto: "rgba(255,77,109,0.12)", medio: "rgba(255,181,71,0.12)", bajo: "rgba(0,229,180,0.1)" };

function getRiskLevel(score) {
  if (score >= 76) return "critical";
  if (score >= 51) return "alto";
  if (score >= 26) return "medio";
  return "bajo";
}

function RiskBadge({ level }) {
  const l = (level || "bajo").toLowerCase();
  const displayLabels = { critical: "CRÍTICO", alto: "ALTO", medio: "MEDIO", bajo: "BAJO" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold ${riskBg[l] || riskBg.bajo} border-white/5`} style={{ color: riskColor[l] || riskColor.bajo }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: riskColor[l] || riskColor.bajo }} />
      {displayLabels[l] || l.toUpperCase()}
    </span>
  );
}

export default function App() {
  // --- SESSION STATE ---
  const [token, setToken] = useState(() => localStorage.getItem("aegis_token") || "");
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("aegis_user");
    return cached ? JSON.parse(cached) : null;
  });

  // --- NAVIGATION STATE ---
  const [inConsole, setInConsole] = useState(false); // SOC Command Center (technical view)
  const [activeTab, setActiveTab] = useState("home"); // home, dashboard, community, developer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // --- DISPATCHED ACTIONS / MODALS ---
  const [showModal, setShowModal] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login, register, guest

  // --- GENERAL TELEMETRY ---
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);

  // --- REAL-TIME SCANNER STATE ---
  const [scanType, setScanType] = useState("url"); // url, message, whatsapp, email, qr
  const [scanInput, setScanInput] = useState("");
  const [emailDetails, setEmailDetails] = useState({ sender: "", subject: "", body: "" });
  const [selectedQrCase, setSelectedQrCase] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState([]);
  const [scanResult, setScanResult] = useState(null);

  // Persisted local scan history for gamification and conversion
  const [scanHistory, setScanHistory] = useState(() => {
    const cached = localStorage.getItem("aegis_scan_history");
    return cached ? JSON.parse(cached) : [
      { id: 1, type: "url", query: "verificar-nequi-pago.click", score: 85, level: "CRITICAL", date: "Hace 2 horas" },
      { id: 2, type: "whatsapp", query: "Hola ganaste un bono de compra de $500 USD...", score: 65, level: "HIGH", date: "Ayer" }
    ];
  });

  // Gamification metrics
  const [userReputation, setUserReputation] = useState(() => {
    return parseInt(localStorage.getItem("aegis_reputation") || "75");
  });
  const [userLevel, setUserLevel] = useState(() => {
    return localStorage.getItem("aegis_level") || "Novato Alerta";
  });
  const [unlockedBadges, setUnlockedBadges] = useState(() => {
    const cached = localStorage.getItem("aegis_badges");
    return cached ? JSON.parse(cached) : ["escudo_inicial"];
  });

  // Simulated live logs in SOC Developer console
  const [simulatedLogs, setSimulatedLogs] = useState([
    { id: 1, time: "17:10:12", type: "info", text: "Iniciando AegisShield SOC Core..." },
    { id: 2, time: "17:10:14", type: "success", text: "Conexión base de datos SQLite - OK." },
    { id: 3, time: "17:10:18", type: "warning", text: "Escaneo heurístico: Detectada firma sospechosa en URL." }
  ]);

  // Selected report for Explainable AI Panel
  const [selectedReport, setSelectedReport] = useState(null);

  // LATAM Hotspots map country details
  const [selectedCountry, setSelectedCountry] = useState("Colombia");
  const latamThreats = {
    Colombia: { attacks: 1244, threatType: "Gota a Gota / SMS Phishing Bancario (Nequi)", risk: "Alto" },
    México: { attacks: 2108, threatType: "Montadeudas / WhatsApp Extorsión", risk: "Crítico" },
    Perú: { attacks: 890, threatType: "Suplantación de Identidad / QR Menús Falsos", risk: "Medio" },
    Chile: { attacks: 720, threatType: "Phishing de Paquetería / Correos falsos", risk: "Medio" },
    Argentina: { attacks: 1450, threatType: "Suplantación de Billeteras Virtuales", risk: "Alto" }
  };

  // --- API FUNCTIONS ---
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  }, [token]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Intentamos cargar de endpoint público si no hay token, o autenticado si lo hay
      const url = token ? `${API_BASE}/api/v1/reportes` : `${API_BASE}/api/v1/reportes/publico/listar`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        const backendReports = Array.isArray(data) ? data : [];
        setReports(prev => {
          // Filtrar reportes locales temporales (id >= 100) que no existan en el backend
          const localOnly = prev.filter(r => r.id >= 100 && !backendReports.some(br =>
            (br.phone_number === r.phone_number || br.telefono_sospechoso === r.telefono_sospechoso) &&
            (br.domain === r.domain || br.dominio === r.dominio) &&
            (br.description === r.description || br.descripcion === r.descripcion)
          ));
          return [...localOnly, ...backendReports];
        });
      } else {
        setError("Error al cargar reportes. Ejecutando con datos de respaldo.");
        setReports(prev => {
          const localOnly = prev.filter(r => r.id >= 100);
          return [...localOnly, ...getFallbackReports()];
        });
      }
    } catch {
      setError("No se pudo conectar al servidor backend. Usando datos simulados.");
      setReports(prev => {
        const localOnly = prev.filter(r => r.id >= 100);
        return [...localOnly, ...getFallbackReports()];
      });
    } finally {
      setLoading(false);
    }
  }, [token, apiFetch]);

  useEffect(() => {
    fetchReports();
    // Auto-fetch data every 45s
    const iv = setInterval(fetchReports, 45000);
    return () => clearInterval(iv);
  }, [fetchReports]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("aegis_scan_history", JSON.stringify(scanHistory));
  }, [scanHistory]);

  useEffect(() => {
    localStorage.setItem("aegis_reputation", userReputation.toString());
    // Auto calculate user level based on points
    let newLevel = "Novato Alerta";
    if (userReputation >= 200) newLevel = "Guardián de la Comunidad";
    else if (userReputation >= 120) newLevel = "Vigilante Digital";
    setUserLevel(newLevel);
    localStorage.setItem("aegis_level", newLevel);
  }, [userReputation]);

  useEffect(() => {
    localStorage.setItem("aegis_badges", JSON.stringify(unlockedBadges));
  }, [unlockedBadges]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const body = new URLSearchParams({ username: email, password });
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      if (!res.ok) throw new Error("Credenciales inválidas");
      const data = await res.json();
      const receivedToken = data.access_token || data.token;

      localStorage.setItem("aegis_token", receivedToken);
      setToken(receivedToken);

      // Store user details mock/real
      const userData = { email, nombre: email.split("@")[0].toUpperCase(), rol: "analista" };
      localStorage.setItem("aegis_user", JSON.stringify(userData));
      setUser(userData);

      // Switch view
      setActiveTab("dashboard");
      fetchReports();
    } catch (e) {
      setError(e.message || "Error al iniciar sesión.");
      // MOCK LOGIN FOR DEVELOPMENT / DEMOS
      const userData = { email, nombre: email.split("@")[0].toUpperCase(), rol: "analista" };
      localStorage.setItem("aegis_token", "mock-token-12345");
      localStorage.setItem("aegis_user", JSON.stringify(userData));
      setToken("mock-token-12345");
      setUser(userData);
      setActiveTab("dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (nombre, email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Mostrar error legible según tipo de fallo
        let msg = err.detail || "Error en el registro.";
        if (Array.isArray(msg)) {
          msg = msg.map(e => e.msg || JSON.stringify(e)).join(", ");
        }
        if (typeof msg === "string" && msg.toLowerCase().includes("string_too_short")) {
          msg = "La contraseña debe tener al menos 12 caracteres.";
        }
        throw new Error(msg);
      }
      // Registro exitoso - iniciar sesión automáticamente
      await handleLogin(email, password);
      // Unlock badge for registration
      if (!unlockedBadges.includes("defensor_registrado")) {
        setUnlockedBadges(prev => [...prev, "defensor_registrado"]);
        setUserReputation(prev => prev + 50);
      }
    } catch (e) {
      // Sólo mostrar el error, NO hacer mock-login
      setError(e.message || "Error en el registro. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
    setActiveTab("home");
  };

  // --- SUBMIT COMPROMISE REPORT ---
  const handleCreateReport = async (formPayload) => {
    try {
      const url = token ? `${API_BASE}/api/v1/reportes` : `${API_BASE}/api/v1/reportes/publico`;
      const res = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify(formPayload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al enviar el reporte.");
      }

      // Agregar reputación si reporta amenaza
      setUserReputation(prev => prev + 30);
      if (!unlockedBadges.includes("primer_reporte")) {
        setUnlockedBadges(prev => [...prev, "primer_reporte"]);
      }

      await fetchReports();
    } catch (e) {
      // Fallback local report insertion
      const simulatedReport = {
        id: reports.length + 100,
        phone_number: formPayload.phone_number || "",
        bank_account: formPayload.bank_account || "",
        domain: formPayload.domain || "",
        description: formPayload.description,
        risk_level: formPayload.risk_level || "HIGH",
        risk_score: formPayload.risk_level === "CRITICAL" ? 90 : 65,
        malicious_indicators: "Reporte Comunitario Local",
        created_at: new Date().toISOString()
      };
      setReports(prev => [simulatedReport, ...prev]);
      setUserReputation(prev => prev + 30);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el reporte #${id}?`)) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/reportes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchReports();
      }
    } catch {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  // --- AUTOMATED SCANS AND INTERACTIVE TELEMETRY ---
  const runQuickScan = async () => {
    let queryValue = scanInput;
    if (scanType === "email") {
      queryValue = `Remitente: ${emailDetails.sender} | Asunto: ${emailDetails.subject} | Cuerpo: ${emailDetails.body}`;
    } else if (scanType === "qr") {
      queryValue = selectedQrCase || "Código QR cargado por el usuario";
    }

    if (!queryValue.trim()) {
      alert("Por favor ingresa contenido para analizar.");
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanLogs([]);

    // Visual loading logs
    const stages = [
      "🔍 Conectando con AegisShield Threat Engine...",
      "🤖 Iniciando análisis heurístico por inteligencia artificial...",
      "🛡️ Correlacionando indicadores de fraude regionales en LATAM...",
      "⚙️ Evaluando base de datos de phishing y estafas activas...",
      "✅ Generando reporte simplificado..."
    ];

    for (let i = 0; i < stages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 350));
      setScanLogs(prev => [...prev, stages[i]]);
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/reportes/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: scanType, contenido: queryValue })
      });

      if (res.ok) {
        const data = await res.json();
        setScanResult(data);

        // Add to history
        const newHistoryItem = {
          id: Date.now(),
          type: scanType,
          query: queryValue.length > 50 ? queryValue.slice(0, 47) + "..." : queryValue,
          score: data.score,
          level: data.level,
          date: "Ahora mismo"
        };
        setScanHistory(prev => [newHistoryItem, ...prev.slice(0, 15)]);

        // Gamification check: increase reputation slightly per scan
        setUserReputation(prev => prev + 5);
        if (data.score >= 50 && !unlockedBadges.includes("cazador_phishing")) {
          // Unlocks phishing hunter if they detect a high threat
          setUnlockedBadges(prev => [...prev, "cazador_phishing"]);
        }

      } else {
        throw new Error("API falló");
      }
    } catch {
      // Mock result if backend is offline
      const mockApi = new GeminiFallbackSimulator();
      const data = mockApi.generateMockResult(scanType, queryValue);
      setScanResult(data);

      const newHistoryItem = {
        id: Date.now(),
        type: scanType,
        query: queryValue.length > 50 ? queryValue.slice(0, 47) + "..." : queryValue,
        score: data.score,
        level: data.level,
        date: "Ahora mismo"
      };
      setScanHistory(prev => [newHistoryItem, ...prev.slice(0, 15)]);
      setUserReputation(prev => prev + 5);
    } finally {
      setIsScanning(false);
    }
  };

  // Attack simulator in developer mode
  const handleTriggerAttackSimulation = async () => {
    setIsSimulatingAttack(true);
    setSimulatedLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: "danger", text: "🚨 [SIMULACIÓN SOC] Ataque Brute Force bloqueado en API" },
      { id: Date.now() + 1, time: new Date().toLocaleTimeString(), type: "danger", text: "🚨 [SIMULACIÓN SOC] Inyección SQL detectada desde IP 192.168.12.9" },
      ...prev
    ]);

    // Inject mock report
    const payload = {
      description: "🚨 [ATAQUE SIMULADO] Intento masivo de phishing detectado.",
      phone_number: "+573004567890",
      domain: "seguridad-bancaria-phish.click",
      bank_account: "Nequi - 3004567890",
      risk_level: "CRITICAL"
    };
    await handleCreateReport(payload);
    setTimeout(() => setIsSimulatingAttack(false), 2000);
  };

  // --- RENDER HELPERS ---
  const getFallbackReports = () => [
    { id: 1, phone_number: "+573129871109", bank_account: "Nequi - 3129871109", domain: "rapicreditos-colombia.xyz", description: "Esquema gota a gota con cobros extorsivos.", risk_level: "CRITICAL", risk_score: 88, malicious_indicators: "TLD sospechoso, Reincidente", created_at: "2026-06-09T12:00:00Z" },
    { id: 2, phone_number: "+525543219876", bank_account: "Banco Azteca - 09841", domain: "solucion-deudas-rapidas.click", description: "Fraude montadeudas extorsionando por WhatsApp.", risk_level: "CRITICAL", risk_score: 92, malicious_indicators: "TLD sospechoso, Extorsión", created_at: "2026-06-09T10:15:00Z" },
    { id: 3, phone_number: "+51987654321", bank_account: "BCP - 1928481", domain: "sorteo-navideno-peru.online", description: "Enlace malicioso enviado por SMS imitando sorteo.", risk_level: "HIGH", risk_score: 72, malicious_indicators: "TLD sospechoso, Ingeniería Social", created_at: "2026-06-08T15:30:00Z" },
    { id: 4, phone_number: "+56988887777", bank_account: "Banco Estado - 9871", domain: "correoschile-entrega-paquete.info", description: "Phishing imitando página de paquetería para robar tarjetas.", risk_level: "HIGH", risk_score: 68, malicious_indicators: "TLD sospechoso, Phishing", created_at: "2026-06-08T09:45:00Z" },
    { id: 5, phone_number: "+541155554444", bank_account: "Mercado Pago - 881274", domain: "verificar-mercadopago.xyz", description: "Correo falso solicitando validación de identidad.", risk_level: "CRITICAL", risk_score: 84, malicious_indicators: "TLD sospechoso", created_at: "2026-06-07T14:20:00Z" }
  ];

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 font-sans relative overflow-hidden flex flex-col md:flex-row select-none">

      {/* Screen Red Flash Overlay on attack simulation */}
      <AnimatePresence>
        {isSimulatingAttack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ─── SIDEBAR & NAVIGATION ─── */}
      <Sidebar
        token={token}
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setScanResult(null);
          setScanInput("");
        }}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isDeveloperMode={isDeveloperMode}
        setIsDeveloperMode={setIsDeveloperMode}
        onLogout={handleLogout}
        onLoginClick={() => setAuthMode("login")}
      />

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">

        {/* Top Header */}
        <header className="h-[65px] bg-[#070911]/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-400 hover:text-slate-200 text-xl"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 tracking-wide uppercase">
                🛡️ AgiShield AI <span className="text-[9px] text-cyan-400 font-mono tracking-widest border border-cyan-400/30 px-1.5 py-0.2 rounded">SaaS Beta</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block">
                Ciberseguridad ciudadana contra estafas · LATAM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {token ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-300">{user?.nombre}</div>
                  <div className="text-[9px] text-cyan-400 font-mono font-semibold">Reputación: {userReputation} XP</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-xs font-bold font-mono border border-slate-700">
                  {user?.nombre?.slice(0, 2)}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthMode("login")}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Acceder / Registrarse
              </button>
            )}

            {isDeveloperMode && (
              <button
                onClick={handleTriggerAttackSimulation}
                className="text-[9px] font-bold uppercase tracking-wider bg-red-950/40 border border-red-500/30 hover:bg-red-900/20 text-red-400 px-3 py-1 rounded-xl transition-colors cursor-pointer"
              >
                Simular Ataque
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Pages */}
        <main className="p-5 md:p-8 flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto w-full h-full"
            >
              {activeTab === "home" && (
                <HomeView
                  scanType={scanType}
                  setScanType={setScanType}
                  scanInput={scanInput}
                  setScanInput={setScanInput}
                  emailDetails={emailDetails}
                  setEmailDetails={setEmailDetails}
                  selectedQrCase={selectedQrCase}
                  setSelectedQrCase={setSelectedQrCase}
                  isScanning={isScanning}
                  scanLogs={scanLogs}
                  scanResult={scanResult}
                  setScanResult={setScanResult}
                  runQuickScan={runQuickScan}
                  onRegisterPrompt={() => setAuthMode("register")}
                  token={token}
                />
              )}

              {activeTab === "dashboard" && (
                <DashboardView
                  token={token}
                  user={user}
                  reports={reports}
                  scanHistory={scanHistory}
                  userReputation={userReputation}
                  userLevel={userLevel}
                  unlockedBadges={unlockedBadges}
                  setAuthMode={setAuthMode}
                />
              )}

              {activeTab === "community" && (
                <CommunityView
                  reports={reports}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  latamThreats={latamThreats}
                  onCreateReport={handleCreateReport}
                  token={token}
                />
              )}

              {activeTab === "developer" && isDeveloperMode && (
                <DeveloperSOCView
                  reports={reports}
                  simulatedLogs={simulatedLogs}
                  onDelete={handleDeleteReport}
                  selectedReport={selectedReport}
                  setSelectedReport={setSelectedReport}
                  onSimulateAttack={handleTriggerAttackSimulation}
                  isSimulating={isSimulatingAttack}
                  token={token}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* --- AUTH GATE MODAL --- */}
      <AnimatePresence>
        {authMode !== "guest" && authMode !== "" && (
          <AuthModal
            mode={authMode}
            setMode={setAuthMode}
            onClose={() => setAuthMode("guest")}
            onLogin={handleLogin}
            onRegister={handleRegister}
            error={error}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COMPONENT: SIDEBAR ───
function Sidebar({ token, user, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, isDeveloperMode, setIsDeveloperMode, onLogout, onLoginClick }) {
  const userNavItems = [
    { id: "home", icon: <FaShieldAlt />, label: "Detector de Estafas" },
    { id: "dashboard", icon: <FaUserShield />, label: "Mi Perfil Seguro" },
    { id: "community", icon: <FaGlobe />, label: "Comunidad y Mapa" },
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[240px] border-r border-slate-800/80 bg-[#070911]/95 flex flex-col flex-shrink-0 h-screen transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} backdrop-blur-md`}>
        <div className="p-5 border-b border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/10 text-lg">🛡️</div>
            <div>
              <div className="font-extrabold text-sm text-slate-100 tracking-wide">AgiShield AI</div>
              <div className="text-[8px] text-cyan-400 tracking-[2px] font-bold uppercase">FrauDefender</div>
            </div>
          </div>
          <button className="md:hidden text-slate-400 text-xl" onClick={() => setIsSidebarOpen(false)}><FaTimes /></button>
        </div>

        <nav className="flex-grow p-4 space-y-1.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-2.5 mb-2.5">Navegación</div>
          {userNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === item.id
                ? "bg-blue-600/10 text-cyan-400 border border-blue-500/20 shadow-inner"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-transparent"
                }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Dev Mode toggle inside Sidebar */}
          <div className="pt-6 border-t border-slate-900 mt-4 space-y-2">
            <div className="flex items-center justify-between px-2.5">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                <FaCode /> Modo Developer
              </span>
              <label className="relative inline-flex items-center cursor-pointer scale-75">
                <input
                  type="checkbox"
                  checked={isDeveloperMode}
                  onChange={(e) => {
                    setIsDeveloperMode(e.target.checked);
                    if (e.target.checked) {
                      setActiveTab("developer");
                    } else if (activeTab === "developer") {
                      setActiveTab("home");
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950" />
              </label>
            </div>

            {isDeveloperMode && (
              <button
                onClick={() => {
                  setActiveTab("developer");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "developer"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner"
                  : "text-slate-500 hover:text-red-400 hover:bg-red-950/10 border border-transparent"
                  }`}
              >
                <FaTerminal /> Consola SOC (CTO)
              </button>
            )}
          </div>
        </nav>

        {/* User login / logout block */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/40">
          {token ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 text-xs font-bold font-mono">
                  {user?.nombre?.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-300 truncate">{user?.nombre}</div>
                  <div className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FaPowerOff size={10} /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full py-2 rounded-lg border border-slate-800 bg-[#090c15] text-slate-300 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 hover:border-cyan-500/30"
            >
              <FaUser size={10} /> Ingresar
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── COMPONENT: HOME VIEW (QUICK ACTIONS & RESULTS) ───
function HomeView({
  scanType, setScanType, scanInput, setScanInput, emailDetails, setEmailDetails,
  selectedQrCase, setSelectedQrCase, isScanning, scanLogs, scanResult, setScanResult,
  runQuickScan, onRegisterPrompt, token
}) {
  const actions = [
    { id: "url", label: "Analizar URL", icon: <FaLink />, placeholder: "Ej. http://soporte-nequibanca-alerta.xyz" },
    { id: "message", label: "Analizar SMS / Texto", icon: <FaEnvelope />, placeholder: "Pega el SMS sospechoso de paquetería o trabajo aquí..." },
    { id: "whatsapp", label: "Analizar WhatsApp", icon: <FaWhatsapp />, placeholder: "Pega el texto de extorsión o reclutamiento gota a gota..." },
    { id: "email", label: "Analizar Correo", icon: <FaEnvelope />, placeholder: "Detalles del correo electrónico" },
    { id: "qr", label: "Escanear QR", icon: <FaQrcode />, placeholder: "Sube o selecciona un caso de QR sospechoso" }
  ];

  const qrCases = [
    { value: "QR Menú de restaurante que redirige a 'restaurant-pago-movil.top'", label: "QR Menú de restaurante físico sospechoso" },
    { value: "QR Pegado en cajero automático que redirige a 'bancoconsola-verificacion.xyz/otp'", label: "QR Pegado en cajero o ventanilla bancaria" },
    { value: "QR recibido por correo para reclamar un bono de compra de $150 USD en supermercado", label: "QR de Bono de supermercado falso" }
  ];

  const activeAction = actions.find(a => a.id === scanType);

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
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => {
              setScanType(action.id);
              setScanResult(null);
              setScanInput("");
            }}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer select-none ${scanType === action.id
              ? "bg-gradient-to-b from-blue-950/40 to-cyan-950/20 border-cyan-400/50 text-cyan-300 shadow-md shadow-blue-500/5"
              : "bg-[#070911]/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700/50 hover:bg-[#070911]/80"
              }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${scanType === action.id ? "bg-cyan-500/10 text-cyan-300 animate-pulse" : "bg-slate-900 text-slate-400"
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

          {/* Render inputs dynamic based on scan type */}
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

          <div className="flex justify-end pt-2">
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
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - (scanResult.score) / 100)}`}
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
                {/* Indicators */}
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

                {/* Recommendations */}
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

// ─── COMPONENT: DASHBOARD VIEW (GAMIFIED CLIENT) ───
function DashboardView({ token, user, reports, scanHistory, userReputation, userLevel, unlockedBadges, setAuthMode }) {
  // Badges inventory definitions
  const badgeDetails = {
    escudo_inicial: { label: "Escudo Inicial", desc: "Realizaste tu primer escaneo contra estafas.", icon: "🛡️" },
    defensor_registrado: { label: "Héroe Registrado", desc: "Activaste tu cuenta de autodefensa.", icon: "🔐" },
    cazador_phishing: { label: "Cazador de Phishing", desc: "Detectaste una URL de alto riesgo.", icon: "🕷️" },
    primer_reporte: { label: "Primer Reporte", desc: "Reportaste un IoC sospechoso a la base de datos.", icon: "🤝" }
  };

  const criticalCount = reports.filter(r => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "critical").length;
  const highCount = reports.filter(r => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "alto").length;
  const mediumCount = reports.filter(r => getRiskLevel(r.score_riesgo ?? r.risk_score ?? 0) === "medio").length;

  // Personal Risk Assessment Level based on scan history
  const historyAverage = scanHistory.length > 0
    ? Math.round(scanHistory.reduce((acc, h) => acc + h.score, 0) / scanHistory.length)
    : 0;

  const personalRiskText = historyAverage >= 70 ? "Alerta" : historyAverage >= 40 ? "Moderado" : "Seguro";
  const personalRiskColor = historyAverage >= 70 ? "#ff4d6d" : historyAverage >= 40 ? "#ffb547" : "#00e5b4";

  return (
    <div className="space-y-6 font-sans">

      {/* Dynamic profile summary card */}
      <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-3xl shadow-lg border border-slate-700 font-bold text-slate-950">
            {token ? user?.nombre?.slice(0, 2) : "AN"}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-200">
              {token ? `¡Hola, ${user?.nombre}!` : "Perfil de Invitado"}
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

        {/* Reputation progress meter */}
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-500">
            <span>Rango de Ciberdefensa</span>
            <span className="text-cyan-400">{userReputation} / 300 XP</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min((userReputation / 300) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Personal metrics & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Risk Meter */}
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[280px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FaShieldAlt className="text-blue-500" /> Risk Score Personal
          </h3>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="rgba(255,255,255,0.03)" strokeWidth="7" fill="transparent" />
                <circle
                  cx="56" cy="56" r="46"
                  stroke={personalRiskColor}
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${2 * Math.PI * 46 * (1 - (historyAverage || 10) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold font-mono" style={{ color: personalRiskColor }}>
                  {historyAverage}%
                </span>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest">Estado</span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs font-bold text-slate-400 border-t border-slate-900 pt-3">
            Nivel de Exposición: <span style={{ color: personalRiskColor }}>{personalRiskText}</span>
          </div>
        </div>

        {/* Community Stats */}
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[280px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FaGlobe className="text-cyan-400" /> Amenazas en Observación
          </h3>

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

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Última sincronización: Hace unos segundos
          </div>
        </div>

        {/* Achievements / Badges Grid */}
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[280px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FaTrophy className="text-yellow-500 animate-pulse" /> Mis Logros e Insignias
          </h3>

          <div className="grid grid-cols-4 gap-3 py-2 flex-grow items-center">
            {Object.keys(badgeDetails).map((bKey) => {
              const b = badgeDetails[bKey];
              const unlocked = unlockedBadges.includes(bKey);
              return (
                <div
                  key={bKey}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border relative group cursor-help ${unlocked
                    ? "bg-slate-900/40 border-cyan-500/20 text-cyan-400"
                    : "bg-[#05070c] border-slate-900 text-slate-600 opacity-40"
                    }`}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <div className="absolute bottom-[-5px] scale-0 group-hover:scale-100 bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-300 px-2.5 py-1.5 rounded-xl w-48 text-center z-50 transition-all pointer-events-none left-1/2 -translate-x-1/2 shadow-lg leading-relaxed">
                    <div className="font-bold text-cyan-400 mb-0.5">{b.label}</div>
                    {b.desc}
                  </div>
                </div>
              );
            })}
          </div>

          {!token && (
            <button
              onClick={() => setAuthMode("register")}
              className="w-full py-2 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 hover:from-blue-600/30 hover:to-cyan-500/30 border border-blue-500/30 text-cyan-400 rounded-xl font-bold text-[10px] tracking-wide uppercase transition-colors cursor-pointer"
            >
              Regístrate para desbloquear más insignias
            </button>
          )}
        </div>
      </div>

      {/* Scans visual history list */}
      <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-6">
        <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Historial de Análisis Personal
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Últimos escaneos</span>
        </div>

        <div className="overflow-x-auto">
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
              {scanHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="py-3 font-semibold text-cyan-400 capitalize">
                    {item.type}
                  </td>
                  <td className="py-3 text-slate-300 max-w-[200px] truncate" title={item.query}>
                    {item.query}
                  </td>
                  <td className="py-3 font-mono font-bold" style={{ color: riskColor[item.level.toLowerCase()] }}>
                    {item.score}%
                  </td>
                  <td className="py-3">
                    <RiskBadge level={item.level} />
                  </td>
                  <td className="py-3 text-right text-slate-500 font-mono">
                    {item.date}
                  </td>
                </tr>
              ))}
              {scanHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-mono text-xs">
                    No has realizado escaneos aún.
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

// ─── COMPONENT: COMMUNITY VIEW (MAP & TRENDS) ───
function CommunityView({ reports, selectedCountry, setSelectedCountry, latamThreats, onCreateReport, token }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phone_number: "", domain: "", bank_account: "", description: "" });
  const [successMsg, setSuccessMsg] = useState("");

  const handleReport = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    if (!form.phone_number && !form.domain && !form.bank_account) {
      alert("Por favor ingresa al menos un indicador (teléfono, dominio o cuenta bancaria).");
      return;
    }

    let calculatedLevel = "MEDIUM";
    const desc = form.description.toLowerCase();
    if (desc.includes("extorsion") || desc.includes("amenaza") || desc.includes("montadeudas")) {
      calculatedLevel = "CRITICAL";
    } else if (desc.includes("sorteo") || desc.includes("gane") || desc.includes("phishing")) {
      calculatedLevel = "HIGH";
    }

    const payload = {
      phone_number: form.phone_number,
      domain: form.domain,
      bank_account: form.bank_account,
      description: form.description,
      risk_level: calculatedLevel
    };

    await onCreateReport(payload);
    setSuccessMsg("¡Reporte enviado exitosamente a la comunidad!");
    setForm({ phone_number: "", domain: "", bank_account: "", description: "" });
    setTimeout(() => {
      setSuccessMsg("");
      setShowForm(false);
    }, 2000);
  };

  // Extract statistics
  const topNumbers = {};
  const topDomains = {};
  reports.forEach(r => {
    if (r.phone_number) topNumbers[r.phone_number] = (topNumbers[r.phone_number] || 0) + 1;
    if (r.domain) topDomains[r.domain] = (topDomains[r.domain] || 0) + 1;
  });

  const sortedNumbers = Object.entries(topNumbers).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sortedDomains = Object.entries(topDomains).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // LATAM Map marker coordinates
  const markers = [
    { name: "Colombia", x: 140, y: 110 },
    { name: "México", x: 50, y: 50 },
    { name: "Perú", x: 130, y: 160 },
    { name: "Chile", x: 140, y: 270 },
    { name: "Argentina", x: 170, y: 260 }
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* Title Header */}
      <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Alertas y Mapa de la Comunidad</h2>
          <p className="text-xs text-slate-500 mt-1">Comparte incidentes sospechosos e investiga amenazas activas en Latinoamérica.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-xl font-bold tracking-wide text-xs transition-all cursor-pointer shadow-md shadow-red-950/20"
        >
          {showForm ? "Cerrar Panel" : "⚠️ Denunciar Estafa"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleReport} className="bg-[#070911]/90 border border-red-500/20 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-2">
                <FaExclamationTriangle /> Registrar Indicador de Fraude
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Teléfono Sospechoso</label>
                  <input
                    placeholder="Ej: +57310..."
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Dominio / URL</label>
                  <input
                    placeholder="Ej: login-verificacion.click"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Cuenta Recaudo (Bancos)</label>
                  <input
                    placeholder="Ej: Nequi 312..."
                    value={form.bank_account}
                    onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                    className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Descripción de la estafa *</label>
                <textarea
                  rows={3}
                  placeholder="Detalla cómo operan (ej. Amenazan con enviar fotos a mis contactos de WhatsApp si no pago interés)..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#05070c] border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-red-500/30 transition-colors"
                  required
                />
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                  <FaCheckCircle /> {successMsg}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md"
                >
                  {token ? "Inyectar Reporte Validado" : "Enviar Denuncia Anónima"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LATAM Map & Local Scams Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LATAM Map Vector Container */}
        <div className="lg:col-span-3 bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[380px] relative overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 z-10">
            <FaGlobe className="text-blue-500 animate-spin-slow" /> Mapa de Calor de Amenazas LATAM
          </h3>

          <div className="flex-grow flex items-center justify-center relative scale-110">
            {/* Custom stylized vector layout representing LATAM countries */}
            <svg viewBox="0 0 300 350" className="w-full h-[280px] opacity-40">
              {/* México outline mock */}
              <path d="M 20 40 Q 40 40 60 50 Q 50 70 30 70 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              {/* Central America connection */}
              <path d="M 60 50 L 80 80 L 100 80 L 110 90" fill="none" stroke="#334155" strokeWidth="1" />
              {/* South America main mock */}
              <path d="M 110 90 Q 180 90 200 150 Q 220 220 180 320 Q 140 340 130 310 Q 120 220 110 170 Q 100 120 110 90 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

              {/* Connection curves */}
              <path d="M 50 50 Q 100 80 140 110" fill="none" stroke="#b91c1c" strokeWidth="1" strokeDasharray="3 3" className="animate-pulse" />
              <path d="M 140 110 Q 110 200 130 160" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 4" />
              <path d="M 130 160 Q 150 220 170 260" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
            </svg>

            {/* Pulse Beacons coordinates */}
            {markers.map((mark) => (
              <button
                key={mark.name}
                onClick={() => setSelectedCountry(mark.name)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 focus:outline-none cursor-pointer group"
                style={{ left: `${mark.x}px`, top: `${mark.y}px` }}
              >
                <span className="flex h-5 w-5 relative items-center justify-center">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${selectedCountry === mark.name ? "bg-red-500" : "bg-cyan-500"
                    }`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${selectedCountry === mark.name ? "bg-red-500" : "bg-cyan-400"
                    } shadow-md border border-slate-950`} />
                </span>
                <span className="absolute left-6 -top-2 bg-slate-950/90 border border-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono text-slate-300 pointer-events-none opacity-80 group-hover:opacity-100 whitespace-nowrap">
                  {mark.name}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Haz clic en un marcador para filtrar datos
          </div>
        </div>

        {/* Local Scams Details */}
        <div className="lg:col-span-2 bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[380px]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-900 pb-2.5 mb-3 flex items-center justify-between">
              <span>📌 Telemetría: {selectedCountry}</span>
              <span className="text-[9px] text-cyan-400 font-mono">EN VIVO</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Principales Estafas Detectadas</div>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  {latamThreats[selectedCountry].threatType}
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Volumen de Ataques Semanal</div>
                <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                  {latamThreats[selectedCountry].attacks} incidentes
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Severidad Regional</div>
                <div className="mt-1">
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${latamThreats[selectedCountry].risk === "Crítico" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    }`}>
                    {latamThreats[selectedCountry].risk.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#05070c] border border-slate-900 rounded-2xl p-3 text-[11px] text-slate-400 flex items-center gap-2 italic">
            <span className="text-xs">💡</span>
            "Cuidado con mensajes de texto de familiares en problemas pidiendo transferencias."
          </div>
        </div>
      </div>

      {/* Rankings tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blacklisted Numbers */}
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            📱 Números de Extorsión Frecuentes
          </h3>
          <div className="space-y-2">
            {sortedNumbers.map(([num, count], i) => (
              <div key={i} className="flex justify-between items-center bg-[#05070c] border border-slate-900 p-3 rounded-2xl font-mono text-xs">
                <span className="text-slate-300 font-semibold">{num}</span>
                <span className="text-[10px] text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30">
                  {count} Denuncias
                </span>
              </div>
            ))}
            {sortedNumbers.length === 0 && (
              <div className="py-12 text-center text-slate-600 text-xs italic">Aún no hay reportes suficientes.</div>
            )}
          </div>
        </div>

        {/* Blacklisted Domains */}
        <div className="bg-[#070911]/60 border border-slate-800/80 rounded-3xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            🌐 Dominios Phishing más Reportados
          </h3>
          <div className="space-y-2">
            {sortedDomains.map(([dom, count], i) => (
              <div key={i} className="flex justify-between items-center bg-[#05070c] border border-slate-900 p-3 rounded-2xl font-mono text-xs">
                <span className="text-slate-300 truncate max-w-[65%]">{dom}</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-900/30">
                  {count} Denuncias
                </span>
              </div>
            ))}
            {sortedDomains.length === 0 && (
              <div className="py-12 text-center text-slate-600 text-xs italic">Aún no hay reportes de dominios.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: DEVELOPER SOC COMMAND CENTER VIEW (ISOLATED) ───
function DeveloperSOCView({ reports, simulatedLogs, onDelete, selectedReport, setSelectedReport, onSimulateAttack, isSimulating, token }) {
  return (
    <div className="space-y-6 font-sans">

      {/* Developer Banner */}
      <div className="bg-[#18110b] border border-yellow-500/20 rounded-3xl p-5 flex items-center gap-3">
        <span className="text-2xl text-yellow-500">⚠️</span>
        <div>
          <h4 className="text-sm font-bold text-yellow-500">Modo Consola SOC Activo</h4>
          <p className="text-xs text-slate-400 mt-0.5">Sección restringida para auditores, desarrolladores e integraciones B2B empresariales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Real-time Log Stream Console */}
        <div className="lg:col-span-2 bg-[#070911] border border-slate-800/85 rounded-3xl p-5 h-[360px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaTerminal className="text-cyan-400" /> SOC Terminal Telemetría
            </h3>
            <button
              onClick={onSimulateAttack}
              className="text-[9px] font-bold uppercase tracking-wider bg-red-950/30 border border-red-500/30 text-red-400 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Forzar Simulación
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[9px] leading-relaxed scrollbar-thin text-slate-400">
            {simulatedLogs.map((log) => (
              <div key={log.id} className="flex gap-2 items-start">
                <span className="text-slate-600">[{log.time}]</span>
                <span className={`px-1 py-0.2 rounded text-[8px] font-bold font-mono ${log.type === "danger" ? "bg-red-500/10 text-red-400" :
                  log.type === "warning" ? "bg-yellow-500/10 text-yellow-400" :
                    log.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-blue-500/10 text-blue-400"
                  }`}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-slate-300 break-all">{log.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable AI Details Widget */}
        <div className="lg:col-span-3 bg-[#070911] border border-slate-800/85 rounded-3xl p-5 h-[360px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaBrain className="text-cyan-400 animate-pulse" /> Explainable AI Assessment
            </h3>
          </div>

          {selectedReport ? (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ID Reporte</span>
                <span className="font-mono font-bold text-slate-300">#{selectedReport.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Objetivo Escaneado</span>
                <span className="font-mono text-cyan-400 font-bold truncate max-w-[180px]">
                  {selectedReport.domain || selectedReport.phone_number || "Múltiple"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Heurística Score</span>
                <span className="font-mono font-bold text-red-400">{selectedReport.risk_score}%</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Descripción Raw</span>
                <p className="text-slate-400 italic bg-[#05070c] border border-slate-900 p-2 rounded-xl text-[11px]">
                  "{selectedReport.description}"
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Indicadores Heurísticos</span>
                <p className="text-slate-400 font-mono text-[10px] bg-[#05070c] border border-slate-900 p-2 rounded-xl">
                  {selectedReport.malicious_indicators || "Ninguno"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <FaBrain size={28} className="mb-2 text-slate-700" />
              Selecciona un IoC de la tabla de la derecha para ver los factores de riesgo de la IA.
            </div>
          )}

          <div className="text-[9px] text-slate-600 font-mono border-t border-slate-900 pt-2 text-center">
            AegisShield Risk Evaluation Core · v2.0
          </div>
        </div>
      </div>

      {/* Database Raw Tables */}
      <div className="bg-[#070911] border border-slate-800/85 rounded-3xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Base de Datos de Indicadores IoC (SQLite / Postgres)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-2.5">ID</th>
                <th className="py-2.5">Descripción</th>
                <th className="py-2.5">Teléfono</th>
                <th className="py-2.5">Dominio</th>
                <th className="py-2.5">Score</th>
                <th className="py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {reports.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`hover:bg-slate-900/40 transition-colors cursor-pointer ${selectedReport?.id === r.id ? "bg-slate-900/30" : ""
                    }`}
                >
                  <td className="py-3 font-mono text-slate-500">#{r.id}</td>
                  <td className="py-3 text-slate-200 max-w-[200px] truncate" title={r.description}>
                    {r.description}
                  </td>
                  <td className="py-3 font-mono text-slate-400">{r.phone_number || "—"}</td>
                  <td className="py-3 font-semibold text-slate-400 truncate max-w-[120px]">{r.domain || "—"}</td>
                  <td className="py-3 font-mono font-bold text-red-400">{r.risk_score ?? r.score_riesgo ?? 0}%</td>
                  <td className="py-3 text-right">
                    {token && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(r.id);
                        }}
                        className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 p-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <FaTrash size={10} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-mono">
                    Ningún indicador registrado.
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

// ─── COMPONENT: AUTH GATE MODAL (GOOGLE, APPLE MOCKUPS) ───
function AuthModal({ mode, setMode, onClose, onLogin, onRegister, error, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      onLogin(email, password);
    } else {
      onRegister(nombre, email, password);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans select-none">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-[#070911] border border-slate-800/80 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-sm">
          <FaTimes />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-blue-500/10 mb-3 animate-pulse">🛡️</div>
          <h2 className="text-lg font-bold text-slate-200">
            {mode === "login" ? "Acceder a AgiShield" : "Registrar Cuenta Gratis"}
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono font-bold">
            Autodefensa ciudadana contra fraudes
          </p>
        </div>

        {/* SOCIAL LOGINS MOCKUPS */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onLogin("invitado@google.com", "google-oauth-fake-pass")}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-800 rounded-xl hover:border-slate-700 bg-[#090c15] text-[11px] font-bold text-slate-300 hover:text-slate-100 transition-all cursor-pointer select-none"
          >
            <span className="text-xs">🌐</span> Google
          </button>
          <button
            type="button"
            onClick={() => onLogin("invitado@apple.com", "apple-oauth-fake-pass")}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-800 rounded-xl hover:border-slate-700 bg-[#090c15] text-[11px] font-bold text-slate-300 hover:text-slate-100 transition-all cursor-pointer select-none"
          >
            <span className="text-xs">🍎</span> Apple
          </button>
        </div>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-slate-900" />
          <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold px-3">O ingresa con tus credenciales</span>
          <hr className="flex-grow border-slate-900" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej: Sofía Rodríguez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="Ej: sofia@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1">Contraseña</label>
            <input
              type="password"
              placeholder={mode === "register" ? "Mínimo 12 caracteres" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "register" ? 12 : undefined}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              required
            />
            {mode === "register" && (
              <p className="text-[9px] text-slate-500 mt-1 font-mono">
                🔒 Mínimo 12 caracteres para mayor seguridad
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold flex items-center gap-1.5">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10"
          >
            {loading ? "Procesando..." : mode === "login" ? "Ingresar al SOC" : "Registrarme"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-900">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {mode === "login" ? (
              <>¿No tienes cuenta? <span className="font-bold text-cyan-400">Regístrate aquí</span></>
            ) : (
              <>¿Ya tienes cuenta? <span className="font-bold text-blue-400">Inicia Sesión</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── HELPER CLASS: DETAILED MOCK ANALYSIS SIMULATOR ───
class GeminiFallbackSimulator {
  generateMockResult(tipo, contenido) {
    const clean = contenido.toLowerCase();
    let score = 15;
    let indicators = [];
    let recommendations = [];
    let explanation = "";

    if (tipo === "url") {
      if (clean.includes(".xyz") || clean.includes(".click") || clean.includes(".top")) {
        score += 35;
        indicators.push("Extensión de dominio de bajo costo frecuentemente asociada a estafas (.xyz / .click)");
      }
      if (clean.includes("nequi") || clean.includes("bancolombia") || clean.includes("daviplata") || clean.includes("banco")) {
        score += 30;
        indicators.push("Suplantación intencional de marca de billetera móvil o banco popular");
      }
      if (!clean.startsWith("https://")) {
        score += 15;
        indicators.push("Sitio inseguro: Ausencia de cifrado SSL obligatorio");
      }

      if (score >= 60) {
        explanation = "Enlace fraudulento de Phishing detectado. Este sitio imita el portal oficial de tu banco o billetera móvil con el fin de recolectar claves secretas y códigos OTP.";
        recommendations = [
          "No hagas clic en el enlace ni ingreses datos.",
          "Cierra el navegador y reporta el dominio en AgiShield.",
          "Comunícate directamente con tu banco por sus aplicaciones autorizadas."
        ];
      } else {
        explanation = "No encontramos elementos de phishing evidentes, pero ten cautela de enlaces enviados por extraños.";
        recommendations = [
          "Verifica el certificado HTTPS de la página antes de interactuar.",
          "No descargues archivos extraños si te lo pide la web."
        ];
      }
    } else if (tipo === "whatsapp" || tipo === "mensaje" || tipo === "message") {
      if (clean.includes("deuda") || clean.includes("cobro") || clean.includes("embargo") || clean.includes("difundir")) {
        score += 45;
        indicators.push("Patrón delictivo de cobranza hostil y extorsión (Montadeudas)");
      }
      if (clean.includes("ganaste") || clean.includes("bono") || clean.includes("premio") || clean.includes("regalo")) {
        score += 35;
        indicators.push("Señuelo de falsa recompensa económica (Ingeniería Social)");
      }
      if (clean.includes("urgente") || clean.includes("hoy mismo") || clean.includes("evitar")) {
        score += 15;
        indicators.push("Sensación de urgencia ficticia inducida para asustar al usuario");
      }

      if (score >= 60) {
        explanation = "Alerta de Fraude Financiero Activo (Montadeudas / Extorsión). Los estafadores usan amenazas directas sobre deudas infladas artificialmente.";
        recommendations = [
          "Bloquea el número telefónico de inmediato y no respondas.",
          "No transfieras dinero, la extorsión no cesará si realizas un pago.",
          "Reporta el número en tu aplicación de WhatsApp o SMS."
        ];
      } else {
        explanation = "El mensaje presenta un riesgo bajo o informativo, pero mantente precavido de solicitudes financieras atípicas.";
        recommendations = [
          "No agregues contactos desconocidos a grupos.",
          "Nunca verifiques códigos de WhatsApp recibidos por terceros."
        ];
      }
    } else if (tipo === "correo" || tipo === "email") {
      if (clean.includes("seguridad") || clean.includes("suspender") || clean.includes("actualizacion")) {
        score += 25;
        indicators.push("Uso de ingeniería social fingiendo problemas en tu cuenta bancaria");
      }
      if (clean.includes("millon") || clean.includes("premio") || clean.includes("loteria")) {
        score += 40;
        indicators.push("Suplantación bancaria / Sorteo masivo no verificado");
      }

      if (score >= 50) {
        explanation = "Intento de Phishing Corporativo por correo electrónico. Utilizan alarmas y logotipos simulados para capturar tus accesos.";
        recommendations = [
          "No hagas clic en ningún enlace ni abras archivos PDF/ZIP adjuntos.",
          "Marca el mensaje como correo no deseado.",
          "Compara la dirección del remitente: debe terminar exactamente en el dominio corporativo oficial de la institución."
        ];
      } else {
        explanation = "El correo posee lenguaje estándar de comunicación, pero no compartas credenciales confidenciales.";
        recommendations = [
          "Revisa siempre la cabecera completa del remitente.",
          "Mantén tu antivirus y navegador actualizados."
        ];
      }
    } else {
      // QR / default
      if (clean.includes("menú") || clean.includes("menu") || clean.includes("pago")) {
        score += 30;
        indicators.push("Enlace externo de cobro atípico contenido en código QR");
      }
      explanation = "El código QR redirige a una URL externa. Recuerda verificar siempre a dónde te envía el escáner antes de confirmar el acceso.";
      recommendations = [
        "No completes pagos ni formularios ingresando desde un código QR público.",
        "Usa aplicaciones lectoras de QR que muestren la URL completa de antemano."
      ];
    }

    score = Math.min(score, 100);
    const level = score >= 76 ? "CRITICAL" : score >= 51 ? "HIGH" : score >= 26 ? "MEDIUM" : "LOW";

    return {
      score,
      level,
      explanation,
      recommendations,
      indicators
    };
  }
}
