import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  roleId?: number;
  department: string;
  avatarUrl?: string | null;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const refreshed = await api.refreshSession();
        if (!active) return;
        setUser(refreshed?.user || null);
      } catch {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(user),
    isLoading,
    user,
    async login(username: string, password: string) {
      const data = await api.login(username, password);
      setUser(data.user);
    },
    async logout() {
      await api.logout();
      setUser(null);
    },
    async refreshUser() {
      const currentUser = await api.getMe();
      setUser({
        id: currentUser.id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        username: currentUser.username,
        role: currentUser.role.name,
        roleId: currentUser.roleId,
        department: currentUser.department,
        avatarUrl: currentUser.avatarUrl,
      });
    },
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

