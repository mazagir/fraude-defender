import { useState, useEffect, useCallback } from "react";
import { API_BASE, GeminiFallbackSimulator } from "../constants/riskConfig";
import useStreak from "./useStreak";

export default function useAppLogic() {
  // --- SESSION STATE ---
  const [token, setToken] = useState(() => localStorage.getItem("aegis_token") || "");
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("aegis_user");
    return cached ? JSON.parse(cached) : null;
  });

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // --- MODALS & AUTH ---
  const [authMode, setAuthMode] = useState("login");
  const [criticalAlertResult, setCriticalAlertResult] = useState(null);
  const [showGuestBanner, setShowGuestBanner] = useState(false);

  // --- STREAK (custom hook) ---
  const { streak, updateStreak } = useStreak();

  // --- TELEMETRY ---
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);

  // --- SCANNER STATE ---
  const [scanType, setScanType] = useState("url");
  const [scanInput, setScanInput] = useState("");
  const [emailDetails, setEmailDetails] = useState({ sender: "", subject: "", body: "" });
  const [selectedQrCase, setSelectedQrCase] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState([]);
  const [scanResult, setScanResult] = useState(null);

  // --- SCAN HISTORY & GAMIFICATION ---
  const [scanHistory, setScanHistory] = useState(() => {
    const cached = localStorage.getItem("aegis_scan_history");
    return cached ? JSON.parse(cached) : [
      { id: 1, type: "url", query: "verificar-nequi-pago.click", score: 85, level: "CRITICAL", date: "Hace 2 horas" },
      { id: 2, type: "whatsapp", query: "Hola ganaste un bono de compra de $500 USD...", score: 65, level: "HIGH", date: "Ayer" },
    ];
  });

  const [gamification, setGamification] = useState(() => {
    const reputation = parseInt(localStorage.getItem("aegis_reputation") || "75");
    const level = localStorage.getItem("aegis_level") || "Novato Alerta";
    const cachedBadges = localStorage.getItem("aegis_badges");
    const badges = cachedBadges ? JSON.parse(cachedBadges) : ["escudo_inicial"];
    return { reputation, level, badges };
  });

  // --- SOC DEVELOPER STATE ---
  const [simulatedLogs, setSimulatedLogs] = useState([
    { id: 1, time: "17:10:12", type: "info", text: "Iniciando AegisShield SOC Core..." },
    { id: 2, time: "17:10:14", type: "success", text: "Conexión base de datos SQLite - OK." },
    { id: 3, time: "17:10:18", type: "warning", text: "Escaneo heurístico: Detectada firma sospechosa en URL." },
  ]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("Colombia");

  const latamThreats = {
    Colombia: { attacks: 1244, threatType: "Gota a Gota / SMS Phishing Bancario (Nequi)", risk: "Alto" },
    México: { attacks: 2108, threatType: "Montadeudas / WhatsApp Extorsión", risk: "Crítico" },
    Perú: { attacks: 890, threatType: "Suplantación de Identidad / QR Menús Falsos", risk: "Medio" },
    Chile: { attacks: 720, threatType: "Phishing de Paquetería / Correos falsos", risk: "Medio" },
    Argentina: { attacks: 1450, threatType: "Suplantación de Billeteras Virtuales", risk: "Alto" },
  };

  // --- API ---
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  }, [token]);

  const getFallbackReports = () => [
    { id: 1, phone_number: "+573129871109", bank_account: "Nequi - 3129871109", domain: "rapicreditos-colombia.xyz", description: "Esquema gota a gota con cobros extorsivos.", risk_level: "CRITICAL", risk_score: 88, malicious_indicators: "TLD sospechoso, Reincidente", created_at: "2026-06-09T12:00:00Z" },
    { id: 2, phone_number: "+525543219876", bank_account: "Banco Azteca - 09841", domain: "solucion-deudas-rapidas.click", description: "Fraude montadeudas extorsionando por WhatsApp.", risk_level: "CRITICAL", risk_score: 92, malicious_indicators: "TLD sospechoso, Extorsión", created_at: "2026-06-09T10:15:00Z" },
    { id: 3, phone_number: "+51987654321", bank_account: "BCP - 1928481", domain: "sorteo-navideno-peru.online", description: "Enlace malicioso enviado por SMS imitando sorteo.", risk_level: "HIGH", risk_score: 72, malicious_indicators: "TLD sospechoso, Ingeniería Social", created_at: "2026-06-08T15:30:00Z" },
  ];

  const fetchReports = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const url = token ? `${API_BASE}/api/v1/reportes` : `${API_BASE}/api/v1/reportes/publico/listar`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        const backendReports = Array.isArray(data) ? data : [];
        setReports(prev => {
          const localOnly = prev.filter(r => r.id >= 100 && !backendReports.some(br =>
            (br.phone_number === r.phone_number || br.telefono_sospechoso === r.telefono_sospechoso) &&
            (br.domain === r.domain || br.dominio === r.dominio) &&
            (br.description === r.description || br.descripcion === r.descripcion)
          ));
          return [...localOnly, ...backendReports];
        });
      } else {
        setError("Error al cargar reportes. Ejecutando con datos de respaldo.");
        setReports(prev => [...prev.filter(r => r.id >= 100), ...getFallbackReports()]);
      }
    } catch {
      setError("No se pudo conectar al servidor backend. Usando datos simulados.");
      setReports(prev => [...prev.filter(r => r.id >= 100), ...getFallbackReports()]);
    } finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { fetchReports(); const iv = setInterval(fetchReports, 45000); return () => clearInterval(iv); }, [fetchReports]);
  useEffect(() => { localStorage.setItem("aegis_scan_history", JSON.stringify(scanHistory)); }, [scanHistory]);
  
  useEffect(() => {
    localStorage.setItem("aegis_reputation", gamification.reputation.toString());
    let newLevel = "Novato Alerta";
    if (gamification.reputation >= 200) newLevel = "Guardián de la Comunidad";
    else if (gamification.reputation >= 120) newLevel = "Vigilante Digital";
    localStorage.setItem("aegis_level", newLevel);
    setGamification(prev => (prev.level === newLevel ? prev : { ...prev, level: newLevel }));
  }, [gamification.reputation]);

  useEffect(() => { localStorage.setItem("aegis_badges", JSON.stringify(gamification.badges)); }, [gamification.badges]);

  // --- AUTH HANDLERS ---
  const handleLogin = async (email, password) => {
    setLoading(true); setError("");
    try {
      const body = new URLSearchParams({ username: email, password });
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!res.ok) throw new Error("Credenciales inválidas");
      const data = await res.json();
      const receivedToken = data.access_token || data.token;
      localStorage.setItem("aegis_token", receivedToken);
      setToken(receivedToken);
      const serverUser = data.usuario;
      const userData = serverUser
        ? { email: serverUser.email, nombre: serverUser.nombre, rol: serverUser.rol }
        : { email, nombre: email.split("@")[0].toUpperCase(), rol: "analista" };
      localStorage.setItem("aegis_user", JSON.stringify(userData));
      setUser(userData);
      setAuthMode(""); setShowGuestBanner(false); setActiveTab("dashboard");
      fetchReports();
    } catch (e) { setError(e.message || "Error al iniciar sesión."); }
    finally { setLoading(false); }
  };

  const handleGuestLogin = () => {
    const guestData = { email: "", nombre: "Invitado", rol: "guest" };
    setUser(guestData);
    localStorage.setItem("aegis_user", JSON.stringify(guestData));
    setAuthMode(""); setShowGuestBanner(true); setActiveTab("home");
  };

  const handleRegister = async (nombre, email, password) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/registro`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, email, password }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = err.detail || "Error en el registro.";
        if (Array.isArray(msg)) msg = msg.map(e => e.msg || JSON.stringify(e)).join(", ");
        if (typeof msg === "string" && msg.toLowerCase().includes("string_too_short")) msg = "La contraseña debe tener al menos 12 caracteres.";
        throw new Error(msg);
      }
      await handleLogin(email, password);
      setGamification(prev => {
        if (!prev.badges.includes("defensor_registrado")) {
          return {
            ...prev,
            reputation: prev.reputation + 50,
            badges: [...prev.badges, "defensor_registrado"],
          };
        }
        return prev;
      });
    } catch (e) { setError(e.message || "Error en el registro. Intenta nuevamente."); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    setToken(""); setUser(null);
    localStorage.removeItem("aegis_token"); localStorage.removeItem("aegis_user");
    setActiveTab("home");
  };

  // --- REPORT HANDLERS ---
  const handleCreateReport = async (formPayload) => {
    try {
      const url = token ? `${API_BASE}/api/v1/reportes` : `${API_BASE}/api/v1/reportes/publico`;
      const res = await apiFetch(url, { method: "POST", body: JSON.stringify(formPayload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "Error al enviar el reporte."); }
      setGamification(prev => {
        const nextBadges = prev.badges.includes("primer_reporte") ? prev.badges : [...prev.badges, "primer_reporte"];
        return {
          ...prev,
          reputation: prev.reputation + 30,
          badges: nextBadges,
        };
      });
      await fetchReports();
    } catch {
      const simulatedReport = { id: reports.length + 100, phone_number: formPayload.phone_number || "", bank_account: formPayload.bank_account || "", domain: formPayload.domain || "", description: formPayload.description, risk_level: formPayload.risk_level || "HIGH", risk_score: formPayload.risk_level === "CRITICAL" ? 90 : 65, malicious_indicators: "Reporte Comunitario Local", created_at: new Date().toISOString() };
      setReports(prev => [simulatedReport, ...prev]);
      setGamification(prev => ({
        ...prev,
        reputation: prev.reputation + 30,
      }));
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el reporte #${id}?`)) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/reportes/${id}`, { method: "DELETE" });
      if (res.ok) await fetchReports();
    } catch { setReports(prev => prev.filter(r => r.id !== id)); }
  };

  // --- QUICK SCAN ---
  const runQuickScan = async () => {
    let queryValue = scanInput;
    if (scanType === "email") queryValue = `Remitente: ${emailDetails.sender} | Asunto: ${emailDetails.subject} | Cuerpo: ${emailDetails.body}`;
    else if (scanType === "qr") queryValue = selectedQrCase || "Código QR cargado por el usuario";
    if (!queryValue.trim()) { alert("Por favor ingresa contenido para analizar."); return; }

    setIsScanning(true); setScanResult(null); setScanLogs([]);
    const stages = ["🔍 Conectando con AegisShield Threat Engine...", "🤖 Iniciando análisis heurístico por inteligencia artificial...", "🛡️ Correlacionando indicadores de fraude regionales en LATAM...", "⚙️ Evaluando base de datos de phishing y estafas activas...", "✅ Generando reporte simplificado..."];
    for (let i = 0; i < stages.length; i++) { await new Promise(r => setTimeout(r, 350)); setScanLogs(prev => [...prev, stages[i]]); }

    try {
      const res = await fetch(`${API_BASE}/api/v1/reportes/analizar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: scanType, contenido: queryValue }) });
      if (!res.ok) throw new Error("API falló");
      const data = await res.json();
      setScanResult(data);
      const item = { id: Date.now(), type: scanType, query: queryValue.length > 50 ? queryValue.slice(0, 47) + "..." : queryValue, score: data.score, level: data.level, date: "Ahora mismo" };
      setScanHistory(prev => [item, ...prev.slice(0, 15)]);
      setGamification(prev => {
        const nextBadges = (data.score >= 50 && !prev.badges.includes("cazador_phishing")) ? [...prev.badges, "cazador_phishing"] : prev.badges;
        return {
          ...prev,
          reputation: prev.reputation + 5,
          badges: nextBadges,
        };
      });
      if (data.score > 70) { setCriticalAlertResult(data); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
      updateStreak();
    } catch {
      const data = new GeminiFallbackSimulator().generateMockResult(scanType, queryValue);
      setScanResult(data);
      const item = { id: Date.now(), type: scanType, query: queryValue.length > 50 ? queryValue.slice(0, 47) + "..." : queryValue, score: data.score, level: data.level, date: "Ahora mismo" };
      setScanHistory(prev => [item, ...prev.slice(0, 15)]);
      setGamification(prev => ({
        ...prev,
        reputation: prev.reputation + 5,
      }));
      if (data.score > 70) { setCriticalAlertResult(data); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
      updateStreak();
    } finally { setIsScanning(false); }
  };

  const handleTriggerAttackSimulation = async () => {
    setIsSimulatingAttack(true);
    setSimulatedLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: "danger", text: "🚨 [SIMULACIÓN SOC] Ataque Brute Force bloqueado en API" },
      { id: Date.now() + 1, time: new Date().toLocaleTimeString(), type: "danger", text: "🚨 [SIMULACIÓN SOC] Inyección SQL detectada desde IP 192.168.12.9" },
      ...prev,
    ]);
    await handleCreateReport({ description: "🚨 [ATAQUE SIMULADO] Intento masivo de phishing detectado.", phone_number: "+573004567890", domain: "seguridad-bancaria-phish.click", bank_account: "Nequi - 3004567890", risk_level: "CRITICAL" });
    setTimeout(() => setIsSimulatingAttack(false), 2000);
  };

  return {
    token, setToken,
    user, setUser,
    activeTab, setActiveTab,
    isSidebarOpen, setIsSidebarOpen,
    isDeveloperMode, setIsDeveloperMode,
    authMode, setAuthMode,
    criticalAlertResult, setCriticalAlertResult,
    showGuestBanner, setShowGuestBanner,
    streak, updateStreak,
    reports, setReports,
    loading, setLoading,
    error, setError,
    isSimulatingAttack, setIsSimulatingAttack,
    scanType, setScanType,
    scanInput, setScanInput,
    emailDetails, setEmailDetails,
    selectedQrCase, setSelectedQrCase,
    isScanning, setIsScanning,
    scanLogs, setScanLogs,
    scanResult, setScanResult,
    scanHistory, setScanHistory,
    gamification, setGamification,
    simulatedLogs, setSimulatedLogs,
    selectedReport, setSelectedReport,
    selectedCountry, setSelectedCountry,
    latamThreats,
    handleLogin,
    handleGuestLogin,
    handleRegister,
    handleLogout,
    handleCreateReport,
    handleDeleteReport,
    runQuickScan,
    handleTriggerAttackSimulation,
  };
}
