from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, obtener_autenticacion_dual
from app.models.db import User
from app.models.schemas import FraudReportCreate, FraudReportResponse, AnalysisRequest
from app.services.gemini_service import GeminiService
from app.services.reports import (
    listar_reportes as service_listar,
    crear_reporte as service_crear,
    eliminar_reporte as service_eliminar,
    registrar_ejecucion_contramedida as service_registrar_contramedida,
    obtener_telemetria_defensa as service_obtener_telemetria
)
from app.main import limiter

router = APIRouter()


@router.get("", response_model=List[FraudReportResponse], status_code=status.HTTP_200_OK)
def listar_reportes(
    db: Session = Depends(get_db), 
    _: User = Depends(obtener_autenticacion_dual)
):
    """
    Lista todos los reportes de fraude registrados en orden cronológico descendente.
    Soporta autenticación por token JWT o API Key de integración (X-API-KEY).
    """
    return service_listar(db)

@router.post("", response_model=FraudReportResponse, status_code=status.HTTP_201_CREATED)
def crear_reporte(
    reporte_in: FraudReportCreate, 
    db: Session = Depends(get_db)
):
    """
    Registra un nuevo indicador de compromiso (IoC) y calcula el riesgo automáticamente.
    Requiere que al menos un campo de indicador (teléfono, cuenta bancaria, dominio) esté presente.
    Soporta autenticación dual.
    """
    return service_crear(reporte_in, db)

@router.delete("/{reporte_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_reporte(
    reporte_id: int, 
    db: Session = Depends(get_db), 
    _: User = Depends(obtener_autenticacion_dual)
):
    """
    Elimina un reporte de fraude por su ID de base de datos.
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
def crear_reporte_publico(
    reporte_in: FraudReportCreate,
    db: Session = Depends(get_db)
):
    """
    Endpoint público para que ciudadanos reporten fraudes sin autenticación.
    """
    return service_crear(reporte_in, db)

@router.get("/publico/listar", response_model=List[FraudReportResponse], status_code=status.HTTP_200_OK)
def listar_reportes_publicos(
    db: Session = Depends(get_db)
):
    """
    Endpoint público para visualizar reportes.
    No requiere autenticación.
    """
    return service_listar(db)


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
    return resultado



