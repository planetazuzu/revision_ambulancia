
"use client";

import type { Ambulance, MechanicalReview, CleaningLog, ConsumableMaterial, NonConsumableMaterial, Alert, RevisionDiariaVehiculo, AmbulanceStorageLocation, USVBKit, USVBKitMaterial } from '@/types';
import { ambulanceStorageLocations } from '@/types'; // Importar la lista
import React, { createContext, useContext, useState, type ReactNode, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useAuth } from './AuthContext';

// --- USVB Kit Data Transformation ---

const rawUSVBKitData: { [key: number]: string[] } = {
  1: ["Mochila pediátrica"],  
  2: ["Mochila adulto"],  
  3: [
    "Kit de partos",
    "Kit de quemados",
    "Aspirador secreciones manual",
    "Nebulizador",
    "Botella urinaria"
  ],  
  4: [
    "Mascarillas FFP3 (4)",
    "Mascarillas quirúrgicas (1 caja)",
    "Gafas protectoras (4)",
    "Gorros protección (4)",
    "Batas protecciones desechables (10)",
    "Mascarillas FFP2 (1 caja)"
  ],  
  5: [
    "Glucagón (1)",
    "Insulina rápida (1)",
    "Diacepan rectal 5 mg (1)",
    "Diacepan rectal 10 mg (1)",
    "Suero fisiológico 500 ml (1)"
  ],  
  6: [
    "Manitol (1)",
    "Ringer lactato (1)",
    "Suero fisiológico 500 ml (1)"
  ],  
  7: [
    "Sonda de aspiración nº 6–16 (2)",
    "Sonda Yankauer (2)"
  ],  
  8: [
    "Mascarilla I-gel nº 1–2,5 (1)",
    "Mascarilla I-gel nº 3–5 (1)"
  ],  
  9: [
    "Cánula Güelde nº 000–5 (2)",
    "Filtro bacteriano (2)",
    "Bolsa aspiradora (2)"
  ],  
  10: [
    "Empapadores (5)",
    "Bateas (5)",
    "Esponjas jabonosas (2)"
  ],  
  11: [
    "Fonendoscopio (1)",
    "Esfigmomanómetro manual adulto-pediátrico (1)",
    "Esfigmomanómetro automático (1)",
    "Parche DESA adulto-pediátrico (1)",
    "Termómetro (1)",
    "Glucómetro (1)",
    "Pulsioxímetro adulto (1)",
    "Pulsioxímetro pediátrico (1)",
    "Lancetas (10)",
    "Pupilera (1)",
    "Tiras reactivas (1 caja)",
    "Torniquete (1)",
    "Tijera cortarropa",
    "Rasuradoras (3)"
  ],  
  12: [
    "Sutura 2/0-3/0 (2)",
    "Bisturí con mango (4)",
    "Merocel (2)",
    "Tijeras (1)",
    "Pinzas sin dientes (1)",
    "Pinzas con dientes (1)",
    "Kochers (2)",
    "Porta-agujas (1)",
    "Pinza Magill (1)",
    "Guantes estériles 6,5-8 (2)",
    "Paños estériles (2)",
    "Jeringa cono ancho 50 ml (2)",
    "Jeringa cono Luer (2)",
    "Lubricante urológico (2)",
    "Vaselina (1)",
    "Cable LAERDAL 220 V (1)",
    "Válvula de Heimlich (1)",
    "Pleurocath 6 F",
    "Pleurocath 8 F"
  ],  
  13: [
    "Alargaderas (4)",
    "Mascarilla traqueotomizados (1)",
    "Mascarilla Ventimask adulto (4)",
    "Gafas nasales adulto (6)",
    "Mascarilla reservorio adulto (3)",
    "Mascarilla nebulización adulto (3)"
  ],  
  14: [
    "Compresas (12)",
    "Gasas (12)"
  ],  
  15: [
    "Ambu adulto (1)",
    "Tubo corrugado (2)"
  ],  
  16: [
    "Mascarilla Ventimask pediátrica (2)",
    "Gafas nasales pediátrica (2)",
    "Mascarilla reservorio pediátrica (2)",
    "Mascarilla nebulización pediátrica (2)",
    "Ambu pediátrico (1)",
    "Ambu neonato (1)",
    "Mascarilla Ambu nº 0-5 (1)"
  ],  
  17: [
    "Correa inmovilización araña (1)",
    "Kidi-safe (1)",
    "Manta",
    "Sábanas"
  ],  
  18: [
    "Cinturón pélvico (1)",
    "Salvafast (1)",
    "Lona de rescate (1)"
  ],  
  19: [
    "Inmovilizador cabeza (1)",
    "Juego collarines (2)",
    "Correas camilla-tijera (1 juego)"
  ],  
  20: [
    "Colchón vacío (1)",
    "Férulas neopreno (1)"
  ],  
  21: [
    "Venda elástica cohesiva (2)",
    "Venda crepé (2)",
    "Esparadrapo plástico 2,5 cm (2)",
    "Esparadrapo tela (2)",
    "Agua oxigenada (2)",
    "Alcohol (1)",
    "Clorhexidina alcohólica (3)",
    "Vasos de agua (3)",
    "Botellín agua (1)",
    "Caja dentadura (2)",
    "Mantas térmicas (4)"
  ],  
  22: ["Guantes de nitrilo S, M, L (1 caja)"],
  23: ["Ampulario (1)"],  
  24: [
    "Pilas AAA (8)",
    "Pilas AA (4)",
    "Pilas CR2022 (2)",
    "Llaves ampulario/bolardos, etc. (1 juego)"
  ],  
  25: [
    "Jeringa insulina 1 ml (3)",
    "Jeringa 5 ml (5)",
    "Jeringa 10 ml (5)",
    "Jeringa 20 ml (2)",
    "Jeringa atomizadora (2)",
    "Suero fisiológico 10 ml (10)",
    "Clorhexidina acuosa (5)"
  ],  
  26: [
    "Steri-strip (2)",
    "Apósito adhesivo tejido (5)",
    "Acetona (1)",
    "Aguja carga 19 G (5)",
    "Aguja IM 21 G (5)",
    "Aguja SC 25 G (5)",
    "Extracción sanguínea adulto (2)",
    "Extracción sanguínea pediátrico (1)",
    "Catéter venoso 14–24 G (3)",
    "Aguja reservorio (2)",
    "Compresor (2)",
    "Tapones vía (5)"
  ],  
  27: [
    "Papelera",
    "Limpia-cristales (1)",
    "Limpiador superficies (1)",
    "Bolsas de basura (1)"
  ],  
  28: [
    "Apósitos adhesivos transparentes (5)",
    "Llaves 3 vías con alargadera (5)",
    "Equipos macro-gotero (3)",
    "Regulador Dial-A-Flow (1)",
    "Paracetamol 1 g IV (2)",
    "Ondansetron (2)",
    "Suero lava-flac (5)",
    "Ringer lactato (1)",
    "Poligelina (1)",
    "Suero glucosado 5 % 100 ml (2)",
    "Suero glucosado 5 % 250 ml (2)",
    "Glucosado 50 % (2)",
    "Suero fisiológico 500 ml (3)",
    "Suero fisiológico 100 ml (4)",
    "Extractor/compresor sueros (1)"
  ],  
  29: ["Férulas vacío (1)"],  
  30: [
    "Ferno Keed (1)",
    "Férula tracción adulta (1)"
  ]
};

