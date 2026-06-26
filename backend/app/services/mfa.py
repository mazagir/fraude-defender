import io
import base64
import logging
import pyotp
import qrcode
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.db import User
from app.core.security import crear_token, verificar_token, hashear_password, verificar_password

logger = logging.getLogger("aegisshield.mfa")

MFA_ISSUER = "AegisShield"


def generar_secret() -> str:
    return pyotp.random_base32()


def generar_qr_b64(secret: str, email: str) -> str:
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=MFA_ISSUER)
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def setup_mfa(usuario: User, db: Session) -> dict:
    if usuario.mfa_activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA ya está activo. Desactívalo antes de reconfigurar.",
        )
    secret = generar_secret()
    usuario.mfa_secret = secret
    db.commit()
    db.refresh(usuario)

    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=usuario.email, issuer_name=MFA_ISSUER
    )
    qr_b64 = generar_qr_b64(secret, usuario.email)

    logger.info(f"[MFA_SETUP] Secret generado para: {usuario.email}")
    return {"secret": secret, "uri": uri, "qr_b64": qr_b64}


def enable_mfa(usuario: User, code: str, db: Session) -> dict:
    if not usuario.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primero genera un secret con /mfa/setup.",
        )
    if not _verificar_totp(usuario.mfa_secret, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código TOTP inválido.",
        )
    usuario.mfa_activo = True
    db.commit()
    logger.info(f"[MFA_ENABLE] MFA activado para: {usuario.email}")
    return {"message": "MFA activado correctamente.", "mfa_activo": True}


def disable_mfa(usuario: User, code: str, db: Session) -> dict:
    if not usuario.mfa_activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA no está activo.",
        )
    if not _verificar_totp(usuario.mfa_secret, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código TOTP inválido.",
        )
    usuario.mfa_activo = False
    usuario.mfa_secret = None
    db.commit()
    logger.info(f"[MFA_DISABLE] MFA desactivado para: {usuario.email}")
    return {"message": "MFA desactivado correctamente.", "mfa_activo": False}


def _verificar_totp(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def requiere_mfa(usuario: User) -> bool:
    return bool(usuario.mfa_activo)


def login_check_mfa(usuario: User) -> dict:
    if usuario.mfa_activo:
        partial_token = crear_token(
            {"sub": usuario.email, "rol": usuario.rol or "analista", "mfa_pending": True},
            expires_minutes=5,
        )
        return {"mfa_required": True, "partial_token": partial_token}
    return {"mfa_required": False}


def verificar_mfa_login(partial_token: str, code: str, db: Session) -> dict:
    payload = verificar_token(partial_token)
    if not payload or not payload.get("mfa_pending"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token parcial inválido o expirado.",
        )

    email = payload.get("sub")
    usuario = db.query(User).filter(User.email == email).first()
    if not usuario or not usuario.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA no configurado para este usuario.",
        )

    if not _verificar_totp(usuario.mfa_secret, code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código TOTP inválido.",
        )

    from app.services.auth import login_usuario
    return login_usuario(usuario.email, None, db, skip_password=True)
