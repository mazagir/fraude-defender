from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime

class FraudReportCreate(BaseModel):
    phone_number: Optional[str] = None
    bank_account: Optional[str] = None
    domain: Optional[str] = None
    description: str
    risk_level: Optional[str] = None

class FraudReportResponse(BaseModel):
    id: int
    phone_number: Optional[str] = None
    bank_account: Optional[str] = None
    domain: Optional[str] = None
    description: str
    risk_level: str
    risk_score: Optional[int] = None
    malicious_indicators: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @validator("email")
    def dominio_email_permitido(cls, v):
        dominios_permitidos = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com"]
        dominio = v.split("@")[-1] if "@" in v else ""
        if dominio not in dominios_permitidos:
            raise ValueError("Dominio de correo no permitido. Usa Gmail, Outlook, Hotmail o Yahoo.")
        return v

class UsuarioAdminCreate(UsuarioCreate):
    rol: str = Field(default="analista", pattern="^(admin|analista)$")

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    es_activo: bool
    rol: str = "analista"
    reputation: int = 0
    badges: str = "[]"
    streak: int = 0
    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    pages: int

    class Config:
        from_attributes = True



class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioResponse

class MFASetupResponse(BaseModel):
    secret: str
    uri: str
    qr_b64: str

class MFAVerifyRequest(BaseModel):
    code: str

class MFAEnableRequest(BaseModel):
    code: str

class MFAResponse(BaseModel):
    message: str
    mfa_activo: bool

class TokenMFARequired(BaseModel):
    mfa_required: bool
    partial_token: str

class AnalysisRequest(BaseModel):
    tipo: str
    contenido: str

class DomainVerdict(BaseModel):
    es_real: Optional[bool] = None
    confianza: Optional[int] = None
    marca_imita: Optional[str] = None
    dominio_oficial: Optional[str] = None
    razones: Optional[List[str]] = None
    score: Optional[int] = None

class AnalysisResponse(BaseModel):
    score: int
    level: str
    explanation: str
    recommendations: List[str] = []
    indicators: List[str] = []
    posible_fraude: bool = False
    tipo_fraude_probable: Optional[str] = None
    veredicto_dominio: Optional[DomainVerdict] = None

class ScanHistoryCreate(BaseModel):
    scan_type: str
    content: str
    score: int
    level: str
    explanation: Optional[str] = None
    recommendations: Optional[str] = None
    indicators: Optional[str] = None

class ScanHistoryResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    scan_type: str
    content: str
    score: int
    level: str
    explanation: Optional[str] = None
    recommendations: Optional[str] = None
    indicators: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GamificationUpdate(BaseModel):
    reputation: Optional[int] = None
    badges: Optional[str] = None
    streak: Optional[int] = None
    last_scan_date: Optional[str] = None

class GamificationResponse(BaseModel):
    reputation: int
    badges: str
    streak: int
    last_scan_date: Optional[str] = None

