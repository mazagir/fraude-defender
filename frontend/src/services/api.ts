import type { UserData } from '../types';

export const API_BASE: string =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "https://fraude-defender-production.up.railway.app");

export default API_BASE;

export const getToken = (): string =>
  localStorage.getItem("aegis_token") || localStorage.getItem("fd_token") || "";

export const getUsuario = (): UserData | null => {
  const rawUser = localStorage.getItem("aegis_user") || localStorage.getItem("fd_usuario");
  return rawUser ? JSON.parse(rawUser) : null;
};

export const setAuth = (token: string, usuario: UserData): void => {
  localStorage.setItem("aegis_token", token);
  localStorage.setItem("aegis_user", JSON.stringify(usuario));
  localStorage.removeItem("fd_token");
  localStorage.removeItem("fd_usuario");
};

export const clearAuth = (): void => {
  localStorage.removeItem("aegis_token");
  localStorage.removeItem("aegis_user");
  localStorage.removeItem("fd_token");
  localStorage.removeItem("fd_usuario");
};

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
