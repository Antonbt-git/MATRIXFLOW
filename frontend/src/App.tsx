import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Store, Package, ShoppingCart, Boxes,
  Sigma, History, FileBarChart, Users, Settings, ChevronDown, ChevronRight,
  ScanFace, LogOut, CalendarDays, Activity, ShieldCheck,
} from 'lucide-react';
import { SidebarLink, Avatar } from './components/UI';
import Dashboard from './pages/Dashboard';
import Management from './pages/Management';
import Sales from './pages/Sales';
import Goals from './pages/Goals';
import Empresa from './pages/Empresa';
import Vectores from './pages/Vectores';
import Matrices from './pages/Matrices';
import Operaciones from './pages/Operaciones';
import Historial from './pages/Historial';
import Inventario from './pages/Inventario';
import Usuarios from './pages/Usuarios';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import Biometria from './pages/Biometria';
import Guard from './components/Guard';
import { useAuth } from './hooks/useAuth';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { group: 'Empresa', icon: Building2, items: [
    { to: '/empresa', label: 'Empresa' },
    { to: '/sucursales', label: 'Sucursales' },
    { to: '/productos', label: 'Productos' },
  ]},
  { to: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { to: '/inventario', icon: Boxes, label: 'Inventario' },
  { group: 'Análisis Matemático', icon: Sigma, items: [
    { to: '/vectores', label: 'Vectores' },
    { to: '/matrices', label: 'Matrices' },
    { to: '/operaciones', label: 'Operaciones' },
    { to: '/combinaciones', label: 'Combinaciones lineales' },
  ]},
  { to: '/historial', icon: History, label: 'Historial' },
  { to: '/reportes', icon: FileBarChart, label: 'Reportes' },
  { to: '/biometrico', icon: ScanFace, label: 'Biometría' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
] as const;

/** Ruta → { título, grupo } para el breadcrumb del topbar. */
const RUTAS: Record<string, { titulo: string; grupo?: string }> = {
  '/dashboard': { titulo: 'Dashboard' },
  '/empresa': { titulo: 'Empresa', grupo: 'Empresa' },
  '/empresa/gestion': { titulo: 'Gestión de Empresas', grupo: 'Empresa' },
  '/sucursales': { titulo: 'Sucursales', grupo: 'Empresa' },
  '/productos': { titulo: 'Productos', grupo: 'Empresa' },
  '/ventas': { titulo: 'Ventas' },
  '/inventario': { titulo: 'Inventario' },
  '/vectores': { titulo: 'Vectores', grupo: 'Análisis Matemático' },
  '/matrices': { titulo: 'Matrices', grupo: 'Análisis Matemático' },
  '/operaciones': { titulo: 'Operaciones', grupo: 'Análisis Matemático' },
  '/combinaciones': { titulo: 'Combinaciones lineales', grupo: 'Análisis Matemático' },
  '/historial': { titulo: 'Historial' },
  '/reportes': { titulo: 'Reportes' },
  '/biometrico': { titulo: 'Biometría' },
  '/usuarios': { titulo: 'Usuarios' },
  '/configuracion': { titulo: 'Configuración' },
};

const hoy = new Date().toLocaleDateString('es-PE', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
});

