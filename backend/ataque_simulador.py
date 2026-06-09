import requests
import json
import time
import random

# URLs del Backend (FastAPI con prefijo v1)
LOGIN_URL = "https://fraude-defender-api.onrender.com/api/v1/auth/login"  # Ajusta si tu ruta de login es diferente
REPORTES_URL = "https://fraude-defender-api.onrender.com/api/v1/reportes"

# Credenciales de analista para pruebas de estrés
USER_DATA = {
    "username": "neil@mail.com",  # Tu usuario administrador de pruebas
    "password": "123456"  # Pon la contraseña real que usas para loguearte
}

# Banco de vectores de ataque simulados
ENTIDADES = ["Nequi", "Bancolombia", "Daviplata", "Banco de Bogotá"]
DOMINIOS_PHISHING = ["https://nequi-seguridad-alerta.com", "https://bancolombia-actualiza-datos.net", "https://verificacion-co.com"]
MENSAJES_SMS = [
    "ALERTA: Intento de acceso no autorizado. Verifique su cuenta inmediatamente en: ",
    "Su crédito express ha sido aprobado. Retire los fondos completando el formulario: ",
    "NOTIFICACIÓN JUDICIAL: Registra cobro coactivo. Evite el embargo pagando aquí: "
]

def obtener_token():
    """Se autentica en el backend y extrae el Token JWT de forma segura"""
    print(f"🔑 Solicitando acceso seguro para el analista {USER_DATA['username']}...")
    try:
        # Enviar las credenciales como Form Data (requerido por OAuth2PasswordRequestForm en FastAPI)
        response = requests.post(LOGIN_URL, data=USER_DATA)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("🔓 Token JWT obtenido con éxito. Conexión cifrada autorizada.\n")
            return token
        else:
            print(f"❌ Error de autenticación: Código {response.status_code}. Verifique sus credenciales.")
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Error crítico: No se pudo conectar al módulo de autenticación de FastAPI.")
        return None

def generar_payload_ataque():
    """Genera datos de telemetría dinámica imitando el comportamiento de apps espía"""
    tipo_ataque = random.choice(["sms", "phone", "bank"])
    phone_number = f"+5731{random.randint(0,9)}{random.randint(100000, 999999)}"
    domain = None
    bank_account = None
    
    if tipo_ataque == "sms":
        domain = random.choice(DOMINIOS_PHISHING)
        description = f"Phishing activo detectado: '{random.choice(MENSAJES_SMS)}{domain}'"
        risk_level = "Alto"
    elif tipo_ataque == "phone":
        description = "Llamada coactiva registrada. El atacante usa técnicas de ingeniería social para extorsión."
        risk_level = "Medio"
    else:
        bank_account = f"{random.choice(ENTIDADES)} - Ahorros: {random.randint(10000000, 99999999)}"
        description = "Cuenta mula detectada. Utilizada para dispersión de fondos ilegales de gota a gota digital."
        risk_level = "Alto"

    return {
        "phone_number": phone_number,
        "domain": domain,
        "bank_account": bank_account,
        "description": description,
        "risk_level": risk_level
    }

def ejecutar_simulador(rafagas=5):
    print("=========================================================")
    print("🚀  SIMULADOR DE TELEMETRÍA DE AMENAZAS - FRAUDEFENDER  🚀")
    print("=========================================================\n")
    
    # 1. Autenticar y obtener cabeceras seguras
    token = obtener_token()
    if not token:
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Bucle de inyección de IoCs
    for i in range(1, rafagas + 1):
        payload = generar_payload_ataque()
        print(f"🔥 [IoC Inyectado {i}/{rafagas}] Enviando vector al motor heurístico...")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        
        try:
            # Enviamos el reporte inyectando las cabeceras con el Token JWT
            response = requests.post(REPORTES_URL, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                print(f"✅ Procesado: El backend aceptó la amenaza [{payload['risk_level']}].")
            else:
                print(f"❌ Denegado: Servidor respondió con código {response.status_code}")
        except Exception as e:
            print(f"❌ Fallo en la transmisión: {e}")
            break
            
        print("-" * 57)
        time.sleep(2.5) # Pausa estratégica para ver el cambio reflejado en el frontend
        
    print("\n🏁 Simulación completada. Base de datos estresada con éxito.")

if __name__ == "__main__":
    # Ajusta el número para mandar más o menos ráfagas de ataques simultáneos
    ejecutar_simulador(5)
