
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/contexts/AppDataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable, consumableColumns, nonConsumableColumns } from '@/components/inventory/InventoryTable';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ConsumableMaterial, NonConsumableMaterial, AmbulanceStorageLocation, Ambulance, MaterialStatus, NonConsumableMaterialStatus } from '@/types';
import { Package, Upload, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Papa from 'papaparse';
import { format, parse, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const UNASSIGNED_LOCATION_KEY = "unassigned_location";
const UNASSIGNED_LOCATION_LABEL = "Ubicación no Especificada";

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    getAmbulanceById, 
    getConsumableMaterialsByAmbulanceId, 
    getNonConsumableMaterialsByAmbulanceId, 
    updateAmbulanceWorkflowStep, 
    getAmbulanceStorageLocations,
    addConsumableMaterial,
    updateConsumableMaterial,
    addNonConsumableMaterial,
    updateNonConsumableMaterial
  } = useAppData();
  const { toast } = useToast();
  const { user } = useAuth();
  const id = typeof params.id === 'string' ? params.id : '';

  const ambulance = getAmbulanceById(id);
  const allPossibleStorageLocations = useMemo(() => getAmbulanceStorageLocations(), [getAmbulanceStorageLocations]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCoordinator = user?.role === 'coordinador';

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
      if (a === UNASSIGNED_LOCATION_KEY) return 1;
      if (b === UNASSIGNED_LOCATION_KEY) return -1;
      const indexA = allPossibleStorageLocations.indexOf(a as AmbulanceStorageLocation);
      const indexB = allPossibleStorageLocations.indexOf(b as AmbulanceStorageLocation);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  };
  
  const consumableLocationKeys = useMemo(() => getSortedLocationKeys(groupedConsumables), [groupedConsumables, allPossibleStorageLocations]);
  const nonConsumableLocationKeys = useMemo(() => getSortedLocationKeys(groupedNonConsumables), [groupedNonConsumables, allPossibleStorageLocations]);

  const handleExportCSV = () => {
    if (!ambulance) return;

    const dataToExport = [
      ['nombre', 'tipo', 'referencia_o_serie', 'cantidad_o_estado', 'fecha_caducidad', 'ubicacion_almacenamiento']
    ];

    consumableMaterials.forEach(m => {
      dataToExport.push([
        m.name,
        'consumible',
        m.reference,
        m.quantity.toString(),
        m.expiryDate ? format(parseISO(m.expiryDate), 'yyyy-MM-dd') : '',
        m.storageLocation || ''
      ]);
    });

    nonConsumableMaterials.forEach(m => {
      dataToExport.push([
        m.name,
        'no_consumible',
        m.serialNumber,
        m.status,
        '', // No expiry date for non-consumables
        m.storageLocation || ''
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + Papa.unparse(dataToExport);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_ambulancia_${ambulance.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportación CSV", description: "Inventario exportado correctamente." });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ambulance) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let importedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        results.data.forEach((row: any, index) => {
          const { nombre, tipo, referencia_o_serie, cantidad_o_estado, fecha_caducidad, ubicacion_almacenamiento } = row;

          if (!nombre || !tipo) {
            errors.push(`Fila ${index + 2}: Faltan campos obligatorios (nombre, tipo).`);
            return;
          }

          const storageLocation = ubicacion_almacenamiento || undefined;

          if (tipo.toLowerCase() === 'consumible') {
            if (!referencia_o_serie) {
              errors.push(`Fila ${index + 2} (Consumible: ${nombre}): Falta el campo 'referencia_o_serie'.`);
              return;
            }
            const quantity = parseInt(cantidad_o_estado, 10);
            if (isNaN(quantity) || quantity < 0) {
              errors.push(`Fila ${index + 2} (Consumible: ${nombre}): Cantidad inválida '${cantidad_o_estado}'.`);
              return;
            }

            let parsedExpiryDate: Date | null = null;
            if (fecha_caducidad) {
              // Try parsing YYYY-MM-DD first
              parsedExpiryDate = parse(fecha_caducidad, 'yyyy-MM-dd', new Date());
              if (!isValid(parsedExpiryDate)) {
                // Try parsing DD/MM/YYYY
                parsedExpiryDate = parse(fecha_caducidad, 'dd/MM/yyyy', new Date());
              }
              if (!isValid(parsedExpiryDate)) {
                errors.push(`Fila ${index + 2} (Consumible: ${nombre}): Formato de fecha de caducidad inválido '${fecha_caducidad}'. Use AAAA-MM-DD o DD/MM/AAAA.`);
                return;
              }
            }
            if (!parsedExpiryDate) {
                 errors.push(`Fila ${index + 2} (Consumible: ${nombre}): La fecha de caducidad es obligatoria para materiales consumibles.`);
                return;
            }

            const existingMaterial = consumableMaterials.find(m => m.name === nombre && m.reference === referencia_o_serie && m.ambulanceId === ambulance.id);
            const materialData: ConsumableMaterial = {
              id: existingMaterial?.id || `temp-id-${Date.now()}`, // temp id if new
              ambulanceId: ambulance.id,
              name: nombre,
              reference: referencia_o_serie,
              quantity,
              expiryDate: format(parsedExpiryDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
              storageLocation,
            };

            if (existingMaterial) {
              updateConsumableMaterial(materialData);
              updatedCount++;
            } else {
              addConsumableMaterial(materialData);
              importedCount++;
            }

          } else if (tipo.toLowerCase() === 'no_consumible') {
            if (!referencia_o_serie) {
                errors.push(`Fila ${index + 2} (No Consumible: ${nombre}): Falta el campo 'referencia_o_serie' (número de serie).`);
                return;
            }
            const validStatuses: NonConsumableMaterialStatus[] = ['Operacional', 'Necesita Reparación', 'Fuera de Servicio'];
            if (!validStatuses.includes(cantidad_o_estado as NonConsumableMaterialStatus)) {
              errors.push(`Fila ${index + 2} (No Consumible: ${nombre}): Estado inválido '${cantidad_o_estado}'. Válidos: ${validStatuses.join(', ')}.`);
              return;
            }

            const existingMaterial = nonConsumableMaterials.find(m => m.name === nombre && m.serialNumber === referencia_o_serie && m.ambulanceId === ambulance.id);
            const materialData: NonConsumableMaterial = {
              id: existingMaterial?.id || `temp-id-${Date.now()}`, // temp id if new
              ambulanceId: ambulance.id,
              name: nombre,
              serialNumber: referencia_o_serie,
              status: cantidad_o_estado as NonConsumableMaterialStatus,
              storageLocation,
            };
            if (existingMaterial) {
              updateNonConsumableMaterial(materialData);
              updatedCount++;
            } else {
              addNonConsumableMaterial(materialData);
              importedCount++;
            }
          } else {
            errors.push(`Fila ${index + 2}: Tipo de material desconocido '${tipo}'. Use "consumible" o "no_consumible".`);
          }
        });

        if (errors.length > 0) {
          toast({
            title: "Errores en la Importación CSV",
            description: (
              <div className="max-h-40 overflow-y-auto">
                <p>{importedCount} importados, {updatedCount} actualizados.</p>
                <ul className="list-disc pl-5 mt-2">
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            ),
            variant: "destructive",
            duration: 10000,
          });
        } else {
          toast({ title: "Importación CSV Exitosa", description: `${importedCount} materiales importados, ${updatedCount} materiales actualizados.` });
        }
      },
      error: (error: Error) => {
        toast({ title: "Error al Leer CSV", description: error.message, variant: "destructive" });
      }
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };


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
              // This will be handled by the "Add New" button inside the InventoryTable
              // or a generic one if no locations exist.
              // For now, relying on the add button in InventoryTable.
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
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventario de {ambulance.name}</CardTitle>
            {isCoordinator && (
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleImportCSV}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Importar CSV
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0"> {/* Ajustado pt-0 porque el título ya está en CardHeader */}
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

    