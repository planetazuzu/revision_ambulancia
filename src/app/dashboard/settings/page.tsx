
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from '@/components/shared/PageHeader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Mail, Save, Trash2, AlertTriangle } from 'lucide-react';

const settingsSchema = z.object({
  notificationEmail: z.string().email({ message: "Por favor, introduce un email válido." }).or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getNotificationEmailConfig, setNotificationEmailConfig } = useAppData();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      notificationEmail: '',
    },
  });

  useEffect(() => {
    if (!authLoading && user?.role === 'coordinador') {
      const currentEmail = getNotificationEmailConfig();
      form.setValue('notificationEmail', currentEmail || '');
    } else if (!authLoading && user?.role !== 'coordinador') {
      toast({
        title: "Acceso Denegado",
        description: "No tienes permiso para acceder a esta página.",
        variant: "destructive",
      });
      router.replace('/dashboard');
    }
  }, [user, authLoading, router, toast, getNotificationEmailConfig, form]);

  const onSubmit = (data: SettingsFormValues) => {
    setNotificationEmailConfig(data.notificationEmail.trim() || null);
    toast({
      title: "Configuración Guardada",
      description: data.notificationEmail.trim() 
        ? `El email de notificaciones se ha establecido en ${data.notificationEmail.trim()}.`
        : "Se ha borrado el email de notificaciones.",
    });
  };

  const handleClearEmail = () => {
    form.setValue('notificationEmail', '');
    setNotificationEmailConfig(null);
     toast({
      title: "Configuración Borrada",
      description: "El email de notificaciones ha sido borrado.",
    });
  }

  if (authLoading || !user) {
    return <div className="p-6">Cargando...</div>;
  }
  
  if (user.role !== 'coordinador') {
     return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-full">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground">Esta sección es solo para coordinadores.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-6">
          Volver al Panel Principal
        </Button>
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        title="Configuración del Sistema"
        description="Gestiona la configuración general de la aplicación."
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email para Notificaciones de Alertas Críticas</CardTitle>
          <CardDescription>
            Introduce una dirección de email para recibir (simulaciones de) notificaciones cuando ocurran alertas críticas en el sistema. 
            Esta configuración es local para tu navegador.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección de Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ejemplo@dominio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground pt-1">
                      Deja este campo vacío para no recibir notificaciones.
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={handleClearEmail} disabled={!form.getValues('notificationEmail')}>
                <Trash2 className="mr-2 h-4 w-4" /> Borrar Email
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                <Save className="mr-2 h-4 w-4" /> Guardar Cambios
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
