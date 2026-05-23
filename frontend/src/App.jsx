import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaGlobe,
  FaPhone,
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [reportes, setReportes] = useState([]);

  useEffect(() => {
    obtenerReportes();
  }, []);

  const obtenerReportes = async () => {
    try {
      const response = await fetch(
        "https://fraude-defender-api.onrender.com/reportes"
      );

      const data = await response.json();
      console.log(data);
      setReportes(data);
    } catch (error) {
      console.error(error);
    }
  };

  const reportesAltos = reportes.filter(
    (r) => r.risk_level === "alto"
  ).length;

  const dataChart = [
    {
      name: "Altos",
      cantidad: reportesAltos,
    },
    {
      name: "Totales",
      cantidad: reportes.length,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8 text-center"
      >
        🛡 Fraude Defender Dashboard
      </motion.h1>

      {/* CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-900 rounded-2xl p-6 shadow-lg"
        >
          <FaShieldAlt className="text-4xl text-green-400 mb-4" />

          <h2 className="text-2xl font-bold">
            {reportes.length}
          </h2>

          <p className="text-gray-400">
            Reportes Totales
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-900 rounded-2xl p-6 shadow-lg"
        >
          <FaExclamationTriangle className="text-4xl text-red-400 mb-4" />

          <h2 className="text-2xl font-bold">
            {reportesAltos}
          </h2>

          <p className="text-gray-400">
            Riesgo Alto
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-900 rounded-2xl p-6 shadow-lg"
        >
          <FaGlobe className="text-4xl text-blue-400 mb-4" />

          <h2 className="text-2xl font-bold">
            {reportes.length}
          </h2>

          <p className="text-gray-400">
            Dominios Reportados
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-900 rounded-2xl p-6 shadow-lg"
        >
          <FaPhone className="text-4xl text-yellow-400 mb-4" />

          <h2 className="text-2xl font-bold">
            {reportes.length}
          </h2>

          <p className="text-gray-400">
            Números Sospechosos
          </p>
        </motion.div>
      </div>

      {/* GRAFICA */}

      <div className="bg-gray-900 rounded-2xl p-6 mb-10 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">
          Estadísticas de Riesgo
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dataChart}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TABLA */}

      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-auto">
        <h2 className="text-2xl font-bold mb-6">
          Últimos Reportes
        </h2>

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
              <tr
                key={reporte.id}
                className="border-b border-gray-800 hover:bg-gray-800"
              >
                <td className="p-3">
                  {reporte.phone_number}
                </td>

                <td className="p-3">
                  {reporte.domain}
                </td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      reporte.risk_level === "alto"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    {reporte.risk_level}
                  </span>
                </td>

                <td className="p-3">
                  {reporte.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;