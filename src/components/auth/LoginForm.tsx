"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { Ambulance } from 'lucide-react'; // Using Ambulance icon for logo

export default function LoginForm() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); // Password is not used in mock auth
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send credentials to a backend. Here, we just use the name for mock login.
    login(name);
  };

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <Ambulance className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Acceso AmbuReview</CardTitle>
        <CardDescription>Introduce tus credenciales para acceder al sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Usuario</Label>
            <Input
              id="name"
              placeholder="ej. Dr. García"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">Iniciar Sesión</Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm">
        <p>Usa cualquier nombre de usuario. El campo de contraseña es para demostración.</p>
      </CardFooter>
    </Card>
  );
}