const Layout: React.FC<{ user: ReturnType<typeof useAuth>['user']; onLogout: () => void }> = ({ user, onLogout }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<{ [k: string]: boolean }>({ Empresa: true, 'Análisis Matemático': true });
  const [menuMovil, setMenuMovil] = useState(false);
  const ir = (to: string) => { navigate(to); setMenuMovil(false); };
  const ruta = RUTAS[pathname] ?? { titulo: 'MatrixFlow' };

  return (
    <div className="flex h-screen bg-app text-text font-sans overflow-hidden">
      {/* Fondo del menú móvil */}
      {menuMovil && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuMovil(false)}
        />
      )}

      {/* ============ Sidebar ============ */}
      <aside className={`w-[264px] shrink-0 bg-sidebar text-white flex flex-col z-40
        fixed inset-y-0 left-0 transition-transform duration-300 lg:static lg:translate-x-0
        ${menuMovil ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Marca */}
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-lg">
              M
            </span>
            <div className="leading-tight">
              <h1 className="text-lg font-bold tracking-tight">MATRIXFLOW</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Enterprise Edition</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-400" />
            Sesión cifrada · JWT + RBAC
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5">
          {NAV.map((entry, i) =>
            'group' in entry ? (
              <div key={i} className="mt-2">
                <button
                  onClick={() => setOpenMenus((p) => ({ ...p, [entry.group]: !p[entry.group] }))}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-slate-500 hover:text-slate-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <entry.icon size={13} />
                    <span className="font-semibold">{entry.group}</span>
                  </div>
                  {openMenus[entry.group] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {openMenus[entry.group] && (
                  <div className="ml-2 pl-3 border-l border-white/10 flex flex-col gap-1 mt-1">
                    {entry.items.map((it) => {
                      const activo = pathname === it.to;
                      return (
                        <button
                          key={it.to}
                          onClick={() => ir(it.to)}
                          className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            activo
                              ? 'bg-primary/15 text-white font-semibold shadow-[inset_3px_0_0_0_#06B6D4]'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {it.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <SidebarLink key={entry.to} active={pathname === entry.to} onClick={() => ir(entry.to)}>
                <entry.icon size={18} />
                <span className="font-medium">{entry.label}</span>
              </SidebarLink>
            )
          )}
        </nav>

        {/* Usuario */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            <Avatar name={user?.username ?? 'U'} size={38} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user?.username}</p>
              <p className="text-[10px] uppercase tracking-wider text-cyan-300">{user?.rol}</p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ============ Contenido ============ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="z-20 bg-white/85 backdrop-blur border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuMovil((v) => !v)}
              title="Abrir menú"
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
            <span className="text-muted">MatrixFlow</span>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
            {ruta.grupo && (
              <>
                <span className="text-muted truncate">{ruta.grupo}</span>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </>
            )}
            <span className="font-semibold text-text truncate">{ruta.titulo}</span>
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 badge badge-ok">
              <Activity size={12} /> Sistema operativo
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-muted capitalize">
              <CalendarDays size={14} className="text-primary" /> {hoy}
            </span>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto">
          <div key={pathname} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-up">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/empresa" element={<Guard><Empresa /></Guard>} />
              <Route path="/empresa/gestion" element={<Guard><Management mode="empresa" /></Guard>} />
              <Route path="/sucursales" element={<Guard><Management mode="sucursal" /></Guard>} />
              <Route path="/productos" element={<Guard><Management mode="producto" /></Guard>} />
              <Route path="/ventas" element={<Guard><Sales /></Guard>} />
              <Route path="/inventario" element={<Guard><Inventario /></Guard>} />
              <Route path="/vectores" element={<Guard><Vectores /></Guard>} />
              <Route path="/matrices" element={<Guard><Matrices /></Guard>} />
              <Route path="/operaciones" element={<Guard><Operaciones /></Guard>} />
              <Route path="/combinaciones" element={<Guard><Operaciones /></Guard>} />
              <Route path="/historial" element={<Guard><Historial /></Guard>} />
              <Route path="/reportes" element={<Goals />} />
              <Route path="/usuarios" element={<Guard><Usuarios /></Guard>} />
              <Route path="/biometrico" element={<Guard><Biometria /></Guard>} />
              <Route path="/configuracion" element={<Guard><Configuracion /></Guard>} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading, logout } = useAuth();

  if (loading) return null;

  return (
    <BrowserRouter>
      {!user ? (
        <Routes><Route path="*" element={<Login />} /></Routes>
      ) : (
        <Layout user={user} onLogout={logout} />
      )}
    </BrowserRouter>
  );
};

export default App;
