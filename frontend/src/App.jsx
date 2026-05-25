cat > /mnt/user-data/outputs/App.jsx << 'ENDOFFILE'
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShieldAlt, FaExclamationTriangle, FaGlobe, FaPhone,
  FaChartBar, FaBug, FaCog, FaBars, FaPlus, FaTimes,
  FaFilter, FaKey, FaListAlt, FaBrain, FaTrash,
  FaChevronLeft, FaChevronRight, FaInbox, FaLock,
  FaUserShield, FaSignOutAlt, FaEye, FaEyeSlash,
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const API = "https://fraude-defender-api.onrender.com/api/v1";
const COLORS = ["#ef4444", "#eab308", "#22c55e"];
const POR_PAGINA = 10;

const getToken = () => localStorage.getItem("fd_token");
const getUsuario = () => JSON.parse(localStorage.getItem("fd_usuario") || "null");
const setAuth = (token, usuario) => {
  localStorage.setItem("fd_token", token);
  localStorage.setItem("fd_usuario", JSON.stringify(usuario));
};
const clearAuth = () => {
  localStorage.removeItem("fd_token");
  localStorage.removeItem("fd_usuario");
};
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

function AuthScreen({ onAuth }) {
  const [modo, setModo] = useState("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (modo === "registro") {
        const res = await fetch(`${API}/auth/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Error al registrarse.");
        }
        setModo("login");
        setError({ tipo: "ok", texto: "Cuenta creada. Ahora inicia sesión." });
      } else {
        const formData = new FormData();
        formData.append("username", form.email);
        formData.append("password", form.password);
        const res = await fetch(`${API}/auth/login`, { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Credenciales incorrectas.");
        }
        const data = await res.json();
        setAuth(data.access_token, data.usuario);
        onAuth(data.usuario);
      }
    } catch (e) {
      setError({ tipo: "error", texto: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
        backgroundSize: "50px 50px"
      }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-full p-4">
              <FaUserShield className="text-5xl text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">🛡 Fraude Defender</h1>
          <p className="text-green-400 font-mono text-sm tracking-widest">CENTRO DE INTELIGENCIA</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-xs">
            <FaLock className="text-green-500" />
            <span>Acceso restringido — Solo analistas autorizados</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
            {["login", "registro"].map((m) => (
              <button key={m} onClick={() => { setModo(m); setError(null); }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm capitalize transition ${modo === m ? "bg-green-500 text-white" : "text-gray-400 hover:text-white"}`}>
                {m === "login" ? "Iniciar Sesión" : "Registrarse"}
              </button>
            ))}
          </div>
          {modo === "registro" && (
            <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-xl text-xs text-blue-300">
              🔐 El registro está abierto solo para analistas que forman parte de la red de inteligencia contra fraudes.
            </div>
          )}
          <div className="space-y-4">
            {modo === "registro" && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Nombre completo</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Correo electrónico</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="analista@ejemplo.com" type="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <input name="password" value={form.password} onChange={handleChange}
                  placeholder={modo === "registro" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                  type={showPass ? "text" : "password"}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500 pr-12" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400 hover:text-white">
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            {error && (
              <div className={`text-sm px-4 py-2 rounded-xl ${error.tipo === "ok" ? "bg-green-900 text-green-300 border border-green-700" : "bg-red-900 text-red-300 border border-red-700"}`}>
                {error.texto}
              </div>
            )}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {loading ? <span className="animate-pulse">Verificando identidad...</span> :
                <>{modo === "login" ? <><FaLock /> Acceder al Centro</> : <><FaUserShield /> Unirme a la Red</>}</>}
            </button>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">Fraude Defender v2.0 · Plataforma de Inteligencia Colaborativa</p>
      </motion.div>
    </div>
  );
}

function EmptyState({ mensaje = "No hay datos para mostrar" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <FaInbox className="text-6xl mb-4 text-gray-700" />
      <p className="text-lg font-medium">{mensaje}</p>
      <p className="text-sm mt-1">Los reportes aparecerán aquí cuando se registren</p>
    </div>
  );
}

