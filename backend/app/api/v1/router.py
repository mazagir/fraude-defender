from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.telemetry import router as telemetry_router
from app.api.v1.endpoints.threat_intel import router as threat_intel_router


api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Autenticacion"])
api_router.include_router(reports_router, prefix="/reportes", tags=["Indicadores de Fraude"])
api_router.include_router(admin_router, prefix="/admin", tags=["Administracion"])
api_router.include_router(telemetry_router, prefix="/ws", tags=["Telemetria SOC"])
api_router.include_router(threat_intel_router, prefix="/threat-intel", tags=["Threat Intelligence"])
