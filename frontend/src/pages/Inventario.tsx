import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button, PageHeader, Card, Msg, EmptyState, Badge } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { Boxes, PackagePlus, TriangleAlert, CircleAlert } from 'lucide-react';

export default function Inventario() {
  const [items, setItems] = useState<any[]>([]);
  const [suc, setSuc] = useState('1');
  const [prod, setProd] = useState('1');
  const [cant, setCant] = useState('50');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const load = async () => {
    try { setItems(await api.inventory()); setError(''); setOk(true); } catch (e: any) { setError(e.message); setOk(false); }
  };
  useEffect(() => { load(); }, []);

  const flash = (t: string, isErr = false) => { setError(t); setOk(!isErr); };

  const adjust = async () => {
    try { await api.adjustInventory(parseInt(suc), parseInt(prod), parseFloat(cant)); flash('Stock ajustado ✓'); load(); }
    catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      await api.updateInventario(editId, {
        stock_actual: parseFloat(draft.stock_actual) || 0,
        stock_minimo: parseFloat(draft.stock_minimo) || 0,
      });
      flash('Actualizado ✓'); setEditId(null); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar registro de inventario?')) return;
    try { await api.deleteInventario(id); flash('Eliminado ✓'); load(); }
    catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const bajoMin = items.filter((i) => i.stock_actual < i.stock_minimo).length;
  const stockTotal = items.reduce((s, i) => s + (i.stock_actual ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Control de existencias por sucursal con mínimos y ajustes (RF-06)"
        icon={Boxes}
        badge={bajoMin
          ? <Badge tone="danger"><TriangleAlert size={12} /> {bajoMin} bajo mínimo</Badge>
          : <Badge tone="ok">Sin alertas</Badge>}
        actions={<Badge tone="neutral">Stock total {stockTotal}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Ajustar stock" subtitle="Suma o resta cantidad (+/-)" icon={PackagePlus} className="h-fit">
          <div className="grid grid-cols-2 gap-x-3">
            <InputField label="Sucursal ID" type="number" value={suc} onChange={(e) => setSuc(e.target.value)} />
            <InputField label="Producto ID" type="number" value={prod} onChange={(e) => setProd(e.target.value)} />
          </div>
          <InputField label="Cantidad (+/-)" type="number" value={cant} onChange={(e) => setCant(e.target.value)} />
          <Button onClick={adjust} className="w-full">Ajustar stock</Button>
          {error && <div className="mt-4"><Msg type={ok ? 'ok' : 'err'}>{error}</Msg></div>}
        </Card>

        <Card title="Existencias" subtitle="Edita stock actual y mínimo en línea" icon={Boxes}
          padded={false} className="lg:col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Suc</th><th>Prod</th><th>Stock</th><th>Mín</th><th className="text-right">Acciones</th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono text-xs text-muted">#{i.id}</td>
                    <td className="font-mono text-xs">#{i.sucursal_id}</td>
                    <td className="font-mono text-xs">#{i.producto_id}</td>
                    <td className={i.stock_actual < i.stock_minimo ? 'text-red-600 font-bold' : 'font-semibold text-text'}>
                      {editId === i.id
                        ? <CellInput type="number" value={String(draft.stock_actual ?? '')} onChange={(x) => setDraft({ ...draft, stock_actual: x })} />
                        : (
                          <span className="flex items-center gap-2">
                            {i.stock_actual}
                            {i.stock_actual < i.stock_minimo && <Badge tone="danger">mín</Badge>}
                          </span>
                        )}
                    </td>
                    <td>{editId === i.id
                      ? <CellInput type="number" value={String(draft.stock_minimo ?? '')} onChange={(x) => setDraft({ ...draft, stock_minimo: x })} />
                      : i.stock_minimo}</td>
                    <td className="text-right">
                      <RowActions editing={editId === i.id} onEdit={() => { setEditId(i.id); setDraft({ ...i }); }}
                        onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(i.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <EmptyState icon={CircleAlert} title="Sin stock registrado"
              description="Usa el ajuste de stock para crear el primer registro." />
          )}
        </Card>
      </div>
    </div>
  );
}
