from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.db import User
from app.models.schemas import UsuarioCreate
from app.core.security import hashear_password, verificar_password, crear_token

def registrar_usuario(usuario_in: UsuarioCreate, db: Session) -> User:
    existente = db.query(User).filter(User.email == usuario_in.email).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Este correo ya está registrado."
        )
    nuevo = User(
        nombre=usuario_in.nombre,
        email=usuario_in.email,
        hashed_password=hashear_password(usuario_in.password)
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def login_usuario(username: str, password: str, db: Session) -> dict:
    usuario = db.query(User).filter(User.email == username).first()
    if not usuario or not verificar_password(password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Correo o contraseña incorrectos."
        )
    token = crear_token({"sub": usuario.email, "rol": usuario.rol or "analista"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario
    }
