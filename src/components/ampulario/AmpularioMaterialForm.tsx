"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep Label for general use
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Use ShadCN form components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { AmpularioMaterial, MaterialRoute, Space } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const materialRouteEnum = z.enum(["IV/IM", "Nebulizador", "Oral"]);

const ampularioMaterialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dose: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative"),
  route: materialRouteEnum,
  expiry_date: z.date().optional().nullable(),
  space_id: z.string().min(1, "Space is required"),
});

type AmpularioMaterialFormValues = z.infer<typeof ampularioMaterialSchema>;

interface AmpularioMaterialFormProps {
  material?: AmpularioMaterial | null;
  spaces: Space[]; // Pass spaces for selection
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void; // Callback to refresh data on parent
}

export function AmpularioMaterialForm({ material, spaces, isOpen, onOpenChange, onSave }: AmpularioMaterialFormProps) {
  const { toast } = useToast();
  
  const form = useForm<AmpularioMaterialFormValues>({
    resolver: zodResolver(ampularioMaterialSchema),
    defaultValues: {
      name: '',
      dose: '',
      unit: '',
      quantity: 0,
      route: 'Oral',
      expiry_date: null,
      space_id: spaces[0]?.id || '', // Default to first space or handle if no spaces
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (material) {
        form.reset({
          name: material.name,
          dose: material.dose,
          unit: material.unit,
          quantity: material.quantity,
          route: material.route,
          expiry_date: material.expiry_date ? parseISO(material.expiry_date) : null,
          space_id: material.space_id,
        });
      } else {
         form.reset({
            name: '',
            dose: '',
            unit: '',
            quantity: 0,
            route: 'Oral',
            expiry_date: null,
            space_id: spaces.find(s => s.id === 'space23')?.id || spaces[0]?.id || '', // Prefer 'Ampulario Principal'
        });
      }
    }
  }, [material, isOpen, form, spaces]);

  const onSubmit = async (data: AmpularioMaterialFormValues) => {
    const payload = {
        ...data,
        expiry_date: data.expiry_date ? format(data.expiry_date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : undefined,
    };

    const url = material ? `/api/materials/${material.id}` : '/api/materials';
    const method = material ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `${method} request failed`);
      }

      toast({
        title: material ? "Material Updated" : "Material Added",
        description: `${data.name} has been successfully processed.`,
      });
      onSave(); // Trigger refresh
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not save material.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{material ? 'Edit Material' : 'Add New Material'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the Ampulario material.
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
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="dose"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Dose</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
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
              name="route"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(["IV/IM", "Nebulizador", "Oral"] as MaterialRoute[]).map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="space_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select space" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {spaces.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
