import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LogIn, User, Lock, ScanFace, KeyRound, CheckCircle2, XCircle, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { Button } from '../components/UI';
import { login, loginBiometrico } from '../services/auth';
import { loginSchema, type LoginInput } from '../schemas/business';
import FaceScanner from '../components/FaceScanner';
import type { AuthUser } from '../types/auth';

interface LoginProps {
  onLoginSuccess?: (user: AuthUser) => void;
}

type Modo = 'password' | 'face';
type Fase = 'esperando' | 'escaneando' | 'verificando' | 'concedido' | 'denegado';

interface Resultado {
  user: AuthUser;
  foto?: string;
  dni?: string;
  confianza?: number;
  distancia?: number;
  fecha: Date;
}

const PILL: Record<Fase, { texto: string; clase: string; Icon: any }> = {
  esperando: { texto: 'Introduce tu DNI para continuar', clase: 'bg-slate-100 text-slate-500 border-slate-200', Icon: ShieldCheck },
  escaneando: { texto: 'Escaneando rostro · mira a la cámara…', clase: 'bg-amber-50 text-amber-700 border-amber-200', Icon: ScanFace },
  verificando: { texto: 'Comparando vector 128D en el servidor…', clase: 'bg-blue-50 text-blue-700 border-blue-200', Icon: ShieldCheck },
  concedido: { texto: 'IDENTIDAD VERIFICADA', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  denegado: { texto: 'IDENTIDAD NO VERIFICADA', clase: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
};

/** Tarjeta "Acceso concedido" con la foto capturada y los datos identificados. */
const TarjetaAcceso: React.FC<{ r: Resultado; dni?: string }> = ({ r, dni }) => (
  <div className="border border-emerald-200 bg-emerald-50/60 rounded-lg p-4 flex gap-4 items-center">
    {r.foto ? (
      <img src={r.foto} alt="Rostro capturado"
        className="w-20 h-24 object-cover rounded-md border border-emerald-300" />
    ) : (
      <div className="w-20 h-24 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600">
        <User size={32} />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Nombre completo</p>
      <p className="text-2xl font-bold text-text truncate">{r.user.username}</p>
      <p className="text-sm font-mono text-slate-600">DNI · {dni ?? r.dni ?? '—'}</p>
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mt-2">
        Método: biometría facial · 128D · server-side
      </p>
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
        Verificado: {r.fecha.toLocaleString()}
        {r.confianza != null && ` · confianza ${r.confianza}%`}
      </p>
    </div>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<Modo>('password');
  const [dni, setDni] = useState('');
  const [fase, setFase] = useState<Fase>('esperando');
  const [start, setStart] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const timerRef = useRef<number | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const entrar = (user: AuthUser) => {
    if (onLoginSuccess) onLoginSuccess(user);
    else window.location.assign('/dashboard');
  };

  const programarEntrada = (user: AuthUser, ms = 2200) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => entrar(user), ms) as unknown as number;
  };

  // --- Contraseña ---
  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(data.username, data.password);
      setResultado({ user, fecha: new Date() });
      setFase('concedido');
      programarEntrada(user, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // --- Rostro + DNI ---
  const iniciarVerificacion = () => {
    setError(null);
    if (!dni.trim()) { setError('Introduce tu DNI para verificar.'); return; }
    if (fase === 'escaneando' || fase === 'verificando') return;
    setResultado(null);
    setFase('escaneando');
    setStart((s) => s + 1);
  };

  const onFaceCapture = async (descriptor: number[], foto: string) => {
    setError(null);
    setFase('verificando');
    setLoading(true);
    try {
      const { user, coincidencia } = await loginBiometrico(dni.trim(), descriptor);
      setResultado({
        user, foto, dni: dni.trim(),
        confianza: coincidencia?.confianza, distancia: coincidencia?.distancia,
        fecha: new Date(),
      });
      setFase('concedido');
      programarEntrada(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo verificar el rostro');
      setFase('denegado');
    } finally {
      setLoading(false);
    }
  };

  const onEstado = (e: string) => {
    if (fase === 'concedido' && e !== 'error') return;
    if (e === 'idle') setFase('esperando');
    else if (e === 'error') setFase('denegado');
    else setFase('escaneando');
  };

  const pill = PILL[fase];
  const pillTexto = fase === 'esperando' && dni.trim()
    ? 'Plantilla registrada · listo para verificar'
    : pill.texto;

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`bg-white rounded-xl shadow-lg w-full overflow-hidden ${
          modo === 'face' ? 'max-w-4xl' : 'max-w-sm'
        }`}
      >
        {/* Cabecera */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <LogIn className="text-primary" size={24} />
            <h1 className="text-2xl font-bold text-text">MATRIXFLOW</h1>
          </div>
          <p className="text-sm text-muted mb-4">Ingresa a tu cuenta empresarial</p>

          <div className="flex gap-2 mb-4">
            {([
              { id: 'password' as Modo, label: 'Contraseña', icon: KeyRound },
              { id: 'face' as Modo, label: 'Rostro + DNI', icon: ScanFace },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setModo(id); setError(null); setResultado(null); setFase('esperando');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                  modo === id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
        </div>

        {/* ===================== CONTRASEÑA ===================== */}
        {modo === 'password' && (
          <div className="px-8 pb-8">
            {fase === 'concedido' && resultado ? (
              <div className="flex flex-col gap-4">
                <span className="inline-flex items-center gap-2 self-start border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={14} /> ACCESO CONCEDIDO
                </span>
                <h2 className="text-3xl font-bold text-text">Acceso concedido</h2>
                <TarjetaAcceso r={resultado} />
                <p className="text-sm text-muted flex items-center gap-2">
                  Entrando al panel… <ArrowRight size={14} className="animate-pulse" />
                </p>
                <Button type="button" onClick={() => entrar(resultado.user)}>Entrar ahora</Button>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* ===================== ROSTRO + DNI ===================== */}
        {modo === 'face' && (
          <div className="grid md:grid-cols-2 border-t border-slate-100">
            {/* Cámara en vivo */}
            <div className="bg-slate-950 p-5 flex flex-col justify-center">
              <FaceScanner
                onCapture={onFaceCapture}
                disabled={!dni.trim() || loading}
                externalStart={start}
                ocultarInicio
                onStateChange={onEstado}
              />
            </div>

            {/* Panel de verificación */}
            <div className="p-6 flex flex-col">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 mb-3">
                VERIFICACIÓN DE IDENTIDAD
              </p>

              {fase === 'concedido' && resultado ? (
                <div className="flex flex-col gap-4">
                  <span className="inline-flex items-center gap-2 self-start border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={14} /> IDENTIDAD VERIFICADA
                  </span>
                  <h2 className="text-3xl font-bold text-text">Acceso concedido</h2>
                  <TarjetaAcceso r={resultado} dni={dni.trim()} />
                  <p className="text-sm text-muted flex items-center gap-2">
                    Entrando al panel… <ArrowRight size={14} className="animate-pulse" />
                  </p>
                  <Button type="button" onClick={() => entrar(resultado.user)}>Entrar ahora</Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-text">Verificación biométrica</h2>
                  <p className="text-sm text-muted mt-2 mb-5">
                    Ingresa tu DNI y mira a la cámara: el servidor comparará tu vector{' '}
                    <b>128D</b> con tu plantilla registrada y mostrará tus datos para
                    confirmar identidad.
                  </p>

                  <label className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 mb-1">
                    DNI ASOCIADO
                  </label>
                  <input
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="00000000"
                    inputMode="numeric"
                    autoFocus
                    className="border border-slate-300 p-3 rounded-md text-center font-mono text-lg tracking-[0.35em] focus:ring-2 focus:ring-primary outline-none w-full mb-3"
                  />

                  <span className={`inline-flex items-center gap-2 self-start border text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${pill.clase}`}>
                    {React.createElement(pill.Icon, { size: 14 })} {pillTexto}
                  </span>

                  <button
                    type="button"
                    onClick={iniciarVerificacion}
                    disabled={fase === 'escaneando' || fase === 'verificando' || !dni.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-md transition"
                  >
                    <ScanFace size={18} />
                    {fase === 'verificando' ? 'Verificando…' : 'Iniciar verificación facial'}
                  </button>

                  <p className="text-[11px] text-slate-400 mt-3">
                    El rostro debe estar registrado previamente por un administrador
                    en <b>Biometría → Registro facial</b>.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
