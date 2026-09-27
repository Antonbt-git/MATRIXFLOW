import React, { useEffect, useState } from 'react';
import { InputField, Button } from '../components/UI';
import { RowActions, CellInput } from '../components/Crud';
import { api } from '../services/api';

interface ManagementProps {
  mode?: 'empresa' | 'sucursal' | 'producto';
}

const Management: React.FC<ManagementProps> = ({ mode = 'empresa' }) => {
  const [tab, setTab] = useState<'empresa' | 'sucursal' | 'producto'>(mode);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [f, setF] = useState({ nombre: '', nit: '', sector: '', empresa_id: '1', ciudad: '', codigo: '', categoria_id: '1', precio: '', sku: '' });

  const load = async () => {
    try {
      setEmpresas(await api.listEmpresas());
      setSucursales(await api.listSucursales());
      setProductos(await api.listProductos());
    } catch (e: any) { setMsg(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      if (tab === 'empresa') await api.createEmpresa(f.nombre, f.nit, f.sector);
      if (tab === 'sucursal') await api.createSucursal(parseInt(f.empresa_id), f.nombre, f.ciudad, f.codigo);
      if (tab === 'producto') await api.createProducto(f.nombre, parseInt(f.categoria_id), parseFloat(f.precio), f.sku);
      setMsg('Registrado correctamente');
      load();
    } catch (e: any) { setMsg(e.message); }
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
      setMsg('Actualizado ✓');
      setEditId(null);
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      if (tab === 'empresa') await api.deleteEmpresa(id);
      if (tab === 'sucursal') await api.deleteSucursal(id);
      if (tab === 'producto') await api.deleteProducto(id);
      setMsg('Eliminado ✓');
      load();
    } catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  const startEdit = (row: any) => { setEditId(row.id); setDraft({ ...row }); };
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  const table = () => {
    if (tab === 'empresa') return (
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted border-b"><th className="py-1">ID</th><th>Nombre</th><th>NIT</th><th>Sector</th><th /></tr></thead>
        <tbody>
          {empresas.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-1">{r.id}</td>
              <td>{editId === r.id ? <CellInput value={draft.nombre} onChange={(v) => setDraft({ ...draft, nombre: v })} /> : r.nombre}</td>
              <td>{editId === r.id ? <CellInput value={draft.nit} onChange={(v) => setDraft({ ...draft, nit: v })} /> : r.nit}</td>
              <td>{editId === r.id ? <CellInput value={draft.sector ?? ''} onChange={(v) => setDraft({ ...draft, sector: v })} /> : r.sector}</td>
              <td><RowActions editing={editId === r.id} onEdit={() => startEdit(r)} onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
    if (tab === 'sucursal') return (
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted border-b"><th className="py-1">ID</th><th>Nombre</th><th>Ciudad</th><th>Código</th><th /></tr></thead>
        <tbody>
          {sucursales.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-1">{r.id}</td>
              <td>{editId === r.id ? <CellInput value={draft.nombre} onChange={(v) => setDraft({ ...draft, nombre: v })} /> : r.nombre}</td>
              <td>{editId === r.id ? <CellInput value={draft.ciudad ?? ''} onChange={(v) => setDraft({ ...draft, ciudad: v })} /> : r.ciudad}</td>
              <td>{editId === r.id ? <CellInput value={draft.codigo_sucursal ?? ''} onChange={(v) => setDraft({ ...draft, codigo: v })} /> : r.codigo_sucursal}</td>
              <td><RowActions editing={editId === r.id} onEdit={() => startEdit(r)} onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
    return (
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted border-b"><th className="py-1">ID</th><th>Nombre</th><th>Precio</th><th>SKU</th><th /></tr></thead>
        <tbody>
          {productos.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-1">{r.id}</td>
              <td>{editId === r.id ? <CellInput value={draft.nombre} onChange={(v) => setDraft({ ...draft, nombre: v })} /> : r.nombre}</td>
              <td>{editId === r.id ? <CellInput type="number" value={String(draft.precio_base ?? '')} onChange={(v) => setDraft({ ...draft, precio_base: parseFloat(v) || 0 })} /> : `$${r.precio_base}`}</td>
              <td>{editId === r.id ? <CellInput value={draft.sku ?? ''} onChange={(v) => setDraft({ ...draft, sku: v })} /> : r.sku}</td>
              <td><RowActions editing={editId === r.id} onEdit={() => startEdit(r)} onSave={save} onCancel={() => setEditId(null)} onDelete={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text">Gestión Empresarial</h1>
        <p className="text-muted">CRUD de entidades base (RF-03, RF-04)</p>
      </header>
      <div className="flex gap-2 mb-6">
        {(['empresa', 'sucursal', 'producto'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setEditId(null); }}
            className={`px-4 py-2 rounded-md transition ${tab === t ? 'bg-primary text-white' : 'bg-white text-gray-600 border'}`}>
            {t === 'empresa' ? 'Empresas' : t === 'sucursal' ? 'Sucursales' : 'Productos'}
          </button>
        ))}
      </div>

      {/* Tabla con editar / eliminar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h3 className="font-bold mb-3">Registros</h3>
        {table()}
        {msg && <p className="text-sm mt-3 text-slate-600">{msg}</p>}
      </div>

      {/* Formulario de creación */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Nuevo registro</h3>
        {tab === 'empresa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="MatrixCorp" />
            <InputField label="NIT" value={f.nit} onChange={(e) => set('nit', e.target.value)} />
            <InputField label="Sector" value={f.sector} onChange={(e) => set('sector', e.target.value)} />
            <div className="flex items-end"><Button onClick={create}>Registrar</Button></div>
          </div>
        )}
        {tab === 'sucursal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="ID Empresa" type="number" value={f.empresa_id} onChange={(e) => set('empresa_id', e.target.value)} />
            <InputField label="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
            <InputField label="Ciudad" value={f.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
            <InputField label="Código" value={f.codigo} onChange={(e) => set('codigo', e.target.value)} />
            <div className="flex items-end"><Button onClick={create}>Registrar</Button></div>
          </div>
        )}
        {tab === 'producto' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
            <InputField label="ID Categoría" type="number" value={f.categoria_id} onChange={(e) => set('categoria_id', e.target.value)} />
            <InputField label="Precio Base" type="number" value={f.precio} onChange={(e) => set('precio', e.target.value)} />
            <InputField label="SKU" value={f.sku} onChange={(e) => set('sku', e.target.value)} />
            <div className="flex items-end"><Button onClick={create}>Registrar</Button></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Management;
