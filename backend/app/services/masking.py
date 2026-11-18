import re
from typing import Any

from app.models.db import FraudReport


def enmascarar_telefono(valor: str | None) -> str | None:
    """+573129871109 -> +573*****09 (conserva prefijo y 2 últimos dígitos)."""
    if not valor:
        return valor
    limpio = valor.strip()
    if len(limpio) <= 7:
        return "*" * len(limpio)
    visibles = 2 if not limpio.startswith("+") else 4
    return f"{limpio[:visibles]}{'*' * (len(limpio) - visibles - 2)}{limpio[-2:]}"


def enmascarar_cuenta(valor: str | None) -> str | None:
    """Nequi - 3129871109 -> Nequi - 31*****09; oculta dígitos dejando 2 primeros y 2 últimos."""
    if not valor:
        return valor

    def _reemplazar(match: re.Match[str]) -> str:
        digitos = match.group(0)
        if len(digitos) <= 5:
            return "*" * len(digitos)
        return f"{digitos[:2]}{'*' * (len(digitos) - 4)}{digitos[-2:]}"

    return re.sub(r"\d{3,}", _reemplazar, valor)


def enmascarar_reporte_publico(reporte: FraudReport) -> dict[str, Any]:
    """Copia anonimizada del reporte para endpoints públicos (minimización de datos personales)."""
    return {
        "id": reporte.id,
        "phone_number": enmascarar_telefono(reporte.phone_number),
        "bank_account": enmascarar_cuenta(reporte.bank_account),
        "domain": reporte.domain,
        "description": reporte.description,
        "risk_level": reporte.risk_level,
        "risk_score": reporte.risk_score,
        "malicious_indicators": reporte.malicious_indicators,
        "created_at": reporte.created_at,
    }
