import os
import sys
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN CENTRALIZADA DE AEGISSHIELD
# Todas las variables de entorno se validan aquí al arrancar la aplicación.
# Si una variable obligatoria no está definida, la app FALLA DE INMEDIATO
# con un mensaje claro — nunca en silencio con un fallback inseguro.
# ─────────────────────────────────────────────────────────────────────────────

def _require_env(name: str) -> str:
    """Lee una variable de entorno obligatoria. Aborta si no está definida."""
    value = os.getenv(name)
    if not value or not value.strip():
        print(
            f"\n[FATAL] Variable de entorno obligatoria '{name}' no está configurada.\n"
            f"        Configura '{name}' en tu archivo .env o en las variables de entorno\n"
            f"        del servidor antes de iniciar AegisShield.\n",
            file=sys.stderr,
        )
        sys.exit(1)
    return value.strip()


class Settings:
    PROJECT_NAME: str = "AegisShield Threat Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # ── Seguridad JWT ──────────────────────────────────────────────────────
    # OBLIGATORIO: Debe ser una cadena aleatoria segura de al menos 32 caracteres.
    # Genera una con: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = _require_env("JWT_SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # ── WebSocket ──────────────────────────────────────────────────────────
    WS_AUTH_REQUIRED: bool = os.getenv("WS_AUTH_REQUIRED", "true").lower() in {"1", "true", "yes", "on"}

    # ── API Keys B2B ───────────────────────────────────────────────────────
    # En producción, configura ALLOWED_API_KEYS con claves reales separadas por coma.
    # Ejemplo: ALLOWED_API_KEYS=key-empresa-a,key-empresa-b
    API_KEYS: list = [
        key.strip()
        for key in os.getenv("ALLOWED_API_KEYS", "aegis_dev_api_key_2026").split(",")
        if key.strip()
    ]

    # ── Entorno ────────────────────────────────────────────────────────────
    # Valores válidos: "development", "production", "testing"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")


settings = Settings()
