import React, { useState } from 'react';
import { InputField, Button } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const Goals: React.FC = () => {
  const [meta, setMeta] = useState({ sucursal_id: '1', producto_id: '', valor: '5000', periodo: '2026-09' });
  const [msg, setMsg] = useState('');
  const [data, setData] = useState<{ name: string; real: number; meta: number }[]>([
    { name: 'Ene', real: 4000, meta: 3000 },
    { name: 'Feb', real: 3000, meta: 4500 },
  ]);

  const save = async () => {
    try {
      await api.createMeta(parseInt(meta.sucursal_id), parseFloat(meta.valor), meta.periodo,
        meta.producto_id ? parseInt(meta.producto_id) : undefined);
      setMsg('Meta guardada');
    } catch (e: any) { setMsg(e.message); }
  };

  const loadReal = async () => {
    try {
      const r = await api.reporteMetas(parseInt(meta.sucursal_id), meta.periodo);
      const rows = r.ventas_reales.map((v, i) => ({
        name: `P${i + 1}`, real: v, meta: r.metas[i] ?? 0,
      }));
      setData(rows.length ? rows : [{ name: 'Sin datos', real: 0, meta: 0 }]);
      setMsg(`Desviación: [${(r.desviacion || []).join(', ')}] (resta v_real - v_meta)`);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Metas (RF-07, RF-14)</h1>
        <p className="text-gray-500">Desviación mediante resta de vectores con datos persistidos</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border h-fit">
          <h3 className="text-lg font-bold mb-4">Definir / Consultar</h3>
          <div className="flex flex-col gap-1">
            <InputField label="ID Sucursal" type="number" value={meta.sucursal_id} onChange={(e) => setMeta({ ...meta, sucursal_id: e.target.value })} />
            <InputField label="ID Producto (opcional)" type="number" value={meta.producto_id} onChange={(e) => setMeta({ ...meta, producto_id: e.target.value })} />
            <InputField label="Valor Meta" type="number" value={meta.valor} onChange={(e) => setMeta({ ...meta, valor: e.target.value })} />
            <InputField label="Periodo (2026-09)" value={meta.periodo} onChange={(e) => setMeta({ ...meta, periodo: e.target.value })} />
            <div className="flex gap-2 mt-2">
              <Button onClick={save}>Guardar</Button>
              <Button variant="secondary" onClick={loadReal}>Ver real</Button>
            </div>
            {msg && <p className="text-xs mt-2 text-slate-600">{msg}</p>}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4">Real vs Meta (CA-10: datos persistidos)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="real" fill="#3b82f6" name="Ventas Reales" />
                <Bar dataKey="meta" fill="#94a3b8" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;
