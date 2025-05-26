
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { Space } from '@/types';
import { useToast } from '@/hooks/use-toast';

const spaceSchema = z.object({
  name: z.string().min(3, "El nombre del espacio debe tener al menos 3 caracteres."),
});

type SpaceFormValues = z.infer<typeof spaceSchema>;

interface SpaceFormDialogProps {
  space?: Space | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => Promise<void>; // Make onSave async
}

export function SpaceFormDialog({ space, isOpen, onOpenChange, onSave }: SpaceFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (space) {
        form.reset({ name: space.name });
      } else {
        form.reset({ name: '' });
      }
    }
  }, [space, isOpen, form]);

  const onSubmit = async (data: SpaceFormValues) => {
    const url = space ? `/api/spaces/${space.id}` : '/api/spaces';
    const method = space ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `La solicitud ${method} falló`);
      }

      toast({
        title: space ? "Espacio Actualizado" : "Espacio Creado",
        description: `El espacio "${data.name}" ha sido procesado correctamente.`,
      });
      await onSave(); // Call onSave which should re-fetch spaces and close dialog
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el espacio.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{space ? 'Editar Espacio' : 'Añadir Nuevo Espacio'}</DialogTitle>
          <DialogDescription>
            Introduce el nombre para el espacio de almacenamiento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Espacio</FormLabel>
                  <FormControl><Input placeholder="ej. Almacén Principal, Mochila UCI" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (space ? 'Guardando...' : 'Creando...') : (space ? 'Guardar Cambios' : 'Crear Espacio')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    