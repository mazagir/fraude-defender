from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Resolver base de datos activa según el proveedor configurado
provider = settings.DB_PROVIDER

if provider == "supabase":
    DATABASE_URL = settings.SUPABASE_DATABASE_URL or settings.DATABASE_URL
elif provider == "neon":
    DATABASE_URL = settings.NEON_DATABASE_URL or settings.DATABASE_URL
elif provider == "sqlite":
    DATABASE_URL = "sqlite:///./aegis_shield.db"
else:
    DATABASE_URL = settings.DATABASE_URL

# Fallback en caso de cadena de conexión vacía
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./aegis_shield.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Habilitar pool_pre_ping para mayor resiliencia en base de datos cloud (Supabase/Neon)
engine_args = {"connect_args": connect_args}
if not DATABASE_URL.startswith("sqlite"):
    engine_args["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
