import { useState } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

import { API_BASE } from "../services/apiBase";

export default function LoginView({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", nombre: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAction = async () => {
    if (!form.username || !form.password || (isRegister && !form.nombre)) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isRegister) {
        const res = await fetch(`${API_BASE}/api/v1/auth/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: form.nombre, email: form.username, password: form.password }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Error en el registro.");
        }

        setSuccess("Registro exitoso. Inicia sesión ahora.");
        setIsRegister(false);
      } else {
        const body = new URLSearchParams({ username: form.username, password: form.password });
        const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
          method: "POST",
          body,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        if (!res.ok) throw new Error("Credenciales inválidas");
        const data = await res.json();
        const receivedToken = data.access_token || data.token || Object.values(data)[0];
        if (!receivedToken) throw new Error("No se recibió token del servidor");
        onLogin(receivedToken);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070c] cyber-grid flex items-center justify-center p-4 text-slate-200 select-none relative">
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute w-full h-full scanline-overlay pointer-events-none opacity-[0.12]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl glass-panel glow-blue relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-blue-500/10 mb-4 animate-pulse">
            🛡️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Consola AegisShield</h2>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-mono">SOC ACCESO RESTRINGIDO</p>
        </div>

        <div className="space-y-4 font-sans">
          {isRegister && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1.5">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleAction()}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1.5">Correo Corporativo</label>
            <input
              type="email"
              placeholder="nombre@empresa.com"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1.5">Contraseña de Seguridad</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400">
              <FaExclamationTriangle /> {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              <FaCheckCircle /> {success}
            </motion.div>
          )}

          <button
            onClick={handleAction}
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold tracking-wider uppercase text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
          >
            {loading ? "Procesando..." : isRegister ? "Registrar Credenciales" : "Acceder al Sistema"}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800/60 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
            }}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
          >
            {isRegister ? (
              <>
                ¿Ya tienes cuenta? <span className="font-bold text-blue-400">Inicia Sesión</span>
              </>
            ) : (
              <>
                ¿No tienes credenciales? <span className="font-bold text-cyan-400">Registrar cuenta</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

