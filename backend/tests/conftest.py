"""Configuración de entorno compartida por toda la suite de pruebas.

pytest importa conftest.py antes que los módulos de test, así que las variables
de prueba quedan definidas antes de que app.core.config cargue el .env local.
Sin esto, el resultado dependía del orden de importación de los archivos.
"""
import os

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

os.environ["DB_PROVIDER"] = "direct"
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_BASE_DIR, 'test_suite.db')}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-para-pruebas-unitarias-32chars!!"
os.environ["ALLOWED_API_KEYS"] = "aegis_test_api_key_2026"
os.environ["ENVIRONMENT"] = "testing"
os.environ.pop("TWILIO_AUTH_TOKEN", None)
