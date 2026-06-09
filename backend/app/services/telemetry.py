from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import WebSocket


SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
SOURCES = ["ioc-ingestor", "risk-engine", "decoy-sensor", "api-gateway", "soc-correlator"]
EVENT_TYPES = ["IOC_MATCH", "RISK_SPIKE", "DECOY_HIT", "AUTH_ANOMALY", "FRAUD_CLUSTER"]


class TelemetryConnectionManager:
    def __init__(self) -> None:
        self.active_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    @property
    def active_count(self) -> int:
        return len(self.active_connections)


telemetry_manager = TelemetryConnectionManager()


async def incident_log_stream(connection_id: str):
    counter = 0
    while True:
        counter += 1
        severity = random.choices(SEVERITIES, weights=[0.45, 0.30, 0.18, 0.07], k=1)[0]
        event_type = random.choice(EVENT_TYPES)
        risk_score = {
            "LOW": random.randint(5, 25),
            "MEDIUM": random.randint(26, 50),
            "HIGH": random.randint(51, 75),
            "CRITICAL": random.randint(76, 100),
        }[severity]

        yield {
            "id": str(uuid4()),
            "sequence": counter,
            "connection_id": connection_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": random.choice(SOURCES),
            "event_type": event_type,
            "severity": severity,
            "risk_score": risk_score,
            "ioc": _mock_ioc(event_type),
            "message": _message_for(event_type, severity),
        }

        await asyncio.sleep(random.uniform(1.0, 2.8))


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
        "IOC_MATCH": "Indicador cruzado con reportes historicos.",
        "RISK_SPIKE": "Incremento abrupto de score heuristico.",
        "DECOY_HIT": "Interaccion detectada contra infraestructura decoy.",
        "AUTH_ANOMALY": "Patron de autenticacion atipico en consola.",
        "FRAUD_CLUSTER": "Cluster de fraude correlacionado por multiples IoCs.",
    }
    return f"{messages[event_type]} Severidad {severity}."
