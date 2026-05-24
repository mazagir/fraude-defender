from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    domain = Column(String, nullable=True)
    description = Column(String, nullable=False)
    risk_level = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    es_activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())