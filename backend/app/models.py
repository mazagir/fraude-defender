from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class FraudReport(Base):
    __tablename__ = "fraud_reports"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=True, index=True)
    bank_account = Column(String, nullable=True, index=True)
    domain = Column(String, nullable=True, index=True)
    description = Column(String, nullable=True) 
    risk_level = Column(String, default="Medio") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ESTO ES LO QUE DEBE ESTAR AL FINAL DEL ARCHIVO
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)