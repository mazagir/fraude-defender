# -*- coding: utf-8 -*-
"""Genera los diagramas técnicos del documento 111 de AgielShield."""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, FancyArrowPatch, Circle
import matplotlib.patheffects as pe

OUT = os.path.join(os.path.dirname(__file__), "..", "docs", "figuras111")
os.makedirs(OUT, exist_ok=True)

plt.rcParams["font.family"] = "DejaVu Sans"
NAVY = "#0B1F3A"
BLUE = "#1E6FD9"
LIGHT = "#EAF2FB"
CYAN = "#0FA3B1"
GREEN = "#2A9D8F"
AMBER = "#C9852B"
RED = "#C0392B"
GRAY = "#5C677D"
PALE = "#F5F7FA"


def box(ax, x, y, w, h, title, lines=None, fc=LIGHT, ec=BLUE, title_color=NAVY,
        title_size=10, line_size=8.2, lw=1.2, rounded=True):
    style = "round,pad=0.25,rounding_size=0.6" if rounded else "square,pad=0.0"
    p = FancyBboxPatch((x, y), w, h, boxstyle=style, linewidth=lw,
                       edgecolor=ec, facecolor=fc)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h - 2.2, title, ha="center", va="top",
            fontsize=title_size, fontweight="bold", color=title_color)
    if lines:
        ax.text(x + w / 2, y + h - 6.6, "\n".join(lines), ha="center", va="top",
                fontsize=line_size, color="#222222", linespacing=1.45)


def arrow(ax, x1, y1, x2, y2, label="", color=GRAY, style="-|>", ls="-", lw=1.4,
          fs=7.6, rad=0.0, lx=None, ly=None):
    a = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, mutation_scale=13,
                        linewidth=lw, color=color, linestyle=ls,
                        connectionstyle=f"arc3,rad={rad}")
    ax.add_patch(a)
    if label:
        ax.text(lx if lx is not None else (x1 + x2) / 2,
                ly if ly is not None else (y1 + y2) / 2 + 1.0,
                label, ha="center", va="bottom", fontsize=fs, color=color,
                bbox=dict(boxstyle="round,pad=0.18", fc="white", ec="none", alpha=0.9))


def canvas(w=12, h=7.2):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    return fig, ax


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=220, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)


# ---------------------------------------------------------------------------
# Figura 1. Arquitectura general
# ---------------------------------------------------------------------------
fig, ax = canvas(12.2, 7.6)
ax.text(50, 97, "Arquitectura general de AgielShield", ha="center", fontsize=14,
        fontweight="bold", color=NAVY)

# Capa de presentación
ax.add_patch(Rectangle((1.5, 30), 30, 58, fill=False, ec="#B9C6D8", lw=1, ls="--"))
ax.text(2.6, 85.5, "CAPA DE PRESENTACIÓN", fontsize=7.5, color=GRAY, fontweight="bold")
box(ax, 4, 52, 25, 28, "Usuario final", ["Navegador web o móvil", "Sin instalación", "HTTPS"], fc="#FFFFFF")
box(ax, 4, 34, 25, 15, "Interfaz SPA", ["React 18 + TypeScript", "Vite · Tailwind · Recharts"], fc=LIGHT)

# Capa de aplicación
ax.add_patch(Rectangle((34, 16), 37, 72, fill=False, ec="#B9C6D8", lw=1, ls="--"))
ax.text(35.2, 85.5, "CAPA DE APLICACIÓN", fontsize=7.5, color=GRAY, fontweight="bold")
box(ax, 36.5, 62, 32, 18, "Vercel (CDN / hosting)", ["SPA estática · caché en el borde", "Variables públicas · HTTPS"], fc="#FFFFFF")
box(ax, 36.5, 40, 32, 17, "Render · FastAPI (Python 3.13)", ["API REST /api/v1 · Swagger/OpenAPI", "JWT · RBAC · rate limiting · CORS"], fc="#E8F4FD")
box(ax, 36.5, 20, 32, 15, "Servicios de dominio", ["Motor heurístico · Verificación de dominios", "Gemini · Gamificación · Auditoría · Reportes"], fc=LIGHT)

# Capa de datos
ax.add_patch(Rectangle((74, 30), 24.5, 55, fill=False, ec="#B9C6D8", lw=1, ls="--"))
ax.text(75.2, 82.8, "CAPA DE DATOS", fontsize=7.5, color=GRAY, fontweight="bold")
box(ax, 76, 48, 21, 31, "PostgreSQL", ["Supabase (BaaS)", "4 tablas:", "users · fraud_reports", "scan_history · audit_logs"], fc="#FFF8E7", ec=AMBER)

