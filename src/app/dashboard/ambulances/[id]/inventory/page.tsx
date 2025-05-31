
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/contexts/AppDataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable, consumableColumns, nonConsumableColumns } from '@/components/inventory/InventoryTable';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ConsumableMaterial, NonConsumableMaterial, AmbulanceStorageLocation } from '@/types';
import { Package } from 'lucide-react';

const UNASSIGNED_LOCATION_KEY = "unassigned_location";
const UNASSIGNED_LOCATION_LABEL = "Ubicación no Especificada";

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const { getAmbulanceById, getConsumableMaterialsByAmbulanceId, getNonConsumableMaterialsByAmbulanceId, updateAmbulanceWorkflowStep, getAmbulanceStorageLocations } = useAppData();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';

  const ambulance = getAmbulanceById(id);
  const allPossibleStorageLocations = useMemo(() => getAmbulanceStorageLocations(), [getAmbulanceStorageLocations]);

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

  const consumableMaterials = useMemo(() => {
    return ambulance ? getConsumableMaterialsByAmbulanceId(ambulance.id) : [];
  }, [ambulance, getConsumableMaterialsByAmbulanceId]);

  const nonConsumableMaterials = useMemo(() => {
    return ambulance ? getNonConsumableMaterialsByAmbulanceId(ambulance.id) : [];
  }, [ambulance, getNonConsumableMaterialsByAmbulanceId]);

  const groupMaterialsByLocation = <T extends ConsumableMaterial | NonConsumableMaterial>(
    materials: T[]
  ): Record<string, T[]> => {
    return materials.reduce((acc, material) => {
      const locationKey = material.storageLocation || UNASSIGNED_LOCATION_KEY;
      if (!acc[locationKey]) {
        acc[locationKey] = [];
      }
      acc[locationKey].push(material);
      return acc;
    }, {} as Record<string, T[]>);
  };

  const groupedConsumables = useMemo(() => groupMaterialsByLocation(consumableMaterials), [consumableMaterials]);
  const groupedNonConsumables = useMemo(() => groupMaterialsByLocation(nonConsumableMaterials), [nonConsumableMaterials]);

  const getSortedLocationKeys = (groupedMaterials: Record<string, any[]>): string[] => {
    const keys = Object.keys(groupedMaterials);
    return keys.sort((a, b) => {
      if (a === UNASSIGNED_LOCATION_KEY) return 1; // Put unassigned last
      if (b === UNASSIGNED_LOCATION_KEY) return -1;
      const indexA = allPossibleStorageLocations.indexOf(a as AmbulanceStorageLocation);
      const indexB = allPossibleStorageLocations.indexOf(b as AmbulanceStorageLocation);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Sort by predefined order
      if (indexA !== -1) return -1; // Predefined locations first
      if (indexB !== -1) return 1;
      return a.localeCompare(b); // Alphabetical for custom/unknown locations
    });
  };
  
  const consumableLocationKeys = useMemo(() => getSortedLocationKeys(groupedConsumables), [groupedConsumables, allPossibleStorageLocations]);
  const nonConsumableLocationKeys = useMemo(() => getSortedLocationKeys(groupedNonConsumables), [groupedNonConsumables, allPossibleStorageLocations]);


  if (!ambulance) {
    return <p>Ambulancia no encontrada.</p>;
  }

  if (!ambulance.mechanicalReviewCompleted || !ambulance.cleaningCompleted) {
    return <div className="p-6 text-center">
        <p className="text-lg font-semibold">Pasos Previos Requeridos</p>
        <p className="text-muted-foreground">Por favor, completa primero la revisión mecánica y la limpieza para {ambulance.name}.</p>
      </div>;
  }

  const handleCompleteInventory = () => {
    updateAmbulanceWorkflowStep(ambulance.id, 'inventory', true);
    toast({
        title: "Control de Inventario Completo",
        description: `El control de inventario para ${ambulance.name} se ha marcado como completo. El ciclo de revisión ha finalizado.`,
    });
    router.push(`/dashboard/ambulances`);
  }

  const renderInventorySection = <T extends ConsumableMaterial | NonConsumableMaterial>(
    title: string,
    groupedMaterials: Record<string, T[]>,
    locationKeys: string[],
    materialType: 'consumable' | 'non-consumable',
    columns: any[]
  ) => {
    if (locationKeys.length === 0) {
      return (
        <div className="mt-6">
          <p className="text-muted-foreground text-center py-4">No hay materiales {materialType === 'consumable' ? 'consumibles' : 'no consumibles'} registrados para esta ambulancia.</p>
          <div className="flex justify-center">
            <Button onClick={() => {
              // Trigger adding a new material, perhaps open the form directly
              // This part needs a way to communicate with InventoryTable's "Add New" or MaterialForm
              // For now, we can just say "use the add button inside a location if it existed"
              // Or, we can have a generic add button here if no locations exist yet.
              // For simplicity, we'll rely on the table's add button if any location is shown.
              // If no materials at all, we could provide a generic add.
              // Let's just show a placeholder for adding.
              // TODO: Open MaterialForm directly if no materials/locations.
              // The current InventoryTable component handles adding via its internal "Add New" button.
            }}>Añadir Primer Material {materialType === 'consumable' ? 'Consumible' : 'No Consumible'}</Button>
          </div>
        </div>
      );
    }

    return (
      <Accordion type="multiple" className="w-full mt-6" defaultValue={locationKeys.length > 0 ? [locationKeys[0]] : []}>
        {locationKeys.map(locationKey => {
          const materialsInLocation = groupedMaterials[locationKey] || [];
          const locationName = locationKey === UNASSIGNED_LOCATION_KEY ? UNASSIGNED_LOCATION_LABEL : locationKey;
          return (
            <AccordionItem value={locationKey} key={`${materialType}-${locationKey}`}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{locationName}</span>
                  <span className="text-xs text-muted-foreground">({materialsInLocation.length} ítem(s))</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <InventoryTable
                  ambulance={ambulance}
                  materials={materialsInLocation}
                  materialType={materialType}
                  columns={columns}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  return (
    <Card className="shadow-lg">
        <CardContent className="pt-6">
            <Tabs defaultValue="consumables">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="consumables">Consumibles</TabsTrigger>
                <TabsTrigger value="non-consumables">No Consumibles</TabsTrigger>
                </TabsList>
                <TabsContent value="consumables">
                {renderInventorySection(
                    'Materiales Consumibles',
                    groupedConsumables,
                    consumableLocationKeys,
                    'consumable',
                    consumableColumns
                )}
                </TabsContent>
                <TabsContent value="non-consumables">
                {renderInventorySection(
                    'Materiales No Consumibles',
                    groupedNonConsumables,
                    nonConsumableLocationKeys,
                    'non-consumable',
                    nonConsumableColumns
                )}
                </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-6">
            <Button size="lg" onClick={handleCompleteInventory}>Marcar Inventario como Completo y Finalizar Ciclo</Button>
        </CardFooter>
    </Card>
  );
}

    