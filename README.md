<div align="center">

<img src="https://raw.githubusercontent.com/mazagir/fraude-defender/main/docs/screenshots/hero-banner.png" alt="AegisShield Hero Banner" width="100%">

# 🛡️ AegisShield | Anti-Fraud Intelligence Platform
### *Plataforma de Ciberseguridad de Próxima Generación y Mitigación de Fraude*

[![Status](https://img.shields.io/badge/Estado-Activo%20y%20Protegiendo-00e5b4?style=for-the-badge&logo=shield&logoColor=white)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-2563eb?style=for-the-badge&logo=fastapi&logoColor=white)]()
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![Licencia](https://img.shields.io/badge/Licencia-MIT-purple?style=for-the-badge)]()

**AegisShield** es tu Centro de Operaciones de Seguridad (SOC) definitivo. Una solución diseñada arquitectónicamente para la detección proactiva, correlación instantánea y mitigación en tiempo real de infraestructura maliciosa (IoCs) y esquemas de fraude financiero como extorsiones y "gota a gota".

[🚀 Ver Demo en Vivo](https://fraude-defender-1176.vercel.app) | [📖 Documentación API](https://fraude-defender-api.onrender.com/docs) | [🐛 Reportar Bug](https://github.com/mazagir/fraude-defender/issues)

<br/>

<img src="docs/screenshots/agishield_demo.gif" alt="AegisShield Demo" width="100%">

</div>

<br />

> **“Defendiendo el ciberespacio financiero, un indicador de compromiso a la vez.”**

---

## 🔥 Características Principales (Transformación SaaS)

*   🧠 **Análisis de Estafas Asistido por IA (Gemini 1.5 Flash)**: Integración directa para escanear y traducir amenazas complejas (URLs, SMS, WhatsApp, correos) a explicaciones empáticas y comprensibles para usuarios no técnicos, recomendando acciones inmediatas de autodefensa.
*   🔗 **5 Canales de Entrada Directa**: Herramientas integradas en el Home para detectar fraudes rápidamente:
    *   *Analizar URL*: Detección de phishing bancario.
    *   *Analizar SMS*: Escaneo de falsos empleos o envíos postales.
    *   *Analizar WhatsApp*: Mitigación de extorsiones y montadeudas.
    *   *Analizar Correo*: Verificación de remitentes y cuerpos sospechosos.
    *   *Escanear QR*: Decodificación de códigos físicos alterados (Quishing).
*   🏆 **Gamificación y Retención (Mi Perfil Seguro)**: Sistema de recompensas XP, reputación, niveles de usuario (como "Guardián de la Comunidad") e insignias digitales desbloqueables en 3D/cyberpunk.
*   🗺️ **Mapa de Amenazas de Latinoamérica**: Telemetría interactiva en tiempo real y alertas comunitarias localizadas en **Colombia, México, Perú, Chile y Argentina**.
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

## 🛠 Stack Tecnológico de Vanguardia

AegisShield está construido con las mejores herramientas de la industria para asegurar latencia ultra-baja y escalabilidad masiva:

| Capa | Tecnologías | Descripción |
| :--- | :--- | :--- |
| **Backend** | Python 3.13, FastAPI, SQLAlchemy, SQLite/PostgreSQL | Arquitectura asíncrona de altísimo rendimiento integrada con Gemini 1.5 Flash. |
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Framer Motion | Interfaz *Glassmorphism* reactiva con gamificación integrada y guardado local. |
| **Infraestructura** | Vercel (Frontend), Render (API) | Despliegue CI/CD automático conectado a la rama principal. |

---

## 🚀 Despliegue y Ejecución Local

¿Quieres levantar tu propio entorno en minutos? AegisShield está diseñado con principios de Arquitectura Limpia para ser plug-and-play.

### 1️⃣ Levantar el Backend (FastAPI + Gemini AI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # En Windows
pip install -r requirements.txt

# Configura tu clave de Gemini (Opcional, cuenta con fallback local)
# Crea un archivo .env en /backend con: GEMINI_API_KEY=tu_api_key

# Iniciar servidor
uvicorn app.main:app --reload
```

### 2️⃣ Levantar el Frontend (React + Vite)
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```

---

<div align="center">
  Hecho con 💻 y 🛡️ por la comunidad para combatir el fraude digital en Latinoamérica. <br/>
  <strong>Si este proyecto te ha resultado útil o interesante, no olvides dejar una ⭐ en GitHub.</strong>
</div>