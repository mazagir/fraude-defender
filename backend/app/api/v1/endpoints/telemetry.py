from uuid import uuid4

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import decodificar_token_acceso
from app.models.db import User
from app.services.telemetry import incident_log_stream, telemetry_manager


router = APIRouter()


@router.websocket("/telemetry")
async def telemetry_websocket(
    websocket: WebSocket,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if settings.WS_AUTH_REQUIRED:
        user = _authenticate_websocket(token=token, db=db)
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    connection_id = str(uuid4())
    await telemetry_manager.connect(websocket)
    try:
        async for event in incident_log_stream(connection_id):
            event["active_connections"] = telemetry_manager.active_count
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        telemetry_manager.disconnect(websocket)


def _authenticate_websocket(token: str | None, db: Session) -> User | None:
    if not token:
        return None
    try:
        payload = decodificar_token_acceso(token)
    except ValueError:
        return None

    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user or not user.es_activo:
        return None
    return user
