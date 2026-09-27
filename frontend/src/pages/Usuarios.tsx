import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';

export default function Usuarios() {
  const [items, setItems] = useState<any[]>([]);
  const [f, setF] = useState({ username: '', password: '', rol: 'analista', empresa_id: '1' });
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [msg, setMsg] = useState('');

  const load = async () => {
    try { setItems(await api.listUsers()); setMsg(''); } catch (e: any) { setMsg(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.createUser(f.username, f.password, f.rol, parseInt(f.empresa_id));
      setMsg('Usuario creado ✓'); load();
    } catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      await api.updateUser(editId, { rol: draft.rol, empresa_id: draft.empresa_id });
      setMsg('Actualizado ✓'); setEditId(null); load();
    } catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar usuario?')) return;
    try { await api.deleteUser(id); setMsg('Eliminado ✓'); load(); }
    catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  return (
    <div className="p-2 flex flex-col gap-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-text">Usuarios y Roles (RF-02) — CRUD</h1>
      <div className="bg-white p-4 rounded shadow flex gap-2 items-end flex-wrap">
        <InputField label="Username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <InputField label="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <InputField label="Rol" value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value })} />
        <InputField label="Empresa ID" value={f.empresa_id} onChange={(e) => setF({ ...f, empresa_id: e.target.value })} />
        <Button onClick={create}>Crear (admin)</Button>
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted border-b"><th className="py-1">ID</th><th>Username</th><th>Rol</th><th>Empresa</th><th /></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-1">{u.id}</td>
                <td>{u.username}</td>
                <td>{editId === u.id
                  ? <CellInput value={draft.rol} onChange={(x) => setDraft({ ...draft, rol: x })} />
                  : u.rol}</td>
                <td>{editId === u.id
                  ? <CellInput type="number" value={String(draft.empresa_id ?? '')} onChange={(x) => setDraft({ ...draft, empresa_id: parseInt(x) || 0 })} />
                  : u.empresa_id}</td>
                <td><RowActions editing={editId === u.id} onEdit={() => { setEditId(u.id); setDraft({ ...u }); }}
                  onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(u.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-muted text-sm">Sin usuarios o sin permiso.</p>}
      </div>
    </div>
  );
}
