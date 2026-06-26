import json
import httpx
import re
from typing import Dict, Any

from app.core.config import settings

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = "gemini-1.5-flash"
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def analizar_sospecha(self, tipo: str, contenido: str) -> Dict[str, Any]:
        """
        Analiza un elemento sospechoso (url, mensaje, whatsapp, correo, qr)
        y retorna una estructura JSON con el análisis.
        """
        if not contenido or not contenido.strip():
            return {
                "score": 0,
                "level": "LOW",
                "explanation": "No se proporcionó contenido para analizar.",
                "recommendations": ["Ingresa un texto o enlace para iniciar el escaneo."],
                "indicators": []
            }

        if not self.api_key:
            # Si no hay API key, usamos el motor heurístico local de respaldo
            return self._analisis_heuristico_local(tipo, contenido)

        prompt = f"""
Actúa como un analista experto en ciberseguridad y detección de fraudes de la startup AegisShield AI.
Analiza el siguiente elemento sospechoso reportado por un usuario:
- Tipo de canal/escaneo: {tipo} (puede ser 'url', 'mensaje', 'whatsapp', 'correo', 'qr')
- Contenido sospechoso a evaluar: "{contenido}"

Tu objetivo es clasificar el riesgo y ofrecer una explicación comprensible para personas NO técnicas, con empatía y claridad.
Debes responder ESTRICTAMENTE en formato JSON con la siguiente estructura de campos (no incluyas markdown fuera del JSON, solo el objeto JSON):
{{
  "score": 85, // (entero de 0 a 100)
  "level": "CRITICAL", // (string: LOW, MEDIUM, HIGH, CRITICAL)
  "explanation": "Explicación simple y comprensible en español del riesgo (máximo 3 frases).",
  "recommendations": ["Recomendación 1", "Recomendación 2"], // (lista de strings)
  "indicators": ["Indicador 1", "Indicador 2"] // (lista de strings que justifican la sospecha)
}}
        """

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.url,
                    params={"key": self.api_key},
                    json=payload,
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Extraer el texto generado
                    texto_generado = data["candidates"][0]["content"]["parts"][0]["text"]
                    # Parsear el JSON retornado por el modelo
                    resultado = json.loads(texto_generado.strip())
                    
                    # Asegurar tipos correctos
                    resultado["score"] = int(resultado.get("score", 0))
                    resultado["level"] = str(resultado.get("level", "LOW")).upper()
                    resultado["explanation"] = str(resultado.get("explanation", ""))
                    resultado["recommendations"] = list(resultado.get("recommendations", []))
                    resultado["indicators"] = list(resultado.get("indicators", []))
                    return resultado
                else:
                    # En caso de error de la API de Google, usar fallback heurístico
                    return self._analisis_heuristico_local(tipo, contenido, error_info=f"API Error {response.status_code}")
        except Exception as e:
            return self._analisis_heuristico_local(tipo, contenido, error_info=str(e))

    def _analisis_heuristico_local(self, tipo: str, contenido: str, error_info: str = None) -> Dict[str, Any]:
        """
        Motor heurístico de respaldo que emula las respuestas de la IA cuando no hay API Key
        o cuando falla el llamado a Google Gemini.
        """
        score = 15
        indicators = []
        recommendations = []
        explanation = ""
        
        contenido_clean = contenido.lower().strip()

        if tipo == "url":
            # Reglas para URLs
            tlds_sospechosos = [".xyz", ".click", ".top", ".info", ".live", ".work", ".support"]
            if any(contenido_clean.endswith(tld) or (tld + "/") in contenido_clean for tld in tlds_sospechosos):
                score += 35
                indicators.append("TLD / Extensión de dominio genérica de bajo costo (comúnmente usada en estafas)")
            
            if "banco" in contenido_clean or "nequi" in contenido_clean or "daviplata" in contenido_clean or "soporte" in contenido_clean:
                score += 30
                indicators.append("Suplantación potencial de entidades financieras de LATAM")
                
            if "sorteo" in contenido_clean or "premio" in contenido_clean or "ganaste" in contenido_clean or "regalo" in contenido_clean:
                score += 20
                indicators.append("Gancho promocional o señuelo de ingeniería social")

            if not contenido_clean.startswith("https://"):
                score += 10
                indicators.append("Falta de cifrado seguro SSL/HTTPS")

            if score <= 20:
                explanation = "Este dominio no coincide con patrones conocidos de phishing comunes, pero te recomendamos verificar siempre los canales oficiales."
                recommendations = ["Verifica el candado de seguridad en la barra de navegación.", "No ingreses contraseñas si el enlace te llegó por SMS o chat."]
            else:
                explanation = f"Alerta de seguridad: Detectamos un enlace sospechoso de phishing. Este sitio imita características de portales oficiales para capturar tus datos."
                recommendations = [
                    "No hagas clic en el enlace ni ingreses datos personales.",
                    "Reporta este dominio para que sea añadido a la lista de bloqueados.",
                    "Si ingresaste claves, cámbialas de inmediato en la aplicación oficial de tu banco."
                ]

        elif tipo in ["mensaje", "whatsapp"]:
            # Mensajes / WhatsApp
            palabras_montadeudas = ["cobro", "deuda", "embargo", "pagar", "intereses", "judicial", "montadeudas", "gota a gota", "difundir", "contactos"]
            palabras_urgencia = ["inmediato", "hoy mismo", "última oportunidad", "evitar", "urgente", "ahora"]
            palabras_promocion = ["ganaste", "premio", "bono", "recibe", "dinero gratis", "trabajo fácil", "dólares al día"]

            hits_montadeudas = [w for w in palabras_montadeudas if w in contenido_clean]
            hits_urgencia = [w for w in palabras_urgencia if w in contenido_clean]
            hits_promocion = [w for w in palabras_promocion if w in contenido_clean]

            if hits_montadeudas:
                score += 45
                indicators.append(f"Patrón de extorsión o cobro gota a gota/montadeudas ({', '.join(hits_montadeudas[:2])})")
            if hits_urgencia:
                score += 20
                indicators.append("Presión de tiempo / Urgencia artificial")
            if hits_promocion:
                score += 30
                indicators.append("Esquema falso de ganancias rápidas o tareas")

            # Buscar números sospechosos
            if re.search(r"\+\d{1,3}", contenido_clean):
                score += 5
                indicators.append("Contacto desde número internacional no registrado")

            if score <= 20:
                explanation = "El mensaje parece ser un texto informativo común, pero desconfía si solicita transferencias o información confidencial."
                recommendations = ["Mantén cautela y no compartas códigos de verificación.", "Ignora ofertas que parezcan demasiado buenas para ser verdad."]
            elif hits_promocion:
                explanation = "Esquema fraudulento detectado: Se trata de una oferta de empleo falsa o premio inexistente diseñado para robar tu información o saldo."
                recommendations = [
                    "No respondas al mensaje ni agregues al contacto.",
                    "No envíes dinero para recibir 'comisiones' o iniciar tareas.",
                    "Reporta el número en tu aplicación de mensajería."
                ]
            else:
                explanation = "Alerta crítica: Patrón de cobranza abusiva o extorsión. Los estafadores utilizan intimidación y amenazas de difamación digital."
                recommendations = [
                    "No respondas ni muestres temor al extorsionador.",
                    "Bloquea el número telefónico de inmediato.",
                    "No realices pagos, ya que esto alentará a que sigan exigiendo más dinero."
                ]

        elif tipo == "correo":
            # Correos sospechosos
            if "actualizar" in contenido_clean or "seguridad" in contenido_clean or "cuenta bloqueada" in contenido_clean:
                score += 25
                indicators.append("Señuelo de soporte o actualización de cuenta")
            if "urgente" in contenido_clean or "suspension" in contenido_clean:
                score += 20
                indicators.append("Tono imperativo o amenaza de suspensión del servicio")
            if "millones" in contenido_clean or "herencia" in contenido_clean or "lotería" in contenido_clean:
                score += 35
                indicators.append("Fraude de tipo 'Scam Nigeriano' o premios acumulados")

            if score <= 20:
                explanation = "El correo contiene lenguaje estándar. Si no conoces al remitente, evita abrir archivos adjuntos."
                recommendations = ["Revisa que la dirección del remitente coincida exactamente con la empresa oficial.", "No descargues archivos PDF o ejecutables sospechosos."]
            else:
                explanation = "Este correo electrónico presenta características típicas de Phishing Corporativo o estafa de suplantación bancaria."
                recommendations = [
                    "No respondas al correo ni hagas clic en sus botones.",
                    "Márcalo como Spam o Phishing en tu bandeja de entrada.",
                    "Comunícate con la entidad por sus canales de atención verificados si tienes dudas."
                ]

        else:  # QR
            # Generalmente los QR apuntan a URLs sospechosas
            if "http" in contenido_clean:
                score += 20
                indicators.append("Código QR redirige a un enlace externo no verificado")
            if "pago" in contenido_clean or "pay" in contenido_clean:
                score += 25
                indicators.append("Solicitud de redirección de pago automático")

            if score <= 20:
                explanation = "El código QR contiene información estándar. Asegúrate de que apunte a un sitio seguro antes de interactuar."
                recommendations = ["Visualiza la URL de destino completa en tu escáner antes de abrirla."]
            else:
                explanation = "Cuidado: Este código QR intenta redirigirte a un portal de pago o formulario sospechoso diseñado para capturar tus credenciales bancarias (Quishing)."
                recommendations = [
                    "No ingreses información confidencial en el portal web de destino.",
                    "Evita escanear códigos QR pegados en lugares públicos sin verificar su legitimidad."
                ]

        # Ajuste de niveles
        score = max(0, min(100, score))
        if score <= 25:
            level = "LOW"
        elif score <= 50:
            level = "MEDIUM"
        elif score <= 75:
            level = "HIGH"
        else:
            level = "CRITICAL"

        # Si hubo un error en la llamada a Gemini, lo documentamos discretamente en los indicadores para depuración
        if error_info:
            indicators.append(f"Heurística Local (Respaldo por error: {error_info[:40]})")

        return {
            "score": score,
            "level": level,
            "explanation": explanation,
            "recommendations": recommendations,
            "indicators": indicators
        }
