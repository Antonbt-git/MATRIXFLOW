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
import { InputField, Button, PageHeader, Card, Msg, Badge, EmptyState } from '../components/UI';
import { ScanFace, UserRoundPlus, ShieldCheck, History, Database, CircleAlert, Trash2 } from 'lucide-react';
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
  const [msgErr, setMsgErr] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  // Verificación
  const [dniVer, setDniVer] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [verMsg, setVerMsg] = useState('');
  const [verErr, setVerErr] = useState(false);
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
    if (!dni.trim()) { setMsg('Introduce primero el DNI.'); setMsgErr(true); return; }
    try {
      const r = await api.registerFace(dni.trim(), descriptor, usuarioId || undefined);
      setMsg(`Rostro registrado ✓  DNI ${r.dni} → ${r.username}`);
      setMsgErr(false);
      loadRecords();
    } catch (e: any) {
      setMsg(e.response?.data?.detail || e.message);
      setMsgErr(true);
    }
  };

  const removeRecord = async (id: number) => {
    if (!confirm('¿Eliminar el registro facial?')) return;
    try {
      await api.deleteFaceRecord(id);
      setMsg('Registro facial eliminado ✓'); setMsgErr(false);
      loadRecords();
    } catch (e: any) { setMsg(e.response?.data?.detail || e.message); setMsgErr(true); }
  };

  // ---- Verificación ----
  const onCaptureVerificacion = async (descriptor: number[]) => {
    if (!dniVer.trim()) { setVerMsg('Introduce primero el DNI.'); setVerErr(true); return; }
    try {
      setResult(await api.verifyFace(dniVer.trim(), descriptor));
      setVerMsg('');
      setVerErr(false);
      loadRecords();
    } catch (e: any) {
      setVerMsg(e.response?.data?.detail || e.message);
      setVerErr(true);
    }
  };

  const options = users.length
    ? users
    : stored
      ? [{ id: stored.id, username: stored.username, rol: stored.rol }]
      : [];

  const okVer = result?.resultado === 'MATCH';
  const sinRostro = result && result.resultado !== 'MATCH' && result.resultado !== 'NO_MATCH';

  return (
    <div>
      <PageHeader
        title="Verificación Biométrica"
        description="El rostro se vincula a un usuario existente y se identifica por DNI + descriptor facial (distancia euclidiana, RF-10) para mostrar sus datos y su actividad en la página."
        icon={ScanFace}
        badge={<Badge tone="accent">128D · face-api</Badge>}
        actions={
          <div className="flex gap-2">
            {(['registro', 'verificacion'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}>
                {t === 'registro' ? <UserRoundPlus size={15} /> : <ShieldCheck size={15} />}
                {t === 'registro' ? 'Registro facial' : 'Verificación por DNI'}
              </button>
            ))}
          </div>
        }
      />

      {/* ================= REGISTRO FACIAL ================= */}
      {tab === 'registro' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 flex flex-col gap-5">
            <Card title="1. Datos del registro" subtitle="Vincula el rostro a un usuario" icon={UserRoundPlus}>
              <div className="field">
                <label className="field-label">Usuario</label>
                <select value={usuarioId} onChange={(e) => setUsuarioId(parseInt(e.target.value))} className="input">
                  {options.map((u) => (
                    <option key={u.id} value={u.id}>{u.username} ({u.rol})</option>
                  ))}
                </select>
              </div>
              <InputField label="DNI de la persona" value={dni} placeholder="Ej. 72345678"
                onChange={(e) => setDni(e.target.value)} />
              {!isAdmin && (
                <p className="text-xs text-muted">
                  Solo administradores pueden registrar rostros de otros usuarios.
                </p>
              )}
              {msg && <div className="mt-4"><Msg type={msgErr ? 'err' : 'ok'}>{msg}</Msg></div>}
            </Card>
          </div>

          <Card title="2. Escaneo facial" subtitle="Captura el descriptor de 128 dimensiones" icon={ScanFace}
            className="lg:col-span-2 h-fit">
            <div className="max-w-md mx-auto">
              <FaceScanner onCapture={onCaptureRegistro} disabled={!dni.trim()} />
            </div>
          </Card>

          {isAdmin && (
            <div className="lg:col-span-3">
              <Card
                title="Rostros registrados"
                subtitle="Cada rostro queda asociado a un usuario, DNI y rol"
                icon={Database}
                padded={false}
                className="overflow-hidden"
                actions={<Badge tone="neutral">{records.length} registros</Badge>}
              >
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr><th>ID</th><th>Usuario</th><th>Rol</th><th>DNI</th><th>Registrado</th><th className="text-right">Acciones</th></tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id}>
                          <td className="font-mono text-xs text-muted">#{r.id}</td>
                          <td className="font-medium text-text">{r.username}</td>
                          <td><Badge tone={r.rol === 'admin' ? 'info' : 'neutral'}>{r.rol}</Badge></td>
                          <td className="font-mono text-xs">{r.dni}</td>
                          <td className="text-xs text-muted">{fecha(r.creado_en)}</td>
                          <td className="text-right">
                            <button onClick={() => removeRecord(r.id)}
                              className="btn btn-danger !px-3 !py-1.5 !text-xs">
                              <Trash2 size={13} /> Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!records.length && (
                  <EmptyState icon={CircleAlert} title="Sin rostros registrados"
                    description="Introduce un DNI y escanea el rostro para crear el primer vínculo." />
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ================= VERIFICACIÓN ================= */}
      {tab === 'verificacion' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card
              title="1. DNI y escaneo"
              subtitle="Identifica a la persona por su rostro"
              icon={ShieldCheck}
              actions={result
                ? <Badge tone={okVer ? 'ok' : sinRostro ? 'warn' : 'danger'}>
                    {result.resultado}
                  </Badge>
                : null}
            >
              <div className="max-w-md">
                <InputField label="DNI a verificar" value={dniVer} placeholder="Ej. 72345678"
                  onChange={(e) => setDniVer(e.target.value)} />
                <FaceScanner onCapture={onCaptureVerificacion} disabled={!dniVer.trim()} />
              </div>
              {verMsg && <div className="mt-4"><Msg type={verErr ? 'err' : 'ok'}>{verMsg}</Msg></div>}
            </Card>

            {result && (
              <div className="lg:col-span-2">
                <Card
                  title={okVer ? '✓ Identidad confirmada'
                    : sinRostro ? '⚠ DNI sin registro facial' : '✗ Rostro no coincide'}
                  subtitle={result.mensaje}
                  icon={okVer ? ShieldCheck : CircleAlert}
                  className={`border-l-4 ${okVer ? 'border-l-emerald-500'
                    : sinRostro ? 'border-l-amber-500' : 'border-l-red-500'}`}
                >
                  {result.persona && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
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
                        <div key={k as string} className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                          <p className="text-[10px] text-muted uppercase tracking-wide">{k}</p>
                          <p className="font-semibold text-text mt-0.5">{v as any}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.actividad && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-text mb-2">
                        <History size={15} className="text-primary" /> Actividad en la página
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg">
                          <p className="font-semibold text-text">
                            Operaciones matemáticas: <span className="text-primary">{result.actividad.operaciones_matematicas.total}</span>
                          </p>
                          <ul className="mt-1.5 text-muted text-xs space-y-1">
                            {result.actividad.operaciones_matematicas.ultimas.map((o: any, i: number) => (
                              <li key={i}>• {o.operacion} — {o.estado} ({fecha(o.timestamp)})</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg">
                          <p className="font-semibold text-text">
                            Ventas registradas: <span className="text-primary">{result.actividad.ventas.total}</span>
                          </p>
                          <ul className="mt-1.5 text-muted text-xs space-y-1">
                            {result.actividad.ventas.ultimas.map((v: any, i: number) => (
                              <li key={i}>• {v.detalle} — {v.resultado} ({fecha(v.timestamp)})</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg">
                          <p className="font-semibold text-text">
                            Sesiones (logins): <span className="text-primary">{result.actividad.sesiones.total}</span>
                          </p>
                          <p className="text-xs text-muted mt-1.5">
                            Última: {fecha(result.actividad.sesiones.ultima)}
                          </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg">
                          <p className="font-semibold text-text">
                            Eventos de auditoría: <span className="text-primary">{result.actividad.eventos_auditoria.total}</span>
                          </p>
                          <ul className="mt-1.5 text-muted text-xs space-y-1">
                            {result.actividad.eventos_auditoria.ultimos.map((e: any, i: number) => (
                              <li key={i}>• {e.accion} — {e.modulo} / {e.estado} ({fecha(e.timestamp)})</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {isAdmin && logs.length > 0 && (
            <Card
              title="Historial de verificaciones"
              subtitle="Intentos con DNI, resultado, distancia e IP"
              icon={History}
              padded={false}
              className="overflow-hidden"
              actions={<Badge tone="neutral">{logs.length} intentos</Badge>}
            >
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>ID</th><th>DNI intentado</th><th>Resultado</th><th>Distancia</th><th>IP</th><th>Fecha</th></tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 15).map((l) => (
                      <tr key={l.id}>
                        <td className="font-mono text-xs text-muted">#{l.id}</td>
                        <td className="font-mono text-xs">{l.dni_intentado}</td>
                        <td><Badge tone={l.resultado === 'MATCH' ? 'ok' : 'danger'}>{l.resultado}</Badge></td>
                        <td className="font-mono text-xs">{l.distancia ?? '—'}</td>
                        <td className="font-mono text-xs">{l.ip ?? '—'}</td>
                        <td className="text-xs text-muted">{fecha(l.creado_en)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
