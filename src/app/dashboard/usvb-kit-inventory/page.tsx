
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Search, Package, Shield, Syringe, Stethoscope, Thermometer, Bandage, Pill, HeartPulse, BoxIcon, BriefcaseMedical, Truck, Wind, Droplet, ShieldAlert, Baby, Refrigerator, ToyBrick, Plus, Minus, Edit3, Save, RotateCcw, FilterX, Trash2, Info } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { USVBKit, USVBKitMaterial, USVBKitMaterialStatus } from '@/types';

// Estilo gris específico para tarjetas en este módulo (Pantone 7546 C equivalent)
const GDLR_CARD_GREY_BG = 'bg-[hsl(210,10%,40%)]'; // Usar en light mode
const GDLR_CARD_GREY_TEXT = 'text-white'; // Para texto sobre el gris oscuro en light mode
const DARK_GDLR_CARD_GREY_BG = 'dark:bg-[hsl(210,10%,25%)]'; // Un poco más claro que el fondo oscuro
const DARK_GDLR_CARD_GREY_TEXT = 'dark:text-gray-200';

// Radio de borde específico 4px
const GDLR_CARD_RADIUS = 'rounded'; // Tailwind 'rounded' es 0.25rem (4px)

type LucideIconName = keyof typeof LucideIcons;

const getLucideIcon = (iconName: string): React.ElementType => {
  const iconKey = iconName as LucideIconName;
  return LucideIcons[iconKey] || Package; // Fallback a Package
};

