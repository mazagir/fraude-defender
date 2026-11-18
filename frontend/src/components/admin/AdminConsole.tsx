import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../../config/apiBase";

interface AdminProps {
  token: string;
  adminEmail: string;
  onLogout: () => void;
}

type Tab = "dashboard" | "users" | "scans" | "reports" | "audit" | "system";

interface DashboardData {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_analyses: number;
  total_reports: number;
  threats_detected: number;
  scan_by_type: Record<string, number>;
  risk_distribution: Record<string, number>;
  recent_activity: Array<Record<string, unknown>>;
}

interface PaginatedData {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "users", icon: "👥", label: "Usuarios" },
  { id: "scans", icon: "🔍", label: "Analisis" },
  { id: "reports", icon: "🚨", label: "Reportes" },
  { id: "audit", icon: "📝", label: "Audit Logs" },
  { id: "system", icon: "⚙️", label: "Sistema" },
];

const RISK_COLORS: Record<string, string> = {
  critical: "text-red-400", critico: "text-red-400", alto: "text-orange-400", high: "text-orange-400",
  medio: "text-yellow-400", medium: "text-yellow-400", bajo: "text-emerald-400", low: "text-emerald-400",
};

export default function AdminConsole({ token, adminEmail, onLogout }: AdminProps) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [data, setData] = useState<PaginatedData | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState<Record<string, unknown> | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/dashboard`, { headers });
      if (r.ok) setDashboard(await r.json());
    } finally { setLoading(false); }
  }, [token]);

  const fetchTab = useCallback(async () => {
    setLoading(true);
    setData(null);
    setPage(1);
    setSearch("");
    try {
      let url = `${API_BASE}/api/v1/admin/`;
      if (tab === "users") url += "users";
      else if (tab === "scans") url += "scans";
      else if (tab === "reports") url += "reports";
      else if (tab === "audit") url += "audit-logs";
      else if (tab === "system") {
        const r = await fetch(`${API_BASE}/api/v1/admin/system`, { headers });
        if (r.ok) setSystemInfo(await r.json());
        setLoading(false);
        return;
      }
      if (tab !== "dashboard" && tab !== "system") {
        const r = await fetch(`${url}?page=${page}&page_size=15${search ? `&search=${search}` : ""}`, { headers });
        if (r.ok) setData(await r.json());
      }
    } finally { setLoading(false); }
  }, [tab, page, search, token]);

  useEffect(() => {
    if (tab === "dashboard") fetchDashboard();
    else fetchTab();
  }, [tab]);

  useEffect(() => {
    if (tab !== "dashboard" && tab !== "system") fetchTab();
  }, [page]);

  const handleSearch = () => { setPage(1); fetchTab(); };

  const toggleUser = async (id: number) => {
    if (!window.confirm("Confirmar cambio de estado del usuario?")) return;
    await fetch(`${API_BASE}/api/v1/admin/users/${id}/toggle`, { method: "PATCH", headers });
    fetchTab();
  };

  const deleteUser = async (id: number, email: string) => {
    if (!window.confirm(`ELIMINAR definitivamente a ${email}? Esta accion no se puede deshacer.`)) return;
    await fetch(`${API_BASE}/api/v1/admin/users/${id}`, { method: "DELETE", headers });
    fetchTab();
  };

  const deleteReport = async (id: number) => {
    if (!window.confirm("Eliminar este reporte?")) return;
    await fetch(`${API_BASE}/api/v1/admin/reports/${id}`, { method: "DELETE", headers });
    fetchTab();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span className="text-xl">🛡️</span> Admin Console
            <span className="text-[8px] bg-purple-500/10 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full font-mono">SUPER_ADMIN</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Powered by AgiSense · RBAC verificado en backend</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono">{adminEmail}</span>
          <button onClick={onLogout} className="text-[10px] font-bold uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-950/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            Cerrar Sesion
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-[#070911] border border-slate-800/80 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              tab === t.id ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-slate-500 font-mono animate-pulse">Cargando datos del SOC...</div>
        </div>
      )}

      {!loading && tab === "dashboard" && dashboard && <DashboardView data={dashboard} />}
      {!loading && tab === "system" && systemInfo && <SystemView data={systemInfo} />}

      {!loading && data && (tab === "users" || tab === "scans" || tab === "reports" || tab === "audit") && (
        <DataView
          tab={tab} data={data} page={page} setPage={setPage}
          search={search} setSearch={setSearch} onSearch={handleSearch}
          onToggleUser={toggleUser} onDeleteUser={deleteUser} onDeleteReport={deleteReport}
        />
      )}
    </div>
  );
}


function DashboardView({ data }: { data: DashboardData }) {
  const stats = [
    { label: "Usuarios totales", value: data.total_users, color: "text-cyan-400", bg: "from-cyan-500/10" },
    { label: "Activos", value: data.active_users, color: "text-emerald-400", bg: "from-emerald-500/10" },
    { label: "Inactivos", value: data.inactive_users, color: "text-red-400", bg: "from-red-500/10" },
    { label: "Analisis totales", value: data.total_analyses, color: "text-blue-400", bg: "from-blue-500/10" },
    { label: "Reportes", value: data.total_reports, color: "text-purple-400", bg: "from-purple-500/10" },
    { label: "Amenazas detectadas", value: data.threats_detected, color: "text-orange-400", bg: "from-orange-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} to-transparent border border-slate-800/80 rounded-xl p-4`}>
            <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value ?? 0}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#070911] border border-slate-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Analisis por tipo</h3>
          {Object.entries(data.scan_by_type || {}).length === 0 && <p className="text-[10px] text-slate-600">Sin datos aun</p>}
          {Object.entries(data.scan_by_type || {}).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-900 last:border-0">
              <span className="text-[11px] text-slate-400 uppercase font-mono">{k}</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">{String(v)}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#070911] border border-slate-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Distribucion de riesgo</h3>
          {Object.entries(data.risk_distribution || {}).length === 0 && <p className="text-[10px] text-slate-600">Sin datos aun</p>}
          {Object.entries(data.risk_distribution || {}).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-900 last:border-0">
              <span className={`text-[11px] uppercase font-mono font-bold ${RISK_COLORS[k] || "text-slate-400"}`}>{k}</span>
              <span className="text-xs font-bold text-slate-300 font-mono">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#070911] border border-slate-800/80 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Actividad reciente</h3>
        {data.recent_activity.length === 0 && <p className="text-[10px] text-slate-600">Sin actividad reciente</p>}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {data.recent_activity.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-900 last:border-0">
              <span className="text-[10px] font-mono text-slate-600 w-16 shrink-0">
                {a.created_at ? new Date(a.created_at as string).toLocaleTimeString() : ""}
              </span>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                a.type === "scan" ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
              }`}>
                {a.type === "scan" ? (a.scan_type as string) : "reporte"}
              </span>
              <span className="text-[11px] text-slate-400 truncate flex-1">{a.content as string}</span>
              {"score" in a && <span className={`text-[10px] font-mono font-bold ${(a.score as number) >= 70 ? "text-red-400" : (a.score as number) >= 40 ? "text-yellow-400" : "text-emerald-400"}`}>{a.score as number}</span>}
              {"risk_level" in a && <span className={`text-[10px] font-mono font-bold uppercase ${RISK_COLORS[a.risk_level as string] || "text-slate-500"}`}>{a.risk_level as string}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function DataView({ tab, data, page, setPage, search, setSearch, onSearch, onToggleUser, onDeleteUser, onDeleteReport }: {
  tab: Tab; data: PaginatedData; page: number; setPage: (p: number) => void;
  search: string; setSearch: (s: string) => void; onSearch: () => void;
  onToggleUser: (id: number) => void; onDeleteUser: (id: number, email: string) => void; onDeleteReport: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Buscar..." className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-cyan-500/50 outline-none" />
        <button onClick={onSearch} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 cursor-pointer">Buscar</button>
      </div>

      <div className="bg-[#070911] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "users" && <UsersTable data={data} onToggle={onToggleUser} onDelete={onDeleteUser} />}
          {tab === "scans" && <ScansTable data={data} />}
          {tab === "reports" && <ReportsTable data={data} onDelete={onDeleteReport} />}
          {tab === "audit" && <AuditTable data={data} />}
        </div>
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="px-3 py-1 text-[10px] font-bold border border-slate-700 rounded-lg text-slate-400 hover:border-cyan-500/40 disabled:opacity-30 cursor-pointer">Anterior</button>
          <span className="text-[10px] text-slate-500 font-mono">Pagina {page} de {data.pages} ({data.total} registros)</span>
          <button onClick={() => setPage(Math.min(data.pages, page + 1))} disabled={page >= data.pages}
            className="px-3 py-1 text-[10px] font-bold border border-slate-700 rounded-lg text-slate-400 hover:border-cyan-500/40 disabled:opacity-30 cursor-pointer">Siguiente</button>
        </div>
      )}
    </div>
  );
}


function UsersTable({ data, onToggle, onDelete }: { data: PaginatedData; onToggle: (id: number) => void; onDelete: (id: number, email: string) => void }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-800 bg-slate-950/60">
          {["ID", "Nombre", "Email", "Rol", "Estado", "Registro", "Acciones"].map((h) => (
            <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-widest font-bold text-slate-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.items.map((u) => (
          <tr key={u.id} className="border-b border-slate-900 hover:bg-slate-900/30 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{String(u.id)}</td>
            <td className="px-4 py-3 text-xs font-bold text-slate-200">{String(u.nombre)}</td>
            <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">{String(u.email)}</td>
            <td className="px-4 py-3">
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                u.rol === "super_admin" ? "border-red-500/40 text-red-300 bg-red-500/10" :
                u.rol === "admin" ? "border-purple-500/40 text-purple-300 bg-purple-500/10" :
                "border-slate-700 text-slate-400"
              }`}>{String(u.rol)}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${u.es_activo ? "text-emerald-400" : "text-red-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${u.es_activo ? "bg-emerald-400" : "bg-red-400"}`} />
                {u.es_activo ? "Activo" : "Inactivo"}
              </span>
            </td>
            <td className="px-4 py-3 text-[10px] text-slate-500 font-mono">
              {u.created_at ? new Date(u.created_at as string).toLocaleDateString() : "-"}
            </td>
            <td className="px-4 py-3 flex gap-1">
              {u.rol !== "super_admin" && (
                <>
                  <button onClick={() => onToggle(u.id as number)} className="text-[9px] font-bold uppercase px-2 py-1 rounded border border-slate-700 text-slate-400 hover:border-cyan-500/40 cursor-pointer">
                    {u.es_activo ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => onDelete(u.id as number, String(u.email))} className="text-[9px] font-bold uppercase px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-950/20 cursor-pointer">
                    Eliminar
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
        {data.items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">Sin resultados</td></tr>}
      </tbody>
    </table>
  );
}


function ScansTable({ data }: { data: PaginatedData }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-800 bg-slate-950/60">
          {["ID", "Tipo", "Contenido", "Score", "Nivel", "Fecha"].map((h) => (
            <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-widest font-bold text-slate-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.items.map((s) => (
          <tr key={s.id} className="border-b border-slate-900 hover:bg-slate-900/30 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{String(s.id)}</td>
            <td className="px-4 py-3">
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">{String(s.scan_type)}</span>
            </td>
            <td className="px-4 py-3 text-[11px] text-slate-400 max-w-[200px] truncate">{String(s.content)}</td>
            <td className="px-4 py-3 text-xs font-mono font-bold text-cyan-400">{String(s.score)}</td>
            <td className="px-4 py-3">
              <span className={`text-[9px] font-bold uppercase ${RISK_COLORS[String(s.level)] || "text-slate-400"}`}>{String(s.level)}</span>
            </td>
            <td className="px-4 py-3 text-[10px] text-slate-500 font-mono">
              {s.created_at ? new Date(s.created_at as string).toLocaleDateString() : "-"}
            </td>
          </tr>
        ))}
        {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">Sin analisis</td></tr>}
      </tbody>
    </table>
  );
}


function ReportsTable({ data, onDelete }: { data: PaginatedData; onDelete: (id: number) => void }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-800 bg-slate-950/60">
          {["ID", "Dominio/Tel", "Descripcion", "Riesgo", "Score", "Fecha", "Acciones"].map((h) => (
            <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-widest font-bold text-slate-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.items.map((r) => (
          <tr key={r.id} className="border-b border-slate-900 hover:bg-slate-900/30 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{String(r.id)}</td>
            <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">{String(r.domain || r.phone_number || "-")}</td>
            <td className="px-4 py-3 text-[11px] text-slate-400 max-w-[180px] truncate">{String(r.description)}</td>
            <td className="px-4 py-3">
              <span className={`text-[9px] font-bold uppercase ${RISK_COLORS[String(r.risk_level)] || "text-slate-400"}`}>{String(r.risk_level)}</span>
            </td>
            <td className="px-4 py-3 text-xs font-mono font-bold text-cyan-400">{String(r.risk_score ?? "-")}</td>
            <td className="px-4 py-3 text-[10px] text-slate-500 font-mono">
              {r.created_at ? new Date(r.created_at as string).toLocaleDateString() : "-"}
            </td>
            <td className="px-4 py-3">
              <button onClick={() => onDelete(r.id as number)} className="text-[9px] font-bold uppercase px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-950/20 cursor-pointer">Eliminar</button>
            </td>
          </tr>
        ))}
        {data.items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">Sin reportes</td></tr>}
      </tbody>
    </table>
  );
}


function AuditTable({ data }: { data: PaginatedData }) {
  const ACTION_COLORS: Record<string, string> = {
    VIEW_DASHBOARD: "text-cyan-400", TOGGLE_USER: "text-yellow-400", DELETE_USER: "text-red-400",
    CREATE_USER: "text-emerald-400", DELETE_REPORT: "text-orange-400",
  };
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-800 bg-slate-950/60">
          {["ID", "Admin", "Accion", "Target", "Detalle", "Fecha"].map((h) => (
            <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-widest font-bold text-slate-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.items.map((l) => (
          <tr key={l.id} className="border-b border-slate-900 hover:bg-slate-900/30 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{String(l.id)}</td>
            <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">{String(l.admin_email)}</td>
            <td className="px-4 py-3">
              <span className={`text-[9px] font-bold uppercase font-mono ${ACTION_COLORS[String(l.action)] || "text-slate-400"}`}>{String(l.action)}</span>
            </td>
            <td className="px-4 py-3 text-[10px] text-slate-500">{l.target_type ? `${l.target_type}#${l.target_id}` : "-"}</td>
            <td className="px-4 py-3 text-[10px] text-slate-500 max-w-[150px] truncate">{String(l.detail || "-")}</td>
            <td className="px-4 py-3 text-[10px] text-slate-500 font-mono">
              {l.created_at ? new Date(l.created_at as string).toLocaleString() : "-"}
            </td>
          </tr>
        ))}
        {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">Sin logs de auditoria</td></tr>}
      </tbody>
    </table>
  );
}


function SystemView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#070911] border border-slate-800/80 rounded-xl p-6">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Informacion del sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-slate-900 last:border-0">
              <span className="text-[11px] text-slate-500 uppercase font-mono">{k.replace(/_/g, " ")}</span>
              <span className="text-xs font-bold text-slate-200 font-mono">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#070911] border border-slate-800/80 rounded-xl p-6">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3">Acerca de</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong className="text-slate-300">AgielShield</strong> — Plataforma de Inteligencia contra Fraudes Digitales.<br />
          Powered by <strong className="text-cyan-400">AgiSense</strong> — Motor propietario de analisis de amenazas.<br />
          <span className="text-slate-600">FrauDefender es la comunidad de usuarios que detecta y reporta amenazas.</span>
        </p>
      </div>
    </div>
  );
}
