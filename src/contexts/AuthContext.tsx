
"use client";

import type { User, Ambulance } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { initialAmbulances } from './AppDataContext'; // Assuming initialAmbulances is exported


interface AuthContextType {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
  loading: boolean;
  assignAmbulanceToCurrentUser: (ambulanceId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: 'userCoordinador', name: 'Alicia Coordinadora', role: 'coordinador' },
  { id: 'amb001user', name: 'Ambulancia 01', role: 'usuario' }, // This user's name matches an ambulance name
  { id: 'userGenerico', name: 'Carlos Usuario', role: 'usuario' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentPathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('ambuReviewUser');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      // Redirect if user needs validation but isn't on validation page
      if (parsedUser.role === 'usuario' && !parsedUser.assignedAmbulanceId && currentPathname !== '/validate-ambulance' && currentPathname !== '/') {
         router.replace('/validate-ambulance');
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount, redirection logic inside login or main layout now


  const login = (name: string) => {
    setLoading(true);
    let loggedInUser: User | undefined = mockUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
    
    if (!loggedInUser) {
      loggedInUser = { id: `user-${Date.now()}`, name: name || "Usuario Invitado", role: 'usuario' };
    }

    const tempUser = {...loggedInUser}; // Create a mutable copy

    if (tempUser.role === 'usuario') {
      const assignedAmbulance = initialAmbulances.find(
        (amb: Ambulance) => amb.name.toLowerCase() === tempUser.name.toLowerCase()
      );
      if (assignedAmbulance) {
        tempUser.assignedAmbulanceId = assignedAmbulance.id;
      } else {
        delete tempUser.assignedAmbulanceId; 
      }
    } else {
        delete tempUser.assignedAmbulanceId;
    }
    
    setUser(tempUser);
    localStorage.setItem('ambuReviewUser', JSON.stringify(tempUser));

    if (tempUser.role === 'usuario' && !tempUser.assignedAmbulanceId) {
      router.push('/validate-ambulance');
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ambuReviewUser');
    router.push('/');
  };

  const assignAmbulanceToCurrentUser = (ambulanceId: string) => {
    if (user && user.role === 'usuario') {
      const updatedUser = { ...user, assignedAmbulanceId: ambulanceId };
      setUser(updatedUser);
      localStorage.setItem('ambuReviewUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, assignAmbulanceToCurrentUser }}>
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
