from pydantic import BaseModel, EmailStr, Field
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
    password: str = Field(..., min_length=12, max_length=128)

class UsuarioAdminCreate(UsuarioCreate):
    rol: str = Field(default="analista", pattern="^(admin|analista)$")

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    es_activo: bool
    rol: str = "analista"
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

class AnalysisRequest(BaseModel):
    tipo: str
    contenido: str

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

