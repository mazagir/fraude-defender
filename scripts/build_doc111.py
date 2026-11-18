# -*- coding: utf-8 -*-
"""Construcción del documento 111 (Proyecto de Grado) de AgielShield.

El contenido se monta sobre el Formato Proyecto de Grado (Código 111,
Versión 5) de la CURN, conservando su encabezado, pie de página, márgenes
y tabla oficial de información general.
"""
import io
import json
import os
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt

DOCS = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
FIG = os.path.join(DOCS, "figuras111")
OUT = os.path.join(DOCS, "Proyecto_Grado_AgielShield.docx")
TEMPLATE = r"C:\Users\neild\Downloads\111_FORMATO_PROYECTO_DE_GRADO_ok27-09-2024__14_27_5905-02-2025__9_50_07.docx"
TITLE = ("AgielShield: plataforma web de inteligencia de amenazas y ciberseguridad "
         "colaborativa en español para la detección, análisis y defensa contra "
         "fraudes digitales en Latinoamérica")

# ── Base institucional ───────────────────────────────────────────────────────
# Se parte del Formato Proyecto de Grado (Código 111, Versión 5). Se conservan
# la sección, el encabezado con el logo, el pie de página, los estilos y la
# tabla de información general de la primera página. Se retiran el instructivo
# y los listados de otras modalidades.
doc = Document(TEMPLATE)
body = doc.element.body
children = list(body.iterchildren())
sect_pr = children[-1]
# Localizar el encabezado oficial y conservar desde allí hasta la cuarta tabla
# institucional. Las copias de la plantilla pueden traer párrafos vacíos delante.
inicio = next(
    i for i, ch in enumerate(children[:-1])
    if "INFORMACIÓN GENERAL" in "".join(ch.itertext()).upper()
)
tablas = 0
fin = inicio
for i in range(inicio, len(children) - 1):
    if children[i].tag.endswith("}tbl"):
        tablas += 1
        if tablas == 4:
            fin = i
            break
keep = children[inicio:fin + 1]
for element in children[:-1]:
    body.remove(element)
body.remove(sect_pr)
for element in keep:
    body.append(element)
body.append(sect_pr)


def set_cell_text(cell, text):
    """Escribe en la celda conservando el formato institucional existente."""
    p = cell.paragraphs[0]
    if p.runs:
        p.runs[0].text = text
        for run in p.runs[1:]:
            run.text = ""
    else:
        p.add_run(text)
    for extra in cell.paragraphs[1:]:
        for run in extra.runs:
            run.text = ""


official = doc.tables
set_cell_text(official[0].rows[1].cells[0], TITLE)
for row, name in zip(official[1].rows[2:5], (
        "Neil David Maza Girado", "Steven Ruiz Fontalvo", "Keider Polo Arteaga")):
    set_cell_text(row.cells[0], name)
    set_cell_text(row.cells[1], "6")
set_cell_text(official[1].rows[5].cells[0], "")
set_cell_text(official[1].rows[5].cells[1], "")
set_cell_text(official[2].rows[2].cells[0], "Maybelline Castro")
set_cell_text(official[2].rows[2].cells[1], "Asesora del trabajo de grado")
set_cell_text(official[2].rows[3].cells[0], "")
set_cell_text(official[2].rows[3].cells[1], "")
set_cell_text(official[3].rows[1].cells[0],
              "Ciberseguridad, Inteligencia Artificial Aplicada y Desarrollo de Software")

# ── Numeración de tablas y figuras ──────────────────────────────────────────
# Las tres primeras tablas son las de la página 1 de la plantilla oficial.
TABLES = [3]
FIGURES = [0]


def set_cell_margins(table, top=40, bottom=40, left=80, right=80):
    tblPr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for side, val in (("top", top), ("bottom", bottom), ("left", left), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tblPr.append(mar)


def repeat_header(row):
    trPr = row._tr.get_or_add_trPr()
    hdr = OxmlElement("w:tblHeader")
    hdr.set(qn("w:val"), "true")
    trPr.append(hdr)
    cant = OxmlElement("w:cantSplit")
    trPr.append(cant)


def fix_layout(table):
    tblPr = table._tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblPr.append(layout)


def T(title, headers, rows, widths=None, font=8.6, note=None, align=None):
    """Tabla con rótulo, encabezado repetido y filas sin partir."""
    TABLES[0] += 1
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_before = Pt(8)
    cap.paragraph_format.space_after = Pt(4)
    cap.paragraph_format.keep_with_next = True
    r = cap.add_run(f"Tabla {TABLES[0]}. {title}")
    r.bold = True
    r.font.size = Pt(9.2)

    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    fix_layout(t)
    set_cell_margins(t)
    if widths:
        for i, w in enumerate(widths):
            t.columns[i].width = Cm(w)

    hdr = t.rows[0]
    repeat_header(hdr)
    for i, h in enumerate(headers):
        cell = hdr.cells[i]
        cell.text = ""
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        if widths:
            cell.width = Cm(widths[i])
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(1)
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(font)

    for row in rows:
        cells = t.add_row().cells
        cant = OxmlElement("w:cantSplit")
        t.rows[-1]._tr.get_or_add_trPr().append(cant)
        for i, val in enumerate(row):
            cell = cells[i]
            cell.text = ""
            cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
            if widths:
                cell.width = Cm(widths[i])
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.0
            if align and i < len(align):
                p.alignment = {"c": WD_ALIGN_PARAGRAPH.CENTER,
                               "l": WD_ALIGN_PARAGRAPH.LEFT,
                               "j": WD_ALIGN_PARAGRAPH.JUSTIFY,
                               "r": WD_ALIGN_PARAGRAPH.RIGHT}[align[i]]
            run = p.add_run(str(val))
            run.font.size = Pt(font)

    if note:
        n = doc.add_paragraph()
        n.paragraph_format.space_before = Pt(2)
        n.paragraph_format.space_after = Pt(10)
        nr = n.add_run(note)
        nr.italic = True
        nr.font.size = Pt(8)
    else:
        doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return t


def F(filename, caption, width=6.2):
    FIGURES[0] += 1
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(os.path.join(FIG, filename), width=Inches(width))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(12)
    r = cap.add_run(f"Figura {FIGURES[0]}. {caption}")
    r.italic = True
    r.font.size = Pt(8.6)


# ── Utilidades de texto ─────────────────────────────────────────────────────
REFS = {
    "ibm2024": "IBM Security and Ponemon Institute, “Cost of a Data Breach Report 2024,” IBM, 2024. [En línea]. Disponible en: https://www.ibm.com/reports/data-breach",
    "apwg2026": "Anti-Phishing Working Group, “Phishing Activity Trends Report, 4th Quarter 2025,” APWG, 2026. [En línea]. Disponible en: https://docs.apwg.org/reports/apwg_trends_report_q4_2025.pdf",
    "mintic2026": "Ministerio de Tecnologías de la Información y las Comunicaciones, “Colombia fortalece su soberanía digital: durante 2025 logró reducir en un 48 % los incidentes cibernéticos,” MinTIC, Bogotá, 2026. [En línea]. Disponible en: https://www.mintic.gov.co",
    "condusef2025": "Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros, “Buró de entidades financieras: reclamaciones y fraudes 2024,” CONDUSEF, Ciudad de México, 2025. [En línea]. Disponible en: https://www.condusef.gob.mx",
    "asobancaria2026": "Asociación Bancaria y de Entidades Financieras de Colombia, “Informe de delitos informáticos y fraude transaccional 2025,” Asobancaria, Bogotá, 2026. [En línea]. Disponible en: https://www.asobancaria.com/iniciativas/informes-seguridad-bancaria/",
    "kaspersky2026": "Kaspersky, “El 34 % de los latinoamericanos no sabe identificar sitios web falsos, aunque el desconocimiento se redujo,” Kaspersky LATAM, 2026. [En línea]. Disponible en: https://latam.kaspersky.com/about/press-releases",
    "kaspersky2024": "Kaspersky and CORPA, “Lenguaje Digital 2024: estudio sobre ciberseguridad y hábitos digitales en LATAM,” Kaspersky, 2024. [En línea]. Disponible en: https://latam.kaspersky.com/blog/estudo-linguagem-digital-2024/28068/",
    "enisa2025": "European Union Agency for Cybersecurity, “ENISA Threat Landscape 2025,” ENISA, Atenas, 2025. [En línea]. Disponible en: https://www.enisa.europa.eu",
    "interpol2024": "INTERPOL, “Global Crime Trend Report 2024,” INTERPOL, Lyon, 2024. [En línea]. Disponible en: https://www.interpol.int",
    "almomani2013": "A. Almomani, B. B. Gupta, S. Atawneh, A. Meulenberg, and E. Almomani, “A survey of phishing email filtering techniques,” IEEE Communications Surveys & Tutorials, vol. 15, no. 4, pp. 2070–2090, 2013, doi: 10.1109/SURV.2013.030713.00020.",
    "heartfield2016": "R. Heartfield and G. Loukas, “A taxonomy of attacks and a survey of defence mechanisms for semantic social engineering attacks,” ACM Computing Surveys, vol. 48, no. 3, pp. 1–39, 2016, doi: 10.1145/2835375.",
    "varshney2016": "G. Varshney, M. Misra, and P. K. Atrey, “A survey and classification of web phishing detection schemes,” Security and Communication Networks, vol. 9, no. 18, pp. 6266–6284, 2016, doi: 10.1002/sec.1674.",
    "basit2021": "A. Basit, M. Zafar, X. Liu, A. R. Javed, Z. Jalil, and K. Kifayat, “A comprehensive survey of AI-enabled phishing attacks detection techniques,” Telecommunication Systems, vol. 76, pp. 139–154, 2021, doi: 10.1007/s11235-020-00733-2.",
    "szurdi2014": "J. Szurdi, B. Kocso, G. Cset, J. Spring, M. Felegyhazi, and C. Kanich, “The long tail of typosquatting domain names,” in Proc. 23rd USENIX Security Symposium, San Diego, CA, USA, 2014, pp. 191–206.",
    "misp2025": "MISP Project, “MISP: Open Source Threat Intelligence Platform — Documentation,” 2025. [En línea]. Disponible en: https://www.misp-project.org/documentation/",
    "virustotal2025": "VirusTotal, “VirusTotal API v3 Documentation,” 2025. [En línea]. Disponible en: https://docs.virustotal.com/reference/overview",
    "phishtank2025": "PhishTank, “PhishTank Developer Information,” 2025. [En línea]. Disponible en: https://phishtank.org/developer_info.php",
    "urlscan2025": "URLScan.io, “URLScan.io API Documentation,” 2025. [En línea]. Disponible en: https://urlscan.io/docs/api/",
    "truecaller2025": "Truecaller, “Truecaller for Developers,” 2025. [En línea]. Disponible en: https://developer.truecaller.com/",
    "scrum2020": "K. Schwaber and J. Sutherland, The Scrum Guide: The Definitive Guide to Scrum: The Rules of the Game, 2020. [En línea]. Disponible en: https://scrumguides.org/scrum-guide.html",
    "sommerville2016": "I. Sommerville, Software Engineering, 10th ed. Boston, MA, USA: Pearson, 2016.",
    "wohlin2012": "C. Wohlin, P. Runeson, M. Höst, M. C. Ohlsson, B. Regnell, and A. Wesslén, Experimentation in Software Engineering. Berlin, Germany: Springer, 2012, doi: 10.1007/978-3-642-29044-2.",
    "brooke1996": "J. Brooke, “SUS: A quick and dirty usability scale,” in Usability Evaluation in Industry, P. W. Jordan et al., Eds. London, U.K.: Taylor & Francis, 1996, pp. 189–194.",
    "iso25010": "ISO/IEC, “ISO/IEC 25010:2011 — Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models,” ISO, Ginebra, 2011.",
    "nist80063b": "P. A. Grassi, J. L. Fenton, E. M. Newton, R. A. Perlner, A. R. Regenscheid, W. E. Burr, and J. P. Richer, “Digital Identity Guidelines: Authentication and Lifecycle Management,” NIST Special Publication 800-63B, 2017, doi: 10.6028/NIST.SP.800-63b.",
    "owasp2021": "OWASP Foundation, “OWASP Top 10: 2021 — The Ten Most Critical Web Application Security Risks,” 2021. [En línea]. Disponible en: https://owasp.org/Top10/",
    "levenshtein1966": "V. I. Levenshtein, “Binary codes capable of correcting deletions, insertions, and reversals,” Soviet Physics Doklady, vol. 10, no. 8, pp. 707–710, 1966.",
    "gemini2025": "Google, “Gemini API Documentation,” 2025. [En línea]. Disponible en: https://ai.google.dev/gemini-api/docs",
    "fastapi2025": "S. Ramírez, “FastAPI Documentation,” 2025. [En línea]. Disponible en: https://fastapi.tiangolo.com/",
    "react2025": "Meta Open Source, “React Documentation,” 2025. [En línea]. Disponible en: https://react.dev/",
    "postgres2025": "PostgreSQL Global Development Group, “PostgreSQL 16 Documentation,” 2025. [En línea]. Disponible en: https://www.postgresql.org/docs/",
    "supabase2025": "Supabase, “Supabase Documentation,” 2025. [En línea]. Disponible en: https://supabase.com/docs",
    "render2025": "Render, “Render Documentation,” 2025. [En línea]. Disponible en: https://render.com/docs",
    "vercel2025": "Vercel, “Vercel Documentation,” 2025. [En línea]. Disponible en: https://vercel.com/docs",
    "ghactions2025": "GitHub, “GitHub Actions Documentation,” 2025. [En línea]. Disponible en: https://docs.github.com/actions",
    "conpes3995": "Departamento Nacional de Planeación, “CONPES 3995: Política Nacional de Confianza y Seguridad Digital,” DNP, Bogotá, 2020.",
    "ley1581": "Congreso de la República de Colombia, “Ley 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales,” Bogotá, 2012.",
    "decreto1377": "Presidencia de la República de Colombia, “Decreto 1377 de 2013, por el cual se reglamenta parcialmente la Ley 1581 de 2012,” Bogotá, 2013.",
    "ley1273": "Congreso de la República de Colombia, “Ley 1273 de 2009, por medio de la cual se modifica el Código Penal y se crea un nuevo bien jurídico tutelado: de la protección de la información y de los datos,” Bogotá, 2009.",
    "lgpd": "República Federativa do Brasil, “Lei nº 13.709, de 14 de agosto de 2018 — Lei Geral de Proteção de Dados Pessoais (LGPD),” Brasília, 2018.",
    "ley19628": "República de Chile, “Ley 19.628 sobre protección de la vida privada,” Santiago, 1999.",
    "iso29148": "ISO/IEC/IEEE, “ISO/IEC/IEEE 29148:2018 — Systems and software engineering — Life cycle processes — Requirements engineering,” ISO, Ginebra, 2018.",
    "sokolova2009": "M. Sokolova and G. Lapalme, “A systematic analysis of performance measures for classification tasks,” Information Processing & Management, vol. 45, no. 4, pp. 427–437, 2009, doi: 10.1016/j.ipm.2009.03.002.",
    "wcag2023": "World Wide Web Consortium, “Web Content Accessibility Guidelines (WCAG) 2.2,” W3C Recommendation, 2023. [En línea]. Disponible en: https://www.w3.org/TR/WCAG22/",
    "iso27001": "ISO/IEC, “ISO/IEC 27001:2022 — Information security, cybersecurity and privacy protection — Information security management systems — Requirements,” ISO, Ginebra, 2022.",
    "nistcsf2024": "National Institute of Standards and Technology, “The NIST Cybersecurity Framework (CSF) 2.0,” NIST CSWP 29, Gaithersburg, MD, USA, 2024, doi: 10.6028/NIST.CSWP.29.",
    "moscow1994": "D. Clegg and R. Barker, Case Method Fast-Track: A RAD Approach. Wokingham, U.K.: Addison-Wesley, 1994.",
}

CITED = []


def cite(*keys):
    nums = []
    for key in keys:
        if key not in REFS:
            raise KeyError(key)
        if key not in CITED:
            CITED.append(key)
        nums.append(CITED.index(key) + 1)
    return "[" + "], [".join(str(n) for n in sorted(set(nums))) + "]"


def P(text, bold=False, italic=False, align="justify", size=None, space_after=6,
      first_indent=None, keep=False):
    p = doc.add_paragraph()
    p.alignment = {"justify": WD_ALIGN_PARAGRAPH.JUSTIFY, "center": WD_ALIGN_PARAGRAPH.CENTER,
                   "left": WD_ALIGN_PARAGRAPH.LEFT, "right": WD_ALIGN_PARAGRAPH.RIGHT}[align]
    p.paragraph_format.space_after = Pt(space_after)
    if first_indent is not None:
        p.paragraph_format.first_line_indent = Cm(first_indent)
    if keep:
        p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.bold = bold
    r.italic = italic
    if size:
        r.font.size = Pt(size)
    return p


def H1(text, page_break=True):
    h = doc.add_heading(text, level=1)
    if page_break:
        h.paragraph_format.page_break_before = True
    return h


def H2(text):
    return doc.add_heading(text, level=2)


def H3(text):
    return doc.add_heading(text, level=3)


def bullets(items, size=None):
    for it in items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.9)
        p.paragraph_format.first_line_indent = Cm(-0.45)
        p.paragraph_format.space_after = Pt(3)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r = p.add_run("•  " + it)
        if size:
            r.font.size = Pt(size)


