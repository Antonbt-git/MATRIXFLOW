import React from 'react';
import type { LucideIcon } from 'lucide-react';

/* ============ Kit de interfaz: sistema de diseño MatrixFlow ============ */

export const SidebarLink = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
      active
        ? 'bg-primary/15 text-white font-semibold shadow-[inset_3px_0_0_0_#06B6D4]'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="field">
    <label className="field-label">{label}</label>
    <input {...props} className="input" />
  </div>
);

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'dark';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, variant = 'primary', className = '', ...props }: ButtonProps) => (
  <button {...props} className={`btn btn-${variant} ${className}`}>
    {children}
  </button>
);

/** Tarjeta con cabecera (título + icono + acciones) y cuerpo consistente. */
export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  padded?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, actions, className = '', padded = true, children }) => (
  <section className={`card ${padded ? 'card-pad' : ''} ${className}`}>
    {(title || actions) && (
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <span className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon size={18} />
            </span>
          )}
          <div className="min-w-0">
            {title && <h3 className="card-title truncate">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
    )}
    {children}
  </section>
);

/** Encabezado grande de página: icono, título, descripción y acciones. */
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, description, icon: Icon, badge, actions }) => (
  <header className="flex flex-wrap items-start justify-between gap-4 mb-6 animate-fade-up">
    <div className="flex items-start gap-4">
      {Icon && (
        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-card flex items-center justify-center">
          <Icon size={22} />
        </span>
      )}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="page-title">{title}</h1>
          {badge}
        </div>
        {description && <p className="page-desc">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </header>
);

/** Mensaje de éxito / error / información. */
export const Msg: React.FC<{ type?: 'ok' | 'err' | 'info'; children: React.ReactNode }> = ({ type = 'ok', children }) => (
  <div className={`msg msg-${type}`}>{children}</div>
);

/** Insignia de estado. */
export const Badge: React.FC<{ tone?: 'ok' | 'info' | 'warn' | 'danger' | 'neutral' | 'accent'; children: React.ReactNode }> = ({
  tone = 'neutral', children,
}) => <span className={`badge badge-${tone}`}>{children}</span>;

/** Estado vacío ilustrado. */
export const EmptyState: React.FC<{ icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }> = ({
  icon: Icon, title, description, action,
}) => (
  <div className="empty">
    {Icon && (
      <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Icon size={22} />
      </span>
    )}
    <p className="font-semibold text-slate-600">{title}</p>
    {description && <p className="text-sm mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/** Avatar con iniciales. */
export const Avatar: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 36, className = '' }) => {
  const ini = (name || 'U').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {ini}
    </span>
  );
};
