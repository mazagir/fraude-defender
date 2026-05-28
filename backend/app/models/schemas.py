from pydantic import BaseModel, EmailStr
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
    nombre: str
    email: str
    password: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    es_activo: bool
    rol: str = "analista"
    class Config:
        from_attributes = True

        
class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioResponse
