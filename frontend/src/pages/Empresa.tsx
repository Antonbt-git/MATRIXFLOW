import { Building2, Store } from 'lucide-react';
import { Button, PageHeader, Card, EmptyState, Badge } from '../components/UI';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

/** /empresa (§8.3): información corporativa. */
export default function Empresa() {
  const { data: empresas, reload } = useFetch(() => api.listEmpresas());
  const { data: sucursales } = useFetch(() => api.listSucursales());
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Información de la Empresa"
        description="Corporación y sucursales asociadas (RF-03)"
        icon={Building2}
        badge={<Badge tone="neutral">{empresas?.length ?? 0} empresas</Badge>}
        actions={
          <>
            <Button variant="secondary" onClick={reload}>Actualizar</Button>
            <Button variant="dark" onClick={() => navigate('/empresa/gestion')}>Gestionar empresas</Button>
            <Button onClick={() => navigate('/sucursales')}>Sucursales</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {empresas?.map((e) => (
          <Card
            key={e.id}
            title={e.nombre}
            subtitle={`NIT ${e.nit} · ${e.sector ?? '—'}`}
            icon={Building2}
            className="card-interactive"
            actions={<Badge tone="info">#{e.id}</Badge>}
          >
            <div className="flex items-center gap-2 text-sm text-muted">
              <Store size={15} className="text-primary" />
              {sucursales?.filter((s) => s.empresa_id === e.id).length ?? 0} sucursales asociadas
            </div>
          </Card>
        ))}

        {!empresas?.length && (
          <div className="lg:col-span-2">
            <EmptyState icon={Building2} title="Sin empresas registradas"
              description="Usa el módulo de Gestión Empresarial o el seed para crear la primera."
              action={<Button onClick={() => navigate('/empresa/gestion')}>Crear la primera</Button>} />
          </div>
        )}
      </div>
    </div>
  );
}
