from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_usuario_actual
from app.models.schemas import UsuarioCreate, UsuarioResponse, Token, MFAResponse, MFAVerifyRequest, MFAEnableRequest, MFASetupResponse, TokenMFARequired
from app.models.db import User
from app.services.auth import (
    registrar_usuario as service_registrar,
    login_usuario as service_login
)
from app.services.mfa import (
    setup_mfa as mfa_setup,
    enable_mfa as mfa_enable,
    disable_mfa as mfa_disable,
    login_check_mfa,
    verificar_mfa_login,
)
from app.main import limiter

router = APIRouter()

@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def registrar_usuario(request: Request, usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra un nuevo analista o usuario en la plataforma."""
    return service_registrar(usuario_in, db)

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Autentica a un usuario. Si tiene MFA, devuelve partial_token."""
    usuario = db.query(User).filter(User.email == form_data.username).first()
    if usuario:
        mfa_check = login_check_mfa(usuario)
        if mfa_check["mfa_required"]:
            return mfa_check
    return service_login(form_data.username, form_data.password, db)

@router.post("/mfa/verify-login")
async def verify_mfa_login(request: Request, body: MFAVerifyRequest, partial_token: str, db: Session = Depends(get_db)):
    """Verifica código TOTP para completar login con MFA."""
    return verificar_mfa_login(partial_token, body.code, db)

@router.post("/mfa/setup", response_model=MFASetupResponse)
def setup_mfa(usuario_actual: User = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    """Genera secret TOTP y QR para configurar MFA."""
    return mfa_setup(usuario_actual, db)

@router.post("/mfa/enable", response_model=MFAResponse)
def enable_mfa(body: MFAEnableRequest, usuario_actual: User = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    """Activa MFA verificando un código TOTP válido."""
    return mfa_enable(usuario_actual, body.code, db)

@router.post("/mfa/disable", response_model=MFAResponse)
def disable_mfa(body: MFAEnableRequest, usuario_actual: User = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    """Desactiva MFA verificando un código TOTP válido."""
    return mfa_disable(usuario_actual, body.code, db)

@router.get("/mfa/status")
def mfa_status(usuario_actual: User = Depends(get_usuario_actual)):
    """Consulta si MFA está activo para el usuario autenticado."""
    return {"mfa_activo": usuario_actual.mfa_activo}

@router.get("/me", response_model=UsuarioResponse)
def obtener_perfil(usuario_actual: User = Depends(get_usuario_actual)):
    """Obtiene el perfil del analista autenticado actualmente."""
    return usuario_actual

