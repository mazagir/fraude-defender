<div align="center">

# 🛡 Fraude Defender

**Plataforma de inteligencia y monitoreo para detectar fraudes de aplicaciones de préstamos (Montadeudas)**

[![Estado](https://img.shields.io/badge/estado-beta%20activo-brightgreen?style=for-the-badge)](https://fraude-defender-1176.vercel.app)
[![Frontend](https://img.shields.io/badge/Vercel-deployed-black?style=for-the-badge&logo=vercel)](https://fraude-defender-1176.vercel.app)
[![Backend](https://img.shields.io/badge/Render-live-purple?style=for-the-badge&logo=render)](https://fraude-defender-api.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.14-blue?style=for-the-badge&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)

[🚀 Ver App en Vivo](https://fraude-defender-1176.vercel.app) · [📄 Documentación API](https://fraude-defender-api.onrender.com/docs) · [🐛 Reportar Bug](https://github.com/mazagir/fraude-defender/issues)

</div>

---

## 📌 ¿Qué es Fraude Defender?

Fraude Defender es una herramienta de **ciberseguridad colaborativa** diseñada para combatir las aplicaciones de préstamos fraudulentas conocidas como *Montadeudas*. Permite registrar, analizar y visualizar indicadores de compromiso (IoCs) como números de teléfono, dominios maliciosos y cuentas bancarias usadas por estafadores.

> 🇨🇴 Enfocado en el contexto colombiano donde este tipo de fraude ha afectado a miles de personas.

---

## 🌐 Demo en Vivo

| Servicio | URL |
|---|---|
| 🖥 Aplicación web | https://fraude-defender-1176.vercel.app |
| ⚙ API REST | https://fraude-defender-api.onrender.com |
| 📄 Swagger UI | https://fraude-defender-api.onrender.com/docs |

> ⚠️ **Nota:** El backend usa plan gratuito de Render. Si no responde al primer intento, espera 30-60 segundos — el servidor se duerme por inactividad.

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

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| 📊 **Dashboard** | Métricas en tiempo real, gráfica de barras y torta por nivel de riesgo |
| 📋 **Reportes** | Tabla con filtros avanzados por riesgo, teléfono, dominio y descripción |
| ⚠ **Amenazas** | Top de dominios y teléfonos más reportados, listado de alto riesgo |
| 🧠 **Threat Intel** | Listas negras automáticas y detección de patrones maliciosos |
| ⚙ **Configuración** | Reglas de seguridad toggle y gestión de API keys |
| ➕ **Nuevo Reporte** | Formulario modal para registrar IoCs con validación |

---

## 🏗 Arquitectura

```
fraude-defender/
├── backend/                  # API REST
│   ├── app/
│   │   ├── main.py           # Endpoints FastAPI
│   │   ├── models.py         # Modelos SQLAlchemy
│   │   ├── schemas.py        # Validación Pydantic
│   │   └── database.py       # Conexión PostgreSQL
│   └── requirements.txt
├── frontend/                 # Interfaz de usuario
│   └── src/
│       └── App.jsx           # SPA con navegación entre módulos
└── docs/
    └── screenshots/          # Capturas de pantalla
```

```
Usuario → Vercel (React/Vite) → Render (FastAPI) → PostgreSQL
```

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | React + Vite | Rápido, componentes reutilizables |
| Estilos | Tailwind CSS | Utilidades sin CSS custom |
| Animaciones | Framer Motion | Transiciones fluidas entre módulos |
| Gráficas | Recharts | Gráficas declarativas en React |
| Backend | Python + FastAPI | Alto rendimiento, docs automáticas |
| ORM | SQLAlchemy | Queries seguras y migraciones |
| Validación | Pydantic | Schemas tipados en Python |
| Base de datos | PostgreSQL 18 | Robusto y open source |
| Deploy Frontend | Vercel | CI/CD automático desde GitHub |
| Deploy Backend | Render | Fácil deploy de APIs Python |

---

## ⚙ Instalación Local

### Requisitos previos
- Node.js 18+
- Python 3.10+
- PostgreSQL

### 1. Clonar el repositorio

```bash
git clone https://github.com/mazagir/fraude-defender.git
cd fraude-defender
```

### 2. Configurar el Backend

```bash
cd backend
python -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

Crea el archivo `backend/.env`:

```env
DATABASE_URL=postgresql://usuario:password@localhost/fraude_defender_db
```

Inicia el servidor:

```bash
uvicorn app.main:app --reload
```

✅ API disponible en `http://localhost:8000`
📄 Documentación en `http://localhost:8000/docs`

### 3. Configurar el Frontend

```bash
cd frontend
npm install
```

Crea el archivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

✅ App disponible en `http://localhost:5173`

---

## 📡 API Reference

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/reportes` | Listar todos los reportes ordenados por fecha |
| `POST` | `/reportes` | Crear nuevo reporte de fraude |
| `POST` | `/reportes/contramedida` | Registrar ejecución de contramedida |
| `GET` | `/reportes/metricas/contramedidas` | Telemetría de contramedidas |

### Ejemplo: Crear reporte

```bash
curl -X POST https://fraude-defender-api.onrender.com/reportes \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+573001112233",
    "bank_account": "987654321",
    "domain": "prestamos-rapidos.xyz",
    "risk_level": "alto",
    "description": "Aplicación usada para amenazas y extorsión"
  }'
```

### Niveles de riesgo válidos

| Valor | Descripción |
|---|---|
| `alto` | Amenaza confirmada, acción inmediata requerida |
| `medio` | Comportamiento sospechoso en investigación |
| `bajo` | Indicador débil, requiere más evidencia |

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | URL de conexión PostgreSQL |

### Frontend (`frontend/.env`)

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_API_URL` | ✅ | URL base del backend API |

---

## 🗺 Roadmap

- [x] Dashboard con métricas en tiempo real
- [x] Módulo de reportes con filtros
- [x] Detección de amenazas activas
- [x] Threat Intelligence con listas negras
- [x] API REST documentada
- [x] Deploy en producción
- [ ] Autenticación de usuarios
- [ ] Notificaciones por email al registrar alto riesgo
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Exportar reportes a PDF/CSV
- [ ] App móvil

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre un issue primero.

```bash
# Fork → Clone → Branch → Commit → Push → Pull Request
git checkout -b feature/nueva-funcionalidad
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

---

## 🔒 Seguridad

Si descubres una vulnerabilidad de seguridad, por favor repórtala de forma responsable abriendo un issue privado o contactando directamente al equipo. No publiques vulnerabilidades de forma pública.

---

## 📄 Licencia

MIT © 2026 [Mazagir](https://github.com/mazagir)

---

<div align="center">

**Construido con ❤️ para proteger a las personas del fraude financiero y engaños**

⭐ Si este proyecto te parece útil, dale una estrella en GitHub

</div>
