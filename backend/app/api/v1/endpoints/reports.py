from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, obtener_autenticacion_dual
from app.models.db import User
from app.models.schemas import FraudReportCreate, FraudReportResponse, AnalysisRequest, PaginatedResponse
from app.services.gemini_service import GeminiService
from app.services.event_bus import event_bus, build_event
from app.services.reports import (
    listar_reportes as service_listar,
    crear_reporte as service_crear,
    eliminar_reporte as service_eliminar,
    registrar_ejecucion_contramedida as service_registrar_contramedida,
    obtener_telemetria_defensa as service_obtener_telemetria
)
from app.main import limiter

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
def listar_reportes(
    page: int = Query(default=1, ge=1, le=500),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db), 
    _: User = Depends(obtener_autenticacion_dual)
):
    """
    Lista paginada de reportes de fraude en orden cronológico descendente.
    Soporta autenticación por token JWT o API Key de integración (X-API-KEY).
    """
    return service_listar(db, page=page, page_size=page_size)

@router.post("", response_model=FraudReportResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def crear_reporte(
    request: Request,
    reporte_in: FraudReportCreate, 
    db: Session = Depends(get_db)
):
    """
    Registra un nuevo indicador de compromiso (IoC) y calcula el riesgo automáticamente.
    Rate limit: 30/min.
    """
    return service_crear(reporte_in, db)

@router.delete("/{reporte_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
def eliminar_reporte(
    request: Request,
    reporte_id: int, 
    db: Session = Depends(get_db), 
    _: User = Depends(obtener_autenticacion_dual)
):
    """
    Elimina un reporte de fraude por su ID de base de datos.
    Rate limit: 30/min para prevenir abuso.
    Soporta autenticación dual.
    """
    service_eliminar(reporte_id, db)

@router.post("/contramedida", status_code=status.HTTP_201_CREATED)
def registrar_ejecucion_contramedida():
    """
    Endpoint público para que las herramientas de envenenamiento (ADB/Decoys) 
    reporten la inyección exitosa de datos falsos.
    """
    return service_registrar_contramedida()

@router.get("/metricas/contramedidas")
def obtener_telemetria_defensa():
    """
    Endpoint público para consultar la telemetría de contramedidas activas y ejecuciones.
    """
    return service_obtener_telemetria()
@router.post("/publico", response_model=FraudReportResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def crear_reporte_publico(
    request: Request,
    reporte_in: FraudReportCreate,
    db: Session = Depends(get_db)
):
    """
    Endpoint público para reportar fraudes sin autenticación.
    Rate limit: 10/min por IP.
    """
    return service_crear(reporte_in, db)

@router.get("/publico/listar", status_code=status.HTTP_200_OK)
def listar_reportes_publicos(
    page: int = Query(default=1, ge=1, le=500),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Lista pública paginada de reportes. No requiere autenticación.
    """
    return service_listar(db, page=page, page_size=page_size)


@router.post("/simular-ataques", status_code=status.HTTP_201_CREATED)
def simular_ataques():
    """Dispara la simulación de ataques (IoCs falsos) para estresar el motor heurístico.

    Nota: Endpoint pensado para uso interno/QA.
    """
    # Reutilizamos el servicio existente de contramedidas como contador de ejecuciones.
    # Los IoCs serán inyectados por el simulador externo que ya genera reportes.
    # Si el servicio de simulación se implementa 100% server-side, se puede extender aquí.
    return service_registrar_contramedida()

@router.post("/analizar", status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")  # Protege contra uso masivo de la API de Gemini
async def analizar_sospecha(request: Request, req_body: AnalysisRequest):
    """
    Endpoint público para analizar un elemento sospechoso de fraude (URL, mensaje, WhatsApp, correo, QR).
    Invoca a Gemini AI y retorna un informe legible y estructurado.
    """
    service = GeminiService()
    resultado = await service.analizar_sospecha(tipo=req_body.tipo, contenido=req_body.contenido)

    await event_bus.publish("telemetry", build_event(
        event_type="IOC_MATCH",
        severity=resultado.get("level", "LOW"),
        message=f"Análisis {req_body.tipo}: score={resultado.get('score', 0)}",
        source="risk-engine",
        ioc={"type": req_body.tipo, "value": req_body.contenido[:40]},
        risk_score=resultado.get("score", 0),
    ))

    return resultado



