
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Ambulance, KeyRound } from 'lucide-react';

export default function ValidateAmbulancePage() {
  const router = useRouter();
  const { user, assignAmbulanceToCurrentUser, loading: authLoading } = useAuth();
  const { getAmbulanceByName, updateAmbulanceCheckInDetails } = useAppData();
  const { toast } = useToast();

  const [ambulanceName, setAmbulanceName] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user is already assigned or not a 'usuario'
  if (!authLoading && user && (user.role !== 'usuario' || user.assignedAmbulanceId)) {
    router.replace('/dashboard');
    return null; 
  }
  
  // Redirect if no user, back to login
  if (!authLoading && !user) {
    router.replace('/');
    return null;
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user || user.role !== 'usuario') {
      toast({ title: "Error de Autenticación", description: "No estás autorizado para realizar esta acción.", variant: "destructive" });
      setIsLoading(false);
      router.push('/'); // Redirect to login if something is wrong with user state
      return;
    }

    const ambulance = getAmbulanceByName(ambulanceName);

    if (!ambulance) {
      toast({ title: "Ambulancia no encontrada", description: `No se encontró ninguna ambulancia con el identificador "${ambulanceName}". Verifica el nombre e inténtalo de nuevo.`, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const kmValue = parseInt(kilometers, 10);
    if (isNaN(kmValue) || kmValue < 0) {
      toast({ title: "Kilometraje Inválido", description: "Por favor, introduce un número de kilómetros válido.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      updateAmbulanceCheckInDetails(ambulance.id, kmValue, user.id);
      assignAmbulanceToCurrentUser(ambulance.id);
      toast({ title: "Validación Exitosa", description: `Te has registrado en ${ambulance.name} con ${kmValue} km.` });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error during ambulance validation:", error);
      toast({ title: "Error", description: "Ocurrió un error al validar la ambulancia.", variant: "destructive" });
      setIsLoading(false);
    }
  };
  
  if (authLoading || (user && user.role === 'usuario' && user.assignedAmbulanceId)) {
     return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Registrar Ambulancia y Kilometraje</CardTitle>
          <CardDescription>
            Bienvenido, {user?.name}. Por favor, identifica tu ambulancia y registra el kilometraje actual para comenzar tu turno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ambulanceName">Identificador de Ambulancia</Label>
              <Input
                id="ambulanceName"
                placeholder="ej. Ambulancia 01, Unidad Rápida B1"
                required
                value={ambulanceName}
                onChange={(e) => setAmbulanceName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kilometers">Kilometraje Actual</Label>
              <Input
                id="kilometers"
                type="number"
                placeholder="ej. 12345"
                required
                value={kilometers}
                onChange={(e) => setKilometers(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !ambulanceName || !kilometers}>
              {isLoading ? 'Validando...' : 'Validar y Continuar'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground pt-4">
            <p>Introduce el nombre exacto de la ambulancia tal como está registrada en el sistema.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
