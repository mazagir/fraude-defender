import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../../config/apiBase";
import type { UserData } from "../../types";

interface AdminUser {
  id: number;
  nombre: string;
  email: string;
  es_activo: boolean;
  rol: string;
}

interface AdminViewProps {
  token: string | null;
  user: UserData | null;
}

export default function AdminView({ token, user }: AdminViewProps) {
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", password: "", rol: "analista" });
  const [creando, setCreando] = useState(false);

  const esAdmin = user?.rol === "admin";

  const cargar = useCallback(async () => {
    if (!token || !esAdmin) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar la lista de usuarios.");
      setUsuarios(await res.json());
    } catch (e) {
      setMensaje({ tipo: "error", texto: (e as Error).message });
    } finally {
      setCargando(false);
    }
  }, [token, esAdmin]);

  useEffect(() => {
    if (esAdmin && token) cargar();
  }, [esAdmin, token, cargar]);

  const accion = async (fn: () => Promise<Response>, okTexto: (data: Record<string, unknown>) => string) => {
    setMensaje(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Operación rechazada por el servidor.");
      setMensaje({ tipo: "ok", texto: okTexto(data) });
      await cargar();
    } catch (e) {
      setMensaje({ tipo: "error", texto: (e as Error).message });
    }
  };

  const cambiarRol = (u: AdminUser, rol: string) =>
    accion(
      () => fetch(`${API_BASE}/api/v1/admin/usuarios/${u.id}/rol?rol=${rol}`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      }),
      (d) => `${d.usuario}: ${d.mensaje}`,
    );

  const alternarEstado = (u: AdminUser) =>
    accion(
      () => fetch(`${API_BASE}/api/v1/admin/usuarios/${u.id}/estado?activo=${!u.es_activo}`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      }),
      (d) => `${d.usuario}: ${d.mensaje}`,
    );

  const eliminar = (u: AdminUser) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${u.email}? Esta acción no se puede deshacer.`)) return;
    return accion(
      () => fetch(`${API_BASE}/api/v1/admin/usuarios/${u.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      }),
      () => `Usuario ${u.email} eliminado.`,
    );
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setMensaje(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(nuevo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg = typeof data.detail === "string" ? data.detail : "No se pudo crear el usuario.";
        if (Array.isArray(msg)) msg = msg.map((x: { msg?: string }) => x.msg || JSON.stringify(x)).join(", ");
        throw new Error(msg);
      }
      setMensaje({ tipo: "ok", texto: `Usuario ${nuevo.email} creado como ${nuevo.rol}.` });
      setNuevo({ nombre: "", email: "", password: "", rol: "analista" });
      await cargar();
    } catch (e2) {
      setMensaje({ tipo: "error", texto: (e2 as Error).message });
    } finally {
      setCreando(false);
    }
  };

  if (!token || !esAdmin) {
    return (
      <div className="bg-[#070911] border border-red-500/20 rounded-2xl p-10 text-center">
        <p className="text-3xl mb-3">🔒</p>
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Acceso restringido</h3>
        <p className="text-xs text-slate-500 mt-2">Esta sección requiere rol de administrador. Inicia sesión con una cuenta autorizada.</p>
      </div>
    );
  }

  const admins = usuarios.filter((u) => u.rol === "admin").length;
  const inactivos = usuarios.filter((u) => !u.es_activo).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            👑 Panel de Administración
            <span className="text-[9px] bg-purple-500/10 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full font-mono">SOLO ADMIN</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Gestión de usuarios y roles · RBAC verificado en backend (verificar_admin)</p>
        </div>
        <button onClick={cargar} disabled={cargando} className="text-[10px] font-bold uppercase tracking-wider border border-slate-700 hover:border-cyan-500/40 text-slate-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
          {cargando ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </div>

      {mensaje && (
        <div className={`rounded-xl px-4 py-2.5 text-xs font-semibold border ${mensaje.tipo === "ok" ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300" : "bg-red-950/30 border-red-500/30 text-red-300"}`}>
          {mensaje.tipo === "ok" ? "✓ " : "✕ "}{mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Usuarios totales", valor: usuarios.length, color: "text-cyan-400" },
          { label: "Administradores", valor: admins, color: "text-purple-400" },
          { label: "Analistas activos", valor: usuarios.filter((u) => u.rol === "analista" && u.es_activo).length, color: "text-emerald-400" },
          { label: "Inactivos", valor: inactivos, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#070911] border border-slate-800/80 rounded-xl p-4">
            <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.valor}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={crearUsuario} className="bg-[#070911] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">＋ Crear usuario</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input required minLength={2} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Nombre completo" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-cyan-500/50 outline-none" />
          <input required type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} placeholder="correo@ejemplo.com" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-cyan-500/50 outline-none" />
          <input required minLength={12} value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} placeholder="Contraseña (mín. 12 caracteres)" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-cyan-500/50 outline-none" />
          <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-cyan-500/50 outline-none cursor-pointer">
            <option value="analista">Rol: Analista</option>
            <option value="admin">Rol: Administrador</option>
          </select>
        </div>
        <button type="submit" disabled={creando} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 text-xs font-bold rounded-lg hover:from-blue-500 hover:to-cyan-400 transition-all cursor-pointer disabled:opacity-50">
          {creando ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      <div className="bg-[#070911] border border-slate-800/80 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60">
              {["ID", "Usuario", "Rol", "Estado", "Acciones"].map((h) => (
                <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-widest font-bold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-900 hover:bg-slate-900/30 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{u.id}</td>
                <td className="px-4 py-3">
                  <div className="text-xs font-bold text-slate-200">{u.nombre}{u.email === user?.email && <span className="ml-2 text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">TÚ</span>}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                    disabled={u.email === user?.email}
                    className={`bg-transparent border rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none ${
                      u.rol === "admin" ? "border-purple-500/40 text-purple-300" : "border-slate-700 text-slate-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="analista">Analista</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => alternarEstado(u)} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${u.es_activo ? "text-emerald-400" : "text-red-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.es_activo ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    {u.es_activo ? "Activo" : "Bloqueado"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => eliminar(u)} disabled={u.email === user?.email} className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-950/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!cargando && usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-500">Sin usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
