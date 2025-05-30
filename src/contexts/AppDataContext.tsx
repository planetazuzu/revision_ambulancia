
"use client";

import type { Ambulance, MechanicalReview, CleaningLog, ConsumableMaterial, NonConsumableMaterial, Alert, RevisionDiariaVehiculo, AmbulanceStorageLocation } from '@/types';
import { ambulanceStorageLocations } from '@/types'; // Importar la lista
import React, { createContext, useContext, useState, type ReactNode, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useAuth } from './AuthContext';

interface AppDataContextType {
  ambulances: Ambulance[];
  getAmbulanceById: (id: string) => Ambulance | undefined;
  getAmbulanceByName: (name: string) => Ambulance | undefined;
  addAmbulance: (ambulance: Omit<Ambulance, 'id' | 'mechanicalReviewCompleted' | 'cleaningCompleted' | 'inventoryCompleted'>) => void;
  updateAmbulance: (ambulance: Ambulance) => void;
  deleteAmbulance: (id: string) => void;
  updateAmbulanceCheckInDetails: (ambulanceId: string, kilometers: number, userId: string) => void;

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
  generateAlerts: () => void;

  updateAmbulanceWorkflowStep: (ambulanceId: string, step: 'mechanical' | 'cleaning' | 'inventory', status: boolean) => void;
  getAllAmbulancesCount: () => number;

  revisionesDiariasVehiculo: RevisionDiariaVehiculo[];
  getRevisionDiariaVehiculoByAmbulanceId: (ambulanceId: string) => RevisionDiariaVehiculo | undefined;
  saveRevisionDiariaVehiculo: (check: Omit<RevisionDiariaVehiculo, 'id'>) => void;
  
