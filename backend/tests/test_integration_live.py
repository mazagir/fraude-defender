"""
Integration tests against the live AgielShield API.
Run: python tests/test_integration_live.py
Requires internet connection. Tests real endpoints on Render.
"""
import os
import requests
import json
import sys
import time
from datetime import datetime

BASE = "https://agishield-api.onrender.com"
ADMIN_EMAIL = os.getenv("ADMIN_USER", "admin") + "@agielshield.admin"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD_RAW", "")
results = []
admin_token = None
user_token = None

REQUEST_DELAY = 3  # seconds between requests to avoid Cloudflare 429
MAX_RETRIES = 2


def test(name, method, url, headers=None, json_data=None, data=None, expected_status=None, check_fn=None):
    global results
    for attempt in range(MAX_RETRIES + 1):
        try:
            time.sleep(REQUEST_DELAY if attempt > 0 else 0)
            r = requests.request(method, url, headers=headers, json=json_data, data=data, timeout=45)
            if r.status_code == 429 and attempt < MAX_RETRIES:
                print(f"       [RETRY {attempt+1}] 429 rate limited, waiting 10s...")
                time.sleep(10)
                continue
            passed = True
            reason = ""
            if expected_status and r.status_code != expected_status:
                passed = False
                reason = f"Expected {expected_status}, got {r.status_code}: {r.text[:200]}"
            if passed and check_fn:
                try:
                    check_fn(r)
                except Exception as e:
                    passed = False
                    reason = str(e)
            status = "PASS" if passed else "FAIL"
            results.append({"name": name, "status": status, "reason": reason, "code": r.status_code})
            print(f"  [{'OK' if passed else 'XX'}] {name} [{r.status_code}]")
            return r
        except Exception as e:
            results.append({"name": name, "status": "ERROR", "reason": str(e), "code": 0})
            print(f"  [!!] {name} ERROR: {e}")
            return None

# Este módulo es un script de integración manual; pytest no debe recolectar
# esta función auxiliar como si fuera una prueba.
test.__test__ = False


