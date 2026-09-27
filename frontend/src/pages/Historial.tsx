import { useEffect, useState } from 'react';
import { api } from '../services/api';
import CarnetAuditoria from '../components/CarnetAuditoria';
import { PageHeader, Card, Msg, EmptyState, Badge } from '../components/UI';
import { History, Sigma, CircleAlert } from 'lucide-react';

export default function Historial() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api.history().then(setItems).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Historial"
        description="Carnet de auditoría y trazabilidad completa de operaciones (RF-13)"
        icon={History}
        badge={<Badge tone="neutral">{items.length} operaciones</Badge>}
      />

      {error && <div className="mb-5"><Msg type="err">{error}</Msg></div>}

      {/* Carnet de auditoría: 7 días, usuarios activos y ubicación de login */}
      <div className="mb-5">
        <CarnetAuditoria />
      </div>

      <Card
        title="Operaciones matemáticas registradas"
        subtitle="Cada cálculo queda asociado a su usuario"
        icon={Sigma}
      >
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {items.map((h) => (
            <div key={h.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
              <span className="font-mono text-xs text-muted shrink-0">#{h.id}</span>
              <span className="font-medium text-text truncate">{h.operacion}</span>
              <code className="font-mono text-xs text-slate-600 bg-slate-50 rounded px-2 py-0.5 truncate max-w-[40%]">
                {JSON.stringify(h.resultado)}
              </code>
              <span className="ml-auto text-xs text-muted shrink-0">usuario #{h.usuario_id}</span>
            </div>
          ))}
        </div>
        {items.length === 0 && !error && (
          <EmptyState icon={CircleAlert} title="Sin operaciones aún"
            description="Ejecuta una en el módulo de Operaciones y aparecerá aquí." />
        )}
      </Card>
    </div>
  );
}