  getAmbulanceStorageLocations: () => readonly AmbulanceStorageLocation[]; // Nueva función
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const generateSVBAmbulances = (): Ambulance[] => {
  const svbAmbulances: Ambulance[] = [];
  for (let i = 1; i <= 21; i++) {
    const numberString = i.toString().padStart(3, '0'); // Formato B001, B002, ... B021
    svbAmbulances.push({
      id: `svb-b${numberString}`,
      name: `SVB B${numberString}`,
      licensePlate: `SVB-${numberString}`,
      model: 'Furgoneta SVB',
      year: 2023,
      mechanicalReviewCompleted: false,
      cleaningCompleted: false,
      inventoryCompleted: false,
      lastKnownKilometers: Math.floor(Math.random() * 500) + 100, // Kilometraje aleatorio entre 100 y 599
    });
  }
  return svbAmbulances;
};

export const initialAmbulances: Ambulance[] = [
  { id: 'amb001', name: 'Ambulancia 01', licensePlate: 'XYZ 123', model: 'Mercedes Sprinter', year: 2022, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastMechanicalReview: new Date(Date.now() - 5*24*60*60*1000).toISOString(), lastKnownKilometers: 10500, lastCheckInDate: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
  { id: 'amb002', name: 'Ambulancia 02', licensePlate: 'ABC 789', model: 'Ford Transit', year: 2021, mechanicalReviewCompleted: true, cleaningCompleted: false, inventoryCompleted: false, lastCleaning: new Date(Date.now() - 2*24*60*60*1000).toISOString(), lastKnownKilometers: 22300, lastCheckInDate: new Date(Date.now() - 2*24*60*60*1000).toISOString()  },
  { id: 'amb003', name: 'Unidad Rápida B1', licensePlate: 'DEF 456', model: 'VW Crafter', year: 2023, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastKnownKilometers: 5200 },
  ...generateSVBAmbulances(), // Añadir las nuevas ambulancias SVB
];

const initialConsumables: ConsumableMaterial[] = [
    { id: 'cons001', ambulanceId: 'amb001', name: 'Vendas Estériles (paquete 10)', reference: 'BNDG-01', quantity: 50, expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), storageLocation: "Mochila Principal (Rojo)" },
    { id: 'cons002', ambulanceId: 'amb001', name: 'Solución Salina 500ml', reference: 'SLN-05', quantity: 10, expiryDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(), storageLocation: "Mochila Circulatorio (Amarillo)" }, // Expired
    { id: 'cons003', ambulanceId: 'amb002', name: 'Guantes Estériles Talla M (Caja)', reference: 'GLV-M', quantity: 5, expiryDate: new Date(Date.now() + 5*24*60*60*1000).toISOString(), storageLocation: "Cajón Lateral Superior Izq." }, // Expiring soon
    { id: 'cons004', ambulanceId: 'amb001', name: 'Mascarilla RCP Adulto', reference: 'RCP-AD', quantity: 2, expiryDate: new Date(Date.now() + 100*24*60*60*1000).toISOString(), storageLocation: "Mochila Vía Aérea (Azul)" },
    { id: 'cons005', ambulanceId: 'amb001', name: 'Apósitos Adhesivos (caja)', reference: 'APOS-MIX', quantity: 1, expiryDate: new Date(Date.now() + 60*24*60*60*1000).toISOString() }, // Sin ubicación asignada
];

const initialNonConsumables: NonConsumableMaterial[] = [
    { id: 'noncons001', ambulanceId: 'amb001', name: 'Desfibrilador Externo Automático (DEA)', serialNumber: 'DEFIB-A001', status: 'Operacional', storageLocation: "Mochila Principal (Rojo)" },
    { id: 'noncons002', ambulanceId: 'amb002', name: 'Camilla Principal Ruedas', serialNumber: 'STRCH-B012', status: 'Necesita Reparación', storageLocation: "Compartimento Principal Ambulancia" },
    { id: 'noncons003', ambulanceId: 'amb001', name: 'Pulsioxímetro Portátil', serialNumber: 'PULSI-X07', status: 'Operacional', storageLocation: "Mochila Principal (Rojo)" },
    { id: 'noncons004', ambulanceId: 'amb001', name: 'Tabla Espinal Larga', serialNumber: 'SPNL-L003', status: 'Operacional' }, // Sin ubicación asignada
];


export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [allAmbulancesData, setAllAmbulancesData] = useState<Ambulance[]>(initialAmbulances);
  const [mechanicalReviews, setMechanicalReviews] = useState<MechanicalReview[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [consumableMaterials, setConsumableMaterials] = useState<ConsumableMaterial[]>(initialConsumables);
  const [nonConsumableMaterials, setNonConsumableMaterials] = useState<NonConsumableMaterial[]>(initialNonConsumables);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [revisionesDiariasVehiculo, setRevisionesDiariasVehiculo] = useState<RevisionDiariaVehiculo[]>([]);

  const accessibleAmbulances = useMemo(() => {
    if (authLoading || !user) return [];
    if (user.role === 'coordinador') {
      return allAmbulancesData;
    }
    if (user.role === 'usuario' && user.assignedAmbulanceId) {
      return allAmbulancesData.filter(a => a.id === user.assignedAmbulanceId);
    }
    return [];
  }, [user, allAmbulancesData, authLoading]);

  const getAmbulanceById = (id: string): Ambulance | undefined => {
    if (authLoading || !user) return undefined;
    const ambulance = allAmbulancesData.find(a => a.id === id);
    if (!ambulance) return undefined;

    if (user.role === 'coordinador') {
      return ambulance;
    }
    if (user.role === 'usuario' && user.assignedAmbulanceId === id) {
      return ambulance;
    }
    return undefined;
  };

  const getAmbulanceByName = (name: string): Ambulance | undefined => {
    return allAmbulancesData.find(a => a.name.toLowerCase() === name.toLowerCase());
  };
  
  const getAllAmbulancesCount = () => allAmbulancesData.length;

  const addAmbulance = (ambulanceData: Omit<Ambulance, 'id' | 'mechanicalReviewCompleted' | 'cleaningCompleted' | 'inventoryCompleted'>) => {
    if (user?.role !== 'coordinador') {
      console.warn("Intento no autorizado de añadir ambulancia por usuario no coordinador.");
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
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== updatedAmbulance.id)) {
      console.warn("Intento no autorizado de actualizar ambulancia.");
      return;
    }
    setAllAmbulancesData(prev => prev.map(a => a.id === updatedAmbulance.id ? updatedAmbulance : a));
  };

  const updateAmbulanceCheckInDetails = (ambulanceId: string, kilometers: number, userId: string) => {
     setAllAmbulancesData(prev => prev.map(a => {
      if (a.id === ambulanceId) {
        return {
          ...a,
          lastKnownKilometers: kilometers,
          lastCheckInByUserId: userId,
          lastCheckInDate: new Date().toISOString(),
        };
      }
      return a;
    }));
  };

  const deleteAmbulance = (id: string) => {
    if (user?.role !== 'coordinador') {
      console.warn("Intento no autorizado de eliminar ambulancia.");
      return;
    }
    setAllAmbulancesData(prev => prev.filter(a => a.id !== id));
    setMechanicalReviews(prev => prev.filter(r => r.ambulanceId !== id));
    setCleaningLogs(prev => prev.filter(cl => cl.ambulanceId !== id));
    setConsumableMaterials(prev => prev.filter(cm => cm.ambulanceId !== id));
    setNonConsumableMaterials(prev => prev.filter(ncm => ncm.ambulanceId !== id));
    setRevisionesDiariasVehiculo(prev => prev.filter(dvc => dvc.ambulanceId !== id));
  };

