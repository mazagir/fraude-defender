from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    domain = Column(String, nullable=True)
    description = Column(String, nullable=False)
    risk_level = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=True)  # Puntuación numérica (0-100)
    malicious_indicators = Column(String, nullable=True)  # Indicadores encontrados (ej: "TLD sospechoso, Duplicado")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    es_activo = Column(Boolean, default=True)
    rol = Column(String, default="analista")  # "admin" o "analista"
    mfa_secret = Column(String, nullable=True)  # TOTP secret encrypted
    mfa_activo = Column(Boolean, default=False)
    reputation = Column(Integer, default=0)
    badges = Column(String, default="[]")  # JSON array of badge keys
    streak = Column(Integer, default=0)
    last_scan_date = Column(String, nullable=True)  # ISO date of last scan
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    scan_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    score = Column(Integer, nullable=False)
    level = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    indicators = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_email = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())