
import { FaChartPie, FaListUl } from "react-icons/fa";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";


const COLORS = ["#ef4444", "#eab308", "#22c55e"];

const Dashboard = ({ reportes, onNuevoReporte }) => {
  const altos = reportes.filter((r) => (r.risk_level || "").toLowerCase() === "alto").length;
  const medios = reportes.filter((r) => (r.risk_level || "").toLowerCase() === "medio").length;
  const bajos = reportes.filter((r) => (r.risk_level || "").toLowerCase() === "bajo").length;


  const dataPie = [{ name: "Alto", value: altos }, { name: "Medio", value: medios }, { name: "Bajo", value: bajos }];

  return (
    <div className="space-y-8 p-6">
      {/* Cabecera */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
          Centro de Comando AegisShield
        </h1>
        <button onClick={onNuevoReporte} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-green-900/20">
          + Nuevo Reporte
        </button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[ {label: "Total", val: reportes.length, color: "text-blue-400"}, {label: "Alto Riesgo", val: altos, color: "text-red-400"}, {label: "Medio", val: medios, color: "text-yellow-400"}, {label: "Bajo", val: bajos, color: "text-green-400"} ].map((m, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <p className="text-gray-500 text-sm">{m.label}</p>
            <h2 className={`text-3xl font-bold ${m.color}`}>{m.val}</h2>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FaChartPie /> Distribución de Riesgos</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dataPie} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {dataPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Tabla simplificada de últimos reportes */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 overflow-hidden">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FaListUl /> Últimos Reportes</h2>
          <div className="overflow-y-auto max-h-[200px]">
            {reportes.slice(0, 5).map((r, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-800 text-sm">
                <span>{r.phone_number || "Desconocido"}</span>
                <span className={`px-2 py-0.5 rounded ${r.risk_level === 'alto' ? 'bg-red-900 text-red-300' : 'bg-gray-800'}`}>
                  {r.risk_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;