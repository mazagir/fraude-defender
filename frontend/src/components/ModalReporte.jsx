import { useState } from "react";

import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

import API, { authHeaders } from "../services/api";

function detectarRiesgoAutomatico(form) {
  let score = 0;

  const dominio = form.domain?.toLowerCase() || "";
  const descripcion = form.description?.toLowerCase() || "";

  // Dominios sospechosos
  if (
    dominio.includes(".xyz") ||
    dominio.includes(".top") ||
    dominio.includes(".click") ||
    dominio.includes(".loan")
  ) {
    score += 40;
  }

  // Palabras sospechosas
  const palabras = [
    "extorsión",
    "amenaza",
    "préstamo",
    "gota a gota",
    "montadeudas",
    "whatsapp",
    "hack",
    "estafa",
  ];

  palabras.forEach((p) => {
    if (descripcion.includes(p)) {
      score += 10;
    }
  });

  // Teléfono internacional
  if (
    form.phone_number &&
    form.phone_number.startsWith("+") &&
    !form.phone_number.startsWith("+57")
  ) {
    score += 25;
  }

  // Resultado
  if (score >= 60) return "alto";
  if (score >= 30) return "medio";
  return "bajo";
}

function ModalReporte({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    phone_number: "",
    bank_account: "",
    domain: "",
    risk_level: "alto",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleChange = (e) => {
    const nuevo = {
      ...form,
      [e.target.name]: e.target.value,
    };

    nuevo.risk_level = detectarRiesgoAutomatico(nuevo);
    setForm(nuevo);
  };

  const handleSubmit = async () => {
    if (!form.phone_number && !form.bank_account && !form.domain) {
      setMensaje({
        tipo: "error",
        texto: "Debe ingresar teléfono, cuenta o dominio.",
      });
      return;
    }

    if (!form.description) {
      setMensaje({
        tipo: "error",
        texto: "La descripción es obligatoria.",
      });
      return;
    }

    setLoading(true);
    try {
      // IMPORTANTE: usar la misma ruta del App.jsx (incluye /api/v1)
      const res = await fetch(`${API}/api/v1/reportes/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMensaje({
          tipo: "ok",
          texto: "Reporte registrado exitosamente.",
        });

        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 1200);
      } else {
        const err = await res.json();
        setMensaje({
          tipo: "error",
          texto: err.detail || "Error",
        });
      }
    } catch {
      setMensaje({
        tipo: "error",
        texto: "Error de conexión.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          type="button"
        >
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-green-400">Nuevo Reporte</h2>

        <div className="space-y-4">
          <input
            name="phone_number"
            placeholder="Teléfono"
            value={form.phone_number}
            onChange={handleChange}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white"
          />

          <input
            name="bank_account"
            placeholder="Cuenta bancaria"
            value={form.bank_account}
            onChange={handleChange}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white"
          />

          <input
            name="domain"
            placeholder="Dominio"
            value={form.domain}
            onChange={handleChange}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white"
          />

          <textarea
            name="description"
            placeholder="Descripción"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white"
          />

          {/* IA */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Riesgo Detectado Automáticamente</p>

            <div
              className={`inline-block px-4 py-2 rounded-full font-bold ${
                form.risk_level === "alto"
                  ? "bg-red-500"
                  : form.risk_level === "medio"
                  ? "bg-yellow-500"
                  : "bg-green-600"
              }`}
            >
              {String(form.risk_level || "").toUpperCase()}
            </div>
          </div>

          {mensaje && (
            <div
              className={`p-3 rounded-xl ${
                mensaje.tipo === "ok"
                  ? "bg-green-800 text-green-200"
                  : "bg-red-800 text-red-200"
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl"
            type="button"
          >
            {loading ? "Analizando amenaza..." : "Registrar Reporte"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ModalReporte;

