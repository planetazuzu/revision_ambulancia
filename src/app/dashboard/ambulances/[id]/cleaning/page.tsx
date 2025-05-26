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
        title: "Paso de Flujo Omitido",
        description: "Por favor, completa la Revisión Mecánica antes de proceder a la Limpieza.",
        variant: "destructive",
      });
      router.push(`/dashboard/ambulances/${id}/review`);
    }
  }, [ambulance, id, router, toast]);

  if (!ambulance) {
    return <p>Ambulancia no encontrada.</p>;
  }

  if (!ambulance.mechanicalReviewCompleted) {
     return <div className="p-6 text-center">
        <p className="text-lg font-semibold">Revisión Mecánica Requerida</p>
        <p className="text-muted-foreground">Por favor, completa primero la revisión mecánica para {ambulance.name}.</p>
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
