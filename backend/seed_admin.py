"""
Seed script: crea o actualiza la cuenta SUPER_ADMIN.

Uso:
    ADMIN_PASSWORD_RAW='<contraseña-fuerte>' python seed_admin.py

La contraseña se recibe por variable de entorno y nunca se imprime ni se
almacena en claro. También se acepta ADMIN_PASSWORD_HASH si ya se dispone
del hash bcrypt.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from passlib.context import CryptContext

from app.core.database import SessionLocal
from app.models.db import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD_RAW = os.getenv("ADMIN_PASSWORD_RAW", "")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")

if not ADMIN_PASSWORD_HASH:
    if not ADMIN_PASSWORD_RAW:
        print(
            "[ERROR] Defina ADMIN_PASSWORD_RAW o ADMIN_PASSWORD_HASH en el entorno. "
            "No existe una contraseña por defecto."
        )
        sys.exit(1)
    if len(ADMIN_PASSWORD_RAW) < 12:
        print("[ERROR] La contraseña debe tener al menos 12 caracteres.")
        sys.exit(1)
    ADMIN_PASSWORD_HASH = pwd_context.hash(ADMIN_PASSWORD_RAW)

email = f"{ADMIN_USER}@agielshield.admin"

db = SessionLocal()
try:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        existing.rol = "super_admin"
        existing.hashed_password = ADMIN_PASSWORD_HASH
        existing.es_activo = True
        existing.nombre = "SUPER_ADMIN"
        db.commit()
        print(f"SUPER_ADMIN actualizado: {email}")
    else:
        admin = User(
            nombre="SUPER_ADMIN",
            email=email,
            hashed_password=ADMIN_PASSWORD_HASH,
            rol="super_admin",
            es_activo=True,
        )
        db.add(admin)
        db.commit()
        print(f"SUPER_ADMIN creado: {email}")
    print("Contraseña almacenada únicamente como hash. No se imprime en consola.")
finally:
    db.close()
