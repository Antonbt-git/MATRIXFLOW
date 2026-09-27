/**
 * Biometría: registro facial y verificación por DNI + rostro (extensión del plan).
 *
 * - Registro: el administrador vincula el rostro de un usuario existente con
 *   su DNI (los demás roles solo registran el suyo propio).
 * - Verificación: se introduce el DNI, se escanea el rostro y el sistema
 *   identifica a la persona mostrando sus datos y su actividad en la página
 *   (operaciones matemáticas, ventas, sesiones y auditoría §13).
 */
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getStoredUser } from '../services/auth';
import { InputField, Button } from '../components/UI';
import FaceScanner from '../components/FaceScanner';

type Tab = 'registro' | 'verificacion';

const fecha = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export default function Biometria() {
  const [tab, setTab] = useState<Tab>('registro');
  const stored = getStoredUser();

  // Registro
  const [users, setUsers] = useState<any[]>([]);
  const [usuarioId, setUsuarioId] = useState<number>(stored?.id ?? 0);
  const [dni, setDni] = useState('');
  const [msg, setMsg] = useState('');
  const [records, setRecords] = useState<any[]>([]);

  // Verificación
  const [dniVer, setDniVer] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [verMsg, setVerMsg] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  const isAdmin = stored?.rol === 'admin';

  const loadRecords = async () => {
    if (!isAdmin) return;
    try { setRecords(await api.listFaceRecords()); } catch { /* solo admin */ }
    try { setLogs(await api.biometricLogs()); } catch { /* solo admin */ }
  };

  useEffect(() => {
    (async () => {
      try { setUsers(await api.listUsers()); } catch { /* sin permiso: yo mismo */ }
      loadRecords();
    })();
  }, []);

  // ---- Registro ----
  const onCaptureRegistro = async (descriptor: number[]) => {
    if (!dni.trim()) { setMsg('Introduce primero el DNI.'); return; }
    try {
      const r = await api.registerFace(dni.trim(), descriptor, usuarioId || undefined);
      setMsg(`Rostro registrado ✓  DNI ${r.dni} → ${r.username}`);
      loadRecords();
    } catch (e: any) {
      setMsg(e.response?.data?.detail || e.message);
    }
  };

  const removeRecord = async (id: number) => {
    if (!confirm('¿Eliminar el registro facial?')) return;
    try { await api.deleteFaceRecord(id); loadRecords(); } catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  };

  // ---- Verificación ----
  const onCaptureVerificacion = async (descriptor: number[]) => {
    if (!dniVer.trim()) { setVerMsg('Introduce primero el DNI.'); return; }
    try {
      setResult(await api.verifyFace(dniVer.trim(), descriptor));
      setVerMsg('');
      loadRecords();
    } catch (e: any) {
      setVerMsg(e.response?.data?.detail || e.message);
    }
  };

  const options = users.length
    ? users
    : stored
      ? [{ id: stored.id, username: stored.username, rol: stored.rol }]
      : [];

  return (
    <div className="p-2 flex flex-col gap-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-text">Verificación Biométrica</h1>
      <p className="text-sm text-muted -mt-2">
        El rostro se vincula a un usuario existente y se identifica por DNI + descriptor facial
        (distancia euclidiana, RF-10) para mostrar sus datos y su actividad en la página.
      </p>

      <div className="flex gap-2">
        {(['registro', 'verificacion'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md font-medium text-sm transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t === 'registro' ? 'Registro facial' : 'Verificación por DNI'}
          </button>
        ))}
      </div>

      {/* ================= REGISTRO FACIAL ================= */}
      {tab === 'registro' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-gray-700 mb-2">1. Datos del registro</h2>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-sm font-semibold text-gray-600">Usuario</label>
                <select
                  value={usuarioId}
                  onChange={(e) => setUsuarioId(parseInt(e.target.value))}
                  className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {options.map((u) => (
                    <option key={u.id} value={u.id}>{u.username} ({u.rol})</option>
                  ))}
                </select>
              </div>
              <InputField
                label="DNI de la persona"
                value={dni}
                placeholder="Ej. 72345678"
                onChange={(e) => setDni(e.target.value)}
              />
            </div>
            {!isAdmin && (
              <p className="text-xs text-slate-500">
                Solo administradores pueden registrar rostros de otros usuarios.
              </p>
            )}
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-gray-700 mb-2">2. Escaneo facial</h2>
            <div className="max-w-md">
              <FaceScanner onCapture={onCaptureRegistro} disabled={!dni.trim()} />
            </div>
          </div>

          {msg && <p className="text-sm text-slate-700">{msg}</p>}

          {isAdmin && records.length > 0 && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold text-gray-700 mb-2">Rostros registrados</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b">
                    <th className="py-1">ID</th><th>Usuario</th><th>Rol</th><th>DNI</th><th>Registrado</th><th />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-1">{r.id}</td>
                      <td>{r.username}</td>
                      <td>{r.rol}</td>
                      <td>{r.dni}</td>
                      <td>{fecha(r.creado_en)}</td>
                      <td className="text-right">
                        <button
                          onClick={() => removeRecord(r.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= VERIFICACIÓN ================= */}
      {tab === 'verificacion' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-gray-700 mb-2">1. Introduce el DNI y escanea el rostro</h2>
            <div className="max-w-md">
              <InputField
                label="DNI a verificar"
                value={dniVer}
                placeholder="Ej. 72345678"
                onChange={(e) => setDniVer(e.target.value)}
              />
              <FaceScanner onCapture={onCaptureVerificacion} disabled={!dniVer.trim()} />
            </div>
            {verMsg && <p className="text-sm text-red-600 mt-2">{verMsg}</p>}
          </div>

          {result && (
            <div className={`bg-white p-4 rounded shadow border-l-4 ${
              result.resultado === 'MATCH' ? 'border-green-500'
                : result.resultado === 'NO_MATCH' ? 'border-red-500' : 'border-amber-500'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className={`font-bold ${
                  result.resultado === 'MATCH' ? 'text-green-700'
                    : result.resultado === 'NO_MATCH' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {result.resultado === 'MATCH' ? '✓ Identidad confirmada'
                    : result.resultado === 'NO_MATCH' ? '✗ Rostro no coincide'
                    : '⚠ DNI sin registro facial'}
                </h2>
                <span className="text-sm text-slate-600">{result.mensaje}</span>
              </div>

              {result.persona && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {[
                    ['Usuario', result.persona.username],
                    ['DNI', result.persona.dni],
                    ['Rol', result.persona.rol],
                    ['Empresa', result.persona.empresa ?? '—'],
                    ['Registrado desde', fecha(result.persona.registrado_desde)],
                    ['Distancia', result.distancia],
                    ['Umbral', result.umbral],
                    ['Confianza', `${result.confianza}%`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="bg-slate-50 p-2 rounded">
                      <p className="text-xs text-muted uppercase">{k}</p>
                      <p className="font-semibold text-text">{v as any}</p>
                    </div>
                  ))}
                </div>
              )}

              {result.actividad && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Actividad en la página</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 p-3 rounded">
                      <p className="font-semibold text-text">
                        Operaciones matemáticas: {result.actividad.operaciones_matematicas.total}
                      </p>
                      <ul className="mt-1 text-slate-600 text-xs space-y-1">
                        {result.actividad.operaciones_matematicas.ultimas.map((o: any, i: number) => (
                          <li key={i}>• {o.operacion} — {o.estado} ({fecha(o.timestamp)})</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <p className="font-semibold text-text">
                        Ventas registradas: {result.actividad.ventas.total}
                      </p>
                      <ul className="mt-1 text-slate-600 text-xs space-y-1">
                        {result.actividad.ventas.ultimas.map((v: any, i: number) => (
                          <li key={i}>• {v.detalle} — {v.resultado} ({fecha(v.timestamp)})</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <p className="font-semibold text-text">
                        Sesiones (logins): {result.actividad.sesiones.total}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Última: {fecha(result.actividad.sesiones.ultima)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <p className="font-semibold text-text">
                        Eventos de auditoría: {result.actividad.eventos_auditoria.total}
                      </p>
                      <ul className="mt-1 text-slate-600 text-xs space-y-1">
                        {result.actividad.eventos_auditoria.ultimos.map((e: any, i: number) => (
                          <li key={i}>• {e.accion} — {e.modulo} / {e.estado} ({fecha(e.timestamp)})</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAdmin && logs.length > 0 && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold text-gray-700 mb-2">Historial de verificaciones</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b">
                    <th className="py-1">ID</th><th>DNI intentado</th><th>Resultado</th>
                    <th>Distancia</th><th>IP</th><th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 15).map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="py-1">{l.id}</td>
                      <td>{l.dni_intentado}</td>
                      <td className={l.resultado === 'MATCH' ? 'text-green-600 font-semibold' : 'text-red-600'}>
                        {l.resultado}
                      </td>
                      <td>{l.distancia ?? '—'}</td>
                      <td>{l.ip ?? '—'}</td>
                      <td>{fecha(l.creado_en)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
