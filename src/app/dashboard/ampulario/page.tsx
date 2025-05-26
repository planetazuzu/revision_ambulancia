"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    // In a real app, spaces might be fetched too. For now, using hardcoded/store based.
    // This is a placeholder if we were to fetch spaces.
    // For now, we'll assume the initial spaces from the store are sufficient.
    // We'll add a function to fetch them if needed, but for now, they are part of the server-side store.
    // Let's assume we have a way to get a list of spaces, or at least the default.
    // For now, using what's in ampularioStore via a new API endpoint if necessary or passing as prop.
    // Simplified: just setting one space for now for the dropdown.
    // In a real scenario, you'd fetch a list of available spaces.
    // For now, this is a limitation of the mock setup.
    // We'll rely on the server-side store for space validation during import.
    setSpaces([{ id: 'space23', name: 'Ampulario Principal' }, { id: 'space01', name: 'Ambulancia 01 Stock Local' }]);
  }, []);
  
  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSpaceId) params.append('spaceId', selectedSpaceId);
      if (filterRoute !== 'all') params.append('routeName', filterRoute);
      if (searchTerm) params.append('nameQuery', searchTerm);
      
      const response = await fetch(`/api/materials?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();
      setMaterials(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not fetch materials.", variant: "destructive" });
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
        throw new Error(result.error || 'CSV import failed. Details: ' + (result.details || []).join(', '));
      }
      toast({ title: "Import Successful", description: `${result.imported} materials imported.` });
      fetchMaterials(); // Refresh list
    } catch (error: any) {
      toast({ title: "Import Error", description: error.message, variant: "destructive" });
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
        throw new Error(errorData.error || 'Failed to delete material.');
      }
      toast({ title: "Material Deleted", description: "The material has been removed." });
      fetchMaterials(); // Refresh list
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRoute('all');
    setSelectedSpaceId(DEFAULT_SPACE_ID); // Reset to default space or implement logic to clear/select 'all spaces' if desired
  };

  const filteredMaterials = useMemo(() => {
    // Client-side filtering if needed, but API is already filtering
    return materials;
  }, [materials]);


  return (
    <div>
      <PageHeader
        title="Ampulario Management"
        description={`Manage materials for ${spaces.find(s => s.id === selectedSpaceId)?.name || 'selected space'}.`}
        action={
          <div className="flex gap-2">
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Material
            </Button>
            <Button asChild variant="outline">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
                <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine the list of materials.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <Label htmlFor="search-material">Search by Name</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-material"
                        type="search"
                        placeholder="Search material name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-full"
                    />
                </div>
            </div>
            <div className="flex-1 sm:flex-initial sm:w-1/3">
                <Label htmlFor="filter-space">Space</Label>
                 <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                    <SelectTrigger id="filter-space">
                        <SelectValue placeholder="Select space" />
                    </SelectTrigger>
                    <SelectContent>
                        {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex-1 sm:flex-initial sm:w-1/3">
                <Label htmlFor="filter-route">Route</Label>
                <Select value={filterRoute} onValueChange={(value) => setFilterRoute(value as MaterialRoute | 'all')}>
                    <SelectTrigger id="filter-route">
                        <SelectValue placeholder="Filter by route" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Routes</SelectItem>
                        {(["IV/IM", "Nebulizador", "Oral"] as MaterialRoute[]).map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                    <FilterX className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Material List</CardTitle>
          <CardDescription>
            Showing {filteredMaterials.length} material(s) for the selected criteria.
            Materials expiring within 3 days are highlighted in orange, expired materials in red.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-26rem)] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading materials...</TableCell></TableRow>
                ) : filteredMaterials.length > 0 ? (
                  filteredMaterials.map((material) => {
                    let expiryStatusClass = '';
                    let daysToExpiry = Infinity;
                    if (material.expiry_date) {
                        const expiry = parseISO(material.expiry_date);
                        if (isValid(expiry)) {
                            daysToExpiry = differenceInDays(expiry, new Date());
                            if (daysToExpiry < 0) expiryStatusClass = 'bg-destructive/10 text-destructive'; // Expired
                            else if (daysToExpiry <= 3) expiryStatusClass = 'bg-orange-500/10 text-orange-600'; // Expiring soon (using direct orange for visibility)
                        }
                    }
                    return (
                      <TableRow key={material.id} className={cn(expiryStatusClass)}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.dose || 'N/A'}</TableCell>
                        <TableCell>{material.unit || 'N/A'}</TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell>{material.route}</TableCell>
                        <TableCell>
                          {material.expiry_date ? format(parseISO(material.expiry_date), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(material)} className="mr-1">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the material "{material.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(material.id)}>
                                  Delete
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
                      No materials found for the current filters.
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

// Add Label component if not globally available, or import from ui
const Label = ({ htmlFor, children, className }: { htmlFor: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-muted-foreground mb-1", className)}>
    {children}
  </label>
);
