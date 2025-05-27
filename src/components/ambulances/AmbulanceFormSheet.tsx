
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label no es necesario si usamos FormLabel de react-hook-form integration
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAppData } from "@/contexts/AppDataContext";
import type { Ambulance } from "@/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

const ambulanceFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  licensePlate: z.string().min(3, { message: "La matrícula es obligatoria." }),
  model: z.string().min(2, { message: "El modelo es obligatorio." }),
  year: z.coerce.number().min(1900, { message: "El año debe ser válido." }).max(new Date().getFullYear() + 1, { message: "El año no puede ser muy futuro." }),
});

type AmbulanceFormValues = z.infer<typeof ambulanceFormSchema>;

interface AmbulanceFormSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ambulance?: Ambulance | null;
}

export function AmbulanceFormSheet({ isOpen, onOpenChange, ambulance }: AmbulanceFormSheetProps) {
  const { addAmbulance, updateAmbulance } = useAppData();
  const { user } = useAuth(); // Get user
  const { toast } = useToast();

  const form = useForm<AmbulanceFormValues>({
    resolver: zodResolver(ambulanceFormSchema),
    defaultValues: {
      name: "",
      licensePlate: "",
      model: "",
      year: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    if (ambulance) {
      form.reset({
        name: ambulance.name,
        licensePlate: ambulance.licensePlate,
        model: ambulance.model,
        year: ambulance.year,
      });
    } else {
      form.reset({
        name: "",
        licensePlate: "",
        model: "",
        year: new Date().getFullYear(),
      });
    }
  }, [ambulance, form, isOpen]);

  const onSubmit = (data: AmbulanceFormValues) => {
    if (user?.role !== 'admin') {
      toast({ title: "Acción no permitida", description: "Solo los administradores pueden gestionar ambulancias.", variant: "destructive" });
      onOpenChange(false);
      return;
    }

    if (ambulance) {
      updateAmbulance({ ...ambulance, ...data });
      toast({ title: "Ambulancia Actualizada", description: `La ambulancia ${data.name} ha sido actualizada correctamente.` });
    } else {
      addAmbulance(data);
      toast({ title: "Ambulancia Añadida", description: `La ambulancia ${data.name} ha sido añadida correctamente.` });
    }
    onOpenChange(false);
  };

  if (user?.role !== 'admin' && isOpen) {
    // Ensure sheet doesn't open for non-admins, or close it if already open by mistake
    onOpenChange(false); 
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{ambulance ? "Editar Ambulancia" : "Añadir Nueva Ambulancia"}</SheetTitle>
          <SheetDescription>
            {ambulance ? "Actualiza los detalles de la ambulancia." : "Completa los detalles para la nueva ambulancia."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre / Identificador</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., Ambulancia 01, Unidad 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., ABC 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., Mercedes Sprinter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ej., 2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="mt-8">
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </SheetClose>
              <Button type="submit">{ambulance ? "Guardar Cambios" : "Añadir Ambulancia"}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