# Servicios externos
box(ax, 76, 14, 21, 12, "Google Gemini", ["API generativa", "contingencia heurística"], fc="#F3E8FF", ec="#7B2CBF")
box(ax, 4, 14, 25, 12, "GitHub Actions", ["CI/CD: lint · test · build", "despliegue automatizado"], fc="#EAF7EF", ec=GREEN)

# Flechas
arrow(ax, 29, 60, 36.2, 60, "HTTPS", color=BLUE)
arrow(ax, 29, 66, 36.2, 68, "", color=BLUE)
arrow(ax, 68.5, 70, 76, 70, "HTTPS/JSON", color=BLUE)
arrow(ax, 68.5, 58, 76, 62, "SQL", color=AMBER)
arrow(ax, 68.5, 24, 76, 22, "HTTPS", color="#7B2CBF", ls="--")
arrow(ax, 28, 20, 36.2, 24, "push", color=GREEN, ls="--")
arrow(ax, 52, 40, 52, 35.2, "", color=GRAY)
arrow(ax, 52, 62, 52, 57.2, "", color=GRAY)

# Banda de seguridad
ax.add_patch(FancyBboxPatch((4, 3.5), 93, 6.2, boxstyle="round,pad=0.2,rounding_size=0.5",
                            fc="#FDECEA", ec=RED, lw=1.0))
ax.text(50.5, 6.6, "Controles transversales:  JWT + 2FA/TOTP · RBAC (super_admin, admin, analista) · "
        "validación Pydantic · ORM parametrizado · enmascaramiento de PII · auditoría · cifrado TLS",
        ha="center", va="center", fontsize=7.4, color="#7B1E14")
save(fig, "fig111_arquitectura.png")

# ---------------------------------------------------------------------------
# Figura 2. Componentes y servicios
# ---------------------------------------------------------------------------
fig, ax = canvas(12.2, 7.8)
ax.text(50, 97, "Diagrama de componentes y servicios", ha="center", fontsize=14,
        fontweight="bold", color=NAVY)

box(ax, 2, 62, 28, 28, "Frontend (React)", [
    "HomeView · DashboardView", "WorldThreatMap · AdminConsole", "AuthModal · RiskBadge",
    "servicios HTTP y estado local"], fc="#EAF2FB")
box(ax, 36, 62, 28, 28, "API · routers /api/v1", [
    "auth · reportes · analizar", "admin · threat-intel", "gamificación · salud",
    "dependencias JWT / API Key"], fc="#E8F4FD")
box(ax, 70, 62, 28, 28, "Persistencia", [
    "SQLAlchemy ORM", "sesiones y transacciones", "índices y restricciones", "PostgreSQL / SQLite"], fc="#FFF8E7", ec=AMBER)

box(ax, 2, 32, 28, 24, "Servicios de análisis", [
    "risk_engine.py", "domain_verification.py", "known_brands.py", "gemini_service.py"], fc="#F3E8FF", ec="#7B2CBF")
box(ax, 36, 32, 28, 24, "Servicios de soporte", [
    "reports.py · masking.py", "event_bus.py", "email_service.py", "audit / gamification"], fc="#EAF7EF", ec=GREEN)
box(ax, 70, 32, 28, 24, "Núcleo y configuración", [
    "config.py (variables de entorno)", "database.py (motor y sesión)", "security.py (hash, JWT, 2FA)", "logging y manejo de errores"], fc="#F5F7FA", ec=GRAY)

box(ax, 12, 8, 30, 15, "Servicios externos", [
    "Google Gemini API", "SMTP (correo transaccional)"], fc="#FFFFFF", ec=BLUE)
box(ax, 58, 8, 30, 15, "Infraestructura", [
    "GitHub Actions · Render · Vercel", "Supabase PostgreSQL"], fc="#FFFFFF", ec=BLUE)

arrow(ax, 30, 76, 35.8, 76, "HTTP/JSON")
arrow(ax, 64, 76, 69.8, 76, "ORM")
arrow(ax, 50, 62, 50, 56.2, "")
arrow(ax, 30, 44, 35.8, 44, "usa")
arrow(ax, 64, 44, 69.8, 44, "configura")
arrow(ax, 16, 32, 16, 23.2, "consume", color="#7B2CBF", ls="--")
arrow(ax, 84, 32, 84, 23.2, "despliega", color=GREEN, ls="--")
arrow(ax, 42, 15.5, 58, 15.5, "", color=GRAY, ls=":")
save(fig, "fig111_componentes.png")

# ---------------------------------------------------------------------------
# Figura 3. Modelo entidad-relación
# ---------------------------------------------------------------------------
fig, ax = canvas(12.2, 7.6)
ax.text(50, 97, "Modelo entidad-relación de la base de datos", ha="center",
        fontsize=14, fontweight="bold", color=NAVY)