def run():
    global admin_token, user_token

    print("\n" + "=" * 60)
    print("  AGIELSHIELD — INTEGRATION TESTS (PRODUCTION)")
    print(f"  {BASE}")
    print(f"  {datetime.now().isoformat()}")
    print("=" * 60)

    # ── 1. HEALTH CHECK ──
    print("\n[1] HEALTH CHECK")
    test("GET /health", "GET", f"{BASE}/health", expected_status=200,
         check_fn=lambda r: (_ for _ in ()).throw(Exception("Missing 'status' field")) if "status" not in r.json() else None)

    # ── 2. HOME PAGE ──
    print("\n[2] HOME PAGE")
    test("GET / (HTML)", "GET", f"{BASE}/", expected_status=200,
         check_fn=lambda r: (_ for _ in ()).throw(Exception("Missing AgielShield")) if "AgielShield" not in r.text else None)

    # ── 3. SWAGGER DOCS ──
    print("\n[3] SWAGGER DOCS")
    test("GET /docs", "GET", f"{BASE}/docs", expected_status=200)

    # ── 4. SUPER_ADMIN LOGIN ──
    print("\n[4] SUPER_ADMIN AUTH")
    if not ADMIN_PASSWORD:
        print("[SKIP] Defina ADMIN_PASSWORD_RAW para ejecutar la autenticación de SUPER_ADMIN.")
        r = None
    else:
        r = test("POST /api/v1/auth/login (super_admin)", "POST", f"{BASE}/api/v1/auth/login",
                 data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                 expected_status=200,
                 check_fn=lambda r: (_ for _ in ()).throw(Exception("No token")) if "access_token" not in r.json() else None)
    if r and r.status_code == 200:
        admin_token = r.json()["access_token"]
        print(f"       Token: {admin_token[:30]}...")

    admin_h = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}

    # ── 5. SUPER_ADMIN ACCESS DENIED for normal endpoints ──
    print("\n[5] SUPER_ADMIN ROLE VERIFICATION")
    test("GET /api/v1/auth/me (admin)", "GET", f"{BASE}/api/v1/auth/me", headers=admin_h, expected_status=200,
         check_fn=lambda r: (_ for _ in ()).throw(Exception("Wrong email")) if r.json().get("email") != ADMIN_EMAIL else None)
    test("GET /api/v1/auth/me (no token)", "GET", f"{BASE}/api/v1/auth/me", expected_status=401)

    # ── 6. ADMIN DASHBOARD ──
    print("\n[6] ADMIN DASHBOARD")
    r = test("GET /api/v1/admin/dashboard", "GET", f"{BASE}/api/v1/admin/dashboard", headers=admin_h, expected_status=200)
    if r and r.status_code == 200:
        d = r.json()
        print(f"       Users: {d['total_users']} | Reports: {d['total_reports']} | Scans: {d['total_analyses']}")
        print(f"       Risk: {json.dumps(d['risk_distribution'])}")

    # ── 7. ADMIN USERS ──
    print("\n[7] ADMIN USERS")
    r = test("GET /api/v1/admin/users", "GET", f"{BASE}/api/v1/admin/users?page_size=5", headers=admin_h, expected_status=200)
    if r and r.status_code == 200:
        users = r.json()
        print(f"       Total: {users['total']} users | Pages: {users['pages']}")
        for u in users["items"][:3]:
            print(f"       - {u['email']} | {u['rol']} | active={u['es_activo']}")

    # ── 8. ADMIN REPORTS ──
    print("\n[8] ADMIN REPORTS")
    r = test("GET /api/v1/admin/reports", "GET", f"{BASE}/api/v1/admin/reports?page_size=5", headers=admin_h, expected_status=200)
    if r and r.status_code == 200:
        reports = r.json()
        print(f"       Total: {reports['total']} reports")
        for rp in reports["items"][:3]:
            print(f"       - [{rp['risk_level']}] {rp['description'][:60]}...")

    # ── 9. ADMIN SCANS ──
    print("\n[9] ADMIN SCANS")
    r = test("GET /api/v1/admin/scans", "GET", f"{BASE}/api/v1/admin/scans?page_size=5", headers=admin_h, expected_status=200)
    if r and r.status_code == 200:
        scans = r.json()
        print(f"       Total: {scans['total']} scans")

    # ── 10. ADMIN AUDIT LOGS ──
    print("\n[10] ADMIN AUDIT LOGS")
    r = test("GET /api/v1/admin/audit-logs", "GET", f"{BASE}/api/v1/admin/audit-logs?page_size=5", headers=admin_h, expected_status=200)
    if r and r.status_code == 200:
        logs = r.json()
        print(f"       Total: {logs['total']} audit entries")
        for l in logs["items"][:3]:
            print(f"       - {l['action']} by {l['admin_email']}")

    # ── 11. ADMIN SYSTEM INFO ──
    print("\n[11] ADMIN SYSTEM")
    r = test("GET /api/v1/admin/system", "GET", f"{BASE}/api/v1/admin/system", headers=admin_h, expected_status=200)
    if r and r.status_code == 200:
        sys_info = r.json()
        print(f"       {sys_info['project_name']} v{sys_info['version']} | {sys_info['database_provider']}")

    # ── 12. NORMAL USER REGISTRATION ──
    print("\n[12] USER REGISTRATION")
    test_user_email = f"testintegration{int(datetime.now().timestamp())}@gmail.com"
    r = test("POST /api/v1/auth/registro", "POST", f"{BASE}/api/v1/auth/registro",
             json_data={"nombre": "Integration Test User", "email": test_user_email, "password": "${TEST_PASSWORD}"},
             expected_status=201)
    if r and r.status_code == 201:
        print(f"       Created: {test_user_email}")

    # ── 13. USER LOGIN ──
    print("\n[13] USER LOGIN")
    r = test("POST /api/v1/auth/login (user)", "POST", f"{BASE}/api/v1/auth/login",
             data={"username": test_user_email, "password": "${TEST_PASSWORD}"},
             expected_status=200)
    if r and r.status_code == 200:
        user_token = r.json()["access_token"]
        print(f"       Token: {user_token[:30]}...")

    user_h = {"Authorization": f"Bearer {user_token}"} if user_token else {}

    # ── 14. CREATE REAL FRAUD REPORT ──
    print("\n[14] CREATE FRAUD REPORT (REAL DATA)")
    real_reports = [
        {
            "phone_number": "+573154498765",
            "bank_account": "0190-8872-3345-Davivienda",
            "domain": "prestamos-urgentes-montadeudas.xyz",
            "description": "Me llaman de este numero amenazandome con meterme a central de riesgo si no pago una deuda que no contraje. Piden transferir a una cuenta Davivienda.",
            "risk_level": "HIGH"
        },
        {
            "phone_number": "+56987654321",
            "domain": "sorteo-falabella-falso.com",
            "description": "SMS de Falabella diciendo que gane un sorteo y debo click en un link para reclamar. El link pide datos de tarjeta.",
            "risk_level": "CRITICAL"
        },
        {
            "phone_number": "+541165432198",
            "domain": "banco-nacion-seguridad.tk",
            "description": "Email fake del Banco Nacion pidiendo verificar mi cuenta. El link lleva a un sitio falso que roba credenciales.",
            "risk_level": "CRITICAL"
        },
        {
            "phone_number": "+5511987654321",
            "domain": "trabajo-remoto-falso.pages.dev",
            "description": "Mensaje de WhatsApp de numero desconocido ofreciendo trabajo remoto con pago de $2000 USD diarios. Piden pago inicial de $50 USD por 'capacitacion'.",
            "risk_level": "HIGH"
        },
        {
            "phone_number": "+525512345678",
            "domain": "inversion-crypto-rapida.net",
            "description": "Me contactaron por Telegram prometiendo rendimientos del 300% en 24 horas en crypto. Parece esquema Ponzi tipico.",
            "risk_level": "MEDIUM"
        }
    ]

    created_ids = []
    for i, report in enumerate(real_reports):
        r = test(f"POST /api/v1/reportes [{i+1}/{len(real_reports)}]", "POST", f"{BASE}/api/v1/reportes",
                 json_data=report, headers=user_h, expected_status=201)
        if r and r.status_code == 201:
            data = r.json()
            created_ids.append(data["id"])
            print(f"       Score: {data['risk_score']} | Indicators: {data.get('malicious_indicators', 'N/A')[:60]}")

    # ── 15. CREATE SCAN (ANALYSIS) ──
    print("\n[15] CREATE ANALYSIS")
    scan_types = [
        {"tipo": "url", "contenido": "https://banco-seguro-login.phishing.com/verificar-cuenta"},
        {"tipo": "mensaje", "contenido": "SU CUENTA HA SERA BLOQUEADA. Haga click aqui para verificar: bit.ly/3xK9z"},
        {"tipo": "correo", "contenido": "De: soporte@paypal-fake.com\nAsunto: Actividad sospechosa en tu cuenta\nHaz clic para verificar"},
        {"tipo": "whatsapp", "contenido": "Hola ganaste un premio de $50.000.000 en el sorteo Nutresa. Reclama aqui: premios-nutresa.win"},
        {"tipo": "qr", "contenido": "https://qr-estafa.net/pago-falso"},
    ]
    for i, scan in enumerate(scan_types):
        r = test(f"POST /api/v1/reportes/analizar [{scan['tipo']}]", "POST", f"{BASE}/api/v1/reportes/analizar",
                 json_data=scan, headers=user_h, expected_status=200)
        if r and r.status_code == 200:
            data = r.json()
            print(f"       Score: {data.get('score', 'N/A')} | Level: {data.get('level', 'N/A')}")

    # ── 16. THREAT INTEL ──
    print("\n[16] THREAT INTELLIGENCE")
    test("GET /api/v1/threat-intel", "GET", f"{BASE}/api/v1/threat-intel", expected_status=200)

    # ── 17. REGISTRATION VALIDATIONS ──
    print("\n[17] REGISTRATION VALIDATIONS")
    test("Register invalid domain", "POST", f"{BASE}/api/v1/auth/registro",
         json_data={"nombre": "Bad", "email": "test@spam.com", "password": "12345678"},
         expected_status=422)
    test("Register short password", "POST", f"{BASE}/api/v1/auth/registro",
         json_data={"nombre": "Bad", "email": "test@gmail.com", "password": "123"},
         expected_status=422)

    # ── 18. RATE LIMITING ──
    print("\n[18] SECURITY HEADERS")
    r = test("GET /health (headers)", "GET", f"{BASE}/health", expected_status=200,
             check_fn=lambda r: (_ for _ in ()).throw(Exception("Missing X-Content-Type-Options")) if not r.headers.get("x-content-type-options") else None)

    # ── 19. ADMIN ACCESS DENIED for normal user ──
    print("\n[19] RBAC — NORMAL USER CANNOT ACCESS ADMIN")
    test("GET /api/v1/admin/dashboard (normal user)", "GET", f"{BASE}/api/v1/admin/dashboard",
         headers=user_h, expected_status=403)

    # ── 20. CLEANUP — Delete test user ──
    print("\n[20] CLEANUP")
    if admin_token:
        # Find the test user
        r = requests.get(f"{BASE}/api/v1/admin/users?search={test_user_email}", headers=admin_h, timeout=15)
        if r.status_code == 200:
            users = r.json()["items"]
            for u in users:
                if u["email"] == test_user_email:
                    requests.delete(f"{BASE}/api/v1/admin/users/{u['id']}", headers=admin_h, timeout=15)
                    print(f"       Deleted test user: {test_user_email}")
                    break

    # ── SUMMARY ──
    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    total = len(results)
    print(f"  RESULTS: {passed}/{total} passed | {failed} failed | {errors} errors")
    print("=" * 60)

    if failed > 0 or errors > 0:
        print("\n  FAILED TESTS:")
        for r in results:
            if r["status"] != "PASS":
                print(f"    [{r['status']}] {r['name']}: {r['reason']}")

    return failed == 0 and errors == 0


if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
