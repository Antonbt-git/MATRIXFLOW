import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';

export default function Vectores() {
  const [items, setItems] = useState<any[]>([]);
  const [nombre, setNombre] = useState('ventas-lima');
  const [valores, setValores] = useState('120,85,200');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState('');

  const load = async () => {
    try { setItems(await api.listVectors()); setError(''); } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      const arr = valores.split(',').map((x) => parseFloat(x.trim())).filter((x) => !isNaN(x));
      await api.createVector(nombre, arr, 'Vector empresarial');
      load();
    } catch (e: any) { setError(e.message); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      const arr = String(draft.valores).split(',').map((x: string) => parseFloat(x.trim())).filter((x: number) => !isNaN(x));
      await api.updateVector(editId, { nombre: draft.nombre_vector, valores: arr, descripcion: draft.descripcion });
      setEditId(null);
      load();
    } catch (e: any) { setError(e.response?.data?.detail || e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar vector?')) return;
    try { await api.deleteVector(id); load(); }
    catch (e: any) { setError(e.response?.data?.detail || e.message); }
  };

  return (
    <div className="p-2 flex flex-col gap-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-text">Vectores (RF-08) — CRUD</h1>
      <div className="bg-white p-4 rounded shadow flex gap-2 items-end flex-wrap">
        <InputField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <InputField label="Valores (coma)" value={valores} onChange={(e) => setValores(e.target.value)} />
        <Button onClick={create}>Crear vector</Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Vectores registrados</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted border-b"><th className="py-1">ID</th><th>Nombre</th><th>Valores</th><th /></tr></thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="py-1">{v.id}</td>
                <td>{editId === v.id
                  ? <CellInput value={draft.nombre_vector} onChange={(x) => setDraft({ ...draft, nombre_vector: x })} />
                  : v.nombre_vector}</td>
                <td>{editId === v.id
                  ? <CellInput value={(draft.valores || []).join(',')} onChange={(x) => setDraft({ ...draft, valores: x })} />
                  : `[${(v.valores || []).join(', ')}]`}</td>
                <td><RowActions editing={editId === v.id} onEdit={() => { setEditId(v.id); setDraft({ ...v }); }}
                  onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(v.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-muted text-sm">Sin vectores. Crea el primero.</p>}
      </div>
    </div>
  );
}
