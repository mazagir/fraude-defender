import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AegisShield Threat Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        os.getenv("SECRET_KEY", "fraude-defender-secret-key-2026-cambia-esto-en-produccion")
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    WS_AUTH_REQUIRED: bool = os.getenv("WS_AUTH_REQUIRED", "true").lower() in {"1", "true", "yes", "on"}
    
    # API Keys for B2B integration
    API_KEYS: list = [
        key.strip() 
        for key in os.getenv("ALLOWED_API_KEYS", "aegis_dev_api_key_2026").split(",") 
        if key.strip()
    ]

settings = Settings()
