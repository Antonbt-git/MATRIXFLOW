import React, { useEffect, useState } from 'react';
import { InputField, Button, PageHeader, Card, Msg, EmptyState, Badge } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { ShoppingCart, Receipt, CircleAlert } from 'lucide-react';
import { api } from '../services/api';

const Sales: React.FC = () => {
  const [sale, setSale] = useState({ sucursal_id: '1', producto_id: '1', cantidad: '1' });
  const [items, setItems] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);

  const load = async () => {
    try { setItems(await api.listVentas()); setErr(false); } catch (e: any) { setMsg(e.message); setErr(true); }
  };
  useEffect(() => { load(); }, []);

  const flash = (t: string, isErr = false) => { setMsg(t); setErr(isErr); };

  const handleRegister = async () => {
    try {
      await api.registerVenta(parseInt(sale.sucursal_id), parseInt(sale.producto_id), parseFloat(sale.cantidad));
      flash('Venta registrada y stock actualizado ✓');
      load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      await api.updateVenta(editId, {
        sucursal_id: draft.sucursal_id, producto_id: draft.producto_id,
        cantidad: parseFloat(draft.cantidad) || 1, usuario_id: 0,
      });
      flash('Venta actualizada ✓'); setEditId(null); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar venta?')) return;
    try { await api.deleteVenta(id); flash('Venta eliminada ✓'); load(); }
    catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const total = items.reduce((s, v) => s + (v.monto_total ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Registro de Ventas"
        description="CRUD de transacciones con validación de stock y descuento automático (RF-05)"
        icon={ShoppingCart}
        badge={<Badge tone="neutral">{items.length} registros</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Nueva venta */}
        <Card title="Nueva venta" subtitle="Procesa el producto punto cantidad · precio" icon={Receipt} className="lg:col-span-1 h-fit">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-x-4">
            <InputField label="ID Sucursal" type="number" value={sale.sucursal_id}
              onChange={(e) => setSale({ ...sale, sucursal_id: e.target.value })} />
            <InputField label="ID Producto" type="number" value={sale.producto_id}
              onChange={(e) => setSale({ ...sale, producto_id: e.target.value })} />
            <InputField label="Cantidad" type="number" value={sale.cantidad}
              onChange={(e) => setSale({ ...sale, cantidad: e.target.value })} />
          </div>
          <Button onClick={handleRegister} className="w-full">Procesar venta</Button>
          {msg && <div className="mt-4"><Msg type={err ? 'err' : 'ok'}>{msg}</Msg></div>}
        </Card>

        {/* Listado */}
        <Card
          title="Ventas registradas"
          subtitle="Edita o elimina cada transacción"
          icon={ShoppingCart}
          padded={false}
          className="lg:col-span-2 overflow-hidden"
          actions={<Badge tone="ok">Total ${total.toLocaleString()}</Badge>}
        >
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Sucursal</th><th>Producto</th><th>Cantidad</th><th>Monto</th><th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id}>
                    <td className="font-mono text-xs text-muted">#{v.id}</td>
                    <td>{editId === v.id ? <CellInput type="number" value={String(draft.sucursal_id)} onChange={(x) => setDraft({ ...draft, sucursal_id: parseInt(x) || 1 })} /> : v.sucursal_id}</td>
                    <td>{editId === v.id ? <CellInput type="number" value={String(draft.producto_id)} onChange={(x) => setDraft({ ...draft, producto_id: parseInt(x) || 1 })} /> : v.producto_id}</td>
                    <td>{editId === v.id ? <CellInput type="number" value={String(draft.cantidad)} onChange={(x) => setDraft({ ...draft, cantidad: x })} /> : v.cantidad}</td>
                    <td className="font-semibold text-text">${v.monto_total}</td>
                    <td className="text-right">
                      <RowActions editing={editId === v.id} onEdit={() => { setEditId(v.id); setDraft({ ...v }); }}
                        onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(v.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <EmptyState icon={CircleAlert} title="Sin ventas registradas"
              description="Procesa la primera venta desde el formulario de la izquierda." />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Sales;
