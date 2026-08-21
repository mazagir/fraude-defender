<div align="center">

# 🛡️ AgiShield AI | Anti-Fraud Intelligence Platform
### *Plataforma de Ciberseguridad Ciudadana y Mitigación de Fraude*

[![Status](https://img.shields.io/badge/Estado-Activo%20y%20Protegiendo-00e5b4?style=for-the-badge&logo=shield&logoColor=white)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-2563eb?style=for-the-badge&logo=fastapi&logoColor=white)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TS-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![DB](https://img.shields.io/badge/Database-PostgreSQL-3ECF8E?style=for-the-badge&logo=postgresql&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)]()
[![Licencia](https://img.shields.io/badge/Licencia-MIT-purple?style=for-the-badge)]()

**AgiShield AI** es tu Centro de Operaciones de Seguridad (SOC) ciudadano. Una solución para la detección proactiva, correlación y mitigación en tiempo real de infraestructura maliciosa (IoCs) y esquemas de fraude financiero como extorsiones, phishing y "gota a gota" en LATAM.

[🚀 Ver Demo en Vivo](https://frontend-mazagirs-projects.vercel.app) | [🐛 Reportar Bug](https://github.com/mazagir/fraude-defender/issues)

</div>

<br/>

> **"Defendiendo el ciberespacio financiero, un indicador de compromiso a la vez."**

---

## 🔥 Características Principales (Transformación SaaS)

*   🧠 **Análisis de Estafas Asistido por IA (Gemini 1.5 Flash)**: Integración directa para escanear y traducir amenazas complejas (URLs, SMS, WhatsApp, correos) a explicaciones empáticas y comprensibles para usuarios no técnicos, recomendando acciones inmediatas de autodefensa.
*   🔗 **5 Canales de Entrada Directa**: Herramientas integradas en el Home para detectar fraudes rápidamente:
    *   *Analizar URL*: Detección de phishing bancario.
    *   *Analizar SMS*: Escaneo de falsos empleos o envíos postales.
    *   *Analizar WhatsApp*: Mitigación de extorsiones y montadeudas.
    *   *Analizar Correo*: Verificación de remitentes y cuerpos sospechosos.
    *   *Escanear QR*: Decodificación de códigos físicos alterados (Quishing).
*   🏆 **Gamificación y Retención (Mi Perfil Seguro)**: Sistema de recompensas XP, reputación, niveles de usuario (como "Guardián de la Comunidad") e insignias digitales desbloqueables.
*   📜 **Historial Persistente de Escaneos**: Cada análisis queda guardado en tu perfil. Accedé desde el dashboard en cualquier momento aunque cierres sesión.
*   🌐 **Telemetría WebSocket en Vivo**: Reportes y escaneos se reflejan al instante en el Threat Intel Panel y SOC Command Center mediante un event bus asíncrono (sin polling, sin Redis).
*   🗺️ **Mapa de Amenazas de Latinoamérica**: Telemetría interactiva y alertas comunitarias localizadas en **Colombia, México, Perú, Chile y Argentina**.
*   🔐 **Autenticación de Dos Factores (2FA/TOTP)**: MFA para administradores usando códigos TOTP vía Google Authenticator, Authy, etc. Flujo de login con partial token y verificación en dos pasos.
*   🔒 **Rate Limiting Granular y Seguridad por Capas**: 7 niveles de rate limiting (5/min registro, 10/min login, 20/min IA, 30/min reportes, 200/min global) + headers de seguridad HTTP + dual auth (JWT + API Key).
*   📄 **Paginación en Todos los Endpoints**: Listados de reportes e historial con paginación server-side para escalar a miles de registros sin degradación.
*   🖥️ **Modo Desarrollador Aislado (SOC Command Center)**: Consola de telemetría, simulación de ataques SQLi/DDoS y base de datos cruda de IoCs oculta del flujo de usuario estándar.
*   ⚡ **TypeScript Estricto en Toda la App Frontend**: 0 errores de tipo con `strict: true`. Interfaces Props tipadas, hooks genéricos y tipos compartidos entre servicios, constantes y componentes.

---

## 📸 Funcionalidades Clave

<div align="center">

### 1. 🛡️ Detector de Estafas IA (5 canales de entrada)
<img src="docs/screenshots/detector-estafas.png" alt="AgiShield Detector de Estafas Home" width="100%">
*Detector unificado sin registro para URLs, SMS, WhatsApp, Correo y QR, integrado con Gemini AI.*

<br/>

### 2. 🗺️ Alertas y Mapa de Calor de la Comunidad LATAM
<img src="docs/screenshots/mapa-comunidad.png" alt="AgiShield Mapa de Calor LATAM" width="100%">
*Mapa regional interactivo que detalla tipos de estafa y volumen de incidentes en Colombia, México, Perú, Chile y Argentina.*

<br/>

### 3. 🔐 Autenticación de Dos Factores (2FA/TOTP)
<img src="docs/screenshots/mfa-setup.png" alt="AgiShield 2FA Setup" width="100%">
*Configuración de MFA con QR escaneable, verificación de código TOTP de 6 dígitos y flujo de login en dos pasos.*

<br/>

### 4. 📚 Documentación Interactiva de la API (B2B Core)
<img src="docs/screenshots/api-docs-header.png" alt="AgiShield API Swagger Header" width="100%">
*Swagger UI de la plataforma para integraciones y auditorías de seguridad corporativa.*

</div>

---

## 🧠 Arquitectura en Tiempo Real

```
Usuario (Frontend React + TypeScript)
  │
  ├─ 🔍 POST /api/v1/reportes/analizar → Gemini AI / Heurístico local
  │   └─ 📡 EventBus (pub/sub asíncrono) → WebSocket clients en vivo
  │       └─ 🖥️ Threat Intel Panel se actualiza solo
  │
  ├─ 📝 POST /api/v1/reportes → Risk Engine (score 0-100)
  │   └─ 📡 EventBus → SOC Command Center + Mapa LATAM
  │
  ├─ 👤 POST /api/v1/auth/login (con MFA)
  │   ├─ Sin 2FA → JWT directo
  │   └─ Con 2FA → partial_token → POST /verify-login → JWT final
  │
  ├─ 🔐 POST /api/v1/auth/mfa/setup → QR + Secret TOTP
  ├─ 🔐 POST /api/v1/auth/mfa/enable  → Activar 2FA
  ├─ 🔐 POST /api/v1/auth/mfa/disable → Desactivar 2FA
  │
  └─ 📜 GET /api/v1/scan-history → Historial persistente (paginado)
      └─ Dashboard → XP, badges, gamificación
```

**EventBus**: Pub/sub en memoria con `asyncio.Queue`. Sin Redis, sin polling, 0 dependencias externas. Escalable a Redis pub/swapping `event_bus.py` cuando el proyecto crezca.

---

## 🛠 Stack Tecnológico de Vanguardia

AgiShield AI está construido con las mejores herramientas de la industria para asegurar latencia ultra-baja y escalabilidad masiva:

| Capa | Tecnologías | Descripción |
| :--- | :--- | :--- |
| **Backend** | Python 3.13, FastAPI, SQLAlchemy, PostgreSQL | Arquitectura asíncrona con event bus, rate limiting, motor heurístico y MFA TOTP. |
| **Frontend** | React 19, TypeScript (strict), Vite, Tailwind CSS, Recharts, Framer Motion | Interfaz *Glassmorphism* con tipos estáticos, WebSocket, gamificación y MFA UI. |
| **Base de Datos** | PostgreSQL (Supabase) | PostgreSQL 17 en la nube. Alternativas: SQLite (local), Neon, direct. |
| **Tiempo Real** | WebSocket + EventBus asyncio.Queue | Pub/sub in-memory sin Redis. Eventos en <1s a todos los clientes. |
| **Infraestructura** | Render (Backend), Vercel (Frontend) | Backend always-on en Render + DB en Supabase. Frontend estático en Vercel. |
| **Seguridad** | JWT + API Key, MFA TOTP, rate limiting, Pydantic, bcrypt | 7 niveles de rate limit, 2FA con pyotp, headers HTTP estrictos. |

---

## 🚀 Despliegue y Ejecución Local

¿Quieres levantar tu propio entorno en minutos? AgiShield AI está diseñado con principios de Arquitectura Limpia para ser plug-and-play.

### 1️⃣ Levantar el Backend (FastAPI + Gemini AI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # En Windows
# source venv/bin/activate  # En Linux/macOS
pip install -r requirements.txt
cp .env.template .env   # Copia la plantilla y edita las variables
uvicorn app.main:app --reload
```

### 2️⃣ Levantar el Frontend (React + TypeScript + Vite)
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```

La app estará disponible en **http://localhost:5173** y el API en **http://localhost:8000/docs**.

### 🐳 Docker (backend + frontend con Supabase)
Desde la raíz del proyecto:
```bash
docker compose up --build
```
El backend usa `backend/.env` (Supabase). El frontend recibe `VITE_API_URL=http://localhost:8000`.

### ☁️ Desplegar Backend en Render
1. Conecta el repo en [render.com](https://render.com) y usa el Blueprint `render.yaml`.
2. Configura las variables secretas: `JWT_SECRET_KEY`, `SUPABASE_DATABASE_URL`, `ALLOWED_API_KEYS`, `BACKEND_CORS_ORIGINS`.
3. El servicio quedará en `https://agishield-api.onrender.com/health`.

### ▲ Desplegar Frontend en Vercel
1. Root directory: `frontend`
2. Variable de build: `VITE_API_URL=https://agishield-api.onrender.com`

### 3️⃣ Verificar Tipos TypeScript (Opcional)
```bash
cd frontend
npx tsc --noEmit   # 0 errores esperados
npm run build      # Build de producción
```

---

## ⚙️ Variables de Entorno

Copia `.env.template` como `.env` en la carpeta `backend/` y completa los valores:

| Variable | Descripción | Obligatorio |
| :--- | :--- | :--- |
| `JWT_SECRET_KEY` | Secreto para firmar tokens JWT (mín. 32 chars). Genera con: `python -c "import secrets; print(secrets.token_hex(32))"` | **Sí** |
| `DB_PROVIDER` | Proveedor activo: `sqlite` \| `supabase` \| `neon` \| `direct` | No (default: `direct`) |
| `SUPABASE_DATABASE_URL` | URI de conexión al pooler de Supabase | Si `DB_PROVIDER=supabase` |
| `NEON_DATABASE_URL` | URI de conexión a Neon PostgreSQL | Si `DB_PROVIDER=neon` |
| `DATABASE_URL` | URI genérica (SQLite por defecto en local) | No |
| `ALLOWED_API_KEYS` | API Keys B2B separadas por comas | No (default: `aegis_dev_api_key_2026`) |
| `GEMINI_API_KEY` | API Key de Google Gemini AI | No (fallback heurístico) |
| `TWILIO_AUTH_TOKEN` | Auth Token de Twilio para validar la firma del webhook de WhatsApp (`/api/v1/webhooks/whatsapp`) | No (webhook sin validación si se omite) |
| `ENVIRONMENT` | `development` \| `production` \| `testing` | No (default: `development`) |
| `BACKEND_CORS_ORIGINS` | Orígenes permitidos (URL de Vercel) | Recomendado en producción |
| `MFA_ENABLED` | Habilitar autenticación de dos factores (2FA/TOTP) | No (default: `true`) |

### Frontend (Vercel / local)

| Variable | Descripción | Obligatorio |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL del backend Render (ej. `https://agishield-api.onrender.com`) | Sí en producción |
| `VITE_POSTHOG_KEY` | Project API Key de PostHog para analítica de producto | No (sin key = sin tracking) |
| `VITE_POSTHOG_HOST` | Host de ingesta de PostHog (default: `https://us.i.posthog.com`) | No |

> [!IMPORTANT]
> `JWT_SECRET_KEY` es obligatoria. El servidor no arrancará sin ella en producción.

---

## 🐘 Configuración de Base de Datos (Supabase)

1. Crea un proyecto en **[supabase.com](https://supabase.com)**
2. Ve a **Project Settings → Database → Connection Pooling**
3. Copia la URI del pooler (Session mode, puerto 5432):
   ```
   postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-REGION.pooler.supabase.com:5432/postgres
   ```
4. En tu `.env`:
   ```env
   DB_PROVIDER=supabase
   SUPABASE_DATABASE_URL=<URI copiada>
   ```
5. Verifica con: `python tools/verify_db.py`

> **Neon** también es compatible: cambia `DB_PROVIDER=neon` y define `NEON_DATABASE_URL`.

---

## 📋 Changelog

### v2.1 — Engagement & Datos Reales

*   📲 **Botón "Compartir resultado"**: tras cada escaneo puedes compartir el veredicto de la IA vía Web Share API nativa (WhatsApp, Telegram, etc.) con fallback automático a copiar al portapapeles en navegadores de escritorio.
*   🗺️ **Mapa LATAM con datos reales**: el mapa de amenazas comunitarias ahora se alimenta del endpoint `/api/v1/threat-intel` (incidentes reportados por la comunidad, actualizado cada 2 minutos) en lugar de datos fijos. Los valores por defecto se mantienen como fallback si la API no responde.
*   📊 **Analítica de producto opcional (PostHog)**: si defines `VITE_POSTHOG_KEY`, se activa tracking de eventos clave (`scan_completed`, `result_shared`, `user_registered`, `user_logged_in`, `report_created`) con autocaptura. Sin key, la app funciona igual y no se carga ningún script de terceros (import dinámico, bundle intacto).
*   🤖 **Bot de WhatsApp vía Twilio**: nuevo endpoint público `POST /api/v1/webhooks/whatsapp` que responde TwiML XML analizando cualquier texto sospechoso que envíe el usuario al número Twilio (motor Gemini + fallback heurístico). Valida firma `X-Twilio-Signature` si configuras `TWILIO_AUTH_TOKEN`. Incluye 6 tests nuevos (`backend/tests/test_webhooks.py`) — suite completa: **41 passed**.
*   📄 **Guía de uso**: `docs/Guia-Uso-AegisShield.pdf` — manual de usuario para jurado/usuarios finales.

---

<div align="center">
  Hecho con 💻 y 🛡️ por la comunidad para combatir el fraude digital en Latinoamérica. <br/>
  <strong>Si este proyecto te ha resultado útil o interesante, no olvides dejar una ⭐ en GitHub.</strong>
</div>