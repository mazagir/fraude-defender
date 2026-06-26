import json
import logging
from typing import List
from sqlalchemy.orm import Session
from app.models.db import ScanHistory
from app.models.schemas import ScanHistoryCreate

logger = logging.getLogger("aegisshield.scan_history")

def listar_historial(user_id: int, db: Session, limit: int = 50) -> List[ScanHistory]:
    return (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == user_id)
        .order_by(ScanHistory.created_at.desc())
        .limit(limit)
        .all()
    )

def guardar_scan(user_id: int, scan_in: ScanHistoryCreate, db: Session) -> ScanHistory:
    registro = ScanHistory(
        user_id=user_id,
        scan_type=scan_in.scan_type,
        content=scan_in.content,
        score=scan_in.score,
        level=scan_in.level,
        explanation=scan_in.explanation,
        recommendations=scan_in.recommendations,
        indicators=scan_in.indicators,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    logger.info(f"[SCAN_GUARDADO] user_id={user_id} tipo={scan_in.scan_type} score={scan_in.score}")
    return registro

def eliminar_scan(scan_id: int, user_id: int, db: Session) -> None:
    registro = db.query(ScanHistory).filter(ScanHistory.id == scan_id, ScanHistory.user_id == user_id).first()
    if not registro:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan no encontrado.")
    db.delete(registro)
    db.commit()
    logger.info(f"[SCAN_ELIMINADO] scan_id={scan_id} user_id={user_id}")
