import { InputField, Button } from '../components/UI';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';

/** /empresa (§8.3): información corporativa. */
export default function Empresa() {
  const { data: empresas, reload } = useFetch(() => api.listEmpresas());
  const { data: sucursales } = useFetch(() => api.listSucursales());

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text">Información de la Empresa</h1>
        <p className="text-muted">Corporación y sucursales asociadas (RF-03)</p>
      </header>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Empresas registradas</h3>
        {empresas?.map((e) => (
          <div key={e.id} className="border-b py-2 text-sm">
            #{e.id} <b>{e.nombre}</b> — NIT {e.nit} — {e.sector}
            <span className="text-muted"> · {sucursales?.filter((s) => s.empresa_id === e.id).length ?? 0} sucursales</span>
          </div>
        ))}
        {!empresas?.length && <p className="text-muted text-sm">Sin empresas. Usa Sucursales/Productos o el seed.</p>}
      </div>
    </div>
  );
}
