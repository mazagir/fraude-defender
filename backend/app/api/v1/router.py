from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.reports import router as reports_router

api_router = APIRouter()

# Incluir los sub-routers de la versión 1
api_router.include_router(auth_router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(reports_router, prefix="/reportes", tags=["Indicadores de Fraude"])
