import React, { useEffect, useState } from 'react';
import { InputField, Button } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { api } from '../services/api';

const Sales: React.FC = () => {
  const [sale, setSale] = useState({ sucursal_id: '1', producto_id: '1', cantidad: '1' });
  const [items, setItems] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [msg, setMsg] = useState('');

  const load = async () => {
    try { setItems(await api.listVentas()); } catch (e: any) { setMsg(e.message); }
  };
  useEffect(() => { load(); }, []);

  const handleRegister = async () => {
    try {
      await api.registerVenta(parseInt(sale.sucursal_id), parseInt(sale.producto_id), parseFloat(sale.cantidad));
      setMsg('Venta registrada y stock actualizado ✓');
      load();
    } catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      await api.updateVenta(editId, {
        sucursal_id: draft.sucursal_id, producto_id: draft.producto_id,
        cantidad: parseFloat(draft.cantidad) || 1, usuario_id: 0,
      });
      setMsg('Venta actualizada ✓'); setEditId(null); load();
    } catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar venta?')) return;
    try { await api.deleteVenta(id); setMsg('Venta eliminada ✓'); load(); }
    catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text">Registro de Ventas</h1>
        <p className="text-muted">CRUD de transacciones con validación de stock</p>
      </header>

      <div className="bg-white p-8 rounded-xl shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="ID Sucursal" type="number" value={sale.sucursal_id}
            onChange={(e) => setSale({ ...sale, sucursal_id: e.target.value })} />
          <InputField label="ID Producto" type="number" value={sale.producto_id}
            onChange={(e) => setSale({ ...sale, producto_id: e.target.value })} />
          <InputField label="Cantidad" type="number" value={sale.cantidad}
            onChange={(e) => setSale({ ...sale, cantidad: e.target.value })} />
        </div>
        <Button onClick={handleRegister}>Procesar Venta</Button>
        {msg && <p className="text-sm mt-4 text-slate-600">{msg}</p>}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-bold mb-3">Ventas registradas</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted border-b">
            <th className="py-1">ID</th><th>Suc</th><th>Prod</th><th>Cant</th><th>Monto</th><th />
          </tr></thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="py-1">{v.id}</td>
                <td>{editId === v.id ? <CellInput type="number" value={String(draft.sucursal_id)} onChange={(x) => setDraft({ ...draft, sucursal_id: parseInt(x) || 1 })} /> : v.sucursal_id}</td>
                <td>{editId === v.id ? <CellInput type="number" value={String(draft.producto_id)} onChange={(x) => setDraft({ ...draft, producto_id: parseInt(x) || 1 })} /> : v.producto_id}</td>
                <td>{editId === v.id ? <CellInput type="number" value={String(draft.cantidad)} onChange={(x) => setDraft({ ...draft, cantidad: x })} /> : v.cantidad}</td>
                <td>${v.monto_total}</td>
                <td><RowActions editing={editId === v.id} onEdit={() => { setEditId(v.id); setDraft({ ...v }); }}
                  onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(v.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-muted text-sm">Sin ventas.</p>}
      </div>
    </div>
  );
};

export default Sales;
