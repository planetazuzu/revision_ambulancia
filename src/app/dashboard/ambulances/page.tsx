"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Ambulance as AmbulanceIcon, PlusCircle, FilePenLine, Trash2, Wrench, Sparkles, Box as BoxIcon, CheckCircle } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import type { Ambulance } from "@/types";
import { format } from "date-fns";
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
  const { ambulances, deleteAmbulance } = useAppData();
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
    if (!ambulance.mechanicalReviewCompleted) return { text: "Mechanical Review", Icon: Wrench, color: "text-orange-500", pathSuffix: "review" };
    if (!ambulance.cleaningCompleted) return { text: "Cleaning", Icon: Sparkles, color: "text-blue-500", pathSuffix: "cleaning" };
    if (!ambulance.inventoryCompleted) return { text: "Inventory Check", Icon: BoxIcon, color: "text-purple-500", pathSuffix: "inventory" };
    return { text: "Ready", Icon: CheckCircle, color: "text-green-500", pathSuffix: "review" }; // All complete, default to review view
  }

  return (
    <div>
      <PageHeader
        title="Manage Ambulances"
        description="View, add, edit, or delete ambulance records."
        action={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Ambulance
          </Button>
        }
      />

      {ambulances.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <AmbulanceIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <CardTitle className="mt-4">No Ambulances Found</CardTitle>
            <CardDescription>Get started by adding your first ambulance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Ambulance
            </Button>
          </CardContent>
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
                  <p>Last Mechanical Review: {ambulance.lastMechanicalReview ? format(new Date(ambulance.lastMechanicalReview), 'PPP') : 'N/A'}</p>
                  <p>Last Cleaning: {ambulance.lastCleaning ? format(new Date(ambulance.lastCleaning), 'PPP') : 'N/A'}</p>
                  <p>Last Inventory Check: {ambulance.lastInventoryCheck ? format(new Date(ambulance.lastInventoryCheck), 'PPP') : 'N/A'}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2 border-t pt-4">
                 <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/ambulances/${ambulance.id}/${status.pathSuffix}`}>
                        {status.text === "Ready" ? "View Details" : `Start ${status.text}`}
                    </Link>
                 </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(ambulance)}>
                        <FilePenLine className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the ambulance
                            and all related data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAmbulance(ambulance.id)}>
                            Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardFooter>
            </Card>
            );
        })}
        </div>
      )}
      <AmbulanceFormSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        ambulance={editingAmbulance}
      />
    </div>
  );
}
