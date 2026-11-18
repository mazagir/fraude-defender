"""test_privacidad.py — Enmascarado de PII en endpoints públicos (minimización de datos)."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_privacidad.db"))
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-para-pruebas-unitarias-32chars!!"
os.environ["ALLOWED_API_KEYS"] = "aegis_test_api_key_2026"
os.environ["ENVIRONMENT"] = "testing"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine
from app.models.db import FraudReport
from app.services.masking import enmascarar_cuenta, enmascarar_telefono

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

TELEFONO_REAL = "+573001234567"
CUENTA_REAL = "Nequi - 3001234567"


def _seed_reporte() -> None:
    import datetime
    from app.core.database import SessionLocal
    db = SessionLocal()
    db.add(FraudReport(
        phone_number=TELEFONO_REAL,
        bank_account=CUENTA_REAL,
        domain="nequi-falso.xyz",
        description="SMS de phishing contra Nequi.",
        risk_level="HIGH",
        risk_score=70,
        malicious_indicators="Demo",
        created_at=datetime.datetime.now(datetime.timezone.utc),
    ))
    db.commit()
    db.close()


class TestEnmascarado:
    def test_telefono_enmascarado(self):
        assert enmascarar_telefono(TELEFONO_REAL) == "+573*******67"
        assert enmascarar_telefono(None) is None
        assert enmascarar_telefono("12345") == "*****"

    def test_cuenta_enmascarada(self):
        resultado = enmascarar_cuenta(CUENTA_REAL)
        assert "Nequi" in resultado
        assert "3001234567" not in resultado
        assert "***" in resultado

    def test_listado_publico_enmascara(self):
        _seed_reporte()
        resp = client.get("/api/v1/reportes/publico/listar")
        assert resp.status_code == 200
        item = next(r for r in resp.json()["items"] if r["domain"] == "nequi-falso.xyz")
        assert item["phone_number"] != TELEFONO_REAL
        assert "*" in item["phone_number"]
        assert CUENTA_REAL not in item["bank_account"]

    def test_threat_intel_enmascara_iocs(self):
        resp = client.get("/api/v1/threat-intel", params={"limit": 50})
        assert resp.status_code == 200
        telefonos = [e["ioc"]["value"] for e in resp.json()["events"] if e["ioc"]["type"] == "phone_number"]
        assert all("*" in t for t in telefonos), f"IoC sin enmascarar: {telefonos}"

    def test_dominio_no_se_enmascara(self):
        """El dominio es IoC público: debe conservarse completo para bloqueo."""
        from app.services.masking import enmascarar_reporte_publico
        import datetime
        from app.core.database import SessionLocal
        db = SessionLocal()
        reporte = FraudReport(
            domain="bloqueame-xyz.com", phone_number=None, bank_account=None,
            description="Dominio de phishing.", risk_level="MEDIUM", risk_score=45,
            malicious_indicators="Demo",
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(reporte)
        db.commit()
        db.refresh(reporte)
        anonimizado = enmascarar_reporte_publico(reporte)
        db.close()
        assert anonimizado["domain"] == "bloqueame-xyz.com"
