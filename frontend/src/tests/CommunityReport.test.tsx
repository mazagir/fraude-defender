import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CommunityView from "../components/community/CommunityView";

const latamThreats = {
  Colombia: { attacks: 120, threatType: "Phishing financiero", risk: "Alto" },
};

describe("CommunityView reportes", () => {
  it("envia un reporte comunitario con indicador y descripcion", async () => {
    const onCreateReport = vi.fn().mockResolvedValue(undefined);
    render(
      <CommunityView
        reports={[]}
        selectedCountry="Colombia"
        setSelectedCountry={vi.fn()}
        latamThreats={latamThreats}
        onCreateReport={onCreateReport}
        token=""
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Denunciar/i }));
    fireEvent.change(screen.getByPlaceholderText("Ej: login-verificacion.click"), {
      target: { value: "login-verificacion.click" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Detalla/i), {
      target: { value: "Phishing bancario solicitando OTP" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar Denuncia/i }));

    await waitFor(() => expect(onCreateReport).toHaveBeenCalled());
    expect(onCreateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "login-verificacion.click",
        description: "Phishing bancario solicitando OTP",
        risk_level: "HIGH",
      })
    );
  });
});
