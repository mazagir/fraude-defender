import { AnimatePresence, motion } from "framer-motion";
import useAppLogic from "./hooks/useAppLogic";
import Sidebar from "./components/layout/Sidebar";
import AuthModal from "./components/auth/AuthModal";
import GuestBanner from "./components/auth/GuestBanner";
import HomeView from "./components/scanner/HomeView";
import CriticalAlertModal from "./components/scanner/CriticalAlertModal";
import DashboardView from "./components/profile/DashboardView";
import CommunityView from "./components/community/CommunityView";
import DeveloperSOCView from "./components/developer/DeveloperSOCView";

export default function App() {
  const {
    token, user, activeTab, setActiveTab, reports, scanResult, setScanResult, scanHistory,
    criticalAlertResult, setCriticalAlertResult, showGuestBanner, setShowGuestBanner,
    authMode, setAuthMode, isDeveloperMode, setIsDeveloperMode, gamification, streak,
    isSidebarOpen, setIsSidebarOpen, loading, error, isSimulatingAttack, scanType, setScanType,
    scanInput, setScanInput, emailDetails, setEmailDetails, selectedQrCase, setSelectedQrCase,
    isScanning, scanLogs, simulatedLogs, selectedReport, setSelectedReport, selectedCountry,
    setSelectedCountry, latamThreats, handleLogin, handleLogout, handleRegister,
    handleGuestLogin, handleCreateReport, handleDeleteReport, runQuickScan,
    handleTriggerAttackSimulation
  } = useAppLogic();

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 font-sans relative overflow-hidden flex flex-col md:flex-row select-none">
      <AnimatePresence>
        {isSimulatingAttack && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-red-600 z-50 pointer-events-none" />
        )}
      </AnimatePresence>

      <Sidebar token={token} user={user} activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setScanResult(null); setScanInput(""); }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isDeveloperMode={isDeveloperMode} setIsDeveloperMode={setIsDeveloperMode} onLogout={handleLogout} onLoginClick={() => setAuthMode("login")} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-[65px] bg-[#070911]/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-400 hover:text-slate-200 text-xl" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 tracking-wide uppercase">
                🛡️ AgiShield AI <span className="text-[9px] text-cyan-400 font-mono tracking-widest border border-cyan-400/30 px-1.5 py-0.2 rounded">SaaS Beta</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block">Ciberseguridad ciudadana contra estafas · LATAM</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {token ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-300">{user?.nombre}</div>
                  <div className="text-[9px] text-cyan-400 font-mono font-semibold">Reputación: {gamification.reputation} XP</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-xs font-bold font-mono border border-slate-700">{user?.nombre?.slice(0, 2)}</div>
              </div>
            ) : (
              <button onClick={() => setAuthMode("login")} className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer">Acceder / Registrarse</button>
            )}
            {isDeveloperMode && (
              <button onClick={handleTriggerAttackSimulation} className="text-[9px] font-bold uppercase tracking-wider bg-red-950/40 border border-red-500/30 hover:bg-red-900/20 text-red-400 px-3 py-1 rounded-xl transition-colors cursor-pointer">Simular Ataque</button>
            )}
          </div>
        </header>

        <main className="p-5 md:p-8 flex-grow">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-6xl mx-auto w-full h-full">
              {activeTab === "home" && (
                <HomeView scanType={scanType} setScanType={setScanType} scanInput={scanInput} setScanInput={setScanInput} emailDetails={emailDetails} setEmailDetails={setEmailDetails} selectedQrCase={selectedQrCase} setSelectedQrCase={setSelectedQrCase} isScanning={isScanning} scanLogs={scanLogs} scanResult={scanResult} setScanResult={setScanResult} runQuickScan={runQuickScan} onRegisterPrompt={() => setAuthMode("register")} token={token} />
              )}
              {activeTab === "dashboard" && (
                <DashboardView token={token} user={user} reports={reports} scanHistory={scanHistory} userReputation={gamification.reputation} userLevel={gamification.level} unlockedBadges={gamification.badges} setAuthMode={setAuthMode} streak={streak} />
              )}
              {activeTab === "community" && (
                <CommunityView reports={reports} selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} latamThreats={latamThreats} onCreateReport={handleCreateReport} token={token} />
              )}
              {activeTab === "developer" && isDeveloperMode && (
                <DeveloperSOCView reports={reports} simulatedLogs={simulatedLogs} onDelete={handleDeleteReport} selectedReport={selectedReport} setSelectedReport={setSelectedReport} onSimulateAttack={handleTriggerAttackSimulation} isSimulating={isSimulatingAttack} token={token} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showGuestBanner && !token && (
          <GuestBanner onRegister={() => { setShowGuestBanner(false); setAuthMode("register"); }} onDismiss={() => setShowGuestBanner(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authMode !== "guest" && authMode !== "" && (
          <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => { setAuthMode(""); setShowGuestBanner(true); }} onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuestLogin} error={error} loading={loading} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {criticalAlertResult && (
          <CriticalAlertModal result={criticalAlertResult} onClose={() => setCriticalAlertResult(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
