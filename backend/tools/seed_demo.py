"""seed_demo.py — Puebla la base de datos con IoCs de demostración realistas.

Uso (desde backend/):
    python tools/seed_demo.py            # inserta si hay menos de 40 reportes
    python tools/seed_demo.py --force    # inserta aunque ya existan datos
    python tools/seed_demo.py --dry-run  # muestra lo que insertaría

Los teléfonos y cuentas son ficticios pero verosímiles; las descripciones
incluyen señales por país para que la clasificación geográfica funcione.
"""
import argparse
import os
import random
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base, engine, SessionLocal
from app.models.db import FraudReport
from app.services.risk_engine import analizar_riesgo

UMBRAL_EXISTENTE = 40

PLANTILLAS = {
    "Colombia": [
        ("+5731445{seq:03d}", "Nequi - 31445{seq:03d}", "nequi-{seq}seguro.xyz", "SMS falso de bloqueo de Nequi que pide verificar claves en enlace externo.", "CRITICAL"),
        ("+5730123{seq:03d}", None, None, "Gota a gota: extorsión con cobro diario por préstamo no solicitado.", "CRITICAL"),
        (None, "Bancolombia - 43210{seq}", "bancolombia-{seq}verifica.click", "Correo de suplantación bancaria con OTP solicitado por teléfono.", "HIGH"),
        ("+5732088{seq:03d}", None, "daviplata-{seq}premio.top", "Mensaje de premio falso de Daviplata que pide datos completos.", "HIGH"),
        ("+5731655{seq:03d}", None, None, "Llamada de falsa asesoría financiera que solicita códigos de verificación.", "MEDIUM"),
        (None, None, "empleos-rapidos-col{seq}.xyz", "Oferta laboral falsa que exige pagar 'tramite de carpeta' por adelantado.", "HIGH"),
    ],
    "Mexico": [
        ("+52554433{seq:02d}", None, None, "Montadeudas: amenazas de visita y difusión por préstamo de aplicación no autorizada.", "CRITICAL"),
        ("+52558776{seq:02d}", "Banorte - 55443{seq:02d}", None, "Extorsión por WhatsApp con fotos manipuladas exigiendo transferencia inmediata.", "CRITICAL"),
        (None, None, "bbva-mx-{seq}alerta.com", "SMS de alerta bancaria falsa con enlace de reactivación de cuenta.", "HIGH"),
        ("+52331122{seq:02d}", None, None, "Falso cobro de paquetería con multa pendiente vía mensaje de texto.", "MEDIUM"),
        (None, "Banco Azteca - 09841{seq}", "azteca-{seq}credencial.top", "Préstamo exprés falso que solicita anticipos por concepto de seguros.", "HIGH"),
    ],
    "Peru": [
        ("+5198877{seq:03d}", None, "yape-{seq}sorteo.online", "Sorteo falso de Yape que pide registrar tarjeta para reclamar premio.", "HIGH"),
        ("+5195544{seq:03d}", "BCP - 19284{seq}", None, "Suplantación de familiar enfermo pidiendo transferencia urgente (cuento del tío).", "CRITICAL"),
        (None, None, "plin-{seq}recarga.pe", "Recarga duplicada fraudulenta con enlace de reembolso falso.", "MEDIUM"),
        ("+5192334{seq:03d}", None, None, "Falsa entrega de paquetería internacional con pago aduanal por link.", "HIGH"),
        (None, "Interbank - 771002{seq}", None, "Cobro fantasma de deuda con presión telefónica constante.", "MEDIUM"),
    ],
    "Chile": [
        ("+5694455{seq:03d}", None, None, "SMS de correos falsos: paquete retenido que exige pago de despacho.", "HIGH"),
        (None, "BancoEstado - 55021{seq}", "bancoestado-{seq}cuenta.cl", "Phishing de actualización de datos con clave dinámica solicitada.", "CRITICAL"),
        ("+5696677{seq:03d}", None, "mach-{seq}cashback.top", "Cashback falso de app financiera que roba credenciales.", "HIGH"),
        ("+5691122{seq:03d}", None, None, "WhatsApp de arriendo falso con anticipo reservado sin visita.", "MEDIUM"),
        (None, None, "falabella-{seq}cupon.xyz", "Cupón de supermercado falso distribuido por QR en estacionamientos.", "MEDIUM"),
    ],
    "Argentina": [
        ("+5491155{seq:04d}", None, None, "Suplantación de Mercado Pago con pedido de validación de dispositivo.", "HIGH"),
        ("+5492233{seq:04d}", "UALA - 22013{seq}", None, "Cobro extorsivo por suscripción inexistente con amenaza de juicio.", "CRITICAL"),
        (None, None, "mercadopago-{seq}-seguridad.com", "Enlace de verificación falso que captura usuario y contraseña.", "CRITICAL"),
        ("+5493344{seq:04d}", None, None, "Falso sorteo de aniversario de billetera virtual compartido por grupos.", "MEDIUM"),
        (None, "Santander - 88431{seq}", "santander-{seq}homebanking.xyz", "Alerta de homebanking falsa con descarga de malware.", "HIGH"),
    ],
}