def entity(x, y, w, name, fields, color=LIGHT, ec=BLUE):
    h = 5.2 + 4.0 * len(fields)
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2,rounding_size=0.4",
                                fc="white", ec=ec, lw=1.4))
    ax.add_patch(FancyBboxPatch((x, y + h - 5.2), w, 5.2,
                                boxstyle="round,pad=0.2,rounding_size=0.4",
                                fc=color, ec=ec, lw=1.4))
    ax.text(x + w / 2, y + h - 2.7, name, ha="center", va="center",
            fontsize=9.6, fontweight="bold", color=NAVY)
    for i, f in enumerate(fields):
        ax.text(x + 1.2, y + h - 8.0 - 4.0 * i, f, ha="left", va="center",
                fontsize=7.5, color="#222222", family="DejaVu Sans")
    return h


h_users = entity(3, 47, 30, "users", [
    "id  (PK, entero, autoincremento)",
    "email  (UNIQUE, NOT NULL)",
    "hashed_password  (NOT NULL)",
    "nombre · rol · es_activo",
    "mfa_secret · mfa_activo",
    "reputation · badges · streak",
    "last_scan_date · created_at"], color="#EAF2FB")
h_reports = entity(60, 50, 37, "fraud_reports", [
    "id  (PK, entero, autoincremento)",
    "phone_number · bank_account · domain",
    "description  (NOT NULL)",
    "risk_level · risk_score (0-100)",
    "malicious_indicators",
    "created_at"], color="#FFF8E7", ec=AMBER)
h_scan = entity(3, 12, 30, "scan_history", [
    "id  (PK, entero, autoincremento)",
    "user_id  (FK → users.id, NULL)",
    "scan_type · content · score",
    "level · explanation",
    "recommendations · indicators",
    "created_at"], color="#EAF7EF", ec=GREEN)
h_audit = entity(60, 12, 37, "audit_logs", [
    "id  (PK, entero, autoincremento)",
    "admin_email  (referencia lógica)",
    "action · target_type · target_id",
    "detail · created_at"], color="#F5F7FA", ec=GRAY)

arrow(ax, 18, 47, 18, 41.5, "1", color=GREEN, lw=1.6)
arrow(ax, 18, 41.5, 18, 47, "N", color=GREEN, lw=1.6)
ax.text(20, 44, "1 : N  (un usuario puede tener muchos escaneos;\nuser_id NULL = escaneo anónimo)",
        fontsize=7.2, color=GREEN, va="center")

ax.plot([33, 60], [78, 78], color=GRAY, ls="--", lw=1.2)
ax.text(46.5, 79.2, "sin FK: reporte comunitario anónimo", fontsize=7.0,
        color=GRAY, ha="center")
ax.plot([33, 60], [58, 20], color=GRAY, ls=":", lw=1.2)
ax.text(36.5, 34, "referencia lógica\npor correo (auditoría)", fontsize=6.8, color=GRAY)

ax.add_patch(FancyBboxPatch((3, 2.0), 94, 6.0, boxstyle="round,pad=0.2,rounding_size=0.4",
                            fc="#FDECEA", ec=RED, lw=1.0))
ax.text(50, 5.0, "La gamificación (reputación, insignias, racha, última fecha de escaneo) reside en users. "
        "No existe una tabla 'gamification' separada; ello evita duplicación y mantiene una sola fuente de verdad.",
        ha="center", va="center", fontsize=7.3, color="#7B1E14")
save(fig, "fig111_er.png")

# ---------------------------------------------------------------------------
# Figura 4. Secuencia del análisis
# ---------------------------------------------------------------------------
fig, ax = canvas(12.4, 8.2)
ax.text(50, 97.5, "Secuencia del proceso de análisis", ha="center", fontsize=14,
        fontweight="bold", color=NAVY)
actores = [
    ("Usuario", 8), ("SPA React", 25), ("API FastAPI", 42),
    ("Motor\nheurístico", 59), ("Verificación\nde dominio", 74), ("Gemini API", 88),
]
for nombre, x in actores:
    ax.add_patch(FancyBboxPatch((x - 6.0, 86), 12.0, 6.4,
                                boxstyle="round,pad=0.15,rounding_size=0.4",
                                fc=LIGHT, ec=BLUE, lw=1.0))
    ax.text(x, 89.2, nombre, ha="center", va="center", fontsize=7.6, fontweight="bold", color=NAVY)
    ax.plot([x, x], [86, 6], color="#B9C6D8", lw=1.0, ls="--")


