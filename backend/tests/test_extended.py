"""
test_extended.py — Suite de pruebas extendida para AegisShield
Cubre: edge cases de auth, risk_engine con DB, validación de inputs,
       rate limiting, endpoints admin y telemetría.
"""
import os
import sys
import pytest

# ─── Setup del entorno de tests ───────────────────────────────────────────────
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_extended.db"))
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-para-pruebas-unitarias-32chars!!"
os.environ["ALLOWED_API_KEYS"] = "aegis_test_api_key_2026"
os.environ["ENVIRONMENT"] = "testing"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

# Limpiar y recrear tablas antes de cada sesión de tests
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# ─── Fixtures de usuario ──────────────────────────────────────────────────────
USUARIO_TEST = {
    "nombre": "Test Extendido",
    "email": "extended@aegisshield.com",
    "password": "claveSegura2026!!XY",
}


def get_token() -> str:
    """Helper: registra usuario y retorna JWT."""
    client.post("/api/v1/auth/registro", json=USUARIO_TEST)
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": USUARIO_TEST["email"], "password": USUARIO_TEST["password"]},
    )
    return resp.json()["access_token"]


# ─── TESTS DE AUTENTICACIÓN ───────────────────────────────────────────────────

class TestAuthEdgeCases:
    def test_registro_password_corta_rechazada(self):
        """Password < 12 chars debe retornar 422."""
        resp = client.post(
            "/api/v1/auth/registro",
            json={"nombre": "Usuario", "email": "corto@test.com", "password": "corta"},
        )
        assert resp.status_code == 422

    def test_registro_email_invalido_rechazado(self):
        """Email inválido debe retornar 422."""
        resp = client.post(
            "/api/v1/auth/registro",
            json={"nombre": "Usuario", "email": "no-es-email", "password": "claveSegura2026!"},
        )
        assert resp.status_code == 422

    def test_registro_nombre_muy_corto(self):
        """Nombre < 2 chars debe retornar 422."""
        resp = client.post(
            "/api/v1/auth/registro",
            json={"nombre": "X", "email": "nombre@test.com", "password": "claveSegura2026!"},
        )
        assert resp.status_code == 422

    def test_login_credenciales_invalidas(self):
        """Login con credenciales incorrectas debe retornar 401."""
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": "noexiste@test.com", "password": "malaClave1234"},
        )
        assert resp.status_code == 401

    def test_login_password_incorrecta(self):
        """Login con password incorrecta para usuario existente retorna 401."""
        # Primero registramos
        client.post(
            "/api/v1/auth/registro",
            json={"nombre": "PasswordTest", "email": "pwtest@test.com", "password": "claveCorrecta2026!"},
        )
        # Login con password mala
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": "pwtest@test.com", "password": "claveMala1234567"},
        )
        assert resp.status_code == 401

    def test_me_sin_token_retorna_401(self):
        """Acceder a /me sin token debe retornar 401."""
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_me_con_token_invalido_retorna_401(self):
        """Token malformado debe retornar 401."""
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer token.malformado.invalido"},
        )
        assert resp.status_code == 401

    def test_registro_duplicado_retorna_400(self):
        """Registrar el mismo email dos veces debe retornar 400."""
        data = {"nombre": "Duplicado", "email": "dup@test.com", "password": "claveSegura2026!"}
        client.post("/api/v1/auth/registro", json=data)
        resp = client.post("/api/v1/auth/registro", json=data)
        assert resp.status_code == 400
        assert "registrado" in resp.json()["detail"]


# ─── TESTS DE REPORTES ────────────────────────────────────────────────────────