def numbered(items, size=None):
    """Cada llamada reinicia la numeración: evita la continuación entre listas."""
    for i, it in enumerate(items, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(1.0)
        p.paragraph_format.first_line_indent = Cm(-0.55)
        p.paragraph_format.space_after = Pt(3)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r = p.add_run(f"{i}.  {it}")
        if size:
            r.font.size = Pt(size)


# ═══════════════════════════════════════════════════════════════════════════
# TABLA DE CONTENIDO
# ═══════════════════════════════════════════════════════════════════════════
H1("TABLA DE CONTENIDO")
tp = doc.add_paragraph()
run = tp.add_run()
fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), "begin")
instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve")
instr.text = 'TOC \\o "1-3" \\h \\z \\u'
sep = OxmlElement("w:fldChar"); sep.set(qn("w:fldCharType"), "separate")
txt = OxmlElement("w:t"); txt.text = ""
end = OxmlElement("w:fldChar"); end.set(qn("w:fldCharType"), "end")
for el in (fc, instr, sep, txt, end):
    run._r.append(el)

# ═══════════════════════════════════════════════════════════════════════════
# LISTA DE FIGURAS Y TABLAS
# ═══════════════════════════════════════════════════════════════════════════
H1("LISTA DE FIGURAS Y TABLAS")

FIGS_LIST = [
    "Arquitectura general del sistema.",
    "Diagrama de componentes y servicios.",
    "Modelo entidad-relación de la base de datos.",
    "Secuencia del proceso de análisis.",
    "Cronograma de fases y sprints.",
]
P("Figuras", bold=True, size=10.5, space_after=3)
for i, t in enumerate(FIGS_LIST, 1):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.8)
    p.paragraph_format.first_line_indent = Cm(-0.8)
    p.paragraph_format.space_after = Pt(2)
    p.add_run(f"Figura {i}. {t}").font.size = Pt(9.5)

TABLES_LIST = [
    "Cifras verificadas sobre fraude digital y su alcance.",
    "Comparación de capacidades con soluciones existentes.",
    "Marco legal y aplicabilidad al proyecto.",
    "Objetivos específicos, indicadores y evidencias.",
    "Alternativas de solución y puntuación ponderada.",
    "Roles y responsabilidades en Scrum.",
    "Sprints, objetivos y evidencias.",
    "Requerimientos funcionales y criterios de aceptación.",
    "Requerimientos no funcionales, métricas y verificación.",
    "Matriz de trazabilidad entre objetivos, requerimientos y pruebas.",
    "Plan de pruebas y criterios de aceptación.",
    "Resultados alcanzados a la fecha de corte.",
    "Matriz de confusión del verificador de dominios.",
    "Matriz de confusión de la capa heurística de mensajes.",
    "Métricas de desempeño y umbrales de aceptación.",
    "Conciliación de la ejecución de pruebas.",
    "Actividades de cierre y resultados pendientes.",
    "Limitaciones del estudio y su efecto sobre los resultados.",
    "Indicadores de éxito y estado.",
    "Cronograma por fases, objetivos y entregables.",
    "Presupuesto: costos directos e indirectos.",
    "Resumen presupuestal y sostenibilidad.",
    "Catálogo de endpoints principales.",
    "Escala de clasificación del riesgo.",
    "Variables de entorno requeridas (sin valores sensibles).",
]
P("Tablas", bold=True, size=10.5, space_after=3)
for i, t in enumerate(TABLES_LIST, 4):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.8)
    p.paragraph_format.first_line_indent = Cm(-0.8)
    p.paragraph_format.space_after = Pt(2)
    p.add_run(f"Tabla {i}. {t}").font.size = Pt(9.5)

# ═══════════════════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════════════════
H1("RESUMEN")
P("El fraude digital en Latinoamérica combina tres factores que agravan su impacto: una "
  "digitalización acelerada de los servicios financieros, una oferta de herramientas de "
  "ciberseguridad diseñada para analistas y una brecha persistente de alfabetización digital. "
  "El costo promedio de una filtración de datos en la región se estimó en USD 4,16 millones "
  "en 2024, mientras que el Grupo de Trabajo Anti-Phishing registró 3,8 millones de ataques de "
  "phishing en 2025 " + cite("ibm2024", "apwg2026") + ". En Colombia, el CERT nacional gestionó "
  "1.427 incidentes en 2024 y 697 en 2025 " + cite("mintic2026") + ", y la banca reportó más de "
  "765.000 reclamaciones por fraude en 2025 " + cite("asobancaria2026") + ". "
  "Las herramientas técnicas existentes —VirusTotal, PhishTank, URLScan.io o Truecaller— "
  "resuelven partes del problema, pero no ofrecen, de forma conjunta, análisis en español, "
  "explicaciones para usuarios no técnicos, verificación de dominios y reporte comunitario.")
P("El proyecto AgielShield diseñó, implementó y evaluó una plataforma web gratuita que analiza "
  "URL, mensajes, WhatsApp, correo electrónico, códigos QR y números telefónicos mediante un "
  "enfoque híbrido: un motor heurístico determinista, un verificador de dominios basado en "
  "distancia de Levenshtein y un modelo de lenguaje (Google Gemini) que actúa como capa de "
  "explicación y detección proactiva. La metodología de desarrollo fue Scrum, con ocho sprints "
  "de dos semanas, y se complementó con una metodología de evaluación separada, basada en un "
  "conjunto etiquetado, matriz de confusión y métricas de precisión, exhaustividad y tasa de "
  "falsos positivos.")
P("Los resultados verificables a la fecha de corte son: 49 de 50 pruebas automatizadas de "
  "backend aprobadas (la única falla corresponde a una dependencia de orden en la configuración "
  "de pruebas y pasa al ejecutarse de forma aislada), 8 de 8 pruebas de frontend aprobadas, "
  "14 de 14 pasos funcionales de la API aprobados y una validación del verificador de dominios "
  "sobre 30 casos (15 fraudulentos y 15 legítimos) con 100 % de exactitud tras corregir un falso "
  "positivo del catálogo de marcas. La capa heurística de mensajes obtuvo una precisión de 1,00 "
  "y una exhaustividad de 0,80 sobre 20 casos, lo que evidencia su valor como respaldo y la "
  "necesidad del componente generativo para los casos sin palabras clave explícitas.")
P("Se concluye que la combinación de heurística, verificación de dominios e inteligencia "
  "artificial generativa es viable para ofrecer protección antifraude comprensible y de bajo "
  "costo, pero que la evidencia disponible aún es limitada: el conjunto de validación es "
  "reducido, no constituye una muestra representativa y no incluye una evaluación controlada "
  "con usuarios. Estas limitaciones se documentan y se traducen en un plan de evaluación futura.")
P("Palabras clave: ciberseguridad, fraude digital, phishing, inteligencia artificial, "
  "typosquatting, inteligencia de amenazas, Latinoamérica.", bold=True)

# ═══════════════════════════════════════════════════════════════════════════
# 1. PLANTEAMIENTO
# ═══════════════════════════════════════════════════════════════════════════
H1("1. PLANTEAMIENTO DE LA PROBLEMÁTICA")

H2("1.1 Contexto y delimitación del problema")
P("El fraude digital dejó de ser un fenómeno marginal para convertirse en una economía "
  "criminal organizada. La digitalización de la banca, los pagos móviles y el comercio "
  "electrónico amplió la superficie de ataque, mientras que la adopción masiva de mensajería "
  "instantánea trasladó la interacción fraudulenta desde el correo electrónico hacia canales "
  "donde el usuario baja la guardia con mayor facilidad. Los reportes internacionales coinciden "
  "en que el factor humano —no la vulnerabilidad técnica— es el principal punto de entrada: las "
  "credenciales comprometidas fueron el vector inicial en el 16 % de las filtraciones analizadas por "
  "IBM en 2024 " + cite("ibm2024") + ", y la ingeniería social continúa escalando en volumen y "
  "sofisticación " + cite("apwg2026", "enisa2025") + ".")
P("La región presenta una combinación particularmente adversa. Por un lado, la banca digital y "
  "las fintech crecieron más rápido que los mecanismos de protección del usuario; por otro, las "
  "herramientas de seguridad disponibles están diseñadas para equipos técnicos, en inglés y con "
  "modelos de precios corporativos. El resultado es una asimetría: el delincuente dispone de "
  "kits de phishing de bajo costo y de canales masivos, mientras el ciudadano común carece de un "
  "medio sencillo para verificar un enlace antes de abrirlo.")
P("Esta investigación delimita el problema en tres dimensiones. Geográficamente, el diseño y la "
  "validación se concentran en Colombia, con un catálogo de marcas y una base de datos de "
  "indicadores que cubre además México, Argentina, Chile, Perú, Brasil y Paraguay. "
  "Poblacionalmente, se dirige a personas entre 18 y 65 años con acceso a internet y uso de "
  "servicios financieros digitales, con énfasis en quienes tienen baja alfabetización digital. "
  "Temporalmente, el periodo de desarrollo y observación comprende de agosto de 2025 a noviembre "
  "de 2026. Técnicamente, el alcance se limita al análisis de contenido textual y enlaces (URL, "
  "mensajes, WhatsApp, correo, QR y teléfonos); no incluye monitoreo transaccional, análisis "
  "forense de dispositivos ni detección de deepfakes, que se reconocen como trabajo futuro.")

H2("1.2 Cifras verificadas y alcance de cada estadística")
P("Las cifras que sustentan el planteamiento provienen de fuentes primarias o institucionales "
  "con metodología pública. No son directamente comparables, porque miden poblaciones, periodos "
  "y unidades distintas: costo organizacional, ataques observados, incidentes gestionados, "
  "reclamaciones financieras y percepción de usuarios. La Tabla 4 presenta la población, el "
  "periodo y la unidad de medida de cada indicador.")
P("El informe de IBM de 2024 sitúa el costo promedio de una filtración en Latinoamérica en USD "
  "4,16 millones, por debajo del promedio global de USD 4,88 millones y de Estados Unidos (USD "
  "9,36 millones) " + cite("ibm2024") + ". Esa cifra no sustenta la afirmación de que la región "
  "tenga el costo más alto del mundo; sí permite señalar que el impacto es significativo en "
  "relación con el ingreso per cápita y que persiste una brecha de protección.")

T("Cifras verificadas sobre fraude digital y su alcance", ["Indicador", "Valor reportado", "Periodo y población", "Fuente"], [
    ["Costo promedio de una filtración de datos en Latinoamérica", "USD 4,16 millones (promedio global: USD 4,88 millones)", "2024; 604 organizaciones en 16 países y regiones; muestra LatAm de 28 organizaciones en México, Argentina, Chile y Colombia", "IBM/Ponemon " + cite("ibm2024")],
    ["Ataques de phishing observados globalmente", "3,8 millones en 2025; 853.244 en el cuarto trimestre", "2025; sitios y campañas reportados a APWG por sus miembros", "APWG " + cite("apwg2026")],
    ["Incidentes de seguridad digital gestionados por el CERT colombiano", "1.427 en 2024; 697 en 2025 (−48,8 %)", "2024–2025; Colombia; incidentes gestionados, no intentos totales", "MinTIC/ColCERT " + cite("mintic2026")],
    ["Reclamaciones por fraude ante la banca colombiana", "Más de 765.000, por más de COP 967.000 millones", "2025; Colombia; reclamaciones de clientes al sistema financiero", "Asobancaria " + cite("asobancaria2026")],
    ["Reclamaciones por fraude en el sistema financiero mexicano", "MXN 33.329 millones (+7,2 %); robo de identidad: MXN 11.302 millones (+77 %), 36.428 reclamaciones", "2024; México; usuarios de servicios financieros; solo 1,4 % del monto se reembolsó", "CONDUSEF " + cite("condusef2025")],
    ["Reconocimiento de sitios web falsos por usuarios latinoamericanos", "34 % no sabe identificar un sitio falso; 11 % no sabría cómo verificarlo", "Estudio de 1.559 usuarios de 18 a 55 años en Brasil, Colombia, México y Perú; tercer trimestre de 2024", "Kaspersky/CORPA " + cite("kaspersky2026", "kaspersky2024")],
], widths=[4.2, 4.4, 5.0, 2.8], font=8.2, align=["l", "c", "j", "l"],
   note="Fuente: elaboración propia a partir de las fuentes citadas. Las cifras no son comparables entre sí: "
        "cada una mide un objeto distinto (costo organizacional, ataques observados, incidentes gestionados, "
        "reclamaciones o percepción).")

P("Estas cifras permiten sostener tres afirmaciones acotadas: (i) el fraude digital tiene un "
  "costo económico relevante para las organizaciones y para los usuarios; (ii) el volumen de "
  "ataques de phishing sigue siendo alto y sostenido; y (iii) una parte significativa de la "
  "población no cuenta con criterios para verificar la legitimidad de un sitio. No permiten "
  "afirmar, sin un estudio propio, que el fraude haya crecido exactamente en un porcentaje "
  "determinado en toda la región ni que una sola herramienta pueda resolverlo.")

H2("1.3 Modalidades de fraude relevantes")
P("La literatura clasifica los ataques de ingeniería social según el canal y el objetivo "
  "perseguido " + cite("heartfield2016", "almomani2013") + ". Para este proyecto se adoptan las "
  "modalidades con mayor incidencia en la región y se relacionan con los canales que la "
  "plataforma analiza: phishing por correo y web, smishing (SMS), vishing (llamadas), quishing "
  "(códigos QR), pharming (redirección de tráfico) y suplantación de marca mediante dominios "
  "tipográficamente similares (typosquatting). El detalle conceptual se presenta en el capítulo "
  "4; aquí basta señalar que cada modalidad deja rastros verificables —una URL, un remitente, un "
  "número, un texto con urgencia— que pueden analizarse antes de que el usuario interactúe.")

H2("1.4 Población afectada")
P("El impacto no se distribuye de forma homogénea. Los adultos mayores, los migrantes, los "
  "microempresarios y las personas con baja alfabetización digital enfrentan mayores barreras "
  "para verificar un enlace, comprender una alerta técnica o denunciar un fraude. Para estos "
  "grupos, una pérdida puede significar el agotamiento de ahorros, la clonación de identidad o "
  "la exclusión del sistema financiero. La dimensión emocional —vergüenza, estrés y pérdida de "
  "confianza— también reduce la probabilidad de denuncia y, con ello, la calidad de los datos "
  "disponibles para prevenir nuevos casos. La plataforma se diseñó con lenguaje claro y "
  "explicaciones accionables precisamente para reducir esa barrera.")

H2("1.5 Problema central")
P("Las herramientas de referencia —VirusTotal, PhishTank, URLScan.io y Truecaller— resuelven "
  "funciones específicas y son valiosas para analistas, pero su documentación y su interfaz "
  "están orientadas a usuarios técnicos " + cite("virustotal2025", "phishtank2025", "urlscan2025", "truecaller2025") + ". "
  "VirusTotal agrega motores antivirus y análisis de archivos y URL; PhishTank mantiene una base "
  "colaborativa de URL de phishing; URLScan.io captura el contenido renderizado de un sitio; "
  "Truecaller identifica llamadas y mensajes a partir de su directorio comunitario. Ninguna de "
  "ellas ofrece, en conjunto, una explicación en español para un usuario no técnico, un "
  "verificador de marcas latinoamericanas y un flujo comunitario de reportes con análisis "
  "inmediato. Esa combinación es la brecha que el proyecto aborda.")
P("La revisión realizada no permite afirmar que “no exista” una solución equivalente en el "
  "mercado; permite afirmar que, entre las herramientas revisadas y con la evidencia disponible, "
  "no se identificó una que reúna simultáneamente las seis características definidas en el "
  "capítulo 3. La diferencia es relevante: la primera afirmación es absoluta y no verificable; "
  "la segunda es acotada y coherente con el método de revisión.")
P("Como consecuencia, el usuario común enfrenta cuatro dificultades concretas:")
numbered([
    "Verificar en tiempo real una URL, un correo, un mensaje, un código QR o un número antes de interactuar.",
    "Reportar indicadores de compromiso de forma colaborativa y en su propio idioma.",
    "Visualizar las amenazas activas de su país y de la región para tomar decisiones informadas.",
    "Recibir una explicación comprensible de por qué un contenido es fraudulento, más allá de una alerta técnica.",
])

H2("1.6 Formulación del problema")
P("¿Cómo puede una plataforma web gratuita, en español y basada en inteligencia artificial "
  "contribuir a reducir la vulnerabilidad del ciudadano latinoamericano frente al fraude "
  "digital —detección, análisis y prevención en tiempo real— ante herramientas técnicas que "
  "resultan inaccesibles para el usuario común?")

H2("1.7 Sistematización del problema")
P("De la pregunta principal se derivan las siguientes preguntas secundarias:")
numbered([
    "¿Es viable emplear modelos de lenguaje para clasificar contenido fraudulento en español y generar explicaciones comprensibles para usuarios no técnicos?",
    "¿Qué mecanismos heurísticos permiten detectar suplantación de marca (typosquatting) con una tasa de falsos positivos aceptable?",
    "¿Cómo puede una comunidad de usuarios contribuir a un acervo regional de inteligencia de amenazas mediante reportes verificables?",
    "¿Qué arquitectura de software permite un despliegue de bajo costo, con disponibilidad medible y capacidad de degradación controlada ante fallas de servicios externos?",
    "¿Cómo evaluar el desempeño de la solución con criterios medibles y evidencias reproducibles, más allá del cumplimiento de casos funcionales?",
])

H2("1.8 Delimitación y supuestos")
P("El proyecto se apoya en tres supuestos explícitos. Primero, que el usuario accede a la "
  "plataforma desde un navegador o un dispositivo móvil con conectividad; no se asume la "
  "instalación de software. Segundo, que el análisis de contenido textual y de enlaces es "
  "suficiente para una primera capa de protección; el monitoreo transaccional y el análisis "
  "forense quedan fuera del alcance. Tercero, que los servicios externos (Gemini, Supabase, "
  "Render, Vercel) pueden fallar, por lo que el sistema debe operar con un modo degradado y "
  "registrar la causa. La delimitación geográfica y poblacional se detalló en la sección 1.1. "
  "No se formula una promesa de reducción medible del fraude a escala regional: se evalúa la "
  "capacidad de la plataforma para detectar, explicar y clasificar correctamente un conjunto "
  "de casos, que es una condición necesaria —no suficiente— para ese impacto.")

