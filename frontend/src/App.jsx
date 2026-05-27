import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

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
    const date = new Date(r.created_at || r.fecha_reporte || Date.now());
    const key = months[date.getMonth()];
    const lvl = getRiskLevel(r.risk_score ?? 0);
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
    const d = new Date(r.created_at || r.fecha_reporte || Date.now());
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

// ─── SIDEBAR ───────────────────────────────────────────────────────────────
function Sidebar({ view, setView, reportsCount }) {
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "reportes",  icon: "📋", label: "Reportes", badge: reportsCount },
    { id: "amenazas",  icon: "⚠️", label: "Amenazas" },
    { id: "intel",     icon: "🧠", label: "Threat Intel" },
  ];
  return (
    <aside style={{ width: 220, minHeight: "100vh", background: "#0f1320", borderRight: "1px solid rgba(99,130,255,0.15)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "24px 20px 18px", borderBottom: "1px solid rgba(99,130,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4f7cff,#00e5b4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#e8ecf8" }}>AegisShield</div>
            <div style={{ fontSize: 10, color: "#6b7fa3", letterSpacing: "1.5px", textTransform: "uppercase" }}>Anti-Fraud</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        <div style={{ fontSize: 10, color: "#6b7fa3", letterSpacing: "1.5px", textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Principal</div>
        {navItems.map((item) => (
          <motion.button key={item.id} whileTap={{ scale: 0.97 }} onClick={() => setView(item.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 8, color: view === item.id ? "#4f7cff" : "#6b7fa3", background: view === item.id ? "rgba(79,124,255,0.1)" : "transparent", border: view === item.id ? "1px solid rgba(79,124,255,0.2)" : "1px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, marginBottom: 2, fontFamily: "inherit", textAlign: "left" }}>
            <span>{item.icon}</span>{item.label}
            {item.badge > 0 && <span style={{ marginLeft: "auto", background: "#ff4d6d", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>{item.badge > 99 ? "99+" : item.badge}</span>}
          </motion.button>
        ))}
      </nav>
      <div style={{ padding: 16, borderTop: "1px solid rgba(99,130,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#534AB7,#4f7cff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff" }}>AD</div>
          <div><div style={{ fontSize: 13, fontWeight: 500, color: "#e8ecf8" }}>Admin</div><div style={{ fontSize: 11, color: "#6b7fa3" }}>Analista</div></div>
          <div style={{ width: 7, height: 7, background: "#00e5b4", borderRadius: "50%", marginLeft: "auto", animation: "pulse 2s infinite" }} />
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value, color, icon, change, changeDir }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
      style={{ background: "#0f1320", border: "1px solid rgba(99,130,255,0.15)", borderRadius: 12, padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},transparent)` }} />
      <div style={{ fontSize: 10, color: "#6b7fa3", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
      {change && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, color: changeDir === "up" ? "#ff4d6d" : "#00e5b4" }}>{changeDir === "up" ? "↑" : "↓"} {change}</div>}
      <div style={{ position: "absolute", top: 18, right: 18, fontSize: 22, opacity: 0.18 }}>{icon}</div>
    </motion.div>
  );
}

function RiskBadge({ level }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: riskBg[level], color: riskColor[level] }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: riskColor[level], display: "inline-block" }} />
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#161b2c", border: "1px solid rgba(99,130,255,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#e8ecf8", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 3 }}>
          {p.dataKey === "alto" ? "Alto" : p.dataKey === "medio" ? "Medio" : p.dataKey === "bajo" ? "Bajo" : "Reportes"}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── MODAL NUEVO REPORTE ───────────────────────────────────────────────────
function ReportModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ telefono_sospechoso: "", dominio: "", descripcion: "", banco_recaudo: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.descripcion.trim()) { setError("La descripción es obligatoria."); return; }
    setLoading(true); setError("");
    try { await onSubmit(form); onClose(); }
    catch (e) { setError(e.message || "Error al crear reporte."); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", background: "#0a0d14", border: "1px solid rgba(99,130,255,0.2)", borderRadius: 8, padding: "10px 14px", color: "#e8ecf8", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(10,13,20,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()}
        style={{ background: "#0f1320", border: "1px solid rgba(99,130,255,0.25)", borderRadius: 16, padding: 28, width: 480, maxWidth: "90vw" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e8ecf8" }}>🛡️ Nuevo Reporte de Fraude</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7fa3", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <label style={{ fontSize: 11, color: "#6b7fa3", textTransform: "uppercase" }}>Descripción *</label>
        <textarea rows={3} placeholder="Describe el fraude..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ ...inp, resize: "vertical" }} />
        <label style={{ fontSize: 11, color: "#6b7fa3", textTransform: "uppercase" }}>Teléfono sospechoso</label>
        <input placeholder="+57 300 000 0000" value={form.telefono_sospechoso} onChange={(e) => setForm({ ...form, telefono_sospechoso: e.target.value })} style={inp} />
        <label style={{ fontSize: 11, color: "#6b7fa3", textTransform: "uppercase" }}>Dominio / URL</label>
        <input placeholder="ejemplo-fraude.com" value={form.dominio} onChange={(e) => setForm({ ...form, dominio: e.target.value })} style={inp} />
        <label style={{ fontSize: 11, color: "#6b7fa3", textTransform: "uppercase" }}>Banco / cuenta de recaudo</label>
        <input placeholder="Nequi, Daviplata..." value={form.banco_recaudo} onChange={(e) => setForm({ ...form, banco_recaudo: e.target.value })} style={inp} />
        {error && <div style={{ color: "#ff4d6d", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(99,130,255,0.2)", background: "transparent", color: "#6b7fa3", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: loading ? "#374080" : "#4f7cff", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            {loading ? "Enviando..." : "Registrar IoC"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
function LoginView({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const body = new URLSearchParams({ username: form.username, password: form.password });
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!res.ok) throw new Error("Credenciales incorrectas");
      const data = await res.json();
      const receivedToken = data.access_token || data.token || Object.values(data)[0];
      if (!receivedToken) throw new Error("No se recibió token del servidor");
      onLogin(receivedToken);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", background: "#0a0d14", border: "1px solid rgba(99,130,255,0.2)", borderRadius: 8, padding: "12px 14px", color: "#e8ecf8", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "#0f1320", border: "1px solid rgba(99,130,255,0.18)", borderRadius: 16, padding: 40, width: 400, maxWidth: "90vw" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e8ecf8" }}>AegisShield</div>
          <div style={{ fontSize: 13, color: "#6b7fa3", marginTop: 4 }}>Plataforma Anti-Fraude LATAM</div>
        </div>
        <label style={{ fontSize: 11, color: "#6b7fa3", textTransform: "uppercase" }}>Usuario o Email</label>
        <input placeholder="neil@mail.com" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={inp} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        <label style={{ fontSize: 11, color: "#6b7fa3", textTransform: "uppercase" }}>Contraseña</label>
        <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inp} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        {error && <div style={{ color: "#ff4d6d", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{error}</div>}
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: loading ? "#374080" : "#4f7cff", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit", marginBottom: 12 }}>
          {loading ? "Autenticando..." : "Iniciar Sesión"}
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function DashboardView({ reports }) {
  const total  = reports.length;
  const altos  = reports.filter((r) => getRiskLevel(r.risk_score ?? 0) === "alto").length;
  const medios = reports.filter((r) => getRiskLevel(r.risk_score ?? 0) === "medio").length;
  const bajos  = reports.filter((r) => getRiskLevel(r.risk_score ?? 0) === "bajo").length;
  const monthlyData = buildMonthlyData(reports);
  const trendData   = buildTrendData(reports);
  const pieData = [
    { name: "Alto",  value: altos,  color: "#ff4d6d" },
    { name: "Medio", value: medios, color: "#ffb547" },
    { name: "Bajo",  value: bajos,  color: "#00e5b4" },
  ].filter((d) => d.value > 0);
  const card = (s) => ({ background: "#0f1320", border: "1px solid rgba(99,130,255,0.15)", borderRadius: 12, padding: 20, ...s });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Reportes" value={total} color="#4f7cff" icon="🛡️" change={`${total} registrados`} changeDir="down" />
        <MetricCard label="Alto Riesgo" value={altos} color="#ff4d6d" icon="🔥" change={altos > 0 ? "Requieren atención" : "Sin alertas"} changeDir={altos > 0 ? "up" : "down"} />
        <MetricCard label="Riesgo Medio" value={medios} color="#ffb547" icon="⚠️" change="En seguimiento" changeDir="up" />
        <MetricCard label="Bajo Riesgo" value={bajos} color="#00e5b4" icon="✅" change="Bajo control" changeDir="down" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={card({})}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf8" }}>📊 Reportes por Mes</div>
            <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
              {[["#ff4d6d","Alto"],["#ffb547","Medio"],["#00e5b4","Bajo"]].map(([c,l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, color: "#6b7fa3" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.07)" />
              <XAxis dataKey="name" tick={{ fill: "#6b7fa3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7fa3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="alto" fill="#ff4d6d" radius={[3,3,0,0]} />
              <Bar dataKey="medio" fill="#ffb547" radius={[3,3,0,0]} />
              <Bar dataKey="bajo" fill="#00e5b4" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card({})}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf8", marginBottom: 18 }}>🎯 Distribución de Riesgos</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={pieData.length ? pieData : [{ name: "Sin datos", value: 1, color: "#2a3050" }]} cx="50%" cy="50%" innerRadius={58} outerRadius={85} paddingAngle={4} dataKey="value">
                  {(pieData.length ? pieData : [{ color: "#2a3050" }]).map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                  <div style={{ flex: 1, fontSize: 12, color: "#6b7fa3" }}>{d.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e8ecf8", fontFamily: "monospace" }}>{d.value}</div>
                  <div style={{ fontSize: 11, color: "#6b7fa3", minWidth: 34, textAlign: "right" }}>{total > 0 ? Math.round((d.value / total) * 100) : 0}%</div>
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(99,130,255,0.1)" }}>
                <div style={{ fontSize: 11, color: "#6b7fa3", marginBottom: 4 }}>Tasa resolución</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#00e5b4", fontFamily: "monospace" }}>{total > 0 ? Math.round(((medios + bajos) / total) * 100) : 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        <div style={card({})}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf8", marginBottom: 18 }}>📈 Tendencia (7 días)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f7cff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f7cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.07)" />
              <XAxis dataKey="name" tick={{ fill: "#6b7fa3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7fa3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="reportes" stroke="#4f7cff" strokeWidth={2} fill="url(#gradBlue)" dot={{ fill: "#4f7cff", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...card({}), padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(99,130,255,0.1)", fontSize: 14, fontWeight: 600, color: "#e8ecf8" }}>📋 Últimos Reportes</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(22,27,44,0.8)" }}>
                {["ID","Descripción","Riesgo"].map((h) => (
                  <th key={h} style={{ padding: "9px 16px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#6b7fa3", textAlign: "left", borderBottom: "1px solid rgba(99,130,255,0.08)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 6).map((r, i) => (
                <motion.tr key={r.id ?? i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: "1px solid rgba(99,130,255,0.05)" }}>
                  <td style={{ padding: "11px 16px", fontSize: 11, color: "#6b7fa3", fontFamily: "monospace" }}>#{r.id}</td>
                  <td style={{ padding: "11px 16px", fontSize: 12, color: "#c5cde8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                  <td style={{ padding: "11px 16px" }}><RiskBadge level={getRiskLevel(r.risk_score ?? 0)} /></td>
                </motion.tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: "#6b7fa3", fontSize: 13 }}>Sin reportes registrados aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── REPORTES ──────────────────────────────────────────────────────────────
function ReportesView({ reports, onDelete, token }) {
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("todos");
  const filtered = reports.filter((r) => {
    const level = getRiskLevel(r.risk_score ?? 0);
    const matchRisk = filterRisk === "todos" || level === filterRisk;
    const q = search.toLowerCase();
    const matchSearch = !q || (r.description || "").toLowerCase().includes(q) || String(r.id).includes(q) || (r.phone_number || "").includes(q) || (r.domain || "").includes(q);
    return matchRisk && matchSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input placeholder="🔍 Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: "#0f1320", border: "1px solid rgba(99,130,255,0.2)", borderRadius: 8, padding: "10px 14px", color: "#e8ecf8", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        {["todos","alto","medio","bajo"].map((f) => (
          <button key={f} onClick={() => setFilterRisk(f)}
            style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid", borderColor: filterRisk === f ? "rgba(79,124,255,0.4)" : "rgba(99,130,255,0.15)", background: filterRisk === f ? "rgba(79,124,255,0.12)" : "transparent", color: filterRisk === f ? "#4f7cff" : "#6b7fa3", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ fontSize: 12, color: "#6b7fa3", alignSelf: "center" }}>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</div>
      </div>
      <div style={{ background: "#0f1320", border: "1px solid rgba(99,130,255,0.15)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(22,27,44,0.9)" }}>
              {["ID","Descripción","Teléfono","Dominio","Score","Riesgo","Fecha","Acción"].map((h) => (
                <th key={h} style={{ padding: "11px 16px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#6b7fa3", textAlign: "left", borderBottom: "1px solid rgba(99,130,255,0.1)", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((r, i) => {
                const level = getRiskLevel(r.risk_score ?? 0);
                const fecha = r.created_at ? new Date(r.created_at).toLocaleDateString("es-CO") : "—";
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid rgba(99,130,255,0.05)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: "#6b7fa3", fontFamily: "monospace" }}>#{r.id}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#c5cde8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: "#6b7fa3", fontFamily: "monospace" }}>{r.phone_number || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: "#6b7fa3" }}>{r.domain || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: riskColor[level], fontWeight: 700, fontFamily: "monospace" }}>{r.risk_score ?? 0}</td>
                    <td style={{ padding: "12px 16px" }}><RiskBadge level={level} /></td>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: "#6b7fa3" }}>{fecha}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {token && <button onClick={() => onDelete(r.id)} style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)", color: "#ff4d6d", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#6b7fa3", fontSize: 13 }}>Sin reportes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AMENAZAS ──────────────────────────────────────────────────────────────
function AmenazasView({ reports }) {
  const telefonos = {}, dominios = {};
  reports.forEach((r) => {
    if (r.phone_number) telefonos[r.phone_number] = (telefonos[r.phone_number] || 0) + 1;
    if (r.domain) dominios[r.domain] = (dominios[r.domain] || 0) + 1;
  });
  const topTel = Object.entries(telefonos).sort((a,b) => b[1]-a[1]).slice(0,10);
  const topDom = Object.entries(dominios).sort((a,b) => b[1]-a[1]).slice(0,10);
  const altos  = reports.filter((r) => getRiskLevel(r.risk_score ?? 0) === "alto").slice(0, 8);
  const card = (s) => ({ background: "#0f1320", border: "1px solid rgba(99,130,255,0.15)", borderRadius: 12, ...s });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={card({ padding: 20, gridColumn: "1/-1" })}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf8", marginBottom: 16 }}>📱 Teléfonos más reportados</div>
        {topTel.length === 0 ? <div style={{ color: "#6b7fa3", fontSize: 13, padding: "20px 0" }}>Sin datos aún.</div> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topTel.map(([t,c]) => ({ name: t.slice(-8), count: c }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.07)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7fa3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#6b7fa3", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#4f7cff" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div style={card({ padding: 20 })}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf8", marginBottom: 16 }}>🌐 Dominios sospechosos</div>
        {topDom.length === 0 ? <div style={{ color: "#6b7fa3", fontSize: 13 }}>Sin dominios.</div> : topDom.map(([d,c]) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, fontSize: 12, color: "#c5cde8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d}</div>
            <div style={{ background: "rgba(255,77,109,0.12)", color: "#ff4d6d", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{c}x</div>
          </div>
        ))}
      </div>
      <div style={card({ padding: 20 })}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf8", marginBottom: 16 }}>🔥 Amenazas Críticas</div>
        {altos.length === 0 ? <div style={{ color: "#6b7fa3", fontSize: 13 }}>Sin amenazas críticas.</div> : altos.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: "rgba(255,77,109,0.07)", border: "1px solid rgba(255,77,109,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#e8ecf8", marginBottom: 4 }}>{r.description}</div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6b7fa3" }}>
              <span>Score: <strong style={{ color: "#ff4d6d" }}>{r.risk_score}</strong></span>
              {r.phone_number && <span>📱 {r.phone_number}</span>}
              {r.domain && <span>🌐 {r.domain}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── THREAT INTEL ──────────────────────────────────────────────────────────
function ThreatIntelView({ reports }) {
  const blacklistTel = [...new Set(reports.filter((r) => r.phone_number).map((r) => r.phone_number))];
  const blacklistDom = [...new Set(reports.filter((r) => r.domain).map((r) => r.domain))];
  const blacklistBan = [...new Set(reports.filter((r) => r.banco_recaudo).map((r) => r.banco_recaudo))];
  const scoreData = [
    { rango: "0-20",   count: reports.filter((r) => (r.risk_score ?? 0) <= 20).length },
    { rango: "21-40",  count: reports.filter((r) => (r.risk_score ?? 0) > 20  && (r.risk_score ?? 0) <= 40).length },
    { rango: "41-60",  count: reports.filter((r) => (r.risk_score ?? 0) > 40  && (r.risk_score ?? 0) <= 60).length },
    { rango: "61-80",  count: reports.filter((r) => (r.risk_score ?? 0) > 60  && (r.risk_score ?? 0) <= 80).length },
    { rango: "81-100", count: reports.filter((r) => (r.risk_score ?? 0) > 80).length },
  ];
  const card = (s) => ({ background: "#0f1320", border: "1px solid rgba(99,130,255,0.15)", borderRadius: 12, ...s });
  const listStyle = { fontFamily: "monospace", fontSize: 12, color: "#c5cde8", padding: "8px 12px", background: "rgba(99,130,255,0.05)", borderRadius: 6, marginBottom: 6, display: "block" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      <div style={card({ padding: 20, gridColumn: "1/-1" })}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf8", marginBottom: 16 }}>🧠 Distribución de Scores</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.07)" />
            <XAxis dataKey="rango" tick={{ fill: "#6b7fa3", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7fa3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4,4,0,0]}>
              {scoreData.map((_, i) => <Cell key={i} fill={["#00e5b4","#00e5b4","#ffb547","#ff4d6d","#ff4d6d"][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {[
        { title: "📵 Teléfonos en lista negra", items: blacklistTel },
        { title: "🌐 Dominios bloqueados", items: blacklistDom },
        { title: "🏦 Cuentas de recaudo", items: blacklistBan },
      ].map(({ title, items }) => (
        <div key={title} style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e8ecf8", marginBottom: 14 }}>{title} <span style={{ color: "#6b7fa3", fontWeight: 400, fontSize: 12 }}>({items.length})</span></div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {items.length === 0 ? <div style={{ color: "#6b7fa3", fontSize: 12 }}>Sin registros</div> : items.map((item) => <span key={item} style={listStyle}>{item}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]         = useState(() => localStorage.getItem("aegis_token") || "");
  const [view, setView]           = useState("dashboard");
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError]         = useState("");

  // ── fetch con token explícito para evitar race condition ──
  const fetchReports = useCallback(async (tkn) => {
    const t = tkn !== undefined ? tkn : token;
    if (!t) return;
    setLoading(true); setError("");
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/reportes`, t);
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        console.warn("Token expirado o inválido");
      } else {
        setError("Error al cargar reportes.");
      }
    } catch {
      setError("No se pudo conectar con la API.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchReports(token);
      const iv = setInterval(() => fetchReports(token), 30000);
      return () => clearInterval(iv);
    }
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem("aegis_token", newToken);
    setToken(newToken);
    // Usar el token directamente, no esperar al estado
    setTimeout(() => fetchReports(newToken), 100);
  };

  const handleLogout = () => {
    setToken(""); localStorage.removeItem("aegis_token"); setReports([]);
  };

  const handleCreateReport = async (form) => {
  const payload = {
  description: form.descripcion,
  phone_number: form.telefono_sospechoso,
  domain: form.dominio,
  bank_account: form.banco_recaudo,
};
    const res = await apiFetch(`${API_BASE}/api/v1/reportes`, token, { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(JSON.stringify(err) || "Error al crear reporte");
    }
    await fetchReports(token);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Eliminar reporte #${id}?`)) return;
    const res = await apiFetch(`${API_BASE}/api/v1/reportes${id}`, token, { method: "DELETE" });
    if (res.ok) await fetchReports(token);
  };

  const viewTitles = { dashboard: "Centro de Comando", reportes: "Módulo de Reportes", amenazas: "Amenazas Activas", intel: "Threat Intelligence" };

  if (!token) return <LoginView onLogin={handleLogin} />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0d14; color: #e8ecf8; font-family: 'Space Grotesk', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0d14; }
        ::-webkit-scrollbar-thumb { background: rgba(99,130,255,0.2); border-radius: 3px; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(0,229,180,0.15); } 50% { box-shadow: 0 0 0 6px rgba(0,229,180,0.07); } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar view={view} setView={setView} reportsCount={reports.filter((r) => getRiskLevel(r.risk_score ?? 0) === "alto").length} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ height: 60, background: "#0f1320", borderBottom: "1px solid rgba(99,130,255,0.12)", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e8ecf8" }}>{viewTitles[view]}</div>
              <div style={{ fontSize: 11, color: "#6b7fa3" }}>AegisShield · {new Date().toLocaleDateString("es-CO",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              {loading && <div style={{ fontSize: 12, color: "#6b7fa3" }}>⟳ Actualizando...</div>}
              {error && <div style={{ fontSize: 12, color: "#ff4d6d" }}>{error}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,229,180,0.08)", border: "1px solid rgba(0,229,180,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 11, color: "#00e5b4", fontWeight: 500 }}>
                <div style={{ width: 6, height: 6, background: "#00e5b4", borderRadius: "50%", animation: "pulse 1.5s infinite" }} /> EN VIVO
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
                style={{ background: "#4f7cff", color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                + Nuevo Reporte
              </motion.button>
              <button onClick={handleLogout}
                style={{ background: "transparent", border: "1px solid rgba(255,77,109,0.25)", color: "#ff4d6d", padding: "7px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                Salir
              </button>
            </div>
          </div>

          <div style={{ padding: 28, flex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                {view === "dashboard" && <DashboardView reports={reports} />}
                {view === "reportes"  && <ReportesView reports={reports} onDelete={handleDelete} token={token} />}
                {view === "amenazas"  && <AmenazasView reports={reports} />}
                {view === "intel"     && <ThreatIntelView reports={reports} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <ReportModal onClose={() => setShowModal(false)} onSubmit={handleCreateReport} />}
      </AnimatePresence>
    </>
  );
}
