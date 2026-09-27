import React from 'react';
import type { LucideIcon } from 'lucide-react';

/** Tarjeta de indicador ejecutivo (Dashboard) con icono, tono y pie de dato. */
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  tone?: 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan';
  footer?: React.ReactNode;
}

const TONES: Record<string, { bg: string; icon: string; ring: string }> = {
  blue: { bg: 'from-blue-500/12 to-blue-500/0', icon: 'bg-blue-50 text-blue-600', ring: 'text-blue-600' },
  emerald: { bg: 'from-emerald-500/12 to-emerald-500/0', icon: 'bg-emerald-50 text-emerald-600', ring: 'text-emerald-600' },
  violet: { bg: 'from-violet-500/12 to-violet-500/0', icon: 'bg-violet-50 text-violet-600', ring: 'text-violet-600' },
  amber: { bg: 'from-amber-500/12 to-amber-500/0', icon: 'bg-amber-50 text-amber-600', ring: 'text-amber-600' },
  cyan: { bg: 'from-cyan-500/12 to-cyan-500/0', icon: 'bg-cyan-50 text-cyan-600', ring: 'text-cyan-600' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, tone = 'blue', footer }) => {
  const t = TONES[tone] ?? TONES.blue;
  return (
    <div className="card card-pad card-interactive relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${t.bg} pointer-events-none`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{title}</p>
          <h3 className={`text-3xl font-bold mt-2 tracking-tight ${t.ring}`}>{value}</h3>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">{description}</p>
          {footer && <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-muted">{footer}</div>}
        </div>
        <span className={`shrink-0 w-11 h-11 rounded-xl ${t.icon} flex items-center justify-center`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
};

export const MathPanel: React.FC<{ data: any }> = ({ data }) => (
  <div className="console p-5">
    <h4 className="text-accent mb-4 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Cálculo de álgebra lineal · trazabilidad
    </h4>
    <div className="space-y-3 text-[13px]">
      <p className="text-slate-400">Operación: <span className="text-white font-semibold">{data.operacion}</span></p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-slate-500 text-xs uppercase tracking-wide">Vector cantidades (v₁)</span>
          <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg mt-1 text-emerald-400 overflow-x-auto">
            [{data.input_a.join(', ')}]
          </div>
        </div>
        <div>
          <span className="text-slate-500 text-xs uppercase tracking-wide">Vector precios (v₂)</span>
          <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg mt-1 text-sky-400 overflow-x-auto">
            [{data.input_b.join(', ')}]
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between gap-3">
        <p className="text-slate-400 text-sm">Σ (v₁ · v₂) =</p>
        <p className="text-amber-400 font-bold text-xl font-mono">{data.resultado}</p>
      </div>
    </div>
  </div>
);
