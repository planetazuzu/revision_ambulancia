"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/contexts/AppDataContext';
import { CleaningLogForm } from '@/components/cleaning/CleaningLogForm';
import { CleaningHistory } from '@/components/cleaning/CleaningHistory';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CleaningPage() {
  const params = useParams();
  const router = useRouter();
  const { getAmbulanceById, getCleaningLogsByAmbulanceId } = useAppData();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';

  const ambulance = getAmbulanceById(id);

  useEffect(() => {
    if (ambulance && !ambulance.mechanicalReviewCompleted) {
      toast({
        title: "Workflow Step Skipped",
        description: "Please complete the Mechanical Review before proceeding to Cleaning.",
        variant: "destructive",
      });
      router.push(`/dashboard/ambulances/${id}/review`);
    }
  }, [ambulance, id, router, toast]);
  
  if (!ambulance) {
    return <p>Ambulance not found.</p>;
  }

  if (!ambulance.mechanicalReviewCompleted) {
     return <div className="p-6 text-center">
        <p className="text-lg font-semibold">Mechanical Review Required</p>
        <p className="text-muted-foreground">Please complete the mechanical review for {ambulance.name} first.</p>
      </div>;
  }

  const cleaningLogs = getCleaningLogsByAmbulanceId(id);

  return (
    <div className="space-y-8">
      <CleaningLogForm ambulance={ambulance} />
      <CleaningHistory logs={cleaningLogs} />
    </div>
  );
}
