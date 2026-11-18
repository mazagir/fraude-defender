import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.api.deps import get_db, verificar_super_admin
from app.models.db import User, FraudReport, ScanHistory, AuditLog
from app.models.schemas import UsuarioResponse, PaginatedResponse
from app.services.auth import registrar_usuario

logger = logging.getLogger("agielshield.admin")
router = APIRouter()


def _registrar_audit(db: Session, admin_email: str, action: str, target_type: str = None, target_id: str = None, detail: str = None):
    log = AuditLog(admin_email=admin_email, action=action, target_type=target_type, target_id=target_id, detail=detail)
    db.add(log)
    db.commit()


# ─── DASHBOARD STATS ────────────────────────────────────────────────────────

@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db), admin: User = Depends(verificar_super_admin)):
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.es_activo == True).scalar()
    inactive_users = total_users - active_users
    total_analyses = db.query(func.count(ScanHistory.id)).scalar()
    total_reports = db.query(func.count(FraudReport.id)).scalar()

    scan_by_type = dict(
        db.query(ScanHistory.scan_type, func.count(ScanHistory.id))
        .group_by(ScanHistory.scan_type).all()
    )

    risk_dist = dict(
        db.query(FraudReport.risk_level, func.count(FraudReport.id))
        .group_by(FraudReport.risk_level).all()
    )

    threats_detected = db.query(func.count(FraudReport.id)).filter(
        FraudReport.risk_level.in_(["alto", "critico", "critical", "high"])
    ).scalar()

    recent_activity = []
    for s in db.query(ScanHistory).order_by(ScanHistory.created_at.desc()).limit(10).all():
        recent_activity.append({
            "type": "scan", "scan_type": s.scan_type, "content": s.content[:60],
            "score": s.score, "level": s.level, "created_at": s.created_at.isoformat() if s.created_at else None
        })
    for r in db.query(FraudReport).order_by(FraudReport.created_at.desc()).limit(10).all():
        recent_activity.append({
            "type": "report", "content": r.description[:60],
            "risk_level": r.risk_level, "created_at": r.created_at.isoformat() if r.created_at else None
        })
    recent_activity.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    recent_activity = recent_activity[:15]

    _registrar_audit(db, admin.email, "VIEW_DASHBOARD")

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "total_analyses": total_analyses,
        "total_reports": total_reports,
        "threats_detected": threats_detected,
        "scan_by_type": scan_by_type,
        "risk_distribution": risk_dist,
        "recent_activity": recent_activity,
    }


# ─── USERS ──────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    rol: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(verificar_super_admin),
):
    q = db.query(User)
    if search:
        q = q.filter(User.email.ilike(f"%{search}%") | User.nombre.ilike(f"%{search}%"))
    if rol:
        q = q.filter(User.rol == rol)
    total = q.count()
    items = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": u.id, "nombre": u.nombre, "email": u.email, "es_activo": u.es_activo, "rol": u.rol, "created_at": u.created_at.isoformat() if u.created_at else None} for u in items],
        "total": total, "page": page, "page_size": page_size, "pages": (total + page_size - 1) // page_size,
    }


@router.patch("/users/{user_id}/toggle")
def toggle_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(verificar_super_admin)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(400, "No puedes desactivarte a ti mismo")
    u.es_activo = not u.es_activo
    db.commit()
    _registrar_audit(db, admin.email, "TOGGLE_USER", "user", str(user_id), f"{'activado' if u.es_activo else 'desactivado'}")
    return {"ok": True, "es_activo": u.es_activo}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(verificar_super_admin)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(400, "No puedes eliminarte a ti mismo")
    if u.rol == "super_admin":
        raise HTTPException(400, "No se puede eliminar al SUPER_ADMIN")
    email = u.email
    db.delete(u)
    db.commit()
    _registrar_audit(db, admin.email, "DELETE_USER", "user", str(user_id), email)
    return {"ok": True, "deleted": email}


