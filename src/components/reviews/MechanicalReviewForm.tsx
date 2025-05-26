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

const checklistItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required."),
  status: z.enum(['OK', 'Repair', 'N/A']),
  notes: z.string().optional(),
});

const mechanicalReviewSchema = z.object({
  items: z.array(checklistItemSchema),
});

type MechanicalReviewFormValues = z.infer<typeof mechanicalReviewSchema>;

const defaultChecklistItems: Omit<ChecklistItem, 'id' | 'status' | 'notes'>[] = [
  { name: 'Brakes (Pads, Discs, Fluid)' },
  { name: 'Tires (Pressure, Tread, Damage)' },
  { name: 'Lights (Headlights, Taillights, Indicators, Emergency)' },
  { name: 'Engine (Oil, Coolant, Belts, Hoses)' },
  { name: 'Steering System' },
  { name: 'Suspension System' },
  { name: 'Battery and Electrical System' },
  { name: 'Siren and PA System' },
  { name: 'Medical Equipment Mounts' },
  { name: 'Safety Belts (All seats)' },
  { name: 'Fluid Leaks (Oil, Coolant, Fuel)' },
  { name: 'Exhaust System' },
  { name: 'Windshield Wipers and Fluid' },
  { name: 'Mirrors (Side and Rear-view)' },
  { name: 'Emergency Tools (Jack, Wrench)' },
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
      form.reset({ items: existingReview.items });
    }
  }, [existingReview, form]);

  const onSubmit = (data: MechanicalReviewFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save a review.", variant: "destructive" });
      return;
    }
    const reviewData: Omit<MechanicalReview, 'id'> = {
      ambulanceId: ambulance.id,
      reviewerId: user.id,
      reviewDate: new Date().toISOString(),
      items: data.items,
    };
    saveMechanicalReview(reviewData);
    updateAmbulanceWorkflowStep(ambulance.id, 'mechanical', true);
    toast({ title: "Review Saved", description: `Mechanical review for ${ambulance.name} has been saved.` });
    router.push(`/dashboard/ambulances/${ambulance.id}/cleaning`);
  };

  const handleAddItem = () => {
    append({ id: `custom-item-${Date.now()}`, name: '', status: 'N/A', notes: '' });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Mechanical Review Checklist</CardTitle>
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
                           defaultChecklistItems.some(item => item.name === field.name) ? 
                           <Label className="font-semibold text-md pt-2 col-span-1 md:col-span-3">{nameField.value}</Label> :
                           <Input {...nameField} placeholder="Custom item name" className="font-semibold text-md"/>
                        )}
                      />
                      
                      <div className="col-span-1 md:col-span-3">
                        <Controller
                          control={form.control}
                          name={`items.${index}.status`}
                          render={({ field: statusField }) => (
                            <RadioGroup
                              onValueChange={statusField.onChange}
                              defaultValue={statusField.value}
                              className="flex flex-col sm:flex-row gap-4"
                            >
                              {(['OK', 'Repair', 'N/A'] as ChecklistItemStatus[]).map((statusValue) => (
                                <Label
                                  key={statusValue}
                                  htmlFor={`${field.id}-${statusValue}`}
                                  className={cn(
                                    "flex items-center space-x-2 cursor-pointer rounded-md border p-3 transition-colors hover:bg-accent hover:text-accent-foreground",
                                    statusField.value === statusValue && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                                  )}
                                >
                                  <RadioGroupItem value={statusValue} id={`${field.id}-${statusValue}`} />
                                  <span>{statusValue}</span>
                                </Label>
                              ))}
                            </RadioGroup>
                          )}
                        />
                      </div>

                      {form.watch(`items.${index}.status`) === 'Repair' && (
                        <div className="col-span-1 md:col-span-3 mt-2">
                           <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
                            render={({ field: notesField }) => (
                                <>
                                <Label htmlFor={`${field.id}-notes`} className="text-sm font-medium mb-1 block">Notes for Repair</Label>
                                <Textarea
                                    id={`${field.id}-notes`}
                                    placeholder="Describe the issue and required repair..."
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
                                <Trash2 className="h-4 w-4 mr-1" /> Remove Item
                            </Button>
                         </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <Button type="button" variant="outline" onClick={handleAddItem} className="mt-6">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Custom Checklist Item
            </Button>
            <CardFooter className="mt-8 p-0 pt-6 flex justify-end">
              <Button type="submit" size="lg">Save Review & Proceed</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
