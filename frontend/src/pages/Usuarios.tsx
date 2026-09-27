import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InputField, Button, PageHeader, Card, Msg, EmptyState, Badge, Avatar } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { Users, UserPlus, ShieldCheck, CircleAlert } from 'lucide-react';

const TONO: Record<string, 'info' | 'accent' | 'neutral'> = {
  admin: 'info', analista: 'accent', consulta: 'neutral',
};

export default function Usuarios() {
  const [items, setItems] = useState<any[]>([]);
  const [f, setF] = useState({ username: '', password: '', rol: 'analista', empresa_id: '1' });
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);

  const load = async () => {
    try { setItems(await api.listUsers()); setErr(false); } catch (e: any) { setMsg(e.message); setErr(true); }
  };
  useEffect(() => { load(); }, []);

  const flash = (t: string, isErr = false) => { setMsg(t); setErr(isErr); };

  const create = async () => {
    try {
      await api.createUser(f.username, f.password, f.rol, parseInt(f.empresa_id));
      flash('Usuario creado ✓'); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const save = async () => {
    if (editId == null) return;
    try {
      await api.updateUser(editId, { rol: draft.rol, empresa_id: draft.empresa_id });
      flash('Actualizado ✓'); setEditId(null); load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar usuario?')) return;
    try { await api.deleteUser(id); flash('Eliminado ✓'); load(); }
    catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  return (
    <div>
      <PageHeader
        title="Usuarios y Roles"
        description="Gestión de cuentas, roles y permisos RBAC (RF-02) · Fase 6"
        icon={Users}
        badge={<Badge tone="neutral">{items.length} usuarios</Badge>}
        actions={<Badge tone="info"><ShieldCheck size={12} /> RBAC activo</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Nuevo usuario" subtitle="Requiere permisos de administrador" icon={UserPlus} className="h-fit">
          <InputField label="Username" value={f.username} autoComplete="off"
            onChange={(e) => setF({ ...f, username: e.target.value })} />
          <InputField label="Password" type="password" value={f.password} autoComplete="new-password"
            onChange={(e) => setF({ ...f, password: e.target.value })} />
          <div className="grid grid-cols-2 gap-x-3">
            <InputField label="Rol" value={f.rol}
              onChange={(e) => setF({ ...f, rol: e.target.value })} />
            <InputField label="Empresa ID" type="number" value={f.empresa_id}
              onChange={(e) => setF({ ...f, empresa_id: e.target.value })} />
          </div>
          <Button onClick={create} className="w-full">Crear usuario</Button>
          {msg && <div className="mt-4"><Msg type={err ? 'err' : 'ok'}>{msg}</Msg></div>}
          <p className="text-xs text-muted mt-4 leading-relaxed">
            Roles: <b>admin</b> (todo), <b>analista</b> (ventas/inventario/operaciones), <b>consulta</b> (dashboard/reportes).
          </p>
        </Card>

        <Card
          title="Directorio de usuarios"
          subtitle="Edita rol y empresa en línea"
          icon={Users}
          padded={false}
          className="lg:col-span-2 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Empresa</th><th className="text-right">Acciones</th></tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-xs text-muted">#{u.id}</td>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.username} size={28} />
                        <span className="font-medium text-text">{u.username}</span>
                      </span>
                    </td>
                    <td>{editId === u.id
                      ? <CellInput value={draft.rol} onChange={(x) => setDraft({ ...draft, rol: x })} />
                      : <Badge tone={TONO[u.rol] ?? 'neutral'}>{u.rol}</Badge>}</td>
                    <td>{editId === u.id
                      ? <CellInput type="number" value={String(draft.empresa_id ?? '')} onChange={(x) => setDraft({ ...draft, empresa_id: parseInt(x) || 0 })} />
                      : <span className="font-mono text-xs">#{u.empresa_id}</span>}</td>
                    <td className="text-right">
                      <RowActions editing={editId === u.id} onEdit={() => { setEditId(u.id); setDraft({ ...u }); }}
                        onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(u.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <EmptyState icon={CircleAlert} title="Sin usuarios visibles"
              description="Inicia sesión con un rol administrador para ver el directorio." />
          )}
        </Card>
      </div>
    </div>
  );
}
