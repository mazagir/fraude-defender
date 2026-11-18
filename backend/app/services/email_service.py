"""AgielShield Email Notification Service."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("agishield.email")


def send_email(to: str, subject: str, html_body: str, plain_body: str = None) -> bool:
    if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
        logger.warning("SMTP not configured — skipping email send")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.EMAILS_FROM
    msg["To"] = to
    msg["Subject"] = subject

    if plain_body:
        msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAILS_FROM, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


def send_report_alert(to: str, risk_level: str, description: str, score: int) -> bool:
    color = {"CRITICAL": "#ff4d6d", "HIGH": "#ffb347", "MEDIUM": "#3b82f6"}.get(risk_level, "#64748b")
    html = f"""
    <div style="font-family:monospace;max-width:500px;margin:0 auto;padding:20px;background:#070911;color:#e2e8f0;border-radius:12px;border:1px solid #1e293b">
      <h2 style="color:{color};font-size:16px">🚨 Alerta AgielShield — {risk_level}</h2>
      <p style="font-size:13px;color:#94a3b8">Se detectó un nuevo incidente de fraude:</p>
      <p style="font-size:12px;color:#cbd5e1;background:#0f172a;padding:12px;border-radius:8px">{description[:200]}</p>
      <p style="font-size:12px;color:#64748b">Puntuación de riesgo: <strong style="color:{color}">{score}/100</strong></p>
      <hr style="border-color:#1e293b">
      <p style="font-size:10px;color:#475569">AgielShield — Threat Intelligence Platform v2.0</p>
    </div>"""
    return send_email(to, f"[AgielShield] Alerta {risk_level} — Incidente detectado", html)


def send_welcome_email(to: str, nombre: str) -> bool:
    html = f"""
    <div style="font-family:monospace;max-width:500px;margin:0 auto;padding:20px;background:#070911;color:#e2e8f0;border-radius:12px;border:1px solid #1e293b">
      <h2 style="color:#00e5b4;font-size:16px">🛡️ Bienvenido a AgielShield, {nombre}!</h2>
      <p style="font-size:13px;color:#94a3b8">Tu cuenta ha sido creada exitosamente.</p>
      <p style="font-size:12px;color:#cbd5e1">Ya puedes comenzar a analizar amenazas y proteger tu comunidad.</p>
      <ul style="font-size:12px;color:#94a3b8">
        <li>Escanea URLs, correos y mensajes sospechosos</li>
        <li>Reporta indicadores de fraude (IoCs)</li>
        <li>Desbloquea insignias y escala en el leaderboard</li>
      </ul>
      <hr style="border-color:#1e293b">
      <p style="font-size:10px;color:#475569">AgielShield — Detect. Analyze. Defend.</p>
    </div>"""
    return send_email(to, "Bienvenido a AgielShield", html)
