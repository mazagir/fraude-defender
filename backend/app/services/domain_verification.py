"""
Servicio de verificación de dominios: determina si un enlace/dominio analizado
corresponde a una entidad real y legítima (banco, fintech, comercio de LATAM)
o si se trata de una imitación fraudulenta (typosquatting / dominio suplantado).

No realiza llamadas de red externas (WHOIS/DNS en vivo se dejan como mejora
futura para no depender de la disponibilidad del host). Se apoya en:
- Base de dominios oficiales de marcas conocidas (known_brands.py)
- Distancia de Levenshtein para detectar typosquatting
- TLDs de bajo costo frecuentemente usados en estafas
- Extracción robusta del registro raíz del dominio
"""
import re
from difflib import SequenceMatcher

from app.services.known_brands import KNOWN_BRANDS, SUSPICIOUS_TLDS

# Tokens genéricos que nunca deben disparar typosquat (muy comunes en URLs)
GENERIC_TOKENS = {
    "app", "apps", "com", "net", "org", "www", "web", "site", "online",
    "login", "log", "seguro", "security", "secure", "verifica", "verify",
    "valida", "confirm", "cuenta", "account", "home", "inicio", "help",
    "ayuda", "servicio", "service", "portal", "banca", "banco", "support",
    "contac", "contact", "info", "news", "mail", "email", "movil", "mobi",
}


def _es_token_generico(tok: str) -> bool:
    return tok in GENERIC_TOKENS


def _extraer_dominio(contenido: str) -> str:
    """Extrae el registro de dominio (raíz) de una URL, email o texto libre."""
    texto = contenido.strip().lower()

    # Quitar protocolo y ruta
    texto = re.sub(r"^[a-z]+://", "", texto)
    texto = texto.split("/")[0].split("?")[0].split("#")[0]

    # Si es un email, tomar la parte después del @
    if "@" in texto:
        texto = texto.split("@")[-1]

    # Quitar puerto
    texto = texto.split(":")[0]

    return texto.strip()


def _dominio_raiz(host: str) -> str:
    """Devuelve la raíz (registrable domain) intentando capturar 2 niveles."""
    partes = host.split(".")
    if len(partes) < 2:
        return host
    # ccTLD de dos niveles (ej: com.co, com.mx, com.ar, com.br)
    if len(partes) >= 3 and partes[-2] in (
        "com", "co", "net", "org", "gov", "edu", "mil"
    ) and len(partes[-1]) == 2:
        return ".".join(partes[-3:])
    return ".".join(partes[-2:])


def _levenstein(s1: str, s2: str) -> int:
    """Distancia de edición entre dos cadenas (inserciones/borrados/sustituciones)."""
    if s1 == s2:
        return 0
    if not s1:
        return len(s2)
    if not s2:
        return len(s1)
    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1, 1):
        curr = [i]
        for j, c2 in enumerate(s2, 1):
            costo = 0 if c1 == c2 else 1
            curr.append(min(
                prev[j] + 1,            # borrado
                curr[j - 1] + 1,        # inserción
                prev[j - 1] + costo,    # sustitución
            ))
        prev = curr
    return prev[-1]


def _similitud(s1: str, s2: str) -> float:
    """Similitud relativa 0..1 entre dos registros de dominio."""
    if not s1 or not s2:
        return 0.0
    return SequenceMatcher(None, s1, s2).ratio()


