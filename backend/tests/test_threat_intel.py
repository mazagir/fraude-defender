import os
import sys

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_threat_intel.db"))
TEST_DB_URL = TEST_DB_PATH.replace(os.sep, "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_URL}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-para-threat-intel-32chars!!"
os.environ["ALLOWED_API_KEYS"] = "aegis_test_api_key_2026"
os.environ["ENVIRONMENT"] = "testing"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.core.database import Base, engine
from app.main import app


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_threat_intel_feed_derives_events_from_reports():
    report_payload = {
        "phone_number": "+573001234567",
        "domain": "banco-verificacion.click",
        "bank_account": "Nequi 3001234567",
        "description": "Phishing financiero solicitando OTP de Bancolombia",
    }
    created = client.post("/api/v1/reportes/publico", json=report_payload)
    assert created.status_code == 201

    response = client.get("/api/v1/threat-intel")
    assert response.status_code == 200
    data = response.json()
    assert data["kpis"]["iocs_activos"] >= 1
    assert data["kpis"]["paises_monitoreados"] >= 1
    found = any(e["ioc"]["value"] == "banco-verificacion.click" for e in data["events"])
    assert found, "El dominio 'banco-verificacion.click' deberia estar en los eventos de threat intel"
    found_category = any(
        e["ioc"]["value"] == "banco-verificacion.click" and e["category"] == "Phishing financiero"
        for e in data["events"]
    )
    assert found_category, "El evento deberia tener categoria 'Phishing financiero'"
