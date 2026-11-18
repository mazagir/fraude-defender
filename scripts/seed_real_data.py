"""
AgielShield — Realistic LATAM Fraud Data Seeder
Run: python scripts/seed_real_data.py

Creates realistic fraud reports, users, and analyses across Latin America
to demonstrate the platform's capabilities with authentic threat data.
"""
import os
import requests
import json
import sys
import time
from datetime import datetime

BASE = "https://agishield-api.onrender.com"
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD_RAW", "")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "")
admin_token = None

if not ADMIN_EMAIL or not ADMIN_PASSWORD or not DEMO_PASSWORD:
    print("[ERROR] Defina ADMIN_EMAIL, ADMIN_PASSWORD_RAW y DEMO_PASSWORD en el entorno.")
    sys.exit(1)


def login_admin():
    global admin_token
    if not ADMIN_PASSWORD:
        print("[ERROR] Defina ADMIN_PASSWORD_RAW en el entorno para autenticarse.")
        sys.exit(1)
    r = requests.post(f"{BASE}/api/v1/auth/login",
                      data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=30)
    if r.status_code != 200:
        print(f"[ERROR] Admin login failed: {r.status_code} {r.text}")
        sys.exit(1)
    admin_token = r.json()["access_token"]
    print(f"[OK] Admin authenticated")


def headers():
    return {"Authorization": f"Bearer {admin_token}"}


def create_user(nombre, email, password):
    r = requests.post(f"{BASE}/api/v1/auth/registro",
                      json={"nombre": nombre, "email": email, "password": password},
                      timeout=30)
    if r.status_code == 201:
        print(f"  [+] User: {email} ({r.json()['rol']})")
        return r.json()
    elif r.status_code == 400 and "ya esta registrado" in r.text:
        print(f"  [=] User exists: {email}")
        return None
    else:
        print(f"  [!] Failed: {email} — {r.status_code}: {r.text[:100]}")
        return None


def login_user(email, password):
    r = requests.post(f"{BASE}/api/v1/auth/login",
                      data={"username": email, "password": password},
                      timeout=30)
    if r.status_code == 200:
        return r.json()["access_token"]
    return None


def create_report(token, report):
    r = requests.post(f"{BASE}/api/v1/reportes",
                      json=report,
                      headers={"Authorization": f"Bearer {token}"},
                      timeout=30)
    if r.status_code == 201:
        d = r.json()
        print(f"  [+] Report #{d['id']} | Score: {d['risk_score']} | Level: {d['risk_level']}")
        return d
    else:
        print(f"  [!] Report failed: {r.status_code}: {r.text[:100]}")
        return None


