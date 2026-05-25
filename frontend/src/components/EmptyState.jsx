export default function EmptyState({ mensaje = "" }) {
  return (
    <div className="text-gray-400 text-sm">
      {mensaje || "Sin datos"}
    </div>
  );
}

