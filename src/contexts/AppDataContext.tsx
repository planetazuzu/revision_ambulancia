
"use client";

import type { Ambulance, MechanicalReview, CleaningLog, ConsumableMaterial, NonConsumableMaterial, Alert } from '@/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useAuth } from './AuthContext'; // Import useAuth to get current user

interface AppDataContextType {
  ambulances: Ambulance[]; // This will now be the accessible list
  getAmbulanceById: (id: string) => Ambulance | undefined;
  addAmbulance: (ambulance: Omit<Ambulance, 'id' | 'mechanicalReviewCompleted' | 'cleaningCompleted' | 'inventoryCompleted'>) => void;
  updateAmbulance: (ambulance: Ambulance) => void;
  deleteAmbulance: (id: string) => void;

  mechanicalReviews: MechanicalReview[];
  getMechanicalReviewByAmbulanceId: (ambulanceId: string) => MechanicalReview | undefined;
  saveMechanicalReview: (review: Omit<MechanicalReview, 'id'>) => void;

  cleaningLogs: CleaningLog[];
  getCleaningLogsByAmbulanceId: (ambulanceId: string) => CleaningLog[];
  addCleaningLog: (log: Omit<CleaningLog, 'id'>) => void;

  consumableMaterials: ConsumableMaterial[];
  getConsumableMaterialsByAmbulanceId: (ambulanceId: string) => ConsumableMaterial[];
  addConsumableMaterial: (material: Omit<ConsumableMaterial, 'id'>) => void;
  updateConsumableMaterial: (material: ConsumableMaterial) => void;
  deleteConsumableMaterial: (id: string) => void;

  nonConsumableMaterials: NonConsumableMaterial[];
  getNonConsumableMaterialsByAmbulanceId: (ambulanceId: string) => NonConsumableMaterial[];
  addNonConsumableMaterial: (material: Omit<NonConsumableMaterial, 'id'>) => void;
  updateNonConsumableMaterial: (material: NonConsumableMaterial) => void;
  deleteNonConsumableMaterial: (id: string) => void;

  alerts: Alert[];
  generateAlerts: () => void; // Kept for explicit call if needed, but also runs on effect

