"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/contexts/AppDataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable, consumableColumns, nonConsumableColumns } from '@/components/inventory/InventoryTable';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const { getAmbulanceById, getConsumableMaterialsByAmbulanceId, getNonConsumableMaterialsByAmbulanceId, updateAmbulanceWorkflowStep } = useAppData();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';

  const ambulance = getAmbulanceById(id);

  useEffect(() => {
    if (ambulance && (!ambulance.mechanicalReviewCompleted || !ambulance.cleaningCompleted)) {
      toast({
        title: "Paso de Flujo Omitido",
        description: "Por favor, completa la Revisión Mecánica y la Limpieza antes de proceder al Inventario.",
        variant: "destructive",
      });
      const targetPath = !ambulance.mechanicalReviewCompleted ? `/dashboard/ambulances/${id}/review` : `/dashboard/ambulances/${id}/cleaning`;
      router.push(targetPath);
    }
  }, [ambulance, id, router, toast]);

  if (!ambulance) {
    return <p>Ambulancia no encontrada.</p>;
  }

  if (!ambulance.mechanicalReviewCompleted || !ambulance.cleaningCompleted) {
    return <div className="p-6 text-center">
        <p className="text-lg font-semibold">Pasos Previos Requeridos</p>
        <p className="text-muted-foreground">Por favor, completa primero la revisión mecánica y la limpieza para {ambulance.name}.</p>
      </div>;
  }

  const consumableMaterials = getConsumableMaterialsByAmbulanceId(id);
  const nonConsumableMaterials = getNonConsumableMaterialsByAmbulanceId(id);

  const handleCompleteInventory = () => {
    updateAmbulanceWorkflowStep(ambulance.id, 'inventory', true);
    toast({
        title: "Control de Inventario Completo",
        description: `El control de inventario para ${ambulance.name} se ha marcado como completo. El ciclo de revisión ha finalizado.`,
    });
    router.push(`/dashboard/ambulances`);
  }

  return (
    <Card className="shadow-lg">
        <CardContent className="pt-6">
            <Tabs defaultValue="consumables">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="consumables">Consumibles</TabsTrigger>
                <TabsTrigger value="non-consumables">No Consumibles</TabsTrigger>
                </TabsList>
                <TabsContent value="consumables" className="mt-6">
                <InventoryTable
                    ambulance={ambulance}
                    materials={consumableMaterials}
                    materialType="consumable"
                    columns={consumableColumns}
                />
                </TabsContent>
                <TabsContent value="non-consumables" className="mt-6">
                <InventoryTable
                    ambulance={ambulance}
                    materials={nonConsumableMaterials}
                    materialType="non-consumable"
                    columns={nonConsumableColumns}
                />
                </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-6">
            <Button size="lg" onClick={handleCompleteInventory}>Marcar Inventario como Completo y Finalizar Ciclo</Button>
        </CardFooter>
    </Card>
  );
}
