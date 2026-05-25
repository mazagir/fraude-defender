import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaGlobe,
  FaPhone,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import TablaReportes from "./TablaReportes";
import EmptyState from "./EmptyState";

function Dashboard({ reportes = [], onNuevoReporte }) {
  // 1. Conteo de los niveles de riesgo calculados por la IA del backend
  const altos = reportes.filter(
    (r) => r.risk_level && r.risk_level.toLowerCase() === "alto"
  ).length;

  const medios = reportes.filter(
    (r) => r.risk_level && r.risk_level.toLowerCase() === "medio"
  ).length;

  const bajos = reportes.filter(
    (r) => r.risk_level && r.risk_level.toLowerCase() === "bajo"
  ).length;

  // 2. Data para el gráfico de Barras
  const dataBar = [
    { name: "Altos", cantidad: altos, color: "#ef4444" },
    { name: "Medios", cantidad: medios, color: "#eab308" },
    { name: "Bajos", cantidad: bajos, color: "#22c55e" },
  ];

  // 3. Data para la Torta (Filtramos los que están en 0 para evitar warnings, pero mantenemos su identidad)
  const dataPie = [
    { name: "Alto", value: altos, color: "#ef4444" },
    { name: "Medio", value: medios, color: "#eab308" },
    { name: "Bajo", value: bajos, color: "#22c55e" },
  ].filter(item => item.value > 0);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold"
        >
          Threat Intelligence Dashboard
        </motion.h1>

        <button
          onClick={onNuevoReporte}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition"
        >
          Nuevo Reporte
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          {
            icon: <FaShieldAlt className="text-4xl text-green-400 mb-4" />,
            val: reportes.length,
            label: "Reportes Totales",
          },
          {
            icon: <FaExclamationTriangle className="text-4xl text-red-400 mb-4" />,
            val: altos,
            label: "Riesgo Alto",
          },
          {
            icon: <FaGlobe className="text-4xl text-blue-400 mb-4" />,
            val: [...new Set(reportes.map((r) => r.domain).filter(Boolean))].length,
            label: "Dominios Detectados",
          },
          {
            icon: <FaPhone className="text-4xl text-yellow-400 mb-4" />,
            val: [...new Set(reportes.map((r) => r.phone_number).filter(Boolean))].length,
            label: "Números Sospechosos",
          },
        ].map((c, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-gray-900 rounded-2xl p-6 shadow-lg"
          >
            {c.icon}
            <h2 className="text-3xl font-bold">{c.val}</h2>
            <p className="text-gray-400">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* GRAFICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Estadísticas de Riesgo</h2>
          {reportes.length === 0 ? (
            <EmptyState mensaje="Sin datos para graficar" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataBar}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "none" }}
                  cursor={{ fill: "rgba(156, 163, 175, 0.1)" }}
                />
                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                  {dataBar.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Distribución de Riesgo</h2>
          {dataPie.length === 0 ? (
            <EmptyState mensaje="Sin datos para graficar" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dataPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "#111827", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-auto">
        <h2 className="text-xl font-bold mb-4">Últimos Reportes</h2>
        <TablaReportes reportes={reportes.slice(0, 5)} />
      </div>
    </>
  );
}

export default Dashboard;