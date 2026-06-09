import sys
import os
from sqlalchemy.orm import Session

# Asegurar que Python reconozca la estructura de carpetas de 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.db import FraudReport  # Importación exacta desde db.py

def poblar_base_de_datos():
    db: Session = SessionLocal()
    
    try:
        # Purgar registros antiguos para evitar colisiones y asegurar datos limpios en los gráficos
        if db.query(FraudReport).count() > 0:
            print("[⚠] Registros previos detectados. Limpiando tabla 'fraud_reports'...")
            db.query(FraudReport).delete()
            db.commit()

        print("[⚙️] Inicializando inyección de Indicadores de Compromiso (IoCs) en AegisShield...")

        reportes_semilla = [
            # --- RIESGO ALTO ---
            {
                "phone_number": "+573142890112",
                "bank_account": "Nequi - 3142890112",
                "domain": "credito-rapido-co.xyz",
                "risk_level": "Alto",
                "risk_score": 95,
                "malicious_indicators": "TLD sospechoso, Coerción telefónica, Exfiltración",
                "description": "Aplicación 'SoluciónFinanciera'. Exfiltración de libreta de contactos y amenazas coactivas con montajes fotográficos vía WhatsApp. Esquema Gota a Gota digital."
            },
            {
                "phone_number": "+573219875432",
                "bank_account": "Bancolombia - 4550021832",
                "domain": "efectivo-inmediato.top",
                "risk_level": "Alto",
                "risk_score": 88,
                "malicious_indicators": "TLD sospechoso, Difamación masiva",
                "description": "Falso asesor de la app 'PlataYa'. Cobro extorsivo a contactos de referencia utilizando lenguaje amenazante y difamación en redes."
            },
            {
                "phone_number": "+573004567890",
                "bank_account": "Daviplata - 3004567890",
                "domain": "pesos-seguros.click",
                "risk_level": "Alto",
                "risk_score": 90,
                "malicious_indicators": "Suplantación judicial, Redirección maliciosa",
                "description": "Cobro coactivo ilegal vinculado al ecosistema 'ListoPréstamo'. Intimidación telefónica continua y suplantación de identidad judicial."
            },
            
            # --- RIESGO MEDIO ---
            {
                "phone_number": "+573115556677",
                "bank_account": None,
                "domain": "actualizacion-datos-seguridad.com",
                "risk_level": "Medio",
                "risk_score": 65,
                "malicious_indicators": "Smishing, Suplantación de entidad",
                "description": "Campaña de Smishing (SMS falso). Mensaje suplantando a entidad bancaria notificando bloqueo de cuenta para forzar la captura de credenciales."
            },
            {
                "phone_number": None,
                "bank_account": "Nequi - 3224001122",
                "domain": "sorteo-aniversario-banco.net",
                "risk_level": "Medio",
                "risk_score": 50,
                "malicious_indicators": "Phishing por cadena, Formulario engañoso",
                "description": "Phishing propagado por cadenas de WhatsApp simulando un falso premio corporativo para exfiltrar datos personales."
            },
            
            # --- RIESGO BAJO ---
            {
                "phone_number": None,
                "bank_account": None,
                "domain": "descarga-apk-segura.site",
                "risk_level": "Bajo",
                "risk_score": 25,
                "malicious_indicators": "Adware, Redirecciones continuas",
                "description": "Dominio con redirecciones sospechosas hacia servidores que alojan software de publicidad intrusiva (Adware) no verificado."
            }
        ]

        for data in reportes_semilla:
            nuevo_reporte = FraudReport(
                phone_number=data["phone_number"],
                bank_account=data["bank_account"],
                domain=data["domain"],
                risk_level=data["risk_level"],
                risk_score=data["risk_score"],
                malicious_indicators=data["malicious_indicators"],
                description=data["description"]
            )
            db.add(nuevo_reporte)
        
        db.commit()
        print(f"[✓] Éxito: Se han indexado {len(reportes_semilla)} vectores de ataque estructurales de forma dinámica.")

    except Exception as e:
        db.rollback()
        print(f"[❌] Error crítico durante la inyección de datos semilla: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    poblar_base_de_datos()