# ═══════════════════════════════════════════════════════════════════════════
# 2. JUSTIFICACIÓN
# ═══════════════════════════════════════════════════════════════════════════
H1("2. JUSTIFICACIÓN")

H2("2.1 Relevancia social")
P("AgielShield aborda un problema que afecta de manera desproporcionada a grupos vulnerables. "
  "La posibilidad de verificar un enlace en segundos, en español y sin costo, reduce una barrera "
  "concreta de acceso a la protección digital. El proyecto no sustituye la educación financiera "
  "ni la acción de las autoridades, pero ofrece un instrumento inmediato mientras esas políticas "
  "se consolidan. Su diseño prioriza la claridad: explicaciones breves, recomendaciones "
  "accionables y una advertencia comprensible incluso para quien no distingue entre un dominio "
  "oficial y uno imitado.")

H2("2.2 Relevancia tecnológica")
P("El aporte técnico se concentra en cuatro decisiones. Primera, un enfoque híbrido que combina "
  "un motor heurístico determinista con un modelo generativo; la heurística garantiza "
  "disponibilidad y auditabilidad, y el modelo aporta comprensión del lenguaje y detección de "
  "señales no catalogadas " + cite("basit2021", "gemini2025") + ". Segunda, un verificador de "
  "dominios que compara el dominio analizado con un catálogo de marcas latinoamericanas usando "
  "distancia de Levenshtein y similitud de secuencias " + cite("levenshtein1966", "szurdi2014") + ". "
  "Tercera, una arquitectura de tres capas desplegada en servicios gestionados, con "
  "degradación controlada ante fallas externas. Cuarta, un mecanismo de reporte comunitario que "
  "convierte cada análisis en un indicador reutilizable, en línea con los principios de las "
  "plataformas de intercambio de inteligencia de amenazas " + cite("misp2025") + ".")

H2("2.3 Relevancia práctica")
P("La plataforma es accesible desde un navegador, sin instalación y sin costo para el usuario. "
  "Esa característica reduce la fricción de adopción y permite usarla en contextos educativos, "
  "comunitarios y de microempresa. El panel público de amenazas agrega valor incluso para quien "
  "no reporta: muestra qué dominios, tipos de fraude y países concentran los incidentes. La "
  "arquitectura elegida permite escalar a una aplicación móvil híbrida o a una extensión de "
  "navegador reutilizando la API y la lógica de negocio, sin reescribir el núcleo.")

H2("2.4 Relevancia académica y metodológica")
P("El proyecto integra ingeniería de software, seguridad informática, bases de datos, "
  "inteligencia artificial, experiencia de usuario y metodologías ágiles. Además, separa "
  "explícitamente la metodología de desarrollo (Scrum) de la metodología de evaluación "
  "(diseño de un conjunto etiquetado, matriz de confusión y métricas), lo que permite discutir "
  "los resultados con el rigor que exige un trabajo de grado " + cite("wohlin2012", "sommerville2016") + ". "
  "La documentación de las limitaciones y de los resultados pendientes forma parte del aporte: "
  "evita confundir una demostración funcional con una validación de efectividad.")

H2("2.5 Viabilidad y consideraciones éticas")
P("La viabilidad económica se sustenta en el uso de planes gratuitos y en una arquitectura "
  "ligera; el presupuesto del capítulo 11 valoriza los costos indirectos para no ocultar el "
  "esfuerzo real. La viabilidad técnica se respalda en tecnologías maduras y documentadas "
  "—FastAPI, React, PostgreSQL— y en un pipeline de integración continua " + cite("fastapi2025", "react2025", "postgres2025", "ghactions2025") + ". "
  "En el plano ético, el proyecto trata datos personales y, por ello, aplica privacidad desde el "
  "diseño: consentimiento, minimización, enmascaramiento de teléfonos y cuentas en las vistas "
  "públicas, control de acceso por roles y registro de auditoría. No se realizan pruebas de "
  "intrusión sobre sistemas de terceros ni se almacenan credenciales de víctimas.")

# ═══════════════════════════════════════════════════════════════════════════
# 3. ESTADO DEL ARTE
# ═══════════════════════════════════════════════════════════════════════════
H1("3. ESTADO DEL ARTE")

P("El estado del arte se organiza en cinco frentes que convergen en la solución propuesta: la "
  "caracterización del fraude por ingeniería social, los métodos de detección de phishing, la "
  "detección de suplantación de marca mediante dominios similares, el uso de modelos de lenguaje "
  "en tareas de clasificación y explicación, y las plataformas colaborativas de inteligencia de "
  "amenazas. Para cada frente se identifican los aportes consolidados y las limitaciones que "
  "justifican el vacío de investigación abordado.")

H2("3.1 Antecedentes y evolución del fraude por ingeniería social")
P("La literatura clásica sobre filtrado de correo no deseado y phishing se consolidó entre 2005 y "
  "2016. Almomani et al. sistematizaron las técnicas de filtrado en cuatro familias —listas "
  "negras, análisis de cabeceras, análisis de contenido y enfoques híbridos— y advirtieron que "
  "ninguna familia, por sí sola, alcanza una detección robusta frente a campañas nuevas "
  + cite("almomani2013") + ". Heartfield y Loukas ampliaron el objeto de estudio desde el correo "
  "hacia lo que denominaron ingeniería social semántica: ataques que explotan la confianza y el "
  "contexto del usuario a través de múltiples canales, incluidos los mensajes instantáneos y las "
  "redes sociales " + cite("heartfield2016") + ". Esa ampliación es relevante para este proyecto, "
  "porque el canal dominante en Latinoamérica ya no es el correo electrónico sino la mensajería "
  "móvil.")
P("Varshney et al. clasificaron los esquemas de detección de phishing web en función de las "
  "señales que utilizan: URL, contenido de la página, reputación de terceros y comportamiento del "
  "usuario " + cite("varshney2016") + ". Su conclusión principal es que las señales de URL son "
  "baratas de calcular y aptas para una decisión en tiempo real, mientras que las señales de "
  "contenido requieren renderizar el sitio y consumen más recursos. El proyecto adopta esa "
  "distinción al construir una primera capa inmediata a partir del texto y la URL, sin depender de "
  "la renderización remota.")

H2("3.2 Detección de phishing basada en listas, contenido y comportamiento")
P("Las listas de reputación —PhishTank, OpenPhish, Google Safe Browsing— ofrecen alta precisión "
  "sobre amenazas ya conocidas, pero tienen dos limitaciones estructurales: dependen de que la URL "
  "haya sido reportada y su vigencia es corta, porque los atacantes rotan dominios en horas "
  + cite("phishtank2025") + ". VirusTotal agrega decenas de motores y aporta una señal valiosa, "
  "aunque su resultado requiere interpretación técnica y su cuota gratuita es limitada "
  + cite("virustotal2025") + ". URLScan.io resuelve la inspección del contenido renderizado y de "
  "las peticiones de red " + cite("urlscan2025") + ", lo que es útil para investigación forense, "
  "pero excesivo para una consulta ciudadana frecuente.")
P("Los enfoques de aprendizaje automático supervisado reportan métricas altas en conjuntos "
  "académicos, aunque su generalización es sensible al dominio de entrenamiento y al desbalance de "
  "clases. Basit et al. revisaron técnicas habilitadas por inteligencia artificial para la "
  "detección de phishing y concluyeron que la combinación de características léxicas, de URL y de "
  "contenido supera a cualquier familia aislada, a costa de una mayor complejidad de "
  "mantenimiento " + cite("basit2021") + ". Ese hallazgo respalda la decisión de diseñar un "
  "enfoque híbrido y explícito, en lugar de depender de un único modelo opaco.")

H2("3.3 Suplantación de marca y dominios tipográficamente similares")
P("El typosquatting consiste en registrar dominios que imitan a una marca mediante errores de "
  "escritura, omisiones, transposiciones, adición de palabras o cambios de dominio de nivel "
  "superior. Szurdi et al. analizaron más de un cuarto de millón de dominios y documentaron que la "
  "práctica es masiva, persistente y económicamente rentable para el atacante "
  + cite("szurdi2014") + ". La distancia de Levenshtein, definida como el número mínimo de "
  "inserciones, eliminaciones y sustituciones necesarias para transformar una cadena en otra "
  + cite("levenshtein1966") + ", es una medida adecuada para detectar estas variaciones, siempre "
  "que se aplique sobre el registro raíz y no sobre la URL completa.")
P("La literatura posterior añade similitud de secuencias, análisis de tokens y reputación del TLD. "
  "El riesgo práctico de estas técnicas es el falso positivo: dominios legítimos de una marca "
  "regional pueden parecer imitaciones de otra marca global. Por esa razón, el proyecto combina "
  "distancia de Levenshtein, similitud de secuencia, coincidencia exacta contra un catálogo de "
  "dominios oficiales y una lista de tokens genéricos que no deben disparar la alerta.")

H2("3.4 Modelos de lenguaje en ciberseguridad")
P("Los modelos de lenguaje de gran escala se han empleado con éxito en tareas de explicación, "
  "resumen y clasificación de texto no estructurado. Su ventaja para este proyecto no es sustituir "
  "al motor determinista, sino interpretar mensajes redactados con lenguaje natural variado —por "
  "ejemplo, una extorsión sin la palabra “extorsión”— y producir una explicación comprensible. Su "
  "limitación es igualmente clara: latencia variable, costo por consulta, posibilidad de error y "
  "dependencia de un proveedor externo " + cite("gemini2025") + ".")
P("La estrategia adoptada frente a esa limitación es de degradación controlada: la decisión de "
  "riesgo se calcula siempre con reglas deterministas y el modelo enriquece la explicación cuando "
  "está disponible. Así, una falla del proveedor no deja al usuario sin respuesta, y el resultado "
  "sigue siendo auditable. Esta decisión de diseño responde a un criterio de ingeniería y no solo "
  "de precisión: un sistema de seguridad debe fallar de forma segura y explicable.")

H2("3.5 Inteligencia de amenazas colaborativa")
P("Las plataformas de intercambio de indicadores —MISP es el referente abierto— demostraron que la "
  "colaboración entre organizaciones mejora la detección temprana, siempre que existan estándares "
  "de formato, controles de calidad y reglas de compartición " + cite("misp2025") + ". En el "
  "ámbito ciudadano, esa lógica se traduce en reportes comunitarios: cada usuario aporta un "
  "indicador y el sistema lo contrasta, lo clasifica y lo pone a disposición de los demás. El reto "
  "es la calidad del dato, porque un reporte erróneo puede generar falsos positivos y erosionar la "
  "confianza.")
P("Los reportes internacionales coinciden en que el volumen y la sofisticación del phishing siguen "
  "en aumento: APWG registró 3,8 millones de ataques en 2025 " + cite("apwg2026") + ", ENISA "
  "identifica la explotación de la confianza como patrón dominante " + cite("enisa2025") + " y "
  "INTERPOL documenta la profesionalización de las redes criminales que ofrecen el fraude como "
  "servicio " + cite("interpol2024") + ". Ninguno de esos informes resuelve el problema de "
  "accesibilidad para el ciudadano común, que es el objeto de este proyecto.")

H2("3.6 Herramientas de referencia y comparación de capacidades")
P("La Tabla 5 compara las herramientas revisadas con AgielShield en ocho capacidades. La "
  "comparación no es una evaluación de calidad —cada herramienta responde a un propósito "
  "distinto— sino un instrumento para identificar la combinación de funciones que el proyecto "
  "aporta.")

T("Comparación de capacidades con soluciones existentes",
  ["Capacidad", "VirusTotal / PhishTank", "URLScan.io", "Truecaller", "AgielShield"],
  [
      ["Idioma de la interfaz y de las explicaciones", "Inglés", "Inglés", "Multilenguaje parcial", "Español"],
      ["Público objetivo declarado", "Analistas y equipos de seguridad", "Analistas e investigadores", "Usuario general", "Ciudadano no técnico"],
      ["Análisis de URL y dominio", "Sí", "Sí", "No", "Sí"],
      ["Análisis de texto libre (SMS, WhatsApp, correo)", "No", "No", "Parcial (identificación de llamadas)", "Sí"],
      ["Verificación de marcas latinoamericanas", "No", "No", "No", "Sí (catálogo regional)"],
      ["Explicación en lenguaje natural del veredicto", "Parcial", "No", "No", "Sí"],
      ["Reporte comunitario abierto", "Sí (PhishTank)", "No", "Parcial (directorio)", "Sí"],
      ["Costo para el usuario final", "Gratuito con cuota", "Gratuito con cuota", "Freemium", "Gratuito"],
  ],
  widths=[5.4, 3.2, 2.6, 2.9, 3.0], font=8.0, align=["l", "c", "c", "c", "c"],
  note="Fuente: elaboración propia a partir de la documentación pública de cada herramienta "
       + cite("virustotal2025", "phishtank2025", "urlscan2025", "truecaller2025") + ".")

P("La lectura de la tabla permite sostener una afirmación acotada: entre las herramientas "
  "revisadas, ninguna reúne simultáneamente análisis de texto libre, verificación de marcas "
  "regionales, explicación en español y reporte comunitario. Esa es la brecha que el proyecto "
  "ocupa. No se afirma que no existan otras iniciativas —el ecosistema es amplio y cambia "
  "rápidamente— sino que la combinación identificada no fue encontrada en la revisión realizada.")

H2("3.7 Vacíos identificados y posicionamiento del proyecto")
P("Del recorrido anterior se desprenden cuatro vacíos. Primero, la mayoría de las soluciones "
  "asume un usuario capaz de interpretar una puntuación técnica o un listado de motores. Segundo, "
  "los catálogos de marcas y los conjuntos de entrenamiento están sesgados hacia Estados Unidos y "
  "Europa, lo que reduce su desempeño en Latinoamérica. Tercero, la detección y la explicación "
  "suelen resolverse con el mismo componente, de modo que una falla del modelo deja al usuario sin "
  "respuesta. Cuarto, la evaluación de estas herramientas rara vez se reporta con matrices de "
  "confusión y conjuntos etiquetados reproducibles.")
P("AgielShield se posiciona en la intersección de esos cuatro vacíos: interfaz en español para "
  "usuario no técnico, catálogo regional de marcas, separación entre decisión determinista y "
  "explicación generativa, y una evaluación documentada con métricas de clasificación. El aporte "
  "no es la invención de una técnica, sino la integración verificable de técnicas conocidas en un "
  "producto accesible y su evaluación explícita.")

# ═══════════════════════════════════════════════════════════════════════════
# 4. MARCO REFERENCIAL
# ═══════════════════════════════════════════════════════════════════════════
H1("4. MARCO REFERENCIAL")

P("Este capítulo establece los conceptos, el contexto histórico, el vocabulario, el marco legal y "
  "las consideraciones ambientales que delimitan la interpretación de los resultados. El marco se "
  "presenta en su forma singular y las decisiones de diseño se describen como tales, sin atribuirles "
  "el carácter de postulados teóricos.")

H2("4.1 Marco teórico")
H3("4.1.1 Ingeniería social y phishing")
P("La ingeniería social es la manipulación de una persona para que ejecute una acción que beneficia "
  "al atacante, generalmente revelar información, instalar software o transferir dinero. El "
  "phishing es su expresión más difundida y se caracteriza por suplantar una entidad legítima para "
  "obtener credenciales o datos financieros. Sus variantes se nombran según el canal: smishing "
  "(SMS), vishing (voz), quishing (código QR), pharming (redirección del tráfico) y angler phishing "
  "(suplantación en redes sociales) " + cite("heartfield2016") + ".")
P("Desde la perspectiva del modelo de comunicación, el ataque combina cuatro elementos: una fuente "
  "aparentemente legítima, un mensaje con urgencia o amenaza, un canal de bajo costo y una acción "
  "deseada. La detección temprana puede apoyarse en cualquiera de ellos: reputación de la fuente, "
  "análisis del texto, características del canal o verificación del destino del enlace. El proyecto "
  "explota los tres últimos.")

H3("4.1.2 Indicadores de compromiso")
P("Un indicador de compromiso (IoC) es un dato observable que sugiere actividad maliciosa: una URL, "
  "un dominio, una dirección IP, un hash de archivo, un número telefónico o una cuenta bancaria. "
  "Los IoC son valiosos porque son concretos y automatizables, pero envejecen rápido. La "
  "arquitectura del proyecto almacena los IoC en la tabla de reportes comunitarios y los reutiliza "
  "en el motor heurístico, con la precaución de no tratarlos como prueba definitiva.")

H3("4.1.3 Detección determinista y detección estadística")
P("La detección determinista aplica reglas explícitas: si el dominio usa un TLD de bajo costo y "
  "contiene el nombre de un banco sin ser su dominio oficial, entonces se incrementa el riesgo. Su "
  "ventaja es la auditabilidad; su límite, la rigidez. La detección estadística aprende patrones a "
  "partir de datos y generaliza mejor ante variaciones, a costa de transparencia y de necesidad de "
  "datos etiquetados. El enfoque híbrido combina una base determinista —siempre disponible— con un "
  "modelo generativo que interpreta lenguaje natural " + cite("basit2021") + ".")

H3("4.1.4 Modelos de lenguaje y explicabilidad")
P("Un modelo de lenguaje generativo produce texto a partir de una instrucción. En este proyecto se "
  "usa para dos tareas acotadas: clasificar el contenido en una escala de riesgo y redactar una "
  "explicación con recomendaciones. No se usa para tomar decisiones irreversibles ni para ejecutar "
  "acciones. La instrucción del sistema restringe el formato de salida y el modelo heurístico "
  "valida el resultado antes de exponerlo, de modo que una respuesta anómala no se propague al "
  "usuario.")

