import os
import time
import random
import requests
from datetime import datetime

API_BASE = os.getenv("API_BASE", "http://localhost:8000")
TOKEN = os.getenv("FD_TOKEN", "")

if not TOKEN:
    raise SystemExit("Missing FD_TOKEN env var. Set it to your Bearer JWT token.")

ENDPOINT_CREATE = f"{API_BASE}/api/v1/reportes"

PHONE_PREFIXES = ["+5730", "+5731", "+5732", "+5733", "+5734", "+5735"]
DOMAINS = [
    "verificar-aegis-shield.click",
    "rapicreditos-colombia.xyz",
    "nequi-verificacion.xyz",
    "daviplata-regalos.click",
    "cuentas-recaudo-fraude.xyz",
    "montadeudas-urgente.xyz",
]

BANKS = [
    "Nequi - {}",
    "Daviplata - {}",
    "Bancolombia - {}",
    "Wingo Money - {}",
]

DESCS = [
    "🚨 [SIMULATED ATTACK] Campaña activa de phishing imitando portal corporativo.",
    "🚨 [SIMULATED ATTACK] Inyección SQL & Fuerza Bruta detectada.",
    "🚨 [SIMULATED ATTACK] Amenazas mediante WhatsApp cobrando cobro abusivo gota a gota.",
    "🚨 [SIMULATED ATTACK] Posible extorsión: número reportado asociado a cobros.",
]

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}",
}


def build_payload(i: int):
    phone = random.choice(PHONE_PREFIXES) + str(random.randint(1000000, 9999999))
    domain = random.choice(DOMAINS)
    bank = random.choice(BANKS).format(random.randint(1000000000, 9999999999))
    desc = random.choice(DESCS) + f" (#{i})"
    # Elegimos un nivel para forzar variedad
    risk_level = random.choice(["alto", "medio", "bajo"])

    return {
        "phone_number": phone,
        "domain": domain,
        "bank_account": bank,
        "description": desc,
        "risk_level": risk_level,
    }


def main():
    total = 100
    batch_sleep = 0.05  # ~20 req/s

    print(f"[{datetime.now().isoformat()}] Starting attack: {total} reports -> {ENDPOINT_CREATE}")

    ok = 0
    fail = 0

    start = time.time()
    for i in range(1, total + 1):
        payload = build_payload(i)
        try:
            r = requests.post(ENDPOINT_CREATE, headers=headers, json=payload, timeout=20)
            if r.status_code in (200, 201):
                ok += 1
            else:
                fail += 1
                # Print a compact error
                try:
                    msg = r.json()
                except Exception:
                    msg = r.text[:200]
                print(f"#{i} ERROR {r.status_code}: {msg}")
        except Exception as e:
            fail += 1
            print(f"#{i} EXCEPTION: {e}")

        time.sleep(batch_sleep)

    elapsed = time.time() - start
    print(f"Done. OK={ok} FAIL={fail} elapsed={elapsed:.2f}s req/s={(total/elapsed):.2f}")


if __name__ == "__main__":
    main()

