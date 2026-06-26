import {
  FaShieldAlt, FaGlobe, FaUserShield, FaTerminal,
  FaCode, FaPowerOff, FaUser, FaTimes, FaLock,
} from 'react-icons/fa';
import type { UserData } from '../../types';

interface SidebarProps {
  token: string | null;
  user: UserData | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isDeveloperMode: boolean;
  setIsDeveloperMode: (mode: boolean) => void;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function Sidebar({
  token, user, activeTab, setActiveTab,
  isSidebarOpen, setIsSidebarOpen,
  isDeveloperMode, setIsDeveloperMode,
  onLogout, onLoginClick,
}: SidebarProps) {
  const userNavItems = [
    { id: 'home', icon: <FaShieldAlt />, label: 'Detector de Estafas' },
    { id: 'dashboard', icon: <FaUserShield />, label: 'Mi Perfil Seguro' },
    { id: 'community', icon: <FaGlobe />, label: 'Comunidad y Mapa' },
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[240px] border-r border-slate-800/80 bg-[#070911]/95 flex flex-col flex-shrink-0 h-screen transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } backdrop-blur-md`}
      >
        <div className="p-5 border-b border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/10 text-lg">🛡️</div>
            <div>
              <div className="font-extrabold text-sm text-slate-100 tracking-wide">AgiShield AI</div>
              <div className="text-[8px] text-cyan-400 tracking-[2px] font-bold uppercase">FrauDefender</div>
            </div>
          </div>
          <button className="md:hidden text-slate-400 text-xl" onClick={() => setIsSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-1.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-2.5 mb-2.5">Navegación</div>
          {userNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-blue-600/10 text-cyan-400 border border-blue-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {!token && item.id !== 'home' && <FaLock className="text-slate-600 text-[9px]" />}
            </button>
          ))}

          <div className="pt-6 border-t border-slate-900 mt-4 space-y-2">
            <div className="flex items-center justify-between px-2.5">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                <FaCode /> Modo Developer
              </span>
              <label className="relative inline-flex items-center cursor-pointer scale-75">
                <input
                  type="checkbox"
                  checked={isDeveloperMode}
                  onChange={(e) => {
                    setIsDeveloperMode(e.target.checked);
                    if (e.target.checked) setActiveTab('developer');
                    else if (activeTab === 'developer') setActiveTab('home');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950" />
              </label>
            </div>

            {isDeveloperMode && (
              <button
                onClick={() => { setActiveTab('developer'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'developer'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner'
                    : 'text-slate-500 hover:text-red-400 hover:bg-red-950/10 border border-transparent'
                }`}
              >
                <FaTerminal /> Consola SOC (CTO)
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-slate-950/40">
          {token ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 text-xs font-bold font-mono">
                  {user?.nombre?.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-300 truncate">{user?.nombre}</div>
                  <div className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FaPowerOff size={10} /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full py-2 rounded-lg border border-slate-800 bg-[#090c15] text-slate-300 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 hover:border-cyan-500/30"
            >
              <FaUser size={10} /> Ingresar
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
