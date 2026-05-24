import re
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.db import FraudReport

SUSPICIOUS_TLDS = [
    ".xyz", ".top", ".click", ".loan", ".support", ".vip", ".info", 
    ".work", ".biz", ".online", ".live", ".gq", ".cf", ".tk", ".ml"
]

SUSPICIOUS_KEYWORDS = [
    "montadeudas", "extorsion", "extorsión", "amenaza", "amenazar", 
    "cobro", "interes", "interés", "intimidar", "intimidación", 
    "phishing", "robo", "fraude", "estafa", "difamar", "difamación",
    "whatsapp", "acosar", "acoso", "pago", "deuda"
]

def analizar_riesgo(
    db: Session,
    phone_number: Optional[str] = None,
    bank_account: Optional[str] = None,
    domain: Optional[str] = None,
    description: str = ""
) -> Tuple[int, str, List[str]]:
    """
    Analiza los Indicadores de Compromiso (IoC) y calcula una puntuación de riesgo (0-100),
    así como un nivel de riesgo (LOW, MEDIUM, HIGH, CRITICAL) y una lista de indicadores hallados.
    """
    score = 10  # Riesgo base mínimo
    indicators = []

    # 1. Análisis de Dominio
    if domain:
        domain_lower = domain.lower().strip()
        # Verificar si termina en un TLD sospechoso
        if any(domain_lower.endswith(tld) for tld in SUSPICIOUS_TLDS):
            score += 30
            indicators.append("TLD altamente sospechoso")
        
        # Verificar si ya existe en la base de datos
        existente = db.query(FraudReport).filter(FraudReport.domain == domain).first()
        if existente:
            score += 30
            indicators.append("Dominio reportado previamente")

    # 2. Análisis de Teléfono
    if phone_number:
        phone_clean = re.sub(r"\D", "", phone_number)
        if phone_clean:
            # Buscar coincidencia en la base de datos
            # Como los teléfonos pueden guardarse con o sin +, limpiamos o hacemos un like
            existente = db.query(FraudReport).filter(
                (FraudReport.phone_number == phone_number) | 
                (FraudReport.phone_number.like(f"%{phone_clean[-10:]}"))
            ).first()
            if existente:
                score += 40
                indicators.append("Número telefónico reincidente")

    # 3. Análisis de Cuenta Bancaria
    if bank_account:
        bank_clean = bank_account.strip()
        if bank_clean:
            existente = db.query(FraudReport).filter(FraudReport.bank_account == bank_clean).first()
            if existente:
                score += 45
                indicators.append("Cuenta bancaria en lista negra")

    # 4. Análisis de Texto (NLP Básico / Keywords)
    desc_lower = description.lower()
    keywords_encontradas = [kw for kw in SUSPICIOUS_KEYWORDS if kw in desc_lower]
    if keywords_encontradas:
        score += min(len(keywords_encontradas) * 10, 30)
        indicators.append(f"Patrón de extorsión detectado ({', '.join(keywords_encontradas[:3])})")

    # Acotar puntuación entre 0 y 100
    score = min(score, 100)
    score = max(score, 0)

    # Clasificar nivel de riesgo
    if score <= 25:
        level = "LOW"
    elif score <= 50:
        level = "MEDIUM"
    elif score <= 75:
        level = "HIGH"
    else:
        level = "CRITICAL"

    return score, level, indicators
