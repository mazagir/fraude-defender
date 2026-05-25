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

const API = "http://127.0.0.1:8000/api/v1";
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
        const res = await fetch(`${API}/auth/registro/`, {
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
        const res = await fetch(`${API}/auth/login/`, { method: "POST", body: formData });
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
                <input name="password" value={form.password} onChange={handleChange} type={showPass ? "text" : "password"}
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
              {loading ? "Verificando identidad..." : modo === "login" ? "Acceder al Centro" : "Unirme a la Red"}
            </button>
          </div>
        </div>
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
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1} className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-30"><FaChevronLeft /></button>
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas} className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-30"><FaChevronRight /></button>
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
      await fetch(`${API}/reportes/${id}/`, { method: "DELETE", headers: authHeaders() });
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
            <th className="p-3">Descripción</th>{onEliminar && <th className="p-3 text-center">Acción</th>}
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
                  <button onClick={() => handleEliminar(r.id)} disabled={eliminando === r.id} className="text-red-400 hover:text-red-300 p-2 rounded-lg"><FaTrash /></button>
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
  const dataBar = [{ name: "Altos", cantidad: altos }, { name: "Medios", cantidad: medios }, { name: "Bajos", cantidad: bajos }, { name: "Totales", cantidad: reportes.length }];
  const dataPie = [{ name: "Alto", value: altos }, { name: "Medio", value: medios }, { name: "Bajo", value: bajos }];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Cybersecurity Dashboard</h1>
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
          <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            {c.icon}<h2 className="text-3xl font-bold">{c.val}</h2><p className="text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
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
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
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
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 overflow-auto">
        <h2 className="text-xl font-bold mb-4">Últimos Detecciones</h2>
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
    return matchRiesgo && (!q || (r.phone_number || "").includes(q) || (r.domain || "").includes(q) || (r.description || "").toLowerCase().includes(q));
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Reportes de Incidentes</h1>
        <button onClick={onNuevoReporte} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition">
          <FaPlus /> Nuevo Reporte
        </button>
      </div>
      <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800 flex flex-wrap gap-4 items-center">
        <FaFilter className="text-green-400" />
        <input placeholder="Buscar por teléfono, dominio o descripción..." value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)}
          className="bg-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-48" />
        {["todos", "alto", "medio", "bajo"].map((nivel) => (
          <button key={nivel} onClick={() => setFiltroRiesgo(nivel)}
            className={`px-4 py-2 rounded-xl font-bold capitalize transition ${filtroRiesgo === nivel ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {nivel}
          </button>
        ))}
      </div>
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 overflow-auto">
        <TablaReportes reportes={filtrados} onEliminar={onEliminar} paginar={true} />
      </div>
    </>
  );
}

function Amenazas({ reportes }) {
  const altos = reportes.filter((r) => r.risk_level === "alto");
  const dominiosMasFrecuentes = Object.entries(reportes.reduce((acc, r) => { if (r.domain) acc[r.domain] = (acc[r.domain] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const telefonosMasFrecuentes = Object.entries(reportes.reduce((acc, r) => { if (r.phone_number) acc[r.phone_number] = (acc[r.phone_number] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Amenazas Activas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaGlobe className="text-red-400" /> Dominios Críticos</h2>
          {dominiosMasFrecuentes.length === 0 ? <EmptyState mensaje="Sin dominios maliciosos" /> :
            dominiosMasFrecuentes.map(([d, c]) => (
              <div key={d} className="flex justify-between items-center py-2.5 border-b border-gray-800">
                <span className="text-gray-300 font-mono text-sm">{d}</span>
                <span className="bg-red-500 bg-opacity-20 border border-red-500 text-red-400 text-xs px-3 py-1 rounded-full font-bold">{c} reportes</span>
              </div>
            ))}
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaPhone className="text-yellow-400" /> Teléfonos Recurrentes</h2>
          {telefonosMasFrecuentes.length === 0 ? <EmptyState mensaje="Sin líneas reportadas" /> :
            telefonosMasFrecuentes.map(([t, c]) => (
              <div key={t} className="flex justify-between items-center py-2.5 border-b border-gray-800">
                <span className="text-gray-300 font-mono text-sm">{t}</span>
                <span className="bg-yellow-500 bg-opacity-20 border border-yellow-500 text-yellow-400 text-xs px-3 py-1 rounded-full font-bold">{c} alertas</span>
              </div>
            ))}
        </div>
      </div>
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-red-400">⚠ Incidentes de Alto Riesgo Registrados</h2>
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
    { patron: "Extensiones de dominio sospechosas detectadas (.xyz, .top, .click)", detectados: dominios.filter(d => /\.(xyz|top|click|loan|cash)$/.test(d)).length },
    { patron: "Números telefónicos con códigos de área no habituales", detectados: telefonos.filter(t => t.startsWith("+") && !t.startsWith("+57")).length },
    { patron: "Entidades bancarias con múltiples alertas cruzadas", detectados: Object.values(reportes.reduce((a, r) => { if (r.bank_account) a[r.bank_account] = (a[r.bank_account] || 0) + 1; return a; }, {})).filter(v => v > 1).length },
  ];

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3"><FaBrain className="text-purple-400" /> Threat Intelligence Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: <FaGlobe className="text-4xl text-purple-400 mx-auto mb-3" />, val: dominios.length, label: "Dominios en Lista Negra" },
          { icon: <FaPhone className="text-4xl text-pink-400 mx-auto mb-3" />, val: telefonos.length, label: "Identificadores de Línea" },
          { icon: <FaListAlt className="text-4xl text-orange-400 mx-auto mb-3" />, val: cuentas.length, label: "Cuentas Bajo Seguimiento" },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center">
            {c.icon}<h2 className="text-3xl font-bold mt-2">{c.val}</h2><p className="text-gray-400 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
        <h2 className="text-xl font-bold mb-4">🔍 Patrones Estructurales de Fraude</h2>
        {patrones.map((p, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-gray-800">
            <span className="text-gray-300">{p.patron}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.detectados > 0 ? "bg-red-500 bg-opacity-20 text-red-400 border border-red-500" : "bg-gray-800 text-gray-500"}`}>
              {p.detectados > 0 ? `${p.detectados} correlaciones` : "Limpio"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Configuracion({ usuario, onLogout }) {
  const [apiKey] = useState("fd_" + Math.random().toString(36).substring(2, 18).toUpperCase());
  const [copiado, setCopiado] = useState(false);
  const copiarKey = () => { navigator.clipboard.writeText(apiKey); setCopiado(true); setTimeout(() => setCopiado(false), 2000); };

  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Ajustes del Sistema</h1>
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaUserShield className="text-green-400" /> Perfil de Investigador</h2>
        <div className="flex items-center gap-4">
          <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-full p-4">
            <FaUserShield className="text-3xl text-green-400" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">{usuario?.nombre || "Analista"}</p>
            <p className="text-gray-400 text-sm">{usuario?.email}</p>
            <p className="text-green-400 text-xs mt-1">✓ Credenciales autorizadas mediante nodo central</p>
          </div>
          <button onClick={onLogout} className="ml-auto flex items-center gap-2 bg-red-900 bg-opacity-20 border border-red-700 hover:bg-red-800 text-red-400 font-bold px-4 py-2.5 rounded-xl transition">
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      </div>
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-lg">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><FaKey className="text-yellow-400" /> Clave de Integración (API Key)</h2>
        <p className="text-gray-400 text-sm mb-4">Credencial simétrica para interactuar con módulos externos, scripts automatizados o ADB Shell sandbox.</p>
        <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 font-mono text-green-400 text-sm flex justify-between items-center">
          <span>{apiKey}</span>
          <button onClick={copiarKey} className={`text-xs px-4 py-1.5 rounded-lg font-bold transition ${copiado ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
            {copiado ? "Copiado ✓" : "Copiar Token"}
          </button>
        </div>
      </div>
    </>
  );
}

function ModalReporte({ onClose, onSuccess }) {
  const evaluarGravedad = (data) => {
    const cuerpo = `${data.domain} ${data.description}`.toLowerCase();
    if (cuerpo.includes(".xyz") || cuerpo.includes(".top") || cuerpo.includes("prestamo") ||
        cuerpo.includes("préstamo") || cuerpo.includes("extorsión") || cuerpo.includes("amenaza") || 
        cuerpo.includes("gota a gota") || cuerpo.includes("montadeudas")) return "alto";
    if (cuerpo.includes("whatsapp") || cuerpo.includes("sms") || cuerpo.includes("desconocido")) return "medio";
    return "bajo";
  };

  const [form, setForm] = useState({ phone_number: "", bank_account: "", domain: "", risk_level: "alto", description: "" });
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  const handleInput = (e) => {
    const actual = { ...form, [e.target.name]: e.target.value };
    actual.risk_level = evaluarGravedad(actual);
    setForm(actual);
  };

  const handleGuardar = async () => {
    if (!form.description.trim()) return setErrorModal("La descripción del incidente de fraude es requerida.");
    if (!form.phone_number && !form.bank_account && !form.domain) return setErrorModal("Debes proveer al menos un indicador (Teléfono, Cuenta o URL).");
    
    setLoading(true);
    setErrorModal(null);
    try {
      const res = await fetch(`${API}/reportes/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Error de red al sincronizar con la base de datos.");
      onSuccess();
      onClose();
    } catch (e) { setErrorModal(e.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><FaPlus className="text-green-400" /> Alimentar Base de Inteligencia</h2>
            <p className="text-gray-500 text-sm mt-1">Indexar nuevos patrones e indicadores de compromiso (IoC)</p>
          </div>
          <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-xl transition"><FaTimes /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Indicador Telefónico</label>
            <input name="phone_number" value={form.phone_number} onChange={handleInput} placeholder="+57 300 000 0000" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Canal Financiero (Cuenta)</label>
            <input name="bank_account" value={form.bank_account} onChange={handleInput} placeholder="Nequi / Ahorros..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Dominio Web / APK Link</label>
            <input name="domain" value={form.domain} onChange={handleInput} placeholder="url-maliciosa.xyz" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Nivel de Matriz de Riesgo (Dinámico)</label>
            <select name="risk_level" value={form.risk_level} onChange={handleInput} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-green-500 font-bold capitalize">
              <option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option>
            </select>
          </div>
        </div>
        <div className="mb-6">
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Modus Operandi / Análisis Técnico</label>
          <textarea name="description" value={form.description} onChange={handleInput} rows="3" placeholder="Describe los mensajes, amenazas de cobro coactivo o fraude detectado..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        {errorModal && <div className="text-xs bg-red-900 border border-red-700 text-red-300 px-4 py-2 rounded-xl mb-4">{errorModal}</div>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 px-5 py-2.5 rounded-xl font-bold transition">Descartar</button>
          <button onClick={handleGuardar} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition">{loading ? "Sincronizando..." : "Confirmar Reporte"}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(getUsuario());
  const [seccion, setSeccion] = useState("dashboard");
  const [reportes, setReportes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);

  const cargarReportes = async () => {
    try {
      const res = await fetch(`${API}/reportes/`, { headers: authHeaders() });
      if (res.ok) setReportes(await res.json());
    } catch (e) { console.error("Error cargando los nodos de inteligencia", e); }
  };

  useEffect(() => { if (usuario) cargarReportes(); }, [usuario]);
  const handleLogout = () => { clearAuth(); setUsuario(null); };

  if (!usuario) return <AuthScreen onAuth={setUsuario} />;

  const itemsMenu = [
    { id: "dashboard", label: "Dashboard", icon: <FaChartBar /> },
    { id: "reportes", label: "Reportes", icon: <FaListAlt /> },
    { id: "amenazas", label: "Amenazas Activas", icon: <FaExclamationTriangle /> },
    { id: "threatintel", label: "Threat Intel", icon: <FaBrain /> },
    { id: "config", label: "Configuración", icon: <FaCog /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 p-4">
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-gray-800">
          <FaShieldAlt className="text-3xl text-green-400" />
          <div><h1 className="font-bold text-base leading-none">Fraude Defender</h1><span className="text-[10px] uppercase text-green-400 font-mono tracking-wider">AegisShield Engine</span></div>
        </div>
        <nav className="space-y-1 flex-1">
          {itemsMenu.map((item) => (
            <button key={item.id} onClick={() => setSeccion(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${seccion === item.id ? "bg-green-500 text-white shadow-lg" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>{item.icon} {item.label}</button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl transition text-sm font-medium"><FaSignOutAlt /> Cerrar sesión</button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between bg-gray-900 border-b border-gray-800 p-4">
          <div className="flex items-center gap-2"><FaShieldAlt className="text-2xl text-green-400" /><span className="font-bold">Fraude Defender</span></div>
          <button onClick={() => setMenuMobile(!menuMobile)} className="text-xl p-2 bg-gray-800 rounded-lg"><FaBars /></button>
        </header>

        <AnimatePresence>
          {menuMobile && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-gray-900 border-b border-gray-800 p-4 space-y-2 absolute top-16 left-0 right-0 z-40">
              {itemsMenu.map((item) => (
                <button key={item.id} onClick={() => { setSeccion(item.id); setMenuMobile(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm ${seccion === item.id ? "bg-green-500 text-white" : "text-gray-400 bg-gray-800"}`}>{item.icon} {item.label}</button>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-950/20 text-red-400 rounded-xl text-sm font-medium"><FaSignOutAlt /> Salir</button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-6 md:p-8 overflow-auto max-w-7xl w-full mx-auto">
          {seccion === "dashboard" && <Dashboard reportes={reportes} onNuevoReporte={() => setModalOpen(true)} />}
          {seccion === "reportes" && <Reportes reportes={reportes} onNuevoReporte={() => setModalOpen(true)} onEliminar={(id) => setReportes(reportes.filter(r => r.id !== id))} />}
          {seccion === "amenazas" && <Amenazas reportes={reportes} />}
          {seccion === "threatintel" && <ThreatIntel reportes={reportes} />}
          {seccion === "config" && <Configuracion usuario={usuario} onLogout={handleLogout} />}
        </main>
      </div>
      {modalOpen && <ModalReporte onClose={() => setModalOpen(false)} onSuccess={cargarReportes} />}
    </div>
  );
}