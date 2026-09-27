import React, { useState } from 'react';
import { InputField, Button, PageHeader, Card, Msg, Badge } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, Save, ChartColumnIncreasing } from 'lucide-react';
import { api } from '../services/api';

const Goals: React.FC = () => {
  const [meta, setMeta] = useState({ sucursal_id: '1', producto_id: '', valor: '5000', periodo: '2026-09' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [data, setData] = useState<{ name: string; real: number; meta: number }[]>([
    { name: 'Ene', real: 4000, meta: 3000 },
    { name: 'Feb', real: 3000, meta: 4500 },
  ]);

  const flash = (t: string, isErr = false) => { setMsg(t); setErr(isErr); };

  const save = async () => {
    try {
      await api.createMeta(parseInt(meta.sucursal_id), parseFloat(meta.valor), meta.periodo,
        meta.producto_id ? parseInt(meta.producto_id) : undefined);
      flash('Meta guardada ✓');
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const loadReal = async () => {
    try {
      const r = await api.reporteMetas(parseInt(meta.sucursal_id), meta.periodo);
      const rows = r.ventas_reales.map((v, i) => ({
        name: `P${i + 1}`, real: v, meta: r.metas[i] ?? 0,
      }));
      setData(rows.length ? rows : [{ name: 'Sin datos', real: 0, meta: 0 }]);
      flash(`Desviación (v_real − v_meta): [${(r.desviacion || []).join(', ')}]`);
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  return (
    <div>
      <PageHeader
        title="Reportes y Metas"
        description="Desviación mediante resta de vectores con datos persistidos (RF-07, RF-14)"
        icon={Target}
        badge={<Badge tone="accent">CA-10</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Definir / consultar" subtitle="Parámetros de la meta" icon={Save} className="h-fit">
          <div className="grid grid-cols-2 gap-x-3">
            <InputField label="ID Sucursal" type="number" value={meta.sucursal_id}
              onChange={(e) => setMeta({ ...meta, sucursal_id: e.target.value })} />
            <InputField label="ID Producto (opc.)" type="number" value={meta.producto_id}
              onChange={(e) => setMeta({ ...meta, producto_id: e.target.value })} />
          </div>
          <InputField label="Valor Meta" type="number" value={meta.valor}
            onChange={(e) => setMeta({ ...meta, valor: e.target.value })} />
          <InputField label="Periodo (2026-09)" value={meta.periodo}
            onChange={(e) => setMeta({ ...meta, periodo: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1">Guardar</Button>
            <Button variant="secondary" onClick={loadReal} className="flex-1">Ver real</Button>
          </div>
          {msg && <div className="mt-4"><Msg type={err ? 'err' : 'ok'}>{msg}</Msg></div>}
        </Card>

        <Card
          title="Real vs Meta"
          subtitle="Comparativa con datos persistidos (CA-10)"
          icon={ChartColumnIncreasing}
          className="lg:col-span-2"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#2563EB0D' }} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="real" fill="#2563EB" name="Ventas reales" radius={[6, 6, 0, 0]} maxBarSize={56} />
                <Bar dataKey="meta" fill="#94a3b8" name="Meta" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Goals;