H3("4.1.5 Distancia de edición y similitud de secuencias")
P("La distancia de Levenshtein entre dos cadenas es el mínimo número de operaciones unitarias de "
  "inserción, eliminación y sustitución para transformar una en otra " + cite("levenshtein1966") + ". "
  "Para dos cadenas de longitud m y n, el algoritmo clásico requiere O(m·n) tiempo y O(min(m,n)) "
  "espacio. La similitud de secuencias de Python, basada en el mismo principio, devuelve un valor "
  "entre 0 y 1 que se interpreta como proporción de coincidencia. El proyecto combina ambas medidas "
  "porque la distancia absoluta castiga las cadenas cortas y la similitud relativa las favorece.")

H2("4.2 Marco histórico")
P("El fraude digital evolucionó en cuatro olas. La primera, entre 1995 y 2003, se concentró en el "
  "correo masivo y en los fraudes con tarjeta. La segunda, entre 2004 y 2012, incorporó el phishing "
  "dirigido, la clonación de sitios bancarios y los troyanos bancarios. La tercera, entre 2013 y "
  "2019, trasladó la interacción a la mensajería móvil y a las redes sociales, con un aumento de la "
  "suplantación de identidad y de las estafas románticas. La cuarta, desde 2020, se caracteriza por "
  "la industrialización del fraude: kits listos para usar, granjas de cuentas, modelos de lenguaje "
  "para redactar mensajes convincentes y servicios de lavado de dinero " + cite("interpol2024") + ".")
P("En Latinoamérica, la digitalización financiera aceleró la adopción de billeteras móviles y pagos "
  "instantáneos, lo que amplió la base de víctimas potenciales. Colombia ilustra el patrón: la "
  "banca reportó más de 765.000 reclamaciones por fraude en 2025 " + cite("asobancaria2026") + ", "
  "mientras el CERT nacional redujo los incidentes gestionados de 1.427 a 697 entre 2024 y 2025 "
  + cite("mintic2026") + ". La reducción de incidentes gestionados no implica necesariamente una "
  "reducción del fraude: puede reflejar cambios en el reporte o en la capacidad de atención.")

H2("4.3 Marco conceptual")
P("Para evitar ambigüedad, se adoptan las siguientes definiciones operativas, que se usan de forma "
  "consistente en el resto del documento:")
bullets([
    "Phishing: suplantación de una entidad legítima para obtener credenciales o datos financieros.",
    "Smishing, vishing y quishing: variantes de phishing por SMS, voz y código QR, respectivamente.",
    "Typosquatting: registro de dominios que imitan una marca mediante variaciones tipográficas.",
    "IoC (indicador de compromiso): dato observable asociado a actividad maliciosa.",
    "Falso positivo: caso legítimo clasificado como fraudulento.",
    "Falso negativo: caso fraudulento clasificado como legítimo.",
    "Precisión: proporción de casos señalados como fraudulentos que efectivamente lo son.",
    "Exhaustividad (recall): proporción de casos fraudulentos que el sistema logra detectar.",
    "Tasa de falsos positivos (FPR): proporción de casos legítimos incorrectamente señalados.",
    "Confianza del veredicto de dominio: valor de 0 a 100 que expresa la certeza de la "
    "clasificación; no es una probabilidad calibrada.",
    "Score de riesgo: valor entero de 0 a 100 que resume la evidencia acumulada por el motor.",
])

H2("4.4 Marco legal")
P("El proyecto trata datos personales y, por tanto, se rige por el régimen colombiano de protección "
  "de datos. La Ley 1581 de 2012 establece los principios de finalidad, libertad, veracidad, "
  "transparencia, acceso y circulación restringida, seguridad y confidencialidad "
  + cite("ley1581") + "; el Decreto 1377 de 2013 reglamenta el consentimiento y el aviso de "
  "privacidad " + cite("decreto1377") + ". La Ley 1273 de 2009 tipifica los delitos informáticos y "
  "resulta pertinente para delimitar el uso legítimo de la información " + cite("ley1273") + ". El "
  "CONPES 3995 fija la política nacional de confianza y seguridad digital " + cite("conpes3995") + ".")
P("En el plano regional, se consideran la Lei Geral de Proteção de Dados de Brasil " + cite("lgpd")
  + " y la Ley 19.628 de Chile " + cite("ley19628") + ", porque el catálogo de marcas y la "
  "posible expansión del servicio alcanzan esos mercados. La Tabla 6 resume la aplicabilidad de "
  "cada norma al proyecto.")

T("Marco legal y aplicabilidad al proyecto",
  ["Norma", "Ámbito", "Exigencia principal", "Aplicación en AgielShield"],
  [
      ["Ley 1581 de 2012", "Colombia", "Consentimiento, finalidad y derechos del titular", "Aviso de privacidad, consentimiento en el registro y minimización de datos"],
      ["Decreto 1377 de 2013", "Colombia", "Reglamenta el consentimiento y el aviso de privacidad", "Política de tratamiento y canal de atención al titular"],
      ["Ley 1273 de 2009", "Colombia", "Tipifica delitos informáticos", "Delimita el uso de la información y prohíbe el acceso a sistemas de terceros"],
      ["CONPES 3995 de 2020", "Colombia", "Política nacional de confianza y seguridad digital", "Alineación del servicio con los objetivos de confianza digital"],
      ["Lei 13.709 de 2018 (LGPD)", "Brasil", "Bases legales, derechos del titular y seguridad", "Referencia para la expansión del catálogo a Brasil"],
      ["Ley 19.628 de 1999", "Chile", "Protección de la vida privada y de los datos personales", "Referencia para la operación en Chile"],
  ],
  widths=[3.6, 2.2, 5.2, 6.1], font=8.2, align=["l", "c", "j", "j"],
  note="Fuente: elaboración propia a partir de las normas citadas "
       + cite("ley1581", "decreto1377", "ley1273", "conpes3995", "lgpd", "ley19628") + ".")

P("El proyecto no realiza perfilamiento con fines publicitarios, no vende datos y no comparte "
  "indicadores con terceros sin anonimización. Los teléfonos y las cuentas bancarias se enmascaran "
  "en las vistas públicas y el acceso a la información completa se restringe por rol. Estas "
  "medidas no agotan el cumplimiento, pero establecen una base verificable.")

H2("4.5 Marco ambiental")
P("La solución se diseñó para minimizar el consumo de recursos. Al ser una aplicación web servida "
  "desde un CDN, no requiere instalación en el dispositivo del usuario ni actualizaciones "
  "frecuentes de software local. El procesamiento pesado se delega en servicios gestionados que "
  "operan con economías de escala, y la capa determinista evita llamadas innecesarias al modelo "
  "generativo. El proyecto no realiza minería de criptomonedas, no entrena modelos propios y no "
  "almacena copias de contenido más allá de lo necesario para el historial del usuario.")
P("El costo ambiental dominante es el consumo energético de la infraestructura en la nube y de la "
  "red de comunicaciones. No se dispone de mediciones directas de huella de carbono; por ello, el "
  "documento no presenta cifras ambientales que no pueda sustentar. La decisión de diseño "
  "ambientalmente relevante es la degradación controlada: cuando el modelo generativo no está "
  "disponible, el sistema responde con la capa local y evita una llamada de red adicional.")

# ═══════════════════════════════════════════════════════════════════════════
# 5. OBJETIVOS
# ═══════════════════════════════════════════════════════════════════════════
H1("5. OBJETIVOS: GENERAL Y ESPECÍFICOS")

H2("5.1 Objetivo general")
P("Diseñar, implementar y evaluar una plataforma web gratuita, en español, que permita al "
  "ciudadano latinoamericano analizar contenido sospechoso —URL, mensajes, WhatsApp, correo "
  "electrónico, códigos QR y números telefónicos—, comprender el nivel de riesgo y disponer de "
  "recomendaciones accionables, mediante la integración de un motor heurístico, un verificador de "
  "dominios y un modelo de lenguaje, con criterios de desempeño medibles.")

H2("5.2 Objetivos específicos")
P("Los objetivos específicos se formulan en términos verificables. Cada uno se vincula con un "
  "indicador, una meta y una evidencia, incluido el objetivo de validación y desempeño. La "
  "redacción sigue los criterios de especificación de requisitos de ISO/IEC/IEEE 29148 "
  + cite("iso29148") + " y el principio de que todo objetivo debe poder medirse con un "
  "instrumento definido " + cite("wohlin2012") + ".")
numbered([
    "Caracterizar el problema del fraude digital en Latinoamérica y las herramientas existentes, "
    "mediante revisión documental de fuentes primarias e institucionales, para justificar la "
    "brecha que aborda el proyecto.",
    "Definir la arquitectura de software, el modelo de datos y los requerimientos funcionales y no "
    "funcionales de la plataforma, con criterios de seguridad, disponibilidad y bajo costo.",
    "Implementar el motor heurístico de clasificación de riesgo, con reglas explícitas, umbrales "
    "documentados y capacidad de operar sin servicios externos.",
    "Implementar el verificador de dominios basado en distancia de Levenshtein, similitud de "
    "secuencias y un catálogo de marcas latinoamericanas, con control de falsos positivos.",
    "Integrar un modelo de lenguaje para la explicación en lenguaje natural y la detección "
    "proactiva, con degradación controlada ante fallas del proveedor.",
    "Desarrollar los módulos de reporte comunitario, panel de amenazas, historial, gamificación y "
    "consola de administración, con control de acceso por roles y auditoría.",
    "Desplegar la solución con integración y entrega continuas, controles de seguridad y "
    "documentación de operación.",
    "Evaluar el desempeño del verificador de dominios y de la capa heurística sobre un conjunto "
    "etiquetado, mediante matriz de confusión, precisión, exhaustividad y tasa de falsos "
    "positivos, con umbrales de aceptación predefinidos.",
])

T("Objetivos específicos, indicadores y evidencias",
  ["OE", "Indicador", "Meta", "Evidencia", "Estado"],
  [
      ["OE1", "Cobertura de fuentes primarias y comparación de herramientas", "≥ 20 fuentes; ≥ 4 herramientas comparadas", "Capítulos 1 a 4 y Tabla 5", "Alcanzado"],
      ["OE2", "Artefactos de arquitectura y modelo de datos", "4 diagramas; 4 tablas en la base de datos", "Figuras 1 a 4 y Anexo B", "Alcanzado"],
      ["OE3", "Motor heurístico operativo sin dependencias externas", "Responde con score y nivel en < 50 ms", "Módulo risk_engine y pruebas unitarias", "Alcanzado"],
      ["OE4", "Verificador de dominios con catálogo regional", "≥ 30 marcas; FPR ≤ 0,10", "Módulo domain_verification y Tabla 16", "Alcanzado"],
      ["OE5", "Integración del modelo de lenguaje con respaldo local", "100 % de solicitudes responden aun sin API", "Módulo gemini_service y pruebas de contingencia", "Alcanzado"],
      ["OE6", "Módulos de comunidad, panel, gamificación y administración", "6 módulos funcionales", "Endpoints del Anexo A y pruebas de API", "Alcanzado"],
      ["OE7", "Despliegue con CI/CD y controles de seguridad", "Pipeline verde; 0 credenciales en el repositorio", "GitHub Actions y Anexo F", "Cumplido"],
      ["OE8", "Evaluación con métricas de clasificación", "Exactitud ≥ 0,90; recall ≥ 0,85; FPR ≤ 0,10", "Tablas 16 a 18 y Anexo D", "Alcanzado con limitaciones"],
  ],
  widths=[1.3, 4.9, 3.3, 4.2, 2.6], font=8.0, align=["c", "j", "j", "j", "c"],
  note="Fuente: elaboración propia. El estado se refiere a la fecha de corte del 5 de noviembre de 2026.")

# ═══════════════════════════════════════════════════════════════════════════
# 6. ALTERNATIVAS DE SOLUCIÓN
# ═══════════════════════════════════════════════════════════════════════════
H1("6. ALTERNATIVAS DE SOLUCIÓN")

P("Antes de seleccionar la arquitectura se evaluaron cuatro alternativas de implementación. La "
  "comparación se realizó con criterios explícitos y una ponderación acordada por el equipo, de "
  "modo que la decisión pueda auditarse y no dependa solo de una preferencia tecnológica. La "
  "evaluación de alternativas de diseño y la priorización por atributos de calidad son prácticas "
  "consolidadas de la ingeniería de software " + cite("sommerville2016") + ", y los atributos "
  "empleados —mantenibilidad, seguridad, eficiencia y adecuación funcional— se tomaron de la "
  "norma ISO/IEC 25010 " + cite("iso25010") + ".")

H2("6.1 Criterios de evaluación")
bullets([
    "Costo inicial y recurrente: inversión necesaria para construir y mantener la solución.",
    "Tiempo de desarrollo: esfuerzo requerido para alcanzar un producto funcional.",
    "Alcance funcional: capacidad de cubrir análisis, reporte, panel y administración.",
    "Adopción: facilidad de acceso para un usuario no técnico.",
    "Mantenibilidad: disponibilidad de talento, documentación y herramientas.",
    "Seguridad: superficie de ataque y facilidad de aplicar controles.",
])
P("El criterio de seguridad se interpreta conforme a los riesgos de aplicación web más frecuentes "
  "del OWASP Top 10 " + cite("owasp2021") + ", y el de autenticación conforme a las directrices "
  "de identidad digital del NIST " + cite("nist80063b") + ".")

H2("6.2 Alternativas consideradas")
numbered([
    "Aplicación nativa para Android e iOS: máxima integración con el dispositivo, pero requiere "
    "dos bases de código, publicación en tiendas y ciclos de actualización.",
    "Bot de mensajería (WhatsApp o Telegram): bajo costo de adopción y canal natural, pero "
    "limitado por las políticas del proveedor, sin panel de amenazas y con dificultades para "
    "analizar archivos y URLs.",
    "Extensión de navegador: protege la navegación, pero no cubre mensajes, llamadas ni códigos QR, "
    "y exige permisos que reducen la confianza del usuario.",
    "Aplicación web de página única con API REST: acceso inmediato sin instalación, alcance "
    "funcional amplio, reutilización de la lógica en futuras extensiones y despliegue de bajo costo.",
])

H2("6.3 Evaluación y selección")
P("La Tabla 8 puntúa cada alternativa de 1 a 5 en cada criterio y aplica una ponderación que suma "
  "100 %. La alternativa D obtiene el mayor puntaje y se selecciona como arquitectura del proyecto. "
  "El método de ponderación es una adaptación del análisis de decisión multicriterio descrito por "
  "Sommerville " + cite("sommerville2016") + ".")

T("Alternativas de solución y puntuación ponderada",
  ["Criterio", "Peso", "A. Nativa", "B. Bot", "C. Extensión", "D. SPA + API"],
  [
      ["Costo inicial y recurrente", "20 %", "2", "4", "3", "4"],
      ["Tiempo de desarrollo", "15 %", "2", "3", "4", "4"],
      ["Alcance funcional", "20 %", "4", "3", "2", "5"],
      ["Adopción por el usuario", "20 %", "3", "4", "3", "5"],
      ["Mantenibilidad", "15 %", "3", "3", "4", "4"],
      ["Seguridad y control", "10 %", "4", "3", "3", "4"],
      ["Puntaje ponderado", "100 %", "2,95", "3,40", "3,10", "4,40"],
  ],
  widths=[5.4, 1.8, 2.4, 2.2, 2.5, 2.6], font=8.4, align=["l", "c", "c", "c", "c", "c"],
  note="Fuente: elaboración propia. Escala de 1 (muy desfavorable) a 5 (muy favorable). El puntaje "
       "ponderado se calcula como la suma de cada puntaje multiplicado por su peso.")

P("La alternativa D no es la mejor en todos los criterios —una aplicación nativa ofrece mayor "
  "integración y una extensión protege mejor la navegación—, pero es la única que combina alcance "
  "funcional, adopción inmediata y costo sostenible. La decisión se refuerza con un criterio de "
  "riesgo: al no depender de las tiendas de aplicaciones ni de las políticas de un proveedor de "
  "mensajería, el equipo conserva el control del ciclo de entrega.")

# ═══════════════════════════════════════════════════════════════════════════
# 7. METODOLOGÍA PROPUESTA
# ═══════════════════════════════════════════════════════════════════════════
H1("7. METODOLOGÍA PROPUESTA")

P("Este capítulo distingue la metodología de desarrollo, que organiza la construcción del "
  "producto, de la metodología de evaluación, que establece cómo se mide su desempeño. La "
  "separación permite interpretar los resultados con precisión: que el producto funcione no "
  "demuestra que detecte bien, y que detecte bien en un conjunto pequeño no demuestra que funcione "
  "en producción.")

H2("7.1 Enfoque y tipo de investigación")
P("El trabajo se enmarca en la investigación aplicada, con un diseño de desarrollo tecnológico y un "
  "componente evaluativo de tipo cuantitativo. La unidad de análisis son los artefactos de software "
  "y su desempeño sobre un conjunto etiquetado de casos. No se plantea un experimento con grupo "
  "control ni una medición de impacto en la población, porque ello exigiría una muestra "
  "representativa y un periodo de observación que exceden el alcance del proyecto.")
P("El proceso combina revisión documental, modelado, implementación incremental y evaluación "
  "controlada. La revisión documental sustenta el problema y el estado del arte; el modelado "
  "produce la arquitectura y el modelo de datos; la implementación incremental entrega incrementos "
  "funcionales cada dos semanas; y la evaluación controlada mide precisión, exhaustividad y tasa de "
  "falsos positivos sobre un conjunto etiquetado " + cite("wohlin2012") + ".")

