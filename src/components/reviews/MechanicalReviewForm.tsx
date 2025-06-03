
"use client";

import { useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { ChecklistItem, MechanicalReview, ChecklistItemStatus, Ambulance, ConfigurableMechanicalReviewItem } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const checklistItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre del ítem es obligatorio."),
  status: z.enum(['OK', 'Reparar', 'N/A'], { errorMap: () => ({ message: "Debe seleccionar un estado." }) }),
  notes: z.string().optional(),
  category: z.string().optional(), // Será obligatorio para nuevos, opcional para existentes
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

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "fieldId", // Use a different key name than 'id' to avoid conflict with your item's 'id'
  });

  const initializeFormItems = useCallback(() => {
    const initialItems: ChecklistItem[] = existingReview
      ? existingReview.items.map(item => ({
          ...item,
          id: item.id || `existing-${ambulance.id}-${item.name.replace(/\s+/g, '-')}`, // Ensure ID exists
          status: item.status as ChecklistItemStatus,
          category: item.category || "Otros" // Fallback category for old items
        }))
      : configurableItems.map((configItem) => ({
          id: configItem.id, // Use the ID from the configurable item
          name: configItem.name,
          category: configItem.category,
          status: 'N/A' as ChecklistItemStatus,
          notes: '',
        }));
    replace(initialItems);
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
      items: data.items.map(item => ({
        id: item.id,
        name: item.name,
        status: item.status as ChecklistItemStatus,
        notes: item.notes,
        category: item.category || "Personalizados", // Ensure category exists
      })),
    };
    saveMechanicalReview(reviewData);
    updateAmbulanceWorkflowStep(ambulance.id, 'mechanical', true);
    toast({ title: "Revisión Guardada", description: `La revisión mecánica para ${ambulance.name} ha sido guardada.` });
    router.push(`/dashboard/ambulances/${ambulance.id}/cleaning`);
  };

  const handleAddItem = () => {
    append({ 
      id: `custom-item-${Date.now()}-${fields.length}`, 
      name: '', 
      status: 'N/A', 
      notes: '',
      category: 'Personalizados' // Default category for custom items
    });
  };

  const statusOptions: { value: ChecklistItemStatus; label: string }[] = [
    { value: 'OK', label: 'OK' },
    { value: 'Reparar', label: 'Reparar' },
    { value: 'N/A', label: 'N/A' },
  ];

  const groupedItems = useMemo(() => {
    return fields.reduce((acc, item, index) => {
      const category = form.watch(`items.${index}.category`) || "Otros"; // Use form.watch to get current category
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ ...item, originalIndex: index }); // Store originalIndex if needed for remove
      return acc;
    }, {} as Record<string, (typeof fields[number] & { originalIndex: number })[]>);
  }, [fields, form]);
  
  const categoryOrder = useMemo(() => {
    // Define a preferred order, then add any other categories
    const preferredOrder = ["Motor y Niveles", "Frenos", "Neumáticos y Suspensión", "Luces y Señalización", "Equipamiento Específico Ambulancia", "Cabina y Documentación", "General y Seguridad"];
    const allCategories = Array.from(new Set([...preferredOrder, ...Object.keys(groupedItems)]));
    if (groupedItems["Personalizados"]) { // Ensure "Personalizados" is last
      allCategories.push(allCategories.splice(allCategories.indexOf("Personalizados"), 1)[0]);
    }
     if (groupedItems["Otros"] && allCategories.includes("Otros")) {
      allCategories.push(allCategories.splice(allCategories.indexOf("Otros"), 1)[0]);
    }
    return allCategories.filter(cat => groupedItems[cat] && groupedItems[cat].length > 0); // Only include categories with items
  }, [groupedItems]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Lista de Verificación de Revisión Mecánica</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[calc(100vh-26rem)] md:h-[calc(100vh-24rem)] pr-4">
              <Accordion type="multiple" className="w-full" defaultValue={categoryOrder.length > 0 ? [categoryOrder[0]] : []}>
                {categoryOrder.map(categoryName => (
                  <AccordionItem value={categoryName} key={categoryName}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                      {categoryName} ({groupedItems[categoryName]?.length || 0} ítems)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-2">
                        {groupedItems[categoryName]?.map((itemField) => (
                          <Card key={itemField.fieldId} className="p-4 bg-card/50">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-start">
                              <FormField
                                control={form.control}
                                name={`items.${itemField.originalIndex}.name`}
                                render={({ field: nameField }) => (
                                  configurableItems.some(defaultItem => defaultItem.id === itemField.id) || (existingReview && existingReview.items.find(i => i.id === itemField.id)) ?
                                  <FormItem className="col-span-1 md:col-span-3">
                                    <FormLabel className="font-semibold text-md pt-2">{nameField.value}</FormLabel>
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
                                  name={`items.${itemField.originalIndex}.status`}
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
                                              <RadioGroupItem value={statusOpt.value} id={`${itemField.fieldId}-${statusOpt.value}`} className="sr-only peer"/>
                                            </FormControl>
                                            <Label
                                              htmlFor={`${itemField.fieldId}-${statusOpt.value}`}
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
                              {form.watch(`items.${itemField.originalIndex}.status`) === 'Reparar' && (
                                <div className="col-span-1 md:col-span-3 mt-2">
                                  <FormField
                                    control={form.control}
                                    name={`items.${itemField.originalIndex}.notes`}
                                    render={({ field: notesField }) => (
                                      <FormItem>
                                        <FormLabel htmlFor={`${itemField.fieldId}-notes`} className="text-sm font-medium mb-1 block">Notas para Reparación</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            id={`${itemField.fieldId}-notes`}
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
                              {/* Only allow deleting items that are not from the default configurable list or pre-existing review items that were originally from config */
                               !configurableItems.some(defaultItem => defaultItem.id === itemField.id) && 
                               !(existingReview && existingReview.items.some(revItem => revItem.id === itemField.id && configurableItems.some(ci => ci.id === revItem.id ))) &&
                              (
                                <div className="col-span-1 md:col-span-3 flex justify-end mt-2">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(itemField.originalIndex)} className="text-destructive hover:text-destructive/80">
                                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar Ítem
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
            <div className="mt-6 flex justify-start"> 
              <Button type="button" variant="outline" onClick={handleAddItem}>
                <PlusCircle className="h-4 w-4 mr-2" /> Añadir Ítem Personalizado
              </Button>
            </div>
            <CardFooter className="mt-8 p-0 pt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || (!form.formState.isDirty && fields.length === 0)}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar Revisión y Continuar"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
