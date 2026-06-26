import os
import sys

from dotenv import load_dotenv

load_dotenv()


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value or not value.strip():
        print(
            f"\n[FATAL] Required environment variable '{name}' is not configured.\n"
            f"        Set '{name}' in your .env file or hosting provider before starting AegisShield.\n",
            file=sys.stderr,
        )
        sys.exit(1)
    return value.strip()


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _env_bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).lower() in {"1", "true", "yes", "on"}


def _load_api_keys(environment: str) -> list[str]:
    configured_keys = os.getenv("ALLOWED_API_KEYS")
    if configured_keys and configured_keys.strip():
        return _split_csv(configured_keys)

    if environment == "production":
        print(
            "\n[FATAL] Required environment variable 'ALLOWED_API_KEYS' is not configured in production.\n"
            "        Define one or more B2B API keys separated by commas.\n",
            file=sys.stderr,
        )
        sys.exit(1)

    return ["aegis_dev_api_key_2026"]


class Settings:
    PROJECT_NAME: str = "AegisShield Threat Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    SECRET_KEY: str = _require_env("JWT_SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aegis_shield.db")
    DB_PROVIDER: str = os.getenv("DB_PROVIDER", "direct").lower()
    SUPABASE_DATABASE_URL: str | None = os.getenv("SUPABASE_DATABASE_URL")
    NEON_DATABASE_URL: str | None = os.getenv("NEON_DATABASE_URL")
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    API_KEYS: list[str] = _load_api_keys(ENVIRONMENT)

    WS_AUTH_REQUIRED: bool = _env_bool("WS_AUTH_REQUIRED", "true")

    BACKEND_CORS_ORIGINS: list[str] = _split_csv(
        os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:5173,http://localhost:5174,https://fraude-defender-1176.vercel.app,https://frontend-six-lime-31.vercel.app,https://*.vercel.app",
        )
    )
    CORS_ALLOW_ORIGIN_REGEX: str | None = os.getenv("CORS_ALLOW_ORIGIN_REGEX") or r"https://.*\.vercel\.app"


settings = Settings()
