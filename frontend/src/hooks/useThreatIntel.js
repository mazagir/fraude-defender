import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../constants/riskConfig";

const fallbackIntel = {
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
      severity: "CRITICAL",
      category: "Montadeudas / Extorsion",
      country: "Colombia",
      risk_score: 92,
      ioc: { type: "domain", value: "solucion-deudas-rapidas.click" },
      description: "Cluster activo de cobro abusivo con amenazas por WhatsApp.",
      indicators: ["TLD sospechoso", "Patron de extorsion"],
    },
    {
      id: "fallback-2",
      timestamp: new Date().toISOString(),
      severity: "HIGH",
      category: "Phishing financiero",
      country: "Mexico",
      risk_score: 74,
      ioc: { type: "phone_number", value: "+525543219876" },
      description: "Campana de suplantacion bancaria con solicitud de OTP.",
      indicators: ["Suplantacion", "Urgencia artificial"],
    },
  ],
  updated_at: new Date().toISOString(),
};

export default function useThreatIntel(limit = 25) {
  const [intel, setIntel] = useState(fallbackIntel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError(err.message || "No se pudo cargar inteligencia de amenazas.");
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
