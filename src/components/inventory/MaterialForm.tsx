
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { ConsumableMaterial, NonConsumableMaterial, Ambulance, AmbulanceStorageLocation } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const consumableSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  reference: z.string().min(1, "La referencia es obligatoria"),
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
  expiryDate: z.date({ required_error: "La fecha de caducidad es obligatoria." }),
  storageLocation: z.string().optional(),
});

const nonConsumableSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  serialNumber: z.string().min(1, "El número de serie es obligatorio"),
  status: z.enum(['Operacional', 'Necesita Reparación', 'Fuera de Servicio'], { errorMap: () => ({ message: "Debe seleccionar un estado."}) }),
  storageLocation: z.string().optional(),
});

interface MaterialFormProps {
  ambulance: Ambulance;
  materialType: 'consumable' | 'non-consumable';
  material?: ConsumableMaterial | NonConsumableMaterial | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function MaterialForm({ ambulance, materialType, material, isOpen, onOpenChange }: MaterialFormProps) {
  const { addConsumableMaterial, updateConsumableMaterial, addNonConsumableMaterial, updateNonConsumableMaterial, getAmbulanceStorageLocations } = useAppData();
  const { toast } = useToast();

  const ambulanceStorageOptions = getAmbulanceStorageLocations();

  const currentSchema = materialType === 'consumable' ? consumableSchema : nonConsumableSchema;
  type CurrentFormValues = z.infer<typeof currentSchema>;

  const form = useForm<CurrentFormValues>({
    resolver: zodResolver(currentSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (material) {
        if (materialType === 'consumable' && 'expiryDate' in material) {
          form.reset({
            ...material,
            expiryDate: new Date(material.expiryDate),
            storageLocation: material.storageLocation || "",
          } as CurrentFormValues);
        } else {
          form.reset({
            ...material,
            storageLocation: material.storageLocation || "",
          } as CurrentFormValues);
        }
      } else {
        form.reset(
          materialType === 'consumable'
            ? { name: '', reference: '', quantity: 0, expiryDate: new Date(), storageLocation: "" }
            : { name: '', serialNumber: '', status: 'Operacional', storageLocation: "" }
        );
      }
    }
  }, [material, materialType, form, isOpen]);

  const onSubmit = (data: CurrentFormValues) => {
    const commonToastParams = { title: material ? "Material Actualizado" : "Material Añadido" };
    if (materialType === 'consumable') {
      const consumableData = data as z.infer<typeof consumableSchema>;
      const payload = {
        ...consumableData,
        ambulanceId: ambulance.id,
        expiryDate: consumableData.expiryDate.toISOString(),
        storageLocation: consumableData.storageLocation || undefined,
      };
      if (material) {
        updateConsumableMaterial({ ...material as ConsumableMaterial, ...payload });
      } else {
        addConsumableMaterial(payload);
      }
      toast({...commonToastParams, description: `${consumableData.name} (Consumible) procesado.`});
    } else {
      const nonConsumableData = data as z.infer<typeof nonConsumableSchema>;
       const payload = {
        ...nonConsumableData,
        ambulanceId: ambulance.id,
        storageLocation: nonConsumableData.storageLocation || undefined,
      };
      if (material) {
        updateNonConsumableMaterial({ ...material as NonConsumableMaterial, ...payload });
      } else {
        addNonConsumableMaterial(payload);
      }
      toast({...commonToastParams, description: `${nonConsumableData.name} (No Consumible) procesado.`});
    }
    onOpenChange(false);
  };

  const nonConsumableStatusOptions = [
    { value: 'Operacional', label: 'Operacional' },
    { value: 'Necesita Reparación', label: 'Necesita Reparación' },
    { value: 'Fuera de Servicio', label: 'Fuera de Servicio' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{material ? 'Editar' : 'Añadir'} Material {materialType === 'consumable' ? 'Consumible' : 'No Consumible'}</DialogTitle>
          <DialogDescription>
            Completa los detalles del material.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="ej. Venda elástica" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {materialType === 'consumable' && (
              <>
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia</FormLabel>
                      <FormControl><Input placeholder="ej. LOTE-123" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl><Input type="number" placeholder="ej. 10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Caducidad</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Elige una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {materialType === 'non-consumable' && (
              <>
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Serie</FormLabel>
                      <FormControl><Input placeholder="ej. SN-XYZ789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nonConsumableStatusOptions.map(option => (
                             <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="storageLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación de Almacenamiento (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ubicación..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">-- Sin especificar --</SelectItem>
                      {ambulanceStorageOptions.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">{material ? 'Guardar Cambios' : 'Añadir Material'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
