from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Importaciones de infraestructura y base de datos
from app.core.database import get_db  # Dependencia para inyectar la sesión
from app.models.db import FraudReport
from app.models.schemas import FraudReportCreate  # Asegúrate de tener este esquema definido en schemas.py
from app.services.risk_engine import analizar_riesgo

# Inicializamos el enrutador de FastAPI
router = APIRouter()

# Contador de telemetría de contramedidas en memoria
contador_contramedidas = {"ejecuciones_totales": 0}

# ─── ENDPOINT: OBTENER TODOS LOS REPORTES ─────────────────────────────
@router.get("/", response_model=List[dict])
def listar_reportes(db: Session = Depends(get_db)):
    """
    Obtiene la lista de todos los reportes de fraude registrados en AegisShield,
    ordenados del más reciente al más antiguo.
    """
    reportes = db.query(FraudReport).order_by(FraudReport.created_at.desc()).all()
    return reportes


# ─── ENDPOINT: CREAR UN NUEVO REPORTE ─────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_reporte(reporte_in: FraudReportCreate, db: Session = Depends(get_db)):
    """
    Registra un reporte de fraude. Valida que exista al menos un indicador 
    (teléfono, cuenta o dominio) y calcula dinámicamente el nivel de riesgo.
    """
    # Validación estricta de Indicadores de Compromiso (IoCs)
    if not reporte_in.phone_number and not reporte_in.bank_account and not reporte_in.domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Debe proporcionar al menos un Indicador de Compromiso (Teléfono, Cuenta Bancaria o Dominio)."
        )
    
    # Ejecutar el motor de análisis de riesgo de AegisShield
    score, level, indicators = analizar_riesgo(
        db=db,
        phone_number=reporte_in.phone_number,
        bank_account=reporte_in.bank_account,
        domain=reporte_in.domain,
        description=reporte_in.description
    )
    
    # Si el cliente no especifica un nivel de riesgo, usamos el calculado por el motor
    risk_level = reporte_in.risk_level if reporte_in.risk_level else level
    
    nuevo_reporte = FraudReport(
        phone_number=reporte_in.phone_number,
        bank_account=reporte_in.bank_account,
        domain=reporte_in.domain,
        description=reporte_in.description,
        risk_level=risk_level,
        risk_score=score,
        malicious_indicators=", ".join(indicators) if indicators else "Ninguno"
    )
    
    db.add(nuevo_reporte)
    db.commit()
    db.refresh(nuevo_reporte)
    return nuevo_reporte


# ─── ENDPOINT: ELIMINAR UN REPORTE ────────────────────────────────────
@router.delete("/{reporte_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_reporte(reporte_id: int, db: Session = Depends(get_db)):
    """
    Elimina un reporte de fraude específico de la base de datos mediante su ID.
    """
    reporte = db.query(FraudReport).filter(FraudReport.id == reporte_id).first()
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Reporte no encontrado en la plataforma."
        )
    db.delete(reporte)
    db.commit()
    return None


# ─── ENDPOINTS: TELEMETRÍA Y DEFENSA ACTIVA ───────────────────────────
@router.post("/contramedidas/registrar")
def registrar_ejecucion_contramedida():
    """
    Registra e incrementa de manera síncrona el contador de ataques mitigados 
    o técnicas de envenenamiento de datos ejecutadas contra apps fraudulentas.
    """
    contador_contramedidas["ejecuciones_totales"] += 1
    return {
        "status": "success", 
        "total_ejecuciones": contador_contramedidas["ejecuciones_totales"]
    }

@router.get("/telemetria", response_model=dict)
def obtener_telemetria_defensa():
    """
    Retorna las métricas globales de contramedidas activas en AegisShield.
    """
    return contador_contramedidas