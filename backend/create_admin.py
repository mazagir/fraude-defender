import sys
import os
import argparse

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.db import User
from app.core.security import hashear_password

def create_admin(nombre: str, email: str, password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"El usuario con email {email} ya existe.")
            return

        new_user = User(
            nombre=nombre,
            email=email,
            hashed_password=hashear_password(password),
            rol="admin",
            es_activo=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✅ Administrador {email} creado exitosamente.")
    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crear cuenta de administrador")
    parser.add_argument("--nombre", type=str, default="Admin", help="Nombre del administrador")
    parser.add_argument("--email", type=str, required=True, help="Email del administrador")
    parser.add_argument("--password", type=str, required=True, help="Contraseña del administrador")
    
    args = parser.parse_args()
    create_admin(args.nombre, args.email, args.password)
