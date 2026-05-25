import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Fallback local sqlite for local development/testing
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aegis_shield.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# ... (lo que ya tienes arriba en el archivo)

Base = declarative_base()

# 1. Agrega esta función que es la que está buscando tu backend:
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()