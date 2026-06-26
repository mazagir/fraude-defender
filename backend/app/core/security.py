from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hashear_password(password: str) -> str:
    return pwd_context.hash(password)

def crear_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None, expires_minutes: Optional[int] = None) -> str:
    """Crea un JWT de acceso de vida corta firmado con el secreto de entorno."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    delta = expires_delta or (timedelta(minutes=expires_minutes) if expires_minutes else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    expire = now + delta
    to_encode.update({"exp": expire, "iat": now, "typ": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verificar_token(token: str) -> Optional[dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if not payload.get("sub"):
            return None
        return payload
    except JWTError:
        return None

def decodificar_token_acceso(token: str) -> dict[str, Any]:
    """Decodifica y valida firma, algoritmo y expiracion del JWT."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise ValueError("Token JWT invalido o expirado.") from exc

    if payload.get("typ") != "access":
        raise ValueError("Tipo de token JWT no permitido.")
    if not payload.get("sub"):
        raise ValueError("Token JWT sin sujeto autenticable.")
    return payload
