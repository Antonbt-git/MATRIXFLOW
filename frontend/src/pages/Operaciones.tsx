import { useState } from 'react';
import { api } from '../services/api';
import { InputField, Button, PageHeader, Card, Msg, Badge } from '../components/UI';
import { Calculator, Play, Terminal } from 'lucide-react';

const VECTOR_OPS = [
  ['sum', 'Suma (v1+v2) — acumulado de períodos'],
  ['subtract', 'Resta (v1-v2) — ventas vs metas'],
  ['dot', 'Producto escalar (v1·v2) — cantidades×precios'],
  ['scalar', 'Escalar (v1×k) — ajuste porcentual'],
  ['distance', 'Distancia euclídea'],
];
const MATRIX_OPS = [
  ['add', 'Suma A+B'],
  ['subtract', 'Resta A-B'],
  ['multiply', 'Multiplicación A×B'],
  ['transpose', 'Transpuesta Aᵀ'],
  ['scalar', 'Escalar A×k'],
];

export default function Operaciones() {
  const [tipo, setTipo] = useState<'vector' | 'matriz'>('vector');
  const [op, setOp] = useState('dot');
  const [a, setA] = useState('120,85,200');
  const [b, setB] = useState('2500,3000,1500');
  const [ma, setMa] = useState('[[120,50],[85,40]]');
  const [mb, setMb] = useState('[[1,0],[0,1]]');
  const [scalar, setScalar] = useState('0.1');
  const [weights, setWeights] = useState('0.5,0.5');
  const [vecs, setVecs] = useState('[[1,2],[3,4]]');
  const [resultado, setResultado] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const run = async () => {
    setError('');
    try {
      if (tipo === 'vector') {
        if (op === 'scalar') {
          const r = await api.opVectors('scalar', { v1: a.split(',').map(Number), scalar: Number(scalar) });
          setResultado(JSON.stringify(r.resultado));
        } else if (op === 'linear_combination') {
          const r = await api.opVectors('linear_combination', {
            vectors: JSON.parse(vecs), weights: weights.split(',').map(Number),
          });
          setResultado(JSON.stringify(r.resultado));
        } else {
          const r = await api.opVectors(op, {
            v1: a.split(',').map(Number), v2: b.split(',').map(Number),
          });
          setResultado(JSON.stringify(r.resultado));
        }
      } else {
        const payload: Record<string, unknown> = { m1: JSON.parse(ma) };
        if (op === 'multiply' || op === 'add' || op === 'subtract') payload.m2 = JSON.parse(mb);
        if (op === 'scalar') payload.scalar = Number(scalar);
        const r = await api.opMatrices(op, payload);
        setResultado(JSON.stringify(r.resultado));
      }
      setOk(true);
    } catch (e: any) {
      setOk(false);
      setError(e.response?.data?.detail || e.message);
    }
  };

  const ops = tipo === 'vector'
    ? [...VECTOR_OPS, ['linear_combination', 'Combinación lineal Σwᵢvᵢ — indicador ponderado']]
    : MATRIX_OPS;

  return (
    <div>
      <PageHeader
        title="Laboratorio de Operaciones"
        description="Ejecuta álgebra lineal real con NumPy: vectores, matrices y combinaciones lineales (RF-10/11/12)"
        icon={Calculator}
        badge={<Badge tone="accent">NumPy</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Parámetros */}
        <Card title="Parámetros de entrada" subtitle="Define el tipo y la operación" icon={Play} className="h-fit">
          <div className="grid grid-cols-2 gap-x-3">
            <div className="field">
              <label className="field-label">Tipo</label>
              <select value={tipo} onChange={(e) => { setTipo(e.target.value as any); setOp(e.target.value === 'vector' ? 'dot' : 'multiply'); }}
                className="input">
                <option value="vector">Vector</option>
                <option value="matriz">Matriz</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Operación</label>
              <select value={op} onChange={(e) => setOp(e.target.value)} className="input">
                {ops.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
          </div>

          {tipo === 'vector' && op !== 'scalar' && op !== 'linear_combination' && (
            <>
              <InputField label="v1" value={a} onChange={(e) => setA(e.target.value)} />
              <InputField label="v2" value={b} onChange={(e) => setB(e.target.value)} />
            </>
          )}
          {tipo === 'vector' && op === 'scalar' && (
            <>
              <InputField label="v1" value={a} onChange={(e) => setA(e.target.value)} />
              <InputField label="Escalar" value={scalar} onChange={(e) => setScalar(e.target.value)} />
            </>
          )}
          {tipo === 'vector' && op === 'linear_combination' && (
            <>
              <InputField label="Vectores JSON" value={vecs} onChange={(e) => setVecs(e.target.value)} />
              <InputField label="Pesos" value={weights} onChange={(e) => setWeights(e.target.value)} />
            </>
          )}
          {tipo === 'matriz' && (
            <>
              <InputField label="Matriz A (JSON)" value={ma} onChange={(e) => setMa(e.target.value)} />
              {(op === 'add' || op === 'subtract' || op === 'multiply') &&
                <InputField label="Matriz B (JSON)" value={mb} onChange={(e) => setMb(e.target.value)} />}
              {op === 'scalar' && <InputField label="Escalar" value={scalar} onChange={(e) => setScalar(e.target.value)} />}
            </>
          )}
          <Button onClick={run} className="w-full">Ejecutar con NumPy</Button>
        </Card>

        {/* Resultado + notas */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card
            title="Resultado"
            subtitle="Cada operación queda registrada en /historial"
            icon={Terminal}
            actions={resultado ? <Badge tone={ok ? 'ok' : 'danger'}>{ok ? 'OK' : 'ERROR'}</Badge> : null}
            padded={false}
            className="overflow-hidden"
          >
            <div className="p-5">
              {error && <Msg type="err">{error}</Msg>}
              {resultado ? (
                <pre className="console p-4 overflow-x-auto text-emerald-400 whitespace-pre-wrap break-all">
{resultado}
                </pre>
              ) : (
                <p className="text-muted text-sm text-center py-8">
                  Selecciona una operación y pulsa <b>Ejecutar</b> para ver el resultado aquí.
                </p>
              )}
            </div>
          </Card>

          <Card title="Notas de implementación" subtitle="Restricciones CA-06 y CA-08" icon={Calculator}>
            <ul className="text-sm text-muted space-y-2">
              <li className="flex gap-2"><Badge tone="info">CA-06</Badge> Dimensiones incompatibles → error 400 con detalle.</li>
              <li className="flex gap-2"><Badge tone="ok">CA-08</Badge> Cada operación ejecutada queda en el historial con usuario y resultado.</li>
              <li className="flex gap-2"><Badge tone="accent">CA-10</Badge> Combinación lineal para indicadores ponderados de negocio.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
