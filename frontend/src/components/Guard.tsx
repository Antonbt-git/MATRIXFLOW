/** Guard por rol (§13): el plan define admin/analista/consulta con accesos distintos. */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredUser } from '../services/auth';

export function canAccess(pathname: string): boolean {
  const user = getStoredUser();
  if (!user) return false;
  const rol = user.rol;
  if (rol === 'admin') return true;
  if (rol === 'analista') {
    return !['/usuarios', '/configuracion', '/empresa'].includes(pathname);
  }
  // consulta: solo dashboard y reportes autorizados (§13)
  return ['/dashboard', '/reportes'].includes(pathname);
}

const Guard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  if (canAccess(pathname)) return <>{children}</>;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text">Acceso restringido</h1>
      <p className="text-muted mt-2">Tu rol no tiene permiso para este módulo (Fase 6 — RBAC).</p>
    </div>
  );
};

export default Guard;
