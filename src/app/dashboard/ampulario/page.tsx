
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, PlusCircle, Edit, Trash2, FilterX, Search } from 'lucide-react';
import type { AmpularioMaterial, MaterialRoute, Space } from '@/types';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AmpularioMaterialForm } from '@/components/ampulario/AmpularioMaterialForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const DEFAULT_SPACE_ID = 'space23'; // "Ampulario Principal"

export default function AmpularioPage() {
  const [materials, setMaterials] = useState<AmpularioMaterial[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(DEFAULT_SPACE_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoute, setFilterRoute] = useState<MaterialRoute | 'all'>('all');
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AmpularioMaterial | null>(null);

  const fetchSpaces = useCallback(async () => {
    // Hardcoded spaces for now, as per current app structure.
    setSpaces([{ id: 'space23', name: 'Ampulario Principal' }, { id: 'space01', name: 'Stock Local Ambulancia 01' }]);
  }, []);

  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSpaceId) params.append('spaceId', selectedSpaceId);
      if (filterRoute !== 'all') params.append('routeName', filterRoute);
      if (searchTerm) params.append('nameQuery', searchTerm);

      const response = await fetch(`/api/materials?${params.toString()}`);
      if (!response.ok) throw new Error('No se pudieron cargar los materiales');
      const data = await response.json();
      setMaterials(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudieron cargar los materiales.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSpaceId, filterRoute, searchTerm, toast]);

  useEffect(() => {
    fetchSpaces();
    fetchMaterials();
  }, [fetchMaterials, fetchSpaces]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ampulario/import', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falló la importación del CSV. Detalles: ' + (result.details || []).join(', '));
      }
      toast({ title: "Importación Exitosa", description: `${result.imported} materiales importados.` });
      fetchMaterials(); // Refresh list
    } catch (error: any) {
      toast({ title: "Error de Importación", description: error.message, variant: "destructive" });
    } finally {
        event.target.value = ''; // Reset file input
    }
  };

  const handleAddNew = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const handleEdit = (material: AmpularioMaterial) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleDelete = async (materialId: string) => {
    try {
      const response = await fetch(`/api/materials/${materialId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar el material.');
      }
      toast({ title: "Material Eliminado", description: "El material ha sido eliminado." });
      fetchMaterials(); // Refresh list
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRoute('all');
    setSelectedSpaceId(DEFAULT_SPACE_ID);
  };

  const filteredMaterials = useMemo(() => {
    return materials;
  }, [materials]);

  const materialRoutes: { value: MaterialRoute | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas las Vías' },
    { value: 'IV/IM', label: 'IV/IM' },
    { value: 'Nebulizador', label: 'Nebulizador' },
    { value: 'Oral', label: 'Oral' },
  ];


  return (
    <div>
      <PageHeader
        title="Gestión de Ampulario"
        description={`Gestionar materiales para ${spaces.find(s => s.id === selectedSpaceId)?.name || 'el espacio seleccionado'}.`}
        action={
          <div className="flex gap-2">
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Material
            </Button>
            <Button asChild variant="outline">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Importar CSV
                <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refinar la lista de materiales.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <Label htmlFor="search-material" className="block text-sm font-medium text-muted-foreground mb-1">Buscar por Nombre</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-material"
                        type="search"
                        placeholder="Buscar nombre de material..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-full"
                    />
                </div>
            </div>
            <div className="flex-1 sm:flex-initial sm:w-1/3">
                <Label htmlFor="filter-space" className="block text-sm font-medium text-muted-foreground mb-1">Espacio</Label>
                 <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                    <SelectTrigger id="filter-space">
                        <SelectValue placeholder="Seleccionar espacio" />
                    </SelectTrigger>
                    <SelectContent>
                        {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex-1 sm:flex-initial sm:w-1/3">
                <Label htmlFor="filter-route" className="block text-sm font-medium text-muted-foreground mb-1">Vía</Label>
                <Select value={filterRoute} onValueChange={(value) => setFilterRoute(value as MaterialRoute | 'all')}>
                    <SelectTrigger id="filter-route">
                        <SelectValue placeholder="Filtrar por vía" />
                    </SelectTrigger>
                    <SelectContent>
                        {materialRoutes.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                    <FilterX className="mr-2 h-4 w-4" /> Limpiar Filtros
                </Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Materiales</CardTitle>
          <CardDescription>
            Mostrando {filteredMaterials.length} material(es) para los criterios seleccionados.
            Los materiales que caducan en 3 días o menos están resaltados en naranja, los caducados en rojo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-26rem)] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Vía</TableHead>
                  <TableHead>Fecha Caducidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">Cargando materiales...</TableCell></TableRow>
                ) : filteredMaterials.length > 0 ? (
                  filteredMaterials.map((material) => {
                    let expiryStatusClass = '';
                    let daysToExpiry = Infinity;
                    if (material.expiry_date) {
                        const expiry = parseISO(material.expiry_date);
                        if (isValid(expiry)) {
                            daysToExpiry = differenceInDays(expiry, new Date());
                            if (daysToExpiry < 0) expiryStatusClass = 'bg-destructive/10 text-destructive';
                            else if (daysToExpiry <= 3) expiryStatusClass = 'bg-orange-500/10 text-orange-600';
                        }
                    }
                    return (
                      <TableRow key={material.id} className={cn(expiryStatusClass)}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.dose || 'N/D'}</TableCell>
                        <TableCell>{material.unit || 'N/D'}</TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell>{material.route}</TableCell>
                        <TableCell>
                          {material.expiry_date ? format(parseISO(material.expiry_date), 'PPP') : 'N/D'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(material)} className="mr-1">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el material "{material.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(material.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron materiales para los filtros actuales.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {isFormOpen && (
        <AmpularioMaterialForm
          material={editingMaterial}
          spaces={spaces}
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSave={fetchMaterials}
        />
      )}
    </div>
  );
}
