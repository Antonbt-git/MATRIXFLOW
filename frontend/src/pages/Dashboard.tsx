import React, { useState, useEffect } from 'react';
import { StatCard, MathPanel } from '../components/AnalysisComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';

/** §14 Fase 7: ventas por sucursal, por producto, metas, inventario,
 *  resultados matemáticos, actividad reciente, indicadores y exportación. */

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

function download(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

const Dashboard: React.FC = () => {
  const [sucursalId, setSucursalId] = useState(1);
  const [ingresos, setIngresos] = useState<any>(null);
  const { data: ventas } = useFetch(() => api.listVentas());
  const { data: inventario } = useFetch(() => api.inventory());
  const { data: historial } = useFetch(() => api.history());
  const { data: actividad } = useFetch(() => api.audit());
  const { data: metas } = useFetch(() => api.reporteMetas(sucursalId, '2026-09').catch(() => null as any), [sucursalId]);

  const fetchAnalysis = async () => {
    try { setIngresos(await api.reporteIngresos(sucursalId)); } catch { setIngresos(null); }
  };
  useEffect(() => { fetchAnalysis(); }, [sucursalId]);

  // §14: ventas por sucursal / por producto (agregaciones reales)
  const porSucursal = Object.values(
    (ventas ?? []).reduce((acc: any, v: any) => {
      acc[v.sucursal_id] = acc[v.sucursal_id] || { name: `Suc ${v.sucursal_id}`, val: 0 };
      acc[v.sucursal_id].val += v.monto_total ?? 0;
      return acc;
    }, {})
  );
  const porProducto = Object.values(
    (ventas ?? []).reduce((acc: any, v: any) => {
      acc[v.producto_id] = acc[v.producto_id] || { name: `Prod ${v.producto_id}`, val: 0 };
      acc[v.producto_id].val += v.monto_total ?? 0;
      return acc;
    }, {})
  );
  // §14: inventario y rotación
  const stockTotal = (inventario ?? []).reduce((s: number, i: any) => s + (i.stock_actual ?? 0), 0);
  const bajoMinimo = (inventario ?? []).filter((i: any) => i.stock_actual < i.stock_minimo).length;
  // §14: indicadores de procesamiento
  const opsOk = (historial ?? []).filter((h: any) => (h.estado ?? 'OK') === 'OK').length;

  const mathData = ingresos && {
    operacion: 'Producto Punto (Dot Product)',
    input_a: ingresos.cantidades ?? [],
    input_b: ingresos.precios ?? [],
    resultado: ingresos.ingresos_totales,
  };

  return (
    <div className="p-8 bg-app min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">MatrixFlow Enterprise</h1>
          <p className="text-muted">Análisis de Ventas mediante Álgebra Lineal</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="number" value={sucursalId} onChange={(e) => setSucursalId(parseInt(e.target.value) || 1)}
            className="border p-2 rounded-md w-24" />
          <button onClick={fetchAnalysis} className="bg-primary text-white px-4 py-2 rounded-md">Actualizar</button>
          <button onClick={() => download('ventas.csv', (ventas ?? []) as any[])}
            className="bg-accent text-white px-4 py-2 rounded-md">Exportar CSV</button>
        </div>
      </header>

      {/* §14: indicadores ejecutivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Ingresos Totales" value={`$${ingresos?.ingresos_totales ?? 0}`} description="Producto Punto cantidades·precios" color="text-primary" />
        <StatCard title="Inventario Total" value={stockTotal} description={`${bajoMinimo} ítems bajo mínimo`} color="text-green-600" />
        <StatCard title="Operaciones OK" value={`${opsOk}/${historial?.length ?? 0}`} description="Indicador de procesamiento" color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Ventas por sucursal */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-bold mb-4">Ventas por Sucursal</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porSucursal.length ? porSucursal : [{ name: 'Sin datos', val: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="val" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Ventas por producto */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-bold mb-4">Ventas por Producto</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porProducto.length ? porProducto : [{ name: 'Sin datos', val: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="val" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Cumplimiento de metas */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-bold mb-4">Cumplimiento de Metas</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metas?.ventas_reales?.map((v: number, i: number) => ({
                name: `#${i + 1}`, real: v, meta: metas?.metas?.[i] ?? 0,
              })) ?? [{ name: 'Sin datos', real: 0, meta: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="real" stroke="#2563EB" name="Real" />
                <Line type="monotone" dataKey="meta" stroke="#94a3b8" name="Meta" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Trazabilidad matemática */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-bold mb-4">Trazabilidad Matemática</h3>
          {mathData ? <MathPanel data={mathData} /> : <p className="text-muted text-sm">Cargando…</p>}
        </div>
        {/* Actividad reciente */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-bold mb-4">Actividad Reciente</h3>
          <div className="text-sm space-y-1 max-h-56 overflow-y-auto">
            {(actividad ?? []).slice(0, 8).map((a: any) => (
              <div key={a.id} className="border-b pb-1">#{a.id} {a.accion} <span className="text-muted">{a.modulo} · {a.estado} {a.ip ? `· ${a.ip}` : ''}</span></div>
            ))}
            {!actividad?.length && <p className="text-muted">Sin eventos.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
