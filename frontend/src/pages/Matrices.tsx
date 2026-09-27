import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';

export default function Matrices() {
  const [items, setItems] = useState<any[]>([]);
  const [nombre, setNombre] = useState('ventas-sucursales');
  const [valores, setValores] = useState('[[120,50],[85,40]]');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState('');

  const load = async () => {
    try { setItems(await api.listMatrices()); setError(''); } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      const m = JSON.parse(valores);
      await api.createMatriz(nombre, m, `${m.length}x${m[0].length}`);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      const m = JSON.parse(draft.valores);
      await api.updateMatriz(editId, { nombre: draft.nombre_matriz, valores: m });
      setEditId(null);
      load();
    } catch (e: any) { setError(e.response?.data?.detail || e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar matriz?')) return;
    try { await api.deleteMatriz(id); load(); }
    catch (e: any) { setError(e.response?.data?.detail || e.message); }
  };

  return (
    <div className="p-2 flex flex-col gap-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-text">Matrices (RF-09) — CRUD</h1>
      <div className="bg-white p-4 rounded shadow flex gap-2 items-end flex-wrap">
        <InputField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <InputField label="Valores JSON" value={valores} onChange={(e) => setValores(e.target.value)} />
        <Button onClick={create}>Crear matriz</Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Matrices registradas</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted border-b"><th className="py-1">ID</th><th>Nombre</th><th>Dim</th><th>Valores</th><th /></tr></thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-1">{m.id}</td>
                <td>{editId === m.id
                  ? <CellInput value={draft.nombre_matriz} onChange={(x) => setDraft({ ...draft, nombre_matriz: x })} />
                  : m.nombre_matriz}</td>
                <td>{m.dimensiones}</td>
                <td>{editId === m.id
                  ? <CellInput value={JSON.stringify(draft.valores)} onChange={(x) => setDraft({ ...draft, valores: x })} />
                  : JSON.stringify(m.valores)}</td>
                <td><RowActions editing={editId === m.id} onEdit={() => { setEditId(m.id); setDraft({ ...m }); }}
                  onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(m.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-muted text-sm">Sin matrices.</p>}
      </div>
    </div>
  );
}
