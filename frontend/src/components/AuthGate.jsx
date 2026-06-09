export default function AuthGate({ usuario, onLoginClick, children }) {
  if (!usuario) {
    return (
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Acceso requerido</h2>
        <div className="text-sm text-gray-300 mb-4">
          Debes iniciar sesión para ver y crear reportes.
        </div>

        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg"
          onClick={onLoginClick}
        >
          Iniciar sesión
        </button>

        <div className="text-xs text-gray-400 mt-3">
          Si tu backend no tiene usuarios, usa “Crear usuario” en el modal de Login.
        </div>
      </div>
    );
  }

  return children;
}


