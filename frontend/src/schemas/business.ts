/** §17: src/schemas/ — validación Zod compartida frontend (§8.1 React Hook Form + Zod). */
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const vectorSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  valores: z.string().regex(/^[\d\s,.-]+$/, 'Solo números separados por coma'),
});
export type VectorInput = z.infer<typeof vectorSchema>;

export const ventaSchema = z.object({
  sucursal_id: z.coerce.number().int().positive(),
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive('Debe ser > 0'),
});
export type VentaInput = z.infer<typeof ventaSchema>;
