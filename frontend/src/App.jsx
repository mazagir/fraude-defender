import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShieldAlt, FaExclamationTriangle, FaGlobe, FaPhone,
  FaChartBar, FaBug, FaCog, FaBars, FaPlus, FaTimes,
  FaFilter, FaKey, FaListAlt, FaBrain, FaTrash,
  FaChevronLeft, FaChevronRight, FaInbox,
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const API = "https://fraude-defender-api.onrender.com";
const COLORS = ["#ef4444", "#eab308", "#22c55e"];
const POR_PAGINA = 10;

// ─── EMPTY STATE ──────────────────────────────────────────────
function EmptyState({ mensaje = "No hay datos para mostrar" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <FaInbox className="text-6xl mb-4 text-gray-700" />
      <p className="text-lg font-medium">{mensaje}</p>
      <p className="text-sm mt-1">Los reportes aparecerán aquí cuando se registren</p>
    </div>
  );
}

// ─── PAGINACION ───────────────────────────────────────────────
function Paginacion({ total, pagina, onChange }) {
  const totalPaginas = Math.ceil(total / POR_PAGINA);
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <span className="text-gray-500 text-sm">{total} resultados · Página {pagina} de {totalPaginas}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <FaChevronLeft />
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-2 rounded-lg font-bold text-sm transition ${p === pagina ? "bg-green-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

// ─── TABLA REUTILIZABLE ───────────────────────────────────────
function TablaReportes({ reportes, onEliminar, paginar = false }) {
  const [pagina, setPagina] = useState(1);
  const [eliminando, setEliminando] = useState(null);

  const paginados = paginar
    ? reportes.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
    : reportes;

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este reporte?")) return;
    setEliminando(id);
    try {
      await fetch(`${API}/reportes/${id}`, { method: "DELETE" });
      if (onEliminar) onEliminar(id);
    } catch (e) {
      console.error(e);
    }
    setEliminando(null);
  };

  if (reportes.length === 0) return <EmptyState />;

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-700 text-gray-400">
            <th className="p-3">Teléfono</th>
            <th className="p-3">Cuenta</th>
            <th className="p-3">Dominio</th>
            <th className="p-3">Riesgo</th>
            <th className="p-3">Descripción</th>
            {onEliminar && <th className="p-3 text-center">Acción</th>}
          </tr>
        </thead>
        <tbody>
          {paginados.map((r) => (
            <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
              <td className="p-3">{r.phone_number || "—"}</td>
              <td className="p-3">{r.bank_account || "—"}</td>
              <td className="p-3">{r.domain || "—"}</td>
              <td className="p-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.risk_level === "alto" ? "bg-red-500" : r.risk_level === "medio" ? "bg-yellow-500" : "bg-green-600"}`}>
                  {r.risk_level}
                </span>
              </td>
              <td className="p-3 text-gray-300">{r.description}</td>
              {onEliminar && (
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleEliminar(r.id)}
                    disabled={eliminando === r.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 p-2 rounded-lg transition disabled:opacity-50"
                  >
                    <FaTrash />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {paginar && <Paginacion total={reportes.length} pagina={pagina} onChange={setPagina} />}
    </>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ reportes, onNuevoReporte }) {
  const altos = reportes.filter((r) => r.risk_level === "alto").length;
  const medios = reportes.filter((r) => r.risk_level === "medio").length;
  const bajos = reportes.filter((r) => r.risk_level === "bajo").length;
  const dataBar = [
    { name: "Altos", cantidad: altos },
    { name: "Medios", cantidad: medios },
    { name: "Bajos", cantidad: bajos },
    { name: "Totales", cantidad: reportes.length },
  ];
  const dataPie = [
    { name: "Alto", value: altos },
    { name: "Medio", value: medios },
    { name: "Bajo", value: bajos },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold">
          Cybersecurity Dashboard
        </motion.h1>
        <button onClick={onNuevoReporte} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition">
          <FaPlus /> Nuevo Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { icon: <FaShieldAlt className="text-4xl text-green-400 mb-4" />, val: reportes.length, label: "Reportes Totales" },
          { icon: <FaExclamationTriangle className="text-4xl text-red-400 mb-4" />, val: altos, label: "Riesgo Alto" },
          { icon: <FaGlobe className="text-4xl text-blue-400 mb-4" />, val: [...new Set(reportes.map(r => r.domain).filter(Boolean))].length, label: "Dominios Detectados" },
          { icon: <FaPhone className="text-4xl text-yellow-400 mb-4" />, val: [...new Set(reportes.map(r => r.phone_number).filter(Boolean))].length, label: "Números Sospechosos" },
        ].map((c, i) => (
          <motion.div key={i} whileHover={{ scale: 1.05 }} className="bg-gray-900 rounded-2xl p-6 shadow-lg">
            {c.icon}
            <h2 className="text-3xl font-bold">{c.val}</h2>
            <p className="text-gray-400">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Estadísticas de Riesgo</h2>
          {reportes.length === 0 ? <EmptyState mensaje="Sin datos para graficar" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataBar}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: "#111827", border: "none" }} />
                <Bar dataKey="cantidad" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Distribución por Riesgo</h2>
          {reportes.length === 0 ? <EmptyState mensaje="Sin datos para graficar" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dataPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {dataPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "#111827", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-auto">
        <h2 className="text-xl font-bold mb-4">Últimos 5 Reportes</h2>
        <TablaReportes reportes={reportes.slice(0, 5)} />
      </div>
    </>
  );
}

// ─── REPORTES ─────────────────────────────────────────────────
function Reportes({ reportes, onNuevoReporte, onEliminar }) {
  const [filtroRiesgo, setFiltroRiesgo] = useState("todos");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const filtrados = reportes.filter((r) => {
    const matchRiesgo = filtroRiesgo === "todos" || r.risk_level === filtroRiesgo;
    const q = filtroBusqueda.toLowerCase();
    const matchBusqueda = !q ||
      (r.phone_number || "").includes(q) ||
      (r.domain || "").includes(q) ||
      (r.description || "").toLowerCase().includes(q);
    return matchRiesgo && matchBusqueda;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Reportes</h1>
        <button onClick={onNuevoReporte} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition">
          <FaPlus /> Nuevo Reporte
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 mb-6 shadow-lg flex flex-wrap gap-4 items-center">
        <FaFilter className="text-green-400" />
        <input
          placeholder="Buscar por teléfono, dominio o descripción..."
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          className="bg-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-48"
        />
        {["todos", "alto", "medio", "bajo"].map((nivel) => (
          <button
            key={nivel}
            onClick={() => setFiltroRiesgo(nivel)}
            className={`px-4 py-2 rounded-xl font-bold capitalize transition ${filtroRiesgo === nivel ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            {nivel}
          </button>
        ))}
        <span className="text-gray-500 text-sm">{filtrados.length} resultados</span>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-auto">
        <TablaReportes reportes={filtrados} onEliminar={onEliminar} paginar={true} />
      </div>
    </>
  );
}

// ─── AMENAZAS ─────────────────────────────────────────────────
function Amenazas({ reportes }) {
  const altos = reportes.filter((r) => r.risk_level === "alto");
  const dominiosMasFrecuentes = Object.entries(
    reportes.reduce((acc, r) => { if (r.domain) acc[r.domain] = (acc[r.domain] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const telefonosMasFrecuentes = Object.entries(
    reportes.reduce((acc, r) => { if (r.phone_number) acc[r.phone_number] = (acc[r.phone_number] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Amenazas Activas</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-900 bg-opacity-40 border border-red-500 rounded-2xl p-6">
          <FaExclamationTriangle className="text-3xl text-red-400 mb-3" />
          <h2 className="text-3xl font-bold text-red-400">{altos.length}</h2>
          <p className="text-gray-300">Amenazas de Riesgo Alto</p>
        </div>
        <div className="bg-yellow-900 bg-opacity-40 border border-yellow-500 rounded-2xl p-6">
          <FaGlobe className="text-3xl text-yellow-400 mb-3" />
          <h2 className="text-3xl font-bold text-yellow-400">{dominiosMasFrecuentes.length}</h2>
          <p className="text-gray-300">Dominios Maliciosos Top</p>
        </div>
        <div className="bg-blue-900 bg-opacity-40 border border-blue-500 rounded-2xl p-6">
          <FaPhone className="text-3xl text-blue-400 mb-3" />
          <h2 className="text-3xl font-bold text-blue-400">{telefonosMasFrecuentes.length}</h2>
          <p className="text-gray-300">Números Recurrentes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaGlobe className="text-red-400" /> Dominios más reportados</h2>
          {dominiosMasFrecuentes.length === 0
            ? <EmptyState mensaje="Sin dominios reportados aún" />
            : dominiosMasFrecuentes.map(([d, c]) => (
              <div key={d} className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">{d}</span>
                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">{c} reportes</span>
              </div>
            ))}
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaPhone className="text-yellow-400" /> Teléfonos más reportados</h2>
          {telefonosMasFrecuentes.length === 0
            ? <EmptyState mensaje="Sin teléfonos reportados aún" />
            : telefonosMasFrecuentes.map(([t, c]) => (
              <div key={t} className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">{t}</span>
                <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold">{c} reportes</span>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-red-400">⚠ Reportes de Alto Riesgo</h2>
        <TablaReportes reportes={altos} />
      </div>
    </>
  );
}

// ─── THREAT INTEL ─────────────────────────────────────────────
function ThreatIntel({ reportes }) {
  const dominios = [...new Set(reportes.map(r => r.domain).filter(Boolean))];
  const telefonos = [...new Set(reportes.map(r => r.phone_number).filter(Boolean))];
  const cuentas = [...new Set(reportes.map(r => r.bank_account).filter(Boolean))];

  const patrones = [
    { patron: "Dominios con extensiones de alto riesgo (.xyz, .top, .click)", detectados: dominios.filter(d => /\.(xyz|top|click|loan|cash)$/.test(d)).length },
    { patron: "Números con prefijo internacional sospechoso", detectados: telefonos.filter(t => t.startsWith("+") && !t.startsWith("+57")).length },
    { patron: "Reportes duplicados (mismo teléfono > 1 vez)", detectados: Object.values(reportes.reduce((a, r) => { if (r.phone_number) a[r.phone_number] = (a[r.phone_number] || 0) + 1; return a; }, {})).filter(v => v > 1).length },
  ];

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3"><FaBrain className="text-purple-400" /> Threat Intelligence</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg text-center">
          <FaGlobe className="text-4xl text-purple-400 mx-auto mb-3" />
          <h2 className="text-3xl font-bold">{dominios.length}</h2>
          <p className="text-gray-400">Dominios únicos en lista negra</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg text-center">
          <FaPhone className="text-4xl text-pink-400 mx-auto mb-3" />
          <h2 className="text-3xl font-bold">{telefonos.length}</h2>
          <p className="text-gray-400">Teléfonos únicos bloqueados</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg text-center">
          <FaListAlt className="text-4xl text-orange-400 mx-auto mb-3" />
          <h2 className="text-3xl font-bold">{cuentas.length}</h2>
          <p className="text-gray-400">Cuentas bancarias marcadas</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">🔍 Patrones de Riesgo Detectados</h2>
        {patrones.map((p, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-gray-800">
            <span className="text-gray-300">{p.patron}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.detectados > 0 ? "bg-red-500" : "bg-gray-700 text-gray-400"}`}>
              {p.detectados > 0 ? `${p.detectados} detectados` : "Sin detecciones"}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold mb-4 text-purple-400">Lista Negra — Dominios</h2>
          <div className="space-y-2 max-h-64 overflow-auto">
            {dominios.length === 0
              ? <EmptyState mensaje="Sin dominios registrados" />
              : dominios.map((d, i) => (
                <div key={i} className="bg-gray-800 rounded-lg px-4 py-2 text-sm text-red-300 font-mono">{d}</div>
              ))}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold mb-4 text-pink-400">Lista Negra — Teléfonos</h2>
          <div className="space-y-2 max-h-64 overflow-auto">
            {telefonos.length === 0
              ? <EmptyState mensaje="Sin teléfonos registrados" />
              : telefonos.map((t, i) => (
                <div key={i} className="bg-gray-800 rounded-lg px-4 py-2 text-sm text-yellow-300 font-mono">{t}</div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── CONFIGURACIÓN ────────────────────────────────────────────
function Configuracion() {
  const [reglas, setReglas] = useState([
    { id: 1, nombre: "Alerta riesgo alto automática", activa: true },
    { id: 2, nombre: "Bloquear dominios .xyz por defecto", activa: false },
    { id: 3, nombre: "Notificar duplicados de teléfono", activa: true },
  ]);
  const [apiKey] = useState("fd_" + Math.random().toString(36).substring(2, 18).toUpperCase());
  const [copiado, setCopiado] = useState(false);

  const toggleRegla = (id) => setReglas(reglas.map(r => r.id === id ? { ...r, activa: !r.activa } : r));

  const copiarKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3"><FaCog className="text-gray-400" /> Configuración</h1>

      <div className="bg-gray-900 rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaListAlt className="text-green-400" /> Reglas de Seguridad</h2>
        {reglas.map((r) => (
          <div key={r.id} className="flex justify-between items-center py-4 border-b border-gray-800">
            <span className="text-gray-300">{r.nombre}</span>
            <button
              onClick={() => toggleRegla(r.id)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition ${r.activa ? "bg-green-500 hover:bg-green-600" : "bg-gray-700 hover:bg-gray-600 text-gray-400"}`}
            >
              {r.activa ? "Activa" : "Inactiva"}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaKey className="text-yellow-400" /> API Key</h2>
        <p className="text-gray-400 text-sm mb-4">Usa esta clave para integrar Fraude Defender con tus sistemas externos.</p>
        <div className="bg-gray-800 rounded-xl px-4 py-3 font-mono text-green-400 text-sm flex justify-between items-center">
          <span>{apiKey}</span>
          <button onClick={copiarKey} className={`text-xs px-3 py-1 rounded-lg text-white transition ${copiado ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"}`}>
            {copiado ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-3">⚠ No compartas esta clave públicamente.</p>
      </div>
    </>
  );
}

// ─── MODAL NUEVO REPORTE ──────────────────────────────────────
function ModalReporte({ onClose, onSuccess }) {
  const [form, setForm] = useState({ phone_number: "", bank_account: "", domain: "", risk_level: "alto", description: "" });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.phone_number && !form.bank_account && !form.domain) {
      setMensaje({ tipo: "error", texto: "Proporciona al menos un teléfono, cuenta o dominio." });
      return;
    }
    if (!form.description) {
      setMensaje({ tipo: "error", texto: "La descripción es obligatoria." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/reportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 201 || res.ok) {
        setMensaje({ tipo: "ok", texto: "¡Reporte registrado exitosamente!" });
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      } else {
        const err = await res.json();
        setMensaje({ tipo: "error", texto: err.detail || "Error al registrar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl relative max-h-screen overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"><FaTimes /></button>
        <h2 className="text-2xl font-bold mb-6 text-green-400">Registrar Nuevo Reporte</h2>
        <div className="space-y-4">
          {[
            { name: "phone_number", label: "Teléfono", placeholder: "+573001112233" },
            { name: "bank_account", label: "Cuenta Bancaria", placeholder: "Número de cuenta (opcional)" },
            { name: "domain", label: "Dominio", placeholder: "prestamos-rapidos.xyz" },
          ].map((f) => (
            <div key={f.name}>
              <label className="text-sm text-gray-400 mb-1 block">{f.label}</label>
              <input name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          ))}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Nivel de Riesgo</label>
            <select name="risk_level" value={form.risk_level} onChange={handleChange}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500">
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe la amenaza o fraude detectado..." rows={3}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          {mensaje && (
            <div className={`text-sm px-4 py-2 rounded-xl ${mensaje.tipo === "ok" ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"}`}>
              {mensaje.texto}
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
            {loading ? "Guardando..." : "Registrar Reporte"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────
function App() {
  const [seccion, setSeccion] = useState("dashboard");
  const [reportes, setReportes] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { obtenerReportes(); }, []);

  const obtenerReportes = async () => {
    try {
      const res = await fetch(`${API}/reportes`);
      const data = await res.json();
      setReportes(data);
    } catch (e) { console.error(e); }
  };

  const eliminarReporte = (id) => {
    setReportes(prev => prev.filter(r => r.id !== id));
  };

  const navItems = [
    { id: "dashboard", icon: <FaChartBar />, label: "Dashboard" },
    { id: "reportes", icon: <FaExclamationTriangle />, label: "Reportes" },
    { id: "amenazas", icon: <FaBug />, label: "Amenazas" },
    { id: "threatintel", icon: <FaShieldAlt />, label: "Threat Intel" },
    { id: "configuracion", icon: <FaCog />, label: "Configuración" },
  ];

  return (
    <div className="flex bg-gray-950 text-white min-h-screen">
      <div className={`fixed md:relative z-50 bg-gray-900 w-64 min-h-screen p-6 transition-all duration-300 ${menuOpen ? "left-0" : "-left-64 md:left-0"}`}>
        <h1 className="text-2xl font-bold mb-10 text-green-400">🛡 Fraude Defender</h1>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <div key={item.id} onClick={() => { setSeccion(item.id); setMenuOpen(false); }}
              className={`flex items-center gap-3 text-base px-4 py-3 rounded-xl cursor-pointer transition ${seccion === item.id ? "bg-green-500 text-white font-bold" : "hover:bg-gray-800 text-gray-300"}`}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {menuOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />}

      <div className="flex-1 p-6 overflow-auto">
        <button className="md:hidden mb-6 text-2xl" onClick={() => setMenuOpen(!menuOpen)}><FaBars /></button>

        <AnimatePresence mode="wait">
          <motion.div key={seccion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {seccion === "dashboard" && <Dashboard reportes={reportes} onNuevoReporte={() => setModalOpen(true)} />}
            {seccion === "reportes" && <Reportes reportes={reportes} onNuevoReporte={() => setModalOpen(true)} onEliminar={eliminarReporte} />}
            {seccion === "amenazas" && <Amenazas reportes={reportes} />}
            {seccion === "threatintel" && <ThreatIntel reportes={reportes} />}
            {seccion === "configuracion" && <Configuracion />}
          </motion.div>
        </AnimatePresence>
      </div>

      {modalOpen && <ModalReporte onClose={() => setModalOpen(false)} onSuccess={obtenerReportes} />}
    </div>
  );
}

export default App;