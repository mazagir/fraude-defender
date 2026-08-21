"""test_webhooks.py — Pruebas del webhook de WhatsApp (Twilio TwiML)."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_webhooks.db"))
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-para-pruebas-unitarias-32chars!!"
os.environ["ALLOWED_API_KEYS"] = "aegis_test_api_key_2026"
os.environ["ENVIRONMENT"] = "testing"
os.environ.pop("TWILIO_AUTH_TOKEN", None)

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


class TestWebhookWhatsApp:
    def test_saludo_bienvenida(self):
        resp = client.post(
            "/api/v1/webhooks/whatsapp",
            data={"From": "whatsapp:+573001234567", "Body": "hola"},
        )
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("application/xml")
        assert "<Response>" in resp.text and "<Message>" in resp.text
        assert "Bienvenido a AgiShield" in resp.text

    def test_comando_ayuda(self):
        resp = client.post(
            "/api/v1/webhooks/whatsapp",
            data={"From": "whatsapp:+573001234567", "Body": "ayuda"},
        )
        assert resp.status_code == 200
        assert "AgiShield Bot" in resp.text

    def test_analisis_mensaje_sospechoso(self):
        resp = client.post(
            "/api/v1/webhooks/whatsapp",
            data={
                "From": "whatsapp:+573001234567",
                "Body": "http://banco-seguro-verificacion.xyz/login tu cuenta fue bloqueada ingresa tu clave",
            },
        )
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("application/xml")
        assert "Análisis de riesgo" in resp.text
        assert "<Message>" in resp.text

    def test_cuerpo_vacio_devuelve_bienvenida(self):
        resp = client.post(
            "/api/v1/webhooks/whatsapp",
            data={"From": "whatsapp:+573001234567", "Body": ""},
        )
        assert resp.status_code == 200
        assert "Bienvenido a AgiShield" in resp.text

    def test_escaped_xml_en_respuesta(self):
        from app.api.v1.endpoints.webhooks import _twiml
        xml = _twiml('mensaje con <etiquetas> & "comillas" http://x.xyz/?a=1&b=2')
        assert "<Message>mensaje con &lt;etiquetas&gt; &amp; \"comillas\" http://x.xyz/?a=1&amp;b=2</Message>" in xml
        assert "<etiquetas>" not in xml

    def test_firma_invalida_rechazada_cuando_token_configurado(self, monkeypatch):
        monkeypatch.setenv("TWILIO_AUTH_TOKEN", "token_secreto_test")
        resp = client.post(
            "/api/v1/webhooks/whatsapp",
            data={"From": "whatsapp:+573001234567", "Body": "hola"},
            headers={"X-Twilio-Signature": "firma-invalida=="},
        )
        assert resp.status_code == 403
