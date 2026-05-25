import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Sidebar from "./components/Sidebar"; // Ajusta la ruta si es necesario
import Reportes from "./components/Reportes"; // Ajusta la ruta si es necesario
import ModalReporte from "./components/ModalReporte"; // Ajusta la ruta si es necesario

// URL de producción en Render
const API = "https://fraude-defender-api.onrender.com/api/v1";

export default function App() {
  const [usuario, setUsuario] = useState(getUsuario());
  const [seccion, setSeccion] = useState("dashboard");
  const [reportes, setReportes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const cargarReportes = async () => {
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
    if (usuario) cargarReportes(); 
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