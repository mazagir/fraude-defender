<div align="center">

# 🛡️ AegisShield (Fraude Defender PRO)

**Plataforma avanzada de inteligencia de amenazas y monitoreo colaborativo contra fraudes financieros y Montadeudas**

[![Estado](https://img.shields.io/badge/estado-producción%20activo-brightgreen?style=for-the-badge)](https://fraude-defender-1176.vercel.app)
[![Frontend](https://img.shields.io/badge/Vercel-deployed-black?style=for-the-badge&logo=vercel)](https://fraude-defender-1176.vercel.app)
[![Backend](https://img.shields.io/badge/Render-live-purple?style=for-the-badge&logo=render)](https://fraude-defender-api.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.13-blue?style=for-the-badge&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)

[🚀 Ver App en Vivo](https://fraude-defender-1176.vercel.app) · [📄 Documentación API (Swagger)](https://fraude-defender-api.onrender.com/docs) · [🐛 Reportar Bug](https://github.com/mazagir/fraude-defender/issues)

</div>

---

## 📌 ¿Qué es AegisShield?

AegisShield (originalmente Fraude Defender) es una plataforma de **ciberseguridad colaborativa e inteligencia de amenazas** diseñada específicamente para combatir y mitigar las redes de extorsión digital y aplicaciones de préstamos fraudulentas conocidas como *Montadeudas*. 

La plataforma permite registrar, analizar y visualizar Indicadores de Compromiso (IoCs) como números telefónicos, cuentas bancarias de recaudo y dominios de phishing utilizados por los atacantes.

> 🇨🇴 Enfocado en mitigar el fraude financiero digital que afecta al ecosistema colombiano y de LATAM.

---

## 🌐 Demo en Vivo

| Servicio | URL |
|---|---|
| 🖥️ Aplicación Web | https://fraude-defender-1176.vercel.app |
| ⚙️ API REST (Base) | https://fraude-defender-api.onrender.com |
| 📄 Swagger UI | https://fraude-defender-api.onrender.com/docs |

> ⚠️ **Nota:** El backend está desplegado en la infraestructura gratuita de Render. Si no responde al primer intento, por favor espera de 30 a 60 segundos a que el servidor se reactive automáticamente.

---

## 📸 Capturas de Pantalla

### 🏠 Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)
*Métricas en tiempo real: reportes totales, riesgo alto, dominios detectados y números sospechosos con gráficas de barras y torta.*

### 📋 Módulo de Reportes
![Reportes](docs/screenshots/reportes.png)
*Tabla completa con filtros avanzados por nivel de riesgo y búsqueda por teléfono, dominio o descripción.*

### ⚠ Amenazas Activas
![Amenazas](docs/screenshots/amenazas.png)
*Dominios y teléfonos más reportados, con listado priorizado de amenazas de alto riesgo.*

### 🧠 Threat Intelligence
![Threat Intel](docs/screenshots/threatintel.png)
*Listas negras de dominios, teléfonos y cuentas bancarias. Detección automática de patrones de riesgo.*

### ⚙ Configuración
![Configuración](docs/screenshots/configuracion.png)
*Gestión de reglas de seguridad activables/desactivables y administración de API keys.*

### ➕ Registrar Reporte
![Formulario](docs/screenshots/formulario.png)
*Formulario para registrar nuevos indicadores de fraude con validación en tiempo real.*

### 📡 API REST
![API Docs](docs/screenshots/api-docs.png)
*Documentación interactiva generada automáticamente con Swagger UI / OpenAPI 3.1.*

---

## ✨ Funcionalidades y Capacidades

- **Dashboard de Monitoreo**: Telemetría visual en tiempo real de amenazas y métricas agregadas por severidad.
- **Threat Intelligence**: Listas negras dinámicas y análisis sintáctico de firmas de fraude.
- **Motor de Riesgo Heurístico**: Calcula automáticamente una puntuación de riesgo (0-100) basándose en la reputación de los TLDs de dominio, duplicidad de teléfonos/bancos en BD y análisis semántico de keywords del reporte.
- **Seguridad B2B y API Keys**: Soporte para autenticación por cabecera HTTP (`X-API-KEY`) para integraciones con microservicios externos y automatizaciones.
- **Defensa Activa (Envenenador de Datos)**: Telemetría de contramedidas para reportar ejecuciones de scripts distractores (decoys) que inyectan identidades falsas en las bases de datos de los extorsionadores.

---

## 🏗️ Arquitectura de Software

El backend ha sido refactorizado siguiendo los principios de **Clean Architecture** (Arquitectura Limpia) para independizar la infraestructura de la lógica de negocio y garantizar la mantenibilidad.

```text
fraude-defender/
├── backend/                        # API REST en Python (FastAPI)
│   ├── app/
│   │   ├── main.py                 # Inicializador y configuración de la aplicación
│   │   ├── api/                    # Capa de Presentación (Controladores HTTP)
│   │   │   ├── deps.py             # Inyección de dependencias (Auth JWT, API Key, DB)
│   │   │   └── v1/
│   │   │       ├── router.py       # Enrutador centralizado
│   │   │       └── endpoints/      # Endpoints versionados (auth.py, reports.py)
│   │   ├── core/                   # Capa de Infraestructura Transversal
│   │   │   ├── config.py           # Configuración con Pydantic Settings
│   │   │   ├── database.py         # Conexión SQLAlchemy
│   │   │   └── security.py         # Criptografía, JWT y password hashing
│   │   ├── models/                 # Capa de Dominio (Modelos)
│   │   │   ├── db.py               # Tablas base de datos (User, FraudReport)
│   │   │   └── schemas.py          # Esquemas Pydantic
│   │   ├── services/               # Capa de Aplicación (Lógica de negocio)
│   │   │   ├── auth.py             # Casos de uso de autenticación de analistas
│   │   │   ├── reports.py          # Casos de uso de gestión de reportes y contramedidas
│   │   │   └── risk_engine.py      # Motor inteligente de scoring de riesgo
│   │   └── utils/                  # Capa de Utilidades
│   │       └── generator.py        # Generador de vCards y teléfonos ficticios
│   ├── tests/                      # Suite de pruebas automatizadas
│   │   └── test_api.py
│   ├── tools/                      # Scripts de automatización y binarios ADB
│   │   └── poison_payload.py       # Payload para envenenar DB de apps maliciosas
│   └── requirements.txt
├── frontend/                       # Interfaz SPA en React (Vite)
│   └── src/
│       ├── App.jsx                 # SPA React principal
│       └── services/
│           └── api.js              # Cliente API y cabeceras
└── docs/                           # Documentación y Capturas
```

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend** | React (Vite) | SPA reactiva y componentes modulares de alto desempeño. |
| **Estilos** | Tailwind CSS | Sistema de diseño responsivo basado en utilidades de CSS. |
| **Animaciones** | Framer Motion | Transiciones e interacciones fluidas entre vistas. |
| **Gráficas** | Recharts | Renderizado interactivo de telemetría y métricas de riesgo. |
| **Backend** | Python + FastAPI | API REST de alto rendimiento con generación automática de OpenAPI. |
| **ORM** | SQLAlchemy | Capa de abstracción de base de datos segura contra inyecciones SQL. |
| **Validación** | Pydantic | Validación estricta y tipado de payloads JSON en entrada y salida. |
| **Base de datos**| PostgreSQL / SQLite | Persistencia relacional óptima para desarrollo y producción. |

---

## ⚙️ Instalación Local

### Requisitos Previos
- Node.js 18+
- Python 3.10+
- PostgreSQL (opcional, por defecto local usa SQLite)

### 1. Clonar el repositorio
```bash
git clone https://github.com/mazagir/fraude-defender.git
cd fraude-defender
```

### 2. Levantar el Backend
```bash
cd backend
python -m venv venv

# Activar Entorno Virtual (Windows)
.\venv\Scripts\activate

# Activar Entorno Virtual (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar Suite de Pruebas Automatizadas
python tests/test_api.py
```

Crea un archivo `.env` en la raíz de `backend/` si deseas conectarte a PostgreSQL (si no se define, el backend levantará automáticamente una base de datos local SQLite `aegis_shield.db`):
```env
DATABASE_URL=postgresql://usuario:password@localhost/fraude_defender_db
SECRET_KEY=clave_super_secreta_jwt_de_produccion
ALLOWED_API_KEYS=aegis_dev_api_key_2026,key_b2b_produccion
```

Inicia el servidor web FastAPI:
```bash
uvicorn app.main:app --reload
```
- API disponible en: `http://localhost:8000`
- Swagger UI interactivo en: `http://localhost:8000/docs`

### 3. Levantar el Frontend
```bash
cd ../frontend
npm install
```

Crea o edita el archivo `frontend/src/services/api.js` (o `.env` si aplica) para apuntar a la dirección local del backend:
```javascript
const API = "http://localhost:8000";
```

Inicia el servidor de desarrollo Vite:
```bash
npm run dev
```
- Frontend interactivo disponible en: `http://localhost:5173`

---

## 📡 API Reference (Endpoints principales)

AegisShield soporta versionado centralizado. Se puede acceder a los recursos mediante el prefijo `/api/v1/` o mediante las rutas legadas sin prefijo (mantenidas por compatibilidad retroactiva).

### Autenticación (`/api/v1/auth`)

| Método | Endpoint | Cabecera Auth | Descripción |
|---|---|---|---|
| `POST` | `/registro` | Ninguna | Registra un nuevo analista de ciberseguridad. |
| `POST` | `/login` | Ninguna | Valida credenciales y genera un token Bearer JWT. |
| `GET` | `/me` | `Bearer <JWT>` | Retorna los detalles del analista autenticado. |

### Indicadores de Fraude (`/api/v1/reportes`)

| Método | Endpoint | Cabecera Auth | Descripción |
|---|---|---|---|
| `GET` | `/` | `Bearer <JWT>` o `X-API-KEY` | Obtiene la lista completa de reportes de IoCs ordenados cronológicamente. |
| `POST` | `/` | `Bearer <JWT>` o `X-API-KEY` | Registra un nuevo IoC. El motor evalúa y asigna el riesgo automáticamente. |
| `DELETE`| `/{id}` | `Bearer <JWT>` o `X-API-KEY` | Elimina un reporte por su ID de base de datos. |
| `POST` | `/contramedida` | Ninguna | Endpoint público para reportar la inyección de señuelos por ADB. |
| `GET` | `/metricas/contramedidas` | Ninguna | Endpoint público para leer telemetría de contramedidas activas. |

---

## 🔐 Cabeceras de Seguridad Permitidas

Para integraciones externas o scripts (B2B):
- Cabecera: `X-API-KEY`
- Valor: Cualquier llave configurada en la variable de entorno `ALLOWED_API_KEYS`.

---

## 🗺️ Roadmap de la Plataforma

- [x] Dashboard con métricas visuales en tiempo real.
- [x] Gestión colaborativa de reportes de fraude e indicadores.
- [x] Autenticación de analistas mediante firmas de tokens JWT.
- [x] Soporte para API Keys de integración externa (B2B).
- [x] Refactorización de código a Arquitectura Limpia (Clean Architecture).
- [x] Motor dinámico de detección de severidad de amenazas.
- [ ] Notificaciones por canal de mensajería (Slack/Discord) al detectar reportes de riesgo Crítico.
- [ ] Integración de WebSockets para actualizar métricas en caliente.
- [ ] Exportación de reportes forenses en formato PDF/CSV.
- [ ] Aplicación móvil nativa para reportar IoCs desde Android/iOS.

---

## 🤝 Contribuir

Si deseas colaborar con el desarrollo de AegisShield:
1. Realiza un Fork del repositorio.
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`.
3. Haz un commit con tus cambios: `git commit -m "feat: agregar validaciones avanzadas"`.
4. Envía la rama a GitHub: `git push origin feature/nueva-funcionalidad`.
5. Abre una solicitud de extracción (Pull Request) hacia la rama principal.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT © 2026 [Mazagir](https://github.com/mazagir).

---

<div align="center">

**Desarrollado con ❤️ para blindar a las comunidades frente a las redes de extorsión digital y fraude financiero**

⭐ Si esta plataforma te es de utilidad para investigaciones o defensa, ¡danos una estrella en GitHub!

</div>