class DomainVerificationService:

    def verificar(self, contenido: str) -> dict:
        """
        Analiza un contenido (URL/email/texto) y verifica si el dominio
        pertenece a una entidad legítima o a una imitación fraudulenta.

        Retorna:
        {
          "es_real": bool,
          "confianza": int,       # 0-100 que es real
          "marca_imita": str|None,# marca que el dominio intenta suplantar
          "dominio_oficial": str|None,
          "razones": [str],       # justificaciones
          "score": int,           # 0-100 riesgo de dominio fraudulento
        }
        """
        host = _extraer_dominio(contenido)
        raiz = _dominio_raiz(host)

        resultados = self._comparar_con_marcas(raiz, host)

        if resultados["marca_encontrada"]:
            # El dominio coincide exactamente con una marca oficial -> real
            return self._respuesta_real(resultados)
        if resultados["posible_imitacion"]:
            return self._respuesta_imitacion(resultados, raiz)

        # No coincide con ninguna marca -> dominio desconocido/independiente
        return self._respuesta_desconocido(raiz, host)

    # ------------------------------------------------------------------
    def _comparar_con_marcas(self, raiz: str, host: str) -> dict:
        mejor_similitud = 0.0
        mejor_leven = 99
        mejor_marca = None
        mejor_dominio = None
        marca_encontrada = False
        coincidencias = []

        # Tokens del host sospechoso (ej. "bancobogota-verifica.cl" -> ["bancobogota","verifica"])
        host_sin_tld = re.sub(r"\.[a-z]{2,3}(\.[a-z]{2})?$", "", host)
        tokens_host = [
            t for t in re.split(r"[.\-]", host_sin_tld)
            if len(t) >= 3 and not _es_token_generico(t)
        ]

        # Si tras filtrar genéricos no queda ningún token útil, usamos la raíz completa
        if not tokens_host and len(re.sub(r"[.\-]", "", host_sin_tld)) >= 3:
            tokens_host = [host_sin_tld]

        for brand in KNOWN_BRANDS:
            for dominio_oficial in brand["domains"]:
                if not dominio_oficial:
                    continue
                dom_lim = _dominio_raiz(dominio_oficial)
                # Coincidencia exacta: registrable domain, dominio completo, o subdominio oficial
                if raiz == dom_lim or host == dominio_oficial or host.endswith("." + dominio_oficial):
                    marca_encontrada = True
                    return {
                        "marca_encontrada": True,
                        "posible_imitacion": False,
                        "marca": brand["name"],
                        "dominio_oficial": dominio_oficial,
                        "similitud": 1.0,
                        "leven": 0,
                    }

                # Base de comparación de la marca (sin TLD): "bancolombia", "nequi"
                base_marca = re.sub(r"\.[a-z]{2,3}(\.[a-z]{2})?$", "", dom_lim)

                # CANDIDATO por palabra de marca dentro del host (marca usurpada en dominio extraño)
                # ej: "bancolombia-seguro.top" contiene el token "bancolombia" pero NO es .bancolombia.com
                marca_incrustada = any(base_marca == tok for tok in tokens_host)

                # CANDIDATO por proximidad de un token (typosquat lingüístico)
                proximidad = False
                menor_lev = 99
                for tok in tokens_host:
                    if self._es_typosquat(tok, base_marca):
                        prox, levp = True, _levenstein(tok, base_marca)
                        if levp < menor_lev:
                            menor_lev = levp
                        proximidad = True

                if marca_incrustada or proximidad:
                    lev_efectivo = 0 if marca_incrustada else menor_lev
                    sim_efectiva = 1.0 if marca_incrustada else _similitud(
                        min(tokens_host, key=lambda t: _levenstein(t, base_marca)), base_marca)
                    if sim_efectiva > mejor_similitud:
                        mejor_similitud = sim_efectiva
                        mejor_leven = lev_efectivo
                        mejor_marca = brand["name"]
                        mejor_dominio = dominio_oficial
                        coincidencias.append((brand["name"], dominio_oficial, lev_efectivo))

        posible_imitacion = bool(mejor_marca)

        return {
            "marca_encontrada": marca_encontrada,
            "posible_imitacion": posible_imitacion,
            "marca": mejor_marca,
            "dominio_oficial": mejor_dominio,
            "similitud": mejor_similitud,
            "leven": mejor_leven,
            "coincidencias": coincidencias,
        }

    @staticmethod
    def _es_typosquat(a: str, b: str) -> bool:
        """Verifica si 'a' puede ser una imitación cercana de 'b'."""
        if a == b:
            return False  # es exacto, no typosquat (se maneja como marca_incrustada)
        if not a or not b or _es_token_generico(a):
            return False
        # Caso subcadena: solo cuenta si 'a' es lo bastante larga (>=60% de la marca)
        if a in b or b in a:
            menor = min(len(a), len(b))
            mayor = max(len(a), len(b))
            return menor >= 0.6 * mayor and abs(len(a) - len(b)) <= 3
        # Caso distancia de edición, con umbral según longitud de la marca
        umbral = 2 if len(b) >= 5 else 1
        return DomainVerificationService._levenstein_static(a, b) <= umbral

    @staticmethod
    def _levenstein_static(a: str, b: str) -> int:
        return _levenstein(a, b)

    # ------------------------------------------------------------------
    def _respuesta_real(self, res: dict) -> dict:
        return {
            "es_real": True,
            "confianza": 97,
            "marca_imita": None,
            "dominio_oficial": res["dominio_oficial"],
            "razones": [
                f"El dominio corresponde al sitio oficial de {res['marca']}.",
            ],
            "score": 5,
        }

    def _respuesta_imitacion(self, res: dict, raiz: str) -> dict:
        razones = [
            f"Posible imitación (typosquatting) de {res['marca']}: '{raiz}' se asemeja a '{res['dominio_oficial']}'.",
        ]
        if res["coincidencias"]:
            razones.append(
                f"Distancia de edición de {res['leven']} con el dominio oficial."
            )
        return {
            "es_real": False,
            "confianza": 10,
            "marca_imita": res["marca"],
            "dominio_oficial": res["dominio_oficial"],
            "razones": razones,
            "score": 80,
        }

    def _respuesta_desconocido(self, raiz: str, host: str) -> dict:
        score = 0
        razones = []

        # TLD sospechoso de bajo costo
        host_para_tld = host if "@" not in host else host
        for tld in SUSPICIOUS_TLDS:
            if host_para_tld.endswith(tld):
                score += 40
                razones.append(
                    f"Extensión de dominio de bajo costo ({tld}) frecuentemente usada en estafas."
                )
                break

        # Acceso por IP en lugar de nombre de dominio
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", host_para_tld):
            score += 30
            razones.append("El enlace accede directamente por dirección IP (no por nombre de dominio).")

        if score == 0:
            razones.append("El dominio no pertenece a una entidad financiera conocida de LATAM (dominio independiente).")

        return {
            "es_real": None,      # no se puede confirmar si es real, pero no imita una marca
            "confianza": 50,
            "marca_imita": None,
            "dominio_oficial": None,
            "razones": razones,
            "score": score,       # 0-40 según señales
        }
