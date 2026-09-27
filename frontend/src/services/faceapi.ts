/**
 * Servicio de reconocimiento facial (§8.1, librería @vladmandic/face-api).
 *
 * Los pesos del modelo (tiny detector + landmarks + descriptor de 128
 * dimensiones) se sirven desde /public/models. La carga es perezosa y se
 * hace una sola vez: el primer escaneo descarga ~7 MB, el resto de la
 * sesión ya tiene los modelos en memoria.
 */
/** Tipo del módulo: se carga bajo demanda (code-splitting). */
type FaceAPI = typeof import('@vladmandic/face-api');

let pending: Promise<FaceAPI> | null = null;

export function loadFaceModels(): Promise<FaceAPI> {
  if (!pending) {
    pending = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      return faceapi;
    })().catch((e) => {
      pending = null; // permite reintentar si falló la descarga
      throw e;
    });
  }
  return pending;
}

export const DESCRIPTOR_DIM = 128;

/**
 * Promedia varias capturas del mismo rostro (más estabilidad que una sola)
 * y normaliza el vector (norma 1), igual que hace face-api internamente.
 */
export function averageDescriptor(samples: Float32Array[]): number[] {
  const acc = new Array<number>(DESCRIPTOR_DIM).fill(0);
  for (const s of samples) {
    for (let i = 0; i < DESCRIPTOR_DIM && i < s.length; i++) acc[i] += s[i];
  }
  const norm = Math.sqrt(acc.reduce((sum, v) => sum + v * v, 0)) || 1;
  return acc.map((v) => v / norm);
}
