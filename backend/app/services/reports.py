import asyncio
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Importaciones de infraestructura y base de datos
from app.models.db import FraudReport
from app.models.schemas import FraudReportCreate
from app.services.risk_engine import analizar_riesgo
from app.services.event_bus import event_bus, build_event
from app.services.masking import enmascarar_reporte_publico

# Contador de telemetría de contramedidas en memoria
# Nota: Este contador es per-proceso. En un deploy multi-worker (e.g. Gunicorn),
# cada worker tendrá su propio contador. Para persistencia real, usar Redis o DB.
contador_contramedidas = {"ejecuciones_totales": 0}



# ─── SERVICIO: OBTENER TODOS LOS REPORTES ───────────────────────────────────
def listar_reportes(db: Session, page: int = 1, page_size: int = 50, anonimizado: bool = False) -> dict:
    """Obtiene reportes paginados ordenados del más reciente al más antiguo.

    anonimizado=True aplica enmascarado de PII (teléfonos/cuentas) para
    consumidores públicos conforme a minimización de datos personales.
    """
    query = db.query(FraudReport).order_by(FraudReport.created_at.desc())
    total = query.count()
    pages = max(1, (total + page_size - 1) // page_size)
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    if anonimizado:
        items = [enmascarar_reporte_publico(r) for r in items]
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }



# ─── SERVICIO: CREAR UN NUEVO REPORTE ────────────────────────────────────
def crear_reporte(reporte_in: FraudReportCreate, db: Session) -> FraudReport:
    """Registra un reporte de fraude con análisis de riesgo automático."""
    if not reporte_in.phone_number and not reporte_in.bank_account and not reporte_in.domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos un Indicador de Compromiso (Teléfono, Cuenta Bancaria o Dominio)."
        )

    score, level, indicators = analizar_riesgo(
        db=db,
        phone_number=reporte_in.phone_number,
        bank_account=reporte_in.bank_account,
        domain=reporte_in.domain,
        description=reporte_in.description
    )

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

    ioc_value = reporte_in.domain or reporte_in.phone_number or reporte_in.bank_account or reporte_in.description[:40]
    event_bus.publish_sync("telemetry", build_event(
        event_type="FRAUD_CLUSTER",
        severity=risk_level,
        message=f"Nuevo IoC reportado: {reporte_in.description[:80]}",
        source="ioc-ingestor",
        ioc={"type": "report", "value": ioc_value},
        risk_score=score,
    ))

    if risk_level in ("CRITICAL", "HIGH"):
        try:
            from app.services.email_service import send_report_alert
            from app.core.config import settings
            if settings.EMAIL_USER:
                from app.models.db import User
                admins = db.query(User).filter(User.rol == "super_admin", User.es_activo == True).all()
                for admin in admins:
                    send_report_alert(admin.email, risk_level, reporte_in.description, score)
        except Exception:
            pass

    return nuevo_reporte



# ─── SERVICIO: ELIMINAR UN REPORTE ───────────────────────────────────────
def eliminar_reporte(reporte_id: int, db: Session) -> None:
    """Elimina un reporte por su ID. Lanza 404 si no existe."""
    reporte = db.query(FraudReport).filter(FraudReport.id == reporte_id).first()
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado en la plataforma."
        )
    db.delete(reporte)
    db.commit()



# ─── SERVICIOS: TELEMETRÍA Y DEFENSA ACTIVA ─────────────────────────────────
def registrar_ejecucion_contramedida() -> dict:
    """Incrementa el contador de contramedidas ejecutadas."""
    contador_contramedidas["ejecuciones_totales"] += 1
    return {
        "status": "success",
        "total_ejecuciones": contador_contramedidas["ejecuciones_totales"]
    }


def obtener_telemetria_defensa() -> dict:
    """Retorna las métricas de contramedidas activas."""
    return contador_contramedidas