const kitDetailsMap: { [key: number]: { name: string; iconName: string; genericImageHint: string } } = {
  1: { name: "Mochila Pediátrica", iconName: "ToyBrick", genericImageHint: "pediatric supplies" },
  2: { name: "Mochila Adulto", iconName: "BriefcaseMedical", genericImageHint: "adult supplies" },
  3: { name: "Material Diverso (Partos, Quemados, etc.)", iconName: "Package", genericImageHint: "assorted medical supplies" },
  4: { name: "Kit EPI y Bioseguridad", iconName: "ShieldAlert", genericImageHint: "ppe kit" },
  5: { name: "Kit Medicación Urgente", iconName: "Pill", genericImageHint: "urgent medication" },
  6: { name: "Kit Fluidoterapia", iconName: "Droplet", genericImageHint: "iv fluids" },
  7: { name: "Kit Aspiración Secreciones", iconName: "Filter", genericImageHint: "suction supplies" },
  8: { name: "Kit Vía Aérea (I-gel)", iconName: "Wind", genericImageHint: "airway management" },
  9: { name: "Kit Vía Aérea (Cánulas/Filtros)", iconName: "Wind", genericImageHint: "airway accessories" },
  10: { name: "Kit Higiene y Cuidados", iconName: "Sparkles", genericImageHint: "hygiene patient care" },
  11: { name: "Kit Diagnóstico", iconName: "Stethoscope", genericImageHint: "diagnostic tools" },
  12: { name: "Kit Curas y Pequeña Cirugía", iconName: "Scissors", genericImageHint: "suture surgical tools" },
  13: { name: "Kit Oxigenoterapia Adulto", iconName: "Lung", genericImageHint: "oxygen masks adult" },
  14: { name: "Kit Apósitos y Gasas", iconName: "Bandage", genericImageHint: "dressings gauze" },
  15: { name: "Kit Reanimación Adulto (Ambu)", iconName: "HeartPulse", genericImageHint: "ambu bag adult" },
  16: { name: "Kit Oxigenoterapia/Reanimación Pediátrica", iconName: "Baby", genericImageHint: "pediatric oxygen ambu" },
  17: { name: "Kit Inmovilización y Transporte", iconName: "Accessibility", genericImageHint: "immobilization transport" }, // Consider changing icon if needed for more specificity
  18: { name: "Kit Rescate y Seguridad", iconName: "Anchor", genericImageHint: "rescue safety" },
  19: { name: "Kit Inmovilización Cervical", iconName: "UserCog", genericImageHint: "cervical collars head immobilizer" },
  20: { name: "Kit Inmovilización Colchón/Férulas Neopreno", iconName: "BedSingle", genericImageHint: "vacuum mattress splints" },
  21: { name: "Kit Consumibles Varios", iconName: "Archive", genericImageHint: "general consumables" },
  22: { name: "Guantes Nitrilo (S,M,L)", iconName: "Hand", genericImageHint: "nitrile gloves" },
  23: { name: "Ampulario Medicación", iconName: "Syringe", genericImageHint: "medication ampoules" }, // Consider 'BoxIcon' if it's a box
  24: { name: "Kit Baterías y Llaves", iconName: "KeyRound", genericImageHint: "batteries keys" },
  25: { name: "Kit Jeringas y Sueros Pequeños", iconName: "Syringe", genericImageHint: "syringes saline" },
  26: { name: "Kit Material de Punción y Apósitos", iconName: "Bandage", genericImageHint: "needles dressings" },
  27: { name: "Kit Material de Limpieza", iconName: "Trash2", genericImageHint: "cleaning supplies" },
  28: { name: "Kit Fluidoterapia y Medicación IV", iconName: "Droplet", genericImageHint: "iv fluids medication" },
  29: { name: "Kit Férulas de Vacío", iconName: "Layers", genericImageHint: "vacuum splints" }, // 'Layers' can represent the structure
  30: { name: "Kit Inmovilización Avanzada (KED/Tracción)", iconName: "Truck", genericImageHint: "ked traction splint" } // 'Truck' for KED, or 'Bone' for traction
};


