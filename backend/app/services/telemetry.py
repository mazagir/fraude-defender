from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import WebSocket

from app.services.event_bus import build_event, event_bus

logger = logging.getLogger("aegisshield.telemetry")

SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
SOURCES = ["ioc-ingestor", "risk-engine", "decoy-sensor", "api-gateway", "soc-correlator"]
EVENT_TYPES = ["IOC_MATCH", "RISK_SPIKE", "DECOY_HIT", "AUTH_ANOMALY", "FRAUD_CLUSTER"]

TELEMETRY_TOPIC = "telemetry"


class TelemetryConnectionManager:
    def __init__(self) -> None:
        self.active_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Cliente WebSocket conectado. Conexiones activas: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        logger.info(f"Cliente WebSocket desconectado. Conexiones activas: {len(self.active_connections)}")

    @property
    def active_count(self) -> int:
        return len(self.active_connections)


telemetry_manager = TelemetryConnectionManager()


async def incident_log_stream(connection_id: str):
    """Stream de eventos de telemetría en tiempo real.

    Consume del event bus y emite heartbeats periódicos
    para mantener la conexión viva cuando no hay eventos nuevos.
    """
    queue = event_bus.subscribe(TELEMETRY_TOPIC)
    heartbeat_interval = 5.0
    mock_interval = 30.0
    last_mock = 0.0

    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=heartbeat_interval)
                yield event
                last_mock = 0.0
            except asyncio.TimeoutError:
                now = datetime.now(timezone.utc).timestamp()
                if last_mock == 0:
                    last_mock = now
                elif now - last_mock >= mock_interval:
                    yield _mock_event(connection_id)
                    last_mock = now
                else:
                    yield {
                        "id": str(uuid4()),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "source": "heartbeat",
                        "event_type": "HEARTBEAT",
                        "severity": "LOW",
                        "risk_score": 0,
                        "ioc": {"type": "heartbeat", "value": "keepalive"},
                        "message": f"Conexión activa ({telemetry_manager.active_count} clientes conectados)",
                        "connection_id": connection_id,
                    }
    finally:
        event_bus.unsubscribe(TELEMETRY_TOPIC, queue)


async def emit_scan_event(
    scan_type: str,
    score: int,
    severity: str,
    description: str,
    ioc_type: str = "scan",
    ioc_value: str = "",
) -> None:
    """Publica un evento de escaneo al bus para todos los clientes WebSocket."""
    event = build_event(
        event_type="IOC_MATCH",
        severity=severity,
        message=f"Análisis {scan_type}: {description[:80]}",
        source="risk-engine",
        ioc={"type": ioc_type, "value": ioc_value or description[:40]},
        risk_score=score,
    )
    await event_bus.publish(TELEMETRY_TOPIC, event)
    logger.info(f"[TELEMETRIA] Evento emitido: {scan_type} score={score}")


async def emit_report_event(
    risk_level: str,
    risk_score: int,
    description: str,
    ioc_type: str = "report",
    ioc_value: str = "",
) -> None:
    """Publica un evento cuando se crea un reporte de fraude."""
    event = build_event(
        event_type="FRAUD_CLUSTER",
        severity=risk_level,
        message=f"Nuevo IoC registrado: {description[:80]}",
        source="ioc-ingestor",
        ioc={"type": ioc_type, "value": ioc_value or description[:40]},
        risk_score=risk_score,
    )
    await event_bus.publish(TELEMETRY_TOPIC, event)
    logger.info(f"[TELEMETRIA] Reporte emitido: level={risk_level} score={risk_score}")


def _mock_event(connection_id: str) -> dict:
    severity = random.choices(SEVERITIES, weights=[0.45, 0.30, 0.18, 0.07], k=1)[0]
    event_type = random.choice(EVENT_TYPES)
    risk_score = {
        "LOW": random.randint(5, 25),
        "MEDIUM": random.randint(26, 50),
        "HIGH": random.randint(51, 75),
        "CRITICAL": random.randint(76, 100),
    }[severity]

    return {
        "id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": random.choice(SOURCES),
        "event_type": event_type,
        "severity": severity,
        "risk_score": risk_score,
        "ioc": _mock_ioc(event_type),
        "message": _message_for(event_type, severity),
        "connection_id": connection_id,
    }


def _mock_ioc(event_type: str) -> dict[str, str]:
    if event_type == "AUTH_ANOMALY":
        return {"type": "identity", "value": "admin-console-login"}
    if event_type == "DECOY_HIT":
        return {"type": "decoy", "value": "poison-profile-campaign"}
    if event_type == "FRAUD_CLUSTER":
        return {"type": "bank_account", "value": f"nequi-{random.randint(3000000000, 3999999999)}"}
    if event_type == "RISK_SPIKE":
        return {"type": "phone_number", "value": f"+57{random.randint(3000000000, 3999999999)}"}
    return {"type": "domain", "value": random.choice(["prestamo-ya.xyz", "verificar-cuenta.click", "soporte-pagos.top"])}


def _message_for(event_type: str, severity: str) -> str:
    messages = {
        "IOC_MATCH": "Indicador cruzado con reportes históricos.",
        "RISK_SPIKE": "Incremento abrupto de score heurístico.",
        "DECOY_HIT": "Interacción detectada contra infraestructura decoy.",
        "AUTH_ANOMALY": "Patrón de autenticación atípico en consola.",
        "FRAUD_CLUSTER": "Cluster de fraude correlacionado por múltiples IoCs.",
    }
    return f"{messages[event_type]} Severidad {severity}."
