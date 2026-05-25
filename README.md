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

### 🔑 Portal de Acceso (Autenticación JWT)
![Portal de Acceso](login-page.png)
*Módulo seguro de inicio de sesión con cifrado de credenciales para analistas autorizados.*

### 🏠 Dashboard Principal (Métricas y Analítica)
![Dashboard Seccion Superior](dashboard-top.png)
![Dashboard Seccion Inferior](dashboard-bottom.png)
*Visualización de telemetría en tiempo real: reportes totales, criticidad de riesgos, dominios maliciosos, números sospechosos y analítica interactiva mediante Recharts sin fallos de renderizado.*

### 📋 Módulo Central de Reportes
![Reportes de Incidentes](incident-reports.png)
*Repositorio indexado con filtros rápidos por nivel de severidad y barras de búsqueda multivariable (teléfono, dominio, descripción o entidad financiera).*

### ⚠ Panel de Amenazas Activas
![Amenazas Activas](active-threats.png)
*Consola de priorización que agrupa contadores dinámicos para los dominios críticos y números telefónicos más recurrentes.*

### 🧠 Threat Intelligence Center
![Threat Intelligence](threat-intelligence.png)
*Correlación de firmas de infraestructura atacante, detección automática de TLDs maliciosos (.xyz, .top, .click) y cuentas bancarias cruzadas.*

### ⚙ Ajustes e Integraciones (B2B)
![Ajustes del Sistema](system-settings.png)
*Gestión del perfil del investigador activo y generación simétrica de API Keys para interacciones seguras con módulos externos.*

---

## ✨ Funcionalidades y Capacidades

- **Dashboard de Monitoreo**: Telemetría visual en tiempo real de amenazas y métricas agregadas por severidad sin desajustes de color por descarte de datos en cero.
- **Threat Intelligence**: Listas negras dinámicas y análisis sintáctico de firmas de fraude.
- **Motor de Riesgo Heurístico**: Calculates automáticamente una puntuación de riesgo (0-100) basándose en la reputación de los TLDs de dominio, duplicidad de teléfonos/bancos en BD y análisis semántico de keywords del reporte.
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
│   ├── seed.py                     # Script de inicialización de datos de prueba
│   ├── ataque_simulador.py         # Simulador autónomo de estrés e inyección de IoCs
│   └── requirements.txt
├── frontend/                       # Interfaz SPA en React (Vite)
│   └── src/
│       ├── App.jsx                 # SPA React principal
│       └── services/
│           └── api.js              # Cliente API y cabeceras
└── docs/                           # Documentación y Capturas