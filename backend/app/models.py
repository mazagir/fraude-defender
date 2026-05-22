from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=True, index=True) # Indexamos para búsquedas rápidas
    bank_account = Column(String, nullable=True, index=True)  # Indexamos para búsquedas rápidas
    domain = Column(String, nullable=True, index=True)        # Indexamos para búsquedas rápidas
    
    # Cambiado a nullable=True para que no truene si el reporte es exprés
    description = Column(String, nullable=True) 
    
    # Unificado con el valor por defecto del frontend
    risk_level = Column(String, default="Medio") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())