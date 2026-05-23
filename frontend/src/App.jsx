import React, { useState, useEffect } from 'react';

function App() {
  // Estados para la lista de reportes y carga
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados para el Formulario de Registro
  const [formData, setFormData] = useState({
    phone_number: '',
    bank_account: '',
    domain: '',
    description: '',
    risk_level: 'Medio' // Valor por defecto
  });

  // Estado para alertas de éxito o error en el formulario
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  // Estado global de métricas
  const [metrics, setMetrics] = useState({
    totalReports: 0,
    criticalThreats: 0,
    mediumRisk: 0,
    activeScans: 0
  });

  // Función para obtener los datos desde FastAPI
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const respuesta = await fetch('http://127.0.0.1:8000/reportes');
      const datos = await respuesta.json();
      
      if (Array.isArray(datos)) {
        setReportes(datos);
        
        // Calcular métricas dinámicamente basadas en la base de datos
        const criticas = datos.filter(r => r.risk_level?.toLowerCase() === 'alto' || r.risk_level?.toLowerCase() === 'critico').length;
        const medias = datos.filter(r => r.risk_level?.toLowerCase() === 'medio').length;
        
        setMetrics({
          totalReports: datos.length,
          criticalThreats: criticas,
          mediumRisk: medias,
          activeScans: datos.length > 0 ? 1 : 0 // Monitoreo activo si hay registros
        });
      }
    } catch (error) {
      console.error("Error conectando con la API:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar la carga al abrir la app
  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejar cambios en los inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Enviar el formulario a la API (POST /reportes)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica: al menos un campo identificador debe estar lleno
    if (!formData.phone_number && !formData.bank_account && !formData.domain) {
      setFormStatus({
        type: 'error',
        message: 'Por favor, añade al menos un dato identificador (Teléfono, Cuenta o Dominio).'
      });
      return;
    }

    try {
      setSubmitting(true);
      setFormStatus({ type: '', message: '' });

      const respuesta = await fetch("https://fraude-defender-api.onrender.com/reportes", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (respuesta.ok) {
        setFormStatus({
          type: 'success',
          message: '¡Amenaza registrada exitosamente en el libro mayor de fraude!'
        });
        
        // Limpiar el formulario
        setFormData({
          phone_number: '',
          bank_account: '',
          domain: '',
          description: '',
          risk_level: 'Medio'
        });

        // Recargar los datos al instante para actualizar contadores y tabla
        await cargarDatos();
      } else {
        setFormStatus({
          type: 'error',
          message: 'Hubo un problema al procesar el reporte en el servidor.'
        });
      }
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      setFormStatus({
        type: 'error',
        message: 'No se pudo conectar con el servidor backend.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-red-500 selection:text-white">
      
      {/* Barra de Navegación Superior */}
      <nav className="border-b border-slate-800 bg-[#0d1321]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/30 font-black text-white tracking-wider">
            FD
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Fraude Defender</h1>
            <span className="text-xs text-slate-500 font-medium">Plataforma Open-Source de Inteligencia</span>
          </div>
        </div>
        
        {/* Estado de conexión con el Backend */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-medium tracking-wide">
            {loading ? "Sincronizando..." : "Ecosistema Activo"}
          </span>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Encabezado del Dashboard */}
        <header className="border-b border-slate-800/60 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-red-500 uppercase mb-1">Consola de Seguridad</p>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Monitoreo y Caza de Amenazas</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={cargarDatos} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition px-4 py-2 rounded-lg text-sm font-medium shadow-sm cursor-pointer">
              {loading ? "Cargando..." : "🔄 Sincronizar Base de Datos"}
            </button>
          </div>
        </header>

        {/* Cuadrícula de Métricas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#0d1321] border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-md">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Informes Totales</span>
            <span className="text-4xl font-extrabold tracking-tight text-white">{metrics.totalReports}</span>
          </div>

          <div className="bg-[#0d1321] border border-red-900/30 p-6 rounded-2xl relative overflow-hidden shadow-md bg-gradient-to-br from-[#0d1321] to-red-950/10">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider block mb-2">Amenazas Críticas</span>
            <span className="text-4xl font-extrabold tracking-tight text-red-500">{metrics.criticalThreats}</span>
          </div>

          <div className="bg-[#0d1321] border border-amber-900/30 p-6 rounded-2xl relative overflow-hidden shadow-md bg-gradient-to-br from-[#0d1321] to-amber-950/10">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-2">Riesgo Medio</span>
            <span className="text-4xl font-extrabold tracking-tight text-amber-500">{metrics.mediumRisk}</span>
          </div>

          <div className="bg-[#0d1321] border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-md">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Monitoreo Comunitario</span>
            <span className="text-4xl font-extrabold tracking-tight text-emerald-400">{metrics.activeScans > 0 ? "Activo" : "Inactivo"}</span>
          </div>
        </section>

        {/* Sección de Operaciones (Formulario + Tabla Side by Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tarjeta del Formulario Táctico de Reportes */}
          <section className="bg-[#0d1321] border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
            <h3 className="text-lg font-bold text-white mb-2">Ingresar Nueva Alerta</h3>
            <p className="text-xs text-slate-400 mb-4">Añade los indicadores de compromiso detectados en la campaña del Montadeudas.</p>
            
            {formStatus.message && (
              <div className={`p-3 rounded-lg text-xs font-medium mb-4 border ${
                formStatus.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {formStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Dominio / Nombre de la App</label>
                <input 
                  type="text" name="domain" value={formData.domain} onChange={handleInputChange}
                  placeholder="ej. plata-rapida-fake.com u OxxoCrédito"
                  className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Teléfono de Extorsión</label>
                <input 
                  type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange}
                  placeholder="ej. +573001234567"
                  className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cuenta Bancaria Destino</label>
                <input 
                  type="text" name="bank_account" value={formData.bank_account} onChange={handleInputChange}
                  placeholder="ej. Nequi o Cuenta de Ahorros"
                  className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nivel de Severidad</label>
                <select 
                  name="risk_level" value={formData.risk_level} onChange={handleInputChange}
                  className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500 transition cursor-pointer"
                >
                  <option value="Medio">⚠️ Riesgo Medio (Mensajes/Spam)</option>
                  <option value="Critico">🚨 Crítico (Doxeo / Amenazas de muerte)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción del Modus Operandi</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleInputChange} rows="3"
                  placeholder="Describe cómo operan o qué mensajes envían..."
                  className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow-md shadow-red-900/20 transition cursor-pointer"
              >
                {submitting ? "Registrando en Base de Datos..." : "🚀 Desplegar Alerta Comunitaria"}
              </button>
            </form>
          </section>

          {/* Tabla Dinámica con la Base de Datos (Toma 2 Columnas de ancho) */}
          <section className="bg-[#0d1321] border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-1">Base de Datos de Inteligencia (PostgreSQL)</h3>
            <p className="text-xs text-slate-400 mb-4">Registros centralizados en el puerto 5436. Datos validados en tiempo real.</p>
            
            <div className="overflow-x-auto">
              {reportes.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No hay reportes de amenazas registrados en Postgres.</p>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="pb-3">Dominio/App</th>
                      <th className="pb-3">Teléfono</th>
                      <th className="pb-3">Cuenta Bancaria</th>
                      <th className="pb-3 text-right">Severidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {reportes.map((reporte) => (
                      <tr key={reporte.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 font-medium text-white max-w-[150px] truncate">{reporte.domain || 'N/A'}</td>
                        <td className="py-3.5 font-mono text-xs">{reporte.phone_number || 'N/A'}</td>
                        <td className="py-3.5 text-xs max-w-[150px] truncate">{reporte.bank_account || 'N/A'}</td>
                        <td className="py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            reporte.risk_level?.toLowerCase() === 'alto' || reporte.risk_level?.toLowerCase() === 'critico'
                              ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
                              : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            {reporte.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default App;