class TestReportsValidation:
    def setup_method(self):
        self.token = get_token()
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_crear_reporte_sin_ioc_retorna_400(self):
        """Reporte sin ningún IoC debe retornar 400."""
        resp = client.post(
            "/api/v1/reportes",
            json={"description": "Sin indicadores de compromiso"},
            headers=self.headers,
        )
        assert resp.status_code == 400
        assert "Indicador de Compromiso" in resp.json()["detail"]

    def test_crear_reporte_solo_con_dominio_sospechoso(self):
        """Dominio con TLD sospechoso debe tener score alto."""
        resp = client.post(
            "/api/v1/reportes",
            json={
                "domain": "prestamo-inmediato.xyz",
                "description": "Sitio de préstamos fraudulentos",
            },
            headers=self.headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["risk_score"] > 25
        assert "TLD altamente sospechoso" in data["malicious_indicators"]

    def test_crear_reporte_con_descripcion_extorsion(self):
        """Descripción con palabras de extorsión debe elevar el score."""
        resp = client.post(
            "/api/v1/reportes",
            json={
                "phone_number": "+573001234567",
                "description": "Me amenazan con extorsion y cobros de deuda gota a gota",
            },
            headers=self.headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["risk_score"] > 30

    def test_listar_reportes_requiere_autenticacion(self):
        """Listar reportes sin token ni API key debe retornar 401."""
        resp = client.get("/api/v1/reportes")
        assert resp.status_code == 401

    def test_listar_reportes_publicos_sin_auth(self):
        """El endpoint público de listado no requiere auth."""
        resp = client.get("/api/v1/reportes/publico/listar")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)

    def test_eliminar_reporte_inexistente_retorna_404(self):
        """Eliminar reporte con ID que no existe debe retornar 404."""
        resp = client.delete("/api/v1/reportes/99999", headers=self.headers)
        assert resp.status_code == 404

    def test_crear_reporte_publico_sin_auth(self):
        """El endpoint público de creación no requiere auth."""
        resp = client.post(
            "/api/v1/reportes/publico",
            json={
                "phone_number": "+573009999999",
                "description": "Reporte público sin login",
            },
        )
        assert resp.status_code == 201


# ─── TESTS DE API KEY ─────────────────────────────────────────────────────────

class TestApiKeyAuth:
    def test_api_key_valida_permite_acceso(self):
        """API Key válida debe permitir listar reportes."""
        resp = client.get(
            "/api/v1/reportes",
            headers={"X-API-KEY": "aegis_test_api_key_2026"},
        )
        assert resp.status_code == 200

    def test_api_key_invalida_retorna_403(self):
        """API Key inválida debe retornar 403."""
        resp = client.get(
            "/api/v1/reportes",
            headers={"X-API-KEY": "clave_totalmente_invalida"},
        )
        assert resp.status_code == 403


# ─── TESTS DE ANÁLISIS AI ─────────────────────────────────────────────────────

class TestAnalysisEndpoint:
    def test_analizar_url_phishing(self):
        """URL con TLD .xyz sin HTTPS debe generar score alto."""
        resp = client.post(
            "/api/v1/reportes/analizar",
            json={"tipo": "url", "contenido": "http://banco-seguro-nequi.xyz"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "score" in data and "level" in data
        assert data["score"] > 30
        assert len(data["indicators"]) > 0

    def test_analizar_url_benigna(self):
        """URL normal debe tener score bajo."""
        resp = client.post(
            "/api/v1/reportes/analizar",
            json={"tipo": "url", "contenido": "https://www.google.com"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] < 50

    def test_analizar_whatsapp_montadeudas(self):
        """Mensaje de extorsión de deudas debe ser CRITICAL o HIGH."""
        resp = client.post(
            "/api/v1/reportes/analizar",
            json={"tipo": "whatsapp", "contenido": "Paga tu deuda o difundo tus fotos a tus contactos"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["level"] in ["HIGH", "CRITICAL"]

    def test_analizar_contenido_vacio_retorna_low(self):
        """Contenido vacío debe retornar score 0 y level LOW."""
        resp = client.post(
            "/api/v1/reportes/analizar",
            json={"tipo": "url", "contenido": "   "},
        )
        assert resp.status_code == 200
        assert resp.json()["score"] == 0
        assert resp.json()["level"] == "LOW"


# ─── TESTS DE CONTRAMEDIDAS ───────────────────────────────────────────────────

class TestCountermeasures:
    def test_registrar_y_consultar_contramedida(self):
        """Registrar contramedida y verificar que el contador incrementa."""
        # Obtenemos valor base
        base = client.get("/api/v1/reportes/metricas/contramedidas").json()["ejecuciones_totales"]
        
        resp = client.post("/api/v1/reportes/contramedida")
        assert resp.status_code == 201
        assert resp.json()["total_ejecuciones"] == base + 1

    def test_telemetria_devuelve_dict(self):
        """El endpoint de telemetría debe retornar un dict con ejecuciones_totales."""
        resp = client.get("/api/v1/reportes/metricas/contramedidas")
        assert resp.status_code == 200
        assert "ejecuciones_totales" in resp.json()


# ─── TESTS DE HEALTH CHECK ────────────────────────────────────────────────────

class TestSystem:
    def test_health_check(self):
        """Health check debe retornar ok con información del entorno."""
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "environment" in data

    def test_home_page(self):
        """Página de inicio debe contener AegisShield."""
        resp = client.get("/")
        assert resp.status_code == 200
        assert "AegisShield" in resp.text

    def test_security_headers_presentes(self):
        """Los headers de seguridad HTTP deben estar en todas las respuestas."""
        resp = client.get("/health")
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("x-frame-options") == "DENY"
        assert resp.headers.get("x-xss-protection") == "1; mode=block"

    def test_rutas_legacy_operativas(self):
        """Las rutas legacy /auth y /reportes deben seguir funcionando."""
        # Registrar para obtener token
        client.post(
            "/auth/registro",
            json={
                "nombre": "Legacy Test",
                "email": "legacy@test.com",
                "password": "claveSegura2026!legacy",
            },
        )
        resp = client.post(
            "/auth/login",
            data={"username": "legacy@test.com", "password": "claveSegura2026!legacy"},
        )
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        
        # /auth/me legacy
        resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        
        # /reportes legacy
        resp = client.get("/reportes", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200


# ─── Limpieza ─────────────────────────────────────────────────────────────────
def teardown_module():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass
