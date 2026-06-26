<div align="center">

<img src="https://raw.githubusercontent.com/mazagir/fraude-defender/main/docs/screenshots/hero-banner.png" alt="AegisShield Hero Banner" width="100%">

# 🛡️ AegisShield | Anti-Fraud Intelligence Platform
### *Plataforma de Ciberseguridad de Próxima Generación y Mitigación de Fraude*

[![Status](https://img.shields.io/badge/Estado-Activo%20y%20Protegiendo-00e5b4?style=for-the-badge&logo=shield&logoColor=white)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-2563eb?style=for-the-badge&logo=fastapi&logoColor=white)]()
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![DB](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)]()
[![Licencia](https://img.shields.io/badge/Licencia-MIT-purple?style=for-the-badge)]()

**AegisShield** es tu Centro de Operaciones de Seguridad (SOC) definitivo. Una solución diseñada arquitectónicamente para la detección proactiva, correlación instantánea y mitigación en tiempo real de infraestructura maliciosa (IoCs) y esquemas de fraude financiero como extorsiones y "gota a gota".

[🚀 Ver Demo en Vivo](https://fraude-defender-1176.vercel.app) | [🐛 Reportar Bug](https://github.com/mazagir/fraude-defender/issues)

<br/>

<img src="docs/screenshots/agishield_demo.gif" alt="AegisShield Demo" width="100%">

</div>

<br />

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
*   📜 **Historial Persistente de Escaneos**: Cada análisis queda guardado en tu perfil (Supabase). Accedé desde el dashboard en cualquier momento aunque cierres sesión.
*   🌐 **Telemetría WebSocket en Vivo**: Reportes y escaneos se reflejan al instante en el Threat Intel Panel y SOC Command Center mediante un event bus asíncrono (sin polling, sin Redis).
*   🗺️ **Mapa de Amenazas de Latinoamérica**: Telemetría interactiva y alertas comunitarias localizadas en **Colombia, México, Perú, Chile y Argentina**.
*   🔐 **Rate Limiting Granular y Seguridad por Capas**: 7 niveles de rate limiting (5/min registro, 10/min login, 20/min IA, 30/min reportes, 200/min global) + headers de seguridad HTTP + dual auth (JWT + API Key).
*   📄 **Paginación en Todos los Endpoints**: Listados de reportes e historial con paginación server-side para escalar a miles de registros sin degradación.
*   🖥️ **Modo Desarrollador Aislado (SOC Command Center)**: Consola de telemetría, simulación de ataques SQLi/DDoS y base de datos cruda de IoCs oculta del flujo de usuario estándar.

---

## 📸 Capturas de Pantalla (Nueva Interfaz de Usuario)

<div align="center">

### 1. 🛡️ Detector de Estafas en el Home (Acciones Rápidas con IA)
<img src="docs/screenshots/detector-estafas.png" alt="AgiShield Detector de Estafas Home" width="100%">
*Detector unificado sin registro para URLs, SMS, WhatsApp, Correo y QR, integrado con Gemini AI.*

<br/>

### 2. 🗺️ Alertas y Mapa de Calor de la Comunidad LATAM
<img src="docs/screenshots/mapa-comunidad.png" alt="AgiShield Mapa de Calor LATAM" width="100%">
*Mapa regional interactivo que detalla tipos de estafa y volumen de incidentes en Colombia, México, Perú, Chile y Argentina.*

<br/>

### 3. 📚 Documentación Interactiva de la API (B2B Core)
<img src="docs/screenshots/api-docs-header.png" alt="AegisShield API Swagger Header" width="100%">
*Swagger UI de la plataforma para integraciones y auditorías de seguridad corporativa.*

<br/>

### 4. ⚙️ Endpoints del SOC & Endpoint /analizar
<img src="docs/screenshots/api-docs-endpoints.png" alt="AegisShield API Endpoints" width="100%">
*Nuevos endpoints públicos de análisis de sospechas por IA integrados bajo el estándar OpenAPI 3.1.*

</div>

---

## 🧠 Arquitectura en Tiempo Real

```
Usuario (Frontend React)
  │
  ├─ 🔍 POST /api/v1/reportes/analizar → Gemini AI / Heurístico local
  │   └─ 📡 EventBus (pub/sub asíncrono) → WebSocket clients en vivo
  │       └─ 🖥️ Threat Intel Panel se actualiza solo
  │
  ├─ 📝 POST /api/v1/reportes → Risk Engine (score 0-100)
  │   └─ 📡 EventBus → SOC Command Center + Mapa LATAM
  │
  ├─ 👤 POST /api/v1/auth/login → JWT + API Key (dual auth)
  │
  └─ 📜 GET /api/v1/scan-history → Historial persistente (paginado)
      └─ Dashboard → XP, badges, gamificación
```

**EventBus**: Pub/sub en memoria con `asyncio.Queue`. Sin Redis, sin polling, 0 dependencias externas. Escalable a Redis pub/swapping `event_bus.py` cuando el proyecto crezca.

---

## 🛠 Stack Tecnológico de Vanguardia

AegisShield está construido con las mejores herramientas de la industria para asegurar latencia ultra-baja y escalabilidad masiva:

| Capa | Tecnologías | Descripción |
| :--- | :--- | :--- |
| **Backend** | Python 3.13, FastAPI, SQLAlchemy, PostgreSQL | Arquitectura asíncrona con event bus, rate limiting y motor heurístico. |
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Framer Motion | Interfaz *Glassmorphism* con WebSocket, gamificación e historial persistente. |
| **Base de Datos** | Supabase PostgreSQL (Pooler) | PostgreSQL 17 serverless. 3 proveedores: SQLite, Supabase, Neon. |
| **Tiempo Real** | WebSocket + EventBus asyncio.Queue | Pub/sub in-memory sin Redis. Eventos en <1s a todos los clientes. |
| **Infraestructura** | Railway (Backend), Vercel (Frontend), Supabase (DB) | CI/CD automático al hacer push a `main`. Docker + Railway. |
| **Seguridad** | JWT + API Key, rate limiting, Pydantic, bcrypt | 7 niveles de rate limit, headers HTTP estrictos, validación de fuerza bruta. |

---

## 🚀 Despliegue y Ejecución Local

¿Quieres levantar tu propio entorno en minutos? AegisShield está diseñado con principios de Arquitectura Limpia para ser plug-and-play.

### 1️⃣ Levantar el Backend (FastAPI + Gemini AI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # En Windows
# source venv/bin/activate  # En Linux/macOS
pip install -r requirements.txt
cp ../.env.template .env   # Copia la plantilla y edita las variables
uvicorn app.main:app --reload
```

### 2️⃣ Levantar el Frontend (React + Vite)
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```

La app estará disponible en **http://localhost:5173** y el API en **http://localhost:8000/docs**.

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
| `ENVIRONMENT` | `development` \| `production` \| `testing` | No (default: `development`) |

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

<div align="center">
  Hecho con 💻 y 🛡️ por la comunidad para combatir el fraude digital en Latinoamérica. <br/>
  <strong>Si este proyecto te ha resultado útil o interesante, no olvides dejar una ⭐ en GitHub.</strong>
</div>