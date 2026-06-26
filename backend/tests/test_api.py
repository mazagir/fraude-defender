import os
import sys

# Asegurar que el directorio de la aplicación (padre) está en el PATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Usar una base de datos SQLite de pruebas limpia
TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_aegis_shield.db"))
TEST_DB_URL = TEST_DB_PATH.replace(os.sep, "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_URL}"
# Definir una API Key autorizada en los settings
os.environ["ALLOWED_API_KEYS"] = "aegis_test_api_key_2026"

try:
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.database import Base, engine
except ImportError as e:
    print(f"[ERROR] Error al importar dependencias del backend: {e}")
    print("Por favor, asegúrate de que tienes instalados los paquetes de requirements.txt.")
    sys.exit(1)

# Asegurar que se limpien las tablas anteriores de prueba
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_tests():
    print("====================================================")
    print("       SUITE DE PRUEBAS DE AEGIS SHIELD (API)       ")
    print("====================================================")
    
    # 1. Verificar página de inicio
    print("[WAIT] Verificando página de inicio (/) ...")
    r = client.get("/")
    assert r.status_code == 200
    assert "AegisShield" in r.text
    print("[OK] Página de inicio correcta.")
    
    # 2. Verificar Swagger UI personalizada
    print("[WAIT] Verificando Swagger UI (/docs) ...")
    r = client.get("/docs")
    assert r.status_code == 200
    assert "swagger-ui" in r.text or "swagger" in r.text.lower()
    print("[OK] Docs de Swagger disponibles.")
    
    # 3. Registrar un usuario
    print("[WAIT] Registrando usuario nuevo (/api/v1/auth/registro) ...")
    usuario_data = {
        "nombre": "Analista de Pruebas",
        "email": "test@aegisshield.com",
        "password": "supersecretpassword123"
    }
    r = client.post("/api/v1/auth/registro", json=usuario_data)
    assert r.status_code == 201
    usuario_res = r.json()
    assert usuario_res["nombre"] == usuario_data["nombre"]
    assert usuario_res["email"] == usuario_data["email"]
    assert "id" in usuario_res
    print("[OK] Usuario registrado exitosamente.")
    
    # 4. Intentar registrar el mismo usuario (debe fallar)
    print("[WAIT] Verificando restricción de duplicados en registro ...")
    r = client.post("/api/v1/auth/registro", json=usuario_data)
    assert r.status_code == 400
    assert "registrado" in r.json()["detail"]
    print("[OK] Registro duplicado bloqueado correctamente.")
    
    # 5. Iniciar sesión (Login)
    print("[WAIT] Iniciando sesión (/api/v1/auth/login) ...")
    login_data = {
        "username": "test@aegisshield.com",
        "password": "supersecretpassword123"
    }
    r = client.post("/api/v1/auth/login", data=login_data)
    assert r.status_code == 200
    token_res = r.json()
    assert "access_token" in token_res
    assert token_res["token_type"] == "bearer"
    token = token_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Sesión iniciada y JWT generado.")
    
    # 6. Obtener perfil del usuario actual (Me)
    print("[WAIT] Consultando perfil de usuario (/api/v1/auth/me) ...")
    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200
    me_res = r.json()
    assert me_res["email"] == "test@aegisshield.com"
    print("[OK] Perfil recuperado correctamente mediante JWT.")
    
    # 7. Crear un reporte de fraude (con análisis de riesgo automático del motor)
    print("[WAIT] Creando un reporte de fraude (/api/v1/reportes) ...")
    reporte_data = {
        "phone_number": "+573001234567",
        "bank_account": "9876543210-Bancolombia",
        "domain": "financiera-rapida-montadeudas.xyz",  # .xyz es sospechoso
        "description": "Me amenazan con llamadas constantes y cobros abusivos de intereses.", # keywords sospechosas
        "risk_level": "MEDIUM"  # Nivel especificado por el cliente
    }
    r = client.post("/api/v1/reportes", json=reporte_data, headers=headers)
    assert r.status_code == 201
    reporte_res = r.json()
    reporte_id = reporte_res["id"]
    assert reporte_res["phone_number"] == reporte_data["phone_number"]
    # Validar el motor de riesgo dinámico (debió calcular un score y clasificar como CRITICAL)
    assert reporte_res["risk_score"] is not None
    assert reporte_res["risk_score"] > 50
    assert "TLD altamente sospechoso" in reporte_res["malicious_indicators"]
    print(f"[OK] Reporte creado exitosamente. ID: {reporte_id}. Score: {reporte_res['risk_score']}. Indicadores: {reporte_res['malicious_indicators']}")
    
    # 8. Listar reportes
    print("[WAIT] Consultando lista de reportes (/api/v1/reportes) ...")
    r = client.get("/api/v1/reportes", headers=headers)
    assert r.status_code == 200
    listado = r.json()
    items = listado if isinstance(listado, list) else listado.get("items", [])
    assert len(items) >= 1
    assert items[0]["id"] == reporte_id
    print("[OK] Listado de reportes correcto.")
    
    # 9. Probar API Key (X-API-KEY) - Acceso dual B2B
    print("[WAIT] Probando autenticación por API Key (B2B) en GET /api/v1/reportes ...")
    api_key_headers = {"X-API-KEY": "aegis_test_api_key_2026"}
    r = client.get("/api/v1/reportes", headers=api_key_headers)
    assert r.status_code == 200
    print("[OK] Acceso dual con API Key validado exitosamente.")
    
    # 10. Probar API Key inválida
    print("[WAIT] Probando API Key inválida ...")
    bad_api_key_headers = {"X-API-KEY": "bad_key_value_999"}
    r = client.get("/api/v1/reportes", headers=bad_api_key_headers)
    assert r.status_code == 403
    print("[OK] Acceso con API Key inválida bloqueado con 403.")
    
    # 11. Ejecución de contramedidas (público)
    print("[WAIT] Registrando contramedida (/api/v1/reportes/contramedida) ...")
    r = client.post("/api/v1/reportes/contramedida")
    assert r.status_code == 201
    assert r.json()["total_ejecuciones"] == 1
    print("[OK] Contramedida registrada con éxito.")
    
    # 12. Métricas de contramedidas
    print("[WAIT] Consultando telemetría (/api/v1/reportes/metricas/contramedidas) ...")
    r = client.get("/api/v1/reportes/metricas/contramedidas")
    assert r.status_code == 200
    assert r.json()["ejecuciones_totales"] == 1
    print("[OK] Telemetría leída con éxito.")
    
    # 13. Rutas Legacy (Compatibilidad retroactiva)
    print("[WAIT] Validando compatibilidad retroactiva de rutas antiguas (/auth/me) ...")
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "test@aegisshield.com"
    print("[OK] Ruta legacy /auth/me operativa.")
    
    print("[WAIT] Validando compatibilidad retroactiva de rutas antiguas (GET /reportes) ...")
    r = client.get("/reportes", headers=headers)
    assert r.status_code == 200
    data = r.json()
    items = data if isinstance(data, list) else data.get("items", [])
    assert len(items) >= 1
    print("[OK] Ruta legacy GET /reportes operativa.")
    
    # 14. Eliminar el reporte creado
    print("[WAIT] Eliminando reporte (/api/v1/reportes/{id}) ...")
    r = client.delete(f"/api/v1/reportes/{reporte_id}", headers=headers)
    assert r.status_code == 204
    print("[OK] Reporte eliminado exitosamente.")
    
    print("\n[OK] TODAS LAS PRUEBAS COMPLETADAS CON EXITO! LA ARQUITECTURA ES FUNCIONAL Y RETROCOMPATIBLE.\n")
    
if __name__ == "__main__":
    try:
        run_tests()
    finally:
        # Eliminar base de datos de prueba
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass
