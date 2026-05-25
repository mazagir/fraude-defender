export function Login({ onLogin }) {
  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
      <h2 className="text-lg font-bold mb-4">Login</h2>
      <button
        className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg"
        onClick={() => onLogin?.({ username: "demo" })}
      >
        Entrar (demo)
      </button>
    </div>
  );
}

