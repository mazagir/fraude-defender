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

def test_analizar_detalle_posible_fraude():
    """La respuesta del analizador debe exponer posible_fraude y tipo_fraude_probable."""
    response = client.post(
        "/api/v1/reportes/analizar",
        json={"tipo": "whatsapp", "contenido": "Hola, soy tu banco, confirma tu OTP urgente o bloqueamos tu cuenta."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "posible_fraude" in data
    assert "tipo_fraude_probable" in data
    # Debe detectar la solicitud de OTP como posible fraude phishing
    assert data["score"] >= 30

def test_analizar_dominio_legitimo():
    """Un dominio oficial de un banco debe marcarse como real."""
    response = client.post(
        "/api/v1/reportes/analizar",
        json={"tipo": "url", "contenido": "https://www.bancolombia.com/personal"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["veredicto_dominio"]["es_real"] is True
    assert data["veredicto_dominio"]["marca_imita"] is None

def test_analizar_dominio_typosquatting():
    """Un dominio que imita a una marca legítima debe marcarse como fraude."""
    response = client.post(
        "/api/v1/reportes/analizar",
        json={"tipo": "url", "contenido": "https://necyi-app.com/login"}
    )
    assert response.status_code == 200
    data = response.json()
    vd = data["veredicto_dominio"]
    assert vd["es_real"] is False
    assert vd["marca_imita"] is not None
    assert vd["score"] >= 50

def test_analizar_dominio_publico_no_falso_positivo():
    """Un dominio público popular no debe marcarse como fake/typosquat."""
    response = client.post(
        "/api/v1/reportes/analizar",
        json={"tipo": "url", "contenido": "https://www.google.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["veredicto_dominio"]["es_real"] is not False

