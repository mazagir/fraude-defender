// ─── RISK CONFIG & GLOBAL CONSTANTS ───
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://fraude-defender-api.onrender.com');

export const riskColor = {
  critical: '#ff2a51',
  alto: '#ff4d6d',
  medio: '#ffb547',
  bajo: '#00e5b4',
};

export const riskBg = {
  critical: 'rgba(255,42,81,0.12)',
  alto: 'rgba(255,77,109,0.12)',
  medio: 'rgba(255,181,71,0.12)',
  bajo: 'rgba(0,229,180,0.1)',
};

export function getRiskLevel(score) {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'alto';
  if (score >= 26) return 'medio';
  return 'bajo';
}

export class GeminiFallbackSimulator {
  generateMockResult(tipo, contenido) {
    const clean = contenido.toLowerCase();
    let score = 15;
    let indicators = [];
    let recommendations = [];
    let explanation = '';

    if (tipo === 'url') {
      if (clean.includes('.xyz') || clean.includes('.click') || clean.includes('.top')) {
        score += 35;
        indicators.push('Extensión de dominio de bajo costo frecuentemente asociada a estafas (.xyz / .click)');
      }
      if (clean.includes('nequi') || clean.includes('bancolombia') || clean.includes('daviplata') || clean.includes('banco')) {
        score += 30;
        indicators.push('Suplantación intencional de marca de billetera móvil o banco popular');
      }
      if (!clean.startsWith('https://')) {
        score += 15;
        indicators.push('Sitio inseguro: Ausencia de cifrado SSL obligatorio');
      }
      if (score >= 60) {
        explanation = 'Enlace fraudulento de Phishing detectado. Este sitio imita el portal oficial de tu banco o billetera móvil con el fin de recolectar claves secretas y códigos OTP.';
        recommendations = [
          'No hagas clic en el enlace ni ingreses datos.',
          'Cierra el navegador y reporta el dominio en AgiShield.',
          'Comunícate directamente con tu banco por sus aplicaciones autorizadas.',
        ];
      } else {
        explanation = 'No encontramos elementos de phishing evidentes, pero ten cautela de enlaces enviados por extraños.';
        recommendations = [
          'Verifica el certificado HTTPS de la página antes de interactuar.',
          'No descargues archivos extraños si te lo pide la web.',
        ];
      }
    } else if (tipo === 'whatsapp' || tipo === 'mensaje' || tipo === 'message') {
      if (clean.includes('deuda') || clean.includes('cobro') || clean.includes('embargo') || clean.includes('difundir')) {
        score += 45;
        indicators.push('Patrón delictivo de cobranza hostil y extorsión (Montadeudas)');
      }
      if (clean.includes('ganaste') || clean.includes('bono') || clean.includes('premio') || clean.includes('regalo')) {
        score += 35;
        indicators.push('Señuelo de falsa recompensa económica (Ingeniería Social)');
      }
      if (clean.includes('urgente') || clean.includes('hoy mismo') || clean.includes('evitar')) {
        score += 15;
        indicators.push('Sensación de urgencia ficticia inducida para asustar al usuario');
      }
      if (score >= 60) {
        explanation = 'Alerta de Fraude Financiero Activo (Montadeudas / Extorsión). Los estafadores usan amenazas directas sobre deudas infladas artificialmente.';
        recommendations = [
          'Bloquea el número telefónico de inmediato y no respondas.',
          'No transfieras dinero, la extorsión no cesará si realizas un pago.',
          'Reporta el número en tu aplicación de WhatsApp o SMS.',
        ];
      } else {
        explanation = 'El mensaje presenta un riesgo bajo o informativo, pero mantente precavido de solicitudes financieras atípicas.';
        recommendations = [
          'No agregues contactos desconocidos a grupos.',
          'Nunca verifiques códigos de WhatsApp recibidos por terceros.',
        ];
      }
    } else if (tipo === 'correo' || tipo === 'email') {
      if (clean.includes('seguridad') || clean.includes('suspender') || clean.includes('actualizacion')) {
        score += 25;
        indicators.push('Uso de ingeniería social fingiendo problemas en tu cuenta bancaria');
      }
      if (clean.includes('millon') || clean.includes('premio') || clean.includes('loteria')) {
        score += 40;
        indicators.push('Suplantación bancaria / Sorteo masivo no verificado');
      }
      if (score >= 50) {
        explanation = 'Intento de Phishing Corporativo por correo electrónico. Utilizan alarmas y logotipos simulados para capturar tus accesos.';
        recommendations = [
          'No hagas clic en ningún enlace ni abras archivos PDF/ZIP adjuntos.',
          'Marca el mensaje como correo no deseado.',
          'Compara la dirección del remitente: debe terminar exactamente en el dominio corporativo oficial de la institución.',
        ];
      } else {
        explanation = 'El correo posee lenguaje estándar de comunicación, pero no compartas credenciales confidenciales.';
        recommendations = [
          'Revisa siempre la cabecera completa del remitente.',
          'Mantén tu antivirus y navegador actualizados.',
        ];
      }
    } else {
      if (clean.includes('menú') || clean.includes('menu') || clean.includes('pago')) {
        score += 30;
        indicators.push('Enlace externo de cobro atípico contenido en código QR');
      }
      explanation = 'El código QR redirige a una URL externa. Recuerda verificar siempre a dónde te envía el escáner antes de confirmar el acceso.';
      recommendations = [
        'No completes pagos ni formularios ingresando desde un código QR público.',
        'Usa aplicaciones lectoras de QR que muestren la URL completa de antemano.',
      ];
    }

    score = Math.min(score, 100);
    const level = score >= 76 ? 'CRITICAL' : score >= 51 ? 'HIGH' : score >= 26 ? 'MEDIUM' : 'LOW';
    return { score, level, explanation, recommendations, indicators };
  }
}
