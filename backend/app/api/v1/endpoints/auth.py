from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_usuario_actual
from app.models.schemas import UsuarioCreate, UsuarioResponse, Token
from app.models.db import User
from app.services.auth import (
    registrar_usuario as service_registrar,
    login_usuario as service_login
)
from app.main import limiter

router = APIRouter()

@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # Previene registro masivo automatizado
async def registrar_usuario(request: Request, usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra un nuevo analista o usuario en la plataforma."""
    return service_registrar(usuario_in, db)

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")  # Previene ataques de fuerza bruta
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Autentica a un usuario y genera un token JWT de acceso."""
    return service_login(form_data.username, form_data.password, db)

@router.get("/me", response_model=UsuarioResponse)
def obtener_perfil(usuario_actual: User = Depends(get_usuario_actual)):
    """Obtiene el perfil del analista autenticado actualmente."""
    return usuario_actual

