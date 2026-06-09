from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, verificar_admin
from app.models.db import User
from app.models.schemas import UsuarioAdminCreate, UsuarioResponse
from app.services.auth import registrar_usuario_admin

router = APIRouter()

@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario_administrado(
    usuario_in: UsuarioAdminCreate,
    db: Session = Depends(get_db),
    _: User = Depends(verificar_admin)
):
    """Crea analistas o administradores. Solo admin."""
    return registrar_usuario_admin(usuario_in, db)

@router.get("/usuarios", response_model=List[UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: User = Depends(verificar_admin)
):
    """Lista todos los usuarios. Solo admin."""
    return db.query(User).order_by(User.created_at.desc()).all()

@router.patch("/usuarios/{user_id}/rol")
def cambiar_rol(
    user_id: int,
    rol: str,
    db: Session = Depends(get_db),
    _: User = Depends(verificar_admin)
):
    """Cambia el rol de un usuario. Solo admin."""
    if rol not in ["admin", "analista"]:
        raise HTTPException(status_code=400, detail="Rol inválido. Usa 'admin' o 'analista'.")
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    usuario.rol = rol
    db.commit()
    db.refresh(usuario)
    return {"mensaje": f"Rol actualizado a {rol}", "usuario": usuario.email}

@router.patch("/usuarios/{user_id}/estado")
def cambiar_estado(
    user_id: int,
    activo: bool,
    db: Session = Depends(get_db),
    _: User = Depends(verificar_admin)
):
    """Activa o desactiva un usuario. Solo admin."""
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    usuario.es_activo = activo
    db.commit()
    return {"mensaje": f"Usuario {'activado' if activo else 'desactivado'}", "usuario": usuario.email}

@router.delete("/usuarios/{user_id}")
def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(verificar_admin)
):
    """Elimina un usuario. Solo admin."""
    if usuario := db.query(User).filter(User.id == user_id).first():
        if usuario.email == admin.email:
            raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo.")
        db.delete(usuario)
        db.commit()
        return {"mensaje": "Usuario eliminado"}
    raise HTTPException(status_code=404, detail="Usuario no encontrado.")
