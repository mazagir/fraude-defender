import base64
import hashlib
import hmac
import logging
import os

from fastapi import APIRouter, Form, Request, Response, status

from app.main import limiter
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter()

WELCOME_TEXT = (
    "🛡️ *Bienvenido a AgielShield* — Tu escudo contra estafas y phishing.\n\n"
    "Envíame cualquier enlace, SMS o mensaje sospechoso y te responderé con su "
    "nivel de riesgo al instante.\n\n"
    "Escribe *ayuda* para ver el menú."
)
HELP_TEXT = (
    "🛡️ *AgielShield Bot*\n\n"
    "Pega el texto, enlace o mensaje que desconfías (sin necesidad de comandos) "
    "y lo analizaré con IA:\n"
    "• URLs de phishing bancario\n"
    "• Extorsiones y montadeudas por WhatsApp\n"
    "• SMS falsos de paquetería\n\n"
        "_Servicio gratuito de la comunidad AgielShield._"
)


def _risk_emoji(level: str) -> str:
    return {"CRITICAL": "🚨", "HIGH": "⚠️", "MEDIUM": "🟠", "LOW": "✅"}.get(level.upper(), "🔎")


def _format_reply(result: dict) -> str:
    level = str(result.get("level", "LOW")).upper()
    lines = [
        f"{_risk_emoji(level)} *AgielShield — Análisis de riesgo*",
        f"Nivel: *{level}* ({result.get('score', 0)}%)",
        "",
        str(result.get("explanation", "") or "").strip() or "Sin detalles disponibles.",
    ]
    indicators = result.get("indicators") or []
    if indicators:
        lines.append("")
        lines.append("*Indicadores detectados:*")
        lines.extend(f"• {str(ind)[:80]}" for ind in indicators[:4])
    recommendations = result.get("recommendations") or []
    if recommendations:
        lines.append("")
        lines.append("*Recomendaciones:*")
        lines.extend(f"✓ {str(rec)[:80]}" for rec in recommendations[:3])
    lines.append("")
    lines.append("Verifícalo tú mismo: https://frontend-mazagirs-projects.vercel.app")
    return "\n".join(lines)


def _twiml(message: str) -> str:
    safe = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{safe}</Message></Response>"
    )


def _validar_firma_twilio(request: Request, params: dict[str, str]) -> bool:
    token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    if not token:
        logger.warning("TWILIO_AUTH_TOKEN no configurado: webhook acepta solicitudes sin validar firma.")
        return True
    firma = request.headers.get("x-twilio-signature", "")
    if not firma:
        return False
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    url = str(request.url).replace(f"{request.url.scheme}://", f"{scheme}://", 1)
    datos = url + "".join(f"{key}{value}" for key, value in sorted(params.items()))
    esperada = base64.b64encode(
        hmac.new(token.encode(), datos.encode(), hashlib.sha1).digest()
    ).decode()
    return hmac.compare_digest(esperada, firma)


@router.post("/whatsapp", status_code=status.HTTP_200_OK)
@limiter.limit("60/minute")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(default=""),
    Body: str = Form(default=""),
):
    """Webhook Twilio para el bot de WhatsApp.

    Responde con TwiML XML analizando el texto recibido con el motor de IA.
    Firma opcionalmente validada si TWILIO_AUTH_TOKEN está configurado.
    """
    try:
        form = {str(k): str(v) for k, v in (await request.form()).items()}
    except Exception:
        form = {"From": From, "Body": Body}
    if not _validar_firma_twilio(request, form):
        return Response(
            content=_twiml("🔒 No pude verificar la solicitud."),
            media_type="application/xml",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    texto = Body.strip()
    if not texto or texto.lower() in {"hola", "menu", "menú"}:
        respuesta = WELCOME_TEXT
    elif texto.lower() in {"ayuda", "help"}:
        respuesta = HELP_TEXT
    else:
        servicio = GeminiService()
        resultado = await servicio.analizar_sospecha(tipo="whatsapp", contenido=texto[:1500])
        respuesta = _format_reply(resultado)

    return Response(content=_twiml(respuesta), media_type="application/xml")
