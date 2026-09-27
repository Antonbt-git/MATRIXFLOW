import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';

export default function Inventario() {
  const [items, setItems] = useState<any[]>([]);
  const [suc, setSuc] = useState('1');
  const [prod, setProd] = useState('1');
  const [cant, setCant] = useState('50');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState('');

  const load = async () => {
    try { setItems(await api.inventory()); setError(''); } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const adjust = async () => {
    try { await api.adjustInventory(parseInt(suc), parseInt(prod), parseFloat(cant)); load(); }
    catch (e: any) { setError(e.response?.data?.detail || e.message); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      await api.updateInventario(editId, {
        stock_actual: parseFloat(draft.stock_actual) || 0,
        stock_minimo: parseFloat(draft.stock_minimo) || 0,
      });
      setEditId(null); load();
    } catch (e: any) { setError(e.response?.data?.detail || e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar registro de inventario?')) return;
    try { await api.deleteInventario(id); load(); }
    catch (e: any) { setError(e.response?.data?.detail || e.message); }
  };

  return (
    <div className="p-2 flex flex-col gap-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-text">Inventario (RF-06) — CRUD</h1>
      <div className="bg-white p-4 rounded shadow flex gap-2 items-end flex-wrap">
        <InputField label="Sucursal ID" value={suc} onChange={(e) => setSuc(e.target.value)} />
        <InputField label="Producto ID" value={prod} onChange={(e) => setProd(e.target.value)} />
        <InputField label="Cantidad (+/-)" value={cant} onChange={(e) => setCant(e.target.value)} />
        <Button onClick={adjust}>Ajustar stock</Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Existencias</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted border-b"><th className="py-1">ID</th><th>Suc</th><th>Prod</th><th>Stock</th><th>Mín</th><th /></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-1">{i.id}</td>
                <td>{i.sucursal_id}</td>
                <td>{i.producto_id}</td>
                <td className={i.stock_actual < i.stock_minimo ? 'text-red-600 font-semibold' : ''}>
                  {editId === i.id
                    ? <CellInput type="number" value={String(draft.stock_actual ?? '')} onChange={(x) => setDraft({ ...draft, stock_actual: x })} />
                    : i.stock_actual}
                </td>
                <td>{editId === i.id
                  ? <CellInput type="number" value={String(draft.stock_minimo ?? '')} onChange={(x) => setDraft({ ...draft, stock_minimo: x })} />
                  : i.stock_minimo}</td>
                <td><RowActions editing={editId === i.id} onEdit={() => { setEditId(i.id); setDraft({ ...i }); }}
                  onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(i.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-muted text-sm">Sin stock. Ajusta para crear.</p>}
      </div>
    </div>
  );
}
