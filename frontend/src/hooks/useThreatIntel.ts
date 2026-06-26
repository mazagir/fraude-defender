import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../constants/riskConfig";
import type { ThreatEvent } from "../types";

interface IntelKPI {
  usuarios_protegidos: number;
  incidentes_semanales: number;
  iocs_activos: number;
  paises_monitoreados: number;
}

interface IntelData {
  kpis: IntelKPI;
  countries: string[];
  events: ThreatEvent[];
  updated_at: string;
}

interface ThreatIntelHook {
  intel: IntelData;
  loading: boolean;
  error: string;
  refetch: () => void;
}

const fallbackIntel: IntelData = {
  kpis: {
    usuarios_protegidos: 1250,
    incidentes_semanales: 148,
    iocs_activos: 392,
    paises_monitoreados: 6,
  },
  countries: ["Colombia", "Mexico", "Peru", "Chile", "Argentina", "Ecuador"],
  events: [
    {
      id: "fallback-1",
      timestamp: new Date().toISOString(),
      severidad: "CRITICAL",
      tipo: "Montadeudas / Extorsion",
      pais: "Colombia",
      score: 92,
      indicador: "solucion-deudas-rapidas.click",
      origen: "domain",
      descripcion: "Cluster activo de cobro abusivo con amenazas por WhatsApp.",
    },
    {
      id: "fallback-2",
      timestamp: new Date().toISOString(),
      severidad: "HIGH",
      tipo: "Phishing financiero",
      pais: "Mexico",
      score: 74,
      indicador: "+525543219876",
      origen: "phone_number",
      descripcion: "Campana de suplantacion bancaria con solicitud de OTP.",
    },
  ],
  updated_at: new Date().toISOString(),
};

export default function useThreatIntel(limit: number = 25): ThreatIntelHook {
  const [intel, setIntel] = useState<IntelData>(fallbackIntel);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchThreatIntel = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/v1/threat-intel?limit=${limit}`);
      if (!response.ok) throw new Error("Threat intelligence API unavailable");
      const data = await response.json();
      setIntel({
        ...fallbackIntel,
        ...data,
        kpis: { ...fallbackIntel.kpis, ...(data.kpis || {}) },
        events: Array.isArray(data.events) && data.events.length > 0 ? data.events : fallbackIntel.events,
      });
    } catch (err) {
      setError((err as Error).message || "No se pudo cargar inteligencia de amenazas.");
      setIntel(fallbackIntel);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchThreatIntel, 0);
    const interval = window.setInterval(fetchThreatIntel, 60000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchThreatIntel]);

  return { intel, loading, error, refetch: fetchThreatIntel };
}
