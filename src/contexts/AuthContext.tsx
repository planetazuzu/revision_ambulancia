
"use client";

import type { User, Ambulance } from '@/types';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { initialAmbulances } from './AppDataContext';


interface AuthContextType {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: 'userCoordinador', name: 'Alicia Coordinadora', role: 'coordinador' },
  { id: 'amb001user', name: 'Ambulancia 01', role: 'usuario' }, // This user's name matches an ambulance name
  { id: 'userGenerico', name: 'Carlos Usuario', role: 'usuario' }, // Generic user, won't match an ambulance
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
    setLoading(true);
    let loggedInUser: User | undefined = mockUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
    
    if (!loggedInUser) {
      // Default to 'usuario' if name not in mockUsers, or create a more specific logic
      loggedInUser = { id: `user-${Date.now()}`, name: name || "Usuario Invitado", role: 'usuario' };
    }

    // Assign ambulance if role is 'usuario' and name matches an ambulance
    if (loggedInUser.role === 'usuario') {
      const assignedAmbulance = initialAmbulances.find(
        (amb: Ambulance) => amb.name.toLowerCase() === loggedInUser!.name.toLowerCase()
      );
      if (assignedAmbulance) {
        loggedInUser.assignedAmbulanceId = assignedAmbulance.id;
      } else {
        delete loggedInUser.assignedAmbulanceId; // Ensure no assignment if no match
      }
    } else {
        delete loggedInUser.assignedAmbulanceId; // Coordinators don't have specific ambulance assignments
    }
    
    setUser(loggedInUser);
    localStorage.setItem('ambuReviewUser', JSON.stringify(loggedInUser));
    router.push('/dashboard');
    setLoading(false);
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
