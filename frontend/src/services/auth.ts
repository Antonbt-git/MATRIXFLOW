import type { AuthUser, LoginResponse } from '../types/auth';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

export async function login(username: string, password: string): Promise<AuthUser> {
  // El backend usa OAuth2PasswordRequestForm -> espera form-urlencoded, no JSON
  const body = new URLSearchParams();
  body.set('username', username);
  body.set('password', password);

  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Usuario o contraseña incorrectos');
    }
    throw new Error(`Error de autenticación (${response.status})`);
  }

  const data: LoginResponse = await response.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * fetch autenticado: agrega el Bearer token automáticamente y, si el backend
 * responde 401 (token vencido o inválido), limpia la sesión para forzar
 * un nuevo login.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    logout();
    window.location.reload();
  }

  return response;
}
