from datetime import datetime, timedelta, timezone

from app.services.risk_engine import (
    HistoricalReport,
    IndicatorOfCompromise,
    RiskHeuristicEngine,
)


def test_false_positive_benign_domain_stays_low():
    engine = RiskHeuristicEngine()

    assessment = engine.evaluate(
        IndicatorOfCompromise(
            domain="pagos.empresa-confiable.com",
            description="Consulta ordinaria de soporte sin evidencia maliciosa.",
        )
    )

    assert assessment.score == 13
    assert assessment.level == "LOW"


def test_low_risk_single_phone_without_malicious_context():
    engine = RiskHeuristicEngine()

    assessment = engine.evaluate(
        IndicatorOfCompromise(
            phone_number="+57 300 123 4567",
            description="Numero reportado por llamada perdida sin conversacion posterior.",
        )
    )

    assert assessment.score == 11
    assert assessment.level == "LOW"


def test_medium_risk_phishing_pattern_without_recurrence():
    engine = RiskHeuristicEngine()

    assessment = engine.evaluate(
        IndicatorOfCompromise(
            domain="seguridad-banco.example.com",
            description="Portal falso solicita verificar credenciales y OTP.",
        )
    )

    assert assessment.score == 33
    assert assessment.level == "MEDIUM"
    assert "phishing" in assessment.matched_fraud_types


def test_high_risk_suspicious_tld_and_extortion_patterns():
    engine = RiskHeuristicEngine()

    assessment = engine.evaluate(
        IndicatorOfCompromise(
            domain="financiera-rapida-montadeudas.xyz",
            description="Amenaza por WhatsApp con cobro abusivo de intereses.",
        )
    )

    assert assessment.score == 68
    assert assessment.level == "HIGH"
    assert "TLD altamente sospechoso" in assessment.indicators


def test_critical_risk_when_recent_recurrence_is_present():
    engine = RiskHeuristicEngine()
    now = datetime.now(timezone.utc)
    history = [
        HistoricalReport(reported_at=now - timedelta(days=2), source="domain"),
        HistoricalReport(reported_at=now - timedelta(days=4), source="phone_number"),
        HistoricalReport(reported_at=now - timedelta(days=20), source="bank_account"),
    ]

    assessment = engine.evaluate(
        IndicatorOfCompromise(
            phone_number="+57 300 999 0000",
            bank_account="Nequi 3009990000",
            domain="verificar-cartera.click",
            description="Campana de phishing con amenaza de deuda y pago inmediato.",
        ),
        historical_reports=history,
    )

    assert assessment.score == 100
    assert assessment.level == "CRITICAL"
    assert "IoC reincidente: 3 reportes previos" in assessment.indicators
