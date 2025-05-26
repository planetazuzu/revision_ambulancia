"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAppData } from "@/contexts/AppDataContext";
import type { Ambulance } from "@/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const ambulanceFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  licensePlate: z.string().min(3, { message: "License plate is required." }),
  model: z.string().min(2, { message: "Model is required." }),
  year: z.coerce.number().min(1900, { message: "Year must be valid." }).max(new Date().getFullYear() + 1, { message: "Year cannot be in the far future." }),
});

type AmbulanceFormValues = z.infer<typeof ambulanceFormSchema>;

interface AmbulanceFormSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ambulance?: Ambulance | null;
}

export function AmbulanceFormSheet({ isOpen, onOpenChange, ambulance }: AmbulanceFormSheetProps) {
  const { addAmbulance, updateAmbulance } = useAppData();
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
    if (ambulance) {
      updateAmbulance({ ...ambulance, ...data });
      toast({ title: "Ambulance Updated", description: `${data.name} has been updated successfully.` });
    } else {
      addAmbulance(data);
      toast({ title: "Ambulance Added", description: `${data.name} has been added successfully.` });
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{ambulance ? "Edit Ambulance" : "Add New Ambulance"}</SheetTitle>
          <SheetDescription>
            {ambulance ? "Update the details of the ambulance." : "Fill in the details for the new ambulance."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name / Identifier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ambulance 01, Unit 101" {...field} />
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
                  <FormLabel>License Plate</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC 123" {...field} />
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
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mercedes Sprinter" {...field} />
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
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="mt-8">
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit">{ambulance ? "Save Changes" : "Add Ambulance"}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
