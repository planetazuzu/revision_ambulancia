"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Ambulance, CleaningLog } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const cleaningLogSchema = z.object({
  materialsUsed: z.string().min(3, "Por favor, lista los materiales usados."),
  observations: z.string().optional(),
});

type CleaningLogFormValues = z.infer<typeof cleaningLogSchema>;

interface CleaningLogFormProps {
  ambulance: Ambulance;
}

export function CleaningLogForm({ ambulance }: CleaningLogFormProps) {
  const { addCleaningLog, updateAmbulanceWorkflowStep } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CleaningLogFormValues>({
    resolver: zodResolver(cleaningLogSchema),
    defaultValues: {
      materialsUsed: "",
      observations: "",
    },
  });

  const onSubmit = (data: CleaningLogFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    const logData: Omit<CleaningLog, 'id'> = {
      ambulanceId: ambulance.id,
      responsiblePersonId: user.id,
      dateTime: new Date().toISOString(),
      materialsUsed: data.materialsUsed,
      observations: data.observations,
    };
    addCleaningLog(logData);
    updateAmbulanceWorkflowStep(ambulance.id, 'cleaning', true);
    toast({ title: "Limpieza Registrada", description: `La limpieza para ${ambulance.name} ha sido registrada.` });
    router.push(`/dashboard/ambulances/${ambulance.id}/inventory`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Registrar Tarea de Limpieza</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="materialsUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materiales y Medios Usados</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., Toallitas desinfectantes, aspiradora, solución de lejía" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ej., Suciedad intensa en asientos, áreas específicas que requieren atención extra." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-muted-foreground">
              Fecha, hora y persona responsable ({user?.name || 'Usuario Actual'}) se registrarán automáticamente.
            </p>
            <CardFooter className="p-0 pt-6 flex justify-end">
              <Button type="submit" size="lg">Registrar Limpieza y Continuar</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
