/** URL base del backend FastAPI (Render en prod, localhost en dev). */
const LOCAL_API = "http://localhost:8000";

/** Nombre del Web Service en Render (`render.yaml` → name: agishield-api). */
const RENDER_API_DEFAULT = "https://agishield-api.onrender.com";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }

  if (import.meta.env.DEV || isLocalHost()) {
    return LOCAL_API;
  }

  return RENDER_API_DEFAULT;
}

export const API_BASE = resolveApiBase();
