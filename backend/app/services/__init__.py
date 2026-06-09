# Exponer los servicios de negocio de la plataforma AegisShield
from app.services.auth import registrar_usuario, login_usuario
from app.services.reports import (
    listar_reportes,
    crear_reporte,
    eliminar_reporte,
    registrar_ejecucion_contramedida,
    obtener_telemetria_defensa
)
from app.services.risk_engine import analizar_riesgo
