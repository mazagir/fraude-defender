from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FraudReportCreate(BaseModel):
    phone_number: Optional[str] = None
    bank_account: Optional[str] = None
    domain: Optional[str] = None
    description: str
    risk_level: str

class FraudReportResponse(BaseModel):
    id: int
    phone_number: Optional[str]
    bank_account: Optional[str]
    domain: Optional[str]
    description: str
    risk_level: str
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

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioResponse