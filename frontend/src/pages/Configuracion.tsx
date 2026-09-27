import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { API_URL } from '../services/auth';
import { PageHeader, Card, Badge, Msg, EmptyState } from '../components/UI';
import { Settings, ShieldCheck, Server, ScrollText, CircleAlert } from 'lucide-react';

const ACCION: Record<string, 'info' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  CREATE: 'ok', UPDATE: 'info', DELETE: 'danger', LOGIN: 'accent' as any, VIEW: 'neutral',
};

export default function Configuracion() {
  const [audit, setAudit] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { api.audit().then(setAudit).catch((e) => setError(e.message)); }, []);

  return (
    <div>
      <PageHeader
        title="Configuración y Auditoría"
        description="Estado del sistema, política de seguridad y eventos de auditoría (RF-15, Fase 6)"
        icon={Settings}
        actions={<Badge tone="info"><ShieldCheck size={12} /> Solo administrador</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Entorno" subtitle="Puntos de conexión activos" icon={Server}>
          <dl className="text-sm space-y-3">
            <div>
              <dt className="text-xs text-muted uppercase tracking-wide">API</dt>
              <dd className="font-mono text-xs text-text break-all bg-slate-50 rounded-lg px-2 py-1.5 mt-1">{API_URL}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted uppercase tracking-wide">Roles</dt>
              <dd className="text-text mt-1 leading-relaxed">
                <b>admin</b> (todo), <b>analista</b> (ventas/inventario/operaciones), <b>consulta</b> (dashboard/reportes).
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted uppercase tracking-wide">Seguridad</dt>
              <dd className="text-text mt-1 leading-relaxed">JWT Bearer · bcrypt · RBAC por endpoint · auditoría de cada acción.</dd>
            </div>
          </dl>
        </Card>

        <Card
          title="Últimos eventos"
          subtitle="Auditoría registrada en el servidor"
          icon={ScrollText}
          padded={false}
          className="lg:col-span-2 overflow-hidden"
        >
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Acción</th><th>Módulo</th><th>Detalle</th></tr>
              </thead>
              <tbody>
                {audit.slice(0, 50).map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs text-muted">#{a.id}</td>
                    <td><Badge tone={(ACCION[a.accion] as any) ?? 'neutral'}>{a.accion}</Badge></td>
                    <td className="text-xs">{a.modulo}</td>
                    <td className="text-xs text-muted max-w-[320px] truncate" title={a.detalle}>{a.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <div className="p-4"><Msg type="err">{error}</Msg></div>}
          {!audit.length && !error && (
            <EmptyState icon={CircleAlert} title="Sin eventos visibles"
              description="No hay eventos de auditoría o no tienes permiso de administrador." />
          )}
        </Card>
      </div>
    </div>
  );
}
