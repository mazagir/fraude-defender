import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Sidebar from "./components/Sidebar";
import Reportes from "./components/Reportes";
import ModalReporte from "./components/ModalReporte";

// URL de producción en Render
const API = "https://fraude-defender-api.onrender.com/api/v1";

export default function App() {
  const [usuario] = useState(() => JSON.parse(localStorage.getItem("fd_usuario") || "null"));
  const [seccion, setSeccion] = useState("dashboard");
  const [reportes, setReportes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const cargarReportes = async () => {
    const token = localStorage.getItem("fd_token");
    const authHeaders = () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });
    try {
      console.log("=== AegisShield Debug: Iniciando carga de reportes ===");
      const res = await fetch(`${API}/reportes/`, { 
        method: "GET",
        headers: authHeaders() 
      });

      const data = await res.json();
      
      if (res.ok) {
        setReportes(data);
        console.log("=== Carga exitosa: Total registros:", data.length, "===");
      } else {
        console.error("Error al obtener reportes (Server Error):", data);
      }
    } catch (e) { 
      console.error("=== Error crítico de conexión:", e); 
    }
  };

  useEffect(() => {
    if (!usuario) return;
    // Evitar setState desde un effect directo: delegamos la carga a una microtarea.
    Promise.resolve().then(() => cargarReportes());
  }, [usuario]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <Sidebar seccion={seccion} setSeccion={setSeccion} />
      
      <main className="flex-1 p-8">
        {seccion === "dashboard" && (
          <Dashboard 
            reportes={reportes} 
            onNuevoReporte={() => setModalOpen(true)} 
          />
        )}
        
        {seccion === "reportes" && <Reportes reportes={reportes} />}
      </main>

      {modalOpen && (
        <ModalReporte 
          onClose={() => setModalOpen(false)} 
          onSuccess={() => {
            setModalOpen(false);
            cargarReportes(); 
          }} 
        />
      )}
    </div>
  );
}