PESOS = {"Colombia": 12, "Mexico": 12, "Peru": 9, "Chile": 8, "Argentina": 9}


def generar_reportes() -> list[dict]:
    rng = random.Random(2026)
    seleccion = []
    for pais, cantidad in PESOS.items():
        plantillas = PLANTILLAS[pais]
        for i in range(cantidad):
            plantilla = plantillas[i % len(plantillas)]
            seq = 100 + rng.randint(0, 899)
            telefono, cuenta, dominio, descripcion, nivel = plantilla
            seleccion.append({
                "pais": pais,
                "phone_number": telefono.format(seq=seq) if telefono else None,
                "bank_account": cuenta.format(seq=seq) if cuenta else None,
                "domain": dominio.format(seq=seq) if dominio else None,
                "description": f"[{pais}] {descripcion}",
                "risk_level": nivel,
                "dias_atras": rng.randint(0, 13),
                "horas": rng.randint(8, 22),
            })
    return seleccion


def main() -> None:
    parser = argparse.ArgumentParser(description="Semilla de IoCs de demostración para AgielShield.")
    parser.add_argument("--force", action="store_true", help="Inserta aunque ya existan suficientes reportes.")
    parser.add_argument("--dry-run", action="store_true", help="No escribe en la base de datos.")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existentes = db.query(FraudReport).count()
        print(f"Reportes actuales en la base: {existentes}")
        if existentes >= UMBRAL_EXISTENTE and not args.force:
            print(f"Ya hay {existentes} reportes (>= {UMBRAL_EXISTENTE}). Usa --force para insertar de todos modos.")
            return

        candidatos = generar_reportes()
        if args.dry_run:
            for c in candidatos:
                print(f"  [DRY] {c['pais']:<10} {str(c['phone_number'])[:15]:<15} {c['domain'] or c['bank_account'] or '-'}")
            print(f"Total a insertar: {len(candidatos)}")
            return

        ahora = datetime.now(timezone.utc)
        insertados = 0
        for c in candidatos:
            score, level, indicators = analizar_riesgo(
                db=db,
                phone_number=c["phone_number"],
                bank_account=c["bank_account"],
                domain=c["domain"],
                description=c["description"],
            )
            creado = ahora - timedelta(days=c["dias_atras"], hours=ahora.hour - c["horas"])
            db.add(FraudReport(
                phone_number=c["phone_number"],
                bank_account=c["bank_account"],
                domain=c["domain"],
                description=c["description"],
                risk_level=c["risk_level"] if c["risk_level"] else level,
                risk_score=max(score, {"CRITICAL": 80, "HIGH": 60, "MEDIUM": 40, "LOW": 20}[c["risk_level"]]),
                malicious_indicators=", ".join(indicators) if indicators else "Demo",
                created_at=creado,
            ))
            insertados += 1
        db.commit()
        print(f"Insertados {insertados} reportes de demostración.")
        total = db.query(FraudReport).count()
        print(f"Total en base: {total}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
