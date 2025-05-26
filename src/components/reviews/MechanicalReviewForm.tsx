"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { ChecklistItem, MechanicalReview, ChecklistItemStatus, Ambulance } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const checklistItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre del ítem es obligatorio."),
  status: z.enum(['OK', 'Reparar', 'N/A'], { errorMap: () => ({ message: "Debe seleccionar un estado." }) }),
  notes: z.string().optional(),
});

const mechanicalReviewSchema = z.object({
  items: z.array(checklistItemSchema),
});

type MechanicalReviewFormValues = z.infer<typeof mechanicalReviewSchema>;

const defaultChecklistItems: Omit<ChecklistItem, 'id' | 'status' | 'notes'>[] = [
  { name: 'Frenos (Pastillas, Discos, Líquido)' },
  { name: 'Neumáticos (Presión, Dibujo, Daños)' },
  { name: 'Luces (Delanteras, Traseras, Intermitentes, Emergencia)' },
  { name: 'Motor (Aceite, Refrigerante, Correas, Mangueras)' },
  { name: 'Sistema de Dirección' },
  { name: 'Sistema de Suspensión' },
  { name: 'Batería y Sistema Eléctrico' },
  { name: 'Sirena y Sistema PA' },
  { name: 'Soportes de Equipamiento Médico' },
  { name: 'Cinturones de Seguridad (Todos los asientos)' },
  { name: 'Fugas de Fluidos (Aceite, Refrigerante, Combustible)' },
  { name: 'Sistema de Escape' },
  { name: 'Limpiaparabrisas y Líquido' },
  { name: 'Espejos (Laterales y Retrovisor)' },
  { name: 'Herramientas de Emergencia (Gato, Llave)' },
];

interface MechanicalReviewFormProps {
  ambulance: Ambulance;
}

export function MechanicalReviewForm({ ambulance }: MechanicalReviewFormProps) {
  const { saveMechanicalReview, getMechanicalReviewByAmbulanceId, updateAmbulanceWorkflowStep } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const existingReview = getMechanicalReviewByAmbulanceId(ambulance.id);

  const form = useForm<MechanicalReviewFormValues>({
    resolver: zodResolver(mechanicalReviewSchema),
    defaultValues: {
      items: existingReview?.items || defaultChecklistItems.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        name: item.name,
        status: 'N/A' as ChecklistItemStatus,
        notes: '',
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (existingReview) {
      form.reset({ items: existingReview.items.map(item => ({...item, status: item.status as ChecklistItemStatus})) });
    } else {
       form.reset({
        items: defaultChecklistItems.map((item, index) => ({
            id: `item-${Date.now()}-${index}`,
            name: item.name,
            status: 'N/A' as ChecklistItemStatus,
            notes: '',
        }))
       });
    }
  }, [existingReview, form]);

  const onSubmit = (data: MechanicalReviewFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para guardar una revisión.", variant: "destructive" });
      return;
    }
    const reviewData: Omit<MechanicalReview, 'id'> = {
      ambulanceId: ambulance.id,
      reviewerId: user.id,
      reviewDate: new Date().toISOString(),
      items: data.items.map(item => ({...item, status: item.status as ChecklistItemStatus})),
    };
    saveMechanicalReview(reviewData);
    updateAmbulanceWorkflowStep(ambulance.id, 'mechanical', true);
    toast({ title: "Revisión Guardada", description: `La revisión mecánica para ${ambulance.name} ha sido guardada.` });
    router.push(`/dashboard/ambulances/${ambulance.id}/cleaning`);
  };

  const handleAddItem = () => {
    append({ id: `custom-item-${Date.now()}`, name: '', status: 'N/A', notes: '' });
  };

  const statusOptions: { value: ChecklistItemStatus; label: string }[] = [
    { value: 'OK', label: 'OK' },
    { value: 'Reparar', label: 'Reparar' },
    { value: 'N/A', label: 'N/A' },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Lista de Verificación de Revisión Mecánica</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-card/50">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-start">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field: nameField }) => (
                           defaultChecklistItems.some(item => item.name === form.getValues(`items.${index}.name`)) ?
                           <Label className="font-semibold text-md pt-2 col-span-1 md:col-span-3">{nameField.value}</Label> :
                           <Input {...nameField} placeholder="Nombre ítem personalizado" className="font-semibold text-md"/>
                        )}
                      />
                      <div className="col-span-1 md:col-span-3">
                         <FormField
                            control={form.control}
                            name={`items.${index}.status`}
                            render={({ field: statusField }) => (
                                <>
                                <RadioGroup
                                    onValueChange={statusField.onChange}
                                    value={statusField.value}
                                    className="flex flex-col sm:flex-row gap-4"
                                >
                                    {statusOptions.map((statusOpt) => (
                                    <Label
                                        key={statusOpt.value}
                                        htmlFor={`${field.id}-${statusOpt.value}`}
                                        className={cn(
                                        "flex items-center space-x-2 cursor-pointer rounded-md border p-3 transition-colors hover:bg-accent hover:text-accent-foreground",
                                        statusField.value === statusOpt.value && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                                        )}
                                    >
                                        <RadioGroupItem value={statusOpt.value} id={`${field.id}-${statusOpt.value}`} />
                                        <span>{statusOpt.label}</span>
                                    </Label>
                                    ))}
                                </RadioGroup>
                                <FormMessage>{form.formState.errors.items?.[index]?.status?.message}</FormMessage>
                                </>
                            )}
                        />
                      </div>

                      {form.watch(`items.${index}.status`) === 'Reparar' && (
                        <div className="col-span-1 md:col-span-3 mt-2">
                           <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
                            render={({ field: notesField }) => (
                                <>
                                <Label htmlFor={`${field.id}-notes`} className="text-sm font-medium mb-1 block">Notas para Reparación</Label>
                                <Textarea
                                    id={`${field.id}-notes`}
                                    placeholder="Describe el problema y la reparación necesaria..."
                                    {...notesField}
                                    className="min-h-[60px]"
                                />
                                </>
                            )}
                            />
                        </div>
                      )}
                      {!defaultChecklistItems.some(item => item.name === form.getValues(`items.${index}.name`)) && (
                         <div className="col-span-1 md:col-span-3 flex justify-end mt-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4 mr-1" /> Eliminar Ítem
                            </Button>
                         </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <Button type="button" variant="outline" onClick={handleAddItem} className="mt-6">
                <PlusCircle className="h-4 w-4 mr-2" /> Añadir Ítem Personalizado
            </Button>
            <CardFooter className="mt-8 p-0 pt-6 flex justify-end">
              <Button type="submit" size="lg">Guardar Revisión y Continuar</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
