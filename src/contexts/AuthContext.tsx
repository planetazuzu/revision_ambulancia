"use client";

import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: 'user1', name: 'Dr. García', role: 'reviewer' },
  { id: 'user2', name: 'Juan Limpieza', role: 'cleaner' },
  { id: 'user3', name: 'Admin Alicia', role: 'admin' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('ambuReviewUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (name: string) => {
    const foundUser = mockUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
    const loggedInUser = foundUser || { id: `user-${Date.now()}`, name: name || "Usuario Invitado", role: 'reviewer' }; // Default if not found or name is empty
    setUser(loggedInUser);
    localStorage.setItem('ambuReviewUser', JSON.stringify(loggedInUser));
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ambuReviewUser');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
