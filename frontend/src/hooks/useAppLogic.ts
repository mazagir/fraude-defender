import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE, GeminiFallbackSimulator } from "../constants/riskConfig";
import useStreak from "./useStreak";
import type { UserData, ScanResult, GamificationState, FraudReport } from "../types";

function getReputationLevel(reputation: number): string {
  if (reputation >= 200) return "Guardián de la Comunidad";
  if (reputation >= 120) return "Vigilante Digital";
  return "Novato Alerta";
}

function normalizeGamification(value: { reputation: number; badges: string[] }): GamificationState & { level: string } {
  return {
    ...value,
    level: getReputationLevel(value.reputation),
  };
}

interface ScanLogEntry {
  id: number;
  time: string;
  type: string;
  text: string;
}

interface SimLogEntry {
  id: number;
  type: string;
  text: string;
  time: string;
}

interface ScanHistoryItem {
  id: number;
  type: string;
  query: string;
  score: number;
  level: string;
  date: string;
}

export default function useAppLogic() {
  // --- SESSION STATE ---
  const [token, setToken] = useState<string>(() => localStorage.getItem("aegis_token") || "");
  const [user, setUser] = useState<UserData | null>(() => {
    const cached = localStorage.getItem("aegis_user");
    return cached ? JSON.parse(cached) : null;
  });

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);

  // --- MODALS & AUTH ---
  const [authMode, setAuthMode] = useState<string>("");
  const [criticalAlertResult, setCriticalAlertResult] = useState<ScanResult | null>(null);
  const [showGuestBanner, setShowGuestBanner] = useState<boolean>(false);
  const [showReportSuccessModal, setShowReportSuccessModal] = useState<boolean>(false);

  // --- STREAK (custom hook) ---
  const { streak, updateStreak } = useStreak();

  // --- TELEMETRY ---
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSimulatingAttack, setIsSimulatingAttack] = useState<boolean>(false);

  // --- SCANNER STATE ---
  const [scanType, setScanType] = useState<string>("url");
  const [scanInput, setScanInput] = useState<string>("");
  const [emailDetails, setEmailDetails] = useState<{ sender: string; subject: string; body: string }>({ sender: "", subject: "", body: "" });
  const [selectedQrCase, setSelectedQrCase] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // --- SCAN HISTORY & GAMIFICATION ---
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>(() => {
    const cached = localStorage.getItem("aegis_scan_history");
    return cached ? JSON.parse(cached) : [];
  });

  const [gamification, setGamificationState] = useState(() => {
    const reputation = parseInt(localStorage.getItem("aegis_reputation") || "75");
    const cachedBadges = localStorage.getItem("aegis_badges");
    const badges = cachedBadges ? JSON.parse(cachedBadges) : ["escudo_inicial"];
    return normalizeGamification({ reputation, badges });
  });

  const setGamification = useCallback((nextValue: ((prev: typeof gamification) => typeof gamification) | Partial<typeof gamification>) => {
    setGamificationState((current) => {
      const resolved = typeof nextValue === "function" ? nextValue(current) : nextValue;
      return normalizeGamification({ ...current, ...resolved });
    });
  }, []);

  // --- MFA STATE ---
  const [mfaActive, setMfaActive] = useState<boolean>(false);
  const [mfaQrCode, setMfaQrCode] = useState<string>("");
  const [mfaSecret, setMfaSecret] = useState<string>("");
  const [mfaUri, setMfaUri] = useState<string>("");
  const [showMfaSetup, setShowMfaSetup] = useState<boolean>(false);
  const [mfaVerifyCode, setMfaVerifyCode] = useState<string>("");
  const [mfaPartialToken, setMfaPartialToken] = useState<string>("");

  // --- SOC DEVELOPER STATE ---
  const [simulatedLogs, setSimulatedLogs] = useState<SimLogEntry[]>([
    { id: 1, time: "17:10:12", type: "info", text: "Iniciando AegisShield SOC Core..." },
    { id: 2, time: "17:10:14", type: "success", text: "Conexión base de datos SQLite - OK." },
    { id: 3, time: "17:10:18", type: "warning", text: "Escaneo heurístico: Detectada firma sospechosa en URL." },
  ]);
  const [selectedReport, setSelectedReport] = useState<Record<string, unknown> | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("Colombia");

  const latamThreats: Record<string, { attacks: number; threatType: string; risk: string }> = {
    Colombia: { attacks: 1244, threatType: "Gota a Gota / SMS Phishing Bancario (Nequi)", risk: "Alto" },
    México: { attacks: 2108, threatType: "Montadeudas / WhatsApp Extorsión", risk: "Crítico" },
    Perú: { attacks: 890, threatType: "Suplantación de Identidad / QR Menús Falsos", risk: "Medio" },
    Chile: { attacks: 720, threatType: "Phishing de Paquetería / Correos falsos", risk: "Medio" },
    Argentina: { attacks: 1450, threatType: "Suplantación de Billeteras Virtuales", risk: "Alto" },
  };

  // --- API ---
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> || {}) } });
  }, [token]);

  const getFallbackReports = (): Record<string, unknown>[] => [
    { id: 1, phone_number: "+573129871109", bank_account: "Nequi - 3129871109", domain: "rapicreditos-colombia.xyz", description: "Esquema gota a gota con cobros extorsivos.", risk_level: "CRITICAL", risk_score: 88, malicious_indicators: "TLD sospechoso, Reincidente", created_at: "2026-06-09T12:00:00Z" },
    { id: 2, phone_number: "+525543219876", bank_account: "Banco Azteca - 09841", domain: "solucion-deudas-rapidas.click", description: "Fraude montadeudas extorsionando por WhatsApp.", risk_level: "CRITICAL", risk_score: 92, malicious_indicators: "TLD sospechoso, Extorsión", created_at: "2026-06-09T10:15:00Z" },
    { id: 3, phone_number: "+51987654321", bank_account: "BCP - 1928481", domain: "sorteo-navideno-peru.online", description: "Enlace malicioso enviado por SMS imitando sorteo.", risk_level: "HIGH", risk_score: 72, malicious_indicators: "TLD sospechoso, Ingeniería Social", created_at: "2026-06-08T15:30:00Z" },
  ];

  const fetchMfaStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/auth/mfa/status`);
      if (res.ok) {
        const data = await res.json();
        setMfaActive(data.mfa_activo);
      }
    } catch { /* ignore */ }
  }, [token, apiFetch]);

  const setupMfa = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/mfa/setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setMfaSecret(data.secret);
        setMfaUri(data.uri || "");
        setMfaQrCode(`data:image/png;base64,${data.qr_b64}`);
        setShowMfaSetup(true);
      }
    } catch { /* ignore */ }
  }, [token, API_BASE]);

  const enableMfa = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/mfa/enable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaVerifyCode }),
      });
      if (res.ok) {
        setMfaActive(true);
        setShowMfaSetup(false);
        setMfaQrCode("");
        setMfaSecret("");
        setMfaVerifyCode("");
      } else {
        const err = await res.json().catch(() => ({}));
        window.alert(err.detail || "Código inválido");
      }
    } catch { window.alert("Error al activar MFA"); }
  }, [token, API_BASE, mfaVerifyCode]);

  const disableMfa = useCallback(async () => {
    if (!token || !window.confirm("¿Desactivar 2FA? Necesitarás tu código TOTP actual.")) return;
    const code = window.prompt("Ingresa tu código TOTP para desactivar 2FA:");
    if (!code) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/mfa/disable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setMfaActive(false);
      } else {
        const err = await res.json().catch(() => ({}));
        window.alert(err.detail || "Código inválido");
      }
    } catch { window.alert("Error al desactivar MFA"); }
  }, [token, API_BASE]);

  const verifyMfaLogin = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/mfa/verify-login?partial_token=${mfaPartialToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaVerifyCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Código inválido.");
        return;
      }
      const data = await res.json();
      const receivedToken = data.access_token || data.token;
      localStorage.setItem("aegis_token", receivedToken);
      setToken(receivedToken);
      const serverUser = data.usuario;
      const userData: UserData = serverUser
        ? { email: serverUser.email, nombre: serverUser.nombre, rol: serverUser.rol }
        : { email: "", nombre: "Analista", rol: "analista" };
      localStorage.setItem("aegis_user", JSON.stringify(userData));
      setUser(userData);
      setShowMfaSetup(false);
      setMfaPartialToken("");
      setMfaVerifyCode("");
      fetchReports();
    } catch { setError("Error al verificar código MFA."); }
    finally { setLoading(false); }
  }, [API_BASE, mfaPartialToken, mfaVerifyCode]);

  const fetchReports = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const url = token ? `${API_BASE}/api/v1/reportes?page=1&page_size=100` : `${API_BASE}/api/v1/reportes/publico/listar?page=1&page_size=100`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        const backendReports: Record<string, unknown>[] = Array.isArray(data) ? data : (data.items || []);
        setReports(prev => {
          const localOnly = prev.filter(r => (r.id as number) >= 100 && !backendReports.some(br =>
            (br.phone_number === r.phone_number || br.telefono_sospechoso === r.telefono_sospechoso) &&
            (br.domain === r.domain || br.dominio === r.dominio) &&
            (br.description === r.description || br.descripcion === r.descripcion)
          ));
          return [...localOnly, ...backendReports];
        });
      } else {
        setError("Error al cargar reportes. Ejecutando con datos de respaldo.");
        setReports(prev => [...prev.filter(r => (r.id as number) >= 100), ...getFallbackReports()]);
      }
    } catch {
      setError("No se pudo conectar al servidor backend. Usando datos simulados.");
      setReports(prev => [...prev.filter(r => (r.id as number) >= 100), ...getFallbackReports()]);
    } finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchReports, 0);
    const iv = setInterval(fetchReports, 45000);
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(iv);
    };
  }, [fetchReports]);
  useEffect(() => { localStorage.setItem("aegis_scan_history", JSON.stringify(scanHistory)); }, [scanHistory]);

  useEffect(() => {
    localStorage.setItem("aegis_reputation", gamification.reputation.toString());
    localStorage.setItem("aegis_level", gamification.level);
  }, [gamification.level, gamification.reputation]);

  useEffect(() => { localStorage.setItem("aegis_badges", JSON.stringify(gamification.badges)); }, [gamification.badges]);

  // --- AUTH HANDLERS ---
  // --- SCAN HISTORY PERSISTENCE ---
  const fetchScanHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/scan-history?page=1&page_size=50`);
      if (res.ok) {
        const data = await res.json();
        const items: Record<string, unknown>[] = Array.isArray(data) ? data : (data.items || []);
        const mapped: ScanHistoryItem[] = items.map(s => ({
          id: s.id as number,
          type: s.scan_type as string,
          query: (s.content as string).length > 50 ? (s.content as string).slice(0, 47) + "..." : s.content as string,
          score: s.score as number,
          level: s.level as string,
          date: s.created_at ? new Date(s.created_at as string).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Desconocido",
        }));
        setScanHistory(mapped);
        localStorage.setItem("aegis_scan_history", JSON.stringify(mapped));
      }
    } catch { /* silencio */ }
  }, [token, apiFetch]);

  const saveScanToBackend = useCallback(async (scanType: string, content: string, result: ScanResult) => {
    if (!token) return;
    try {
      await apiFetch(`${API_BASE}/api/v1/scan-history`, {
        method: "POST",
        body: JSON.stringify({
          scan_type: scanType,
          content: content,
          score: result.score,
          level: result.level,
          explanation: result.explanation || "",
          recommendations: result.recommendations ? JSON.stringify(result.recommendations) : null,
          indicators: result.indicators ? JSON.stringify(result.indicators) : null,
        }),
      });
    } catch { /* fallback a localStorage */ }
  }, [token, apiFetch]);

  // Fetch scan history from backend when user logs in
  const latestFetch = useRef(fetchScanHistory);
  useEffect(() => { latestFetch.current = fetchScanHistory; });
  useEffect(() => {
    if (token) latestFetch.current();
  }, [token]);

  useEffect(() => {
    if (token) fetchMfaStatus();
  }, [token, fetchMfaStatus]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true); setError("");
    try {
      if (!email.trim() || !password.trim()) { throw new Error("Correo y contraseña son requeridos."); }
      const body = new URLSearchParams({ username: email, password });
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        let msg = errBody.detail || "Credenciales inválidas.";
        if (Array.isArray(msg)) msg = msg.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
        throw new Error(msg);
      }
      const data = await res.json();
      if (data.mfa_required) {
        setMfaPartialToken(data.partial_token);
        setShowMfaSetup(true);
        setAuthMode("");
        setActiveTab("dashboard");
        setLoading(false);
        return;
      }
      const receivedToken = data.access_token || data.token;
      localStorage.setItem("aegis_token", receivedToken);
      setToken(receivedToken);
      const serverUser = data.usuario;
      const userData: UserData = serverUser
        ? { email: serverUser.email, nombre: serverUser.nombre, rol: serverUser.rol }
        : { email, nombre: email.split("@")[0].toUpperCase(), rol: "analista" };
      localStorage.setItem("aegis_user", JSON.stringify(userData));
      setUser(userData);
      setAuthMode(""); setShowGuestBanner(false); setActiveTab("dashboard");
      fetchReports();
    } catch (e) { setError((e as Error).message || "Error al iniciar sesión."); }
    finally { setLoading(false); }
  };

  const handleGuestLogin = () => {
    const guestData: UserData = { email: "", nombre: "Invitado", rol: "guest" };
    setUser(guestData);
    localStorage.setItem("aegis_user", JSON.stringify(guestData));
    setAuthMode(""); setShowGuestBanner(true); setActiveTab("home");
  };

  const handleRegister = async (nombre: string, email: string, password: string) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/registro`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, email, password }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = err.detail || "Error en el registro.";
        if (Array.isArray(msg)) msg = msg.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
        if (typeof msg === "string" && msg.toLowerCase().includes("string_too_short")) msg = "La contraseña debe tener al menos 12 caracteres.";
        throw new Error(msg);
      }
      await handleLogin(email, password);
      setGamification((prev: GamificationState & { level: string }) => {
        if (!prev.badges.includes("defensor_registrado")) {
          return {
            ...prev,
            reputation: prev.reputation + 50,
            badges: [...prev.badges, "defensor_registrado"],
          };
        }
        return prev;
      });
    } catch (e) { setError((e as Error).message || "Error en el registro. Intenta nuevamente."); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    setToken(""); setUser(null);
    localStorage.removeItem("aegis_token"); localStorage.removeItem("aegis_user");
    setActiveTab("home");
  };

  // --- REPORT HANDLERS ---
  const handleCreateReport = async (formPayload: Record<string, unknown>) => {
    try {
      const url = token ? `${API_BASE}/api/v1/reportes` : `${API_BASE}/api/v1/reportes/publico`;
      const res = await apiFetch(url, { method: "POST", body: JSON.stringify(formPayload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "Error al enviar el reporte."); }
      setGamification((prev: GamificationState & { level: string }) => {
        const nextBadges = prev.badges.includes("primer_reporte") ? prev.badges : [...prev.badges, "primer_reporte"];
        return {
          ...prev,
          reputation: prev.reputation + 30,
          badges: nextBadges,
        };
      });
      await fetchReports();
    } catch {
      const simulatedReport: Record<string, unknown> = { id: reports.length + 100, phone_number: formPayload.phone_number || "", bank_account: formPayload.bank_account || "", domain: formPayload.domain || "", description: formPayload.description, risk_level: formPayload.risk_level || "HIGH", risk_score: formPayload.risk_level === "CRITICAL" ? 90 : 65, malicious_indicators: "Reporte Comunitario Local", created_at: new Date().toISOString() };
      setReports(prev => [simulatedReport, ...prev]);
      setGamification((prev: GamificationState & { level: string }) => ({
        ...prev,
        reputation: prev.reputation + 30,
      }));
    }
    if (!token) setShowReportSuccessModal(true);
  };

  const handleDeleteReport = async (id: number) => {
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
    if (!queryValue.trim()) { window.alert("Por favor ingresa contenido para analizar."); return; }

    setIsScanning(true); setScanResult(null); setScanLogs([]);
    const stages = ["🔍 Conectando con AegisShield Threat Engine...", "🤖 Iniciando análisis heurístico por inteligencia artificial...", "🛡️ Correlacionando indicadores de fraude regionales en LATAM...", "⚙️ Evaluando base de datos de phishing y estafas activas...", "✅ Generando reporte simplificado..."];
    for (let i = 0; i < stages.length; i++) { await new Promise(r => setTimeout(r, 350)); setScanLogs(prev => [...prev, stages[i]]); }

    try {
      const res = await fetch(`${API_BASE}/api/v1/reportes/analizar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: scanType, contenido: queryValue }) });
      if (!res.ok) throw new Error("API falló");
      const data: ScanResult = await res.json();
      setScanResult(data);
      const item: ScanHistoryItem = { id: Date.now(), type: scanType, query: queryValue.length > 50 ? queryValue.slice(0, 47) + "..." : queryValue, score: data.score, level: data.level, date: "Ahora mismo" };
      setScanHistory(prev => [item, ...prev.slice(0, 15)]);
      saveScanToBackend(scanType, queryValue, data);
      setGamification((prev: GamificationState & { level: string }) => {
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
      const item: ScanHistoryItem = { id: Date.now(), type: scanType, query: queryValue.length > 50 ? queryValue.slice(0, 47) + "..." : queryValue, score: data.score, level: data.level, date: "Ahora mismo" };
      setScanHistory(prev => [item, ...prev.slice(0, 15)]);
      saveScanToBackend(scanType, queryValue, data);
      setGamification((prev: GamificationState & { level: string }) => ({
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
    showReportSuccessModal, setShowReportSuccessModal,
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
    fetchScanHistory, saveScanToBackend,
    gamification, setGamification,
    simulatedLogs, setSimulatedLogs,
    selectedReport, setSelectedReport,
    selectedCountry, setSelectedCountry,
    latamThreats,
    mfaActive, mfaQrCode, mfaSecret, mfaUri,
    showMfaSetup, setShowMfaSetup,
    mfaVerifyCode, setMfaVerifyCode,
    mfaPartialToken,
    setupMfa, enableMfa, disableMfa, verifyMfaLogin, fetchMfaStatus,
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
