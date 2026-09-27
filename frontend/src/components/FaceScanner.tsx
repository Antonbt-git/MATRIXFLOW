/**
 * FaceScanner: cámara web + escaneo facial en vivo.
 *
 * Al iniciar, carga los modelos, abre la webcam, detecta el rostro y captura
 * varias muestras del descriptor de 128 dimensiones. Cuando tiene las
 * muestras necesarias detiene la cámara y devuelve el descriptor promedio
 * (onCapture) para que la página lo registre o lo verifique contra el DNI.
 */
import React, { useEffect, useRef, useState } from 'react';
import { loadFaceModels, averageDescriptor, DESCRIPTOR_DIM } from '../services/faceapi';
import { Button } from './UI';

type Estado = 'idle' | 'modelos' | 'camara' | 'escaneando' | 'capturado' | 'error';

interface Props {
  onCapture: (descriptor: number[]) => void;
  /** número de muestras a promediar (por defecto 5) */
  muestras?: number;
  /** deshabilita el inicio del escaneo (ej. DNI vacío) */
  disabled?: boolean;
}

const FaceScanner: React.FC<Props> = ({ onCapture, muestras = 5, disabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const activeRef = useRef(false);

  const [estado, setEstado] = useState<Estado>('idle');
  const [mensaje, setMensaje] = useState('');
  const [capturas, setCapturas] = useState(0);

  const stop = () => {
    activeRef.current = false;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => stop(), []);

  const loop = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const faceapi = await loadFaceModels();
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 });

    timerRef.current = window.setInterval(async () => {
      if (!activeRef.current || video.readyState < 2) return;
      try {
        const det = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        // recuadro sobre el rostro detectado
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (det) {
            const box = det.detection.box;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }
        }

        if (det && det.descriptor.length === DESCRIPTOR_DIM) {
          samplesRef.current.push(det.descriptor as Float32Array);
          setCapturas(samplesRef.current.length);
          setMensaje(`Rostro detectado — muestra ${samplesRef.current.length}/${muestras}`);
          if (samplesRef.current.length >= muestras) {
            const descriptor = averageDescriptor(samplesRef.current);
            stop();
            setEstado('capturado');
            setMensaje('Rostro capturado ✓');
            onCapture(descriptor);
          }
        } else {
          setMensaje('Buscando rostro… mira a la cámara');
        }
      } catch {
        /* frame descartado: se reintenta en el siguiente tick */
      }
    }, 350);
  };

  const start = async () => {
    if (disabled || estado === 'modelos' || estado === 'camara' || estado === 'escaneando') return;
    samplesRef.current = [];
    setCapturas(0);
    try {
      setEstado('modelos');
      setMensaje('Cargando modelos de IA…');
      await loadFaceModels();

      setEstado('camara');
      setMensaje('Solicitando permiso de cámara…');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      video.srcObject = stream;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      await video.play();

      activeRef.current = true;
      setEstado('escaneando');
      setMensaje('Buscando rostro… mira a la cámara');
      await loop(video, canvas);
    } catch (e: any) {
      stop();
      setEstado('error');
      setMensaje(
        e?.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Actívalo en el navegador.'
          : `No se pudo iniciar el escaneo: ${e?.message || e}`,
      );
    }
  };

  const cancelar = () => { stop(); setEstado('idle'); setMensaje(''); setCapturas(0); };

  const escaneando = estado === 'modelos' || estado === 'camara' || estado === 'escaneando';

  return (
    <div className="flex flex-col gap-3">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1]"
        />
        {!escaneando && estado !== 'capturado' && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Cámara apagada
          </div>
        )}
        {escaneando && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">{mensaje}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!escaneando && (
          <Button onClick={start} disabled={disabled}>
            {estado === 'capturado' ? 'Escanear de nuevo' : 'Iniciar escaneo facial'}
          </Button>
        )}
        {escaneando && <Button variant="secondary" onClick={cancelar}>Cancelar</Button>}
        {escaneando && (
          <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min(100, (capturas / muestras) * 100)}%` }}
            />
          </div>
        )}
      </div>
      {mensaje && !escaneando && (
        <p className={`text-sm ${estado === 'error' ? 'text-red-600' : 'text-slate-600'}`}>{mensaje}</p>
      )}
    </div>
  );
};

export default FaceScanner;
