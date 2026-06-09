from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import decodificar_token_acceso
from app.models.db import User

# JWT scheme definition
# El tokenUrl apunta al endpoint de login versionado
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# API Key scheme definition
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

def get_db():
    """Generador de sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_usuario_actual(
    token: str = Security(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """Valida el token JWT y retorna el usuario autenticado."""
    credenciales_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autorizado. Inicia sesión para continuar.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credenciales_exception
        
    try:
        payload = decodificar_token_acceso(token)
        email: str = payload.get("sub")
        if email is None:
            raise credenciales_exception
    except ValueError:
        raise credenciales_exception

    usuario = db.query(User).filter(User.email == email).first()
    if usuario is None:
        raise credenciales_exception
    if not usuario.es_activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacta a un administrador.",
        )
    return usuario

def verificar_api_key(api_key: str = Security(api_key_header)) -> Optional[str]:
    """Verifica si la API Key proporcionada es válida."""
    if not api_key:
        return None
    if api_key in settings.API_KEYS:
        return api_key
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="API Key inválida o no autorizada."
    )

def obtener_autenticacion_dual(
    token: str = Depends(oauth2_scheme),
    api_key: str = Depends(verificar_api_key),
    db: Session = Depends(get_db)
) -> User:
    """
    Permite autenticación tanto por JWT como por API Key corporativa.
    Útil para endpoints que pueden ser consultados por integraciones automáticas.
    """
    # 1. Intentar validar por API Key primero (B2B/Scripts)
    if api_key:
        # Retornamos un usuario del sistema "B2B Client" o el primer admin/usuario del sistema
        b2b_user = db.query(User).filter(User.es_activo == True).first()
        if b2b_user:
            return b2b_user
        # Si no hay usuarios creados, creamos un mock de usuario temporal
        return User(id=0, nombre="B2B Integration Client", email="b2b@aegisshield.internal", es_activo=True)
        
    # 2. Si no hay API Key, requerimos JWT
    return get_usuario_actual(token=token, db=db)

def verificar_admin(
    usuario: User = Depends(get_usuario_actual)
) -> User:
    """Verifica que el usuario sea administrador."""
    if usuario.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de administrador."
        )
    return usuario
