import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, User, Lock } from 'lucide-react';
import { Button } from '../components/UI';
import { login } from '../services/auth';
import { loginSchema, type LoginInput } from '../schemas/business';
import type { AuthUser } from '../types/auth';

interface LoginProps {
  onLoginSuccess?: (user: AuthUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(data.username, data.password);
      if (onLoginSuccess) onLoginSuccess(user);
      else window.location.assign('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-sidebar">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-10 rounded-xl shadow-lg w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <LogIn className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-text">MATRIXFLOW</h1>
        </div>
        <p className="text-sm text-muted mb-6">Ingresa a tu cuenta empresarial</p>

        {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

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
        {errors.password && <p className="text-xs text-red-600 mb-3">{errors.password.message}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </div>
  );
};

export default Login;