const parseMaterialString = (materialStr: string): { name: string; quantity: number } => {
  const match = materialStr.match(/(.+?)\s*\((\d+)\s*(\w*)\)$/); 
  const matchOnlyQty = materialStr.match(/(.+?)\s*\((\d+)\)$/); 
  const matchBox = materialStr.match(/(.+?)\s*\((\d*\s*caja)\)$/i);
  const matchSet = materialStr.match(/(.+?)\s*\((\d*\s*juego)\)$/i);
  
  if (matchBox) {
    return { name: matchBox[1].trim(), quantity: 1 }; 
  }
  if (matchSet) {
    return { name: matchSet[1].trim(), quantity: 1 };
  }
  if (match) {
    let name = match[1].trim();
    const quantity = parseInt(match[2], 10);
    return { name, quantity };
  }
  if (matchOnlyQty) {
    return { name: matchOnlyQty[1].trim(), quantity: parseInt(matchOnlyQty[2], 10) };
  }
  
  return { name: materialStr.trim(), quantity: 1 };
};

const processedUSVBKits: USVBKit[] = Object.entries(rawUSVBKitData)
  .map(([kitNumStr, materialStrings]) => {
    const kitNumber = parseInt(kitNumStr, 10);
    const details = kitDetailsMap[kitNumber] || { name: `Kit Desconocido ${kitNumber}`, iconName: 'Package', genericImageHint: 'medical supplies' };
    
    const materials: USVBKitMaterial[] = materialStrings.map((matStr, index) => {
      const parsed = parseMaterialString(matStr);
      return {
        id: `usvb-kit${kitNumber}-mat-${index}-${parsed.name.replace(/\s+/g, '-').toLowerCase().substring(0,50)}`, // Added substring to avoid overly long ids
        name: parsed.name,
        quantity: parsed.quantity,
        targetQuantity: parsed.quantity, 
      };
    });

    return {
      id: `usvb-kit-${kitNumber.toString().padStart(2, '0')}`,
      number: kitNumber,
      name: details.name,
      iconName: details.iconName,
      genericImageHint: details.genericImageHint,
      materials: materials,
    };
  })
  .sort((a, b) => a.number - b.number);


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
  
  getAmbulanceStorageLocations: () => readonly AmbulanceStorageLocation[];

  // USVB Kit Management
  usvbKits: USVBKit[];
  getUSVBKitById: (kitId: string) => USVBKit | undefined;
  updateUSVBKitMaterialQuantity: (kitId: string, materialId: string, newQuantity: number) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const generateSVBAmbulances = (): Ambulance[] => {
  const svbAmbulances: Ambulance[] = [];
  for (let i = 1; i <= 21; i++) {
    const numberString = i.toString().padStart(3, '0');
    svbAmbulances.push({
      id: `svb-b${numberString}`,
      name: `SVB B${numberString}`,
      licensePlate: `SVB-${numberString}`,
      model: 'Furgoneta SVB',
      year: 2023,
      mechanicalReviewCompleted: false,
      cleaningCompleted: false,
      inventoryCompleted: false,
      lastKnownKilometers: Math.floor(Math.random() * 500) + 100,
    });
  }
  return svbAmbulances;
};

