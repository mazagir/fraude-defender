function Sidebar({ seccion, setSeccion }) {
  return (
    <aside className="w-64 bg-gray-900/80 border-r border-gray-800 p-6">
      <div className="text-xl font-bold text-green-400 mb-6">AegisShield</div>

      <nav className="space-y-3">
        <button
          className={
            seccion === "dashboard"
              ? "w-full text-left px-3 py-2 rounded-lg bg-gray-800 text-white"
              : "w-full text-left px-3 py-2 rounded-lg bg-transparent text-gray-300 hover:bg-gray-800"
          }
          onClick={() => setSeccion("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={
            seccion === "reportes"
              ? "w-full text-left px-3 py-2 rounded-lg bg-gray-800 text-white"
              : "w-full text-left px-3 py-2 rounded-lg bg-transparent text-gray-300 hover:bg-gray-800"
          }
          onClick={() => setSeccion("reportes")}
        >
          Reportes
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;

