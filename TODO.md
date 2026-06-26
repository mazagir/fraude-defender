# 🛡️ AegisShield — Estado de Tareas de Producción

## 📋 Checklist de Hardening de Producción

- [x] **🔴 CRÍTICO 1 — Routers Duplicados (`main.py`)**
  - [x] Eliminar los `include_router` redundantes y mantener alias legacy documentados con `include_in_schema=False`.
  - [x] Actualizar peticiones del frontend (`useAppLogic.js` y `LoginView.jsx`) para que usen la ruta versionada `/api/v1/auth/login`.
- [x] **🔴 CRÍTICO 2 — Secret Key Hardcodeada (`config.py`)**
  - [x] Eliminar fallback por defecto de JWT Secret Key.
  - [x] Implementar verificación estricta que detiene el servidor si `JWT_SECRET_KEY` no está en el entorno.
  - [x] Crear un `.env.template` y documentar variables requeridas.
- [x] **🔴 CRÍTICO 3 — Limpieza de `services/reports.py`**
  - [x] Eliminar imports no utilizados (`APIRouter`, `Depends`, `get_db`) y la instancia muerta `router = APIRouter()`.
- [x] **🟡 MEDIO 1 — Dependencias de `bcrypt` en `requirements.txt`**
  - [x] Eliminar la versión fija conflictiva `bcrypt==4.0.1`.
  - [x] Agregar dependencias requeridas para producción y testing: `slowapi` y `pytest-asyncio`.
- [x] **🟡 MEDIO 2 — Cobertura de Tests**
  - [x] Crear suite de pruebas de integración robusta (`test_extended.py`).
  - [x] Probar endpoints de autenticación, rate limiting, lógica de IoCs, análisis heurístico y fallback de Gemini.
  - [x] Confirmar que las 34 pruebas pasan con éxito (`pytest` y `test_api.py`).
- [x] **🟡 MEDIO 3 — Rate Limiting (`slowapi`)**
  - [x] Configurar límite global en `main.py` (200 req/min).
  - [x] Aplicar límites granulares estrictos: registro (5/min), login (10/min), análisis IA (20/min).
- [x] **🟡 MEDIO 4 — Logging Estructurado**
  - [x] Configurar logging centralizado en formato JSON en `main.py`.
  - [x] Registrar eventos de seguridad críticos en `auth.py` y `deps.py` (ej. `[LOGIN_FALLIDO]`, `[API_KEY_INVALIDA]`, `[REGISTRO_DUPLICADO]`).
- [x] **🟡 MEDIO 5 — SQLite Warning en Producción**
  - [x] Detectar si se está usando SQLite con `ENVIRONMENT=production` en el startup y emitir advertencia crítica.
- [x] **🟢 BAJO 1 — Archivos Huérfanos**
  - [x] Eliminar el archivo legacy `frontend/src/AppVercelSafe.jsx`.
- [x] **🟢 BAJO 2 — Documentación e Instrucciones**
  - [x] Actualizar el `README.md` detallando variables de entorno obligatorias y setup en Render (PostgreSQL).
  - [x] Crear un script/instrucciones claras para capturas de pantalla (`docs/screenshots/`).
- [x] **🟢 BAJO 3 — Verificación y Despliegue**
  - [x] Ejecutar build de producción del frontend (`npm run build`) exitosamente.
  - [x] Realizar commits en Git del estado final.

## 🚀 Próximos Pasos (Post-Lanzamiento)
- [ ] Implementar autenticación multifactor (MFA) para cuentas con rol de administrador.
- [ ] Configurar alertas por correo electrónico/Slack en caso de ataques simulados o ráfagas de falsos IoCs.
- [ ] Migrar el frontend de JavaScript a TypeScript.
- [ ] Agregar extensión de navegador Chrome para escaneo en tiempo real.
- [ ] Leaderboard semanal por país para gamificación social.
