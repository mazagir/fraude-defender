from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Iterable, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.db import FraudReport


SUSPICIOUS_TLDS = [
    ".xyz", ".top", ".click", ".loan", ".support", ".vip", ".info",
    ".work", ".biz", ".online", ".live", ".gq", ".cf", ".tk", ".ml",
]

FRAUD_PATTERNS = {
    "extortion": {
        "weight": 25,
        "keywords": ["extorsion", "extorsion", "amenaza", "amenazar", "intimidar", "acoso", "difamar"],
    },
    "loan_sharking": {
        "weight": 22,
        "keywords": ["montadeudas", "gota a gota", "cobro", "deuda", "interes", "intereses", "pago"],
    },
    "phishing": {
        "weight": 20,
        "keywords": ["phishing", "suplantacion", "credenciales", "portal", "verificar", "otp"],
    },
    "malware": {
        "weight": 25,
        "keywords": ["malware", "troyano", "ransomware", "apk", "keylogger"],
    },
    "scam": {
        "weight": 15,
        "keywords": ["fraude", "estafa", "robo", "enganoso"],
    },
}


@dataclass(frozen=True)
class IndicatorOfCompromise:
    phone_number: Optional[str] = None
    bank_account: Optional[str] = None
    domain: Optional[str] = None
    description: str = ""
    reported_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    fraud_type: Optional[str] = None


@dataclass(frozen=True)
class HistoricalReport:
    reported_at: datetime
    fraud_type: Optional[str] = None
    source: str = "database"


@dataclass(frozen=True)
class RiskAssessment:
    score: int
    level: str
    indicators: list[str]
    matched_fraud_types: list[str]


