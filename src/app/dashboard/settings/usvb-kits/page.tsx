
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from '@/components/shared/PageHeader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ListChecks, PlusCircle, Edit3, Trash2, ArrowLeft, Package, Save, ToyBrick, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import type { USVBKit, USVBKitMaterial } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LucideIconName = keyof typeof LucideIcons;
const iconNames = Object.keys(LucideIcons).filter(key => key !== "createLucideIcon" && key !== "Icon" && key[0] === key[0].toUpperCase()) as LucideIconName[];


const kitDetailsSchema = z.object({
  name: z.string().min(3, "El nombre del kit debe tener al menos 3 caracteres."),
  iconName: z.string().min(1, "Debe seleccionar un ícono."),
  genericImageHint: z.string().optional(),
});
type KitDetailsFormValues = z.infer<typeof kitDetailsSchema>;

const kitMaterialSchema = z.object({
  name: z.string().min(1, "El nombre del material es obligatorio."),
  targetQuantity: z.coerce.number().min(1, "La cantidad ideal debe ser al menos 1."),
});
type KitMaterialFormValues = z.infer<typeof kitMaterialSchema>;


export default function ManageUsvbKitsPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    getConfigurableUsvbKits,
    updateConfigurableUsvbKitDetails,
    addMaterialToConfigurableUsvbKit,
    updateMaterialInConfigurableUsvbKit,
    deleteMaterialFromConfigurableUsvbKit,
    reorderMaterialInConfigurableUsvbKit
  } = useAppData();
  const { toast } = useToast();
  const router = useRouter();

  const kitsConfig = useMemo(() => getConfigurableUsvbKits(), [getConfigurableUsvbKits]);

  const [isKitDetailsDialogOpen, setIsKitDetailsDialogOpen] = useState(false);
  const [editingKitDetails, setEditingKitDetails] = useState<USVBKit | null>(null);
  
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<{kitId: string; material: USVBKitMaterial} | null>(null);
  const [currentKitIdForMaterial, setCurrentKitIdForMaterial] = useState<string | null>(null);


  const kitDetailsForm = useForm<KitDetailsFormValues>({
    resolver: zodResolver(kitDetailsSchema),
  });

  const materialForm = useForm<KitMaterialFormValues>({
    resolver: zodResolver(kitMaterialSchema),
  });


  useEffect(() => {
    if (!authLoading && user?.role !== 'coordinador') {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para gestionar plantillas de kits USVB.", variant: "destructive" });
      router.replace('/dashboard/settings');
    }
  }, [user, authLoading, router, toast]);

  const handleOpenKitDetailsDialog = (kit: USVBKit | null = null) => {
    setEditingKitDetails(kit);
    if (kit) {
      kitDetailsForm.reset({ 
        name: kit.name, 
        iconName: kit.iconName,
        genericImageHint: kit.genericImageHint || ""
      });
    }
    setIsKitDetailsDialogOpen(true);
  };

  const onKitDetailsSubmit = (data: KitDetailsFormValues) => {
    if (editingKitDetails) {
      updateConfigurableUsvbKitDetails(editingKitDetails.id, data);
      setIsKitDetailsDialogOpen(false);
    }
  };

  const handleOpenMaterialDialog = (kitId: string, material: USVBKitMaterial | null = null) => {
    setCurrentKitIdForMaterial(kitId);
    setEditingMaterial(material ? { kitId, material } : null);
    if (material) {
      materialForm.reset({ name: material.name, targetQuantity: material.targetQuantity });
    } else {
      materialForm.reset({ name: "", targetQuantity: 1 });
    }
    setIsMaterialDialogOpen(true);
  };

  const onMaterialSubmit = (data: KitMaterialFormValues) => {
    if (!currentKitIdForMaterial) return;

    if (editingMaterial) {
      updateMaterialInConfigurableUsvbKit(currentKitIdForMaterial, editingMaterial.material.id, data);
    } else {
      addMaterialToConfigurableUsvbKit(currentKitIdForMaterial, data);
    }
    setIsMaterialDialogOpen(false);
  };

  const handleDeleteMaterial = (kitId: string, materialId: string) => {
    deleteMaterialFromConfigurableUsvbKit(kitId, materialId);
  };

  const handleReorderMaterial = (kitId: string, materialId: string, direction: 'up' | 'down') => {
    reorderMaterialInConfigurableUsvbKit(kitId, materialId, direction);
  };
  
  if (authLoading || !user) {
    return <div className="p-6 text-center">Cargando...</div>;
  }
  if (user.role !== 'coordinador') {
     return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-full">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Acceso Denegado</h2>
        <Button onClick={() => router.push('/dashboard/settings')} className="mt-6">Volver a Configuración</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestionar Plantillas de Kits USVB"
        description="Define los materiales y cantidades ideales para cada kit estándar de la dotación USVB."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Configuración
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
            <CardTitle>Kits USVB Configurados ({kitsConfig.length})</CardTitle>
            <CardDescription>
                Modifica los detalles de cada kit y los materiales que deben contener, junto con su dotación ideal.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {kitsConfig.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay plantillas de kits USVB configuradas.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <Accordion type="multiple" className="w-full">
                {kitsConfig.map((kit) => {
                  const IconComponent = LucideIcons[kit.iconName as LucideIconName] || Package;
                  return (
                  <AccordionItem value={kit.id} key={kit.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Espacio {kit.number}: {kit.name}</span>
                        <span className="text-xs text-muted-foreground">({kit.materials.length} tipos de material)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-muted/30 rounded-b-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Materiales del Kit:</h4>
                        <div className='flex gap-2'>
                            <Button variant="outline" size="sm" onClick={() => handleOpenKitDetailsDialog(kit)}>
                                <Edit3 className="mr-2 h-3 w-3" /> Editar Detalles del Kit
                            </Button>
                            <Button size="sm" onClick={() => handleOpenMaterialDialog(kit.id)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Material al Kit
                            </Button>
                        </div>
                      </div>
                      {kit.materials.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre del Material</TableHead>
                              <TableHead className="w-[150px] text-center">Dotación Ideal</TableHead>
                              <TableHead className="text-right w-[200px]">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {kit.materials.map((material, index) => (
                              <TableRow key={material.id}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell className="text-center">{material.targetQuantity}</TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleReorderMaterial(kit.id, material.id, 'up')} disabled={index === 0} title="Mover Arriba">
                                    <ArrowUpCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleReorderMaterial(kit.id, material.id, 'down')} disabled={index === kit.materials.length - 1} title="Mover Abajo">
                                    <ArrowDownCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenMaterialDialog(kit.id, material)} title="Editar Material">
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" title="Eliminar Material">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          ¿Estás seguro de que quieres eliminar "{material.name}" de la plantilla del kit "{kit.name}"?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteMaterial(kit.id, material.id)}>Eliminar</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-3">Este kit no tiene materiales configurados.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )})}
              </Accordion>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Editing Kit Details */}
      <Dialog open={isKitDetailsDialogOpen} onOpenChange={setIsKitDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Detalles del Kit: {editingKitDetails?.name}</DialogTitle>
            <DialogDescription>Modifica el nombre, ícono y la pista para la imagen genérica del kit.</DialogDescription>
          </DialogHeader>
          <Form {...kitDetailsForm}>
            <form onSubmit={kitDetailsForm.handleSubmit(onKitDetailsSubmit)} className="space-y-4 py-2 pb-4">
              <FormField
                control={kitDetailsForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Kit</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={kitDetailsForm.control}
                name="iconName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícono del Kit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar ícono..." /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-60">
                        {iconNames.map(icon => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              {React.createElement(LucideIcons[icon as LucideIconName], {className: "h-4 w-4"})}
                              {icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={kitDetailsForm.control}
                name="genericImageHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pista para Imagen Genérica (data-ai-hint)</FormLabel>
                    <FormControl><Input placeholder="Ej: pediatric supplies, ppe kit" {...field} /></FormControl>
                    <FormDescription>Una o dos palabras clave para buscar una imagen si no hay una específica.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">Guardar Cambios del Kit</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Adding/Editing Material in a Kit */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Material en Kit" : "Añadir Nuevo Material al Kit"}</DialogTitle>
            <DialogDescription>
              Define el nombre y la cantidad ideal para este material dentro del kit.
            </DialogDescription>
          </DialogHeader>
          <Form {...materialForm}>
            <form onSubmit={materialForm.handleSubmit(onMaterialSubmit)} className="space-y-4 py-2 pb-4">
              <FormField
                control={materialForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Material</FormLabel>
                    <FormControl><Input placeholder="Ej: Venda estéril 10x10" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="targetQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dotación Ideal (Cantidad)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">{editingMaterial ? "Guardar Cambios" : "Añadir Material"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

