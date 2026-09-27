import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button, PageHeader, Card, Msg, EmptyState, Badge } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { Move3d, Plus, CircleAlert } from 'lucide-react';

export default function Vectores() {
  const [items, setItems] = useState<any[]>([]);
  const [nombre, setNombre] = useState('ventas-lima');
  const [valores, setValores] = useState('120,85,200');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const load = async () => {
    try { setItems(await api.listVectors()); setError(''); setOk(true); } catch (e: any) { setError(e.message); setOk(false); }
  };
  useEffect(() => { load(); }, []);

  const flash = (t: string, isErr = false) => { setError(t); setOk(!isErr); };

  const create = async () => {
    try {
      const arr = valores.split(',').map((x) => parseFloat(x.trim())).filter((x) => !isNaN(x));
      await api.createVector(nombre, arr, 'Vector empresarial');
      flash('Vector creado ✓'); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      const arr = String(draft.valores).split(',').map((x: string) => parseFloat(x.trim())).filter((x: number) => !isNaN(x));
      await api.updateVector(editId, { nombre: draft.nombre_vector, valores: arr, descripcion: draft.descripcion });
      flash('Vector actualizado ✓'); setEditId(null); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar vector?')) return;
    try { await api.deleteVector(id); flash('Vector eliminado ✓'); load(); }
    catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  return (
    <div>
      <PageHeader
        title="Vectores"
        description="CRUD de vectores de negocio para operaciones de álgebra lineal (RF-08)"
        icon={Move3d}
        badge={<Badge tone="neutral">{items.length} vectores</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Nuevo vector" subtitle="Valores separados por coma" icon={Plus} className="h-fit">
          <InputField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <InputField label="Valores (coma)" value={valores} onChange={(e) => setValores(e.target.value)} />
          <Button onClick={create} className="w-full">Crear vector</Button>
          {error && <div className="mt-4"><Msg type={ok ? 'ok' : 'err'}>{error}</Msg></div>}
        </Card>

        <Card title="Vectores registrados" subtitle="Edita nombre y valores en línea" icon={Move3d}
          padded={false} className="lg:col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Nombre</th><th>Valores</th><th className="text-right">Acciones</th></tr></thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id}>
                    <td className="font-mono text-xs text-muted">#{v.id}</td>
                    <td className="font-medium text-text">{editId === v.id
                      ? <CellInput value={draft.nombre_vector} onChange={(x) => setDraft({ ...draft, nombre_vector: x })} />
                      : v.nombre_vector}</td>
                    <td className="font-mono text-xs text-slate-600">{editId === v.id
                      ? <CellInput value={(draft.valores || []).join(',')} onChange={(x) => setDraft({ ...draft, valores: x })} />
                      : `[${(v.valores || []).join(', ')}]`}</td>
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
            <EmptyState icon={CircleAlert} title="Sin vectores"
              description="Crea el primero desde el formulario." />
          )}
        </Card>
      </div>
    </div>
  );
}
