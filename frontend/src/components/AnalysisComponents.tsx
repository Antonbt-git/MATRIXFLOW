import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, color }) => (
  <div className={`p-6 rounded-xl border border-gray-200 bg-white shadow-sm`}>
    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
    <h3 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h3>
    <p className="text-xs text-gray-400 mt-1">{description}</p>
  </div>
);

export const MathPanel: React.FC<{ data: any }> = ({ data }) => (
  <div className="p-6 rounded-xl bg-slate-900 text-slate-100 font-mono text-sm">
    <h4 className="text-blue-400 mb-4 font-bold uppercase">Cálculo de Álgebra Lineal (Trazabilidad)</h4>
    <div className="space-y-2">
      <p className="text-slate-400">Operación: <span className="text-white">{data.operacion}</span></p>
      <div className="flex flex-col gap-2">
        <div>
          <span className="text-slate-500">Vector Cantidades (v₁):</span>
          <div className="bg-slate-800 p-2 rounded mt-1 text-green-400">
            [{data.input_a.join(', ')}]
          </div>
        </div>
        <div>
          <span className="text-slate-500">Vector Precios (v₂):</span>
          <div className="bg-slate-800 p-2 rounded mt-1 text-blue-400">
            [{data.input_b.join(', ')}]
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-lg">Resultado $\sum (v_1 \cdot v_2)$ = <span className="text-yellow-400 font-bold">{data.resultado}</span></p>
      </div>
    </div>
  </div>
);
