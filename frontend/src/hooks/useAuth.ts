/** useAuth (§17): sesión desde localStorage con ciclo de vida de login/logout. */
import { useState } from 'react';
import { getStoredUser, logout as doLogout } from '../services/auth';
import type { AuthUser } from '../types/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading] = useState(false);

  const logout = () => {
    doLogout();
    setUser(null);
  };

  return { user, setUser, loading, logout };
}