def run():
    print("=" * 65)
    print("  AGIELSHIELD — LATAM REALISTIC DATA SEEDER")
    print(f"  {datetime.now().isoformat()}")
    print("=" * 65)

    login_admin()

    # ── USERS ──
    print("\n[1] CREATING USERS")
    users_data = [
        ("Carlos Mendoza", "carlos@gmail.com", DEMO_PASSWORD),
        ("Maria Gonzalez", "maria@outlook.com", DEMO_PASSWORD),
        ("Juan Perez", "juan@hotmail.com", DEMO_PASSWORD),
        ("Ana Rodriguez", "ana@gmail.com", DEMO_PASSWORD),
        ("Pedro Martinez", "pedro@yahoo.com", DEMO_PASSWORD),
        ("Laura Sanchez", "laura@gmail.com", DEMO_PASSWORD),
        ("Diego Lopez", "diego@outlook.com", DEMO_PASSWORD),
        ("Camila Torres", "camila@gmail.com", DEMO_PASSWORD),
        ("Roberto Diaz", "roberto@hotmail.com", DEMO_PASSWORD),
        ("Sofia Ramirez", "sofia@gmail.com", DEMO_PASSWORD),
    ]

    created_users = []
    for nombre, email, pw in users_data:
        u = create_user(nombre, email, pw)
        time.sleep(0.3)

    # ── REALISTIC FRAUD REPORTS ──
    print("\n[2] CREATING REALISTIC FRAUD REPORTS (LATAM)")

    reports = [
        # Colombia — Montadeudas / Extorsión telefónica
        {
            "phone_number": "+573214567890",
            "bank_account": "4567-8901-2345-Davivienda",
            "domain": "cobranza-legal-rapida.xyz",
            "description": "Llaman diciendo que debo una deuda de 2 millones en Banco AV Villas. Amenazan con reportarme a Datacrédito y SAYCO. El numero no coincide con el banco. Piden transferir a una cuenta Davivienda que no es mia.",
            "risk_level": "CRITICAL"
        },
        # México — Phishing bancario
        {
            "phone_number": "+525512345678",
            "domain": "banamex-verificacion.ml",
            "description": "Recibi un SMS del Banco Citibanamex pidiendo que verifique mi cuenta por actividad sospechosa. El link lleva a un sitio que solicita mi NIP y datos completos de la tarjeta.",
            "risk_level": "CRITICAL"
        },
        # Argentina — Estafa de empleo
        {
            "phone_number": "+541156789012",
            "domain": "empleos-remotos-urgentes.com",
            "description": "Me contactaron por WhatsApp ofreciendo trabajo como asistente virtual con sueldo de $500.000 mensuales. Piden una 'garantia' de $15.000 para capacitacion. El dominio fue registrado hace 3 dias.",
            "risk_level": "HIGH"
        },
        # Brasil — Golpe do Pix
        {
            "phone_number": "+5511987654321",
            "bank_account": "12345-67 Pix Bradesco",
            "domain": "pix-troca-rapida.com.br",
            "description": "Golpe do Pix: enviam mensagem dizendo que meu Pix foi comprometido e preciso 'desbloquear' fazendo uma transferencia de teste de R$1 para uma chave Pix desconhecida.",
            "risk_level": "CRITICAL"
        },
        # Chile — Suplantación de Carabineros
        {
            "phone_number": "+56987654321",
            "domain": "seguro-policia-chile.tk",
            "description": "Llamada de supuesto Carabinero diciendo que mi RUT aparece vinculado a una investigacion por lavado de activos. Me dan un numero para 'declarar' y piden datos bancarios para 'verificar identidad'.",
            "risk_level": "CRITICAL"
        },
        # Perú — Falso sorteo de CLEAR
        {
            "phone_number": "+51987654321",
            "domain": "sorteo-clear-peru.net",
            "description": "SMS de 'CLEAR Peru' diciendo que gane S/.50,000 en un sorteo. Debo click en un enlace para reclamar el premio. El sitio pide mis datos del DNI y numero de tarjeta.",
            "risk_level": "HIGH"
        },
        # Ecuador — Estafa inmobiliaria
        {
            "phone_number": "+593991234567",
            "domain": "inmuebles-ecuador-venta.com",
            "description": "Departamento en_venta en Quito a precio muy bajo. El vendedor pide seña de $500 para reservar y no permite visitas. El dominio tiene 1 semana de registrado y las fotos son de portales inmobiliarios conocidos.",
            "risk_level": "HIGH"
        },
        # Colombia — Suplantación Daviplata
        {
            "phone_number": "+573001112233",
            "domain": "daviplata-verificar.app",
            "description": "Email fake de Daviplata pidiendo actualizar mis datos bancarios porque mi cuenta esta por vencer. El enlace lleva a un formulario que captura mi numero de cedula y clave.",
            "risk_level": "CRITICAL"
        },
        # Uruguay — Cripto estafa
        {
            "phone_number": "+59899123456",
            "domain": "bitcoin-uruguay-ganancias.com",
            "description": "Grupo de WhatsApp que promete ganancias del 500% en 30 dias con Bitcoin. Me pidieron invertir minimamente USD 200. Cuando quise retirar me dijeron que necesitaba 'pagar impuestos' primero.",
            "risk_level": "HIGH"
        },
        # Colombia — WhatsApp falso帮我
        {
            "phone_number": "+573151234567",
            "domain": "whatsapp-negocios.biz",
            "description": "Mensaje de WhatsApp de numero +57 supuestamente de Meta: 'Su cuenta sera suspendida por actividad inusual. Haga clic aqui para verificar: wa-verify.com'. Es phishing.",
            "risk_level": "CRITICAL"
        },
        # México — Suplantación SAT
        {
            "phone_number": "+525598765432",
            "domain": "sat-gobierno-mx.com",
            "description": "Email fake del SAT pidiendo actualizacion de RFC y estados de cuenta para 'evitar bloqueo fiscal'. El enlace lleva a un sitio que descarga un malware.",
            "risk_level": "CRITICAL"
        },
        # Argentina — Suplantación AFIP
        {
            "phone_number": "+541145678901",
            "domain": "afip-devolucion-ar.com",
            "description": "SMS de 'AFIP' informando que tengo una devolucion de impuestos de $87.000 pendiente. Debo ingresar al link con mi CUIL y datos bancarios para recibirla. Es phishing.",
            "risk_level": "CRITICAL"
        },
        # Brasil — Falso Empréstimo FGTS
        {
            "phone_number": "+5511912345678",
            "domain": "emprestimo-fgts-2026.com.br",
            "description": "Site falso oferecendo empréstimo do FGTS com desconto. Solicitam dados do NIS, CPF e dados bancários para 'depositar' o valor. Clássico golpe previdenciário.",
            "risk_level": "CRITICAL"
        },
        # Bolivia — Estafa token MPD
        {
            "phone_number": "+59171234567",
            "domain": "mpd-bolivia-token.gob.bo",
            "description": "Llamada supuestamente del Ministerio de Planificacion pidiendo datos de mi tarjeta Bancosol para procesar un bono de Bs. 3.000 del gobierno.",
            "risk_level": "HIGH"
        },
        # Costa Rica — Lotería Nacional falso
        {
            "phone_number": "+50687654321",
            "domain": "loteria-nacional-cr.net",
            "description": "Email de 'Loteria Nacional de Costa Rica' informando que gane ¢2.500.000. Debo pagar ¢25.000 de 'impuestos' para reclamar. Es phishing.",
            "risk_level": "HIGH"
        },
        # Guatemala — Clonación de tarjeta
        {
            "phone_number": "+50245671234",
            "domain": "banco-industrial-gt.xyz",
            "description": "Llamada de 'Banco Industrial' ofreciendo aumento de limite de tarjeta de credito. Piden los 16 digitos, fecha de vencimiento y CVV para 'procesar el aumento'.",
            "risk_level": "CRITICAL"
        },
        # Multi-country — Red de montadeudas
        {
            "phone_number": "+573209876543",
            "phone_number_secondary": "+525534567890",
            "bank_account": "8765-4321-9876-Bancolombia",
            "domain": "prestamos-montadeudas-latam.xyz",
            "description": "Red de cobranza ilegal que opera entre Colombia y Mexico. Llaman a deudores con numeros diferentes, amenazan con violencia, publican datos personales en redes sociales.",
            "risk_level": "CRITICAL"
        },
        # Paraguay — Suplantación ANDE
        {
            "phone_number": "+595981234567",
            "domain": "ande-paraguay-electricidad.com",
            "description": "SMS de 'ANDE' pidiendo pago de factura de luz con 30% de descuento. El enlace lleva a un sitio que roba datos de tarjeta y Guaraníes Virtual.",
            "risk_level": "HIGH"
        },
        # Panamá — Crypto trading falso
        {
            "phone_number": "+50761234567",
            "domain": "trading-panama-crypto.com",
            "description": "Plataforma falsa de trading crypto que promete ganancias diarias del 10%. Ya several personas de mi oficina han perdido dinero. Es esquema Ponzi clasico.",
            "risk_level": "CRITICAL"
        },
        # Dominican Republic — Suplantación BanReservas
        {
            "phone_number": "+18095671234",
            "domain": "banreservas-verificacion.net",
            "description": "Email de 'BanReservas' pidiendo actualizar datos KYC. El enlace lleva a un formulario que captura numero de cedula, tarjeta y clave de internet banking.",
            "risk_level": "CRITICAL"
        },
    ]

    # Login as different users to distribute reports
    user_emails = ["carlos@gmail.com", "maria@outlook.com", "juan@hotmail.com",
                   "ana@gmail.com", "pedro@yahoo.com", "laura@gmail.com",
                   "diego@outlook.com", "camila@gmail.com", "roberto@hotmail.com",
                   "sofia@gmail.com"]

    tokens = {}
    for email in user_emails:
        t = login_user(email, DEMO_PASSWORD)
        if t:
            tokens[email] = t

    created_reports = []
    for i, report in enumerate(reports):
        email = user_emails[i % len(user_emails)]
        token = tokens.get(email) or admin_token
        result = create_report(token, report)
        if result:
            created_reports.append(result)
        time.sleep(0.3)

    # ── SCANS / ANALYSIS ──
    print("\n[3] RUNNING ANALYSIS (5 CANALS)")

    scans = [
        {"tipo": "url", "contenido": "https://banco-secure-login-phishing.com/verificar-cuenta-urgentemente"},
        {"tipo": "sms", "contenido": "BANCOLOMBIA: Su cuenta sera bloqueada. Verifique ahora: bit.ly/3xK9zLm"},
        {"tipo": "whatsapp", "contenido": "Hola! Ganaste un premio de $50.000.000 COP en el sorteo EXITO. Reclama aqui: https://premios-exito.win/reclamar"},
        {"tipo": "correo", "contenido": "De: soporte@paypal-fake.com\nAsunto: Actividad sospechosa detectada\n\nEstimado cliente, detectamos actividad no autorizada en su cuenta. Verifique inmediatamente haciendo clic en el enlace."},
        {"tipo": "qr", "contenido": "https://qr-malicioso.com/pago?cuenta=12345&monto=500000"},
        {"tipo": "url", "contenido": "https://sorteo-falabella-chile.ml/premio?token=abc123"},
        {"tipo": "sms", "contenido": "SU CUENTA SERA BLOQUEADA en 24 horas. LLame al 0800-SCAM para evitar problemas."},
        {"tipo": "whatsapp", "contenido": "El Service Nacional de Inmigracion informa: Su pasaporte sera suspendido. Regularice: https://migracion-fake.gob.bo/verify"},
        {"tipo": "correo", "contenido": "De: noreply@banco-nacion-fake.ar\nAsunto: ACTIVIDAD SOSPECHOSA EN SU CUENTA\n\nSu cuenta ha sido comprometida. Ingrese sus credenciales para desbloquear."},
        {"tipo": "url", "contenido": "https://daviplata-actualizar.app/verificar?cedula=1234567890"},
    ]

    for i, scan in enumerate(scans):
        token = list(tokens.values())[i % len(tokens)] if tokens else admin_token
        r = requests.post(f"{BASE}/api/v1/reportes/analizar",
                          json=scan,
                          headers={"Authorization": f"Bearer {token}"},
                          timeout=30)
        if r.status_code == 200:
            d = r.json()
            print(f"  [{scan['tipo']}] Score: {d.get('score', 'N/A')} | Level: {d.get('level', 'N/A')}")
        else:
            print(f"  [{scan['tipo']}] FAILED: {r.status_code}")
        time.sleep(0.3)

    # ── SUMMARY ──
    print("\n" + "=" * 65)
    r = requests.get(f"{BASE}/api/v1/admin/dashboard", headers=headers(), timeout=15)
    if r.status_code == 200:
        d = r.json()
        print(f"  FINAL STATE:")
        print(f"    Users:   {d['total_users']}")
        print(f"    Reports: {d['total_reports']}")
        print(f"    Scans:   {d['total_analyses']}")
        print(f"    Risk:    {json.dumps(d['risk_distribution'])}")
    print("=" * 65)
    print("\n[DONE] Realistic LATAM data seeded successfully!\n")


if __name__ == "__main__":
    run()
