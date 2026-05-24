from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app.models.db import FraudReport
from app.models.schemas import FraudReportCreate
from app.services.risk_engine import analizar_riesgo

# Contador de telemetría de contramedidas en memoria (idéntico al comportamiento original)
contador_contramedidas = {"ejecuciones_totales": 0}

def listar_reportes(db: Session) -> List[FraudReport]:
    return db.query(FraudReport).order_by(FraudReport.created_at.desc()).all()

def crear_reporte(reporte_in: FraudReportCreate, db: Session) -> FraudReport:
    if not reporte_in.phone_number and not reporte_in.bank_account and not reporte_in.domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Debe proporcionar al menos un Indicador de Compromiso."
        )
    
    # Ejecutar el motor de análisis de riesgo de AegisShield
    score, level, indicators = analizar_riesgo(
        db=db,
        phone_number=reporte_in.phone_number,
        bank_account=reporte_in.bank_account,
        domain=reporte_in.domain,
        description=reporte_in.description
    )
    
    # Si el cliente no especifica un nivel de riesgo válido, usamos el analizado
    risk_level = reporte_in.risk_level if reporte_in.risk_level else level
    
    nuevo = FraudReport(
        phone_number=reporte_in.phone_number,
        bank_account=reporte_in.bank_account,
        domain=reporte_in.domain,
        description=reporte_in.description,
        risk_level=risk_level,
        risk_score=score,
        malicious_indicators=", ".join(indicators) if indicators else "Ninguno"
    )
    
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def eliminar_reporte(reporte_id: int, db: Session) -> None:
    reporte = db.query(FraudReport).filter(FraudReport.id == reporte_id).first()
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Reporte no encontrado"
        )
    db.delete(reporte)
    db.commit()

def registrar_ejecucion_contramedida() -> dict:
    contador_contramedidas["ejecuciones_totales"] += 1
    return {
        "status": "success", 
        "total_ejecuciones": contador_contramedidas["ejecuciones_totales"]
    }

def obtener_telemetria_defensa() -> dict:
    return contador_contramedidas
