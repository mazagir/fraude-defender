import { render, screen } from "@testing-library/react";
import RiskBadge from "../components/shared/RiskBadge";
import { describe, it, expect } from "vitest";

describe("RiskBadge Component", () => {
  it("verifica que con level='critical' renderiza el texto 'CRÍTICO'", () => {
    render(<RiskBadge level="critical" />);
    expect(screen.getByText("CRÍTICO")).toBeInTheDocument();
  });
});
