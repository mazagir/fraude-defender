import { render, screen } from "@testing-library/react";
import RiskBadge from "../components/shared/RiskBadge";
import { describe, it, expect } from "vitest";

describe("RiskBadge Component", () => {
  it("verifica que con level='critical' renderiza el texto 'CRITICO'", () => {
    render(<RiskBadge level="critical" />);
    expect(screen.getByText("CRITICO")).toBeInTheDocument();
  });

  it("normaliza severidades HIGH del backend a ALTO", () => {
    render(<RiskBadge level="HIGH" />);
    expect(screen.getByText("ALTO")).toBeInTheDocument();
  });
});
