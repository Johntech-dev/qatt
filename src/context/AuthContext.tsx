'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  matricNumber?: string | null;
  level?: string | null;
  department: string;
  institution: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (data: SignupData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: Role;
  matricNumber?: string;
  level?: string;
  department: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? 'Login failed' };
    setUser(data.user);
    setToken(data.token);
    return {};
  };

  const signup = async (signupData: SignupData) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(signupData),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? 'Signup failed' };
    setUser(data.user);
    setToken(data.token);
    return {};
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