function Paginacion({ total, pagina, onChange }) {
  const totalPaginas = Math.ceil(total / POR_PAGINA);
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <span className="text-gray-500 text-sm">{total} resultados · Página {pagina} de {totalPaginas}</span>
      <div className="flex gap-2">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1}
          className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <FaChevronLeft />
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onChange(p)}
            className={`px-3 py-2 rounded-lg font-bold text-sm transition ${p === pagina ? "bg-green-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === Math.ceil(total / POR_PAGINA)}
          className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

function TablaReportes({ reportes, onEliminar, paginar = false }) {
  const [pagina, setPagina] = useState(1);
  const [eliminando, setEliminando] = useState(null);
  const paginados = paginar ? reportes.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA) : reportes;

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este reporte?")) return;
    setEliminando(id);
    try {
      await fetch(`${API}/reportes/${id}`, { method: "DELETE", headers: authHeaders() });
      if (onEliminar) onEliminar(id);
    } catch (e) { console.error(e); }
    setEliminando(null);
  };

  if (reportes.length === 0) return <EmptyState />;

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-700 text-gray-400">
            <th className="p-3">Teléfono</th><th className="p-3">Cuenta</th>
            <th className="p-3">Dominio</th><th className="p-3">Riesgo</th>
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
                  <button onClick={() => handleEliminar(r.id)} disabled={eliminando === r.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 p-2 rounded-lg transition disabled:opacity-50">
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
        <input placeholder="Buscar por teléfono, dominio o descripción..." value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          className="bg-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-48" />
        {["todos", "alto", "medio", "bajo"].map((nivel) => (
          <button key={nivel} onClick={() => setFiltroRiesgo(nivel)}
            className={`px-4 py-2 rounded-xl font-bold capitalize transition ${filtroRiesgo === nivel ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
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
          {dominiosMasFrecuentes.length === 0 ? <EmptyState mensaje="Sin dominios reportados aún" /> :
            dominiosMasFrecuentes.map(([d, c]) => (
              <div key={d} className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">{d}</span>
                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">{c} reportes</span>
              </div>
            ))}
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaPhone className="text-yellow-400" /> Teléfonos más reportados</h2>
          {telefonosMasFrecuentes.length === 0 ? <EmptyState mensaje="Sin teléfonos reportados aún" /> :
            telefonosMasFrecuentes.map(([t, c]) => (
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
        {[
          { icon: <FaGlobe className="text-4xl text-purple-400 mx-auto mb-3" />, val: dominios.length, label: "Dominios únicos en lista negra" },
          { icon: <FaPhone className="text-4xl text-pink-400 mx-auto mb-3" />, val: telefonos.length, label: "Teléfonos únicos bloqueados" },
          { icon: <FaListAlt className="text-4xl text-orange-400 mx-auto mb-3" />, val: cuentas.length, label: "Cuentas bancarias marcadas" },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900 rounded-2xl p-6 shadow-lg text-center">
            {c.icon}
            <h2 className="text-3xl font-bold">{c.val}</h2>
            <p className="text-gray-400">{c.label}</p>
          </div>
        ))}
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
            {dominios.length === 0 ? <EmptyState mensaje="Sin dominios registrados" /> :
              dominios.map((d, i) => <div key={i} className="bg-gray-800 rounded-lg px-4 py-2 text-sm text-red-300 font-mono">{d}</div>)}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold mb-4 text-pink-400">Lista Negra — Teléfonos</h2>
          <div className="space-y-2 max-h-64 overflow-auto">
            {telefonos.length === 0 ? <EmptyState mensaje="Sin teléfonos registrados" /> :
              telefonos.map((t, i) => <div key={i} className="bg-gray-800 rounded-lg px-4 py-2 text-sm text-yellow-300 font-mono">{t}</div>)}
          </div>
        </div>
      </div>
    </>
  );
}

function Configuracion({ usuario, onLogout }) {
  const [reglas, setReglas] = useState([
    { id: 1, nombre: "Alerta riesgo alto automática", activa: true },
    { id: 2, nombre: "Bloquear dominios .xyz por defecto", activa: false },
    { id: 3, nombre: "Notificar duplicados de teléfono", activa: true },
  ]);
  const [apiKey] = useState("fd_" + Math.random().toString(36).substring(2, 18).toUpperCase());
  const [copiado, setCopiado] = useState(false);

  const toggleRegla = (id) => setReglas(reglas.map(r => r.id === id ? { ...r, activa: !r.activa } : r));
  const copiarKey = () => { navigator.clipboard.writeText(apiKey); setCopiado(true); setTimeout(() => setCopiado(false), 2000); };

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3"><FaCog className="text-gray-400" /> Configuración</h1>
      <div className="bg-gray-900 rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaUserShield className="text-green-400" /> Mi Perfil</h2>
        <div className="flex items-center gap-4">
          <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-full p-4">
            <FaUserShield className="text-3xl text-green-400" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">{usuario?.nombre}</p>
            <p className="text-gray-400 text-sm">{usuario?.email}</p>
            <p className="text-green-400 text-xs mt-1">✓ Analista autorizado</p>
          </div>
          <button onClick={onLogout} className="ml-auto flex items-center gap-2 bg-red-900 bg-opacity-40 border border-red-700 hover:bg-red-800 text-red-400 font-bold px-4 py-2 rounded-xl transition">
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      </div>
      <div className="bg-gray-900 rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaListAlt className="text-green-400" /> Reglas de Seguridad</h2>
        {reglas.map((r) => (
          <div key={r.id} className="flex justify-between items-center py-4 border-b border-gray-800">
            <span className="text-gray-300">{r.nombre}</span>
            <button onClick={() => toggleRegla(r.id)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition ${r.activa ? "bg-green-500 hover:bg-green-600" : "bg-gray-700 hover:bg-gray-600 text-gray-400"}`}>
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

function ModalReporte({ onClose, onSuccess }) {
  const detectarRiesgo = (data) => {
    const texto = `${data.domain} ${data.description}`.toLowerCase();
    if (texto.includes(".xyz") || texto.includes(".top") || texto.includes("prestamo") ||
      texto.includes("préstamo") || texto.includes("dinero rápido") || texto.includes("extorsión") ||
      texto.includes("amenaza") || texto.includes("gota a gota") || texto.includes("montadeudas")) {
      return "alto";
    }
    if (texto.includes("whatsapp") || texto.includes("sms") || texto.includes("desconocido")) {
      return "medio";
    }
    return "bajo";
  };

  const [form, setForm] = useState({ phone_number: "", bank_account: "", domain: "", risk_level: "alto", description: "" });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [estadoConexion, setEstadoConexion] = useState("");

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    updated.risk_level = detectarRiesgo(updated);
    setForm(updated);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      setMensaje({ tipo: "error", texto: "La descripción es obligatoria." });
      return;
    }
    if (!form.phone_number && !form.bank_account && !form.domain) {
      setMensaje({ tipo: "error", texto: "Debes ingresar al menos un indicador: teléfono, cuenta bancaria o dominio." });
      return;
    }
    setLoading(true);
    setMensaje(null);
    setEstadoConexion("Conectando con el servidor...");

    // Timeout de 90s para aguantar mientras Render despierta del modo sleep
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000);

    // Aviso si demora más de 5 segundos (servidor durmiendo)
    const avisoId = setTimeout(() => {
      setEstadoConexion("El servidor está despertando, por favor espera unos segundos...");
    }, 5000);

    try {
      const res = await fetch(`${API}/reportes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      clearTimeout(avisoId);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al registrar el reporte.");
      }
      setEstadoConexion("");
      setMensaje({ tipo: "ok", texto: "Reporte registrado correctamente" });
      onSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      clearTimeout(timeoutId);
      clearTimeout(avisoId);
      setEstadoConexion("");
      if (e.name === "AbortError") {
        setMensaje({ tipo: "error", texto: "El servidor tardó demasiado en responder. Intenta de nuevo en un momento." });
      } else {
        setMensaje({ tipo: "error", texto: e.message });
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl w-full max-w-2xl p-6 border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaPlus className="text-green-400" /> Nuevo Reporte
            </h2>
            <p className="text-gray-500 text-sm mt-1">Registrar amenaza o actividad sospechosa</p>
          </div>
          <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl transition"><FaTimes /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Número Telefónico</label>
            <input type="text" name="phone_number" value={form.phone_number} onChange={handleChange}
              placeholder="+57 3000000000"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Cuenta Bancaria</label>
            <input type="text" name="bank_account" value={form.bank_account} onChange={handleChange}
              placeholder="123456789"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 block mb-2">Dominio / URL Sospechosa</label>
            <input type="text" name="domain" value={form.domain} onChange={handleChange}
              placeholder="fraude.xyz"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 block mb-2">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4"
              placeholder="Describe la amenaza detectada..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 block mb-2">Riesgo Detectado por IA</label>
            <div className={`w-full rounded-xl px-4 py-3 text-center text-white font-bold border ${
              form.risk_level === "alto" ? "bg-red-900 border-red-500" :
              form.risk_level === "medio" ? "bg-yellow-900 border-yellow-500 text-yellow-100" :
              "bg-green-900 border-green-500"}`}>
              {form.risk_level === "alto" ? "🔴 RIESGO ALTO" : form.risk_level === "medio" ? "🟡 RIESGO MEDIO" : "🟢 RIESGO BAJO"}
            </div>
          </div>
        </div>
        {mensaje && (
          <div className={`mt-5 px-4 py-3 rounded-xl text-sm font-medium ${
            mensaje.tipo === "ok" ? "bg-green-900 border border-green-700 text-green-300" : "bg-red-900 border border-red-700 text-red-300"}`}>
            {mensaje.texto}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-bold transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition flex items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {estadoConexion || "Analizando..."}
              </span>
            ) : <><FaShieldAlt /> Registrar Reporte</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function App() {
  const [usuario, setUsuario] = useState(getUsuario());
  const [seccion, setSeccion] = useState("dashboard");
  const [reportes, setReportes] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { if (usuario) obtenerReportes(); }, [usuario]);

  const obtenerReportes = async () => {
    try {
      const res = await fetch(`${API}/reportes`, { headers: authHeaders() });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setReportes(data);
    } catch (e) { console.error(e); }
  };

  const handleAuth = (u) => setUsuario(u);

  const handleLogout = () => {
    clearAuth();
    setUsuario(null);
    setReportes([]);
  };

  const eliminarReporte = (id) => setReportes(prev => prev.filter(r => r.id !== id));

  const navItems = [
    { id: "dashboard", icon: <FaChartBar />, label: "Dashboard" },
    { id: "reportes", icon: <FaExclamationTriangle />, label: "Reportes" },
    { id: "amenazas", icon: <FaBug />, label: "Amenazas" },
    { id: "threatintel", icon: <FaShieldAlt />, label: "Threat Intel" },
    { id: "configuracion", icon: <FaCog />, label: "Configuración" },
  ];

  if (!usuario) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="flex bg-gray-950 text-white min-h-screen">
      <div className={`fixed md:relative z-50 bg-gray-900 w-64 min-h-screen p-6 transition-all duration-300 ${menuOpen ? "left-0" : "-left-64 md:left-0"}`}>
        <h1 className="text-2xl font-bold mb-2 text-green-400">🛡 Fraude Defender</h1>
        <p className="text-xs text-gray-500 font-mono mb-8 tracking-wider">CENTRO DE INTELIGENCIA</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <div key={item.id} onClick={() => { setSeccion(item.id); setMenuOpen(false); }}
              className={`flex items-center gap-3 text-base px-4 py-3 rounded-xl cursor-pointer transition ${seccion === item.id ? "bg-green-500 text-white font-bold" : "hover:bg-gray-800 text-gray-300"}`}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
            <FaUserShield className="text-green-400 text-xl flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-white text-sm font-bold truncate">{usuario?.nombre}</p>
              <p className="text-gray-500 text-xs truncate">{usuario?.email}</p>
            </div>
          </div>
        </div>
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
            {seccion === "configuracion" && <Configuracion usuario={usuario} onLogout={handleLogout} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {modalOpen && <ModalReporte onClose={() => setModalOpen(false)} onSuccess={obtenerReportes} />}
    </div>
  );
}

export default App;
ENDOFFILE
echo "App.jsx generado"