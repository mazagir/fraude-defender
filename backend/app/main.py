import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# ─── Logging estructurado ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("agielshield")

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
# Usa la IP del cliente como clave de identificación.
# Los límites son configurables via variable de entorno RATELIMIT_* en el futuro.
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# Importar infraestructura y base de datos
from app.core.config import settings
from app.core.database import engine, Base
from app.core.security import hashear_password
from app.models.db import FraudReport, User, ScanHistory, AuditLog


def _run_migrations() -> None:
    """Migración automática de columnas nuevas al arrancar."""
    try:
        with engine.connect() as conn:
            db_is_sqlite = "sqlite" in str(engine.url)
            if db_is_sqlite:
                res = conn.execute(text("PRAGMA table_info(fraud_reports)")).fetchall()
                columns = [row[1] for row in res]
                if "risk_score" not in columns:
                    conn.execute(text("ALTER TABLE fraud_reports ADD COLUMN risk_score INTEGER DEFAULT 0"))
                if "malicious_indicators" not in columns:
                    conn.execute(text("ALTER TABLE fraud_reports ADD COLUMN malicious_indicators TEXT DEFAULT ''"))
                res_users = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                columns_users = [row[1] for row in res_users]
                if "rol" not in columns_users:
                    conn.execute(text("ALTER TABLE users ADD COLUMN rol VARCHAR DEFAULT 'analista'"))
            else:
                conn.execute(text("ALTER TABLE fraud_reports ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0"))
                conn.execute(text("ALTER TABLE fraud_reports ADD COLUMN IF NOT EXISTS malicious_indicators TEXT DEFAULT ''"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS rol VARCHAR DEFAULT 'analista'"))
            conn.commit()
            logger.info("Migración de columnas ejecutada correctamente.")
    except Exception as e:
        logger.error(f"Error en migración de columnas: {e}")


def _check_production_safety() -> None:
    """Verifica configuraciones críticas de seguridad para producción."""
    if settings.ENVIRONMENT == "production":
        db_url = str(engine.url)
        if "sqlite" in db_url:
            logger.warning(
                "WARNING DE PRODUCCIÓN: Se detectó SQLite como base de datos de producción. "
                "SQLite no es adecuado para producción ya que no persiste la información entre despliegues. "
                "Configura DATABASE_URL o DB_PROVIDER con una URL de PostgreSQL activa (por ejemplo, Supabase o Neon)."
            )


def _hash_admin_password() -> str | None:
    """Hash de la contraseña del SUPER_ADMIN, provisto por el entorno.

    No existe contraseña por defecto: si el entorno no define
    ADMIN_PASSWORD_HASH ni ADMIN_PASSWORD_RAW, el sembrado se omite y se
    registra una advertencia. Así el repositorio nunca contiene credenciales.
    """
    if settings.ADMIN_PASSWORD_HASH:
        return settings.ADMIN_PASSWORD_HASH
    if settings.ADMIN_PASSWORD_RAW:
        from app.core.security import hashear_password
        return hashear_password(settings.ADMIN_PASSWORD_RAW)
    return None


def _seed_super_admin() -> None:
    """Crea la cuenta SUPER_ADMIN si no existe. Usa hash de env o fallback."""
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        pw_hash = _hash_admin_password()
        if not pw_hash:
            logger.warning(
                "SUPER_ADMIN no sembrado: defina ADMIN_PASSWORD_HASH o "
                "ADMIN_PASSWORD_RAW en el entorno."
            )
            return
        admin_email = f"{settings.ADMIN_USER}@agielshield.admin"
        existing = db.query(User).filter(User.email == admin_email).first()
        if not existing:
            admin = User(
                nombre="SUPER_ADMIN",
                email=admin_email,
                hashed_password=pw_hash,
                rol="super_admin",
                es_activo=True,
            )
            db.add(admin)
            db.commit()
            logger.info(f"SUPER_ADMIN creado: {admin_email}")
        else:
            # No sobrescribir el hash de una cuenta existente: varios despliegues
            # (local y Render) comparten la misma base de datos y cada uno con una
            # versión distinta del hash se pisarían entre sí en cada arranque.
            # La rotación de credenciales se hace de forma explícita con seed_admin.py.
            cambiado = False
            if existing.rol != "super_admin":
                existing.rol = "super_admin"
                cambiado = True
            if not existing.es_activo:
                existing.es_activo = True
                cambiado = True
            if existing.nombre != "SUPER_ADMIN":
                existing.nombre = "SUPER_ADMIN"
                cambiado = True
            if cambiado:
                db.commit()
                logger.info(f"SUPER_ADMIN actualizado: {admin_email}")
    except Exception as e:
        logger.error(f"Error al crear SUPER_ADMIN: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: startup y shutdown."""
    # ── STARTUP ──────────────────────────────────────────────────────────────
    logger.info(f"Iniciando {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    Base.metadata.create_all(bind=engine)
    logger.info("Tablas de base de datos inicializadas.")
    _run_migrations()
    _check_production_safety()
    _seed_super_admin()
    logger.info("AgielShield listo para recibir peticiones.")
    yield
    # ── SHUTDOWN ─────────────────────────────────────────────────────────────
    logger.info("AgielShield detenido.")


# Importar enrutadores
from app.api.v1.router import api_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.reports import router as reports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    redirect_slashes=False,
    lifespan=lifespan,
    description="""
## 🛡 AgielShield: Plataforma Avanzada de Inteligencia contra Fraudes

AgielShield es una solución empresarial de ciberseguridad diseñada para:

- **Monitoreo de Indicadores de Compromiso (IoCs)**: Rastreo y registro de números de teléfono, dominios y cuentas bancarias fraudulentas.
- **Motor de Riesgo Dinámico**: Clasificación y puntuación automática de amenazas mediante análisis heurístico de patrones.
- **Defensa Activa (Decoys)**: Telemetría de contramedidas y soporte para técnicas de envenenamiento de bases de datos contra ciberdelincuentes (p. ej. \"montadeudas\").
- **Seguridad Corporativa**: Soporte para JWT de sesión y claves API (API Keys) para flujos integrados automatizados.

### 🔐 Estándares de Seguridad
Basado en las recomendaciones del **OWASP Top 10** y el marco de ciberseguridad del **NIST**.
""",
    docs_url=None,
    redoc_url=None
)

# ─── Registrar Rate Limiter ───────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ALLOW_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── SECURITY HEADERS MIDDLEWARE ──────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Añade headers de seguridad HTTP a todas las respuestas."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # En producción con HTTPS, descomentar:
    # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ─── SWAGGER PERSONALIZADO ────────────────────────────────────────────────────
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{settings.PROJECT_NAME} - API Docs",
        swagger_favicon_url="https://cdn-icons-png.flaticon.com/512/3064/3064197.png",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )


# ─── PÁGINA DE BIENVENIDA ─────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AgielShield Threat Intelligence Platform</title>
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
                .card {
                    background: rgba(17, 24, 39, 0.75);
                    backdrop-filter: blur(16px);
                    padding: 50px 40px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px var(--primary-glow);
                    max-width: 650px;
                    text-align: center;
                    z-index: 1;
                }
                .shield-icon { font-size: 64px; margin-bottom: 20px; display: inline-block; }
                h1 {
                    font-size: 42px; font-weight: 800; margin: 0;
                    background: linear-gradient(to right, #10b981, #3b82f6);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                h2 { font-size: 20px; font-weight: 400; color: var(--text-muted); margin: 8px 0 25px 0; text-transform: uppercase; letter-spacing: 2px; }
                p { color: var(--text-muted); font-size: 16px; line-height: 1.8; margin: 0 auto 30px auto; max-width: 500px; }
                .button-group { display: flex; justify-content: center; gap: 15px; }
                .btn { padding: 14px 28px; border-radius: 12px; font-weight: 600; text-decoration: none; font-size: 15px; }
                .btn-primary { background: var(--primary-color); color: #0f172a; }
                .btn-secondary { background: transparent; color: var(--text-main); border: 1px solid rgba(255,255,255,0.15); }
            </style>
        </head>
        <body>
            <div class="card">
                <span class="shield-icon">🛡️</span>
                <h1>AgielShield</h1>
                <h2>Threat Intelligence Platform</h2>
                <p>Plataforma avanzada de ciberseguridad orientada a la detección y mitigación de fraudes financieros.</p>
                <div class="button-group">
                    <a href="/docs" class="btn btn-primary">Acceder a la API</a>
                    <a href="https://github.com/mazagir/fraude-defender" target="_blank" class="btn btn-secondary">Documentación</a>
                </div>
            </div>
        </body>
    </html>
    """


# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
async def health_check():
    return {
        "status": "ok",
        "servicio": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "db_provider": settings.DB_PROVIDER,
    }


# ─── RUTAS VERSIONADAS (/api/v1/...) ─────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)

# ─── RUTAS LEGACY (backward-compat con frontend y scripts existentes) ─────────
# Mantenidas con include_in_schema=False para no contaminar el Swagger.
# NOTA: El frontend usa /auth/login y /reportes — estos alias lo soportan.
# Migración planeada: mover el frontend a /api/v1/* en la próxima iteración mayor.
app.include_router(auth_router, prefix="/auth", include_in_schema=False)
app.include_router(reports_router, prefix="/reportes", include_in_schema=False)