  updateAmbulanceWorkflowStep: (ambulanceId: string, step: 'mechanical' | 'cleaning' | 'inventory', status: boolean) => void;
  getAllAmbulancesCount: () => number; // Helper for admin views or global stats if needed
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Exporting initialAmbulances so AuthContext can access it for mock assignment
export const initialAmbulances: Ambulance[] = [
  { id: 'amb001', name: 'Ambulancia 01', licensePlate: 'XYZ 123', model: 'Mercedes Sprinter', year: 2022, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastMechanicalReview: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
  { id: 'amb002', name: 'Ambulancia 02', licensePlate: 'ABC 789', model: 'Ford Transit', year: 2021, mechanicalReviewCompleted: true, cleaningCompleted: false, inventoryCompleted: false, lastCleaning: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
];

const initialConsumables: ConsumableMaterial[] = [
    { id: 'cons001', ambulanceId: 'amb001', name: 'Vendas', reference: 'BNDG-01', quantity: 50, expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString() },
    { id: 'cons002', ambulanceId: 'amb001', name: 'Solución Salina', reference: 'SLN-05', quantity: 10, expiryDate: new Date(Date.now() - 5*24*60*60*1000).toISOString() }, // Expired
    { id: 'cons003', ambulanceId: 'amb002', name: 'Guantes (Caja)', reference: 'GLV-M', quantity: 5, expiryDate: new Date(Date.now() + 5*24*60*60*1000).toISOString() }, // Expiring soon
];

const initialNonConsumables: NonConsumableMaterial[] = [
    { id: 'noncons001', ambulanceId: 'amb001', name: 'Desfibrilador', serialNumber: 'DEFIB-A001', status: 'Operacional' },
    { id: 'noncons002', ambulanceId: 'amb002', name: 'Camilla', serialNumber: 'STRCH-B012', status: 'Necesita Reparación' },
];


export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth(); // Get user from AuthContext

  const [allAmbulancesData, setAllAmbulancesData] = useState<Ambulance[]>(initialAmbulances);
  const [mechanicalReviews, setMechanicalReviews] = useState<MechanicalReview[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [consumableMaterials, setConsumableMaterials] = useState<ConsumableMaterial[]>(initialConsumables);
  const [nonConsumableMaterials, setNonConsumableMaterials] = useState<NonConsumableMaterial[]>(initialNonConsumables);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const accessibleAmbulances = useMemo(() => {
    if (authLoading || !user) return [];
    if (user.role === 'admin') {
      return allAmbulancesData;
    }
    if (user.assignedAmbulanceId) {
      return allAmbulancesData.filter(a => a.id === user.assignedAmbulanceId);
    }
    return [];
  }, [user, allAmbulancesData, authLoading]);

  const getAmbulanceById = (id: string): Ambulance | undefined => {
    if (authLoading || !user) return undefined;
    const ambulance = allAmbulancesData.find(a => a.id === id);
    if (!ambulance) return undefined;

    if (user.role === 'admin') {
      return ambulance;
    }
    if (user.assignedAmbulanceId === id) {
      return ambulance;
    }
    return undefined; // Non-admin trying to access an ambulance not assigned to them
  };
  
  const getAllAmbulancesCount = () => allAmbulancesData.length;

  const addAmbulance = (ambulanceData: Omit<Ambulance, 'id' | 'mechanicalReviewCompleted' | 'cleaningCompleted' | 'inventoryCompleted'>) => {
    // Only admins should add ambulances in this model
    if (user?.role !== 'admin') {
      console.warn("Intento no autorizado de añadir ambulancia por usuario no administrador.");
      return;
    }
    const newAmbulance: Ambulance = {
      ...ambulanceData,
      id: `amb${String(Date.now()).slice(-4)}${Math.floor(Math.random()*100)}`,
      mechanicalReviewCompleted: false,
      cleaningCompleted: false,
      inventoryCompleted: false,
    };
    setAllAmbulancesData(prev => [...prev, newAmbulance]);
  };

  const updateAmbulance = (updatedAmbulance: Ambulance) => {
    // Admins can update any, non-admins only their own
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== updatedAmbulance.id) {
      console.warn("Intento no autorizado de actualizar ambulancia por usuario no administrador o ambulancia incorrecta.");
      return;
    }
    setAllAmbulancesData(prev => prev.map(a => a.id === updatedAmbulance.id ? updatedAmbulance : a));
  };

  const deleteAmbulance = (id: string) => {
    if (user?.role !== 'admin') {
      console.warn("Intento no autorizado de eliminar ambulancia por usuario no administrador.");
      return;
    }
    setAllAmbulancesData(prev => prev.filter(a => a.id !== id));
    // Also clear related data for the deleted ambulance
    setMechanicalReviews(prev => prev.filter(r => r.ambulanceId !== id));
    setCleaningLogs(prev => prev.filter(cl => cl.ambulanceId !== id));
    setConsumableMaterials(prev => prev.filter(cm => cm.ambulanceId !== id));
    setNonConsumableMaterials(prev => prev.filter(ncm => ncm.ambulanceId !== id));
  };

  const getMechanicalReviewByAmbulanceId = (ambulanceId: string) => {
     // Check if user has access to this ambulanceId first
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== ambulanceId) {
      return undefined;
    }
    return mechanicalReviews.find(r => r.ambulanceId === ambulanceId);
  }

  const saveMechanicalReview = (reviewData: Omit<MechanicalReview, 'id'>) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== reviewData.ambulanceId) {
       console.warn("Intento no autorizado de guardar revisión mecánica.");
       return;
    }
    const existingReviewIndex = mechanicalReviews.findIndex(r => r.ambulanceId === reviewData.ambulanceId);
    const newReview: MechanicalReview = { ...reviewData, id: `mr-${Date.now()}` };
    if (existingReviewIndex > -1) {
      setMechanicalReviews(prev => {
        const updatedReviews = [...prev];
        updatedReviews[existingReviewIndex] = newReview;
        return updatedReviews;
      });
    } else {
      setMechanicalReviews(prev => [...prev, newReview]);
    }
    updateAmbulanceWorkflowStep(reviewData.ambulanceId, 'mechanical', true);
    setAllAmbulancesData(prev => prev.map(a => a.id === reviewData.ambulanceId ? {...a, lastMechanicalReview: newReview.reviewDate} : a));
  };

  const getCleaningLogsByAmbulanceId = (ambulanceId: string) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== ambulanceId) {
      return [];
    }
    return cleaningLogs.filter(log => log.ambulanceId === ambulanceId).sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  const addCleaningLog = (logData: Omit<CleaningLog, 'id'>) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== logData.ambulanceId) {
       console.warn("Intento no autorizado de añadir registro de limpieza.");
       return;
    }
    const newLog: CleaningLog = { ...logData, id: `cl-${Date.now()}` };
    setCleaningLogs(prev => [newLog, ...prev]);
    updateAmbulanceWorkflowStep(logData.ambulanceId, 'cleaning', true);
    setAllAmbulancesData(prev => prev.map(a => a.id === logData.ambulanceId ? {...a, lastCleaning: newLog.dateTime} : a));
  };


  const getConsumableMaterialsByAmbulanceId = (ambulanceId: string) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== ambulanceId) {
      return [];
    }
    return consumableMaterials.filter(m => m.ambulanceId === ambulanceId);
  }
  const addConsumableMaterial = (materialData: Omit<ConsumableMaterial, 'id'>) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== materialData.ambulanceId) {
       console.warn("Intento no autorizado de añadir material consumible.");
       return;
    }
    const newMaterial: ConsumableMaterial = { ...materialData, id: `cons-${Date.now()}` };
    setConsumableMaterials(prev => [...prev, newMaterial]);
  };
  const updateConsumableMaterial = (updatedMaterial: ConsumableMaterial) => {
     if (user?.role !== 'admin' && user?.assignedAmbulanceId !== updatedMaterial.ambulanceId) {
       console.warn("Intento no autorizado de actualizar material consumible.");
       return;
    }
    setConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };
  const deleteConsumableMaterial = (id: string) => {
    const materialToDelete = consumableMaterials.find(m => m.id === id);
    if (!materialToDelete) return;
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== materialToDelete.ambulanceId) {
       console.warn("Intento no autorizado de eliminar material consumible.");
       return;
    }
    setConsumableMaterials(prev => prev.filter(m => m.id !== id));
  };


  const getNonConsumableMaterialsByAmbulanceId = (ambulanceId: string) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== ambulanceId) {
      return [];
    }
    return nonConsumableMaterials.filter(m => m.ambulanceId === ambulanceId);
  }
  const addNonConsumableMaterial = (materialData: Omit<NonConsumableMaterial, 'id'>) => {
     if (user?.role !== 'admin' && user?.assignedAmbulanceId !== materialData.ambulanceId) {
       console.warn("Intento no autorizado de añadir material no consumible.");
       return;
    }
    const newMaterial: NonConsumableMaterial = { ...materialData, id: `noncons-${Date.now()}` };
    setNonConsumableMaterials(prev => [...prev, newMaterial]);
  };
  const updateNonConsumableMaterial = (updatedMaterial: NonConsumableMaterial) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== updatedMaterial.ambulanceId) {
       console.warn("Intento no autorizado de actualizar material no consumible.");
       return;
    }
    setNonConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };
  const deleteNonConsumableMaterial = (id: string) => {
    const materialToDelete = nonConsumableMaterials.find(m => m.id === id);
    if (!materialToDelete) return;
     if (user?.role !== 'admin' && user?.assignedAmbulanceId !== materialToDelete.ambulanceId) {
       console.warn("Intento no autorizado de eliminar material no consumible.");
       return;
    }
    setNonConsumableMaterials(prev => prev.filter(m => m.id !== id));
  };

  const updateAmbulanceWorkflowStep = (ambulanceId: string, step: 'mechanical' | 'cleaning' | 'inventory', status: boolean) => {
    if (user?.role !== 'admin' && user?.assignedAmbulanceId !== ambulanceId) {
       console.warn("Intento no autorizado de actualizar paso de flujo de trabajo.");
       return;
    }
    setAllAmbulancesData(prev => prev.map(amb => {
      if (amb.id === ambulanceId) {
        const updatedAmb = {...amb};
        if (step === 'mechanical') updatedAmb.mechanicalReviewCompleted = status;
        if (step === 'cleaning') updatedAmb.cleaningCompleted = status;
        if (step === 'inventory') updatedAmb.inventoryCompleted = status;

        if (step === 'mechanical' && !status) {
          updatedAmb.cleaningCompleted = false;
          updatedAmb.inventoryCompleted = false;
        }
        if (step === 'cleaning' && !status) {
          updatedAmb.inventoryCompleted = false;
        }
        if (step === 'inventory' && status) {
            updatedAmb.mechanicalReviewCompleted = false;
            updatedAmb.cleaningCompleted = false;
            updatedAmb.inventoryCompleted = false;
            updatedAmb.lastInventoryCheck = new Date().toISOString();
        }
        return updatedAmb;
      }
      return amb;
    }));
  };

  const generateAlerts = () => {
    if (authLoading) return; // Don't generate alerts if auth is still loading
    const newAlerts: Alert[] = [];
    const today = new Date();

    // Use accessibleAmbulances for generating alerts related to ambulance status
    accessibleAmbulances.forEach(ambulance => {
      if (!ambulance.mechanicalReviewCompleted && (!ambulance.lastMechanicalReview || new Date(ambulance.lastMechanicalReview) < new Date(today.getTime() - 14*24*60*60*1000) )) {
        newAlerts.push({
          id: `alert-mr-${ambulance.id}`,
          type: 'review_pending',
          message: `Revisión mecánica pendiente para ${ambulance.name}. Última revisión: ${ambulance.lastMechanicalReview ? format(new Date(ambulance.lastMechanicalReview), 'PPP', { locale: es }) : 'Nunca'}`,
          ambulanceId: ambulance.id,
          severity: 'medium',
          createdAt: today.toISOString(),
        });
      }
       if (ambulance.mechanicalReviewCompleted && !ambulance.cleaningCompleted && (!ambulance.lastCleaning || new Date(ambulance.lastCleaning) < new Date(today.getTime() - 7*24*60*60*1000) )) {
        newAlerts.push({
          id: `alert-cl-${ambulance.id}`,
          type: 'cleaning_pending', 
          message: `Limpieza pendiente para ${ambulance.name}. Última limpieza: ${ambulance.lastCleaning ? format(new Date(ambulance.lastCleaning), 'PPP', { locale: es }) : 'Nunca'}`,
          ambulanceId: ambulance.id,
          severity: 'medium',
          createdAt: today.toISOString(),
        });
      }
    });

    // Consumable materials alerts should be based on materials linked to accessible ambulances
    const accessibleAmbulanceIds = new Set(accessibleAmbulances.map(a => a.id));
    const relevantConsumableMaterials = consumableMaterials.filter(material => accessibleAmbulanceIds.has(material.ambulanceId));
    
    relevantConsumableMaterials.forEach(material => {
      const expiryDate = new Date(material.expiryDate);
      const ambulance = allAmbulancesData.find(a=> a.id === material.ambulanceId); // Get name from all for context
      const ambulanceName = ambulance ? ambulance.name : 'Ambulancia Desconocida';
      const daysUntilExpiry = (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

      if (daysUntilExpiry < 0) {
        newAlerts.push({
          id: `alert-exp-${material.id}`,
          type: 'expired_material',
          message: `Material ${material.name} en ${ambulanceName} caducó el ${format(expiryDate, 'PPP', { locale: es })}.`,
          materialId: material.id,
          ambulanceId: material.ambulanceId,
          severity: 'high',
          createdAt: today.toISOString(),
        });
      } else if (daysUntilExpiry <= 7) { 
        newAlerts.push({
          id: `alert-expsoon-${material.id}`,
          type: 'expiring_soon',
          message: `Material ${material.name} en ${ambulanceName} caduca el ${format(expiryDate, 'PPP', { locale: es })} (en ${Math.ceil(daysUntilExpiry)} día(s)).`,
          materialId: material.id,
          ambulanceId: material.ambulanceId,
          severity: 'medium',
          createdAt: today.toISOString(),
        });
      }
    });
    setAlerts(newAlerts);
  };

  useEffect(() => {
    if (!authLoading) { // Only generate alerts once user auth state is resolved
        generateAlerts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessibleAmbulances, consumableMaterials, mechanicalReviews, cleaningLogs, authLoading]); // Add authLoading dependency

  const contextValue = {
    ambulances: accessibleAmbulances, // Expose filtered list
    getAmbulanceById,
    addAmbulance,
    updateAmbulance,
    deleteAmbulance,
    mechanicalReviews, getMechanicalReviewByAmbulanceId, saveMechanicalReview,
    cleaningLogs, getCleaningLogsByAmbulanceId, addCleaningLog,
    consumableMaterials, getConsumableMaterialsByAmbulanceId, addConsumableMaterial, updateConsumableMaterial, deleteConsumableMaterial,
    nonConsumableMaterials, getNonConsumableMaterialsByAmbulanceId, addNonConsumableMaterial, updateNonConsumableMaterial, deleteNonConsumableMaterial,
    alerts, generateAlerts,
    updateAmbulanceWorkflowStep,
    getAllAmbulancesCount
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData debe ser usado dentro de un AppDataProvider');
  }
  return context;
}
