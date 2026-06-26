import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { FaTrash } from "react-icons/fa";

import API, { authHeaders } from "../services/api";

function riesgoColor(risk) {
  const v = (risk || "").toLowerCase();
  if (v === "alto") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (v === "medio") return "bg-yellow-500/15 text-yellow-200 border-yellow-500/30";
  return "bg-green-500/15 text-green-200 border-green-500/30";
}

export default function TablaReportes({ reportes = [] }) {
  // Solo muestra (ID, risk_level, domain/phone, description)
  const rows = useMemo(() => {
    return reportes.map((r, idx) => ({
      _k: r.id ?? idx,
      id: r.id,
      risk_level: r.risk_level,
      phone_number: r.phone_number,
      domain: r.domain,
      description: r.description,
      created_at: r.created_at,
    }));
  }, [reportes]);

  // (Opcional) eliminar reporte si el backend lo soporta
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (reporteId) => {
    if (!reporteId || deletingId) return;
    setDeletingId(reporteId);
    try {
      const res = await fetch(`${API}/api/v1/reportes/${reporteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      // Si el usuario necesita refrescar la lista, debe hacerlo desde el padre.
      // Aquí no hacemos fetch global para no romper el flujo actual.
      if (!res.ok) {
        console.error("No se pudo eliminar el reporte", await res.text());
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (!rows.length) {
    return (
      <div className="text-gray-400 text-sm">No hay reportes para mostrar.</div>
    );
  }

  return (
    <div>
      <div className="min-w-[720px]">
        <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 border-b border-gray-800 pb-2">
          <div className="col-span-1">ID</div>
          <div className="col-span-2">Riesgo</div>
          <div className="col-span-3">Dominio / Teléfono</div>
          <div className="col-span-5">Descripción</div>
          <div className="col-span-1 text-right">Acción</div>
        </div>

        <div className="divide-y divide-gray-800">
          {rows.map((r) => (
            <motion.div
              key={r._k}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-12 gap-2 py-3 items-start text-sm"
            >
              <div className="col-span-1 text-gray-300">{r.id ?? "-"}</div>

              <div className="col-span-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md border ${
                    riesgoColor(r.risk_level)
                  }`}
                >
                  {(r.risk_level || "").toUpperCase() || "-"}
                </span>
              </div>

              <div className="col-span-3 text-gray-200">
                <div className="font-medium">
                  {r.domain ? r.domain : "-"}
                </div>
                <div className="text-gray-400">
                  {r.phone_number ? r.phone_number : "-"}
                </div>
              </div>

              <div className="col-span-5 text-gray-300">
                <div className="line-clamp-2">{r.description || "-"}</div>
              </div>

              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  disabled={!r.id || deletingId === r.id}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50"
                  title="Eliminar"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