@router.post("/users", status_code=201)
def create_user(
    nombre: str, email: str, password: str, rol: str = "analista",
    db: Session = Depends(get_db), admin: User = Depends(verificar_super_admin),
):
    from app.core.security import hashear_password
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "Email ya registrado")
    u = User(nombre=nombre, email=email, hashed_password=hashear_password(password), rol=rol, es_activo=True)
    db.add(u)
    db.commit()
    db.refresh(u)
    _registrar_audit(db, admin.email, "CREATE_USER", "user", str(u.id), email)
    return {"ok": True, "user": {"id": u.id, "email": u.email, "rol": u.rol}}


# ─── SCANS ──────────────────────────────────────────────────────────────────

@router.get("/scans")
def list_scans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    scan_type: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(verificar_super_admin),
):
    q = db.query(ScanHistory)
    if scan_type:
        q = q.filter(ScanHistory.scan_type == scan_type)
    if level:
        q = q.filter(ScanHistory.level == level)
    if search:
        q = q.filter(ScanHistory.content.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(ScanHistory.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": s.id, "user_id": s.user_id, "scan_type": s.scan_type, "content": s.content[:120], "score": s.score, "level": s.level, "created_at": s.created_at.isoformat() if s.created_at else None} for s in items],
        "total": total, "page": page, "page_size": page_size, "pages": (total + page_size - 1) // page_size,
    }


# ─── REPORTS ────────────────────────────────────────────────────────────────

@router.get("/reports")
def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(verificar_super_admin),
):
    q = db.query(FraudReport)
    if risk_level:
        q = q.filter(FraudReport.risk_level == risk_level)
    if search:
        q = q.filter(FraudReport.description.ilike(f"%{search}%") | FraudReport.domain.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(FraudReport.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": r.id, "phone_number": r.phone_number, "bank_account": r.bank_account, "domain": r.domain, "description": r.description[:120], "risk_level": r.risk_level, "risk_score": r.risk_score, "created_at": r.created_at.isoformat() if r.created_at else None} for r in items],
        "total": total, "page": page, "page_size": page_size, "pages": (total + page_size - 1) // page_size,
    }


@router.delete("/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db), admin: User = Depends(verificar_super_admin)):
    r = db.query(FraudReport).filter(FraudReport.id == report_id).first()
    if not r:
        raise HTTPException(404, "Reporte no encontrado")
    db.delete(r)
    db.commit()
    _registrar_audit(db, admin.email, "DELETE_REPORT", "report", str(report_id))
    return {"ok": True}


# ─── AUDIT LOGS ─────────────────────────────────────────────────────────────

@router.get("/audit-logs")
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(verificar_super_admin),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    total = q.count()
    items = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": l.id, "admin_email": l.admin_email, "action": l.action, "target_type": l.target_type, "target_id": l.target_id, "detail": l.detail, "created_at": l.created_at.isoformat() if l.created_at else None} for l in items],
        "total": total, "page": page, "page_size": page_size, "pages": (total + page_size - 1) // page_size,
    }


# ─── SYSTEM INFO ────────────────────────────────────────────────────────────

@router.get("/system")
def system_info(db: Session = Depends(get_db), admin: User = Depends(verificar_super_admin)):
    from app.core.config import settings
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database_provider": settings.DB_PROVIDER,
        "mfa_enabled_count": db.query(func.count(User.id)).filter(User.mfa_activo == True).scalar(),
    }


# ─── LEADERBOARD (REAL) ─────────────────────────────────────────────────────

@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    """Ranking de usuarios por actividad real (análisis + reportes). Público."""
    users = db.query(User).filter(User.es_activo == True).all()
    rankings = []
    for u in users:
        scans_count = db.query(func.count(ScanHistory.id)).filter(ScanHistory.user_id == u.id).scalar()
        xp = scans_count * 10
        if xp > 0:
            level = "Guardián" if xp >= 200 else "Vigilante" if xp >= 120 else "Novato"
            rankings.append({
                "id": u.id,
                "nombre": u.nombre,
                "scans": scans_count,
                "xp": xp,
                "level": level,
            })
    rankings.sort(key=lambda x: x["xp"], reverse=True)
    return {"rankings": rankings[:20], "total_active": len(users)}
