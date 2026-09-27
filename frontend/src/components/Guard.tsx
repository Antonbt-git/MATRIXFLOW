/** Guard por rol (§13): el plan define admin/analista/consulta con accesos distintos. */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { getStoredUser } from '../services/auth';

export function canAccess(pathname: string): boolean {
  const user = getStoredUser();
  if (!user) return false;
  const rol = user.rol;
  if (rol === 'admin') return true;
  if (rol === 'analista') {
    return !['/usuarios', '/configuracion', '/empresa', '/empresa/gestion'].includes(pathname);
  }
  // consulta: solo dashboard y reportes autorizados (§13)
  return ['/dashboard', '/reportes'].includes(pathname);
}

const Guard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  if (canAccess(pathname)) return <>{children}</>;
  return (
    <div className="card card-pad max-w-lg mx-auto mt-8 text-center animate-scale-in">
      <span className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
        <ShieldAlert size={26} />
      </span>
      <h1 className="text-xl font-bold text-text">Acceso restringido</h1>
      <p className="text-muted text-sm mt-2">
        Tu rol no tiene permiso para este módulo (Fase 6 — RBAC). Contacta al administrador si necesitas acceso.
      </p>
      <p className="text-xs text-muted mt-4 font-mono">Ruta: {pathname}</p>
    </div>
  );
};

export default Guard;
