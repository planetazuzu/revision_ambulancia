
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, PlusCircle, Edit, Trash2, FilterX, Search, Home, ArchiveRestore } from 'lucide-react';
import type { AmpularioMaterial, MaterialRoute, Space } from '@/types';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AmpularioMaterialForm } from '@/components/ampulario/AmpularioMaterialForm';
import { SpaceFormDialog } from '@/components/ampulario/SpaceFormDialog';
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

const DEFAULT_SPACE_ID = 'space23'; // "Ampulario Principal" - Asumiendo que este ID existirá o será el primero

export default function AmpularioPage() {
  const [materials, setMaterials] = useState<AmpularioMaterial[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(DEFAULT_SPACE_ID);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoute, setFilterRoute] = useState<MaterialRoute | 'all'>('all');
  const { toast } = useToast();

  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AmpularioMaterial | null>(null);

  const [isSpaceFormOpen, setIsSpaceFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);


  const fetchSpaces = useCallback(async (resetSelectedSpace = false) => {
    setIsLoadingSpaces(true);
    try {
      const response = await fetch('/api/spaces');
      if (!response.ok) throw new Error('No se pudieron cargar los espacios');
      const data: Space[] = await response.json();
      setSpaces(data);

      if (resetSelectedSpace || !data.find(s => s.id === selectedSpaceId) || data.length === 0) {
        if (data.length > 0) {
          const defaultSpace = data.find(s => s.id === DEFAULT_SPACE_ID) || data[0];
          setSelectedSpaceId(defaultSpace.id);
        } else {
          setSelectedSpaceId('');
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudieron cargar los espacios.", variant: "destructive" });
      setSpaces([]); // Clear spaces on error
      setSelectedSpaceId('');
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [toast, selectedSpaceId]);


  const fetchMaterials = useCallback(async () => {
    if (!selectedSpaceId && spaces.length > 0) { // If no space is selected but spaces are available, pick first
        setSelectedSpaceId(spaces[0].id);
        return; // fetchMaterials will be re-triggered by selectedSpaceId change
    }
    if (!selectedSpaceId && spaces.length === 0) { // No spaces, no materials to fetch
        setMaterials([]);
        setIsLoadingMaterials(false);
        return;
    }

    setIsLoadingMaterials(true);
    try {
      const params = new URLSearchParams();
      if (selectedSpaceId) params.append('spaceId', selectedSpaceId);
      if (filterRoute !== 'all') params.append('routeName', filterRoute);
      if (searchTerm) params.append('nameQuery', searchTerm);

      const response = await fetch(`/api/materials?${params.toString()}`);
      if (!response.ok) throw new Error('No se pudieron cargar los materiales');
      const data = await response.json();
      setMaterials(data);
    } catch (error: any)      {
      toast({ title: "Error", description: error.message || "No se pudieron cargar los materiales.", variant: "destructive" });
       setMaterials([]);
    } finally {
      setIsLoadingMaterials(false);
    }
  }, [selectedSpaceId, filterRoute, searchTerm, toast, spaces]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]); // fetchSpaces has its own dependencies

  useEffect(() => {
    if (!isLoadingSpaces) { // Only fetch materials once spaces are loaded (or attempted)
        fetchMaterials();
    }
  }, [fetchMaterials, isLoadingSpaces]);


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

  // Material form handlers
  const handleAddNewMaterial = () => {
    setEditingMaterial(null);
    setIsMaterialFormOpen(true);
  };

  const handleEditMaterial = (material: AmpularioMaterial) => {
    setEditingMaterial(material);
    setIsMaterialFormOpen(true);
  };

  const handleDeleteMaterial = async (materialId: string) => {
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

  // Space form handlers
  const handleAddNewSpace = () => {
    setEditingSpace(null);
    setIsSpaceFormOpen(true);
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setIsSpaceFormOpen(true);
  };

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar el espacio. Asegúrate de que no esté en uso.');
      }
      toast({ title: "Espacio Eliminado", description: "El espacio ha sido eliminado." });
      await fetchSpaces(true); // Refresh list of spaces and potentially reset selectedSpaceId
    } catch (error: any) {
      toast({ title: "Error al Eliminar Espacio", description: error.message, variant: "destructive" });
    }
  };


  const clearFilters = () => {
    setSearchTerm('');
    setFilterRoute('all');
    if (spaces.length > 0) {
        const defaultSpace = spaces.find(s => s.id === DEFAULT_SPACE_ID) || spaces[0];
        setSelectedSpaceId(defaultSpace.id);
    } else {
        setSelectedSpaceId('');
    }
  };

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
        description="Gestionar materiales y espacios de almacenamiento del ampulario."
      />
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="spaces">Espacios de Almacenamiento</TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card className="mb-6">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Filtros de Materiales</CardTitle>
                        <CardDescription>Refinar la lista de materiales para {isLoadingSpaces ? "..." : (spaces.find(s => s.id === selectedSpaceId)?.name || 'ningún espacio seleccionado')}.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAddNewMaterial}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Material
                        </Button>
                        <Button asChild variant="outline">
                        <label htmlFor="csv-upload" className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" /> Importar CSV
                            <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                        </label>
                        </Button>
                    </div>
                </div>
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
                    <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId} disabled={isLoadingSpaces || spaces.length === 0}>
                        <SelectTrigger id="filter-space">
                            <SelectValue placeholder={isLoadingSpaces ? "Cargando espacios..." : (spaces.length === 0 ? "No hay espacios disponibles" : "Seleccionar espacio")} />
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
                Mostrando {materials.length} material(es) para los criterios seleccionados.
                Materiales que caducan en 3 días o menos resaltados en naranja, caducados en rojo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-30rem)] rounded-md border">
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
                    {isLoadingMaterials ? (
                      <TableRow><TableCell colSpan={7} className="h-24 text-center">Cargando materiales...</TableCell></TableRow>
                    ) : materials.length > 0 ? (
                      materials.map((material) => {
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
                              <Button variant="ghost" size="icon" onClick={() => handleEditMaterial(material)} className="mr-1">
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
                                    <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)}>
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
        </TabsContent>

        {/* Spaces Tab */}
        <TabsContent value="spaces">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Espacios de Almacenamiento</CardTitle>
                            <CardDescription>Gestionar los diferentes lugares donde se almacenan los materiales del ampulario.</CardDescription>
                        </div>
                        <Button onClick={handleAddNewSpace}>
                            <ArchiveRestore className="mr-2 h-4 w-4" /> Añadir Nuevo Espacio
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre del Espacio</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingSpaces ? (
                                     <TableRow><TableCell colSpan={3} className="h-24 text-center">Cargando espacios...</TableCell></TableRow>
                                ) : spaces.length > 0 ? (
                                    spaces.map((space) => (
                                        <TableRow key={space.id}>
                                            <TableCell className="font-medium">{space.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{space.id}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditSpace(space)} className="mr-1">
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Editar Espacio</span>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Eliminar Espacio</span>
                                                    </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro de eliminar el espacio "{space.name}"?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Solo se puede eliminar un espacio si no está siendo utilizado por ningún material.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteSpace(space.id)}>
                                                        Eliminar Espacio
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No hay espacios de almacenamiento definidos. Comienza añadiendo uno.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>


      {isMaterialFormOpen && (
        <AmpularioMaterialForm
          material={editingMaterial}
          spaces={spaces}
          isOpen={isMaterialFormOpen}
          onOpenChange={setIsMaterialFormOpen}
          onSave={() => {
            fetchMaterials();
            setIsMaterialFormOpen(false);
          }}
        />
      )}

      {isSpaceFormOpen && (
        <SpaceFormDialog
            space={editingSpace}
            isOpen={isSpaceFormOpen}
            onOpenChange={setIsSpaceFormOpen}
            onSave={async () => {
                await fetchSpaces(true); // Pass true to potentially reset selectedSpaceId
                setIsSpaceFormOpen(false);
            }}
        />
      )}
    </div>
  );
}

    