import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import crear_token, hashear_password, verificar_password
from app.models.db import User
from app.models.schemas import UsuarioAdminCreate, UsuarioCreate

logger = logging.getLogger("aegisshield.auth")


def registrar_usuario(usuario_in: UsuarioCreate, db: Session, rol: str = "analista") -> User:
    existente = db.query(User).filter(User.email == str(usuario_in.email)).first()
    if existente:
        logger.warning(f"[REGISTRO_DUPLICADO] Intento de registro con email ya existente: {str(usuario_in.email)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo ya esta registrado.",
        )

    nuevo = User(
        nombre=usuario_in.nombre,
        email=str(usuario_in.email),
        hashed_password=hashear_password(usuario_in.password),
        rol=rol,
        es_activo=True,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    logger.info(f"[USUARIO_REGISTRADO] Nuevo usuario creado: {nuevo.email} | rol={rol}")
    return nuevo



def registrar_usuario_admin(usuario_in: UsuarioAdminCreate, db: Session) -> User:
    return registrar_usuario(usuario_in=usuario_in, db=db, rol=usuario_in.rol)


def login_usuario(username: str, password: str, db: Session, skip_password: bool = False) -> dict:
    usuario = db.query(User).filter(User.email == username).first()
    if not usuario:
        logger.warning(f"[LOGIN_FALLIDO] Usuario no encontrado: {username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos.",
        )
    if not skip_password:
        if not verificar_password(password, usuario.hashed_password):
            logger.warning(f"[LOGIN_FALLIDO] Credenciales inválidas para: {username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contrasena incorrectos.",
            )
    if not usuario.es_activo:
        logger.warning(f"[LOGIN_BLOQUEADO] Usuario inactivo intentó ingresar: {username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacta a un administrador.",
        )

    token = crear_token({"sub": usuario.email, "rol": usuario.rol or "analista"})
    logger.info(f"[LOGIN_OK] Sesión iniciada correctamente: {usuario.email} | rol={usuario.rol}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario,
    }

