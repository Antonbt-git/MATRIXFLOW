export interface AuthUser {
  username: string;
  rol: 'admin' | 'analista' | 'consulta' | string;
  empresa_id: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
