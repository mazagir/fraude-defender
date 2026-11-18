import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_usuario_actual
from app.models.db import User
from app.models.schemas import GamificationUpdate, GamificationResponse

router = APIRouter()


@router.get("", response_model=GamificationResponse)
def get_gamification(
    usuario_actual: User = Depends(get_usuario_actual),
):
    return GamificationResponse(
        reputation=usuario_actual.reputation or 0,
        badges=usuario_actual.badges or "[]",
        streak=usuario_actual.streak or 0,
        last_scan_date=usuario_actual.last_scan_date,
    )


@router.put("", response_model=GamificationResponse)
def update_gamification(
    data: GamificationUpdate,
    usuario_actual: User = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    if data.reputation is not None:
        usuario_actual.reputation = data.reputation
    if data.badges is not None:
        usuario_actual.badges = data.badges
    if data.streak is not None:
        usuario_actual.streak = data.streak
    if data.last_scan_date is not None:
        usuario_actual.last_scan_date = data.last_scan_date
    db.commit()
    db.refresh(usuario_actual)
    return GamificationResponse(
        reputation=usuario_actual.reputation or 0,
        badges=usuario_actual.badges or "[]",
        streak=usuario_actual.streak or 0,
        last_scan_date=usuario_actual.last_scan_date,
    )
