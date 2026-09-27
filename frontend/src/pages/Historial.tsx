import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Historial() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api.history().then(setItems).catch((e) => setError(e.message));
  }, []);
  return (
    <div className="p-2 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Historial (RF-13)</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="bg-white p-4 rounded shadow">
        {items.map((h) => (
          <div key={h.id} className="text-sm border-b py-1">
            #{h.id} <b>{h.operacion}</b> → {JSON.stringify(h.resultado)} <span className="text-gray-400">(user {h.usuario_id})</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">Sin operaciones aún. Ejecuta una en Operaciones.</p>}
      </div>
    </div>
  );
}
