import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: "page" | "inline";
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: String(error?.message || error || "Error desconocido") };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("AgielShield ErrorBoundary:", error, info.componentStack);
  }

  esErrorDeRecarga = (): boolean =>
    /chunk|dynamically imported|Failed to fetch dynamically|importing a module|Loading CSS chunk/i.test(this.state.message);

  handleReload = (): void => {
    if (this.props.variant === "inline") {
      this.setState({ hasError: false, message: "" });
      return;
    }
    window.location.reload();
  };

  handleGoHome = (): void => {
    try {
      ["aegis_token", "aegis_user"].forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    window.location.href = window.location.origin;
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.variant === "inline") {
      return (
        <div className="h-[320px] bg-[#070911] border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-6">
          <span className="text-2xl">🛰️</span>
          <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
            {this.esErrorDeRecarga()
              ? "Hay una nueva versión de la plataforma disponible."
              : "No se pudo cargar este módulo en este momento."}
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#05070c] text-slate-200 font-sans flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-[#070911]/80 border border-slate-800 rounded-3xl p-8 space-y-5 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/10">
            🛡️
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">Interferencia temporal en AgielShield</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {this.esErrorDeRecarga()
              ? "Se publicó una nueva versión de la plataforma mientras la usabas. Recarga para continuar con la versión más reciente."
              : "Ocurrió un error inesperado al mostrar esta vista. Tus datos están a salvo; reintenta o vuelve al inicio."}
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-lg shadow-blue-500/10"
            >
              Recargar aplicación
            </button>
            <button
              onClick={this.handleGoHome}
              className="w-full py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold text-xs uppercase tracking-wide transition-colors cursor-pointer"
            >
              Cerrar sesión e ir al inicio
            </button>
          </div>
          <p className="text-[9px] text-slate-600 font-mono break-all">{this.state.message.slice(0, 140)}</p>
        </div>
      </div>
    );
  }
}
