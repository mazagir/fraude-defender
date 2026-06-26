import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ThreatIntelPanel from "../components/threat/ThreatIntelPanel";

const intel = {
  kpis: {
    usuarios_protegidos: 1800,
    incidentes_semanales: 44,
    iocs_activos: 18,
    paises_monitoreados: 6,
  },
  events: [
    {
      id: 1,
      timestamp: "2026-06-10T20:00:00Z",
      severity: "HIGH",
      category: "Phishing financiero",
      country: "Colombia",
      risk_score: 72,
      ioc: { type: "domain", value: "banco-verificacion.click" },
      description: "Suplantacion bancaria",
    },
  ],
};

describe("ThreatIntelPanel", () => {
  it("renderiza KPIs y eventos del feed", () => {
    render(<ThreatIntelPanel intel={intel} loading={false} error="" />);
    expect(screen.getByText("Threat Intelligence Feed")).toBeInTheDocument();
    expect(screen.getByText("Usuarios protegidos")).toBeInTheDocument();
    expect(screen.getByText("1.800")).toBeInTheDocument();
    expect(screen.getByText("Phishing financiero")).toBeInTheDocument();
    expect(screen.getByText("banco-verificacion.click")).toBeInTheDocument();
  });
});
