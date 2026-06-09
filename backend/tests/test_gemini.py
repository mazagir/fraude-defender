from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analizar_url_phishing_heuristic():
    response = client.post(
        "/api/v1/reportes/analizar",
        json={"tipo": "url", "contenido": "http://verificar-banco-alerta.xyz"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "level" in data
    assert "explanation" in data
    assert "recommendations" in data
    assert "indicators" in data
    assert data["score"] > 20  # should trigger heuristic matches
    assert len(data["indicators"]) > 0

def test_analizar_whatsapp_montadeudas_heuristic():
    response = client.post(
        "/api/v1/reportes/analizar",
        json={"tipo": "whatsapp", "contenido": "Paga tu deuda inmediatamente de gota a gota o difundo tus fotos"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert data["level"] in ["HIGH", "CRITICAL"]
    assert "Montadeudas" in data["indicators"][0] or "extorsión" in data["explanation"].lower() or "cobro" in data["indicators"][0].lower()
