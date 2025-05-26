"use client";

import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAppData } from '@/contexts/AppDataContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { ambulanceWorkflowSteps } from '@/config/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { WorkflowStep, Ambulance } from '@/types';

export default function AmbulanceWorkflowLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { getAmbulanceById } = useAppData();
  const id = typeof params.id === 'string' ? params.id : '';

  const ambulance = getAmbulanceById(id);

  if (!ambulance) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/ambulances')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Ambulancias
        </Button>
        <PageHeader title="Ambulancia No Encontrada" description="La ambulancia solicitada no pudo ser encontrada." />
      </div>
    );
  }

  const basePathForSteps = `/dashboard/ambulances/${id}`;
  const currentPathSegment = pathname.substring(basePathForSteps.length);

  const steps: WorkflowStep[] = ambulanceWorkflowSteps(id).map(step => {
    const key = step.key as keyof Ambulance;
    return {
      ...step,
      isCompleted: (amb: Ambulance) => !!amb[key],
    };
  });

  const currentStepConfig = steps.find(step => step.path === pathname);
  const pageTitle = currentStepConfig ? `${currentStepConfig.name} para ${ambulance.name}` : ambulance.name;
  const pageDescription = currentStepConfig ? `Completa la lista de ${currentStepConfig.name.toLowerCase()}.` : `Gestionar ${ambulance.name}.`;


  return (
    <div className="p-0 md:p-2 lg:p-4">
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/ambulances')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado de Ambulancias
        </Button>
      </div>
      <PageHeader title={pageTitle} description={pageDescription} />
      <StepIndicator steps={steps} currentAmbulance={ambulance} basePath={basePathForSteps}/>
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
