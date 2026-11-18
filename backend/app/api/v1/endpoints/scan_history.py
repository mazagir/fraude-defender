from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_usuario_actual
from app.models.db import User
from app.models.schemas import ScanHistoryCreate, ScanHistoryResponse
from app.services.scan_history import (
    listar_historial as service_listar,
    guardar_scan as service_guardar,
    eliminar_scan as service_eliminar,
)

router = APIRouter()

@router.get("")
def obtener_historial(
    page: int = Query(default=1, ge=1, le=500),
    page_size: int = Query(default=50, ge=1, le=200),
    usuario_actual: User = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    return service_listar(usuario_actual.id, db, page=page, page_size=page_size)

@router.post("", response_model=ScanHistoryResponse, status_code=status.HTTP_201_CREATED)
def crear_scan(
    scan_in: ScanHistoryCreate,
    usuario_actual: User = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    return service_guardar(usuario_actual.id, scan_in, db)

@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_scan(
    scan_id: int,
    usuario_actual: User = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    service_eliminar(scan_id, usuario_actual.id, db)
