import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const POR_PAGINA = 10;

function Paginacion({ total, pagina, onChange }) {
  const totalPaginas = Math.ceil(total / POR_PAGINA);

  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <span className="text-gray-500 text-sm">
        {total} resultados · Página {pagina} de {totalPaginas}
      </span>

      <div className="flex gap-2">
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300"
        >
          <FaChevronLeft />
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-2 rounded-lg ${
              p === pagina
                ? "bg-green-500 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default Paginacion;