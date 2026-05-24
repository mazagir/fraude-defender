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

from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

app = FastAPI(
    title="FrauDefender Intelligence Platform",
    version="2.0.0",
    description="""
## 🛡 Plataforma de Inteligencia Contra Fraude

FrauDefender es una plataforma avanzada de ciberseguridad enfocada en:

- Detección de fraude financiero
- Inteligencia de amenazas
- Monitoreo de dominios maliciosos
- Análisis de riesgo automatizado
- Protección contra montadeudas y extorsión digital

### 🔐 Características
- JWT Authentication
- Threat Intelligence
- Risk Scoring
- Security Monitoring
- Real-Time Analytics

### 🧠 Estándares
Basado en prácticas OWASP y NIST.
""",
    docs_url=None,
    redoc_url=None
)

# Swagger personalizado
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title="FrauDefender Intelligence Platform",
        swagger_favicon_url="https://cdn-icons-png.flaticon.com/512/3064/3064197.png",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# Página principal
@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <html>
        <head>
            <title>FrauDefender Intelligence Platform</title>
            <style>
                body{
                    background:#0f172a;
                    color:white;
                    font-family:Arial;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    height:100vh;
                    margin:0;
                    text-align:center;
                }
                .card{
                    background:#111827;
                    padding:40px;
                    border-radius:20px;
                    box-shadow:0 0 25px rgba(34,197,94,.3);
                    max-width:700px;
                }
                h1{
                    color:#22c55e;
                    font-size:42px;
                }
                p{
                    color:#9ca3af;
                    line-height:1.7;
                }
                a{
                    display:inline-block;
                    margin-top:20px;
                    padding:12px 24px;
                    background:#22c55e;
                    color:white;
                    text-decoration:none;
                    border-radius:10px;
                    font-weight:bold;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🛡 FrauDefender</h1>
                <h2>Intelligence Platform</h2>
                <p>
                    Plataforma avanzada de inteligencia contra fraude y amenazas digitales.
                    Monitoreo de riesgos, análisis de fraude financiero y defensa cibernética.
                </p>
                <a href="/docs">Acceder a la API</a>
            </div>
        </body>
    </html>
    """
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