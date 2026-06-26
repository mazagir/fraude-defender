import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaExclamationTriangle, FaUserSecret } from 'react-icons/fa';

export default function AuthModal({ mode, setMode, onClose, onLogin, onRegister, onGuest, error, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') onLogin(email, password);
    else onRegister(nombre, email, password);
  };

  return (
    <div className="fixed inset-0 md:top-[65px] md:left-[240px] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-40 p-4 font-sans select-none">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-[#070911] border border-slate-800/80 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-sm" aria-label="Cerrar">
          <FaTimes />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-blue-500/10 mb-3">AS</div>
          <h2 className="text-lg font-bold text-slate-200">
            {mode === 'login' ? 'Acceder a AgiShield' : 'Registrar cuenta'}
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono font-bold">
            Inteligencia antifraude para LATAM
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-nombre" className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1">Nombre completo</label>
              <input
                id="auth-nombre"
                type="text"
                placeholder="Ej: Sofia Rodriguez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1">Correo electronico</label>
            <input
              id="auth-email"
              type="email"
              placeholder="Ej: sofia@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-1">Contrasena</label>
            <input
              id="auth-password"
              type="password"
              placeholder={mode === 'register' ? 'Minimo 12 caracteres' : 'Tu contrasena'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'register' ? 12 : undefined}
              className="w-full bg-[#090c15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              required
            />
            {mode === 'register' && <p className="text-[9px] text-slate-500 mt-1 font-mono">Minimo 12 caracteres para mayor seguridad</p>}
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold flex items-center gap-1.5">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10"
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar al SOC' : 'Registrarme'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-900 space-y-3">
          <div className="text-center">
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
              {mode === 'login'
                ? <><span>No tienes cuenta? </span><span className="font-bold text-cyan-400">Registrate aqui</span></>
                : <><span>Ya tienes cuenta? </span><span className="font-bold text-blue-400">Inicia sesion</span></>}
            </button>
          </div>
          <button type="button" onClick={onGuest}
            className="w-full py-2.5 rounded-xl border border-slate-800 bg-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 font-semibold text-[11px] tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-2">
            <FaUserSecret className="text-slate-500" />
            Continuar como Invitado
          </button>
          <p className="text-[9px] text-slate-600 text-center font-mono">Sin cuenta - analisis inmediato - sin historial guardado</p>
        </div>
      </motion.div>
    </div>
  );
}
