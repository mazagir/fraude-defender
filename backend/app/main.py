from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, Base, SessionLocal
from app.models import FraudReport, User
from app.schemas import FraudReportCreate, FraudReportResponse, UsuarioCreate, UsuarioResponse, Token
from app.auth import (
    get_db, get_usuario_actual, hashear_password,
    verificar_password, crear_token
)

Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas correctamente")

app = FastAPI(
    title="Fraude Defender API",
    description="API de Inteligencia y mitigación contra fraude de aplicaciones de préstamos (Montadeudas).",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

contador_contramedidas = {"ejecuciones_totales": 0}

# ─── AUTH ─────────────────────────────────────────────────────

@app.post("/auth/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(User).filter(User.email == usuario_in.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado.")
    nuevo = User(
        nombre=usuario_in.nombre,
        email=usuario_in.email,
        hashed_password=hashear_password(usuario_in.password)
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(User).filter(User.email == form_data.username).first()
    if not usuario or not verificar_password(form_data.password, usuario.hashed_password):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    token = crear_token({"sub": usuario.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario
    }

@app.get("/auth/me", response_model=UsuarioResponse)
def obtener_perfil(usuario_actual: User = Depends(get_usuario_actual)):
    return usuario_actual

# ─── REPORTES ─────────────────────────────────────────────────

@app.get("/reportes", response_model=List[FraudReportResponse], status_code=status.HTTP_200_OK)
def listar_reportes(db: Session = Depends(get_db), _: User = Depends(get_usuario_actual)):
    return db.query(FraudReport).order_by(FraudReport.created_at.desc()).all()

@app.post("/reportes", response_model=FraudReportResponse, status_code=status.HTTP_201_CREATED)
def crear_reporte(reporte_in: FraudReportCreate, db: Session = Depends(get_db), _: User = Depends(get_usuario_actual)):
    if not reporte_in.phone_number and not reporte_in.bank_account and not reporte_in.domain:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un Indicador de Compromiso.")
    nuevo = FraudReport(
        phone_number=reporte_in.phone_number,
        bank_account=reporte_in.bank_account,
        domain=reporte_in.domain,
        description=reporte_in.description,
        risk_level=reporte_in.risk_level
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.delete("/reportes/{reporte_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_reporte(reporte_id: int, db: Session = Depends(get_db), _: User = Depends(get_usuario_actual)):
    reporte = db.query(FraudReport).filter(FraudReport.id == reporte_id).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    db.delete(reporte)
    db.commit()

# ─── CONTRAMEDIDAS ────────────────────────────────────────────

@app.post("/reportes/contramedida", status_code=status.HTTP_201_CREATED)
def registrar_ejecucion_contramedida():
    contador_contramedidas["ejecuciones_totales"] += 1
    return {"status": "success", "total_ejecuciones": contador_contramedidas["ejecuciones_totales"]}

@app.get("/reportes/metricas/contramedidas")
def obtener_telemetria_defensa():
    return contador_contramedidas