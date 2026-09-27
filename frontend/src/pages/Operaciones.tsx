import { useState } from 'react';
import { api } from '../services/api';
import { InputField, Button } from '../components/UI';

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

  const run = async () => {
    setError('');
    try {
      if (tipo === 'vector') {
        if (op === 'scalar') {
          const r = await api.opVectors('scalar', { v1: a.split(',').map(Number), scalar: Number(scalar) });
          setResultado(JSON.stringify(r.resultado));
          return;
        }
        if (op === 'linear_combination') {
          const r = await api.opVectors('linear_combination', {
            vectors: JSON.parse(vecs), weights: weights.split(',').map(Number),
          });
          setResultado(JSON.stringify(r.resultado));
          return;
        }
        const r = await api.opVectors(op, {
          v1: a.split(',').map(Number), v2: b.split(',').map(Number),
        });
        setResultado(JSON.stringify(r.resultado));
      } else {
        const payload: Record<string, unknown> = { m1: JSON.parse(ma) };
        if (op === 'multiply' || op === 'add' || op === 'subtract') payload.m2 = JSON.parse(mb);
        if (op === 'scalar') payload.scalar = Number(scalar);
        const r = await api.opMatrices(op, payload);
        setResultado(JSON.stringify(r.resultado));
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const ops = tipo === 'vector'
    ? [...VECTOR_OPS, ['linear_combination', 'Combinación lineal Σwᵢvᵢ — indicador ponderado']]
    : MATRIX_OPS;

  return (
    <div className="p-2 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-text">Operaciones (RF-10/11/12)</h1>
      <div className="bg-white p-4 rounded shadow flex gap-2 items-end flex-wrap">
        <div className="flex flex-col">
          <label className="text-xs">Tipo</label>
          <select value={tipo} onChange={(e) => { setTipo(e.target.value as any); setOp(e.target.value === 'vector' ? 'dot' : 'multiply'); }}
            className="border rounded px-2 py-2">
            <option value="vector">Vector</option>
            <option value="matriz">Matriz</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs">Operación</label>
          <select value={op} onChange={(e) => setOp(e.target.value)} className="border rounded px-2 py-2">
            {ops.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
        {tipo === 'vector' && op !== 'scalar' && op !== 'linear_combination' && (
          <>
            <InputField label="v1" value={a} onChange={(e) => setA(e.target.value)} />
            <InputField label="v2" value={b} onChange={(e) => setB(e.target.value)} />
          </>
        )}
        {tipo === 'vector' && op === 'scalar' && (
          <><InputField label="v1" value={a} onChange={(e) => setA(e.target.value)} />
            <InputField label="Escalar" value={scalar} onChange={(e) => setScalar(e.target.value)} /></>
        )}
        {tipo === 'vector' && op === 'linear_combination' && (
          <><InputField label="Vectores JSON" value={vecs} onChange={(e) => setVecs(e.target.value)} />
            <InputField label="Pesos" value={weights} onChange={(e) => setWeights(e.target.value)} /></>
        )}
        {tipo === 'matriz' && (
          <>
            <InputField label="Matriz A (JSON)" value={ma} onChange={(e) => setMa(e.target.value)} />
            {(op === 'add' || op === 'subtract' || op === 'multiply') &&
              <InputField label="Matriz B (JSON)" value={mb} onChange={(e) => setMb(e.target.value)} />}
            {op === 'scalar' && <InputField label="Escalar" value={scalar} onChange={(e) => setScalar(e.target.value)} />}
          </>
        )}
        <Button onClick={run}>Ejecutar con NumPy</Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {resultado && <div className="bg-slate-900 text-accent p-4 rounded font-mono">Resultado: {resultado}</div>}
      <p className="text-xs text-muted">CA-06: dimensiones incompatibles → 400. CA-08: cada operación queda en /historial.</p>
    </div>
  );
}