H2("7.2 Metodología de desarrollo: Scrum")
H3("7.2.1 Justificación")
P("Se eligió Scrum porque el alcance era cambiante y el equipo pequeño, con tres estudiantes y una "
  "asesora. Scrum aporta un marco de inspección y adaptación en ciclos cortos, con entregables "
  "verificables y una reunión diaria de sincronización " + cite("scrum2020") + ". La alternativa "
  "de un modelo en cascada habría concentrado la validación al final y habría dificultado corregir "
  "decisiones de arquitectura con el producto ya construido. Se descartó también Kanban puro porque "
  "el proyecto requería hitos de entrega evaluables por la institución.")

H3("7.2.2 Roles y responsabilidades")
P("La asignación de roles se adaptó a un equipo académico. El Product Owner asumió la voz del "
  "usuario y la priorización del backlog; el Scrum Master veló por la aplicación del marco y por la "
  "eliminación de impedimentos; el equipo de desarrollo concentró las tareas de análisis, diseño, "
  "implementación y pruebas. La asesora actuó como parte interesada externa y revisó los incrementos. "
  "La Tabla 9 documenta las responsabilidades y las evidencias asociadas.")

T("Roles y responsabilidades en Scrum",
  ["Rol", "Integrante", "Responsabilidad principal", "Evidencia"],
  [
      ["Product Owner", "Neil David Maza Girado", "Definir y priorizar el backlog; validar el valor de cada incremento", "Backlog priorizado y actas de revisión"],
      ["Scrum Master", "Steven Ruiz Fontalvo", "Facilitar los eventos, eliminar impedimentos y proteger el proceso", "Registro de impedimentos y acuerdos"],
      ["Equipo de desarrollo", "Keider Polo Arteaga y los tres integrantes", "Analizar, diseñar, implementar y probar los incrementos", "Commits, pull requests y pruebas"],
      ["Parte interesada", "Maybelline Castro (asesora)", "Revisar el avance académico y dar retroalimentación", "Observaciones de revisión"],
  ],
  widths=[3.1, 4.4, 5.6, 4.2], font=8.2, align=["l", "l", "j", "l"],
  note="Fuente: elaboración propia. En un equipo de tres integrantes los roles son complementarios y "
       "no exclusivos: todos participan en el desarrollo.")

H3("7.2.3 Eventos y artefactos")
P("Se realizaron ocho sprints de dos semanas. Cada sprint incluyó planificación, reuniones diarias "
  "breves, revisión del incremento y retrospectiva. Los artefactos fueron el product backlog, el "
  "sprint backlog, el incremento y la definición de terminado. La definición de terminado exigió "
  "cuatro condiciones: código integrado en la rama principal, pruebas automatizadas aprobadas, "
  "documentación mínima del endpoint y revisión de seguridad básica.")

H3("7.2.4 Priorización del backlog")
P("La priorización combinó el método MoSCoW con una matriz de valor y riesgo. Se clasificaron como "
  "“debe tener” la autenticación, el análisis de contenido, el motor heurístico y el reporte "
  "comunitario, porque sin ellos el producto no cumple su propósito. Se clasificaron como “debería "
  "tener” el panel de amenazas, la gamificación y la consola de administración, que agregan valor "
  "pero no bloquean el flujo principal. Se clasificaron como “podría tener” la exportación de "
  "reportes y la integración con directorios externos, y como “no tendrá en esta versión” el "
  "monitoreo transaccional y el análisis forense de dispositivos.")
P("Dentro de cada categoría se ordenó por valor para el usuario y por riesgo técnico, con un "
  "criterio explícito: primero se abordan los elementos de alto valor y alto riesgo, porque son los "
  "que pueden invalidar la arquitectura. El motor de análisis y la integración con el modelo de "
  "lenguaje se priorizaron por esa razón, antes que la interfaz de administración.")

H3("7.2.5 Sprints, objetivos y evidencias")
T("Sprints, objetivos y evidencias",
  ["Sprint", "Semanas", "Objetivo", "Entregable principal", "Evidencia"],
  [
      ["1", "1–2", "Configurar el proyecto, la base de datos y la autenticación", "API con registro, login y JWT", "Endpoints de autenticación y pruebas"],
      ["2", "3–4", "Implementar el motor heurístico de clasificación", "Servicio de análisis con score y nivel", "Pruebas unitarias del motor"],
      ["3", "5–6", "Construir el verificador de dominios", "Catálogo de marcas y detección de typosquatting", "Pruebas con dominios legítimos e imitados"],
      ["4", "7–8", "Integrar el modelo de lenguaje y la degradación controlada", "Servicio Gemini con respaldo local", "Pruebas de contingencia sin API"],
      ["5", "9–10", "Desarrollar el reporte comunitario y el panel de amenazas", "Formulario, listado y agregados por país y tipo", "Pruebas de API y validación de datos"],
      ["6", "11–12", "Implementar el historial y la gamificación", "Historial por usuario, reputación, insignias y racha", "Endpoints y pruebas de persistencia"],
      ["7", "13–14", "Construir la consola de administración y la auditoría", "Gestión de usuarios, reportes y registro de auditoría", "Pruebas de rol y auditoría"],
      ["8", "15–16", "Desplegar, evaluar y documentar", "Pipeline CI/CD, validación y documento final", "Pipeline, JSON de validación y este documento"],
  ],
  widths=[1.4, 1.6, 5.2, 5.4, 4.0], font=8.0, align=["c", "c", "j", "j", "j"],
  note="Fuente: elaboración propia. Las semanas se cuentan desde el inicio del desarrollo en agosto de 2025; "
       "la validación y la documentación se extendieron hasta noviembre de 2026.")

H3("7.2.6 Evidencias del proceso")
P("El proceso queda documentado en el repositorio del proyecto: historial de commits, mensajes de "
  "confirmación, ramas de funcionalidad, flujo de integración continua y pruebas automatizadas. "
  "Esta evidencia es verificable por un tercero y permite reconstruir qué se hizo y en qué orden. "
  "No se presentan actas de reunión diaria porque no se conservaron, lo que se reconoce como una "
  "limitación de la trazabilidad del proceso, no del producto.")

H2("7.3 Arquitectura de la solución")
P("La arquitectura sigue un patrón de tres capas con servicios gestionados. La capa de presentación "
  "es una aplicación de página única en React y TypeScript, servida desde un CDN. La capa de "
  "aplicación es una API REST en FastAPI, desplegada en un contenedor, que concentra la lógica de "
  "negocio y los controles de seguridad. La capa de datos es PostgreSQL, administrado como servicio. "
  "La Figura 1 muestra la disposición general y los controles transversales. Las tecnologías "
  "seleccionadas cuentan con documentación oficial y comunidades activas: React "
  + cite("react2025") + ", FastAPI " + cite("fastapi2025") + " y PostgreSQL " + cite("postgres2025") + ".")

F("fig111_arquitectura.png", "Arquitectura general de AgielShield: capas de presentación, aplicación y datos, con servicios externos y controles transversales.")

P("La separación en capas cumple tres propósitos. Primero, permite escalar la interfaz y la API de "
  "forma independiente. Segundo, aísla las credenciales de base de datos y de los servicios externos "
  "en el servidor, de modo que nunca llegan al navegador. Tercero, facilita la degradación "
  "controlada: si el proveedor del modelo de lenguaje falla, la API sigue respondiendo con la capa "
  "heurística y registra la causa.")
P("La Figura 2 descompone la capa de aplicación en módulos. La organización por servicios de "
  "dominio —análisis, verificación, reportes, seguridad— reduce el acoplamiento y permite probar "
  "cada módulo de forma aislada.")

F("fig111_componentes.png", "Diagrama de componentes y servicios: módulos del frontend, routers de la API, persistencia, servicios de análisis y soporte, y servicios externos.")

P("Las decisiones de despliegue priorizan el costo y la disponibilidad. El frontend se publica en "
  "un CDN con caché en el borde; la API se ejecuta en un servicio con reinicio automático; la base "
  "de datos administrada ofrece respaldo y recuperación. El pipeline de integración continua ejecuta "
  "lint, pruebas y compilación antes de desplegar " + cite("ghactions2025", "render2025", "vercel2025") + ".")

H2("7.4 Modelo de datos")
P("La base de datos consta de cuatro tablas: users, fraud_reports, scan_history y audit_logs. La "
  "Figura 3 presenta el modelo entidad-relación con las claves y las relaciones. La reputación, "
  "las insignias, la racha y la fecha del último escaneo son atributos del usuario y residen en "
  "users, por lo que no se requiere una tabla independiente de gamificación. La gestión de la "
  "base de datos se delega en un servicio administrado compatible con PostgreSQL "
  + cite("postgres2025", "supabase2025") + ".")

F("fig111_er.png", "Modelo entidad-relación: users, fraud_reports, scan_history y audit_logs. La gamificación reside en users y no en una tabla independiente.")

P("La relación principal es uno a muchos entre users y scan_history: un usuario puede tener muchos "
  "escaneos y un escaneo puede ser anónimo, en cuyo caso la clave foránea es nula. fraud_reports "
  "registra los reportes comunitarios y no depende de users, porque un reporte puede ser anónimo; "
  "su vínculo con la identidad es lógico y se resuelve en la capa de aplicación cuando el usuario "
  "está autenticado. audit_logs registra las acciones administrativas y referencia al administrador "
  "por correo, sin clave foránea, para preservar el registro aun si la cuenta se elimina.")
P("Esta decisión tiene una consecuencia de integridad que se documenta de forma explícita: la "
  "ausencia de clave foránea en audit_logs permite registros huérfanos. Se aceptó porque la "
  "prioridad es la inmutabilidad del registro de auditoría, y se compensa con una validación en la "
  "capa de aplicación que verifica la existencia del administrador antes de escribir.")

H2("7.5 Flujo de análisis")
P("La Figura 4 describe la secuencia de una consulta. El usuario envía el contenido; la API valida "
  "el esquema y aplica los límites de tasa; el motor heurístico calcula una primera puntuación; si "
  "el contenido es una URL, el verificador de dominios contrasta la marca y calcula la similitud; "
  "el modelo de lenguaje enriquece la explicación si está disponible; finalmente, la API persiste "
  "el resultado y devuelve una respuesta unificada. El flujo garantiza que siempre exista una "
  "respuesta, incluso cuando el proveedor externo no responde.")

F("fig111_secuencia.png", "Secuencia del proceso de análisis: validación, motor heurístico, verificación de dominio, enriquecimiento con el modelo de lenguaje, respaldo y persistencia.")

H2("7.6 Requerimientos funcionales y no funcionales")
P("Los requerimientos se derivan de los objetivos y se expresan con criterios de aceptación "
  "verificables. La Tabla 11 reúne los requerimientos funcionales y la Tabla 12 los no funcionales, "
  "con su métrica y su forma de verificación. La especificación sigue la estructura de ISO/IEC/IEEE "
  "29148 " + cite("iso29148") + "; los atributos no funcionales se clasifican según ISO/IEC 25010 "
  + cite("iso25010") + " y los controles de seguridad se alinean con el OWASP Top 10 "
  + cite("owasp2021") + " y con las directrices de autenticación del NIST " + cite("nist80063b") + ".")

T("Requerimientos funcionales y criterios de aceptación",
  ["ID", "Requerimiento funcional", "Criterio de aceptación"],
  [
      ["RF1", "Registrar e iniciar sesión con correo y contraseña", "El registro valida el correo y la contraseña; el login devuelve un token JWT válido"],
      ["RF2", "Habilitar autenticación de dos factores con TOTP", "El usuario puede activar 2FA y el sistema exige el código en el siguiente inicio de sesión"],
      ["RF3", "Analizar URL, mensajes, WhatsApp, correo, QR y teléfonos", "Cada tipo de contenido devuelve score, nivel, indicadores y recomendaciones"],
      ["RF4", "Verificar si un dominio corresponde a una marca legítima", "La respuesta incluye es_real, marca, confianza y score"],
      ["RF5", "Reportar un indicador de fraude de forma comunitaria", "El reporte se persiste con nivel de riesgo y queda disponible en el listado"],
      ["RF6", "Consultar reportes con paginación y filtros", "La respuesta incluye total, página y elementos; los filtros se aplican en el servidor"],
      ["RF7", "Visualizar un panel de amenazas por país y tipo", "El panel muestra agregados coherentes con los reportes almacenados"],
      ["RF8", "Consultar el historial personal de análisis", "Cada usuario ve únicamente sus escaneos, ordenados por fecha"],
      ["RF9", "Gestionar reputación, insignias y racha", "La reputación se actualiza al escanear y las insignias se asignan según reglas documentadas"],
      ["RF10", "Administrar usuarios, reportes y auditoría", "Solo los roles autorizados acceden; cada acción queda registrada"],
      ["RF11", "Autenticar integraciones mediante API Key", "Una clave válida accede a los endpoints permitidos; una inválida recibe 403"],
      ["RF12", "Exponer documentación interactiva de la API", "La ruta de documentación muestra todos los endpoints y esquemas"],
  ],
  widths=[1.3, 6.4, 8.5], font=8.0, align=["c", "j", "j"],
  note="Fuente: elaboración propia a partir de los módulos implementados.")

T("Requerimientos no funcionales, métricas y verificación",
  ["ID", "Requerimiento no funcional", "Métrica", "Verificación"],
  [
      ["RNF1", "Idioma español en interfaz y explicaciones", "100 % de textos visibles en español", "Revisión manual y pruebas de interfaz"],
      ["RNF2", "Disponibilidad del servicio", "≥ 99 % mensual (objetivo)", "Monitoreo del proveedor y registro de incidentes"],
      ["RNF3", "Tiempo de respuesta", "p95 ≤ 3 s en análisis con modelo; ≤ 300 ms sin modelo", "Medición sobre 50 solicitudes"],
      ["RNF4", "Seguridad de autenticación", "JWT firmado, hash de contraseña y 2FA disponible", "Revisión de código y pruebas de autenticación"],
      ["RNF5", "Control de acceso por roles", "0 accesos no autorizados en pruebas", "Pruebas de rol y auditoría"],
      ["RNF6", "Privacidad y enmascaramiento", "Teléfonos y cuentas enmascarados en vistas públicas", "Inspección de respuestas"],
      ["RNF7", "Compatibilidad", "Chrome, Edge y Firefox en sus dos últimas versiones", "Pruebas manuales de navegación"],
      ["RNF8", "Mantenibilidad", "Cobertura de pruebas del núcleo ≥ 60 %", "Reporte de cobertura"],
      ["RNF9", "Escalabilidad", "Soportar 100 solicitudes concurrentes sin error 5xx", "Prueba de carga controlada"],
      ["RNF10", "Trazabilidad", "100 % de acciones administrativas auditadas", "Consulta de audit_logs"],
  ],
  widths=[1.5, 5.6, 5.1, 4.0], font=8.0, align=["c", "j", "j", "j"],
  note="Fuente: elaboración propia. Las metas son objetivos de diseño; su cumplimiento se reporta en el capítulo 8.")

H2("7.7 Matriz de trazabilidad")
P("La trazabilidad conecta cada objetivo con los requerimientos que lo realizan y con las pruebas "
  "que lo verifican. La Tabla 13 permite identificar requerimientos sin cobertura y objetivos sin "
  "evidencia.")

T("Matriz de trazabilidad entre objetivos, requerimientos y pruebas",
  ["Objetivo", "Requerimientos", "Pruebas asociadas", "Evidencia"],
  [
      ["OE1", "—", "Revisión documental", "Capítulos 1 a 4"],
      ["OE2", "RF1, RF12", "Pruebas de autenticación y documentación", "Figuras 1 a 4"],
      ["OE3", "RF3", "test_heuristic_engine, test_gemini", "Tabla 17"],
      ["OE4", "RF4", "Pruebas del verificador de dominios", "Tabla 16"],
      ["OE5", "RF3, RF4", "test_gemini (contingencia)", "Anexo E"],
      ["OE6", "RF5 a RF11", "test_api, test_extended, pruebas de frontend", "Tabla 19"],
      ["OE7", "RF10, RF11", "Pipeline de CI y pruebas de API Key", "Anexo F"],
      ["OE8", "RF3, RF4", "validacion_111.py", "Tablas 16 a 18"],
  ],
  widths=[1.8, 3.0, 6.4, 5.5], font=8.2, align=["c", "l", "j", "j"],
  note="Fuente: elaboración propia.")

H2("7.8 Plan de pruebas")
P("El plan de pruebas combina cuatro niveles: unitarias, de integración, de contrato y de interfaz. "
  "Las pruebas unitarias verifican funciones puras del motor y del verificador; las de integración "
  "recorren los endpoints con una base de datos temporal; las de contrato validan códigos de estado "
  "y esquemas de respuesta; las de interfaz comprueban componentes React con Testing Library. La "
  "Tabla 14 resume el plan y los criterios de aceptación. La organización por niveles sigue las "
  "prácticas de verificación y validación descritas por Sommerville " + cite("sommerville2016")
  + " y el principio de que cada nivel debe tener un criterio de aceptación explícito "
  + cite("wohlin2012") + ".")

T("Plan de pruebas y criterios de aceptación",
  ["Nivel", "Herramienta", "Casos", "Criterio de aceptación", "Resultado"],
  [
      ["Pruebas unitarias y de integración", "pytest", "50", "100 % aprobadas", "49/50 en corrida agregada; 50/50 aisladas"],
      ["Contrato funcional", "Script test_api.py", "14 pasos", "100 % de pasos OK", "14/14"],
      ["Componentes de interfaz", "Vitest + Testing Library", "8", "100 % aprobadas", "8/8"],
      ["Extremo a extremo", "Playwright", "6", "100 % aprobadas con la pila activa", "Pendiente de ejecución"],
      ["Integración en vivo", "Script contra API desplegada", "9", "100 % aprobadas", "Pendiente de ejecución"],
  ],
  widths=[3.6, 4.2, 2.0, 5.0, 4.6], font=8.0, align=["l", "l", "c", "j", "j"],
  note="Fuente: elaboración propia. Los conteos provienen de la ejecución del 5 de noviembre de 2026 y se "
       "detallan en la Tabla 19. Las pruebas en vivo no se ejecutaron en esta corrida porque requieren "
       "una instancia desplegada y credenciales de prueba.")

