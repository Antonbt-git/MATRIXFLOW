import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, User, Lock, ScanFace, KeyRound } from 'lucide-react';
import { Button } from '../components/UI';
import { login, loginBiometrico } from '../services/auth';
import { loginSchema, type LoginInput } from '../schemas/business';
import FaceScanner from '../components/FaceScanner';
import type { AuthUser } from '../types/auth';

interface LoginProps {
  onLoginSuccess?: (user: AuthUser) => void;
}

type Modo = 'password' | 'face';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<Modo>('password');
  const [dni, setDni] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const entrar = (user: AuthUser) => {
    if (onLoginSuccess) onLoginSuccess(user);
    else window.location.assign('/dashboard');
  };

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      entrar(await login(data.username, data.password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // DNI + escaneo facial → identificación con los datos almacenados
  const onFaceCapture = async (descriptor: number[]) => {
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const { user, coincidencia } = await loginBiometrico(dni.trim(), descriptor);
      setOk(`Identificado como ${user.username}${coincidencia ? ` · confianza ${coincidencia.confianza}%` : ''}`);
      setTimeout(() => entrar(user), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo verificar el rostro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-sidebar p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`bg-white p-8 rounded-xl shadow-lg w-full ${modo === 'face' ? 'max-w-md' : 'max-w-sm'}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <LogIn className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-text">MATRIXFLOW</h1>
        </div>
        <p className="text-sm text-muted mb-4">Ingresa a tu cuenta empresarial</p>

        {/* Selector de método de acceso */}
        <div className="flex gap-2 mb-5">
          {([
            { id: 'password' as Modo, label: 'Contraseña', icon: KeyRound },
            { id: 'face' as Modo, label: 'Rostro + DNI', icon: ScanFace },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setModo(id); setError(null); setOk(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                modo === id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
        {ok && <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 text-sm">{ok}</div>}

        {modo === 'password' ? (
          <>
            <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
              <User size={14} /> Usuario
            </label>
            <input
              {...register('username')}
              placeholder="usuario"
              autoFocus
              className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-primary outline-none w-full mb-1"
            />
            {errors.username && <p className="text-xs text-red-600 mb-3">{errors.username.message}</p>}

            <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
              <Lock size={14} /> Contraseña
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-primary outline-none w-full mb-4"
            />
            {errors.password && <p className="text-xs text-red-600 mb-4">{errors.password.message}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </>
        ) : (
          <>
            <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
              <ScanFace size={14} /> DNI
            </label>
            <input
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej. 72345678"
              autoFocus
              className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-primary outline-none w-full mb-3"
            />
            <div className="mb-3">
              <FaceScanner onCapture={onFaceCapture} disabled={!dni.trim() || loading} />
            </div>
            <p className="text-xs text-muted">
              El sistema escanea tu rostro, lo identifica contra el registro facial
              guardado (DNI + descriptor de 128 dimensiones) y te ingresa con tus datos.
            </p>
          </>
        )}
      </form>
    </div>
  );
};

export default Login;
