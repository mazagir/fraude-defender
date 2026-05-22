from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FraudReportCreate(BaseModel):
    phone_number: Optional[str] = Field(
        None, 
        title="Número de Teléfono de Extorsión",
        description="El número de teléfono móvil o WhatsApp desde el cual el 'montadeudas' realiza el acoso.",
        example="+573219876543"
    )
    bank_account: Optional[str] = Field(
        None,
        title="Cuenta Bancaria Destino",
        description="Información financiera del recaudo fraudulento (Nequi, Daviplata, etc.).",
        example="Nequi 3219876543"
    )
    domain: Optional[str] = Field(
        None,
        title="Dominio o Nombre de la App",
        description="El enlace web (URL) de captura o el nombre comercial de la aplicación.",
        example="listocredito-app.com"
    )
    description: Optional[str] = Field(
        None,
        title="Modus Operandi / Descripción",
        description="Detalle táctico de cómo opera la amenaza o el tipo de extorsión detectado.",
        example="Sincroniza contactos y amenaza con difamar al usuario si no paga."
    )
    risk_level: str = Field(
        default="Medio",
        title="Nivel de Severidad",
        description="Clasificación del nivel de riesgo: 'Medio' o 'Critico'.",
        example="Critico"
    )

# =======================================================
# NUEVO: Esquema de salida para el GET consumido por React
# =======================================================
class FraudReportResponse(FraudReportCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # Clave para que Pydantic entienda los objetos de SQLAlchemy