H2("7.9 Metodología de evaluación")
P("La evaluación es independiente del desarrollo y se diseñó antes de ejecutar las pruebas. Su "
  "propósito es medir la capacidad de clasificación, no la cantidad de funcionalidades. Se adoptó un "
  "diseño descriptivo con un conjunto etiquetado de conveniencia, construido por los autores, y se "
  "reportan las métricas junto con sus limitaciones.")

H3("7.9.1 Construcción del conjunto etiquetado")
P("Se construyeron dos conjuntos. El primero contiene 30 dominios: 15 imitaciones fraudulentas "
  "—combinaciones de nombre de marca, palabras de urgencia y TLD de bajo costo— y 15 dominios "
  "oficiales de las mismas marcas, verificados manualmente en sus sitios institucionales. El "
  "segundo contiene 20 mensajes: 10 fraudulentos representativos de las modalidades del capítulo 1 "
  "y 10 benignos de la vida cotidiana. La etiqueta se asignó por consenso de los tres integrantes "
  "con un criterio explícito: un dominio es fraudulento si no pertenece al catálogo oficial de la "
  "marca que aparenta representar; un mensaje es fraudulento si contiene una solicitud de datos, "
  "dinero o instalación de software bajo presión, y no corresponde a un contexto verificable.")

H3("7.9.2 Procedimiento y métricas")
P("El procedimiento es reproducible con el script validacion_111.py incluido en el repositorio. "
  "Para cada caso se obtiene la predicción del sistema y se compara con la etiqueta. Se construye "
  "la matriz de confusión con las cuatro categorías —verdaderos positivos, verdaderos negativos, "
  "falsos positivos y falsos negativos— y se calculan las métricas de las ecuaciones (1) a (4).")
P("Precisión = VP / (VP + FP)   (1)", align="center", size=10.5)
P("Exhaustividad = VP / (VP + FN)   (2)", align="center", size=10.5)
P("Tasa de falsos positivos = FP / (FP + VN)   (3)", align="center", size=10.5)
P("Exactitud = (VP + VN) / (VP + VN + FP + FN)   (4)", align="center", size=10.5)
P("La definición operativa de estas métricas, su interpretación y su sensibilidad a los cambios en "
  "la matriz de confusión siguen a Sokolova y Lapalme " + cite("sokolova2009") + ".")
P("Se adoptaron umbrales de aceptación antes de la ejecución: exactitud ≥ 0,90, exhaustividad ≥ "
  "0,85, precisión ≥ 0,90 y tasa de falsos positivos ≤ 0,10. Un resultado por debajo de un umbral "
  "no se corrige cambiando el umbral; se documenta y se analiza.")

H3("7.9.3 Amenazas a la validez")
P("Se reconocen cuatro amenazas. La validez interna se ve afectada porque el etiquetado lo "
  "realizaron los mismos autores que construyeron el sistema, lo que puede introducir sesgo de "
  "confirmación. La validez externa es limitada porque la muestra es pequeña y de conveniencia, y "
  "no representa la distribución real de dominios y mensajes. La validez de constructo es parcial "
  "porque se usa el score con un umbral como proxy de la decisión, y el umbral no está calibrado "
  "con datos de producción. La validez de conclusión es limitada porque no se aplican pruebas de "
  "significancia estadística ni intervalos de confianza, dada la naturaleza descriptiva del "
  "ejercicio. La clasificación de estas amenazas sigue el esquema de validez de la investigación "
  "experimental en ingeniería de software " + cite("wohlin2012") + ".")
P("Estas amenazas no invalidan los resultados, pero impiden generalizarlos. Por esa razón el "
  "documento distingue entre “resultado en el conjunto de validación” y “desempeño esperado en "
  "producción”, y evita presentar el primero como si fuera el segundo.")

H2("7.10 Consideraciones éticas")
P("El proyecto no recolecta datos de víctimas ni analiza sistemas de terceros sin autorización. Los "
  "dominios del conjunto de validación son ficticios o públicos; los mensajes fueron redactados por "
  "los autores con fines de prueba y no provienen de conversaciones reales. Los datos de usuarios "
  "registrados se tratan con consentimiento, se minimizan y se enmascaran en las vistas públicas. "
  "Las credenciales de administración no se incluyen en este documento ni en el repositorio, y se "
  "gestionan mediante variables de entorno, como se detalla en el Anexo F.")
P("El sistema no emite acusaciones definitivas: presenta un nivel de riesgo y una recomendación de "
  "verificación. Esa decisión es ética y técnica a la vez, porque un falso positivo puede dañar la "
  "reputación de un comercio legítimo. El usuario conserva la decisión final y dispone de un canal "
  "para reportar un error de clasificación.")

# ═══════════════════════════════════════════════════════════════════════════
# 8. RESULTADOS
# ═══════════════════════════════════════════════════════════════════════════
H1("8. RESULTADOS ESPERADOS")

P("Este capítulo separa tres tipos de evidencia que con frecuencia se mezclan: los resultados "
  "alcanzados y verificables, los resultados pendientes, y las limitaciones que afectan su "
  "interpretación. Se usa el pretérito para lo ejecutado y el presente o el futuro para lo que "
  "permanece abierto; de ese modo el lector puede distinguir un hecho comprobado de una proyección.")

H2("8.1 Resultados alcanzados")
P("A la fecha de corte del 5 de noviembre de 2026 se completaron los ocho sprints, se desplegó la "
  "aplicación y se ejecutó la validación del verificador de dominios y de la capa heurística. La "
  "Tabla 15 resume los resultados con su evidencia y su estado. Los datos de la instancia de "
  "demostración —usuarios y reportes sembrados para probar la visualización— se identifican como "
  "datos sembrados y se excluyen de las métricas. El cierre de cada sprint se verificó con la "
  "definición de terminado descrita en el capítulo 7, conforme al marco de Scrum "
  + cite("scrum2020") + ".")

T("Resultados alcanzados a la fecha de corte",
  ["Resultado", "Evidencia verificable", "Estado"],
  [
      ["Plataforma web desplegada con frontend, API y base de datos", "URL de producción, pipeline de CI/CD y respaldo", "Alcanzado"],
      ["Seis canales de análisis: URL, mensaje, WhatsApp, correo, QR y teléfono", "Endpoints del Anexo A y pruebas de contrato", "Alcanzado"],
      ["Verificador de dominios con catálogo regional de marcas", "Módulo domain_verification y Tabla 16", "Alcanzado"],
      ["Motor heurístico con umbrales documentados", "Módulo risk_engine y Anexo B", "Alcanzado"],
      ["Integración con modelo de lenguaje y respaldo local", "Módulo gemini_service y pruebas de contingencia", "Alcanzado"],
      ["Reporte comunitario, panel de amenazas, historial y gamificación", "Endpoints y pruebas de API", "Alcanzado"],
      ["Consola de administración con roles y auditoría", "Endpoints administrativos y audit_logs", "Alcanzado"],
      ["58 casos automatizados de backend y frontend", "Tabla 19", "Alcanzado con una falla transitoria"],
      ["Validación del verificador de dominios sobre 30 casos", "Tabla 16 y validacion_111.json", "Alcanzado"],
      ["Validación de la capa heurística sobre 20 mensajes", "Tabla 17 y validacion_111.json", "Alcanzado con brecha en exhaustividad"],
      ["Rotación de credenciales y eliminación de secretos del repositorio", "Anexo F", "Cumplido"],
  ],
  widths=[7.2, 6.2, 3.8], font=8.2, align=["j", "j", "c"],
  note="Fuente: elaboración propia. La fecha de corte es el 5 de noviembre de 2026. Los datos sembrados "
       "para la demostración se excluyen de las métricas de validación.")

H2("8.2 Validación del verificador de dominios")
P("El verificador se evaluó sobre 30 dominios: 15 imitaciones y 15 oficiales. En la primera "
  "ejecución se obtuvieron 29 aciertos y un falso positivo: el dominio oficial itau.com.br fue "
  "clasificado como imitación de “Banco Itaú Paraguay”, porque el catálogo solo contenía la marca "
  "paraguaya. El hallazgo se analizó, se corrigió el catálogo agregando la marca brasileña y se "
  "repitió la evaluación. La Tabla 16 presenta la matriz de confusión de la corrida final.")
P("El incidente es relevante más allá del resultado: muestra que el desempeño del verificador "
  "depende de la cobertura del catálogo y que un catálogo incompleto produce falsos positivos "
  "sistemáticos sobre marcas legítimas. Esa dependencia es consistente con la literatura sobre "
  "typosquatting, que documenta una cola larga de dominios imitadores y la necesidad de mantener "
  "catálogos actualizados " + cite("szurdi2014") + ". También advierte sobre el riesgo de sobreajuste: "
  "corregir el catálogo con el mismo caso que falló mejora la métrica sin demostrar capacidad de "
  "generalización. Por eso el resultado se reporta como evidencia de funcionamiento, no como "
  "estimación de desempeño futuro.")

T("Matriz de confusión del verificador de dominios",
  ["", "Predicción: fraudulento", "Predicción: legítimo", "Total"],
  [
      ["Real: fraudulento", "VP = 15", "FN = 0", "15"],
      ["Real: legítimo", "FP = 0", "VN = 15", "15"],
      ["Total", "15", "15", "30"],
  ],
  widths=[4.6, 4.4, 4.2, 3.0], font=9.0, align=["l", "c", "c", "c"],
  note="Fuente: validacion_111.py, corrida del 5 de noviembre de 2026. VP: verdadero positivo; VN: "
       "verdadero negativo; FP: falso positivo; FN: falso negativo.")

P("Las métricas derivadas son: precisión 1,00; exhaustividad 1,00; tasa de falsos positivos 0,00; "
  "exactitud 0,9667 en la primera corrida y 1,00 en la corrida final; F1 de 1,00. La diferencia "
  "entre ambas corridas se explica por el único falso positivo corregido. El reporte conserva las "
  "dos cifras para no ocultar el proceso de ajuste.")

H2("8.3 Validación de la capa heurística de mensajes")
P("La capa heurística local se evaluó sobre 20 mensajes: 10 fraudulentos y 10 benignos. Se eligió "
  "esta capa, y no el modelo generativo, porque es la que opera cuando el proveedor externo no está "
  "disponible y porque su comportamiento es determinista y auditable. La Tabla 17 presenta la "
  "matriz de confusión.")

T("Matriz de confusión de la capa heurística de mensajes",
  ["", "Predicción: fraudulento", "Predicción: legítimo", "Total"],
  [
      ["Real: fraudulento", "VP = 8", "FN = 2", "10"],
      ["Real: legítimo", "FP = 0", "VN = 10", "10"],
      ["Total", "8", "10", "20"],
  ],
  widths=[4.6, 4.4, 4.2, 3.0], font=9.0, align=["l", "c", "c", "c"],
  note="Fuente: validacion_111.py, corrida del 5 de noviembre de 2026. La predicción positiva corresponde "
       "a posible_fraude = verdadero, que en la heurística equivale a score ≥ 30.")

P("Las métricas son: precisión 1,00; exhaustividad 0,80; tasa de falsos positivos 0,00; exactitud "
  "0,90; F1 de 0,8889. No hubo falsos positivos, lo que es deseable en una herramienta que no debe "
  "señalar contenido legítimo. Los dos falsos negativos corresponden a un mensaje que suplanta al "
  "soporte técnico del banco y ordena instalar una APK, y a un mensaje de extorsión con amenaza a la "
  "familia. Ambos obtuvieron una puntuación de 15 (riesgo bajo), porque su léxico no activó las "
  "reglas configuradas para la modalidad “mensaje”.")
P("El resultado confirma la hipótesis de diseño: la heurística es conservadora y depende de "
  "palabras clave, de modo que los casos redactados con sinónimos o sin términos explícitos "
  "requieren la capa generativa. También muestra que la exhaustividad de 0,80 no alcanza el umbral "
  "de 0,85 definido en la metodología. Esa brecha se reporta como resultado parcial y no se oculta.")

H2("8.4 Métricas de desempeño y umbrales")
P("La Tabla 18 contrasta cada métrica con el umbral definido antes de la ejecución. El verificador "
  "de dominios cumple todas las metas; la capa heurística cumple tres de cuatro y no alcanza la "
  "exhaustividad exigida. La lectura conjunta de precisión y exhaustividad es necesaria porque una "
  "sola métrica puede ocultar un comportamiento indeseable: un clasificador que marca todo como "
  "fraudulento maximiza la exhaustividad y destruye la precisión " + cite("sokolova2009") + ".")

T("Métricas de desempeño y umbrales de aceptación",
  ["Componente", "Métrica", "Valor", "Umbral", "Cumple"],
  [
      ["Verificador de dominios", "Exactitud", "1,00", "≥ 0,90", "Sí"],
      ["Verificador de dominios", "Precisión", "1,00", "≥ 0,90", "Sí"],
      ["Verificador de dominios", "Exhaustividad", "1,00", "≥ 0,85", "Sí"],
      ["Verificador de dominios", "Tasa de falsos positivos", "0,00", "≤ 0,10", "Sí"],
      ["Capa heurística de mensajes", "Exactitud", "0,90", "≥ 0,90", "Sí (en el límite)"],
      ["Capa heurística de mensajes", "Precisión", "1,00", "≥ 0,90", "Sí"],
      ["Capa heurística de mensajes", "Exhaustividad", "0,80", "≥ 0,85", "No"],
      ["Capa heurística de mensajes", "Tasa de falsos positivos", "0,00", "≤ 0,10", "Sí"],
  ],
  widths=[4.6, 5.2, 2.0, 2.4, 3.0], font=8.6, align=["l", "l", "c", "c", "c"],
  note="Fuente: elaboración propia a partir de validacion_111.json. Los umbrales se fijaron antes de la "
       "ejecución y no se modificaron después.")

H2("8.5 Conciliación de la ejecución de pruebas")
P("La Tabla 19 consolida la ejecución de pruebas, distingue los casos ejecutados de los que "
  "quedaron pendientes y explica la única falla observada.")

T("Conciliación de la ejecución de pruebas",
  ["Conjunto", "Casos", "Aprobados", "No aprobados", "Observación"],
  [
      ["Backend, pytest", "50", "49 en corrida agregada", "1", "Falla por dependencia de orden; pasa al ejecutarse aislada"],
      ["Contrato funcional, test_api.py", "14 pasos", "14", "0", "Incluye autenticación, reportes, API Key y cabeceras de seguridad"],
      ["Frontend, Vitest", "8", "8", "0", "Cinco archivos de componentes"],
      ["Extremo a extremo, Playwright", "6", "0", "0", "No ejecutadas: requieren la pila activa y navegador"],
      ["Integración en vivo", "9", "0", "0", "No ejecutadas: requieren API desplegada y credenciales de prueba"],
      ["Total automatizado ejecutable", "58", "57", "1 transitoria", "Sin fallas funcionales confirmadas"],
  ],
  widths=[4.4, 2.2, 4.0, 2.6, 4.8], font=8.2, align=["l", "c", "c", "c", "j"],
  note="Fuente: elaboración propia. Ejecución del 5 de noviembre de 2026 en entorno local con base de datos "
       "SQLite temporal. La suite se ejecutó sin las pruebas en vivo para evitar dependencias de red.")

P("La falla transitoria corresponde a una prueba de API Key que depende del estado dejado por otra "
  "prueba y no a un defecto del producto: al ejecutarla de forma aislada, aprueba. Se documenta como "
  "deuda técnica de la suite —las pruebas no son independientes— y no como falla funcional. La "
  "corrección consiste en aislar el estado con una fixture, tarea incluida en el plan de trabajo "
  "futuro.")

H2("8.6 Actividades de cierre y resultados pendientes")
P("La Tabla 20 distingue las actividades de cierre ya ejecutadas de las que permanecen dentro del "
  "plan de trabajo. Cada fila asocia la actividad con su objetivo y con el criterio de cierre.")

T("Actividades de cierre y resultados pendientes",
  ["Actividad", "Objetivo", "Criterio de cierre"],
  [
      ["Rotación de la credencial administrativa y limpieza de secretos históricos", "OE7", "Cumplido: credencial rotada, secretos fuera del historial y verificación en el repositorio"],
      ["Ejecutar las pruebas de extremo a extremo con la pila activa", "OE7", "6/6 pruebas aprobadas en un entorno limpio"],
      ["Ejecutar la integración en vivo contra la API desplegada", "OE8", "9/9 escenarios aprobados"],
      ["Ampliar el conjunto etiquetado a ≥ 300 casos y validación cruzada", "OE8", "Métricas con intervalo de confianza"],
      ["Calibrar el umbral de posible fraude con datos de producción", "OE8", "Curva precisión-exhaustividad documentada"],
      ["Evaluar la usabilidad con al menos 20 usuarios mediante SUS", "OE6", "Puntaje SUS ≥ 70"],
      ["Medir la disponibilidad durante 30 días continuos", "OE7", "Registro de disponibilidad ≥ 99 %"],
      ["Ejecutar la prueba de carga de 100 solicitudes concurrentes", "OE2", "0 errores 5xx y p95 ≤ 3 s"],
  ],
  widths=[7.6, 1.6, 7.0], font=8.2, align=["j", "c", "j"],
  note="Fuente: elaboración propia. La actividad de seguridad quedó cerrada; las restantes se reportan como trabajo pendiente.")

