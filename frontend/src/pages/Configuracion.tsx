import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { API_URL } from '../services/auth';

export default function Configuracion() {
  const [audit, setAudit] = useState<any[]>([]);
  useEffect(() => { api.audit().then(setAudit).catch(() => {}); }, []);
  return (
    <div className="p-2 flex flex-col gap-4 max-w-4xl">
      <h1 className="text-2xl font-bold">Configuración y Auditoría (RF-15, Fase 6)</h1>
      <div className="bg-white p-4 rounded shadow text-sm">
        <div>API: <b>{API_URL}</b></div>
        <div>Roles: admin (todo), analista (ventas/inventario/operaciones), consulta (dashboard/reportes).</div>
        <div>Seguridad: JWT Bearer, bcrypt, RBAC por endpoint.</div>
      </div>
      <div className="bg-white p-4 rounded shadow text-sm">
        <h2 className="font-semibold mb-2">Últimos eventos (solo admin)</h2>
        {audit.map((a) => <div key={a.id} className="border-b py-1">#{a.id} {a.accion} / {a.modulo} — {a.detalle}</div>)}
        {audit.length === 0 && <p className="text-gray-500">Sin eventos o sin permiso.</p>}
      </div>
    </div>
  );
}
