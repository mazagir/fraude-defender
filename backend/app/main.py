from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, Base, SessionLocal
from app.models import FraudReport
from app.schemas import FraudReportCreate, FraudReportResponse

# Crear las tablas en PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fraude Defender API",
    description="API de Inteligencia y mitigación contra fraude de aplicaciones de préstamos (Montadeudas).",
    version="1.0.0"
)

# 🔒 CONTROL DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Contador en memoria para telemetría de contramedidas
contador_contramedidas = {"ejecuciones_totales": 0}

# Dependencia para obtener la sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# EndPoint: Obtener todos los reportes (GET)
@app.get("/reportes", response_model=List[FraudReportResponse], status_code=status.HTTP_200_OK)
def listar_reportes(db: Session = Depends(get_db)):
    reportes = db.query(FraudReport).order_by(FraudReport.created_at.desc()).all()
    return reportes

# EndPoint: Crear un nuevo reporte de fraude (POST)
@app.post("/reportes", response_model=FraudReportResponse, status_code=status.HTTP_201_CREATED)
def crear_reporte(reporte_in: FraudReportCreate, db: Session = Depends(get_db)):
    if not reporte_in.phone_number and not reporte_in.bank_account and not reporte_in.domain:
        raise HTTPException(
            status_code=400, 
            detail="Debe proporcionar al menos un Indicador de Compromiso (Teléfono, Cuenta o Dominio)."
        )
        
    nuevo_reporte = FraudReport(
        phone_number=reporte_in.phone_number,
        bank_account=reporte_in.bank_account,
        domain=reporte_in.domain,
        description=reporte_in.description,
        risk_level=reporte_in.risk_level
    )
    
    db.add(nuevo_reporte)
    db.commit()
    db.refresh(nuevo_reporte)
    return nuevo_reporte

# ========================================================
# ✅ NUEVO: Endpoints de Telemetría de Contramedidas
# ========================================================

@app.post("/reportes/contramedida", status_code=status.HTTP_201_CREATED)
def registrar_ejecucion_contramedida():
    """Registra que un usuario ejecutó el script de envenenamiento de datos."""
    contador_contramedidas["ejecuciones_totales"] += 1
    return {"status": "success", "total_ejecuciones": contador_contramedidas["ejecuciones_totales"]}

@app.get("/reportes/metricas/contramedidas")
def obtener_telemetria_defensa():
    """Retorna cuántas veces se ha ejecutado el script de contramedidas."""
    return contador_contramedidas