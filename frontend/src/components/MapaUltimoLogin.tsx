import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { api } from '../services/api';

const PERU_BBOX = '-81.5,-18.5,-68.5,-0.0';

export default function MapaUltimoLogin() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.ultimoLogin()
      .then(setData)
      .catch((e) => setError(e.response?.data?.detail || e.message));
  }, []);

  if (error) {
    return (
      <div className="card card-pad text-sm">
        <div className="msg msg-err">{error}</div>
      </div>
    );
  }

  const tieneCoordenadas = Number.isFinite(Number(data?.latitud)) && Number.isFinite(Number(data?.longitud));
  const lat = tieneCoordenadas ? Number(data.latitud) : -9.19;
  const lon = tieneCoordenadas ? Number(data.longitud) : -75.02;

  const delta = 0.08;
  const bbox = tieneCoordenadas
    ? `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
    : PERU_BBOX;

  const mapa = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${
    tieneCoordenadas ? `&marker=${lat}%2C${lon}` : ''
  }`;

  return (
    <div className="card overflow-hidden animate-fade-up">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="flex items-center gap-2 font-semibold text-slate-700">
          <MapPin size={18} className="text-red-500" />
          Última persona conectada
        </h2>
        <p className="text-sm text-muted mt-1">Ubicación aproximada del último inicio de sesión registrado.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px]">
        <iframe
          title="Mapa de Perú - última conexión"
          src={mapa}
          className="w-full h-[420px] border-0"
          loading="lazy"
        />

        <div className="p-5 border-l border-slate-100">
          {!data?.disponible ? (
            <p className="text-sm text-muted">Todavía no hay inicios de sesión registrados.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted uppercase">Usuario</p>
                <p className="font-semibold text-text">{data.usuario ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase">Departamento</p>
                <p className="font-semibold text-text">{data.departamento ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase">Distrito</p>
                <p className="font-semibold text-text">{data.distrito ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase">Dirección aproximada</p>
                <p className="font-semibold text-text">{data.direccion ?? '—'}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs text-muted">
                <p>Último acceso: {data.fecha ? new Date(data.fecha).toLocaleString('es-PE') : '—'}</p>
                {!tieneCoordenadas && <p className="mt-1">Coordenadas no disponibles para este registro.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
