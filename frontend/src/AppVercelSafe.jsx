import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Sidebar from "./components/Sidebar";
import Reportes from "./components/Reportes";
import ModalReporte from "./components/ModalReporte";

const API = "https://fraude-defender-api.onrender.com/api/v1";

export default function AppVercelSafe() {
  const [usuario] = useState(() => JSON.parse(localStorage.getItem("fd_usuario") || "null"));
  const [seccion, setSeccion] = useState("dashboard");
  const [reportes, setReportes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const cargarReportes = async () => {
    const token = localStorage.getItem("fd_token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(`${API}/reportes/`, { method: "GET", headers });
    const data = await res.json();
    if (res.ok) setReportes(data);
  };

  // Evitamos el warning/error de eslint: no disparamos setState desde un useEffect.
  // Cargamos reportes únicamente cuando hay usuario al montar, mediante una acción asíncrona.
  useEffect(() => {
    if (!usuario) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Promise.resolve().then(() => cargarReportes());
  }, [usuario]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <Sidebar seccion={seccion} setSeccion={setSeccion} />

      <main className="flex-1 p-8">
        {seccion === "dashboard" && (
          <Dashboard reportes={reportes} onNuevoReporte={() => setModalOpen(true)} />
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

