from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import crear_token, hashear_password, verificar_password
from app.models.db import User
from app.models.schemas import UsuarioAdminCreate, UsuarioCreate


def registrar_usuario(usuario_in: UsuarioCreate, db: Session, rol: str = "analista") -> User:
    existente = db.query(User).filter(User.email == str(usuario_in.email)).first()
    if existente:
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
    return nuevo


def registrar_usuario_admin(usuario_in: UsuarioAdminCreate, db: Session) -> User:
    return registrar_usuario(usuario_in=usuario_in, db=db, rol=usuario_in.rol)


def login_usuario(username: str, password: str, db: Session) -> dict:
    usuario = db.query(User).filter(User.email == username).first()
    if not usuario or not verificar_password(password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos.",
        )
    if not usuario.es_activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacta a un administrador.",
        )

    token = crear_token({"sub": usuario.email, "rol": usuario.rol or "analista"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario,
    }