export const initialAmbulances: Ambulance[] = [
  { id: 'amb001', name: 'Ambulancia 01', licensePlate: 'XYZ 123', model: 'Mercedes Sprinter', year: 2022, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastMechanicalReview: new Date(Date.now() - 5*24*60*60*1000).toISOString(), lastKnownKilometers: 10500, lastCheckInDate: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
  { id: 'amb002', name: 'Ambulancia 02', licensePlate: 'ABC 789', model: 'Ford Transit', year: 2021, mechanicalReviewCompleted: true, cleaningCompleted: false, inventoryCompleted: false, lastCleaning: new Date(Date.now() - 2*24*60*60*1000).toISOString(), lastKnownKilometers: 22300, lastCheckInDate: new Date(Date.now() - 2*24*60*60*1000).toISOString()  },
  { id: 'amb003', name: 'Unidad Rápida B1', licensePlate: 'DEF 456', model: 'VW Crafter', year: 2023, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastKnownKilometers: 5200 },
  ...generateSVBAmbulances(),
];

const initialConsumables: ConsumableMaterial[] = [
    { id: 'cons001', ambulanceId: 'amb001', name: 'Vendas Estériles (paquete 10)', reference: 'BNDG-01', quantity: 50, expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), storageLocation: "Mochila Principal (Rojo)" },
    { id: 'cons002', ambulanceId: 'amb001', name: 'Solución Salina 500ml', reference: 'SLN-05', quantity: 10, expiryDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(), storageLocation: "Mochila Circulatorio (Amarillo)" },
    { id: 'cons003', ambulanceId: 'amb002', name: 'Guantes Estériles Talla M (Caja)', reference: 'GLV-M', quantity: 5, expiryDate: new Date(Date.now() + 5*24*60*60*1000).toISOString(), storageLocation: "Cajón Lateral Superior Izq." },
    { id: 'cons004', ambulanceId: 'amb001', name: 'Mascarilla RCP Adulto', reference: 'RCP-AD', quantity: 2, expiryDate: new Date(Date.now() + 100*24*60*60*1000).toISOString(), storageLocation: "Mochila Vía Aérea (Azul)" },
    { id: 'cons005', ambulanceId: 'amb001', name: 'Apósitos Adhesivos (caja)', reference: 'APOS-MIX', quantity: 1, expiryDate: new Date(Date.now() + 60*24*60*60*1000).toISOString() },
];

