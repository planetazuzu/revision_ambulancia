
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

interface MechanicalReviewFormProps {
  ambulance: Ambulance;
}

export function MechanicalReviewForm({ ambulance }: MechanicalReviewFormProps) {
  const { saveMechanicalReview, getMechanicalReviewByAmbulanceId, updateAmbulanceWorkflowStep, getConfigurableMechanicalReviewItems } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const existingReview = useMemo(() => getMechanicalReviewByAmbulanceId(ambulance.id), [getMechanicalReviewByAmbulanceId, ambulance.id]);
  const configurableItems = useMemo(() => getConfigurableMechanicalReviewItems(), [getConfigurableMechanicalReviewItems]);

  const form = useForm<MechanicalReviewFormValues>({
    resolver: zodResolver(mechanicalReviewSchema),
    defaultValues: {
      items: [], 
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ // Added replace
    control: form.control,
    name: "items",
  });

  const initializeFormItems = useCallback(() => {
    const initialItems = existingReview
      ? existingReview.items.map(item => ({...item, status: item.status as ChecklistItemStatus}))
      : configurableItems.map((item, index) => ({
          id: `default-${ambulance.id}-${index}-${item.name.replace(/\s+/g, '-').toLowerCase().slice(0,30)}`, 
          name: item.name,
          status: 'N/A' as ChecklistItemStatus,
          notes: '',
        }));
    replace(initialItems); // Use replace to set the items
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingReview, configurableItems, ambulance.id, replace]);


  useEffect(() => {
    initializeFormItems();
  }, [initializeFormItems]); 

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
    append({ id: `custom-item-${Date.now()}-${fields.length}`, name: '', status: 'N/A', notes: '' });
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
            <ScrollArea className="h-[calc(100vh-26rem)] md:h-[500px] pr-4"> 
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-card/50"> 
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-start">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field: nameField }) => (
                           configurableItems.some(defaultItem => defaultItem.name === form.getValues(`items.${index}.name`)) || (existingReview && existingReview.items.find(i => i.id === field.id)) ?
                           <FormItem className="col-span-1 md:col-span-3">
                             <FormLabel className="font-semibold text-md pt-2 ">{nameField.value}</FormLabel>
                           </FormItem>
                            :
                           <FormItem className="col-span-1 md:col-span-3">
                             <FormLabel className="sr-only">Nombre ítem personalizado</FormLabel>
                             <FormControl>
                               <Input {...nameField} placeholder="Nombre ítem personalizado" className="font-semibold text-md"/>
                             </FormControl>
                             <FormMessage/>
                           </FormItem>
                        )}
                      />
                      <div className="col-span-1 md:col-span-3">
                         <FormField
                            control={form.control}
                            name={`items.${index}.status`}
                            render={({ field: statusField }) => (
                                <FormItem>
                                <FormLabel className="sr-only">Estado</FormLabel>
                                <RadioGroup
                                    onValueChange={statusField.onChange}
                                    value={statusField.value}
                                    className="flex flex-col sm:flex-row gap-2 sm:gap-4" 
                                >
                                    {statusOptions.map((statusOpt) => (
                                    <FormItem key={statusOpt.value} className="flex-1">
                                        <FormControl>
                                        <RadioGroupItem value={statusOpt.value} id={`${field.id}-${statusOpt.value}`} className="sr-only peer"/>
                                        </FormControl>
                                        <Label
                                            htmlFor={`${field.id}-${statusOpt.value}`}
                                            className={cn(
                                            "flex items-center justify-center space-x-2 cursor-pointer rounded-md border p-3 transition-colors hover:bg-accent hover:text-accent-foreground min-w-[80px]", 
                                            "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:hover:bg-primary/90"
                                            )}
                                        >
                                        <span>{statusOpt.label}</span>
                                        </Label>
                                    </FormItem>
                                    ))}
                                </RadioGroup>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>

                      {form.watch(`items.${index}.status`) === 'Reparar' && (
                        <div className="col-span-1 md:col-span-3 mt-2">
                           <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
                            render={({ field: notesField }) => (
                                <FormItem>
                                <FormLabel htmlFor={`${field.id}-notes`} className="text-sm font-medium mb-1 block">Notas para Reparación</FormLabel>
                                <FormControl>
                                <Textarea
                                    id={`${field.id}-notes`}
                                    placeholder="Describe el problema y la reparación necesaria..."
                                    {...notesField}
                                    className="min-h-[60px]"
                                />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                      )}
                      {!(configurableItems.some(defaultItem => defaultItem.name === form.getValues(`items.${index}.name`)) || (existingReview && existingReview.items.find(i => i.id === field.id && configurableItems.some(ci => ci.name === i.name )))) && (
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
            <div className="mt-6 flex justify-start"> 
                <Button type="button" variant="outline" onClick={handleAddItem}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Ítem Personalizado
                </Button>
            </div>
            <CardFooter className="mt-8 p-0 pt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty && fields.length === 0}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar Revisión y Continuar"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
