import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Store, Package, ShoppingCart, Boxes,
  Sigma, Grid3x3, Calculator, SigmaSquare, History, FileBarChart,
  Users, Settings, ChevronDown, ChevronRight,
} from 'lucide-react';
import { SidebarLink } from './components/UI';
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
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
] as const;

const Layout: React.FC<{ user: ReturnType<typeof useAuth>['user']; onLogout: () => void }> = ({ user, onLogout }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<{ [k: string]: boolean }>({ Empresa: true, 'Análisis Matemático': true });

  return (
    <div className="flex h-screen bg-app text-text font-sans">
      <aside className="w-72 bg-sidebar p-6 flex flex-col gap-8 text-white overflow-y-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-accent">MATRIXFLOW</h1>
          <p className="text-xs text-slate-400 uppercase font-semibold">Enterprise Edition</p>
        </div>
        <nav className="flex flex-col gap-2">
          {NAV.map((entry, i) =>
            'group' in entry ? (
              <div key={i} className="flex flex-col gap-1">
                <button onClick={() => setOpenMenus((p) => ({ ...p, [entry.group]: !p[entry.group] }))}
                  className="w-full flex items-center justify-between px-4 py-3 text-gray-400 hover:text-white transition">
                  <div className="flex items-center gap-3"><entry.icon size={20} />
                  <span className="font-medium">{entry.group}</span></div>
                  {openMenus[entry.group] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openMenus[entry.group] && (
                  <div className="ml-9 flex flex-col gap-1 mt-1">
                    {entry.items.map((it) => (
                      <button key={it.to} onClick={() => navigate(it.to)}
                        className={`text-left px-4 py-2 rounded-md text-sm ${pathname === it.to ? 'text-accent font-bold' : 'text-slate-400 hover:text-white'}`}>
                        {it.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <SidebarLink key={entry.to} active={pathname === entry.to} onClick={() => navigate(entry.to)}>
                <entry.icon size={20} />
                <span className="font-medium">{entry.label}</span>
              </SidebarLink>
            )
          )}
        </nav>
        <div className="mt-auto p-4 bg-slate-800 rounded-lg text-xs text-slate-400">
          <p className="text-white font-semibold">{user?.username}</p>
          <p className="uppercase">{user?.rol}</p>
          <button onClick={onLogout} className="mt-3 w-full text-left text-red-400 hover:text-red-300 font-medium">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/empresa" element={<Guard><Empresa /></Guard>} />
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
          <Route path="/configuracion" element={<Guard><Configuracion /></Guard>} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
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
