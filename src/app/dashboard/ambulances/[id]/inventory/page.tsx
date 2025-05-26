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
        title: "Workflow Step Skipped",
        description: "Please complete Mechanical Review and Cleaning before proceeding to Inventory.",
        variant: "destructive",
      });
      const targetPath = !ambulance.mechanicalReviewCompleted ? `/dashboard/ambulances/${id}/review` : `/dashboard/ambulances/${id}/cleaning`;
      router.push(targetPath);
    }
  }, [ambulance, id, router, toast]);

  if (!ambulance) {
    return <p>Ambulance not found.</p>;
  }

  if (!ambulance.mechanicalReviewCompleted || !ambulance.cleaningCompleted) {
    return <div className="p-6 text-center">
        <p className="text-lg font-semibold">Previous Steps Required</p>
        <p className="text-muted-foreground">Please complete mechanical review and cleaning for {ambulance.name} first.</p>
      </div>;
  }

  const consumableMaterials = getConsumableMaterialsByAmbulanceId(id);
  const nonConsumableMaterials = getNonConsumableMaterialsByAmbulanceId(id);

  const handleCompleteInventory = () => {
    updateAmbulanceWorkflowStep(ambulance.id, 'inventory', true);
    toast({
        title: "Inventory Check Complete",
        description: `Inventory check for ${ambulance.name} marked as complete. The review cycle is now finished.`,
    });
    router.push(`/dashboard/ambulances`);
  }

  return (
    <Card className="shadow-lg">
        <CardContent className="pt-6">
            <Tabs defaultValue="consumables">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="consumables">Consumables</TabsTrigger>
                <TabsTrigger value="non-consumables">Non-Consumables</TabsTrigger>
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
            <Button size="lg" onClick={handleCompleteInventory}>Mark Inventory as Complete & Finish Cycle</Button>
        </CardFooter>
    </Card>
  );
}
