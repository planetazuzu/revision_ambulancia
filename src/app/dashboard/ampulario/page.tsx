
"use client";

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, PlusCircle, Edit, Trash2, FilterX, Search, Home, ArchiveRestore, FileSpreadsheet, Info } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext'; 

const DEFAULT_SPACE_ID = 'space23'; 

export default function GestionMaterialesPage() { 
  const { user } = useAuth(); 
  const [materials, setMaterials] = useState<AmpularioMaterial[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(''); // Iniciar vacío hasta que carguen espacios
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoute, setFilterRoute] = useState<MaterialRoute | 'all'>('all');
  const { toast } = useToast();

  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AmpularioMaterial | null>(null);

  const [isSpaceFormOpen, setIsSpaceFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  const isCoordinator = user?.role === 'coordinador'; 

  const fetchSpaces = useCallback(async (resetSelectedSpace = false) => {
    setIsLoadingSpaces(true);
    try {
      const response = await fetch('/api/spaces');
      if (!response.ok) throw new Error('No se pudieron cargar los espacios');
      const data: Space[] = await response.json();
      setSpaces(data);

      if (data.length > 0) {
        if (resetSelectedSpace || !data.find(s => s.id === selectedSpaceId)) {
          const defaultSpace = data.find(s => s.id === DEFAULT_SPACE_ID) || data[0];
          setSelectedSpaceId(defaultSpace.id);
        }
      } else {
        setSelectedSpaceId(''); // No spaces available
        setMaterials([]); // Clear materials if no spaces
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudieron cargar los espacios.", variant: "destructive" });
      setSpaces([]); 
      setSelectedSpaceId('');
      setMaterials([]);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [toast, selectedSpaceId]); // selectedSpaceId is needed here to re-evaluate if current selection is valid among new spaces


  const fetchMaterials = useCallback(async () => {
    if (!selectedSpaceId) { // Don't fetch if no space is selected
        setMaterials([]);
        setIsLoadingMaterials(false);
        return;
    }

    setIsLoadingMaterials(true);
    try {
      const params = new URLSearchParams();
      params.append('spaceId', selectedSpaceId); // Always use selectedSpaceId
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
  }, [selectedSpaceId, filterRoute, searchTerm, toast]);

  // Effect to load spaces on component mount
  useEffect(() => {
    fetchSpaces(true); // resetSelectedSpace to true to ensure a default is picked
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  // Effect to load materials when selectedSpaceId changes or filters change
  useEffect(() => {
    if (!isLoadingSpaces) { // Only fetch materials if spaces have been loaded/attempted
        if (selectedSpaceId) {
            fetchMaterials();
        } else {
            // If no space is selected (e.g., no spaces exist), clear materials
            setMaterials([]);
            setIsLoadingMaterials(false); 
        }
    }
  }, [selectedSpaceId, fetchMaterials, isLoadingSpaces]);


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
        throw new Error(result.error || 'Falló la importación del archivo. Detalles: ' + (result.details || []).join(', '));
      }
      toast({ title: "Importación Exitosa", description: `${result.imported} materiales importados.` });
      fetchMaterials(); 
    } catch (error: any) {
      toast({ title: "Error de Importación", description: error.message, variant: "destructive" });
    } finally {
        if (event.target.value) { 
            event.target.value = ''; 
        }
    }
  };

  
  const handleAddNewMaterial = () => {
    if (spaces.length === 0) {
      toast({ title: "Acción no disponible", description: "Debe crear al menos un espacio de almacenamiento antes de añadir materiales.", variant: "destructive" });
      return;
    }
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
      fetchMaterials(); 
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  
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
      await fetchSpaces(true); // Refetch spaces and reset selected space if necessary
    } catch (error: any) {
      toast({ title: "Error al Eliminar Espacio", description: error.message, variant: "destructive" });
    }
  };


  const clearFilters = () => {
    setSearchTerm('');
    setFilterRoute('all');
    if (spaces.length > 0) {
        const defaultSpace = spaces.find(s => s.id === DEFAULT_SPACE_ID) || spaces[0];
        setSelectedSpaceId(defaultSpace.id); // This will trigger fetchMaterials due to useEffect dependency
    } else {
        setSelectedSpaceId('');
        setMaterials([]); // Clear materials if no spaces are available
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
        title="Gestión de Materiales Central"
        description="Gestionar materiales y espacios de almacenamiento del inventario central."
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
                        <CardDescription>
                          Refinar la lista de materiales para {isLoadingSpaces && !selectedSpaceId ? "..." : (spaces.find(s => s.id === selectedSpaceId)?.name || (spaces.length > 0 ? 'un espacio' : 'ningún espacio seleccionado'))}.
                          {spaces.length === 0 && !isLoadingSpaces && " Por favor, crea un espacio en la pestaña 'Espacios de Almacenamiento'."}
                        </CardDescription>
                    </div>
                    {isCoordinator && ( 
                      <div className="flex gap-2">
                          <Button onClick={handleAddNewMaterial} disabled={spaces.length === 0}>
                              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Material
                          </Button>
                          <Button asChild variant="outline" disabled={spaces.length === 0}>
                          <label htmlFor="file-upload" className={cn("cursor-pointer flex items-center", spaces.length === 0 && "cursor-not-allowed opacity-50")}>
                              <Upload className="mr-2 h-4 w-4" /> Importar Archivo
                              <input id="file-upload" type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" disabled={spaces.length === 0} />
                          </label>
                          </Button>
                      </div>
                    )}
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
                            disabled={spaces.length === 0}
                        />
                    </div>
                </div>
                <div className="flex-1 sm:flex-initial sm:w-1/3">
                    <Label htmlFor="filter-space" className="block text-sm font-medium text-muted-foreground mb-1">Espacio</Label>
                    <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId} disabled={isLoadingSpaces || spaces.length === 0}>
                        <SelectTrigger id="filter-space">
                            <SelectValue placeholder={isLoadingSpaces ? "Cargando espacios..." : (spaces.length === 0 ? "No hay espacios" : "Seleccionar espacio")} />
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
                    <Select value={filterRoute} onValueChange={(value) => setFilterRoute(value as MaterialRoute | 'all')} disabled={spaces.length === 0}>
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
                    <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto" disabled={spaces.length === 0 && !searchTerm && filterRoute === 'all'}>
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
                      {isCoordinator && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMaterials || (isLoadingSpaces && selectedSpaceId) ? (
                      <TableRow><TableCell colSpan={isCoordinator ? 7 : 6} className="h-24 text-center">Cargando materiales...</TableCell></TableRow>
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
                            {isCoordinator && (
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
                            )}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isCoordinator ? 7 : 6} className="h-24 text-center">
                          {spaces.length === 0 && !isLoadingSpaces
                            ? <div className="flex flex-col items-center gap-2"><Info className="h-8 w-8 text-muted-foreground" /><p>No hay espacios de almacenamiento definidos. <br/>Por favor, crea uno en la pestaña 'Espacios de Almacenamiento' para empezar.</p></div>
                            : "No se encontraron materiales para los filtros o el espacio actual."
                          }
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
                            <CardDescription>Gestionar los diferentes lugares donde se almacenan los materiales del inventario central.</CardDescription>
                        </div>
                        {isCoordinator && ( 
                          <Button onClick={handleAddNewSpace}>
                              <ArchiveRestore className="mr-2 h-4 w-4" /> Añadir Nuevo Espacio
                          </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre del Espacio</TableHead>
                                    <TableHead>ID</TableHead>
                                    {isCoordinator && <TableHead className="text-right">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingSpaces ? (
                                     <TableRow><TableCell colSpan={isCoordinator ? 3 : 2} className="h-24 text-center">Cargando espacios...</TableCell></TableRow>
                                ) : spaces.length > 0 ? (
                                    spaces.map((space) => (
                                        <TableRow key={space.id}>
                                            <TableCell className="font-medium">{space.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{space.id}</TableCell>
                                            {isCoordinator && (
                                              <TableCell className="text-right">
                                                  <Button variant="ghost" size="icon" onClick={() => handleEditSpace(space)} className="mr-1">
                                                      <Edit className="h-4 w-4" />
                                                      <span className="sr-only">Editar Espacio</span>
                                                  </Button>
                                                  <AlertDialog>
                                                      <AlertDialogTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" disabled={space.id === DEFAULT_SPACE_ID && spaces.length === 1}>
                                                          <Trash2 className="h-4 w-4" />
                                                          <span className="sr-only">Eliminar Espacio</span>
                                                      </Button>
                                                      </AlertDialogTrigger>
                                                      <AlertDialogContent>
                                                      <AlertDialogHeader>
                                                          <AlertDialogTitle>¿Estás seguro de eliminar el espacio "{space.name}"?</AlertDialogTitle>
                                                          <AlertDialogDescription>
                                                          Esta acción no se puede deshacer. Solo se puede eliminar un espacio si no está siendo utilizado por ningún material.
                                                          El espacio por defecto no se puede eliminar si es el único disponible.
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
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={isCoordinator ? 3 : 2} className="h-24 text-center">
                                            No hay espacios de almacenamiento definidos. {isCoordinator ? "Comienza añadiendo uno." : ""}
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
          spaces={spaces} // Pasar todos los espacios disponibles al formulario
          isOpen={isMaterialFormOpen}
          onOpenChange={setIsMaterialFormOpen}
          onSave={() => {
            fetchMaterials(); // Solo necesita refetch los materiales del espacio actual
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
                await fetchSpaces(true); // Refetch y potencialmente reset selectedSpaceId
                setIsSpaceFormOpen(false);
            }}
        />
      )}
    </div>
  );
}

    