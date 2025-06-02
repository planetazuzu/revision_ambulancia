
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from '@/components/shared/PageHeader';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ListChecks, PlusCircle, Edit3, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const mechanicalItemSchema = z.object({
  name: z.string().min(3, "El nombre del ítem debe tener al menos 3 caracteres."),
});
type MechanicalItemFormValues = z.infer<typeof mechanicalItemSchema>;

export default function ManageMechanicalReviewItemsPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    getConfigurableMechanicalReviewItems, 
    addConfigurableMechanicalReviewItem,
    updateConfigurableMechanicalReviewItem,
    deleteConfigurableMechanicalReviewItem
  } = useAppData();
  const { toast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<{ name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ name: string } | null>(null);

  const form = useForm<MechanicalItemFormValues>({
    resolver: zodResolver(mechanicalItemSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'coordinador') {
      toast({ title: "Acceso Denegado", description: "No tienes permiso.", variant: "destructive" });
      router.replace('/dashboard/settings');
    } else if (!authLoading && user) {
      setItems(getConfigurableMechanicalReviewItems());
    }
  }, [user, authLoading, router, toast, getConfigurableMechanicalReviewItems]);

  const handleOpenDialog = (item: { name: string } | null = null) => {
    setEditingItem(item);
    form.reset({ name: item?.name || "" });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: MechanicalItemFormValues) => {
    if (editingItem) {
      const success = updateConfigurableMechanicalReviewItem(editingItem.name, data.name);
      if (success) {
        setItems(getConfigurableMechanicalReviewItems()); // Refresh list
        setIsDialogOpen(false);
      }
    } else {
      addConfigurableMechanicalReviewItem(data);
      setItems(getConfigurableMechanicalReviewItems()); // Refresh list
      setIsDialogOpen(false);
    }
  };

  const handleDelete = (itemName: string) => {
    const success = deleteConfigurableMechanicalReviewItem(itemName);
    if (success) {
      setItems(getConfigurableMechanicalReviewItems()); // Refresh list
    }
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
        title="Gestionar Ítems de Plantilla para Revisión Mecánica"
        description="Añade, edita o elimina los ítems que aparecerán por defecto en las nuevas revisiones mecánicas."
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
          <div className="flex justify-between items-center">
            <CardTitle>Ítems de Revisión Actuales ({items.length})</CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Ítem
            </Button>
          </div>
          <CardDescription>Estos ítems se usarán como base para las nuevas revisiones mecánicas. Las revisiones ya creadas no se verán afectadas por cambios aquí.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay ítems de revisión configurados. Añade algunos para empezar.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-26rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Ítem</TableHead>
                    <TableHead className="text-right w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={`${item.name}-${index}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)} className="mr-1">
                          <Edit3 className="h-4 w-4" /> <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-4 w-4" /> <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar el ítem de revisión "{item.name}" de la plantilla? 
                                Esto no afectará a las revisiones ya guardadas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.name)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Ítem de Revisión" : "Añadir Nuevo Ítem de Revisión"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifica el nombre del ítem de la plantilla." : "Introduce el nombre para el nuevo ítem de la plantilla."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Ítem</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Nivel de aceite motor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">{editingItem ? "Guardar Cambios" : "Añadir Ítem"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
