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
import type { ConsumableMaterial, NonConsumableMaterial, Ambulance } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const consumableSchema = z.object({
  name: z.string().min(1, "Name is required"),
  reference: z.string().min(1, "Reference is required"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  expiryDate: z.date({ required_error: "Expiry date is required." }),
});

const nonConsumableSchema = z.object({
  name: z.string().min(1, "Name is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  status: z.enum(['Operational', 'Needs Repair', 'Out of Service']),
});

interface MaterialFormProps {
  ambulance: Ambulance;
  materialType: 'consumable' | 'non-consumable';
  material?: ConsumableMaterial | NonConsumableMaterial | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function MaterialForm({ ambulance, materialType, material, isOpen, onOpenChange }: MaterialFormProps) {
  const { addConsumableMaterial, updateConsumableMaterial, addNonConsumableMaterial, updateNonConsumableMaterial } = useAppData();
  const { toast } = useToast();
  
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
          } as CurrentFormValues);
        } else {
          form.reset(material as CurrentFormValues);
        }
      } else {
        form.reset(
          materialType === 'consumable'
            ? { name: '', reference: '', quantity: 0, expiryDate: new Date() }
            : { name: '', serialNumber: '', status: 'Operational' }
        );
      }
    }
  }, [material, materialType, form, isOpen]);

  const onSubmit = (data: CurrentFormValues) => {
    const commonToastParams = { title: material ? "Material Updated" : "Material Added" };
    if (materialType === 'consumable') {
      const consumableData = data as z.infer<typeof consumableSchema>;
      if (material) {
        updateConsumableMaterial({ ...material as ConsumableMaterial, ...consumableData, expiryDate: consumableData.expiryDate.toISOString() });
      } else {
        addConsumableMaterial({ ...consumableData, ambulanceId: ambulance.id, expiryDate: consumableData.expiryDate.toISOString() });
      }
      toast({...commonToastParams, description: `${consumableData.name} (Consumable) processed.`});
    } else {
      const nonConsumableData = data as z.infer<typeof nonConsumableSchema>;
      if (material) {
        updateNonConsumableMaterial({ ...material as NonConsumableMaterial, ...nonConsumableData });
      } else {
        addNonConsumableMaterial({ ...nonConsumableData, ambulanceId: ambulance.id });
      }
      toast({...commonToastParams, description: `${nonConsumableData.name} (Non-Consumable) processed.`});
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{material ? 'Edit' : 'Add'} {materialType === 'consumable' ? 'Consumable' : 'Non-Consumable'} Material</DialogTitle>
          <DialogDescription>
            Fill in the details for the material.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                      <FormLabel>Reference</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date</FormLabel>
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
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
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
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Operational">Operational</SelectItem>
                          <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                          <SelectItem value="Out of Service">Out of Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{material ? 'Save Changes' : 'Add Material'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