def msg(x1, x2, y, texto, color=GRAY, ls="-"):
    arrow(ax, x1, y, x2, y, "", color=color, lw=1.2, ls=ls)
    ax.text((x1 + x2) / 2, y + 1.1, texto, ha="center", va="bottom", fontsize=6.9,
            color=color, bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none", alpha=0.92))


msg(8, 25, 82, "1. Ingresa URL, mensaje, correo o QR")
msg(25, 42, 77, "2. POST /api/v1/analizar  (JWT)")
msg(42, 42, 73, "3. Valida esquema Pydantic y límites")
msg(42, 59, 68, "4. evalúa señales heurísticas")
msg(59, 42, 64, "5. score, nivel, indicadores", color=BLUE)
msg(42, 74, 59, "6. si es URL: verifica dominio")
msg(74, 42, 55, "7. es_real, confianza, marca", color=AMBER)
msg(42, 88, 50, "8. solicita explicación (timeout 15 s)")
msg(88, 42, 45, "9. JSON: explicación y recomendaciones", color="#7B2CBF")
msg(42, 59, 40, "10. si falla Gemini: fallback heurístico", color=RED, ls="--")
msg(42, 25, 36, "11. respuesta JSON unificada", color=BLUE)
msg(25, 8, 31, "12. muestra riesgo y recomendaciones")

# Marco de alternativa
ax.add_patch(Rectangle((36, 39), 54, 13, fill=False, ec=RED, lw=1.0, ls="--"))
ax.text(37, 50.3, "alt [Gemini no disponible o cuota excedida]", fontsize=6.8, color=RED)

# Persistencia
ax.plot([42, 42], [36, 28], color=GRAY, lw=1.2, ls="-")
msg(42, 42, 26, "")
ax.text(43, 26, "13. persiste en scan_history y actualiza gamificación (users)",
        fontsize=6.8, color=GRAY, ha="left")
ax.add_patch(FancyBboxPatch((30, 12), 40, 10, boxstyle="round,pad=0.2,rounding_size=0.4",
                            fc="#FFF8E7", ec=AMBER, lw=1.0))
ax.text(50, 17, "PostgreSQL (Supabase): users · fraud_reports\nscan_history · audit_logs",
        ha="center", va="center", fontsize=7.4, color=NAVY)
arrow(ax, 42, 24, 42, 22.2, "", color=AMBER)

ax.add_patch(FancyBboxPatch((3, 2.0), 94, 5.2, boxstyle="round,pad=0.2,rounding_size=0.4",
                            fc="#EAF7EF", ec=GREEN, lw=1.0))
ax.text(50, 4.6, "El análisis híbrido garantiza disponibilidad: el veredicto heurístico se calcula siempre; "
        "la IA enriquece la explicación y puede sobrescribir el nivel de riesgo.",
        ha="center", va="center", fontsize=7.2, color="#1E5B4F")
save(fig, "fig111_secuencia.png")

# ---------------------------------------------------------------------------
# Figura 5. Cronograma (Gantt)
# ---------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12.2, 6.2))
tareas = [
    ("Fase 1 · Análisis y backlog", 1, 3, "#8ECAE6"),
    ("Fase 2 · Diseño y arquitectura", 3, 5, "#219EBC"),
    ("Sprint 1 · Autenticación y modelo de datos", 4, 6, "#2A9D8F"),
    ("Sprint 2 · Motor heurístico", 5, 7, "#2A9D8F"),
    ("Sprint 3 · Integración Gemini y dominios", 6, 8, "#2A9D8F"),
    ("Sprint 4 · Reportes y panel de amenazas", 7, 10, "#2A9D8F"),
    ("Sprint 5 · Gamificación y administración", 9, 12, "#2A9D8F"),
    ("Pruebas y validación", 11, 15, "#E9C46A"),
    ("Despliegue y CI/CD", 12, 15, "#F4A261"),
    ("Documentación y divulgación", 13, 16, "#C9852B"),
]
for i, (nombre, ini, fin, color) in enumerate(tareas):
    y = len(tareas) - i
    ax.barh(y, fin - ini + 0.8, left=ini - 0.4, height=0.62, color=color,
            edgecolor="white", linewidth=0.8)
    ax.text(0.3, y, nombre, va="center", ha="left", fontsize=8.4, color="#222222")
ax.set_xlim(0, 17.2)
ax.set_ylim(0.3, len(tareas) + 0.9)
ax.set_yticks([])
ax.set_xticks(range(1, 17))
ax.set_xlabel("Semana", fontsize=9)
ax.grid(axis="x", color="#DDE3EA", lw=0.7, ls=":")
ax.set_axisbelow(True)
for s in ["top", "right", "left"]:
    ax.spines[s].set_visible(False)
ax.set_title("Cronograma de fases y sprints (16 semanas)", fontsize=13,
             fontweight="bold", color=NAVY, pad=12)
fig.tight_layout()
save(fig, "fig111_cronograma.png")

print("Diagramas generados en", os.path.abspath(OUT))