H2("8.7 Limitaciones del estudio")
P("Las limitaciones se clasifican según su efecto sobre las conclusiones. No se presentan como "
  "disculpas, sino como condiciones de validez que el lector debe considerar al interpretar los "
  "resultados.")

T("Limitaciones del estudio y su efecto sobre los resultados",
  ["Limitación", "Tipo", "Efecto sobre los resultados", "Mitigación aplicada"],
  [
      ["Conjunto de validación pequeño (30 dominios y 20 mensajes)", "Externa", "Impide generalizar a producción", "Se reporta como evidencia de funcionamiento, no como estimación"],
      ["Etiquetado realizado por los autores", "Interna", "Posible sesgo de confirmación", "Criterios explícitos y reproducibles"],
      ["Corrección del catálogo sobre el mismo caso que falló", "Interna", "Riesgo de sobreajuste", "Se reportan ambas corridas"],
      ["Sin pruebas de significancia ni intervalos de confianza", "Conclusión", "No se puede afirmar superioridad estadística", "Se describe el resultado, no se infiere"],
      ["Sin evaluación con usuarios reales", "Externa", "No se mide usabilidad ni adopción", "Se incluye en el plan futuro con SUS"],
      ["Dependencia de servicios externos", "Constructo", "El desempeño puede variar con la latencia o la cuota", "Degradación controlada y respaldo local"],
      ["Datos de demostración sembrados", "Interna", "No representan usuarios reales", "Se excluyen de las métricas y se declaran"],
  ],
  widths=[5.4, 2.2, 4.8, 5.2], font=8.0, align=["j", "c", "j", "j"],
  note="Fuente: elaboración propia. La clasificación de las limitaciones por tipo de validez sigue el "
       "esquema de Wohlin et al. " + cite("wohlin2012") + ".")

P("La ausencia de evaluación con usuarios reales se cubre parcialmente con el plan futuro de aplicar "
  "la escala de usabilidad del sistema (SUS), un instrumento validado y ampliamente utilizado "
  + cite("brooke1996") + ". La ausencia de una evaluación completa de calidad del producto se "
  "reconoce frente al modelo de ISO/IEC 25010 " + cite("iso25010") + ", que distingue entre calidad "
  "del producto y calidad en uso.")

H2("8.8 Indicadores de éxito")
T("Indicadores de éxito y estado",
  ["Indicador", "Meta", "Valor observado", "Estado"],
  [
      ["Exactitud del verificador de dominios", "≥ 0,90", "1,00", "Cumplido"],
      ["Tasa de falsos positivos del verificador", "≤ 0,10", "0,00", "Cumplido"],
      ["Exhaustividad de la capa heurística", "≥ 0,85", "0,80", "Parcial"],
      ["Pruebas automatizadas aprobadas", "≥ 95 %", "98,3 % (57/58)", "Cumplido"],
      ["Cobertura de canales de análisis", "6 canales", "6 canales", "Cumplido"],
      ["Documentación de la API", "100 % de endpoints", "100 %", "Cumplido"],
      ["Credenciales sensibles fuera del repositorio", "0", "0", "Cumplido"],
  ],
  widths=[7.0, 3.2, 4.2, 3.0], font=8.6, align=["l", "c", "c", "c"],
  note="Fuente: elaboración propia. El porcentaje de pruebas se calcula sobre los 58 casos ejecutables.")

# ═══════════════════════════════════════════════════════════════════════════
# 8.9 CONCLUSIONES
# ═══════════════════════════════════════════════════════════════════════════
H2("8.9 Conclusiones")

P("La primera conclusión es de naturaleza metodológica. El proyecto demuestra que es posible "
  "separar la metodología de desarrollo de la metodología de evaluación sin perder cohesión: Scrum "
  "organizó la construcción en ocho sprints verificables, mientras que el diseño de evaluación fijó "
  "los umbrales antes de ejecutar las pruebas. Esa separación evitó dos errores frecuentes: confundir "
  "la entrega de funcionalidades con la demostración de desempeño, y ajustar los criterios después de "
  "conocer los resultados. El marco de trabajo aplicado y los criterios de validez se documentaron "
  "con antelación " + cite("scrum2020", "wohlin2012") + ".")
P("La segunda conclusión se refiere al verificador de dominios. Sobre el conjunto de 30 casos "
  "obtuvo precisión, exhaustividad y exactitud de 1,00, con tasa de falsos positivos de 0,00 en la "
  "corrida final. El resultado es alentador, pero debe interpretarse con cautela: el conjunto es "
  "pequeño, fue etiquetado por los autores y el único falso positivo se corrigió sobre el mismo "
  "conjunto. La evidencia sostiene que el mecanismo funciona en los casos probados, no que su "
  "desempeño se mantenga en producción. La dependencia de la cobertura del catálogo es coherente con "
  "la naturaleza de cola larga del typosquatting documentada en la literatura "
  + cite("szurdi2014") + ".")
P("La tercera conclusión se refiere a la capa heurística de mensajes. Obtuvo precisión de 1,00 y "
  "tasa de falsos positivos de 0,00, pero exhaustividad de 0,80, por debajo del umbral de 0,85. Los "
  "dos falsos negativos corresponden a mensajes que no activaron las palabras clave configuradas. El "
  "hallazgo confirma que la heurística es útil como respaldo conservador y que el modelo generativo "
  "es necesario para los casos redactados con sinónimos o sin términos explícitos, lo que coincide "
  "con la conclusión de que la combinación de señales supera a cualquier familia aislada "
  + cite("basit2021") + ".")
P("La cuarta conclusión es de ingeniería. La arquitectura de tres capas con degradación controlada "
  "permitió que el sistema respondiera incluso sin el proveedor del modelo de lenguaje. Esa "
  "propiedad no es un adorno: en un servicio de seguridad, la indisponibilidad de un componente "
  "externo no debe dejar al usuario sin respuesta. La decisión de calcular siempre la capa "
  "determinista y usar el modelo solo como enriquecimiento resultó adecuada para el contexto "
  "latinoamericano, donde la latencia y la cuota de los servicios gratuitos son variables. La "
  "propiedad de mantener el servicio disponible ante la falla de un componente externo se alinea con "
  "el atributo de fiabilidad de ISO/IEC 25010 " + cite("iso25010") + ".")
P("La quinta conclusión es de alcance. El proyecto no demuestra una reducción del fraude en la "
  "población ni una mejora medible en la adopción del servicio. Para afirmarlo se requeriría un "
  "estudio con usuarios, un periodo de observación y un grupo de comparación. Lo que se demuestra es "
  "que la plataforma funciona, que clasifica correctamente un conjunto controlado de casos y que su "
  "diseño es reproducible. Esa es una condición necesaria, no suficiente, para el impacto social que "
  "motiva el proyecto. La distinción entre evidencia de funcionamiento e inferencia de impacto "
  "corresponde al diseño descriptivo adoptado " + cite("wohlin2012") + ".")
P("Finalmente, la conclusión sobre el proceso: la documentación de las limitaciones y de los "
  "resultados pendientes fortalece el trabajo. Un evaluador puede verificar qué se hizo, con qué "
  "evidencia y qué falta. Esa transparencia forma parte del aporte académico del proyecto.")

# ═══════════════════════════════════════════════════════════════════════════
# 8.10 RECOMENDACIONES Y TRABAJO FUTURO
# ═══════════════════════════════════════════════════════════════════════════
H2("8.10 Recomendaciones y trabajo futuro")

H3("8.10.1 Recomendaciones técnicas")
bullets([
    "Ampliar el conjunto etiquetado a 300 o más casos, con participación de un tercero en el "
    "etiquetado para reducir el sesgo de confirmación.",
    "Calibrar el umbral de posible fraude con una curva precisión-exhaustividad sobre datos reales "
    "anonimizados, en lugar de mantener el valor fijo de 30.",
    "Incorporar pruebas de significancia e intervalos de confianza para las métricas de "
    "clasificación.",
    "Aislar el estado de las pruebas de API Key con fixtures, para eliminar la dependencia de orden.",
    "Agregar monitoreo de latencia y de disponibilidad con alertas, y registrar la causa de cada "
    "degradación del modelo generativo.",
    "Evaluar la incorporación de un segundo proveedor de modelos de lenguaje para reducir la "
    "dependencia de un solo servicio.",
])
P("La priorización de estas recomendaciones combina el método MoSCoW con el criterio de riesgo "
  "técnico descrito en el capítulo 7 " + cite("moscow1994") + ". Las acciones sobre métricas y "
  "validez siguen las recomendaciones de reporte de resultados de clasificación "
  + cite("sokolova2009", "wohlin2012") + ".")

H3("8.10.2 Recomendaciones de seguridad")
bullets([
    "Rotar la contraseña de la cuenta administradora y almacenar únicamente su hash en la variable "
    "de entorno correspondiente.",
    "Eliminar cualquier valor por defecto de credenciales en el código y en la documentación, y "
    "fallar de forma segura si la variable no está definida.",
    "Verificar el historial de Git con una búsqueda de secretos antes de publicar el repositorio.",
    "Revisar trimestralmente los permisos de los roles y las claves de API.",
    "Mantener actualizadas las dependencias y ejecutar el análisis de vulnerabilidades en el pipeline.",
])
P("Las recomendaciones de seguridad se ordenan según los riesgos de aplicación web del OWASP Top 10 "
  + cite("owasp2021") + ", las directrices de autenticación del NIST " + cite("nist80063b")
  + " y los controles de un sistema de gestión de seguridad de la información conforme a ISO/IEC "
  "27001 " + cite("iso27001") + ". La gestión del riesgo residual se alinea con las funciones del "
  "marco NIST CSF 2.0 " + cite("nistcsf2024") + ".")

H3("8.10.3 Recomendaciones de evaluación y divulgación")
bullets([
    "Ejecutar un estudio de usabilidad con al menos 20 participantes y reportar el puntaje SUS.",
    "Medir la disponibilidad durante 30 días continuos y publicar el resultado.",
    "Validar el servicio con una muestra de usuarios de distintos niveles de alfabetización digital.",
    "Publicar el conjunto de validación anonimizado y el script de reproducción para permitir la "
    "verificación independiente.",
])
P("El estudio de usabilidad propuesto utiliza la escala SUS, un instrumento validado y de bajo costo "
  "de aplicación " + cite("brooke1996") + ", y los productos de divulgación se ajustan a las pautas "
  "de accesibilidad WCAG 2.2 " + cite("wcag2023") + ".")

H3("8.10.4 Trabajo futuro")
P("Se identifican cuatro líneas de trabajo. La primera es la ampliación del catálogo de marcas y de "
  "la base de indicadores a más países de la región. La segunda es la incorporación de análisis de "
  "imágenes y de códigos QR con contenido renderizado, que hoy se limita a la decodificación. La "
  "tercera es la integración con autoridades y gremios para compartir indicadores con controles de "
  "calidad. La cuarta es el desarrollo de una extensión de navegador que reutilice la API y ofrezca "
  "protección en el momento de la navegación.")
P("Ninguna de estas líneas forma parte del alcance entregado. Se enuncian para situar el proyecto "
  "en una trayectoria y para que un trabajo posterior pueda continuarlo sin reconstruir la base.")

# ═══════════════════════════════════════════════════════════════════════════
# 9. ESTRATEGIA DE DIVULGACIÓN
# ═══════════════════════════════════════════════════════════════════════════
H1("9. ESTRATEGIA DE DIVULGACIÓN INSTITUCIONAL")

P("La divulgación tiene tres propósitos: dar a conocer el servicio a la comunidad, transferir el "
  "conocimiento técnico a la institución y someter los resultados a revisión externa. La estrategia "
  "se organiza por audiencia, canal y producto, con indicadores de alcance.")

H2("9.1 Audiencias")
bullets([
    "Comunidad universitaria: estudiantes y docentes del programa, interesados en el uso del "
    "servicio y en la metodología.",
    "Ciudadanía: usuarios potenciales, con énfasis en personas de baja alfabetización digital.",
    "Sector financiero y autoridades: bancos, gremios y organismos de respuesta que pueden "
    "integrar los indicadores.",
    "Comunidad técnica: desarrolladores e investigadores que pueden reutilizar la arquitectura.",
])
P("El énfasis en personas de baja alfabetización digital se sustenta en los hallazgos del estudio "
  "regional de Kaspersky, que documenta una proporción relevante de usuarios que no logra "
  "identificar un sitio falso " + cite("kaspersky2024") + ". Los productos de divulgación se "
  "diseñarán conforme a las pautas de accesibilidad WCAG 2.2 " + cite("wcag2023") + ".")

H2("9.2 Canales y productos")
P("Se prevén cuatro productos. Primero, una guía de uso en formato PDF, con lenguaje claro, "
  "ejemplos y recomendaciones. Segundo, una presentación académica para la sustentación del "
  "proyecto. Tercero, un artículo corto con la metodología de evaluación y los resultados. Cuarto, "
  "el repositorio público con la documentación de la API y el script de validación, para que un "
  "tercero pueda reproducir las métricas.")
P("Los canales son la página institucional, las redes académicas del programa, una jornada de "
  "divulgación y el repositorio. No se plantea una campaña masiva de medios, porque el alcance del "
  "proyecto es académico y el presupuesto no lo contempla. La guía de uso se redactará con criterios "
  "de lenguaje claro y accesibilidad " + cite("wcag2023") + ".")

H2("9.3 Indicadores de divulgación")
bullets([
    "Al menos 30 asistentes a la jornada de divulgación.",
    "Al menos 10 descargas de la guía de uso en el primer mes.",
    "Al menos 5 retroalimentaciones documentadas de docentes o pares.",
    "Publicación del repositorio con licencia y documentación completa.",
])

# ═══════════════════════════════════════════════════════════════════════════
# 10. CRONOGRAMA DE ACTIVIDADES
# ═══════════════════════════════════════════════════════════════════════════
H1("10. CRONOGRAMA DE ACTIVIDADES")

P("El cronograma se expresa en semanas y se vincula con los objetivos, los entregables y los hitos "
  "de revisión. La Figura 5 y la Tabla 23 presentan la misma información en formatos complementarios: "
  "la figura permite ver la superposición de tareas y la tabla precisa la responsabilidad y el "
  "entregable. La organización en sprints y la superposición deliberada de actividades siguen el "
  "marco de Scrum " + cite("scrum2020") + " y el principio de planificación incremental de la "
  "ingeniería de software " + cite("sommerville2016") + ".")

F("fig111_cronograma.png", "Cronograma de fases y sprints a lo largo de 16 semanas, con superposición de pruebas, despliegue y documentación.")

T("Cronograma por fases, objetivos y entregables",
  ["Fase", "Semanas", "Objetivos", "Entregable", "Hito"],
  [
      ["1. Análisis y backlog", "1–3", "OE1", "Problema, estado del arte y backlog priorizado", "Aprobación del anteproyecto"],
      ["2. Diseño y arquitectura", "3–5", "OE2", "Arquitectura, modelo de datos y requerimientos", "Revisión de diseño"],
      ["3. Sprints 1 a 3", "4–8", "OE3, OE4", "Autenticación, motor heurístico y verificador de dominios", "Demostración funcional 1"],
      ["4. Sprints 4 a 6", "7–12", "OE5, OE6", "Modelo de lenguaje, reportes, panel e historial", "Demostración funcional 2"],
      ["5. Sprints 7 y 8", "13–16", "OE6, OE7", "Administración, auditoría, despliegue y CI/CD", "Entrega del producto"],
      ["6. Evaluación y divulgación", "11–18", "OE8", "Validación, documento final, guía y presentación", "Sustentación"],
  ],
  widths=[4.0, 2.0, 2.2, 5.6, 3.4], font=8.2, align=["l", "c", "c", "j", "j"],
  note="Fuente: elaboración propia. Las semanas 11 a 18 se superponen con las fases de desarrollo porque la "
       "evaluación se ejecutó en paralelo a los últimos sprints.")

P("La superposición es deliberada: la evaluación no se dejó para el final, sino que se ejecutó "
  "mientras el producto aún podía corregirse. Esa decisión permitió detectar el falso positivo del "
  "catálogo de marcas y corregirlo antes del cierre. El costo de la superposición fue una mayor "
  "carga de trabajo en las semanas 11 a 16, que se asumió con reuniones adicionales de revisión.")

# ═══════════════════════════════════════════════════════════════════════════
# 11. PRESUPUESTO
# ═══════════════════════════════════════════════════════════════════════════
H1("11. PRESUPUESTO")

P("El presupuesto incluye costos directos e indirectos. Los primeros son desembolsos verificables; "
  "los segundos valorizan recursos que el equipo aportó sin facturar, principalmente tiempo de "
  "trabajo, conectividad, energía y mantenimiento. Se incluyen para representar el costo real del "
  "proyecto.")

H2("11.1 Supuestos de cálculo")
bullets([
    "Periodo de desarrollo: 16 semanas, de agosto de 2025 a noviembre de 2026, con dedicación "
    "promedio de 20 horas semanales por integrante.",
    "Tres integrantes y una asesora con 4 horas semanales de acompañamiento.",
    "Tarifa de referencia del estudiante: COP 25.000 por hora; de la asesora: COP 60.000 por hora.",
    "Tasa de cambio de referencia: COP 4.000 por dólar estadounidense.",
    "Depreciación de equipos a tres años, con uso del 11 % del periodo.",
    "Imprevistos del 5 % sobre el subtotal.",
])
P("Los costos de infraestructura se estiman con las tarifas públicas de los proveedores utilizados "
  "para el despliegue y la base de datos " + cite("supabase2025", "render2025", "vercel2025") + ".")

