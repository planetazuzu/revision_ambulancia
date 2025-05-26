"use client";

import type { Ambulance, MechanicalReview, CleaningLog, ConsumableMaterial, NonConsumableMaterial, Alert, ChecklistItemStatus } from '@/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { format } from 'date-fns';

interface AppDataContextType {
  ambulances: Ambulance[];
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
  generateAlerts: () => void;

  updateAmbulanceWorkflowStep: (ambulanceId: string, step: 'mechanical' | 'cleaning' | 'inventory', status: boolean) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const initialAmbulances: Ambulance[] = [
  { id: 'amb001', name: 'Ambulance 01', licensePlate: 'XYZ 123', model: 'Mercedes Sprinter', year: 2022, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastMechanicalReview: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
  { id: 'amb002', name: 'Ambulance 02', licensePlate: 'ABC 789', model: 'Ford Transit', year: 2021, mechanicalReviewCompleted: true, cleaningCompleted: false, inventoryCompleted: false, lastCleaning: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
];

const initialConsumables: ConsumableMaterial[] = [
    { id: 'cons001', ambulanceId: 'amb001', name: 'Bandages', reference: 'BNDG-01', quantity: 50, expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString() },
    { id: 'cons002', ambulanceId: 'amb001', name: 'Saline Solution', reference: 'SLN-05', quantity: 10, expiryDate: new Date(Date.now() - 5*24*60*60*1000).toISOString() }, // Expired
    { id: 'cons003', ambulanceId: 'amb002', name: 'Gloves (Box)', reference: 'GLV-M', quantity: 5, expiryDate: new Date(Date.now() + 5*24*60*60*1000).toISOString() }, // Expiring soon
];

const initialNonConsumables: NonConsumableMaterial[] = [
    { id: 'noncons001', ambulanceId: 'amb001', name: 'Defibrillator', serialNumber: 'DEFIB-A001', status: 'Operational' },
    { id: 'noncons002', ambulanceId: 'amb002', name: 'Stretcher', serialNumber: 'STRCH-B012', status: 'Needs Repair' },
];


export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances);
  const [mechanicalReviews, setMechanicalReviews] = useState<MechanicalReview[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [consumableMaterials, setConsumableMaterials] = useState<ConsumableMaterial[]>(initialConsumables);
  const [nonConsumableMaterials, setNonConsumableMaterials] = useState<NonConsumableMaterial[]>(initialNonConsumables);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const getAmbulanceById = (id: string) => ambulances.find(a => a.id === id);

  const addAmbulance = (ambulanceData: Omit<Ambulance, 'id' | 'mechanicalReviewCompleted' | 'cleaningCompleted' | 'inventoryCompleted'>) => {
    const newAmbulance: Ambulance = { 
      ...ambulanceData, 
      id: `amb${String(Date.now()).slice(-4)}${Math.floor(Math.random()*100)}`,
      mechanicalReviewCompleted: false,
      cleaningCompleted: false,
      inventoryCompleted: false,
    };
    setAmbulances(prev => [...prev, newAmbulance]);
  };

  const updateAmbulance = (updatedAmbulance: Ambulance) => {
    setAmbulances(prev => prev.map(a => a.id === updatedAmbulance.id ? updatedAmbulance : a));
  };
  
  const deleteAmbulance = (id: string) => {
    setAmbulances(prev => prev.filter(a => a.id !== id));
    // Also delete related data
    setMechanicalReviews(prev => prev.filter(r => r.ambulanceId !== id));
    setCleaningLogs(prev => prev.filter(cl => cl.ambulanceId !== id));
    setConsumableMaterials(prev => prev.filter(cm => cm.ambulanceId !== id));
    setNonConsumableMaterials(prev => prev.filter(ncm => ncm.ambulanceId !== id));
  };

  const getMechanicalReviewByAmbulanceId = (ambulanceId: string) => mechanicalReviews.find(r => r.ambulanceId === ambulanceId);

  const saveMechanicalReview = (reviewData: Omit<MechanicalReview, 'id'>) => {
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
    setAmbulances(prev => prev.map(a => a.id === reviewData.ambulanceId ? {...a, lastMechanicalReview: newReview.reviewDate} : a));
  };
  
  const getCleaningLogsByAmbulanceId = (ambulanceId: string) => cleaningLogs.filter(log => log.ambulanceId === ambulanceId).sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const addCleaningLog = (logData: Omit<CleaningLog, 'id'>) => {
    const newLog: CleaningLog = { ...logData, id: `cl-${Date.now()}` };
    setCleaningLogs(prev => [newLog, ...prev]);
    updateAmbulanceWorkflowStep(logData.ambulanceId, 'cleaning', true);
    setAmbulances(prev => prev.map(a => a.id === logData.ambulanceId ? {...a, lastCleaning: newLog.dateTime} : a));
  };

  const getConsumableMaterialsByAmbulanceId = (ambulanceId: string) => consumableMaterials.filter(m => m.ambulanceId === ambulanceId);
  
  const addConsumableMaterial = (materialData: Omit<ConsumableMaterial, 'id'>) => {
    const newMaterial: ConsumableMaterial = { ...materialData, id: `cons-${Date.now()}` };
    setConsumableMaterials(prev => [...prev, newMaterial]);
  };

  const updateConsumableMaterial = (updatedMaterial: ConsumableMaterial) => {
    setConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };

  const deleteConsumableMaterial = (id: string) => {
    setConsumableMaterials(prev => prev.filter(m => m.id !== id));
  };

  const getNonConsumableMaterialsByAmbulanceId = (ambulanceId: string) => nonConsumableMaterials.filter(m => m.ambulanceId === ambulanceId);

  const addNonConsumableMaterial = (materialData: Omit<NonConsumableMaterial, 'id'>) => {
    const newMaterial: NonConsumableMaterial = { ...materialData, id: `noncons-${Date.now()}` };
    setNonConsumableMaterials(prev => [...prev, newMaterial]);
  };
  
  const updateNonConsumableMaterial = (updatedMaterial: NonConsumableMaterial) => {
    setNonConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };

  const deleteNonConsumableMaterial = (id: string) => {
    setNonConsumableMaterials(prev => prev.filter(m => m.id !== id));
  };
  
  const updateAmbulanceWorkflowStep = (ambulanceId: string, step: 'mechanical' | 'cleaning' | 'inventory', status: boolean) => {
    setAmbulances(prev => prev.map(amb => {
      if (amb.id === ambulanceId) {
        const updatedAmb = {...amb};
        if (step === 'mechanical') updatedAmb.mechanicalReviewCompleted = status;
        if (step === 'cleaning') updatedAmb.cleaningCompleted = status;
        if (step === 'inventory') updatedAmb.inventoryCompleted = status;
        
        // If a step is marked incomplete, subsequent steps are also incomplete
        if (step === 'mechanical' && !status) {
          updatedAmb.cleaningCompleted = false;
          updatedAmb.inventoryCompleted = false;
        }
        if (step === 'cleaning' && !status) {
          updatedAmb.inventoryCompleted = false;
        }
        // If a step is marked complete, reset for next cycle by making them false (unless it's the last step)
        // This logic might need refinement based on exact desired workflow reset.
        // For now, completing inventory resets all for that ambulance for a new cycle.
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
    const newAlerts: Alert[] = [];
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    ambulances.forEach(ambulance => {
      if (!ambulance.mechanicalReviewCompleted && (!ambulance.lastMechanicalReview || new Date(ambulance.lastMechanicalReview) < new Date(today.getTime() - 14*24*60*60*1000) )) { // Example: review pending if older than 14 days
        newAlerts.push({
          id: `alert-mr-${ambulance.id}`,
          type: 'review_pending',
          message: `Mechanical review pending for ${ambulance.name}. Last review: ${ambulance.lastMechanicalReview ? format(new Date(ambulance.lastMechanicalReview), 'PPP') : 'Never'}`,
          ambulanceId: ambulance.id,
          severity: 'medium',
          createdAt: today.toISOString(),
        });
      }
       if (ambulance.mechanicalReviewCompleted && !ambulance.cleaningCompleted && (!ambulance.lastCleaning || new Date(ambulance.lastCleaning) < new Date(today.getTime() - 7*24*60*60*1000) )) { // Example: cleaning pending if older than 7 days and review done
        newAlerts.push({
          id: `alert-cl-${ambulance.id}`,
          type: 'review_pending',
          message: `Cleaning pending for ${ambulance.name}. Last cleaning: ${ambulance.lastCleaning ? format(new Date(ambulance.lastCleaning), 'PPP') : 'Never'}`,
          ambulanceId: ambulance.id,
          severity: 'medium',
          createdAt: today.toISOString(),
        });
      }
    });

    consumableMaterials.forEach(material => {
      const expiryDate = new Date(material.expiryDate);
      const ambulance = getAmbulanceById(material.ambulanceId);
      const ambulanceName = ambulance ? ambulance.name : 'Unknown Ambulance';
      if (expiryDate < today) {
        newAlerts.push({
          id: `alert-exp-${material.id}`,
          type: 'expired_material',
          message: `Material ${material.name} in ${ambulanceName} expired on ${format(expiryDate, 'PPP')}.`,
          materialId: material.id,
          ambulanceId: material.ambulanceId,
          severity: 'high',
          createdAt: today.toISOString(),
        });
      } else if (expiryDate < sevenDaysFromNow) {
        newAlerts.push({
          id: `alert-expsoon-${material.id}`,
          type: 'expiring_soon',
          message: `Material ${material.name} in ${ambulanceName} is expiring on ${format(expiryDate, 'PPP')}.`,
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
    generateAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambulances, consumableMaterials, mechanicalReviews, cleaningLogs]); // Re-generate alerts if data changes

  return (
    <AppDataContext.Provider value={{ 
      ambulances, getAmbulanceById, addAmbulance, updateAmbulance, deleteAmbulance,
      mechanicalReviews, getMechanicalReviewByAmbulanceId, saveMechanicalReview,
      cleaningLogs, getCleaningLogsByAmbulanceId, addCleaningLog,
      consumableMaterials, getConsumableMaterialsByAmbulanceId, addConsumableMaterial, updateConsumableMaterial, deleteConsumableMaterial,
      nonConsumableMaterials, getNonConsumableMaterialsByAmbulanceId, addNonConsumableMaterial, updateNonConsumableMaterial, deleteNonConsumableMaterial,
      alerts, generateAlerts,
      updateAmbulanceWorkflowStep
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
