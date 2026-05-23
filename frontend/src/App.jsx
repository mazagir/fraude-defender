import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaShieldAlt, FaExclamationTriangle, FaGlobe, FaPhone,
  FaChartBar, FaBug, FaCog, FaBars, FaPlus, FaTimes,
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = "https://fraude-defender-api.onrender.com";

function App() {
  const [reportes, setReportes] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [form, setForm] = useState({
    phone_number: "",
    bank_account: "",
    domain: "",
    risk_level: "alto",
    description: "",
  });

  useEffect(() => {
    obtenerReportes();
  }, []);

  const obtenerReportes = async () => {
    try {
      const response = await fetch(`${API}/reportes`);
      const data = await response.json();
      setReportes(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.phone_number && !form.bank_account && !form.domain) {
      setMensaje({ tipo: "error", texto: "Debes proporcionar al menos un teléfono, cuenta o dominio." });
      return;
    }
    if (!form.description) {
      setMensaje({ tipo: "error", texto: "La descripción es obligatoria." });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API}/reportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.status === 201 || response.ok) {
        setMensaje({ tipo: "ok", texto: "Reporte registrado exitosamente." });
        setForm({ phone_number: "", bank_account: "", domain: "", risk_level: "alto", description: "" });
        obtenerReportes();
        setTimeout(() => { setModalOpen(false); setMensaje(null); }, 1500);
      } else {
        const err = await response.json();
        setMensaje({ tipo: "error", texto: err.detail || "Error al registrar el reporte." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    }
    setLoading(false);
  };

  const reportesAltos = reportes.filter((r) => r.risk_level === "alto").length;
  const dataChart = [
    { name: "Altos", cantidad: reportesAltos },
    { name: "Totales", cantidad: reportes.length },
  ];

  return (
    <div className="flex bg-gray-950 text-white min-h-screen">

      {/* SIDEBAR */}
      <div className={`fixed md:relative z-50 bg-gray-900 w-64 min-h-screen p-6 transition-all duration-300 ${menuOpen ? "left-0" : "-left-64 md:left-0"}`}>
        <h1 className="text-3xl font-bold mb-10 text-green-400">🛡 Fraude Defender</h1>
        <nav className="space-y-6">
          <div className="flex items-center gap-3 text-lg hover:text-green-400 cursor-pointer"><FaChartBar /><span>Dashboard</span></div>
          <div className="flex items-center gap-3 text-lg hover:text-green-400 cursor-pointer"><FaExclamationTriangle /><span>Reportes</span></div>
          <div className="flex items-center gap-3 text-lg hover:text-green-400 cursor-pointer"><FaBug /><span>Amenazas</span></div>
          <div className="flex items-center gap-3 text-lg hover:text-green-400 cursor-pointer"><FaShieldAlt /><span>Threat Intel</span></div>
          <div className="flex items-center gap-3 text-lg hover:text-green-400 cursor-pointer"><FaCog /><span>Configuración</span></div>
        </nav>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 md:ml-0">

        <button className="md:hidden mb-6 text-2xl" onClick={() => setMenuOpen(!menuOpen)}><FaBars /></button>

        <div className="flex items-center justify-between mb-8">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold">
            Cybersecurity Dashboard
          </motion.h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition"
          >
            <FaPlus /> Nuevo Reporte
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-900 rounded-2xl p-6 shadow-lg">
            <FaShieldAlt className="text-4xl text-green-400 mb-4" />
            <h2 className="text-3xl font-bold">{reportes.length}</h2>
            <p className="text-gray-400">Reportes Totales</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-900 rounded-2xl p-6 shadow-lg">
            <FaExclamationTriangle className="text-4xl text-red-400 mb-4" />
            <h2 className="text-3xl font-bold">{reportesAltos}</h2>
            <p className="text-gray-400">Riesgo Alto</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-900 rounded-2xl p-6 shadow-lg">
            <FaGlobe className="text-4xl text-blue-400 mb-4" />
            <h2 className="text-3xl font-bold">{reportes.length}</h2>
            <p className="text-gray-400">Dominios Detectados</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-900 rounded-2xl p-6 shadow-lg">
            <FaPhone className="text-4xl text-yellow-400 mb-4" />
            <h2 className="text-3xl font-bold">{reportes.length}</h2>
            <p className="text-gray-400">Números Sospechosos</p>
          </motion.div>
        </div>

        {/* CHART */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-10 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Estadísticas de Riesgo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataChart}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TABLE */}
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-auto">
          <h2 className="text-2xl font-bold mb-6">Últimos Reportes</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="p-3">Teléfono</th>
                <th className="p-3">Dominio</th>
                <th className="p-3">Riesgo</th>
                <th className="p-3">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((reporte) => (
                <tr key={reporte.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-3">{reporte.phone_number}</td>
                  <td className="p-3">{reporte.domain}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${reporte.risk_level === "alto" ? "bg-red-500" : "bg-yellow-500"}`}>
                      {reporte.risk_level}
                    </span>
                  </td>
                  <td className="p-3">{reporte.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO REPORTE */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
          >
            <button onClick={() => { setModalOpen(false); setMensaje(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">
              <FaTimes />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-green-400">Registrar Nuevo Reporte</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Número de Teléfono</label>
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+573001112233"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Cuenta Bancaria</label>
                <input
                  name="bank_account"
                  value={form.bank_account}
                  onChange={handleChange}
                  placeholder="Número de cuenta (opcional)"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Dominio</label>
                <input
                  name="domain"
                  value={form.domain}
                  onChange={handleChange}
                  placeholder="prestamos-rapidos.xyz"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Nivel de Riesgo</label>
                <select
                  name="risk_level"
                  value={form.risk_level}
                  onChange={handleChange}
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="alto">Alto</option>
                  <option value="medio">Medio</option>
                  <option value="bajo">Bajo</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Descripción</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe la amenaza o fraude detectado..."
                  rows={3}
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {mensaje && (
                <div className={`text-sm px-4 py-2 rounded-xl ${mensaje.tipo === "ok" ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"}`}>
                  {mensaje.texto}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {loading ? "Guardando..." : "Registrar Reporte"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;