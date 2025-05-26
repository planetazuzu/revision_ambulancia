"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { ConsumableMaterial, NonConsumableMaterial, Ambulance } from '@/types';
import { FilePenLine, Trash2, PackagePlus, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialForm } from './MaterialForm';
import { useAppData } from '@/contexts/AppDataContext';
import { ScrollArea } from '../ui/scroll-area';

interface InventoryTableProps<T extends ConsumableMaterial | NonConsumableMaterial> {
  ambulance: Ambulance;
  materials: T[];
  materialType: 'consumable' | 'non-consumable';
  columns: { header: string; accessor: (item: T) => React.ReactNode }[];
}

export function InventoryTable<T extends ConsumableMaterial | NonConsumableMaterial>({
  ambulance,
  materials,
  materialType,
  columns,
}: InventoryTableProps<T>) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<T | null>(null);
  const { deleteConsumableMaterial, deleteNonConsumableMaterial } = useAppData();

  const handleAddNew = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const handleEdit = (material: T) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (materialType === 'consumable') {
      deleteConsumableMaterial(id);
    } else {
      deleteNonConsumableMaterial(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{materialType === 'consumable' ? 'Materiales Consumibles' : 'Materiales No Consumibles'}</h3>
        <div className="flex gap-2">
          {materialType === 'consumable' && (
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-2 h-4 w-4" /> Importar CSV/Excel
            </Button>
          )}
          <Button onClick={handleAddNew} size="sm">
            <PackagePlus className="mr-2 h-4 w-4" /> Añadir Nuevo
          </Button>
        </div>
      </div>
       <ScrollArea className="h-[300px] rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                {columns.map((col) => (
                <TableHead key={col.header}>{col.header}</TableHead>
                ))}
                <TableHead className="text-right w-[100px]">Acciones</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {materials.length > 0 ? materials.map((material) => (
                <TableRow key={material.id}>
                {columns.map((col) => (
                    <TableCell key={col.header}>{col.accessor(material)}</TableCell>
                ))}
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(material)} className="mr-1">
                    <FilePenLine className="h-4 w-4" />
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
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el material.
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
            )) : (
                <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                        No se encontraron materiales {materialType === 'consumable' ? 'consumibles' : 'no consumibles'}.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </ScrollArea>

      <MaterialForm
        ambulance={ambulance}
        materialType={materialType}
        material={editingMaterial}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}

export const consumableColumns = [
  { header: 'Nombre', accessor: (item: ConsumableMaterial) => item.name },
  { header: 'Referencia', accessor: (item: ConsumableMaterial) => item.reference },
  { header: 'Cantidad', accessor: (item: ConsumableMaterial) => item.quantity },
  { header: 'Fecha Caducidad', accessor: (item: ConsumableMaterial) => format(new Date(item.expiryDate), 'PPP', { locale: es }) },
];

export const nonConsumableColumns = [
  { header: 'Nombre', accessor: (item: NonConsumableMaterial) => item.name },
  { header: 'Número de Serie', accessor: (item: NonConsumableMaterial) => item.serialNumber },
  { header: 'Estado', accessor: (item: NonConsumableMaterial) => item.status },
];
