import { Pencil, Trash2, Check, X } from 'lucide-react';

/** Acciones CRUD por fila (Editar / Eliminar / Guardar / Cancelar). */
export const RowActions = ({
  editing, onEdit, onSave, onCancel, onDelete,
}: {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) => (
  <span className="flex gap-1.5 justify-end">
    {editing ? (
      <>
        <button onClick={onSave} title="Guardar"
          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm">
          <Check size={14} />
        </button>
        <button onClick={onCancel} title="Cancelar"
          className="p-2 rounded-lg bg-slate-400 text-white hover:bg-slate-500 transition">
          <X size={14} />
        </button>
      </>
    ) : (
      <>
        <button onClick={onEdit} title="Editar"
          className="p-2 rounded-lg bg-primary text-white hover:bg-blue-700 transition shadow-sm">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} title="Eliminar"
          className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition">
          <Trash2 size={14} />
        </button>
      </>
    )}
  </span>
);

/** Input editable en línea dentro de la tabla. */
export const CellInput = ({ value, onChange, type = 'text' }: {
  value: string; onChange: (v: string) => void; type?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="input !px-2 !py-1 text-xs"
  />
);
