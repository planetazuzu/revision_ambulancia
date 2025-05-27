
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/contexts/AppDataContext';
import { DailyVehicleCheckForm } from '@/components/checks/DailyVehicleCheckForm';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DailyCheckPage() {
  const params = useParams();
  const router = useRouter();
  const { getAmbulanceById } = useAppData();
  const id = typeof params.id === 'string' ? params.id : '';

  const ambulance = getAmbulanceById(id);

  if (!ambulance) {
    return (
      <div className="p-6">
         <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/ambulances`)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado
        </Button>
        <PageHeader title="Ambulancia No Encontrada" description="No se pudo encontrar la ambulancia solicitada." />
      </div>
    );
  }

  return (
    <div>
        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/ambulances/${id}/review`)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a {ambulance.name}
        </Button>
      <DailyVehicleCheckForm ambulance={ambulance} />
    </div>
  );
}
