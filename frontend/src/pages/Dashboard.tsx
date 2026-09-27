import React, { useState, useEffect } from 'react';
import { StatCard, MathPanel } from '../components/AnalysisComponents';
import { PageHeader, Card, Button, Badge, EmptyState } from '../components/UI';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import {
  DollarSign, Boxes, Activity, TrendingUp, Store, Package, Target,
  Download, RefreshCw, Clock, CircleAlert,
} from 'lucide-react';
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

const TITULO: Record<string, string> = {
  CREATE: 'Creación', UPDATE: 'Actualización', DELETE: 'Eliminación',
  LOGIN: 'Inicio de sesión', LOGOUT: 'Cierre de sesión', VIEW: 'Consulta',
};

const Dashboard: React.FC = () => {
  const [sucursalId, setSucursalId] = useState(1);
  const [ingresos, setIngresos] = useState<any>(null);
  const [exportando, setExportando] = useState(false);
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
  const montoVentas = (ventas ?? []).reduce((s: number, v: any) => s + (v.monto_total ?? 0), 0);

  const mathData = ingresos && {
    operacion: 'Producto Punto (Dot Product)',
    input_a: ingresos.cantidades ?? [],
    input_b: ingresos.precios ?? [],
    resultado: ingresos.ingresos_totales,
  };

  const exportar = () => {
    setExportando(true);
    download('ventas.csv', (ventas ?? []) as any[]);
    setTimeout(() => setExportando(false), 600);
  };

  return (
    <div>
      <PageHeader
        title="MatrixFlow Enterprise"
        description="Panel ejecutivo de análisis de ventas mediante álgebra lineal · indicadores en tiempo real"
        icon={TrendingUp}
        badge={<Badge tone="accent">Fase 7</Badge>}
        actions={
          <>
            <label className="field !mb-0">
              <span className="field-label">Sucursal</span>
              <input
                type="number"
                value={sucursalId}
                onChange={(e) => setSucursalId(parseInt(e.target.value) || 1)}
                className="input !w-24"
              />
            </label>
            <Button variant="secondary" onClick={fetchAnalysis} className="self-end">
              <RefreshCw size={15} /> Actualizar
            </Button>
            <Button variant="dark" onClick={exportar} className="self-end" disabled={exportando}>
              <Download size={15} /> {exportando ? 'Exportando…' : 'Exportar CSV'}
            </Button>
          </>
        }
      />

      {/* §14: indicadores ejecutivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="Ingresos totales"
          value={`$${(ingresos?.ingresos_totales ?? 0).toLocaleString()}`}
          description="Producto punto (cantidades · precios)"
          icon={DollarSign}
          tone="blue"
          footer={`Sucursal #${sucursalId}`}
        />
        <StatCard
          title="Ventas registradas"
          value={ventas?.length ?? 0}
          description={`Monto acumulado $${montoVentas.toLocaleString()}`}
          icon={Store}
          tone="violet"
          footer="Transacciones con stock descontado"
        />
        <StatCard
          title="Inventario total"
          value={stockTotal}
          description={`${bajoMinimo} ítems bajo el mínimo`}
          icon={Boxes}
          tone="emerald"
          footer={bajoMinimo ? 'Requiere reposición' : 'Niveles saludables'}
        />
        <StatCard
          title="Operaciones OK"
          value={`${opsOk}/${historial?.length ?? 0}`}
          description="Indicador de procesamiento"
          icon={Activity}
          tone="cyan"
          footer="Pipeline matemático"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Ventas por sucursal */}
        <Card title="Ventas por sucursal" subtitle="Ingresos agregados por centro de operación" icon={Store}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porSucursal.length ? porSucursal : [{ name: 'Sin datos', val: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#2563EB0D' }} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="val" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ventas por producto */}
        <Card title="Ventas por producto" subtitle="Distribución de ingresos por SKU" icon={Package}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porProducto.length ? porProducto : [{ name: 'Sin datos', val: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#06B6D40D' }} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="val" fill="#06B6D4" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cumplimiento de metas */}
        <Card title="Cumplimiento de metas" subtitle={`Meta vs. real · sucursal #${sucursalId}`} icon={Target}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metas?.ventas_reales?.map((v: number, i: number) => ({
                name: `#${i + 1}`, real: v, meta: metas?.metas?.[i] ?? 0,
              })) ?? [{ name: 'Sin datos', real: 0, meta: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="real" stroke="#2563EB" strokeWidth={2.5} name="Real" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="meta" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" name="Meta" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Trazabilidad matemática */}
        <Card title="Trazabilidad matemática" subtitle="Cálculo de álgebra lineal del periodo" icon={Activity}>
          {mathData ? <MathPanel data={mathData} /> : (
            <p className="text-muted text-sm py-8 text-center">Calculando producto punto…</p>
          )}
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card
        title="Actividad reciente"
        subtitle="Últimos eventos de auditoría del sistema"
        icon={Clock}
        actions={<Badge tone="neutral">{actividad?.length ?? 0} eventos</Badge>}
      >
        <div className="space-y-1 max-h-72 overflow-y-auto -mx-1 px-1">
          {(actividad ?? []).slice(0, 10).map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className={`shrink-0 w-2 h-2 rounded-full ${
                (a.estado ?? 'OK') === 'OK' ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">
                  {TITULO[a.accion] ?? a.accion} <span className="text-muted font-normal">· {a.modulo}</span>
                </p>
                <p className="text-xs text-muted truncate">
                  {a.ip ? `IP ${a.ip}` : 'Sistema'} · {a.estado ?? 'OK'}
                </p>
              </div>
              <span className="text-[11px] text-muted font-mono shrink-0">#{a.id}</span>
            </div>
          ))}
          {!actividad?.length && (
            <EmptyState icon={CircleAlert} title="Sin eventos de auditoría" description="Las acciones que realices aparecerán aquí." />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
