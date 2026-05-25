import requests
import random
import time
import uuid
from datetime import datetime

# --- CONFIGURACIÓN ---
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/reportes/" # Asegúrate de la barra final
USER_CREDENTIALS = {"username": "neil@mail.com", "password": "123456"}

def get_token():
    """Autentica al simulador."""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=USER_CREDENTIALS, timeout=5)
        return response.json().get("access_token") if response.status_code == 200 else None
    except:
        return None

def generate_mock_report():
    """Genera datos exactos para el esquema FraudReportCreate."""
    return {
        "phone_number": f"+573{random.randint(100000000, 999999999)}",
        "bank_account": str(uuid.uuid4())[:10],
        "domain": random.choice(["banco-seguro.com", "phishing-bank.xyz", "prestamo-rapido.top"]),
        "description": "Detección automática por sistema heurístico AegisShield",
        "risk_level": "Alto" # Opcional, el motor lo calculará si no lo envías
    }

def run_simulation():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print(f"🚀 Iniciando envío a AegisShield...")
    while True:
        report = generate_mock_report()
        response = requests.post(API_URL, json=report, headers=headers)
        
        if response.status_code == 201:
            print(f"✅ Reporte aceptado: {report['domain']}")
        else:
            print(f"⚠️ Error {response.status_code}: {response.text}")
        
        time.sleep(3)

if __name__ == "__main__":
    run_simulation()