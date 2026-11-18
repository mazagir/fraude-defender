"""Test gamification endpoints in production."""
import os
import requests
BASE = "https://agishield-api.onrender.com"
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD_RAW", "")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "")
if not ADMIN_EMAIL or not ADMIN_PASSWORD or not TEST_PASSWORD:
    print("[ERROR] Defina ADMIN_EMAIL, ADMIN_PASSWORD_RAW y TEST_PASSWORD en el entorno.")
    raise SystemExit(1)

# Register
r = requests.post(f"{BASE}/api/v1/auth/registro", json={"nombre":"GameTest","email":"gamtest@gmail.com","password":TEST_PASSWORD}, timeout=15)
print("Register:", r.status_code, r.text[:200])
user_id = r.json().get("id")

# Login
lr = requests.post(f"{BASE}/api/v1/auth/login", data={"username":"gamtest@gmail.com","password":TEST_PASSWORD}, timeout=15)
print("Login:", lr.status_code)
if lr.status_code != 200:
    print(lr.text[:300])
    exit(1)

token = lr.json()["access_token"]
h = {"Authorization": f"Bearer {token}"}

# GET gamification (should be defaults)
g = requests.get(f"{BASE}/api/v1/gamification", headers=h, timeout=15)
print("GET:", g.status_code, g.json())

# PUT gamification
payload = {"reputation": 100, "badges": '["cazador_phishing"]', "streak": 3}
u = requests.put(f"{BASE}/api/v1/gamification", headers=h, json=payload, timeout=15)
print("PUT:", u.status_code, u.json())

# Verify
g2 = requests.get(f"{BASE}/api/v1/gamification", headers=h, timeout=15)
print("Verify:", g2.status_code, g2.json())

# Verify in /auth/me
me = requests.get(f"{BASE}/api/v1/auth/me", headers=h, timeout=15)
me_data = me.json()
print("Me:", me.status_code, "reputation:", me_data.get("reputation"), "badges:", me_data.get("badges"))

# Cleanup
login = requests.post(f"{BASE}/api/v1/auth/login", data={"username":ADMIN_EMAIL,"password":ADMIN_PASSWORD}, timeout=15)
at = login.json()["access_token"]
if user_id:
    r3 = requests.delete(f"{BASE}/api/v1/admin/users/{user_id}", headers={"Authorization": f"Bearer {at}"}, timeout=15)
    print("Cleanup:", r3.status_code)
