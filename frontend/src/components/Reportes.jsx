import TablaReportes from "./TablaReportes";


function Reportes({ reportes = [] }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <TablaReportes reportes={reportes} />
    </div>
  );
}

export default Reportes;

