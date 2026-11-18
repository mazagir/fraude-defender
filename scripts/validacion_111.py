# -*- coding: utf-8 -*-
"""Validación reproducible del motor de dominio y del motor heurístico.

Genera la matriz de confusión y las métricas reportadas en el documento 111.
No realiza llamadas de red: usa el verificador de dominios y el motor
heurístico locales, con una base SQLite vacía.

Uso:
    python scripts/validacion_111.py
Salida:
    docs/validacion_111.json
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, BASE)

os.environ.setdefault("DB_PROVIDER", "sqlite")
os.environ.setdefault("DATABASE_URL", "sqlite:///./validacion_111.db")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("JWT_SECRET_KEY", "validacion-111-secret-key-0123456789abcdef")
os.environ.setdefault("ALLOWED_API_KEYS", "validacion_111_key")

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.core.database import Base  # noqa: E402
from app.models.db import FraudReport  # noqa: E402,F401
from app.services.domain_verification import DomainVerificationService  # noqa: E402
from app.services.gemini_service import GeminiService  # noqa: E402

# ---------------------------------------------------------------------------
# 1. Conjunto etiquetado de dominios (15 fraudulentos / 15 legítimos)
# ---------------------------------------------------------------------------
DOMINIOS = [
    # (contenido, etiqueta_real) 1 = fraudulento, 0 = legítimo
    ("https://bancolombia.verificar-cuenta.today/login", 1),
    ("https://bancolombia-seguro.xyz/login", 1),
    ("https://nequi-app.top/verificar", 1),
    ("https://nequi.login-seguro.click/", 1),
    ("https://daviplata-online.info/pago", 1),
    ("https://bbvacolombia.site/otp", 1),
    ("https://banorte-seguro.online/acceso", 1),
    ("https://santander-alerta.xyz/", 1),
    ("https://banamex-verifica.top/login", 1),
    ("https://mercadopago-ofertas.click/", 1),
    ("https://galicia-account.work/", 1),
    ("https://bancochile-seguro.live/", 1),
    ("https://bancoestado-alerta.info/", 1),
    ("https://nubank-brasil.xyz/", 1),
    ("https://itau-seguro.top/", 1),
    ("https://www.bancolombia.com/personas", 0),
    ("https://www.nequi.com.co/", 0),
    ("https://www.daviplata.com/", 0),
    ("https://www.bbva.com.co/", 0),
    ("https://www.banorte.com/", 0),
    ("https://www.santander.com.mx/", 0),
    ("https://www.banamex.com/", 0),
    ("https://www.mercadopago.com.mx/", 0),
    ("https://www.galicia.com.ar/", 0),
    ("https://www.bancochile.cl/", 0),
    ("https://www.bancoestado.cl/", 0),
    ("https://www.nubank.com.br/", 0),
    ("https://www.itau.com.br/", 0),
    ("https://www.google.com/", 0),
    ("https://github.com/", 0),
]

# ---------------------------------------------------------------------------
# 2. Conjunto etiquetado de mensajes (10 fraudulentos / 10 benignos)
# ---------------------------------------------------------------------------
MENSAJES = [
    ("Su cuenta fue bloqueada. Comparta el codigo OTP que acaba de recibir para verificar su identidad.", 1),
    ("Usted tiene una deuda pendiente. Pague hoy o iniciaremos cobro juridico por interes moratorio.", 1),
    ("Gano un premio de 5 millones. Envie sus credenciales y codigo de verificacion al portal.", 1),
    ("Somos soporte tecnico de su banco. Instale esta APK para eliminar un troyano de su telefono.", 1),
    ("Lo tenemos ubicado. Si no paga la extorsion publicaremos sus fotos y llamaremos a su familia.", 1),
    ("Estimado cliente, detectamos suplantacion de identidad. Ingrese al portal y confirme su clave.", 1),
    ("Su paquete esta retenido. Pague la multa en este enlace para evitar el remate de la mercancia.", 1),
    ("Oferta de credito inmediato: solo pague un anticipo y le desembolsamos el dinero hoy mismo.", 1),
    ("Hola, soy su sobrino. Estoy en problemas y necesito que me transfiera dinero urgente, no le diga a nadie.", 1),
    ("Descargue el archivo adjunto con la factura; es un ejecutable que debe abrir para ver su deuda.", 1),
    ("Hola, confirmo la reunion de manana a las 9:00 en la sala de juntas.", 0),
    ("Gracias por su compra. Su pedido fue enviado y llegara en tres dias habiles.", 0),
    ("Buenas tardes, adjunto el acta de la reunion para su revision.", 0),
    ("Su cita medica quedo agendada para el viernes a las 10:00.", 0),
    ("Felicitaciones por el cumpleanos de su hijo, nos vemos en la celebracion.", 0),
    ("Le recordamos que la biblioteca cierra a las 6:00 p.m. hoy.", 0),
    ("El informe mensual de ventas ya esta disponible en el repositorio interno.", 0),
    ("Su solicitud de vacaciones fue aprobada por el area de talento humano.", 0),
    ("El clima para manana sera soleado con una temperatura maxima de 30 grados.", 0),
    ("Adjunto encontrara la presentacion del proyecto para la reunion del martes.", 0),
]


def metricas(y_true: list[int], y_pred: list[int]) -> dict:
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    n = len(y_true)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    fpr = fp / (fp + tn) if (fp + tn) else 0.0
    fnr = fn / (fn + tp) if (fn + tp) else 0.0
    exactitud = (tp + tn) / n if n else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return {
        "tp": tp, "tn": tn, "fp": fp, "fn": fn, "n": n,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "tasa_falsos_positivos": round(fpr, 4),
        "tasa_falsos_negativos": round(fnr, 4),
        "exactitud": round(exactitud, 4),
        "f1": round(f1, 4),
    }


def evaluar_dominios() -> dict:
    svc = DomainVerificationService()
    filas = []
    y_true, y_pred = [], []
    for contenido, etiqueta in DOMINIOS:
        res = svc.verificar(contenido)
        pred = 1 if (res["es_real"] is False or res["score"] >= 30) else 0
        y_true.append(etiqueta)
        y_pred.append(pred)
        filas.append({
            "contenido": contenido,
            "etiqueta": etiqueta,
            "prediccion": pred,
            "es_real": res["es_real"],
            "score": res["score"],
            "confianza": res["confianza"],
            "marca_imita": res["marca_imita"],
        })
    return {"filas": filas, "metricas": metricas(y_true, y_pred)}


def evaluar_mensajes() -> dict:
    """Evalúa la capa heurística local que actúa cuando Gemini no está disponible."""
    svc = GeminiService()
    filas = []
    y_true, y_pred = [], []
    for texto, etiqueta in MENSAJES:
        res = svc._analisis_heuristico_local("mensaje", texto)
        pred = 1 if res["posible_fraude"] else 0
        y_true.append(etiqueta)
        y_pred.append(pred)
        filas.append({
            "texto": texto,
            "etiqueta": etiqueta,
            "prediccion": pred,
            "score": res["score"],
            "nivel": res["level"],
            "indicadores": res["indicators"],
        })
    return {"filas": filas, "metricas": metricas(y_true, y_pred)}


def main() -> None:
    resultado = {
        "fecha_corte": datetime.now(timezone.utc).isoformat(),
        "dominios": evaluar_dominios(),
        "mensajes": evaluar_mensajes(),
        "condiciones": (
            "Ejecución local sin llamadas de red, sobre un conjunto etiquetado por los autores. "
            "El veredicto de dominio se considera positivo si es_real=False o score>=30. "
            "El mensaje se considera positivo si el score heurístico>=30 (umbral de posible_fraude). "
            "No se consultó la API de Gemini ni la base de producción."
        ),
    }
    salida = os.path.join(os.path.dirname(__file__), "..", "docs", "validacion_111.json")
    with open(salida, "w", encoding="utf-8") as fh:
        json.dump(resultado, fh, ensure_ascii=False, indent=2)
    print(json.dumps({
        "dominios": resultado["dominios"]["metricas"],
        "mensajes": resultado["mensajes"]["metricas"],
    }, ensure_ascii=False, indent=2))
    print("Guardado en:", os.path.abspath(salida))


if __name__ == "__main__":
    main()
