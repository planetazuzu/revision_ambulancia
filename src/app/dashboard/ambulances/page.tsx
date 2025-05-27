
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Ambulance as AmbulanceIcon, PlusCircle, FilePenLine, Trash2, Wrench, Sparkles, Box as BoxIcon, CheckCircle, Info } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Ambulance } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { AmbulanceFormSheet } from "@/components/ambulances/AmbulanceFormSheet";

export default function AmbulancesPage() {
  const { user, loading: authLoading } = useAuth();
  const { ambulances, deleteAmbulance, getAllAmbulancesCount } = useAppData();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null);

  const handleAddNew = () => {
    setEditingAmbulance(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (ambulance: Ambulance) => {
    setEditingAmbulance(ambulance);
    setIsSheetOpen(true);
  };

  const getAmbulanceStatus = (ambulance: Ambulance) => {
    if (!ambulance.mechanicalReviewCompleted) return { text: "Revisión Mecánica", Icon: Wrench, color: "text-orange-500", pathSuffix: "review" };
    if (!ambulance.cleaningCompleted) return { text: "Limpieza", Icon: Sparkles, color: "text-blue-500", pathSuffix: "cleaning" };
    if (!ambulance.inventoryCompleted) return { text: "Control de Inventario", Icon: BoxIcon, color: "text-purple-500", pathSuffix: "inventory" };
    return { text: "Lista", Icon: CheckCircle, color: "text-green-500", pathSuffix: "review" };
  }

  const canManageAmbulances = user?.role === 'coordinador'; // Changed from 'admin'
  const totalAmbulancesInSystem = getAllAmbulancesCount();

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Info className="h-8 w-8 animate-pulse" /> <p className="ml-2">Cargando datos de usuario...</p></div>;
  }

  return (
    <div>
      <PageHeader
        title="Gestionar Ambulancias"
        description={
          canManageAmbulances 
            ? `Ver, añadir, editar o eliminar registros de ambulancias. Total en sistema: ${totalAmbulancesInSystem}`
            : (ambulances.length > 0 ? `Viendo tu ambulancia asignada: ${ambulances[0].name}` : "No tienes una ambulancia asignada.")
        }
        action={
          canManageAmbulances ? (
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Ambulancia
            </Button>
          ) : null
        }
      />

      {ambulances.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <AmbulanceIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <CardTitle className="mt-4">
              {canManageAmbulances ? "No se encontraron Ambulancias" : "No tienes una Ambulancia Asignada"}
            </CardTitle>
            <CardDescription>
              {canManageAmbulances 
                ? "Comienza añadiendo tu primera ambulancia." 
                : "Por favor, contacta a un coordinador para que te asigne una ambulancia."}
            </CardDescription>
          </CardHeader>
          {canManageAmbulances && (
            <CardContent>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ambulancia
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ambulances.map((ambulance) => {
            const status = getAmbulanceStatus(ambulance);
            return (
            <Card key={ambulance.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                   <CardTitle className="flex items-center gap-2">
                        <AmbulanceIcon className="h-6 w-6 text-primary" />
                        {ambulance.name}
                    </CardTitle>
                   <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color} bg-opacity-10 ${status.color.replace('text-', 'bg-')}/10`}>
                        <status.Icon className="h-3 w-3" />
                        {status.text}
                    </div>
                </div>
                <CardDescription>
                  {ambulance.licensePlate} | {ambulance.model} ({ambulance.year})
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Última Revisión Mecánica: {ambulance.lastMechanicalReview ? format(new Date(ambulance.lastMechanicalReview), 'PPP', { locale: es }) : 'N/D'}</p>
                  <p>Última Limpieza: {ambulance.lastCleaning ? format(new Date(ambulance.lastCleaning), 'PPP', { locale: es }) : 'N/D'}</p>
                  <p>Último Control de Inventario: {ambulance.lastInventoryCheck ? format(new Date(ambulance.lastInventoryCheck), 'PPP', { locale: es }) : 'N/D'}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2 border-t pt-4">
                 <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/ambulances/${ambulance.id}/${status.pathSuffix}`}>
                        {status.text === "Lista" ? "Ver Detalles" : `Iniciar ${status.text}`}
                    </Link>
                 </Button>
                {canManageAmbulances && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(ambulance)}>
                            <FilePenLine className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la ambulancia
                                y todos los datos relacionados.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteAmbulance(ambulance.id)}>
                                Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
              </CardFooter>
            </Card>
            );
        })}
        </div>
      )}
      {canManageAmbulances && (
        <AmbulanceFormSheet
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            ambulance={editingAmbulance}
        />
      )}
    </div>
  );
}
