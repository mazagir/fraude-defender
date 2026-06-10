import { render, screen } from "@testing-library/react";
import AuthModal from "../components/auth/AuthModal";
import { describe, it, expect, vi } from "vitest";

describe("AuthModal Component", () => {
  it("verifica que renderiza el botón 'Continuar como Invitado'", () => {
    render(
      <AuthModal
        mode="login"
        setMode={vi.fn()}
        onClose={vi.fn()}
        onLogin={vi.fn()}
        onRegister={vi.fn()}
        onGuest={vi.fn()}
        error=""
        loading={false}
      />
    );
    expect(screen.getByText("Continuar como Invitado")).toBeInTheDocument();
  });
});
