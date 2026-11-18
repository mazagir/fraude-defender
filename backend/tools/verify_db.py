import os
import sys
from sqlalchemy import create_engine, text

# Agregar el directorio raíz del backend al path para poder importar módulos si fuera necesario
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

def test_connection():
    provider = os.getenv("DB_PROVIDER", "direct").lower()
    
    if provider == "supabase":
        db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
    elif provider == "neon":
        db_url = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
    elif provider == "sqlite":
        db_url = "sqlite:///./aegis_shield.db"
    else:
        db_url = os.getenv("DATABASE_URL")

    # Fallback por defecto a SQLite
    if not db_url:
        db_url = "sqlite:///./aegis_shield.db"

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # Enmascarar contraseña para mostrar en consola de forma segura
    masked_url = db_url
    if "@" in db_url:
        parts = db_url.split("@")
        cred_parts = parts[0].split(":")
        if len(cred_parts) > 2:
            masked_url = f"{cred_parts[0]}:***@{parts[1]}"
        else:
            masked_url = f"***@{parts[1]}"

    print(f"[INFO] Proveedor activo (DB_PROVIDER): {provider.upper()}")
    print(f"[INFO] Intentando conectar a: {masked_url}...")
    
    try:
        # Habilitar pool_pre_ping para base de datos cloud (Supabase/Neon)
        engine_args = {}
        if not db_url.startswith("sqlite"):
            engine_args["pool_pre_ping"] = True
            
        engine = create_engine(db_url, **engine_args)
        with engine.connect() as conn:
            version_query = "SELECT sqlite_version();" if db_url.startswith("sqlite") else "SELECT version();"
            res = conn.execute(text(version_query)).fetchone()
            print("[SUCCESS] Conexion exitosa a la base de datos!")
            print(f"[INFO] Version detectada: {res[0]}")
            
            # Verificar si las tablas existen
            if db_url.startswith("sqlite"):
                tables_res = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
                )).fetchall()
                schema_name = "local"
            else:
                tables_res = conn.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
                )).fetchall()
                schema_name = "esquema publico"
                
            tables = [t[0] for t in tables_res]
            print(f"[INFO] Tablas encontradas en {schema_name}: {', '.join(tables) if tables else 'Ninguna (la app las creara al iniciar)'}")
            
        return True
    except Exception as e:
        print(f"[ERROR] Al conectar a la base de datos: {e}")
        return False

if __name__ == "__main__":
    test_connection()
