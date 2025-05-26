"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Ambulance, CleaningLog } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const cleaningLogSchema = z.object({
  materialsUsed: z.string().min(3, "Please list materials used."),
  observations: z.string().optional(),
});

type CleaningLogFormValues = z.infer<typeof cleaningLogSchema>;

interface CleaningLogFormProps {
  ambulance: Ambulance;
}

export function CleaningLogForm({ ambulance }: CleaningLogFormProps) {
  const { addCleaningLog, updateAmbulanceWorkflowStep } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CleaningLogFormValues>({
    resolver: zodResolver(cleaningLogSchema),
    defaultValues: {
      materialsUsed: "",
      observations: "",
    },
  });

  const onSubmit = (data: CleaningLogFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    const logData: Omit<CleaningLog, 'id'> = {
      ambulanceId: ambulance.id,
      responsiblePersonId: user.id,
      dateTime: new Date().toISOString(),
      materialsUsed: data.materialsUsed,
      observations: data.observations,
    };
    addCleaningLog(logData);
    updateAmbulanceWorkflowStep(ambulance.id, 'cleaning', true);
    toast({ title: "Cleaning Logged", description: `Cleaning for ${ambulance.name} has been logged.` });
    router.push(`/dashboard/ambulances/${ambulance.id}/inventory`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Log Cleaning Task</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="materialsUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materials and Means Used</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Disinfectant wipes, vacuum cleaner, bleach solution" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Heavy soiling on seats, specific areas requiring extra attention." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-muted-foreground">
              Date, time, and responsible person ({user?.name || 'Current User'}) will be automatically recorded.
            </p>
            <CardFooter className="p-0 pt-6 flex justify-end">
              <Button type="submit" size="lg">Log Cleaning & Proceed</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