const initialNonConsumables: NonConsumableMaterial[] = [
    { id: 'noncons001', ambulanceId: 'amb001', name: 'Desfibrilador Externo Automático (DEA)', serialNumber: 'DEFIB-A001', status: 'Operacional', storageLocation: "Mochila Principal (Rojo)" },
    { id: 'noncons002', ambulanceId: 'amb002', name: 'Camilla Principal Ruedas', serialNumber: 'STRCH-B012', status: 'Necesita Reparación', storageLocation: "Compartimento Principal Ambulancia" },
    { id: 'noncons003', ambulanceId: 'amb001', name: 'Pulsioxímetro Portátil', serialNumber: 'PULSI-X07', status: 'Operacional', storageLocation: "Mochila Principal (Rojo)" },
    { id: 'noncons004', ambulanceId: 'amb001', name: 'Tabla Espinal Larga', serialNumber: 'SPNL-L003', status: 'Operacional' },
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
  const [usvbKitsData, setUsvbKitsData] = useState<USVBKit[]>(processedUSVBKits); 


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
        if (step === 'inventory') {
            updatedAmb.inventoryCompleted = status;
            if (status) { 
                updatedAmb.lastInventoryCheck = new Date().toISOString();
                
                updatedAmb.mechanicalReviewCompleted = false;
                updatedAmb.cleaningCompleted = false;
                updatedAmb.inventoryCompleted = false;
            }
        } else { 
            if (step === 'mechanical' && !status) {
              updatedAmb.cleaningCompleted = false;
              updatedAmb.inventoryCompleted = false;
            }
            if (step === 'cleaning' && !status) {
              updatedAmb.inventoryCompleted = false;
            }
        }
        return updatedAmb;
      }
      return amb;
    }));
  };


  const getRevisionDiariaVehiculoByAmbulanceId = (ambulanceId: string): RevisionDiariaVehiculo | undefined => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return undefined;
    }
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
    const existingCheckIndex = revisionesDiariasVehiculo.findIndex(c => c.ambulanceId === checkData.ambulanceId && c.checkDate.startsWith(checkData.checkDate.substring(0,10)));

    const newCheck: RevisionDiariaVehiculo = {
      ...checkData,
      id: `rdv-${Date.now()}`,
      submittedByUserId: user.id,
    };

    if (existingCheckIndex > -1) {
      setRevisionesDiariasVehiculo(prev => {
        const updatedChecks = [...prev];
        updatedChecks[existingCheckIndex] = newCheck;
        return updatedChecks;
      });
    } else {
      setRevisionesDiariasVehiculo(prev => [newCheck, ...prev]);
    }
  };

  const getAmbulanceStorageLocations = (): readonly AmbulanceStorageLocation[] => {
    return ambulanceStorageLocations;
  };

  // --- USVB Kit Management ---
  const getUSVBKitById = (kitId: string): USVBKit | undefined => {
    return usvbKitsData.find(kit => kit.id === kitId);
  };

  const updateUSVBKitMaterialQuantity = (kitId: string, materialId: string, newQuantity: number) => {
    setUsvbKitsData(prevKits =>
      prevKits.map(kit => {
        if (kit.id === kitId) {
          return {
            ...kit,
            materials: kit.materials.map(material =>
              material.id === materialId ? { ...material, quantity: Math.max(0, newQuantity) } : material
            ),
          };
        }
        return kit;
      })
    );
  };
  
  const generateAlerts = useCallback(() => {
    if (authLoading || !user) return; 
    const newAlerts: Alert[] = [];
    const today = new Date();

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

    const accessibleAmbulanceIds = new Set(accessibleAmbulances.map(a => a.id));
    const relevantConsumableMaterials = consumableMaterials.filter(material => accessibleAmbulanceIds.has(material.ambulanceId));
    
    relevantConsumableMaterials.forEach(material => {
      const expiryDate = new Date(material.expiryDate);
      const ambulance = allAmbulancesData.find(a=> a.id === material.ambulanceId);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, accessibleAmbulances, consumableMaterials, mechanicalReviews, cleaningLogs, allAmbulancesData]); 

  useEffect(() => {
    if (!authLoading) {
        generateAlerts();
    }
  }, [generateAlerts, authLoading]);

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
    usvbKits: usvbKitsData, getUSVBKitById, updateUSVBKitMaterialQuantity,
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