  const getMechanicalReviewByAmbulanceId = (ambulanceId: string) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return undefined;
    }
    return mechanicalReviews.find(r => r.ambulanceId === ambulanceId);
  }

  const saveMechanicalReview = (reviewData: Omit<MechanicalReview, 'id'>) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== reviewData.ambulanceId)) {
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
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return [];
    }
    return cleaningLogs.filter(log => log.ambulanceId === ambulanceId).sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  const addCleaningLog = (logData: Omit<CleaningLog, 'id'>) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== logData.ambulanceId)) {
       console.warn("Intento no autorizado de añadir registro de limpieza.");
       return;
    }
    const newLog: CleaningLog = { ...logData, id: `cl-${Date.now()}` };
    setCleaningLogs(prev => [newLog, ...prev]);
    updateAmbulanceWorkflowStep(logData.ambulanceId, 'cleaning', true);
    setAllAmbulancesData(prev => prev.map(a => a.id === logData.ambulanceId ? {...a, lastCleaning: newLog.dateTime} : a));
  };


  const getConsumableMaterialsByAmbulanceId = (ambulanceId: string) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return [];
    }
    return consumableMaterials.filter(m => m.ambulanceId === ambulanceId);
  }
  const addConsumableMaterial = (materialData: Omit<ConsumableMaterial, 'id'>) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialData.ambulanceId)) {
       console.warn("Intento no autorizado de añadir material consumible.");
       return;
    }
    const newMaterial: ConsumableMaterial = { ...materialData, id: `cons-${Date.now()}` };
    setConsumableMaterials(prev => [...prev, newMaterial]);
  };
  const updateConsumableMaterial = (updatedMaterial: ConsumableMaterial) => {
     if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== updatedMaterial.ambulanceId)) {
       console.warn("Intento no autorizado de actualizar material consumible.");
       return;
    }
    setConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };
  const deleteConsumableMaterial = (id: string) => {
    const materialToDelete = consumableMaterials.find(m => m.id === id);
    if (!materialToDelete) return;
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialToDelete.ambulanceId)) {
       console.warn("Intento no autorizado de eliminar material consumible.");
       return;
    }
    setConsumableMaterials(prev => prev.filter(m => m.id !== id));
  };


  const getNonConsumableMaterialsByAmbulanceId = (ambulanceId: string) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return [];
    }
    return nonConsumableMaterials.filter(m => m.ambulanceId === ambulanceId);
  }
  const addNonConsumableMaterial = (materialData: Omit<NonConsumableMaterial, 'id'>) => {
     if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialData.ambulanceId)) {
       console.warn("Intento no autorizado de añadir material no consumible.");
       return;
    }
    const newMaterial: NonConsumableMaterial = { ...materialData, id: `noncons-${Date.now()}` };
    setNonConsumableMaterials(prev => [...prev, newMaterial]);
  };
  const updateNonConsumableMaterial = (updatedMaterial: NonConsumableMaterial) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== updatedMaterial.ambulanceId)) {
       console.warn("Intento no autorizado de actualizar material no consumible.");
       return;
    }
    setNonConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };
  const deleteNonConsumableMaterial = (id: string) => {
    const materialToDelete = nonConsumableMaterials.find(m => m.id === id);
    if (!materialToDelete) return;
     if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialToDelete.ambulanceId)) {
       console.warn("Intento no autorizado de eliminar material no consumible.");
       return;
    }
    setNonConsumableMaterials(prev => prev.filter(m => m.id !== id));
  };

  const updateAmbulanceWorkflowStep = (ambulanceId: string, step: 'mechanical' | 'cleaning' | 'inventory', status: boolean) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
       console.warn("Intento no autorizado de actualizar paso de flujo de trabajo.");
       return;
    }
    setAllAmbulancesData(prev => prev.map(amb => {
      if (amb.id === ambulanceId) {
        const updatedAmb = {...amb};
        if (step === 'mechanical') updatedAmb.mechanicalReviewCompleted = status;
        if (step === 'cleaning') updatedAmb.cleaningCompleted = status;
        if (step === 'inventory') updatedAmb.inventoryCompleted = status;

        // Reset subsequent steps if a previous one is marked incomplete
        if (step === 'mechanical' && !status) {
          updatedAmb.cleaningCompleted = false;
          updatedAmb.inventoryCompleted = false;
        }
        if (step === 'cleaning' && !status) {
          updatedAmb.inventoryCompleted = false;
        }
        // If inventory is completed, reset the cycle for this ambulance
        if (step === 'inventory' && status) {
            updatedAmb.mechanicalReviewCompleted = false;
            updatedAmb.cleaningCompleted = false;
            updatedAmb.inventoryCompleted = false; // This effectively means the cycle is done and ready for a new one.
            updatedAmb.lastInventoryCheck = new Date().toISOString();
        }
        return updatedAmb;
      }
      return amb;
    }));
  };

  // --- Revisiones Diarias de Vehículo ---
  const getRevisionDiariaVehiculoByAmbulanceId = (ambulanceId: string): RevisionDiariaVehiculo | undefined => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return undefined;
    }
    // For simplicity, return the latest check for an ambulance. Could be a list.
    const checksForAmbulance = revisionesDiariasVehiculo.filter(c => c.ambulanceId === ambulanceId);
    return checksForAmbulance.sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime())[0];
  };

  const saveRevisionDiariaVehiculo = (checkData: Omit<RevisionDiariaVehiculo, 'id'>) => {
    if (!user) {
        console.warn("Usuario no autenticado intentando guardar revisión diaria.");
        return;
    }
    if (user.role !== 'coordinador' && (user.role === 'usuario' && user.assignedAmbulanceId !== checkData.ambulanceId)) {
       console.warn("Intento no autorizado de guardar revisión diaria.");
       return;
    }
    const existingCheckIndex = revisionesDiariasVehiculo.findIndex(c => c.ambulanceId === checkData.ambulanceId && c.checkDate.startsWith(checkData.checkDate.substring(0,10))); // Check if one exists for the same day

    const newCheck: RevisionDiariaVehiculo = {
      ...checkData,
      id: `rdv-${Date.now()}`, // Prefijo cambiado a rdv
      submittedByUserId: user.id,
    };

    if (existingCheckIndex > -1) {
      setRevisionesDiariasVehiculo(prev => {
        const updatedChecks = [...prev];
        updatedChecks[existingCheckIndex] = newCheck; // Replace existing check for the day
        return updatedChecks;
      });
    } else {
      setRevisionesDiariasVehiculo(prev => [newCheck, ...prev]);
    }
  };

  const getAmbulanceStorageLocations = (): readonly AmbulanceStorageLocation[] => {
    return ambulanceStorageLocations;
  };


  const generateAlerts = () => {
    if (authLoading) return;
    const newAlerts: Alert[] = [];
    const today = new Date();

    accessibleAmbulances.forEach(ambulance => {
      // Example: Alert if mechanical review is due (older than 14 days or never done)
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
       // Example: Alert if cleaning is due (older than 7 days or never done) AND mechanical review is complete
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

    const accessibleAmbulanceIds = new Set(accessibleAmbulances.map(a => a.id));
    const relevantConsumableMaterials = consumableMaterials.filter(material => accessibleAmbulanceIds.has(material.ambulanceId));
    
    relevantConsumableMaterials.forEach(material => {
      const expiryDate = new Date(material.expiryDate);
      const ambulance = allAmbulancesData.find(a=> a.id === material.ambulanceId); // Use allAmbulancesData to get name
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
      } else if (daysUntilExpiry <= 7) { // Consider 7 days as "expiring soon" for in-ambulance materials
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
    if (!authLoading) {
        generateAlerts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessibleAmbulances, consumableMaterials, mechanicalReviews, cleaningLogs, authLoading]);

  const contextValue = {
    ambulances: accessibleAmbulances,
    getAmbulanceById,
    getAmbulanceByName,
    addAmbulance,
    updateAmbulance,
    updateAmbulanceCheckInDetails,
    deleteAmbulance,
    mechanicalReviews, getMechanicalReviewByAmbulanceId, saveMechanicalReview,
    cleaningLogs, getCleaningLogsByAmbulanceId, addCleaningLog,
    consumableMaterials, getConsumableMaterialsByAmbulanceId, addConsumableMaterial, updateConsumableMaterial, deleteConsumableMaterial,
    nonConsumableMaterials, getNonConsumableMaterialsByAmbulanceId, addNonConsumableMaterial, updateNonConsumableMaterial, deleteNonConsumableMaterial,
    alerts, generateAlerts,
    updateAmbulanceWorkflowStep,
    getAllAmbulancesCount,
    revisionesDiariasVehiculo, getRevisionDiariaVehiculoByAmbulanceId, saveRevisionDiariaVehiculo,
    getAmbulanceStorageLocations,
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
