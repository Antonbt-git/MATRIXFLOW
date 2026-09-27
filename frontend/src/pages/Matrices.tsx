import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button, PageHeader, Card, Msg, EmptyState, Badge } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { Grid3x3, Plus, CircleAlert } from 'lucide-react';

export default function Matrices() {
  const [items, setItems] = useState<any[]>([]);
  const [nombre, setNombre] = useState('ventas-sucursales');
  const [valores, setValores] = useState('[[120,50],[85,40]]');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const load = async () => {
    try { setItems(await api.listMatrices()); setError(''); setOk(true); } catch (e: any) { setError(e.message); setOk(false); }
  };
  useEffect(() => { load(); }, []);

  const flash = (t: string, isErr = false) => { setError(t); setOk(!isErr); };

  const create = async () => {
    try {
      const m = JSON.parse(valores);
      await api.createMatriz(nombre, m, `${m.length}x${m[0].length}`);
      flash('Matriz creada ✓'); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      const m = JSON.parse(draft.valores);
      await api.updateMatriz(editId, { nombre: draft.nombre_matriz, valores: m });
      flash('Matriz actualizada ✓'); setEditId(null); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar matriz?')) return;
    try { await api.deleteMatriz(id); flash('Matriz eliminada ✓'); load(); }
    catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  return (
    <div>
      <PageHeader
        title="Matrices"
        description="CRUD de matrices con validación de dimensiones para álgebra lineal (RF-09)"
        icon={Grid3x3}
        badge={<Badge tone="neutral">{items.length} matrices</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Nueva matriz" subtitle="Formato JSON de filas anidadas" icon={Plus} className="h-fit">
          <InputField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <InputField label="Valores JSON" value={valores} onChange={(e) => setValores(e.target.value)} />
          <Button onClick={create} className="w-full">Crear matriz</Button>
          {error && <div className="mt-4"><Msg type={ok ? 'ok' : 'err'}>{error}</Msg></div>}
        </Card>

        <Card title="Matrices registradas" subtitle="Edita nombre y valores en línea" icon={Grid3x3}
          padded={false} className="lg:col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Nombre</th><th>Dim</th><th>Valores</th><th className="text-right">Acciones</th></tr></thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-xs text-muted">#{m.id}</td>
                    <td className="font-medium text-text">{editId === m.id
                      ? <CellInput value={draft.nombre_matriz} onChange={(x) => setDraft({ ...draft, nombre_matriz: x })} />
                      : m.nombre_matriz}</td>
                    <td><Badge tone="accent">{m.dimensiones}</Badge></td>
                    <td className="font-mono text-xs text-slate-600 max-w-[220px] truncate">{editId === m.id
                      ? <CellInput value={JSON.stringify(draft.valores)} onChange={(x) => setDraft({ ...draft, valores: x })} />
                      : JSON.stringify(m.valores)}</td>
                    <td className="text-right">
                      <RowActions editing={editId === m.id} onEdit={() => { setEditId(m.id); setDraft({ ...m }); }}
                        onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(m.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <EmptyState icon={CircleAlert} title="Sin matrices"
              description="Crea la primera desde el formulario." />
          )}
        </Card>
      </div>
    </div>
  );
}
