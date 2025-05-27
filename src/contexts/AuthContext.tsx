
"use client";

import type { User, Ambulance } from '@/types';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
// Import initialAmbulances to check for name matching
// This creates a dependency, ideally this logic might live elsewhere or be passed
// For this mock, direct import is simpler.
import { initialAmbulances } from './AppDataContext';


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
  { id: 'amb001user', name: 'Ambulancia 01', role: 'reviewer' }, // Example user matching an ambulance name
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // setLoading(true); // Ensure loading is true at the start
    const storedUser = localStorage.getItem('ambuReviewUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (name: string) => {
    let loggedInUser: User | undefined = mockUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
    
    if (!loggedInUser) {
      loggedInUser = { id: `user-${Date.now()}`, name: name || "Usuario Invitado", role: 'reviewer' };
    }

    // Assign ambulance if not admin and name matches an ambulance
    if (loggedInUser.role !== 'admin') {
      const assignedAmbulance = initialAmbulances.find(
        (amb: Ambulance) => amb.name.toLowerCase() === loggedInUser!.name.toLowerCase()
      );
      if (assignedAmbulance) {
        loggedInUser.assignedAmbulanceId = assignedAmbulance.id;
      }
    }
    
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
