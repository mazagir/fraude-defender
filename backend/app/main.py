from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

# Importar infraestructura y base de datos
from app.core.config import settings
from app.core.database import engine, Base
from app.models.db import FraudReport, User

# Inicializar tablas de base de datos
Base.metadata.create_all(bind=engine)
print("[OK] Tablas de base de datos inicializadas correctamente.")

# Importar enrutadores
from app.api.v1.router import api_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.reports import router as reports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
## 🛡 AegisShield: Plataforma Avanzada de Inteligencia contra Fraudes

AegisShield es una solución empresarial de ciberseguridad diseñada para:

- **Monitoreo de Indicadores de Compromiso (IoCs)**: Rastreo y registro de números de teléfono, dominios y cuentas bancarias fraudulentas.
- **Motor de Riesgo Dinámico**: Clasificación y puntuación automática de amenazas mediante análisis heurístico de patrones.
- **Defensa Activa (Decoys)**: Telemetría de contramedidas y soporte para técnicas de envenenamiento de bases de datos contra ciberdelincuentes (p. ej. "montadeudas").
- **Seguridad Corporativa**: Soporte para JWT de sesión y claves API (API Keys) para flujos integrados automatizados.

### 🔐 Estándares de Seguridad
Basado en las recomendaciones del **OWASP Top 10** y el marco de ciberseguridad del **NIST**.
""",
    docs_url=None,       # Desactivamos Swagger por defecto para usar la ruta personalizada
    redoc_url=None       # Desactivamos Redoc
)

# Configuración de Middlewares (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://fraude-defender-1176.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── SWAGGER PERSONALIZADO ───────────────────────────────────
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{settings.PROJECT_NAME} - API Docs",
        swagger_favicon_url="https://cdn-icons-png.flaticon.com/512/3064/3064197.png",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# ─── PÁGINA DE BIENVENIDA (AESTHETIC) ─────────────────────────
@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AegisShield Threat Intelligence Platform</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg-gradient: linear-gradient(135deg, #090d16 0%, #111827 100%);
                    --primary-color: #10b981;
                    --primary-glow: rgba(16, 185, 129, 0.25);
                    --accent-color: #3b82f6;
                    --text-main: #f3f4f6;
                    --text-muted: #9ca3af;
                }
                body {
                    background: var(--bg-gradient);
                    color: var(--text-main);
                    font-family: 'Outfit', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    overflow: hidden;
                }
                .glow-bg {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, var(--primary-glow) 0%, rgba(0,0,0,0) 70%);
                    top: -10%;
                    left: -10%;
                    z-index: 0;
                }
                .glow-bg-secondary {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%);
                    bottom: -10%;
                    right: -10%;
                    z-index: 0;
                }
                .card {
                    background: rgba(17, 24, 39, 0.75);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    padding: 50px 40px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px var(--primary-glow);
                    max-width: 650px;
                    text-align: center;
                    z-index: 1;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 50px rgba(16, 185, 129, 0.35);
                }
                .shield-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                    display: inline-block;
                    filter: drop-shadow(0 0 15px var(--primary-color));
                    animation: pulse 2.5s infinite alternate;
                }
                h1 {
                    font-size: 42px;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(to right, #10b981, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.5px;
                }
                h2 {
                    font-size: 20px;
                    font-weight: 400;
                    color: var(--text-muted);
                    margin: 8px 0 25px 0;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                p {
                    color: var(--text-muted);
                    font-size: 16px;
                    line-height: 1.8;
                    margin: 0 auto 30px auto;
                    max-width: 500px;
                }
                .button-group {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                }
                .btn {
                    padding: 14px 28px;
                    border-radius: 12px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.25s ease;
                    font-size: 15px;
                }
                .btn-primary {
                    background: var(--primary-color);
                    color: #0f172a;
                    box-shadow: 0 4px 14px var(--primary-glow);
                }
                .btn-primary:hover {
                    background: #34d399;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                }
                .btn-secondary {
                    background: transparent;
                    color: var(--text-main);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }
                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    100% { transform: scale(1.06); }
                }
            </style>
        </head>
        <body>
            <div class="glow-bg"></div>
            <div class="glow-bg-secondary"></div>
            <div class="card">
                <span class="shield-icon">🛡️</span>
                <h1>AegisShield</h1>
                <h2>Threat Intelligence Platform</h2>
                <p>
                    Plataforma avanzada de ciberseguridad orientada a la detección y mitigación 
                    de fraudes financieros. Monitoreo automatizado de IoCs y telemetría de contramedidas activas.
                </p>
                <div class="button-group">
                    <a href="/docs" class="btn btn-primary">Acceder a la API</a>
                    <a href="https://github.com/mazagir/fraude-defender" target="_blank" class="btn btn-secondary">Documentación</a>
                </div>
            </div>
        </body>
    </html>
    """

# ─── HEALTH CHECK (KEEP-ALIVE PARA RENDER) ───────────────────
@app.get("/health", tags=["Sistema"])
async def health_check():
    """
    Endpoint de health check. Usado para mantener el servidor activo
    en Render (free tier) y para verificar el estado del servicio.
    """
    return {"status": "ok", "servicio": settings.PROJECT_NAME, "version": settings.VERSION}

# ─── MONTAJE DE RUTAS VERSIONADAS ────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)

# ─── SOPORTE DE COMPATIBILIDAD RETROACTIVA (LEGACY PATHS) ─────
# Incluimos los mismos routers en la raíz sin el prefijo /api/v1
# pero ocultos de Swagger para que la documentación permanezca limpia.
app.include_router(auth_router, prefix="/auth", include_in_schema=False)
app.include_router(reports_router, prefix="/reportes", include_in_schema=False)