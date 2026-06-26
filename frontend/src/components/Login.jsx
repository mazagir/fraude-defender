import { useState } from "react";

import API from "../services/api";

export function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const loginConRuta = async (url, payload) => {
    // OAuth2PasswordRequestForm (FastAPI) espera form-urlencoded: username/password.
    const form = new URLSearchParams();
    if (payload?.username) form.set("username", payload.username);
    if (payload?.email) form.set("username", payload.email);
    if (payload?.password) form.set("password", payload.password);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const data = await (async () => {
      try {
        return await res.json();
      } catch {
        return null;
      }
    })();

    return { ok: res.ok, status: res.status, data };
  };

  const handleLogin = async () => {
    setLoading(true);
    setMensaje(null);

    // Si tu backend requiere otro formato (email/username), intentamos ambos.
    const password = "demo-password";
    const candidates = [
      { email: "demo@local", payload: { email: "demo@local", password } },
      { username: "demo", payload: { username: "demo", password } },
    ];

    const routes = [`${API}/api/v1/auth/login`];

    let last = null;

    try {
      for (const route of routes) {
        for (const c of candidates) {
          const r = await loginConRuta(route, c.payload);
          last = { route, payload: c.payload, ...r };

          if (r.ok) {
            const body = r.data || {};
            const token = body.access_token || body.token || body.jwt || body.fd_token;
            const user = body.user || body.usuario || body || { email: body.email || "" };

            if (!token) {
              throw new Error(`Login OK pero no se encontró token en respuesta (${route}).`);
            }

            // Unificar storage con App.jsx (admin usa aegis_token)
            localStorage.setItem("aegis_token", token);
            localStorage.setItem("fd_usuario", JSON.stringify(user));
            onLogin?.(token);
            return;
          }
        }
      }

      const detail = last?.data?.detail || last?.data?.message || JSON.stringify(last?.data || {});
      setMensaje({
        tipo: "error",
        texto: `No se pudo autenticar. Último intento: ${last?.route}. Detalle: ${detail}`,
      });
    } catch (e) {
      setMensaje({
        tipo: "error",
        texto: String(e?.message || e),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setMensaje(null);

    try {
      const password = "demo-password";
      const payloads = [
        { email: "demo@local", username: "demo", password },
        { username: "demo", password },
        { email: "demo@local", password },
      ];

      const routes = [
        `${API}/api/v1/auth/register`,
        `${API}/api/v1/auth/signup`,
        `${API}/auth/register`,
        `${API}/auth/signup`,
        `${API}/api/v1/users`,
        `${API}/users`,
      ];

      let last = null;
      for (const route of routes) {
        for (const p of payloads) {
          const res = await fetch(route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          });
          last = { route, ok: res.ok, status: res.status };
          if (res.ok) {
            setMensaje({
              tipo: "ok",
              texto: "Usuario registrado (o ya existe). Ahora intenta Login.",
            });
            return;
          }
        }
      }

      setMensaje({
        tipo: "error",
        texto: `No se pudo registrar usuario. Último intento: ${JSON.stringify(last)}`,
      });
    } catch (e) {
      setMensaje({
        tipo: "error",
        texto: `Error registrando usuario: ${String(e?.message || e)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Login</h2>
        <div className="text-xs text-gray-400 mb-4">
          Intenta autenticar contra rutas comunes del backend.
        </div>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg w-full"
          onClick={handleLogin}
          disabled={loading}
          type="button"
        >
          {loading ? "Autenticando..." : "Entrar"}
        </button>

        {mensaje && (
          <div
            className={`mt-3 p-3 rounded-xl ${
              mensaje.tipo === "error" ? "bg-red-800 text-red-200" : "bg-green-800 text-green-200"
            }`}
          >
            {mensaje.texto}
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Registrar usuario</h2>
        <div className="text-xs text-gray-400 mb-4">
          Si tu backend soporta creación de usuarios, intenta estas rutas.
        </div>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg w-full"
          type="button"
          onClick={handleRegister}
          disabled={loading}
        >
          Crear usuario (intentar)
        </button>
      </div>
    </div>
  );
}

