import React, { useEffect, useState } from 'react';
import { InputField, Button, PageHeader, Card, Msg, Badge, EmptyState } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { Building2, Store, Package, Plus, CircleAlert } from 'lucide-react';
import { api } from '../services/api';

interface ManagementProps {
  mode?: 'empresa' | 'sucursal' | 'producto';
}

const TABS = [
  { k: 'empresa', label: 'Empresas', icon: Building2 },
  { k: 'sucursal', label: 'Sucursales', icon: Store },
  { k: 'producto', label: 'Productos', icon: Package },
] as const;

const TITULO: Record<string, { titulo: string; desc: string }> = {
  empresa: { titulo: 'Gestión de Empresas', desc: 'CRUD de entidades corporativas (RF-03)' },
  sucursal: { titulo: 'Gestión de Sucursales', desc: 'CRUD de centros de operación por empresa (RF-03)' },
  producto: { titulo: 'Gestión de Productos', desc: 'CRUD del catálogo con precio base y SKU (RF-04)' },
};

const Management: React.FC<ManagementProps> = ({ mode = 'empresa' }) => {
  const [tab, setTab] = useState<'empresa' | 'sucursal' | 'producto'>(mode);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [f, setF] = useState({ nombre: '', nit: '', sector: '', empresa_id: '1', ciudad: '', codigo: '', categoria_id: '1', precio: '', sku: '' });

  const load = async () => {
    try {
      setEmpresas(await api.listEmpresas());
      setSucursales(await api.listSucursales());
      setProductos(await api.listProductos());
      setErr(false);
    } catch (e: any) { setMsg(e.message); setErr(true); }
  };
  useEffect(() => { load(); }, []);

  const flash = (t: string, isErr = false) => { setMsg(t); setErr(isErr); };

  const create = async () => {
    try {
      if (tab === 'empresa') await api.createEmpresa(f.nombre, f.nit, f.sector);
      if (tab === 'sucursal') await api.createSucursal(parseInt(f.empresa_id), f.nombre, f.ciudad, f.codigo);
      if (tab === 'producto') await api.createProducto(f.nombre, parseInt(f.categoria_id), parseFloat(f.precio), f.sku);
      flash('Registrado correctamente ✓');
      load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  // --- CRUD: guardar / eliminar ---
  const save = async () => {
    if (editId == null) return;
    try {
      if (tab === 'empresa') await api.updateEmpresa(editId, draft);
      if (tab === 'sucursal') {
        const { codigo, ...rest } = draft;
        await api.updateSucursal(editId, codigo !== undefined ? { ...rest, codigo } : rest);
      }
      if (tab === 'producto') await api.updateProducto(editId, draft);
      flash('Actualizado ✓');
      setEditId(null);
      load();
    } catch (e: any) { flash(e.message, true); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      if (tab === 'empresa') await api.deleteEmpresa(id);
      if (tab === 'sucursal') await api.deleteSucursal(id);
      if (tab === 'producto') await api.deleteProducto(id);
      flash('Eliminado ✓');
      load();
    } catch (e: any) { flash(e.response?.data?.detail || e.message, true); }
  };

  const startEdit = (row: any) => { setEditId(row.id); setDraft({ ...row }); };
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  const filas = tab === 'empresa' ? empresas : tab === 'sucursal' ? sucursales : productos;

  const table = () => {
    if (tab === 'empresa') return (
      <table className="table">
        <thead><tr><th>ID</th><th>Nombre</th><th>NIT</th><th>Sector</th><th className="text-right">Acciones</th></tr></thead>
        <tbody>
          {empresas.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs text-muted">#{r.id}</td>
              <td className="font-medium text-text">{editId === r.id ? <CellInput value={draft.nombre} onChange={(v) => setDraft({ ...draft, nombre: v })} /> : r.nombre}</td>
              <td className="font-mono text-xs">{editId === r.id ? <CellInput value={draft.nit} onChange={(v) => setDraft({ ...draft, nit: v })} /> : r.nit}</td>
              <td>{editId === r.id ? <CellInput value={draft.sector ?? ''} onChange={(v) => setDraft({ ...draft, sector: v })} /> : <Badge tone="neutral">{r.sector}</Badge>}</td>
              <td className="text-right"><RowActions editing={editId === r.id} onEdit={() => startEdit(r)} onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
    if (tab === 'sucursal') return (
      <table className="table">
        <thead><tr><th>ID</th><th>Nombre</th><th>Ciudad</th><th>Código</th><th className="text-right">Acciones</th></tr></thead>
        <tbody>
          {sucursales.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs text-muted">#{r.id}</td>
              <td className="font-medium text-text">{editId === r.id ? <CellInput value={draft.nombre} onChange={(v) => setDraft({ ...draft, nombre: v })} /> : r.nombre}</td>
              <td>{editId === r.id ? <CellInput value={draft.ciudad ?? ''} onChange={(v) => setDraft({ ...draft, ciudad: v })} /> : r.ciudad}</td>
              <td className="font-mono text-xs">{editId === r.id ? <CellInput value={draft.codigo_sucursal ?? ''} onChange={(v) => setDraft({ ...draft, codigo: v })} /> : r.codigo_sucursal}</td>
              <td className="text-right"><RowActions editing={editId === r.id} onEdit={() => startEdit(r)} onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
    return (
      <table className="table">
        <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>SKU</th><th className="text-right">Acciones</th></tr></thead>
        <tbody>
          {productos.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs text-muted">#{r.id}</td>
              <td className="font-medium text-text">{editId === r.id ? <CellInput value={draft.nombre} onChange={(v) => setDraft({ ...draft, nombre: v })} /> : r.nombre}</td>
              <td className="font-semibold text-text">{editId === r.id ? <CellInput type="number" value={String(draft.precio_base ?? '')} onChange={(v) => setDraft({ ...draft, precio_base: parseFloat(v) || 0 })} /> : `$${r.precio_base}`}</td>
              <td className="font-mono text-xs">{editId === r.id ? <CellInput value={draft.sku ?? ''} onChange={(v) => setDraft({ ...draft, sku: v })} /> : r.sku}</td>
              <td className="text-right"><RowActions editing={editId === r.id} onEdit={() => startEdit(r)} onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const icon = TABS.find((t) => t.k === tab)!.icon;

  return (
    <div>
      <PageHeader
        title={TITULO[tab].titulo}
        description={TITULO[tab].desc}
        icon={icon}
        badge={<Badge tone="neutral">{filas.length} registros</Badge>}
        actions={
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button key={t.k} onClick={() => { setTab(t.k); setEditId(null); }}
                className={`btn ${tab === t.k ? 'btn-primary' : 'btn-secondary'}`}>
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Tabla con editar / eliminar */}
        <Card
          title="Registros"
          subtitle="Edita en línea o elimina cada fila"
          icon={icon}
          padded={false}
          className="lg:col-span-3 overflow-hidden"
        >
          <div className="overflow-x-auto">
            {table()}
          </div>
          {filas.length === 0 && (
            <EmptyState icon={CircleAlert} title={`Sin ${tab === 'empresa' ? 'empresas' : tab === 'sucursal' ? 'sucursales' : 'productos'}`}
              description="Crea el primer registro con el formulario." />
          )}
          {msg && <div className="p-4 pt-0"><Msg type={err ? 'err' : 'ok'}>{msg}</Msg></div>}
        </Card>

        {/* Formulario de creación */}
        <Card title="Nuevo registro" subtitle="Los campos se validan en el servidor" icon={Plus} className="lg:col-span-2 h-fit">
          {tab === 'empresa' && (
            <>
              <InputField label="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="MatrixCorp" />
              <InputField label="NIT" value={f.nit} onChange={(e) => set('nit', e.target.value)} />
              <InputField label="Sector" value={f.sector} onChange={(e) => set('sector', e.target.value)} />
            </>
          )}
          {tab === 'sucursal' && (
            <>
              <InputField label="ID Empresa" type="number" value={f.empresa_id} onChange={(e) => set('empresa_id', e.target.value)} />
              <InputField label="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
              <InputField label="Ciudad" value={f.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
              <InputField label="Código" value={f.codigo} onChange={(e) => set('codigo', e.target.value)} />
            </>
          )}
          {tab === 'producto' && (
            <>
              <InputField label="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
              <InputField label="ID Categoría" type="number" value={f.categoria_id} onChange={(e) => set('categoria_id', e.target.value)} />
              <InputField label="Precio Base" type="number" value={f.precio} onChange={(e) => set('precio', e.target.value)} />
              <InputField label="SKU" value={f.sku} onChange={(e) => set('sku', e.target.value)} />
            </>
          )}
          <Button onClick={create} className="w-full">Registrar</Button>
        </Card>
      </div>
    </div>
  );
};

export default Management;
