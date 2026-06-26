import { fireEvent, render, screen } from "@testing-library/react";
import AuthModal from "../components/auth/AuthModal";
import { describe, it, expect, vi } from "vitest";

function renderAuthModal(overrides = {}) {
  const props = {
    mode: "login",
    setMode: vi.fn(),
    onClose: vi.fn(),
    onLogin: vi.fn(),
    onRegister: vi.fn(),
    onGuest: vi.fn(),
    error: "",
    loading: false,
    ...overrides,
  };
  render(<AuthModal {...props} />);
  return props;
}

describe("AuthModal Component", () => {
  it("verifica que renderiza el boton 'Continuar como Invitado'", () => {
    renderAuthModal();
    expect(screen.getByText("Continuar como Invitado")).toBeInTheDocument();
  });

  it("envia credenciales al hacer login", () => {
    const props = renderAuthModal();
    fireEvent.change(screen.getByLabelText(/Correo/i), { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByLabelText(/Contras/i), { target: { value: "claveSegura2026!" } });
    fireEvent.click(screen.getByRole("button", { name: /Ingresar al SOC/i }));
    expect(props.onLogin).toHaveBeenCalledWith("user@test.com", "claveSegura2026!");
  });

  it("envia datos completos al registrar usuario", () => {
    const props = renderAuthModal({ mode: "register" });
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: "Sofia Rodriguez" } });
    fireEvent.change(screen.getByLabelText(/Correo/i), { target: { value: "sofia@test.com" } });
    fireEvent.change(screen.getByLabelText(/Contras/i), { target: { value: "claveSegura2026!" } });
    fireEvent.click(screen.getByRole("button", { name: /Registrarme/i }));
    expect(props.onRegister).toHaveBeenCalledWith(
      "Sofia Rodriguez",
      "sofia@test.com",
      "claveSegura2026!"
    );
  });
});
