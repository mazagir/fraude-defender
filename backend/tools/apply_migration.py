import os
import sys
from sqlalchemy import create_engine, text

# Agregar el directorio raíz del backend al path para poder importar módulos si fuera necesario
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

def run_migration():
    provider = os.getenv("DB_PROVIDER", "direct").lower()
    
    if provider == "supabase":
        db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
    elif provider == "neon":
        db_url = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
    elif provider == "sqlite":
        db_url = "sqlite:///./aegis_shield.db"
    else:
        db_url = os.getenv("DATABASE_URL")

    if not db_url:
        print(f"[ERROR] No se pudo resolver la cadena de conexion para el proveedor: {provider.upper()}")
        return False
        
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    sql_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migration_supabase.sql")
    if not os.path.exists(sql_file):
        print(f"[ERROR] No se encuentra el archivo SQL: {sql_file}")
        return False

    print(f"[INFO] Proveedor activo (DB_PROVIDER): {provider.upper()}")
    print(f"[INFO] Leyendo archivo de migracion: {sql_file}")
    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Separar comandos de manera simple por punto y coma (omitir lineas vacias y comentarios)
    statements = []
    current_statement = []
    for line in sql_content.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("--"):
            continue
        current_statement.append(line)
        if trimmed.endswith(";"):
            statements.append("\n".join(current_statement))
            current_statement = []
            
    if current_statement:
        statements.append("\n".join(current_statement))

    print(f"[INFO] Encontradas {len(statements)} sentencias SQL para ejecutar.")
    print("[INFO] Conectando a la base de datos...")

    try:
        # Habilitar pool_pre_ping para base de datos cloud (Supabase/Neon)
        engine_args = {}
        if not db_url.startswith("sqlite"):
            engine_args["pool_pre_ping"] = True
            
        engine = create_engine(db_url, **engine_args)
        with engine.begin() as conn:  # Abre transaccion automatica
            for i, stmt in enumerate(statements, 1):
                stmt_stripped = stmt.strip()
                if not stmt_stripped:
                    continue
                # Imprimir resumen del comando
                preview = stmt_stripped.split("\n")[0]
                if len(preview) > 80:
                    preview = preview[:77] + "..."
                print(f"[{i}/{len(statements)}] Ejecutando: {preview}")
                conn.execute(text(stmt_stripped))
                
        print(f"[SUCCESS] Migracion aplicada exitosamente en {provider.upper()}!")
        return True
    except Exception as e:
        print(f"[ERROR] Error al aplicar la migracion: {e}")
        return False

if __name__ == "__main__":
    run_migration()