class RiskHeuristicEngine:
    """Deterministic risk scoring for AegisShield IoCs.

    The score is intentionally explainable. Each rule contributes bounded points,
    and the final value is clamped to 0..100 for predictable operations and tests.
    """

    def evaluate(
        self,
        ioc: IndicatorOfCompromise,
        historical_reports: Iterable[HistoricalReport] | None = None,
    ) -> RiskAssessment:
        score = 5
        indicators: list[str] = []
        history = list(historical_reports or [])

        score += self._score_ioc_presence(ioc)

        if self._has_suspicious_tld(ioc.domain):
            score += 25
            indicators.append("TLD altamente sospechoso")

        fraud_score, matched_types, keyword_indicators = self._score_fraud_patterns(ioc)
        score += fraud_score
        indicators.extend(keyword_indicators)

        recurrence_score, recurrence_indicators = self._score_recurrence(history)
        score += recurrence_score
        indicators.extend(recurrence_indicators)

        score = max(0, min(100, score))
        return RiskAssessment(
            score=score,
            level=self._level_for_score(score),
            indicators=indicators or ["Sin senales heuristicas relevantes"],
            matched_fraud_types=matched_types,
        )

    def evaluate_with_database(self, db: Session, ioc: IndicatorOfCompromise) -> RiskAssessment:
        reports = self._find_historical_reports(db, ioc)
        assessment = self.evaluate(ioc=ioc, historical_reports=reports)
        indicators = list(assessment.indicators)

        if ioc.domain and any(report.source == "domain" for report in reports):
            indicators.append("Dominio reportado previamente")
        if ioc.phone_number and any(report.source == "phone_number" for report in reports):
            indicators.append("Numero telefonico reincidente")
        if ioc.bank_account and any(report.source == "bank_account" for report in reports):
            indicators.append("Cuenta bancaria en lista negra")

        return RiskAssessment(
            score=assessment.score,
            level=assessment.level,
            indicators=self._dedupe(indicators),
            matched_fraud_types=assessment.matched_fraud_types,
        )

    def _score_ioc_presence(self, ioc: IndicatorOfCompromise) -> int:
        score = 0
        if ioc.domain:
            score += 8
        if ioc.phone_number:
            score += 6
        if ioc.bank_account:
            score += 10
        return min(score, 20)

    def _score_fraud_patterns(self, ioc: IndicatorOfCompromise) -> tuple[int, list[str], list[str]]:
        text = self._normalize_text(f"{ioc.description} {ioc.fraud_type or ''}")
        matched_types: list[str] = []
        matched_keywords: list[str] = []
        score = 0

        for fraud_type, rule in FRAUD_PATTERNS.items():
            hits = [kw for kw in rule["keywords"] if kw in text]
            if hits or ioc.fraud_type == fraud_type:
                matched_types.append(fraud_type)
                matched_keywords.extend(hits[:3])
                score += int(rule["weight"])

        score = min(score, 30)
        indicators: list[str] = []
        if matched_keywords:
            indicators.append(
                f"Patron de fraude detectado ({', '.join(self._dedupe(matched_keywords)[:4])})"
            )
        return score, matched_types, indicators

    def _score_recurrence(self, reports: list[HistoricalReport]) -> tuple[int, list[str]]:
        if not reports:
            return 0, []

        score = min(20 + (len(reports) * 8), 45)
        indicators = [f"IoC reincidente: {len(reports)} reportes previos"]

        newest = max(self._to_aware(report.reported_at) for report in reports)
        age_days = (datetime.now(timezone.utc) - newest).days
        if age_days <= 7:
            score += 15
            indicators.append("Actividad recurrente en los ultimos 7 dias")
        elif age_days <= 30:
            score += 10
            indicators.append("Actividad recurrente en los ultimos 30 dias")
        elif age_days <= 90:
            score += 5
            indicators.append("Actividad recurrente en los ultimos 90 dias")

        return min(score, 50), indicators

    def _find_historical_reports(self, db: Session, ioc: IndicatorOfCompromise) -> list[HistoricalReport]:
        filters = []
        if ioc.domain:
            filters.append(FraudReport.domain == ioc.domain.strip())
        if ioc.bank_account:
            filters.append(FraudReport.bank_account == ioc.bank_account.strip())
        if ioc.phone_number:
            phone_clean = re.sub(r"\D", "", ioc.phone_number)
            if phone_clean:
                filters.append(FraudReport.phone_number.like(f"%{phone_clean[-10:]}"))

        if not filters:
            return []

        db_reports = db.query(FraudReport).filter(or_(*filters)).all()
        evidence: list[HistoricalReport] = []
        for report in db_reports:
            if ioc.domain and report.domain == ioc.domain.strip():
                evidence.append(self._historical_from_db_report(report, "domain"))
            if ioc.bank_account and report.bank_account == ioc.bank_account.strip():
                evidence.append(self._historical_from_db_report(report, "bank_account"))
            if ioc.phone_number and self._same_phone_number(ioc.phone_number, report.phone_number):
                evidence.append(self._historical_from_db_report(report, "phone_number"))
        return evidence

    def _historical_from_db_report(self, report: FraudReport, source: str) -> HistoricalReport:
        return HistoricalReport(
            reported_at=report.created_at or datetime.now(timezone.utc),
            fraud_type=(report.risk_level or "").lower() or None,
            source=source,
        )

    def _has_suspicious_tld(self, domain: Optional[str]) -> bool:
        if not domain:
            return False
        domain_lower = domain.lower().strip()
        return any(domain_lower.endswith(tld) for tld in SUSPICIOUS_TLDS)

    def _same_phone_number(self, left: Optional[str], right: Optional[str]) -> bool:
        if not left or not right:
            return False
        left_clean = re.sub(r"\D", "", left)
        right_clean = re.sub(r"\D", "", right)
        return bool(left_clean and right_clean and left_clean[-10:] == right_clean[-10:])

    def _normalize_text(self, value: str) -> str:
        normalized = value.lower()
        translation = str.maketrans("áéíóúñ", "aeioun")
        return normalized.translate(translation)

    def _to_aware(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def _level_for_score(self, score: int) -> str:
        if score <= 25:
            return "LOW"
        if score <= 50:
            return "MEDIUM"
        if score <= 75:
            return "HIGH"
        return "CRITICAL"

    def _dedupe(self, values: list[str]) -> list[str]:
        return list(dict.fromkeys(values))


def analizar_riesgo(
    db: Session,
    phone_number: Optional[str] = None,
    bank_account: Optional[str] = None,
    domain: Optional[str] = None,
    description: str = "",
) -> tuple[int, str, list[str]]:
    ioc = IndicatorOfCompromise(
        phone_number=phone_number,
        bank_account=bank_account,
        domain=domain,
        description=description,
    )
    assessment = RiskHeuristicEngine().evaluate_with_database(db=db, ioc=ioc)
    return assessment.score, assessment.level, assessment.indicators
