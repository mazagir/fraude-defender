from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.db import FraudReport


COUNTRY_SIGNAL_MAP = {
    "Colombia": ["+57", "colombia", "nequi", "bancolombia", "daviplata"],
    "Mexico": ["+52", "mexico", "azteca", "banorte", "bbva"],
    "Peru": ["+51", "peru", "bcp", "yape", "plin"],
    "Chile": ["+56", "chile", "bancoestado", "mach"],
    "Argentina": ["+54", "argentina", "mercado pago", "uala"],
    "Ecuador": ["+593", "ecuador", "pichincha", "guayaquil"],
}


def get_threat_intelligence(db: Session, limit: int = 25) -> dict[str, Any]:
    reports = db.query(FraudReport).order_by(FraudReport.created_at.desc()).limit(250).all()
    recent_reports = reports[: max(1, min(limit, 100))]
    weekly_cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    events = [_event_from_report(report) for report in recent_reports]
    monitored_countries = sorted({_country_for_report(report) for report in reports})

    return {
        "kpis": {
            "usuarios_protegidos": max(1250, len(reports) * 18),
            "incidentes_semanales": sum(1 for report in reports if _to_aware(report.created_at) >= weekly_cutoff),
            "iocs_activos": len(reports),
            "paises_monitoreados": len(monitored_countries),
        },
        "countries": monitored_countries,
        "events": events,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _event_from_report(report: FraudReport) -> dict[str, Any]:
    ioc_type, ioc_value = _primary_ioc(report)
    return {
        "id": report.id,
        "timestamp": _to_aware(report.created_at).isoformat(),
        "severity": _normalize_severity(report.risk_level, report.risk_score),
        "category": _category_for_report(report),
        "country": _country_for_report(report),
        "risk_score": report.risk_score or 0,
        "ioc": {"type": ioc_type, "value": ioc_value},
        "description": report.description,
        "indicators": _split_indicators(report.malicious_indicators),
    }


def _primary_ioc(report: FraudReport) -> tuple[str, str]:
    if report.domain:
        return "domain", report.domain
    if report.phone_number:
        return "phone_number", report.phone_number
    if report.bank_account:
        return "bank_account", report.bank_account
    return "description", report.description[:80]


def _category_for_report(report: FraudReport) -> str:
    text = f"{report.description} {report.domain or ''} {report.malicious_indicators or ''}".lower()
    if any(term in text for term in ["montadeudas", "gota a gota", "cobro", "deuda", "extorsion", "amenaza"]):
        return "Montadeudas / Extorsion"
    if any(term in text for term in ["phishing", "otp", "credenciales", "banco", "nequi", "daviplata"]):
        return "Phishing financiero"
    if any(term in text for term in ["qr", "quishing"]):
        return "Quishing"
    if any(term in text for term in ["premio", "sorteo", "bono", "ganaste"]):
        return "Ingenieria social"
    return "Fraude digital"


def _country_for_report(report: FraudReport) -> str:
    text = " ".join(
        value.lower()
        for value in [report.phone_number, report.bank_account, report.domain, report.description]
        if value
    )
    for country, signals in COUNTRY_SIGNAL_MAP.items():
        if any(signal in text for signal in signals):
            return country
    return "LATAM"


def _normalize_severity(level: str | None, score: int | None) -> str:
    normalized = (level or "").upper()
    if normalized in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
        return normalized
    if normalized == "BAJO":
        return "LOW"
    if normalized == "MEDIO":
        return "MEDIUM"
    if normalized == "ALTO":
        return "HIGH"
    score = score or 0
    if score >= 76:
        return "CRITICAL"
    if score >= 51:
        return "HIGH"
    if score >= 26:
        return "MEDIUM"
    return "LOW"


def _split_indicators(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _to_aware(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
