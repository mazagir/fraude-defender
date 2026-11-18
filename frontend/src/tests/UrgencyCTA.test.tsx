import { render, screen } from "@testing-library/react";
import UrgencyCTA from "../components/scanner/UrgencyCTA";
import { describe, it, expect } from "vitest";

describe("UrgencyCTA Component", () => {
  it("verifica que renderiza un número mayor o igual a 37 en pantalla", () => {
    render(<UrgencyCTA />);
    const textElement = screen.getByText(/amenazas críticas detectadas hoy en LATAM/);
    expect(textElement).toBeInTheDocument();
    
    const countElement = screen.getByText(/^\d+$/);
    const count = parseInt(countElement.textContent, 10);
    expect(count).toBeGreaterThanOrEqual(37);
  });
});
