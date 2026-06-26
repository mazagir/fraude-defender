interface EmptyStateProps {
  mensaje?: string;
}

export default function EmptyState({ mensaje = "" }: EmptyStateProps) {
  return (
    <div className="text-gray-400 text-sm">
      {mensaje || "Sin datos"}
    </div>
  );
}