H2("11.2 Costos directos e indirectos")
T("Presupuesto: costos directos e indirectos",
  ["Rubro", "Tipo", "Cantidad", "Valor unitario (COP)", "Valor total (COP)"],
  [
      ["Depreciación de equipos de cómputo", "Directo", "3 equipos × 11 % de 3.500.000", "388.889", "1.166.667"],
      ["Servicios en la nube y dominio", "Directo", "4 meses", "60.000", "240.000"],
      ["Materiales y divulgación", "Directo", "1", "300.000", "300.000"],
      ["Talento humano de estudiantes", "Indirecto", "960 horas", "25.000", "24.000.000"],
      ["Talento humano de la asesora", "Indirecto", "64 horas", "60.000", "3.840.000"],
      ["Conectividad a internet", "Indirecto", "12 meses-equipo", "90.000", "1.080.000"],
      ["Energía eléctrica", "Indirecto", "12 meses-equipo", "25.000", "300.000"],
      ["Mantenimiento y soporte", "Indirecto", "40 horas", "25.000", "1.000.000"],
  ],
  widths=[6.0, 2.0, 4.2, 3.2, 3.2], font=8.2, align=["j", "c", "j", "r", "r"],
  note="Fuente: elaboración propia. Los valores corresponden a precios de referencia del mercado "
       "colombiano en 2026 y a la dedicación declarada por el equipo.")

P("La depreciación se calculó con la fórmula (valor del equipo × porcentaje de uso del periodo) / "
  "vida útil. Para tres equipos de COP 3.500.000, con una vida útil de 36 meses y un uso de 4 meses, "
  "el resultado es COP 1.166.667. No se incluyen licencias de software porque la totalidad de las "
  "herramientas utilizadas es de código abierto o dispone de plan gratuito.")

H2("11.3 Resumen presupuestal y sostenibilidad")
T("Resumen presupuestal y sostenibilidad",
  ["Categoría", "Valor (COP)", "Participación", "Observación"],
  [
      ["Costos directos", "1.706.667", "5,1 %", "Equipos, nube y divulgación"],
      ["Costos indirectos", "30.220.000", "90,2 %", "Tiempo de trabajo, conectividad, energía y soporte"],
      ["Subtotal", "31.926.667", "100,0 %", "Suma de directos e indirectos"],
      ["Imprevistos (5 %)", "1.596.333", "—", "Reserva para variaciones de precios o alcance"],
      ["Total", "33.523.000", "—", "Costo total estimado del proyecto"],
  ],
  widths=[4.4, 3.2, 2.8, 6.2], font=8.6, align=["l", "r", "c", "j"],
  note="Fuente: elaboración propia.")

P("La sostenibilidad del servicio después del proyecto depende de tres factores. Primero, el costo "
  "marginal mensual es bajo: con los planes gratuitos actuales, el gasto se reduce al dominio y a un "
  "plan básico de cómputo, del orden de COP 32.000 a 60.000 mensuales. Segundo, la arquitectura "
  "permite migrar de proveedor sin reescribir el núcleo, porque la API es independiente del hosting. "
  "Tercero, el modelo de datos es portable a cualquier PostgreSQL administrado "
  + cite("postgres2025", "supabase2025") + ".")
P("Un escenario de crecimiento a 10.000 usuarios activos requeriría un plan de cómputo y base de "
  "datos de aproximadamente USD 45 mensuales, equivalentes a COP 180.000. Ese valor sigue siendo "
  "sostenible para una institución educativa o para un modelo de financiación mixta. El documento no "
  "presenta un modelo de negocio porque el proyecto es académico y gratuito por diseño.")

# ═══════════════════════════════════════════════════════════════════════════
# REFERENCIAS
# ═══════════════════════════════════════════════════════════════════════════
H1("12. REFERENCIAS")
P("Las referencias se numeran en orden de aparición en el texto, conforme al estilo IEEE: cada "
  "afirmación tomada de una fuente se acompaña de su número entre corchetes y la lista final se "
  "ordena por ese mismo criterio. Todas las fuentes citadas fueron consultadas durante la "
  "elaboración del documento y corresponden a informes institucionales, artículos revisados por "
  "pares, normas técnicas y documentación oficial de las tecnologías utilizadas.",
  size=9.5, italic=True)
for i, key in enumerate(CITED, 1):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(1.0)
    p.paragraph_format.first_line_indent = Cm(-1.0)
    p.paragraph_format.space_after = Pt(4)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(f"[{i}]  ")
    r.bold = True
    r.font.size = Pt(9.2)
    r2 = p.add_run(REFS[key])
    r2.font.size = Pt(9.2)

# ═══════════════════════════════════════════════════════════════════════════
# ANEXOS
# ═══════════════════════════════════════════════════════════════════════════
H1("ANEXO A. CATÁLOGO DE ENDPOINTS PRINCIPALES")
P("La Tabla 26 resume los endpoints expuestos por la API. La documentación interactiva se genera "
  "automáticamente a partir de los esquemas de FastAPI y está disponible en la ruta /docs.")

T("Catálogo de endpoints principales",
  ["Método", "Ruta", "Propósito", "Autenticación"],
  [
      ["POST", "/api/v1/auth/registro", "Registro de usuario", "Pública"],
      ["POST", "/api/v1/auth/login", "Inicio de sesión y emisión de JWT", "Pública"],
      ["GET", "/api/v1/auth/me", "Perfil del usuario autenticado", "JWT"],
      ["POST", "/api/v1/auth/mfa/setup", "Generación del secreto TOTP", "JWT"],
      ["POST", "/api/v1/auth/mfa/enable", "Activación de 2FA", "JWT"],
      ["POST", "/api/v1/reportes/analizar", "Análisis de contenido sospechoso", "JWT o API Key"],
      ["GET", "/api/v1/reportes", "Listado paginado de reportes", "JWT o API Key"],
      ["POST", "/api/v1/reportes", "Creación de un reporte comunitario", "JWT o API Key"],
      ["POST", "/api/v1/reportes/publico", "Reporte anónimo", "Pública con límite de tasa"],
      ["GET", "/api/v1/reportes/publico/listar", "Listado público anonimizado", "Pública"],
      ["GET", "/api/v1/threat-intel", "Indicadores y agregados de amenazas", "Pública"],
      ["GET", "/api/v1/scan-history", "Historial de escaneos del usuario", "JWT"],
      ["POST", "/api/v1/scan-history", "Persistencia de un escaneo", "JWT"],
      ["GET", "/api/v1/gamification", "Reputación, insignias y racha", "JWT"],
      ["PUT", "/api/v1/gamification", "Actualización de gamificación", "JWT"],
      ["GET", "/api/v1/admin/dashboard", "Indicadores de administración", "Rol admin"],
      ["GET", "/api/v1/admin/users", "Gestión de usuarios", "Rol admin"],
      ["GET", "/api/v1/admin/audit-logs", "Registro de auditoría", "Rol admin"],
      ["GET", "/api/v1/admin/system", "Estado del sistema", "Rol admin"],
      ["POST", "/api/v1/webhooks/whatsapp", "Integración con mensajería", "Firma o clave"],
  ],
  widths=[1.8, 6.4, 5.6, 3.4], font=7.8, align=["c", "l", "j", "c"],
  note="Fuente: elaboración propia a partir de los routers implementados. Las rutas se muestran con el "
       "prefijo /api/v1 definido en la configuración.")

H1("ANEXO B. ESCALA DE CLASIFICACIÓN DEL RIESGO")
P("La escala se deriva directamente de los umbrales implementados en el motor. El código clasifica "
  "como CRITICAL cualquier puntuación superior a 75; por tanto, un score de 80 corresponde a "
  "CRITICAL, como se observa en el ejemplo de verificación de dominio.")

T("Escala de clasificación del riesgo",
  ["Nivel", "Rango de score", "Interpretación", "Acción recomendada"],
  [
      ["LOW", "0–25", "Sin señales relevantes o señales débiles", "Continuar con precaución; verificar el canal oficial"],
      ["MEDIUM", "26–50", "Señales parciales que requieren verificación", "No compartir datos; confirmar por un canal oficial"],
      ["HIGH", "51–75", "Múltiples señales coherentes con fraude", "No interactuar; reportar el indicador"],
      ["CRITICAL", "76–100", "Imitación de marca o patrón de fraude evidente", "Bloquear, reportar y alertar a la entidad suplantada"],
  ],
  widths=[2.6, 3.0, 6.0, 5.8], font=8.4, align=["c", "c", "j", "j"],
  note="Fuente: elaboración propia a partir de los umbrales de risk_engine.py y gemini_service.py. "
       "El ejemplo verificado https://bancolombia.verificar-cuenta.today/login obtiene score 80 y, por "
       "tanto, nivel CRITICAL. La graduación por niveles y la comunicación del riesgo residual se "
       "alinean con las funciones del marco NIST CSF 2.0 " + cite("nistcsf2024") + ".")

H1("ANEXO C. VARIABLES DE ENTORNO")
P("La aplicación se configura mediante variables de entorno. La Tabla 28 enumera las variables "
  "requeridas y su propósito, sin incluir valores. Ningún valor sensible se documenta en este anexo, "
  "en el repositorio ni en los archivos de ejemplo. La separación entre configuración y código y el "
  "tratamiento de los secretos siguen las recomendaciones del NIST para la gestión de identidades y "
  "autenticación " + cite("nist80063b") + " y los controles del OWASP Top 10 para fallas "
  "criptográficas y de configuración " + cite("owasp2021") + ".")

T("Variables de entorno requeridas (sin valores sensibles)",
  ["Variable", "Propósito", "Obligatoria", "Sensible"],
  [
      ["JWT_SECRET_KEY", "Firma de los tokens de acceso", "Sí", "Sí"],
      ["DATABASE_URL", "Cadena de conexión a la base de datos", "Sí", "Sí"],
      ["DB_PROVIDER", "Proveedor activo: sqlite, supabase o neon", "Sí", "No"],
      ["SUPABASE_DATABASE_URL", "Cadena de conexión alternativa a Supabase", "No", "Sí"],
      ["NEON_DATABASE_URL", "Cadena de conexión alternativa a Neon", "No", "Sí"],
      ["ADMIN_USER", "Identificador de la cuenta administradora", "Sí", "No"],
      ["ADMIN_PASSWORD_HASH", "Hash de la contraseña administradora", "Sí", "Sí"],
      ["ALGORITHM", "Algoritmo de firma del token", "Sí", "No"],
      ["ACCESS_TOKEN_EXPIRE_MINUTES", "Vigencia del token en minutos", "Sí", "No"],
      ["ALLOWED_API_KEYS", "Claves autorizadas para integraciones B2B", "No", "Sí"],
      ["GEMINI_API_KEY", "Clave del proveedor del modelo de lenguaje", "No", "Sí"],
      ["WS_AUTH_REQUIRED", "Exigencia de autenticación en WebSocket", "No", "No"],
      ["ENVIRONMENT", "Entorno de ejecución: development, testing, production", "Sí", "No"],
  ],
  widths=[4.6, 7.4, 2.2, 2.2], font=8.2, align=["l", "j", "c", "c"],
  note="Fuente: elaboración propia a partir de app/core/config.py. Los valores se suministran por el "
       "entorno de despliegue y nunca se versionan.")

H1("ANEXO D. PROTOCOLO DE VALIDACIÓN")
P("El protocolo permite reproducir las métricas del capítulo 8. Requiere Python 3.13, las "
  "dependencias del backend y una base de datos SQLite temporal; no realiza llamadas de red.")
numbered([
    "Clonar el repositorio y ubicarse en el directorio backend.",
    "Crear un entorno virtual e instalar las dependencias de requirements.txt.",
    "Definir DB_PROVIDER=sqlite, DATABASE_URL=sqlite:///./validacion_111.db, ENVIRONMENT=testing y "
    "JWT_SECRET_KEY con un valor aleatorio de al menos 32 caracteres.",
    "Ejecutar el script scripts/validacion_111.py desde la raíz del repositorio.",
    "Verificar el archivo docs/validacion_111.json, que contiene las filas, las matrices y las "
    "métricas de ambos conjuntos.",
    "Contrastar los valores con las Tablas 16, 17 y 18 de este documento.",
])
P("El conjunto está compuesto por 30 dominios y 20 mensajes etiquetados. La etiqueta de dominio "
  "distingue entre oficial y fraudulento; la de mensaje, entre fraudulento y benigno. El script no "
  "consulta la API de Gemini ni la base de producción, de modo que el resultado es reproducible sin "
  "credenciales externas.")

H1("ANEXO E. EVIDENCIAS Y REPRODUCIBILIDAD")
P("Las evidencias del proyecto se organizan en cuatro artefactos verificables: el repositorio con "
  "el código y el historial de commits, el pipeline de integración continua, el archivo de validación "
  "y este documento. Los comandos de reproducción son los siguientes:")
bullets([
    "Pruebas de backend: pytest -q, desde el directorio backend, con las variables de entorno de "
    "prueba definidas.",
    "Pruebas de frontend: npx vitest run, desde el directorio frontend.",
    "Validación del motor: python scripts/validacion_111.py, desde la raíz del repositorio.",
])
P("El archivo docs/validacion_111.json conserva la fecha de corte, las filas por caso y las "
  "métricas calculadas. Cualquier modificación futura del catálogo o de las reglas debe acompañarse "
  "de una nueva ejecución y de la actualización de las tablas, para evitar que el documento y el "
  "código se separen.")

H1("ANEXO F. SEGURIDAD OPERATIVA Y GESTIÓN DE CREDENCIALES")
P("Este anexo documenta la política de seguridad aplicada al proyecto. Por política de seguridad, "
  "aquí no se incluye ninguna contraseña, clave de API ni cadena de conexión. Las credenciales se "
  "aprovisionan en el entorno y se rotan de forma periódica, conforme a los controles de gestión de "
  "secretos del OWASP Top 10 " + cite("owasp2021") + " y de ISO/IEC 27001 " + cite("iso27001") + ".")

H2("F.1 Hallazgo y medida adoptada")
P("La revisión de seguridad identificó credenciales de una cuenta administradora en documentos y "
  "archivos versionados del repositorio. Se retiraron los valores literales del código, la "
  "documentación y los archivos de ejemplo, y se sustituyeron por referencias a variables de entorno. "
  "La credencial expuesta se trató como comprometida y se rotó; su residuo en el historial de Git se "
  "eliminó mediante una reescritura controlada del repositorio.")
P("La rotación se ejecutó y verificó en el entorno de desarrollo con base de datos SQLite, "
  "configurado mediante DB_PROVIDER=sqlite. Se generó una contraseña aleatoria, se actualizó el hash "
  "de la cuenta administradora y se comprobó el ingreso con la credencial nueva y el rechazo de la "
  "anterior. Las credenciales de despliegue se gestionan exclusivamente en el proveedor de alojamiento "
  "y no se almacenan en el repositorio. La gestión del riesgo sigue las funciones del marco NIST CSF "
  "2.0 " + cite("nistcsf2024") + ".")

H2("F.2 Procedimiento de rotación ejecutado")
numbered([
    "Se generó una contraseña aleatoria de 24 caracteres con un gestor de secretos.",
    "Se calculó su hash bcrypt y se almacenó únicamente en ADMIN_PASSWORD_HASH del archivo .env, "
    "ignorado por Git.",
    "Se configuró DB_PROVIDER=sqlite y se aplicó el hash a la cuenta administradora de la base de "
    "datos de desarrollo mediante seed_admin.py.",
    "Se verificó el ingreso con la nueva credencial y se confirmó el rechazo de la credencial anterior.",
    "Se eliminaron los valores literales del código, la documentación y el historial de Git, y se "
    "ejecutó una búsqueda de secretos en el árbol de trabajo y en todos los commits.",
    "Se registró la fecha de la rotación y se guardó la credencial de entrega fuera del repositorio.",
])

H2("F.3 Lista de verificación de seguridad")
bullets([
    "Ningún secreto en el código, en la documentación ni en los archivos de ejemplo.",
    "JWT_SECRET_KEY aleatoria de al menos 32 caracteres y distinta por entorno.",
    "HTTPS obligatorio y cabeceras de seguridad activas.",
    "Autenticación de dos factores disponible para cuentas administrativas.",
    "Límite de tasa en los endpoints públicos y en el inicio de sesión.",
    "Control de acceso por roles verificado con pruebas.",
    "Registro de auditoría para todas las acciones administrativas.",
    "Respaldo cifrado de la base de datos y procedimiento de restauración probado.",
    "Búsqueda de secretos en el historial ejecutada y verificada antes de la publicación.",
])
P("La lista se complementa con los controles de autenticación del NIST " + cite("nist80063b")
  + " y con los requisitos de un sistema de gestión de seguridad de la información conforme a "
  "ISO/IEC 27001 " + cite("iso27001") + ".")

# ═══════════════════════════════════════════════════════════════════════════
# PROPIEDADES Y GUARDADO
# ═══════════════════════════════════════════════════════════════════════════
cp = doc.core_properties
cp.title = "AgielShield: plataforma web de inteligencia de amenazas y ciberseguridad colaborativa"
cp.subject = "Proyecto de grado — Desarrollo Tecnológico"
cp.author = "Neil David Maza Girado; Steven Ruiz Fontalvo; Keider Polo Arteaga"
cp.category = "Proyecto de grado"
cp.comments = "Proyecto de grado — Formato Código 111, Versión 5."
cp.language = "es-CO"

doc.save(OUT)

# La tabla de contenido es un campo de Word: se actualiza al terminar para que
# quede visible con paginación real y no dependa de que el lector pulse F9.
try:
    updater = os.path.join(os.path.dirname(__file__), "update_toc_word.ps1")
    subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                    "-File", updater, OUT], check=True, capture_output=True)
    print("Tabla de contenido actualizada.")
except Exception as exc:
    print("No se pudo actualizar la tabla de contenido:", type(exc).__name__)

print("Documento generado:", OUT)
print("Párrafos:", len(doc.paragraphs), "| Tablas:", len(doc.tables),
      "| Figuras:", FIGURES[0], "| Referencias:", len(CITED))