const getStockStatusColor = (status?: USVBKitMaterialStatus): string => {
  switch (status) {
    case 'ok': return 'bg-green-500';
    case 'low': return 'bg-yellow-500';
    case 'out': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
};

const calculateStockStatus = (material: USVBKitMaterial): USVBKitMaterialStatus => {
  if (material.quantity <= 0) return 'out';
  if (material.quantity < material.targetQuantity * 0.5) return 'low'; // Ejemplo: bajo si < 50%
  if (material.quantity < material.targetQuantity) return 'low'; // O simplemente bajo si no es completo
  return 'ok';
};

const materialQuantitySchema = z.object({
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
});
type MaterialQuantityValues = z.infer<typeof materialQuantitySchema>;


export default function USVBKitInventoryPage() {
  const { usvbKits, updateUSVBKitMaterialQuantity, getUSVBKitById } = useAppData();
  const [selectedKit, setSelectedKit] = useState<USVBKit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | USVBKitMaterialStatus>('all');
  const [isKitDetailOpen, setIsKitDetailOpen] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, setValue, watch, reset } = useForm<MaterialQuantityValues>({
    resolver: zodResolver(materialQuantitySchema),
  });
  const [editingMaterial, setEditingMaterial] = useState<{ kitId: string; material: USVBKitMaterial } | null>(null);


  const filteredKits = useMemo(() => {
    return usvbKits
      .map(kit => {
        const materialsWithStatus = kit.materials.map(m => ({ ...m, status: calculateStockStatus(m) }));
        const overallStatus = materialsWithStatus.some(m => m.status === 'out') ? 'out' :
                              materialsWithStatus.some(m => m.status === 'low') ? 'low' : 'ok';
        return { ...kit, materials: materialsWithStatus, overallStatus };
      })
      .filter(kit => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch =
          kit.name.toLowerCase().includes(searchTermLower) ||
          kit.number.toString().includes(searchTermLower) ||
          kit.materials.some(m => m.name.toLowerCase().includes(searchTermLower));

        const matchesStock = filterStockStatus === 'all' || kit.overallStatus === filterStockStatus;
        
        return matchesSearch && matchesStock;
      });
  }, [usvbKits, searchTerm, filterStockStatus]);

  const handleKitClick = (kit: USVBKit) => {
    // Recalcular status para el kit seleccionado por si los datos cambiaron
    const freshKit = getUSVBKitById(kit.id);
    if(freshKit) {
        const materialsWithStatus = freshKit.materials.map(m => ({ ...m, status: calculateStockStatus(m) }));
        setSelectedKit({...freshKit, materials: materialsWithStatus});
        setIsKitDetailOpen(true);
    }
  };

  const handleQuantityChange = (kitId: string, materialId: string, change: number) => {
    const kit = usvbKits.find(k => k.id === kitId);
    const material = kit?.materials.find(m => m.id === materialId);
    if (material) {
      const newQuantity = material.quantity + change;
      updateUSVBKitMaterialQuantity(kitId, materialId, newQuantity);
      // Actualizar el selectedKit si es el que está abierto
      if (selectedKit && selectedKit.id === kitId) {
        const updatedMaterials = selectedKit.materials.map(m =>
          m.id === materialId ? { ...m, quantity: Math.max(0, newQuantity), status: calculateStockStatus({...m, quantity: Math.max(0, newQuantity)}) } : m
        );
        setSelectedKit({ ...selectedKit, materials: updatedMaterials });
      }
       toast({ title: "Cantidad Actualizada", description: `Stock de ${material.name} ahora es ${Math.max(0, newQuantity)}.` });
    }
  };
  
  const startEditingQuantity = (kitId: string, material: USVBKitMaterial) => {
    setEditingMaterial({ kitId, material });
    setValue('quantity', material.quantity);
  };

  const onSubmitQuantity = (data: MaterialQuantityValues) => {
    if (editingMaterial) {
      updateUSVBKitMaterialQuantity(editingMaterial.kitId, editingMaterial.material.id, data.quantity);
      // Actualizar selectedKit para reflejar el cambio inmediatamente
      if (selectedKit && selectedKit.id === editingMaterial.kitId) {
        const updatedMaterials = selectedKit.materials.map(m =>
          m.id === editingMaterial.material.id ? { ...m, quantity: data.quantity, status: calculateStockStatus({...m, quantity: data.quantity}) } : m
        );
        setSelectedKit({ ...selectedKit, materials: updatedMaterials });
      }
      toast({ title: "Cantidad Guardada", description: `Stock de ${editingMaterial.material.name} es ${data.quantity}.` });
      setEditingMaterial(null);
      reset();
    }
  };

  const KitCard = ({ kit }: { kit: typeof filteredKits[0] }) => {
    const IconComponent = getLucideIcon(kit.iconName);
    return (
      <Card
        className={cn(
          "cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col",
          GDLR_CARD_RADIUS,
          GDLR_CARD_GREY_BG, // Light mode card grey
          DARK_GDLR_CARD_GREY_BG // Dark mode card grey
        )}
        onClick={() => handleKitClick(kit)}
      >
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={cn("text-sm font-medium", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>
            Espacio {kit.number}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn("h-3 w-3 rounded-full", getStockStatusColor(kit.overallStatus))} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Estado General: {kit.overallStatus?.toUpperCase()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center flex-grow p-3">
          <IconComponent className={cn("w-10 h-10 mb-2", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)} />
          <p className={cn("text-xs text-center font-semibold", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>{kit.name}</p>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Dotación de Material USVB"
        description="Visualiza y gestiona el inventario de los kits estándar de una Unidad de Soporte Vital Básico."
      />

      <Card className={cn("mb-6", GDLR_CARD_RADIUS)}>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por número, nombre de kit o material..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">Estado Stock:</span>
            {(['all', 'ok', 'low', 'out'] as const).map(status => (
              <Button
                key={status}
                variant={filterStockStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStockStatus(status)}
                className={cn(
                    filterStockStatus === status && status === 'ok' && 'bg-green-600 hover:bg-green-700',
                    filterStockStatus === status && status === 'low' && 'bg-yellow-500 hover:bg-yellow-600',
                    filterStockStatus === status && status === 'out' && 'bg-red-600 hover:bg-red-700',
                    filterStockStatus === status && 'text-white'
                )}
              >
                {status === 'all' ? 'Todos' : status.toUpperCase()}
              </Button>
            ))}
            <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(''); setFilterStockStatus('all'); }}>
              <FilterX className="h-4 w-4" />
              <span className="sr-only">Limpiar filtros</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {filteredKits.length === 0 && (
        <Card className={cn(GDLR_CARD_RADIUS, GDLR_CARD_GREY_BG, DARK_GDLR_CARD_GREY_BG, "py-10")}>
            <CardContent className="text-center">
                <Info className={cn("mx-auto h-12 w-12 mb-4", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)} />
                <p className={cn("text-lg font-medium", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>
                    No se encontraron kits con los filtros actuales.
                </p>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {filteredKits.map(kit => (
          <KitCard key={kit.id} kit={kit} />
        ))}
      </div>

      {selectedKit && (
        <Dialog open={isKitDetailOpen} onOpenChange={(open) => {
            if (!open) {
                setSelectedKit(null); 
                setEditingMaterial(null);
                reset();
            }
            setIsKitDetailOpen(open);
        }}>
          <DialogContent className={cn("sm:max-w-2xl max-h-[90vh] flex flex-col", GDLR_CARD_RADIUS, GDLR_CARD_GREY_BG, DARK_GDLR_CARD_GREY_BG )}>
            <DialogHeader>
              <DialogTitle className={cn("text-xl flex items-center", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>
                <LucideIcons.Package className="mr-2 h-6 w-6" /> {/* Default icon */}
                {selectedKit.name} (Espacio {selectedKit.number})
              </DialogTitle>
              <DialogDescription className={cn(GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT, "opacity-80")}>
                Detalle de materiales y control de stock.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4 relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                 <Image
                    src={`https://placehold.co/600x300.png?text=${encodeURIComponent(selectedKit.name)}`}
                    alt={`Imagen genérica para ${selectedKit.name}`}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={selectedKit.genericImageHint || "medical equipment"}
                  />
            </div>
            
            <ScrollArea className="flex-grow pr-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-gray-500/50">
                    <TableHead className={cn(GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>Material</TableHead>
                    <TableHead className={cn("text-center", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>Stock Actual</TableHead>
                    <TableHead className={cn("text-center", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>Dotación Ideal</TableHead>
                    <TableHead className={cn("text-center", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>Estado</TableHead>
                    <TableHead className={cn("text-right", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedKit.materials.map(material => (
                    <TableRow key={material.id} className="border-b-gray-500/30 hover:bg-white/10 dark:hover:bg-black/10">
                      <TableCell className={cn("font-medium", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>{material.name}</TableCell>
                      <TableCell className={cn("text-center", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>
                        {editingMaterial?.material.id === material.id ? (
                           <form onSubmit={handleSubmit(onSubmitQuantity)} className="flex items-center justify-center gap-1">
                            <Controller
                                name="quantity"
                                control={control}
                                defaultValue={material.quantity}
                                render={({ field }) => (
                                <Input
                                    {...field}
                                    type="number"
                                    className={cn("h-8 w-16 text-center bg-white/80 dark:bg-black/30 border-gray-400 dark:border-gray-600", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}
                                />
                                )}
                            />
                            <Button type="submit" size="icon" variant="ghost" className={cn("h-7 w-7", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT, "hover:bg-green-500/20")}>
                                <Save className="h-4 w-4 text-green-400" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" onClick={() => {setEditingMaterial(null); reset();}} className={cn("h-7 w-7", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT, "hover:bg-red-500/20")}>
                                <RotateCcw className="h-4 w-4 text-red-400" />
                            </Button>
                           </form>
                        ) : (
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => startEditingQuantity(selectedKit.id, material)}
                          >
                            {material.quantity}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={cn("text-center", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT)}>{material.targetQuantity}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn("h-3 w-3 rounded-full inline-block", getStockStatusColor(material.status))} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT, "hover:bg-white/20 dark:hover:bg-black/20")} onClick={() => handleQuantityChange(selectedKit.id, material.id, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", GDLR_CARD_GREY_TEXT, DARK_GDLR_CARD_GREY_TEXT, "hover:bg-white/20 dark:hover:bg-black/20")} onClick={() => handleQuantityChange(selectedKit.id, material.id, -1)} disabled={material.quantity <= 0}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="pt-4 border-t border-gray-500/30">
                <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-gray-400 dark:border-gray-600 text-gray-200 dark:text-gray-300" onClick={() => setIsKitDetailOpen(false)}>Cerrar Detalle</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

