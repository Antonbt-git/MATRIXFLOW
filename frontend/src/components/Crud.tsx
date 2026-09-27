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
  <span className="flex gap-2 justify-end">
    {editing ? (
      <>
        <button onClick={onSave} title="Guardar"
          className="p-1.5 rounded bg-green-600 text-white hover:bg-green-700">
          <Check size={14} />
        </button>
        <button onClick={onCancel} title="Cancelar"
          className="p-1.5 rounded bg-gray-400 text-white hover:bg-gray-500">
          <X size={14} />
        </button>
      </>
    ) : (
      <>
        <button onClick={onEdit} title="Editar"
          className="p-1.5 rounded bg-primary text-white hover:opacity-80">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} title="Eliminar"
          className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700">
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
    className="border rounded px-1 py-0.5 w-full text-sm"
  />
);
