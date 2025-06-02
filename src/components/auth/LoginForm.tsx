
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, LogIn } from 'lucide-react'; // Added LogIn for main button

export default function LoginForm() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(name);
  };

  const handleTestUserLogin = (testUser: string) => {
    // Optionally pre-fill fields for visual feedback, then log in
    setName(testUser);
    setPassword("123456"); // Mock password as in the image's help text
    login(testUser);
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        {/* Icono de ambulancia eliminado de aquí para coincidir con el nuevo diseño, se podría poner encima de la tarjeta en page.tsx si se desea */}
        <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder a AmbuGestión.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Usuario</Label>
            <Input
              id="name"
              placeholder="Introduce tu usuario" // Cambiado de "ej. Alicia Coordinadora..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <a href="#" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar sesión
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-4 pt-6">
        <div className="text-sm">
          ¿No tienes una cuenta?{' '}
          <a href="#" className="text-primary hover:underline">
            Crear cuenta
          </a>
        </div>

        <div className="w-full pt-4">
          <p className="text-center text-xs text-muted-foreground mb-3">Cuentas de prueba (contraseña simulada)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['Alicia Coordinadora', 'Ambulancia 01', 'Carlos Usuario'] as const).map((userType) => (
              <Button
                key={userType}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleTestUserLogin(userType)}
              >
                {userType}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
