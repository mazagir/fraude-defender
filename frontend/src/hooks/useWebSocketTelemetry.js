import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:8000"
      : window.location.origin)
    : "");

function getStoredToken() {
  return localStorage.getItem("aegis_token") || localStorage.getItem("fd_token") || "";
}

function buildTelemetryUrl({ apiBase = DEFAULT_API_BASE, token, wsUrl }) {
  const base = wsUrl || apiBase;
  if (!base) return "";
  const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

  if (!wsUrl) {
    const path = url.pathname.replace(/\/$/, "");
    url.pathname = path.endsWith("/api/v1")
      ? `${path}/ws/telemetry`
      : `${path}/api/v1/ws/telemetry`;
  }

  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

export function useWebSocketTelemetry({
  token,
  enabled = true,
  apiBase = DEFAULT_API_BASE,
  wsUrl = import.meta.env.VITE_WS_TELEMETRY_URL,
  maxEvents = 250,
  flushIntervalMs = 500,
  maxReconnectDelayMs = 30000,
} = {}) {
  const [status, setStatus] = useState("idle");
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const socketRef = useRef(null);
  const bufferRef = useRef([]);
  const reconnectTimerRef = useRef(null);
  const connectRef = useRef(null);
  const manuallyClosedRef = useRef(false);
  const activeToken = token ?? getStoredToken();

  const telemetryUrl = useMemo(
    () => buildTelemetryUrl({ apiBase, token: activeToken, wsUrl }),
    [apiBase, activeToken, wsUrl]
  );

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const batch = bufferRef.current;
    bufferRef.current = [];

    setLastEvent(batch[batch.length - 1]);
    setEvents((current) => [...batch, ...current].slice(0, maxEvents));
  }, [maxEvents]);

  const disconnect = useCallback(() => {
    manuallyClosedRef.current = true;
    window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;

    if (socketRef.current) {
      socketRef.current.close(1000, "client disconnect");
      socketRef.current = null;
    }
    setStatus("closed");
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !activeToken) {
      setStatus(enabled ? "unauthorized" : "idle");
      return;
    }

    manuallyClosedRef.current = false;
    setStatus("connecting");

    const socket = new WebSocket(telemetryUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("open");
      setReconnectAttempt(0);
    };

    socket.onmessage = (message) => {
      try {
        bufferRef.current.push(JSON.parse(message.data));
      } catch {
        bufferRef.current.push({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          event_type: "RAW_MESSAGE",
          severity: "LOW",
          message: String(message.data),
        });
      }
    };

    socket.onerror = () => {
      setStatus("error");
    };

    socket.onclose = () => {
      socketRef.current = null;
      flushBuffer();

      if (manuallyClosedRef.current || !enabled) {
        setStatus("closed");
        return;
      }

      setStatus("reconnecting");
      setReconnectAttempt((attempt) => {
        const nextAttempt = attempt + 1;
        const jitter = Math.floor(Math.random() * 500);
        const delay = Math.min(1000 * 2 ** attempt + jitter, maxReconnectDelayMs);

        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = window.setTimeout(() => connectRef.current?.(), delay);
        return nextAttempt;
      });
    };
  }, [activeToken, enabled, flushBuffer, maxReconnectDelayMs, telemetryUrl]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    const interval = window.setInterval(flushBuffer, flushIntervalMs);
    return () => window.clearInterval(interval);
  }, [flushBuffer, flushIntervalMs]);

  useEffect(() => {
    const initialConnect = window.setTimeout(() => connectRef.current?.(), 0);
    return () => {
      window.clearTimeout(initialConnect);
      disconnect();
    };
  }, [connect, disconnect]);

  const metrics = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc.total += 1;
        acc.bySeverity[event.severity] = (acc.bySeverity[event.severity] || 0) + 1;
        acc.byType[event.event_type] = (acc.byType[event.event_type] || 0) + 1;
        return acc;
      },
      { total: 0, bySeverity: {}, byType: {} }
    );
  }, [events]);

  return {
    status,
    events,
    lastEvent,
    metrics,
    reconnectAttempt,
    connect,
    disconnect,
  };
}

export default useWebSocketTelemetry;
