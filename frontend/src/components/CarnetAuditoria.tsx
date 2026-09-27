/**
 * Carnet de Auditoría (Historial): credencial con los datos de auditoría del
 * usuario — actividad de los últimos 7 días, usuarios más activos y la
 * ubicación (departamento, distrito y dirección) desde la que inició sesión.
 */
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MapPin, Activity, Users, ShieldCheck, RefreshCw } from 'lucide-react';

const iniciales = (n: string) =>
  n.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U';

const diaCorto = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short' });

const fecha = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export default function CarnetAuditoria() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const load = async () => {
    setCargando(true);
    try {
      setData(await api.carnet());
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (cargando) return <div className="bg-white p-4 rounded shadow text-sm text-muted">Cargando carnet…</div>;
  if (error) return <div className="bg-white p-4 rounded shadow text-sm text-red-600">{error}</div>;
  if (!data) return null;

  const dias = data.actividad_7_dias || [];
  const maxDia = Math.max(1, ...dias.map((d: any) => Math.max(d.eventos, d.operaciones)));
  const top = data.usuarios_activos || [];
  const maxTop = Math.max(1, ...top.map((u: any) => u.total));
  const ubi = data.ubicacion || {};

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
      {/* Cabecera de la credencial */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-600 text-white px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center text-xl font-bold">
            {iniciales(data.usuario.username)}
          </div>
          <div>
            <p className="font-semibold text-lg leading-tight">{data.usuario.username}</p>
            <p className="text-xs uppercase tracking-wide text-slate-300">
              {data.usuario.rol} · {data.usuario.empresa ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-2 rounded-lg">
          <ShieldCheck size={16} />
          <span>Carnet de Auditoría · {new Date().toLocaleDateString()}</span>
          <button onClick={load} title="Actualizar" className="ml-2 hover:text-slate-300">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-0">
        {/* --- Ubicación de inicio de sesión --- */}
        <div className="p-5 border-r border-slate-100">
          <h3 className="flex items-center gap-2 font-semibold text-slate-700 text-sm mb-3">
            <MapPin size={16} className="text-red-500" /> Ubicación de inicio de sesión
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted uppercase">Departamento</p>
              <p className="font-semibold text-text">{ubi.departamento ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase">Distrito</p>
              <p className="font-semibold text-text">{ubi.distrito ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase">Dirección</p>
              <p className="font-semibold text-text">{ubi.direccion ?? '—'}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-muted">
              <p>IP: {ubi.ip ?? '—'}</p>
              <p>Último acceso: {fecha(ubi.fecha)}</p>
              <p>Fuente: {ubi.fuente ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* --- Actividad de los últimos 7 días --- */}
        <div className="p-5 border-r border-slate-100">
          <h3 className="flex items-center gap-2 font-semibold text-slate-700 text-sm mb-3">
            <Activity size={16} className="text-blue-500" /> Actividad — últimos 7 días
          </h3>
          <div className="flex items-end justify-between gap-1 h-28">
            {dias.map((d: any) => {
              const total = d.eventos + d.operaciones;
              return (
                <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1" title={
                  `${d.fecha}\nEventos: ${d.eventos} · Operaciones: ${d.operaciones} · Logins: ${d.logins}`}>
                  <span className="text-[10px] text-muted">{total || ''}</span>
                  <div
                    className={`w-full rounded-t ${total ? 'bg-blue-500' : 'bg-slate-200'}`}
                    style={{ height: `${Math.max(6, (total / maxDia) * 84)}px` }}
                  />
                  <span className="text-[10px] text-muted">{diaCorto(d.fecha)}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[
              ['Eventos', data.resumen.eventos_7d],
              ['Operaciones', data.resumen.operaciones_7d],
              ['Logins', data.resumen.logins_7d],
            ].map(([k, v]) => (
              <div key={k as string} className="bg-slate-50 rounded p-2">
                <p className="text-lg font-bold text-text">{v as any}</p>
                <p className="text-[10px] uppercase text-muted">{k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- Usuarios más activos --- */}
        <div className="p-5">
          <h3 className="flex items-center gap-2 font-semibold text-slate-700 text-sm mb-3">
            <Users size={16} className="text-green-500" /> Usuarios más activos
          </h3>
          <div className="space-y-3">
            {top.length === 0 && <p className="text-sm text-muted">Sin actividad en los últimos 7 días.</p>}
            {top.map((u: any) => (
              <div key={u.usuario_id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text">
                    {u.username} <span className="text-muted text-xs">({u.rol ?? '—'})</span>
                  </span>
                  <span className="text-muted">{u.total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(u.total / maxTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-4 pt-3 border-t border-slate-100">
            {data.resumen.usuarios_activos_7d} usuario(s) con actividad ·{' '}
            {data.resumen.dias_con_actividad}/7 días con movimiento
          </p>
        </div>
      </div>
    </div>
  );
}
