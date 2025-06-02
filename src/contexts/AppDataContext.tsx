
"use client";

import type { Ambulance, MechanicalReview, CleaningLog, ConsumableMaterial, NonConsumableMaterial, Alert, RevisionDiariaVehiculo, AmbulanceStorageLocation, USVBKit, USVBKitMaterial, InventoryLogEntry, InventoryLogAction, ChecklistItem, ChecklistItemStatus, AlertType, CentralInventoryLogEntry } from '@/types';
// Importar la lista ya no es necesario desde types, se gestiona aquí
import React, { createContext, useContext, useState, type ReactNode, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast'; // Asegúrate que toast está disponible

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

const generateInitialConfigurableUsvbKits = (): USVBKit[] => {
 return Object.entries(rawUSVBKitData)
  .map(([kitNumStr, materialStrings]) => {
    const kitNumber = parseInt(kitNumStr, 10);
    const details = kitDetailsMap[kitNumber] || { name: `Kit Desconocido ${kitNumber}`, iconName: 'Package', genericImageHint: 'medical supplies' };
    
    const materials: USVBKitMaterial[] = materialStrings.map((matStr, index) => {
      const parsed = parseMaterialString(matStr);
      return {
        id: `usvb-kit${kitNumber}-matcfg-${index}-${parsed.name.replace(/\s+/g, '-').toLowerCase().substring(0,50)}`,
        name: parsed.name,
        quantity: parsed.quantity, // For config, this is the target/ideal quantity
        targetQuantity: parsed.quantity, 
      };
    });

    return {
      id: `usvb-kitcfg-${kitNumber.toString().padStart(2, '0')}`,
      number: kitNumber,
      name: details.name,
      iconName: details.iconName,
      genericImageHint: details.genericImageHint,
      materials: materials,
    };
  })
  .sort((a, b) => a.number - b.number);
};

const LOCAL_STORAGE_CONFIG_AMBULANCE_LOCATIONS = 'ambuConfigurableAmbulanceLocations';
const LOCAL_STORAGE_CONFIG_MECH_REVIEW_ITEMS = 'ambuConfigurableMechReviewItems';
const LOCAL_STORAGE_CONFIG_USVB_KITS = 'ambuConfigurableUsvbKits'; // New key for USVB kits config

const defaultInitialAmbulanceStorageLocations: AmbulanceStorageLocation[] = [
    "Mochila Principal (Rojo)", "Mochila Vía Aérea (Azul)", "Mochila Circulatorio (Amarillo)",
    "Cajón Lateral Superior Izq.", "Cajón Lateral Inferior Izq.", "Cajón Lateral Superior Der.",
    "Cajón Lateral Inferior Der.", "Bolsillos Puerta Trasera", "Compartimento Techo Cabina",
    "Debajo Asiento Acompañante", "Sin Ubicación Específica"
];

const defaultInitialMechanicalReviewItems: { name: string }[] = [
  { name: 'Pastillas de Freno (Delanteras)' }, { name: 'Pastillas de Freno (Traseras)' },
  { name: 'Discos de Freno (Delanteros)' }, { name: 'Discos de Freno (Traseros)' },
  { name: 'Líquido de Frenos (Nivel y Estado)' }, { name: 'Latiguillos y Tuberías de Freno' },
  { name: 'Servofreno (Asistencia de Frenado)' }, { name: 'Freno de Estacionamiento' },
  { name: 'Presión Neumático Delantero Izquierdo' }, { name: 'Presión Neumático Delantero Derecho' },
  { name: 'Presión Neumático Trasero Izquierdo (Interior si gemela)' }, { name: 'Presión Neumático Trasero Derecho (Interior si gemela)' },
  { name: 'Presión Neumático Trasero Izquierdo (Exterior si gemela)' }, { name: 'Presión Neumático Trasero Derecho (Exterior si gemela)' },
  { name: 'Presión Neumático de Repuesto' }, { name: 'Profundidad Dibujo Neumáticos (Todos)' },
  { name: 'Estado General Neumáticos (Cortes, Deformaciones, Desgaste irregular)' }, { name: 'Apriete de Tuercas/Tornillos de Rueda' },
  { name: 'Luces de Cruce (Cortas)' }, { name: 'Luces de Carretera (Largas)' },
  { name: 'Luces de Posición (Delanteras)' }, { name: 'Luces de Posición (Traseras)' },
  { name: 'Luces de Freno (Incluida tercera luz)' }, { name: 'Intermitentes Delanteros (Izq. y Der.)' },
  { name: 'Intermitentes Traseros (Izq. y Der.)' }, { name: 'Intermitentes Laterales (Izq. y Der.)' },
  { name: 'Luces de Emergencia (Warning)' }, { name: 'Luces de Marcha Atrás' },
  { name: 'Luz Antiniebla Delantera' }, { name: 'Luz Antiniebla Trasera' }, { name: 'Luces de Matrícula' },
  { name: 'Luces Rotativas/Prioritarias Azules' }, { name: 'Luces Interiores Cabina Conducción' },
  { name: 'Luces Interiores Célula Sanitaria (General, Quirófano si aplica)' }, { name: 'Nivel de Aceite Motor' },
  { name: 'Nivel de Líquido Refrigerante' }, { name: 'Estado de Correas (Alternador, Dirección, A/A, etc.)' },
  { name: 'Estado de Mangueras (Refrigeración, Admisión, Combustible, etc.)' }, { name: 'Fugas Visibles en Compartimento Motor (Aceite, Refrigerante, Combustible)' },
  { name: 'Batería Principal (Estado Bornes, Sujeción, Nivel Electrolito si aplica)' }, { name: 'Batería Auxiliar Célula Sanitaria (si aplica)' },
  { name: 'Holgura en la Dirección' }, { name: 'Nivel Líquido Dirección Asistida' },
  { name: 'Guardapolvos de Dirección (Cremallera y Rótulas)' }, { name: 'Amortiguadores Delanteros (Fugas, Estado)' },
  { name: 'Amortiguadores Traseros (Fugas, Estado)' }, { name: 'Ballestas/Muelles (Estado, Sujeciones)' },
  { name: 'Silentblocks y Bujes de Suspensión (Visible)' }, { name: 'Funcionamiento Alternador (Testigo Batería al arrancar/apagar)' },
  { name: 'Estado del Cableado Visible General' }, { name: 'Claxon / Bocina' },
  { name: 'Estado Parabrisas y Ventanillas (Fisuras, Impactos)' }, { name: 'Funcionamiento Elevalunas Eléctricos' },
  { name: 'Cierre Centralizado y Cerraduras Puertas' }, { name: 'Espejos Retrovisores (Exteriores e Interior)' },
  { name: 'Limpiaparabrisas (Escobillas y Funcionamiento)' }, { name: 'Nivel Líquido Limpiaparabrisas' },
  { name: 'Estado Chapa y Pintura (Golpes, Óxido significativo)' }, { name: 'Funcionamiento Puertas Célula (Lateral y Trasera)' },
  { name: 'Escalón de Acceso (si aplica, estado y funcionamiento)' }, { name: 'Anclajes Camilla Principal' },
  { name: 'Soportes Equipamiento Médico (Fijación)' }, { name: 'Cinturones de Seguridad (Todos los asientos, célula y cabina)' },
  { name: 'Fugas de Fluidos Bajo el Vehículo (Revisar tras estacionamiento)' }, { name: 'Estado General del Sistema de Escape (Fugas, Corrosión, Sujeción)' },
  { name: 'Emisión de Humos Anormal (Color, Densidad excesiva)' }, { name: 'Triángulos de Señalización (Cantidad y Estado)' },
  { name: 'Chaleco Reflectante (Cantidad y Estado)' }, { name: 'Extintor (Presión, Caducidad, Sujeción)' },
  { name: 'Gato y Herramientas para Cambio de Rueda' }, { name: 'Botiquín de Primeros Auxilios del Vehículo (si normativo)' },
  { name: 'Sistema de Calefacción/AA Célula Sanitaria' }, { name: 'Sistema de Oxígeno Fijo (Manómetros, Fugas en tuberías)' },
  { name: 'Tomas de Corriente 12V / 220V en Célula (Funcionamiento)' }, { name: 'Iluminación de Emergencia Exterior (Focos trabajo, etc.)' },
  { name: 'Sirena y Sistema PA (Funcionamiento y Tonos)' },
];


interface AppDataContextType {
  ambulances: Ambulance[];
  getAmbulanceById: (id: string) => Ambulance | undefined;
  getAmbulanceByName: (name: string) => Ambulance | undefined;
  addAmbulance: (ambulance: Omit<Ambulance, 'id' | 'mechanicalReviewCompleted' | 'cleaningCompleted' | 'inventoryCompleted' | 'dailyCheckCompleted' | 'lastDailyCheck'>) => void;
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

  updateAmbulanceWorkflowStep: (ambulanceId: string, step: 'dailyCheck' | 'mechanical' | 'cleaning' | 'inventory', status: boolean) => void;
  getAllAmbulancesCount: () => number;

  revisionesDiariasVehiculo: RevisionDiariaVehiculo[];
  getRevisionDiariaVehiculoByAmbulanceId: (ambulanceId: string) => RevisionDiariaVehiculo | undefined;
  saveRevisionDiariaVehiculo: (check: Omit<RevisionDiariaVehiculo, 'id'> & { submittedByUserId: string }) => void;
  
  getAmbulanceStorageLocations: () => readonly AmbulanceStorageLocation[];
  addAmbulanceStorageLocation: (location: string) => void;
  updateAmbulanceStorageLocation: (oldLocation: string, newLocation: string) => boolean;
  deleteAmbulanceStorageLocation: (location: string) => boolean;

  getConfigurableMechanicalReviewItems: () => Readonly<{ name: string }[]>;
  addConfigurableMechanicalReviewItem: (item: { name: string }) => void;
  updateConfigurableMechanicalReviewItem: (originalName: string, newName: string) => boolean;
  deleteConfigurableMechanicalReviewItem: (name: string) => boolean;

  // USVB Kit Management
  usvbKits: USVBKit[]; // Operational data with current quantities
  getUSVBKitById: (kitId: string) => USVBKit | undefined;
  updateUSVBKitMaterialQuantity: (kitId: string, materialId: string, newQuantity: number) => void;
  
  // USVB Kit Configuration Management
  getConfigurableUsvbKits: () => Readonly<USVBKit[]>;
  updateConfigurableUsvbKitDetails: (kitId: string, details: Pick<USVBKit, 'name' | 'iconName' | 'genericImageHint'>) => void;
  addMaterialToConfigurableUsvbKit: (kitId: string, materialData: { name: string; targetQuantity: number }) => void;
  updateMaterialInConfigurableUsvbKit: (kitId: string, materialId: string, updates: { name?: string; targetQuantity?: number }) => void;
  deleteMaterialFromConfigurableUsvbKit: (kitId: string, materialId: string) => void;
  reorderMaterialInConfigurableUsvbKit: (kitId: string, materialId: string, direction: 'up' | 'down') => void;


  inventoryLogs: InventoryLogEntry[];
  getInventoryLogsByAmbulanceId: (ambulanceId: string) => InventoryLogEntry[];
  centralInventoryLogs: CentralInventoryLogEntry[];
  getCentralInventoryLogs: () => CentralInventoryLogEntry[];


  getNotificationEmailConfig: () => string | null;
  setNotificationEmailConfig: (email: string | null) => void;
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
      dailyCheckCompleted: false,
      mechanicalReviewCompleted: false,
      cleaningCompleted: false,
      inventoryCompleted: false,
      lastKnownKilometers: Math.floor(Math.random() * 500) + 100,
    });
  }
  return svbAmbulances;
};

export const initialAmbulances: Ambulance[] = [
  { id: 'amb001', name: 'Ambulancia 01', licensePlate: 'XYZ 123', model: 'Mercedes Sprinter', year: 2022, dailyCheckCompleted: false, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastMechanicalReview: new Date(Date.now() - 5*24*60*60*1000).toISOString(), lastKnownKilometers: 10500, lastCheckInDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(), lastDailyCheck: new Date(Date.now() - 25*60*60*1000).toISOString() },
  { id: 'amb002', name: 'Ambulancia 02', licensePlate: 'ABC 789', model: 'Ford Transit', year: 2021, dailyCheckCompleted: true, lastDailyCheck: new Date().toISOString(), mechanicalReviewCompleted: true, cleaningCompleted: false, inventoryCompleted: false, lastCleaning: new Date(Date.now() - 2*24*60*60*1000).toISOString(), lastKnownKilometers: 22300, lastCheckInDate: new Date(Date.now() - 2*24*60*60*1000).toISOString()  },
  { id: 'amb003', name: 'Unidad Rápida B1', licensePlate: 'DEF 456', model: 'VW Crafter', year: 2023, dailyCheckCompleted: false, mechanicalReviewCompleted: false, cleaningCompleted: false, inventoryCompleted: false, lastKnownKilometers: 5200 },
  ...generateSVBAmbulances(),
];

const initialConsumables: ConsumableMaterial[] = [
    { id: 'cons001', ambulanceId: 'amb001', name: 'Vendas Estériles (paquete 10)', reference: 'BNDG-01', quantity: 50, expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), storageLocation: "Mochila Principal (Rojo)", minStockLevel: 20 },
    { id: 'cons002', ambulanceId: 'amb001', name: 'Solución Salina 500ml', reference: 'SLN-05', quantity: 2, expiryDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(), storageLocation: "Mochila Circulatorio (Amarillo)", minStockLevel: 5 },
    { id: 'cons003', ambulanceId: 'amb002', name: 'Guantes Estériles Talla M (Caja)', reference: 'GLV-M', quantity: 5, expiryDate: new Date(Date.now() + 5*24*60*60*1000).toISOString(), storageLocation: "Cajón Lateral Superior Izq.", minStockLevel: 2 },
    { id: 'cons004', ambulanceId: 'amb001', name: 'Mascarilla RCP Adulto', reference: 'RCP-AD', quantity: 1, expiryDate: new Date(Date.now() + 100*24*60*60*1000).toISOString(), storageLocation: "Mochila Vía Aérea (Azul)", minStockLevel: 2 },
    { id: 'cons005', ambulanceId: 'amb001', name: 'Apósitos Adhesivos (caja)', reference: 'APOS-MIX', quantity: 1, expiryDate: new Date(Date.now() + 60*24*60*60*1000).toISOString(), minStockLevel: 1 },
];

const initialNonConsumables: NonConsumableMaterial[] = [
    { id: 'noncons001', ambulanceId: 'amb001', name: 'Desfibrilador Externo Automático (DEA)', serialNumber: 'DEFIB-A001', status: 'Operacional', storageLocation: "Mochila Principal (Rojo)", minStockLevel: 1 },
    { id: 'noncons002', ambulanceId: 'amb002', name: 'Camilla Principal Ruedas', serialNumber: 'STRCH-B012', status: 'Necesita Reparación', storageLocation: "Compartimento Principal Ambulancia", minStockLevel: 1 },
    { id: 'noncons003', ambulanceId: 'amb001', name: 'Pulsioxímetro Portátil', serialNumber: 'PULSI-X07', status: 'Operacional', storageLocation: "Mochila Principal (Rojo)", minStockLevel: 1 },
    { id: 'noncons004', ambulanceId: 'amb001', name: 'Tabla Espinal Larga', serialNumber: 'SPNL-L003', status: 'Operacional', minStockLevel: 1 },
];


const NOTIFICATION_EMAIL_STORAGE_KEY = 'ambuReviewNotificationEmail';

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [allAmbulancesData, setAllAmbulancesData] = useState<Ambulance[]>(initialAmbulances);
  const [mechanicalReviews, setMechanicalReviews] = useState<MechanicalReview[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [consumableMaterials, setConsumableMaterials] = useState<ConsumableMaterial[]>(initialConsumables);
  const [nonConsumableMaterials, setNonConsumableMaterials] = useState<NonConsumableMaterial[]>(initialNonConsumables);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [revisionesDiariasVehiculo, setRevisionesDiariasVehiculo] = useState<RevisionDiariaVehiculo[]>([]);
  
  // USVB Kits: `configurableUsvbKits` is the template/config, `usvbKitsData` is operational data.
  const [configurableUsvbKits, setConfigurableUsvbKitsState] = useState<USVBKit[]>(generateInitialConfigurableUsvbKits());
  const [usvbKitsData, setUsvbKitsData] = useState<USVBKit[]>([]); // Operational data

  const [inventoryLogs, setInventoryLogs] = useState<InventoryLogEntry[]>([]);
  const [centralInventoryLogsState, setCentralInventoryLogsState] = useState<CentralInventoryLogEntry[]>([]);
  const [notificationEmailConfig, setNotificationEmailConfigState] = useState<string | null>(null);
  const [configurableAmbulanceStorageLocations, setConfigurableAmbulanceStorageLocations] = useState<string[]>(defaultInitialAmbulanceStorageLocations);
  const [configurableMechanicalReviewItems, setConfigurableMechanicalReviewItems] = useState<{name: string}[]>(defaultInitialMechanicalReviewItems);

  const setConfigurableUsvbKits = useCallback((newKits: USVBKit[] | ((prevKits: USVBKit[]) => USVBKit[])) => {
    const kitsToSave = typeof newKits === 'function' ? newKits(configurableUsvbKits) : newKits;
    setConfigurableUsvbKitsState(kitsToSave);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CONFIG_USVB_KITS, JSON.stringify(kitsToSave));
    }
  }, [configurableUsvbKits]);

  // Sync operational usvbKitsData with configurableUsvbKits
  useEffect(() => {
    setUsvbKitsData(prevOperationalKits => {
        return configurableUsvbKits.map(configKit => {
            const existingOperationalKit = prevOperationalKits.find(opKit => opKit.id === configKit.id);
            return {
                ...configKit, // Base structure from config
                materials: configKit.materials.map(configMaterial => {
                    const existingOperationalMaterial = existingOperationalKit?.materials.find(opMat => opMat.name === configMaterial.name); // Match by name if ID changes or for new
                    return {
                        ...configMaterial, // Includes name and targetQuantity from config
                        id: existingOperationalMaterial?.id || `usvb-mat-${configKit.id}-${configMaterial.name.replace(/\s+/g, '-')}`, // Keep old ID or generate new
                        quantity: existingOperationalMaterial?.quantity ?? configMaterial.targetQuantity, // Use existing quantity or default to target
                    };
                }),
            };
        });
    });
  }, [configurableUsvbKits]);


  // Load configs from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem(NOTIFICATION_EMAIL_STORAGE_KEY);
      if (storedEmail) setNotificationEmailConfigState(storedEmail);

      const storedLocations = localStorage.getItem(LOCAL_STORAGE_CONFIG_AMBULANCE_LOCATIONS);
      if (storedLocations) setConfigurableAmbulanceStorageLocations(JSON.parse(storedLocations));
      else localStorage.setItem(LOCAL_STORAGE_CONFIG_AMBULANCE_LOCATIONS, JSON.stringify(defaultInitialAmbulanceStorageLocations));
      
      const storedMechItems = localStorage.getItem(LOCAL_STORAGE_CONFIG_MECH_REVIEW_ITEMS);
      if (storedMechItems) setConfigurableMechanicalReviewItems(JSON.parse(storedMechItems));
      else localStorage.setItem(LOCAL_STORAGE_CONFIG_MECH_REVIEW_ITEMS, JSON.stringify(defaultInitialMechanicalReviewItems));

      const storedUsvbKitsConfig = localStorage.getItem(LOCAL_STORAGE_CONFIG_USVB_KITS);
      if (storedUsvbKitsConfig) setConfigurableUsvbKitsState(JSON.parse(storedUsvbKitsConfig)); // Use setConfigurableUsvbKitsState to avoid direct state mutation warning
      else localStorage.setItem(LOCAL_STORAGE_CONFIG_USVB_KITS, JSON.stringify(generateInitialConfigurableUsvbKits()));
    }
  }, []);

  const getCentralInventoryLogs = useCallback(() => {
    return centralInventoryLogsState.sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }, [centralInventoryLogsState]);

  const addCentralInventoryLog = useCallback((logEntry: Omit<CentralInventoryLogEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    setCentralInventoryLogsState(prevLogs => {
      const newLog: CentralInventoryLogEntry = {
        ...logEntry,
        id: `cent-log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        // userId and userName would be set here if available from a real backend session
      };
      return [newLog, ...prevLogs];
    });
  }, []);


  const getNotificationEmailConfig = useCallback(() => {
    if (user?.role === 'coordinador') return notificationEmailConfig;
    return null;
  }, [user, notificationEmailConfig]);

  const setNotificationEmailConfig = useCallback((email: string | null) => {
    if (user?.role === 'coordinador') {
      if (email) {
        localStorage.setItem(NOTIFICATION_EMAIL_STORAGE_KEY, email);
        setNotificationEmailConfigState(email);
      } else {
        localStorage.removeItem(NOTIFICATION_EMAIL_STORAGE_KEY);
        setNotificationEmailConfigState(null);
      }
    }
  }, [user]);

  // --- Configurable Ambulance Storage Locations ---
  const getAmbulanceStorageLocations = useCallback((): readonly AmbulanceStorageLocation[] => {
    return configurableAmbulanceStorageLocations;
  }, [configurableAmbulanceStorageLocations]);

  const addAmbulanceStorageLocation = useCallback((location: string) => {
    if (user?.role !== 'coordinador' || !location.trim() || configurableAmbulanceStorageLocations.includes(location.trim())) {
      if (configurableAmbulanceStorageLocations.includes(location.trim())) {
        toast({ title: "Error", description: "Esta ubicación ya existe.", variant: "destructive" });
      }
      return;
    }
    const newLocations = [...configurableAmbulanceStorageLocations, location.trim()];
    setConfigurableAmbulanceStorageLocations(newLocations);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_AMBULANCE_LOCATIONS, JSON.stringify(newLocations));
    toast({ title: "Ubicación Añadida", description: `"${location.trim()}" ha sido añadida.` });
  }, [user, configurableAmbulanceStorageLocations, toast]);

  const updateAmbulanceStorageLocation = useCallback((oldLocation: string, newLocation: string): boolean => {
    if (user?.role !== 'coordinador' || !newLocation.trim() || configurableAmbulanceStorageLocations.includes(newLocation.trim())) {
      if (configurableAmbulanceStorageLocations.includes(newLocation.trim())) {
         toast({ title: "Error", description: `La ubicación "${newLocation.trim()}" ya existe.`, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "El nuevo nombre de ubicación no puede estar vacío.", variant: "destructive" });
      }
      return false;
    }
    const newLocations = configurableAmbulanceStorageLocations.map(loc => loc === oldLocation ? newLocation.trim() : loc);
    setConfigurableAmbulanceStorageLocations(newLocations);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_AMBULANCE_LOCATIONS, JSON.stringify(newLocations));

    // Update in materials
    setConsumableMaterials(prev => prev.map(m => m.storageLocation === oldLocation ? { ...m, storageLocation: newLocation.trim() } : m));
    setNonConsumableMaterials(prev => prev.map(m => m.storageLocation === oldLocation ? { ...m, storageLocation: newLocation.trim() } : m));
    toast({ title: "Ubicación Actualizada", description: `"${oldLocation}" es ahora "${newLocation.trim()}".` });
    return true;
  }, [user, configurableAmbulanceStorageLocations, toast]);

  const deleteAmbulanceStorageLocation = useCallback((locationToDelete: string): boolean => {
    if (user?.role !== 'coordinador') return false;
    const isInUseConsumable = consumableMaterials.some(m => m.storageLocation === locationToDelete);
    const isInUseNonConsumable = nonConsumableMaterials.some(m => m.storageLocation === locationToDelete);

    if (isInUseConsumable || isInUseNonConsumable) {
      toast({ title: "Error al Eliminar", description: `La ubicación "${locationToDelete}" está en uso y no puede ser eliminada.`, variant: "destructive" });
      return false;
    }
    const newLocations = configurableAmbulanceStorageLocations.filter(loc => loc !== locationToDelete);
    setConfigurableAmbulanceStorageLocations(newLocations);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_AMBULANCE_LOCATIONS, JSON.stringify(newLocations));
    toast({ title: "Ubicación Eliminada", description: `"${locationToDelete}" ha sido eliminada.` });
    return true;
  }, [user, configurableAmbulanceStorageLocations, consumableMaterials, nonConsumableMaterials, toast]);


  // --- Configurable Mechanical Review Items ---
  const getConfigurableMechanicalReviewItems = useCallback((): Readonly<{ name: string }[]> => {
    return configurableMechanicalReviewItems;
  }, [configurableMechanicalReviewItems]);

  const addConfigurableMechanicalReviewItem = useCallback((item: { name: string }) => {
    if (user?.role !== 'coordinador' || !item.name.trim() || configurableMechanicalReviewItems.some(i => i.name.toLowerCase() === item.name.trim().toLowerCase())) {
      if (configurableMechanicalReviewItems.some(i => i.name.toLowerCase() === item.name.trim().toLowerCase())) {
        toast({ title: "Error", description: "Este ítem de revisión ya existe.", variant: "destructive" });
      }
      return;
    }
    const newItems = [...configurableMechanicalReviewItems, { name: item.name.trim() }];
    setConfigurableMechanicalReviewItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_MECH_REVIEW_ITEMS, JSON.stringify(newItems));
    toast({ title: "Ítem Añadido", description: `"${item.name.trim()}" añadido a la plantilla de revisión.` });
  }, [user, configurableMechanicalReviewItems, toast]);

  const updateConfigurableMechanicalReviewItem = useCallback((originalName: string, newName: string): boolean => {
    if (user?.role !== 'coordinador' || !newName.trim() || (originalName !== newName && configurableMechanicalReviewItems.some(i => i.name.toLowerCase() === newName.trim().toLowerCase())) ) {
      if (configurableMechanicalReviewItems.some(i => i.name.toLowerCase() === newName.trim().toLowerCase())) {
         toast({ title: "Error", description: `El ítem de revisión "${newName.trim()}" ya existe.`, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "El nuevo nombre del ítem no puede estar vacío.", variant: "destructive" });
      }
      return false;
    }
    const newItems = configurableMechanicalReviewItems.map(item => item.name === originalName ? { ...item, name: newName.trim() } : item);
    setConfigurableMechanicalReviewItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_MECH_REVIEW_ITEMS, JSON.stringify(newItems));
    toast({ title: "Ítem Actualizado", description: `"${originalName}" es ahora "${newName.trim()}". (Esto solo afecta a nuevas revisiones)` });
    return true;
  }, [user, configurableMechanicalReviewItems, toast]);

  const deleteConfigurableMechanicalReviewItem = useCallback((nameToDelete: string): boolean => {
    if (user?.role !== 'coordinador') return false;
    const newItems = configurableMechanicalReviewItems.filter(item => item.name !== nameToDelete);
    setConfigurableMechanicalReviewItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_MECH_REVIEW_ITEMS, JSON.stringify(newItems));
    toast({ title: "Ítem Eliminado", description: `"${nameToDelete}" eliminado de la plantilla de revisión. (Las revisiones existentes no cambian)` });
    return true;
  }, [user, configurableMechanicalReviewItems, toast]);


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

  const addInventoryLogEntry = useCallback((
    ambulanceId: string,
    materialId: string,
    materialName: string,
    materialType: 'consumable' | 'non-consumable',
    action: InventoryLogAction,
    changeDetails: string,
    quantityBefore?: number,
    quantityAfter?: number,
    statusBefore?: string,
    statusAfter?: string
  ) => {
    if (!user) return;
    const newLog: InventoryLogEntry = {
      id: `invlog-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ambulanceId,
      materialId,
      materialName,
      materialType,
      action,
      changeDetails,
      quantityBefore,
      quantityAfter,
      statusBefore,
      statusAfter,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    };
    setInventoryLogs(prev => [newLog, ...prev]);
  }, [user]);

  const getInventoryLogsByAmbulanceId = useCallback((ambulanceId: string) => {
    return inventoryLogs.filter(log => log.ambulanceId === ambulanceId).sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }, [inventoryLogs]);


  const addAmbulance = (ambulanceData: Omit<Ambulance, 'id' | 'mechanicalReviewCompleted' | 'cleaningCompleted' | 'inventoryCompleted' | 'dailyCheckCompleted' | 'lastDailyCheck'>) => {
    if (user?.role !== 'coordinador') {
      console.warn("Intento no autorizado de añadir ambulancia por usuario no coordinador.");
      return;
    }
    const newAmbulance: Ambulance = {
      ...ambulanceData,
      id: `amb${String(Date.now()).slice(-4)}${Math.floor(Math.random()*100)}`,
      dailyCheckCompleted: false,
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
    setInventoryLogs(prev => prev.filter(log => log.ambulanceId !== id));
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


  const getConsumableMaterialsByAmbulanceId = useCallback((ambulanceId: string) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return [];
    }
    return consumableMaterials.filter(m => m.ambulanceId === ambulanceId);
  }, [user, consumableMaterials]);

  const addConsumableMaterial = (materialData: Omit<ConsumableMaterial, 'id'>) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialData.ambulanceId)) {
       console.warn("Intento no autorizado de añadir material consumible.");
       return;
    }
    const newMaterial: ConsumableMaterial = { ...materialData, id: `cons-${Date.now()}-${Math.random().toString(16).slice(2)}` };
    setConsumableMaterials(prev => [...prev, newMaterial]);
    addInventoryLogEntry(
      materialData.ambulanceId,
      newMaterial.id,
      materialData.name,
      'consumable',
      'added',
      `Añadido con ${materialData.quantity} unidades. Caducidad: ${format(parseISO(materialData.expiryDate), 'PPP', {locale: es})}. Ubicación: ${materialData.storageLocation || 'N/D'}. Min Stock: ${materialData.minStockLevel ?? 'N/D'}`,
      undefined,
      materialData.quantity
    );
  };
  const updateConsumableMaterial = (updatedMaterial: ConsumableMaterial) => {
     if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== updatedMaterial.ambulanceId)) {
       console.warn("Intento no autorizado de actualizar material consumible.");
       return;
    }
    const originalMaterial = consumableMaterials.find(m => m.id === updatedMaterial.id);
    if (!originalMaterial) return;

    setConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
    
    let detailsArray: string[] = [];
    if (originalMaterial.quantity !== updatedMaterial.quantity) {
      detailsArray.push(`Cantidad: ${originalMaterial.quantity} -> ${updatedMaterial.quantity}`);
    }
    if (originalMaterial.expiryDate !== updatedMaterial.expiryDate) {
      detailsArray.push(`Caducidad: ${format(parseISO(originalMaterial.expiryDate), 'PPP', {locale: es})} -> ${format(parseISO(updatedMaterial.expiryDate), 'PPP', {locale: es})}`);
    }
    if (originalMaterial.name !== updatedMaterial.name) {
      detailsArray.push(`Nombre: "${originalMaterial.name}" -> "${updatedMaterial.name}"`);
    }
    if (originalMaterial.reference !== updatedMaterial.reference) {
      detailsArray.push(`Referencia: "${originalMaterial.reference}" -> "${updatedMaterial.reference}"`);
    }
    if (originalMaterial.storageLocation !== updatedMaterial.storageLocation) {
      detailsArray.push(`Ubicación: "${originalMaterial.storageLocation || 'N/D'}" -> "${updatedMaterial.storageLocation || 'N/D'}"`);
    }
    if (originalMaterial.minStockLevel !== updatedMaterial.minStockLevel) {
      detailsArray.push(`Min Stock: ${originalMaterial.minStockLevel ?? 'N/D'} -> ${updatedMaterial.minStockLevel ?? 'N/D'}`);
    }


    if (detailsArray.length > 0) {
        addInventoryLogEntry(
        updatedMaterial.ambulanceId,
        updatedMaterial.id,
        updatedMaterial.name,
        'consumable',
        'updated',
        detailsArray.join('; '),
        originalMaterial.quantity,
        updatedMaterial.quantity
        );
    }
  };
  const deleteConsumableMaterial = (id: string) => {
    const materialToDelete = consumableMaterials.find(m => m.id === id);
    if (!materialToDelete) return;
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialToDelete.ambulanceId)) {
       console.warn("Intento no autorizado de eliminar material consumible.");
       return;
    }
    setConsumableMaterials(prev => prev.filter(m => m.id !== id));
    addInventoryLogEntry(
      materialToDelete.ambulanceId,
      materialToDelete.id,
      materialToDelete.name,
      'consumable',
      'deleted',
      `Eliminado. Tenía ${materialToDelete.quantity} unidades. Caducidad: ${format(parseISO(materialToDelete.expiryDate), 'PPP', {locale: es})}. Ubicación: ${materialToDelete.storageLocation || 'N/D'}. Min Stock: ${materialToDelete.minStockLevel ?? 'N/D'}`,
      materialToDelete.quantity,
      0
    );
  };


  const getNonConsumableMaterialsByAmbulanceId = useCallback((ambulanceId: string) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
      return [];
    }
    return nonConsumableMaterials.filter(m => m.ambulanceId === ambulanceId);
  }, [user, nonConsumableMaterials]);

  const addNonConsumableMaterial = (materialData: Omit<NonConsumableMaterial, 'id'>) => {
     if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialData.ambulanceId)) {
       console.warn("Intento no autorizado de añadir material no consumible.");
       return;
    }
    const newMaterial: NonConsumableMaterial = { ...materialData, id: `noncons-${Date.now()}-${Math.random().toString(16).slice(2)}` };
    setNonConsumableMaterials(prev => [...prev, newMaterial]);
    addInventoryLogEntry(
      materialData.ambulanceId,
      newMaterial.id,
      materialData.name,
      'non-consumable',
      'added',
      `Añadido. Estado: ${materialData.status}. N/S: ${materialData.serialNumber}. Ubicación: ${materialData.storageLocation || 'N/D'}. Cant. Mín: ${materialData.minStockLevel ?? 'N/D'}`,
      undefined, undefined, undefined, materialData.status
    );
  };
  const updateNonConsumableMaterial = (updatedMaterial: NonConsumableMaterial) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== updatedMaterial.ambulanceId)) {
       console.warn("Intento no autorizado de actualizar material no consumible.");
       return;
    }
    const originalMaterial = nonConsumableMaterials.find(m => m.id === updatedMaterial.id);
    if (!originalMaterial) return;

    setNonConsumableMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
    
    let detailsArray: string[] = [];
    if (originalMaterial.status !== updatedMaterial.status) {
      detailsArray.push(`Estado: ${originalMaterial.status} -> ${updatedMaterial.status}`);
    }
    if (originalMaterial.name !== updatedMaterial.name) {
      detailsArray.push(`Nombre: "${originalMaterial.name}" -> "${updatedMaterial.name}"`);
    }
     if (originalMaterial.serialNumber !== updatedMaterial.serialNumber) {
      detailsArray.push(`N/S: "${originalMaterial.serialNumber}" -> "${updatedMaterial.serialNumber}"`);
    }
    if (originalMaterial.storageLocation !== updatedMaterial.storageLocation) {
      detailsArray.push(`Ubicación: "${originalMaterial.storageLocation || 'N/D'}" -> "${updatedMaterial.storageLocation || 'N/D'}"`);
    }
     if (originalMaterial.minStockLevel !== updatedMaterial.minStockLevel) {
      detailsArray.push(`Cant. Mín: ${originalMaterial.minStockLevel ?? 'N/D'} -> ${updatedMaterial.minStockLevel ?? 'N/D'}`);
    }
    
    if (detailsArray.length > 0) {
        addInventoryLogEntry(
        updatedMaterial.ambulanceId,
        updatedMaterial.id,
        updatedMaterial.name,
        'non-consumable',
        'updated',
        detailsArray.join('; '),
        undefined, undefined, originalMaterial.status, updatedMaterial.status
        );
    }
  };
  const deleteNonConsumableMaterial = (id: string) => {
    const materialToDelete = nonConsumableMaterials.find(m => m.id === id);
    if (!materialToDelete) return;
     if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== materialToDelete.ambulanceId)) {
       console.warn("Intento no autorizado de eliminar material no consumible.");
       return;
    }
    setNonConsumableMaterials(prev => prev.filter(m => m.id !== id));
    addInventoryLogEntry(
      materialToDelete.ambulanceId,
      materialToDelete.id,
      materialToDelete.name,
      'non-consumable',
      'deleted',
      `Eliminado. Estado: ${materialToDelete.status}. N/S: ${materialToDelete.serialNumber}. Ubicación: ${materialToDelete.storageLocation || 'N/D'}. Cant. Mín: ${materialToDelete.minStockLevel ?? 'N/D'}`,
      undefined, undefined, materialToDelete.status, undefined
    );
  };

  const updateAmbulanceWorkflowStep = (ambulanceId: string, step: 'dailyCheck' | 'mechanical' | 'cleaning' | 'inventory', status: boolean) => {
    if (user?.role !== 'coordinador' && (user?.role === 'usuario' && user?.assignedAmbulanceId !== ambulanceId)) {
       console.warn("Intento no autorizado de actualizar paso de flujo de trabajo.");
       return;
    }
    setAllAmbulancesData(prev => prev.map(amb => {
      if (amb.id === ambulanceId) {
        const updatedAmb = {...amb};
        if (step === 'dailyCheck') {
            updatedAmb.dailyCheckCompleted = status;
            if (!status) { // if daily check is undone, reset all subsequent steps
                updatedAmb.mechanicalReviewCompleted = false;
                updatedAmb.cleaningCompleted = false;
                updatedAmb.inventoryCompleted = false;
            }
        }
        if (step === 'mechanical') {
            updatedAmb.mechanicalReviewCompleted = status;
            if (!status) { // if mechanical is undone, reset cleaning and inventory
                updatedAmb.cleaningCompleted = false;
                updatedAmb.inventoryCompleted = false;
            }
        }
        if (step === 'cleaning') {
            updatedAmb.cleaningCompleted = status;
            if (!status) { // if cleaning is undone, reset inventory
                updatedAmb.inventoryCompleted = false;
            }
        }
        if (step === 'inventory') {
            updatedAmb.inventoryCompleted = status;
            if (status) { 
                updatedAmb.lastInventoryCheck = new Date().toISOString();
                // Reset all steps for next cycle
                updatedAmb.dailyCheckCompleted = false;
                updatedAmb.mechanicalReviewCompleted = false;
                updatedAmb.cleaningCompleted = false;
                updatedAmb.inventoryCompleted = false; // This will be immediately set to false for the new cycle
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

  const saveRevisionDiariaVehiculo = (checkData: Omit<RevisionDiariaVehiculo, 'id'> & { submittedByUserId: string }) => {
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
    // After saving, update the ambulance's daily check status and last check date
    setAllAmbulancesData(prevAmbs => prevAmbs.map(amb => 
      amb.id === checkData.ambulanceId 
        ? { ...amb, dailyCheckCompleted: true, lastDailyCheck: checkData.checkDate }
        : amb
    ));
    updateAmbulanceWorkflowStep(checkData.ambulanceId, 'dailyCheck', true);
  };
  
  // --- USVB Kit (Operational Data) Management ---
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

  // --- USVB Kit Configuration Management ---
  const getConfigurableUsvbKits = useCallback((): Readonly<USVBKit[]> => {
    return configurableUsvbKits;
  }, [configurableUsvbKits]);

  const saveConfigurableUsvbKits = useCallback((kits: USVBKit[]) => {
    setConfigurableUsvbKitsState(kits);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_USVB_KITS, JSON.stringify(kits));
  }, []);


  const updateConfigurableUsvbKitDetails = useCallback((kitId: string, details: Pick<USVBKit, 'name' | 'iconName' | 'genericImageHint'>) => {
    if (user?.role !== 'coordinador') return;
    setConfigurableUsvbKits(prevKits => {
        const updatedKits = prevKits.map(kit => 
          kit.id === kitId ? { ...kit, ...details } : kit
        );
        return updatedKits;
    });
    toast({ title: "Detalles del Kit Actualizados", description: `Se han actualizado los detalles para ${details.name}.`});
  }, [user, setConfigurableUsvbKits, toast]);

  const addMaterialToConfigurableUsvbKit = useCallback((kitId: string, materialData: { name: string; targetQuantity: number }) => {
    if (user?.role !== 'coordinador') return;
    
    let materialExistsInKit = false;
    const updatedKits = configurableUsvbKits.map(kit => {
      if (kit.id === kitId) {
        if (kit.materials.some(m => m.name.toLowerCase() === materialData.name.toLowerCase())) {
          materialExistsInKit = true;
          return kit; 
        }
        const newMaterial: USVBKitMaterial = {
          id: `usvb-kit${kit.number}-matcfg-${Date.now()}-${materialData.name.replace(/\s+/g, '-').toLowerCase().substring(0,30)}`,
          name: materialData.name,
          targetQuantity: materialData.targetQuantity,
          quantity: materialData.targetQuantity, 
        };
        return { ...kit, materials: [...kit.materials, newMaterial] };
      }
      return kit;
    });

    if (materialExistsInKit) {
      toast({ title: "Error", description: `El material "${materialData.name}" ya existe en este kit.`, variant: "destructive" });
    } else {
      setConfigurableUsvbKits(updatedKits);
      toast({ title: "Material Añadido al Kit", description: `"${materialData.name}" añadido a la plantilla del kit.`});
    }
  }, [user, configurableUsvbKits, setConfigurableUsvbKits, toast]);

  const updateMaterialInConfigurableUsvbKit = useCallback((kitId: string, materialId: string, updates: { name?: string; targetQuantity?: number }) => {
    if (user?.role !== 'coordinador') return;
    
    let nameConflict = false;
    let materialNameForToast = "";

    const updatedKits = configurableUsvbKits.map(kit => {
      if (kit.id === kitId) {
        if (updates.name) {
            const existingMaterialWithNewName = kit.materials.find(m => m.id !== materialId && m.name.toLowerCase() === updates.name!.toLowerCase());
            if (existingMaterialWithNewName) {
                nameConflict = true;
                return kit; // Return kit unmodified to prevent update
            }
        }
        return {
          ...kit,
          materials: kit.materials.map(m => {
            if (m.id === materialId) {
              materialNameForToast = updates.name || m.name;
              return { ...m, ...updates, quantity: updates.targetQuantity ?? m.quantity };
            }
            return m;
          }),
        };
      }
      return kit;
    });

    if (nameConflict) {
        toast({ title: "Error", description: `Ya existe un material llamado "${updates.name}" en este kit.`, variant: "destructive" });
    } else {
        setConfigurableUsvbKits(updatedKits);
        toast({ title: "Material del Kit Actualizado", description: `Material "${materialNameForToast}" actualizado en la plantilla.`});
    }
  }, [user, configurableUsvbKits, setConfigurableUsvbKits, toast]);


  const deleteMaterialFromConfigurableUsvbKit = useCallback((kitId: string, materialId: string) => {
    if (user?.role !== 'coordinador') return;
    let materialNameForToast = "";
    const updatedKits = configurableUsvbKits.map(kit => {
      if (kit.id === kitId) {
        const materialToDelete = kit.materials.find(m => m.id === materialId);
        materialNameForToast = materialToDelete?.name || "Desconocido";
        return { ...kit, materials: kit.materials.filter(m => m.id !== materialId) };
      }
      return kit;
    });
    setConfigurableUsvbKits(updatedKits);
    toast({ title: "Material Eliminado del Kit", description: `Material "${materialNameForToast}" eliminado de la plantilla.`});
  }, [user, configurableUsvbKits, setConfigurableUsvbKits, toast]);
  
  const reorderMaterialInConfigurableUsvbKit = useCallback((kitId: string, materialId: string, direction: 'up' | 'down') => {
    if (user?.role !== 'coordinador') return;

    setConfigurableUsvbKits(prevKits => {
      const newKits = prevKits.map(kit => {
        if (kit.id === kitId) {
          const materialIndex = kit.materials.findIndex(m => m.id === materialId);
          if (materialIndex === -1) return kit; // Material not found

          const newMaterials = [...kit.materials];
          const itemToMove = newMaterials[materialIndex];

          if (direction === 'up' && materialIndex > 0) {
            newMaterials.splice(materialIndex, 1);
            newMaterials.splice(materialIndex - 1, 0, itemToMove);
          } else if (direction === 'down' && materialIndex < newMaterials.length - 1) {
            newMaterials.splice(materialIndex, 1);
            newMaterials.splice(materialIndex + 1, 0, itemToMove);
          } else {
            return kit; // Cannot move further up or down
          }
          return { ...kit, materials: newMaterials };
        }
        return kit;
      });
      // Only save to localStorage if there was an actual change (prevents unnecessary writes if item can't move)
      const originalKit = prevKits.find(k => k.id === kitId);
      const changedKit = newKits.find(k => k.id === kitId);
      if (originalKit && changedKit && JSON.stringify(originalKit.materials) !== JSON.stringify(changedKit.materials)) {
        localStorage.setItem(LOCAL_STORAGE_CONFIG_USVB_KITS, JSON.stringify(newKits));
        toast({ title: "Orden de Materiales Actualizado", description: `Se ha reordenado un material en el kit ${changedKit.name}.` });
      }
      return newKits;
    });
  }, [user, setConfigurableUsvbKits, toast]);


  const generateAlerts = useCallback(() => {
    if (authLoading || !user) return; 
    const newAlerts: Alert[] = [];
    const today = new Date();
    const configuredEmail = getNotificationEmailConfig();


    accessibleAmbulances.forEach(ambulance => {
        // Daily Check Alert
        if (!ambulance.dailyCheckCompleted) {
            newAlerts.push({
                id: `alert-dailycheck-${ambulance.id}`,
                type: 'daily_check_pending',
                message: `Revisión Diaria del Vehículo pendiente para ${ambulance.name}. Última: ${ambulance.lastDailyCheck ? format(parseISO(ambulance.lastDailyCheck), 'PPP', { locale: es }) : 'Nunca'}`,
                ambulanceId: ambulance.id,
                severity: 'medium',
                createdAt: today.toISOString(),
            });
        }

      // Mechanical Review Alert
      if (ambulance.dailyCheckCompleted && !ambulance.mechanicalReviewCompleted) {
        newAlerts.push({
          id: `alert-mr-${ambulance.id}`,
          type: 'review_pending',
          message: `Revisión mecánica pendiente para ${ambulance.name}.`,
          ambulanceId: ambulance.id,
          severity: 'medium',
          createdAt: today.toISOString(),
        });
      }
      // Cleaning Alert
       if (ambulance.dailyCheckCompleted && ambulance.mechanicalReviewCompleted && !ambulance.cleaningCompleted) {
        newAlerts.push({
          id: `alert-cl-${ambulance.id}`,
          type: 'cleaning_pending', 
          message: `Limpieza pendiente para ${ambulance.name}.`,
          ambulanceId: ambulance.id,
          severity: 'medium',
          createdAt: today.toISOString(),
        });
      }

      // Low Stock Alerts for Ambulance Consumables
      const ambulanceConsumables = getConsumableMaterialsByAmbulanceId(ambulance.id);
      ambulanceConsumables.forEach(material => {
        if (material.minStockLevel !== undefined && material.quantity <= material.minStockLevel) {
          newAlerts.push({
            id: `alert-lowstock-amb-cons-${material.id}`, // Unique ID for consumable low stock
            type: 'low_stock_ambulance',
            message: `Stock bajo (Consumible): ${material.name} en ${ambulance.name}. Actual: ${material.quantity}, Mín: ${material.minStockLevel}.`,
            ambulanceId: ambulance.id,
            materialId: material.id,
            severity: material.quantity === 0 && material.minStockLevel > 0 ? 'high' : 'medium',
            createdAt: today.toISOString(),
          });
        }
      });

      // Low Stock/Status Alerts for Ambulance Non-Consumables
      const ambulanceNonConsumables = getNonConsumableMaterialsByAmbulanceId(ambulance.id);
      ambulanceNonConsumables.forEach(material => {
        if (material.minStockLevel !== undefined) {
          const currentQuantity = material.status === 'Operacional' ? 1 : 0; // Effective quantity
          if (currentQuantity < material.minStockLevel) {
             newAlerts.push({
              id: `alert-lowstock-amb-noncons-${material.id}`, // Unique ID for non-consumable low stock/status
              type: 'low_stock_ambulance', // Can use the same type, message will differ
              message: `Alerta Equipo (No Consumible): ${material.name} en ${ambulance.name}. Estado: ${material.status}. Mín. Esperado: ${material.minStockLevel}.`,
              ambulanceId: ambulance.id,
              materialId: material.id,
              severity: currentQuantity === 0 ? 'high' : 'medium', // High if missing/not operational, medium if somehow present but under a >1 minStockLevel
              createdAt: today.toISOString(),
            });
          }
        }
      });

    });

    const accessibleAmbulanceIds = new Set(accessibleAmbulances.map(a => a.id));
    const relevantConsumableMaterials = consumableMaterials.filter(material => accessibleAmbulanceIds.has(material.ambulanceId));
    
    relevantConsumableMaterials.forEach(material => {
      const expiryDate = parseISO(material.expiryDate); 
      const ambulance = allAmbulancesData.find(a=> a.id === material.ambulanceId);
      const ambulanceName = ambulance ? ambulance.name : 'Ambulancia Desconocida';
      const daysUntilExpiry = differenceInDays(expiryDate, today); 


      if (daysUntilExpiry < 0) {
        const alertMsg = `Material ${material.name} en ${ambulanceName} caducó el ${format(expiryDate, 'PPP', { locale: es })}.`;
        newAlerts.push({
          id: `alert-exp-${material.id}`,
          type: 'expired_material',
          message: alertMsg,
          materialId: material.id,
          ambulanceId: material.ambulanceId,
          severity: 'high',
          createdAt: today.toISOString(),
        });
        if (configuredEmail && user?.role === 'coordinador') {
            toast({ title: "ALERTA CRÍTICA (Ambulancia)", description: `${alertMsg} Notificación simulada a ${configuredEmail}.`, variant: "destructive", duration: 10000 });
        }
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
  }, [authLoading, user, accessibleAmbulances, consumableMaterials, nonConsumableMaterials, mechanicalReviews, cleaningLogs, allAmbulancesData, getNotificationEmailConfig, revisionesDiariasVehiculo, getConsumableMaterialsByAmbulanceId, getNonConsumableMaterialsByAmbulanceId, toast]); 

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
    getAmbulanceStorageLocations, addAmbulanceStorageLocation, updateAmbulanceStorageLocation, deleteAmbulanceStorageLocation,
    getConfigurableMechanicalReviewItems, addConfigurableMechanicalReviewItem, updateConfigurableMechanicalReviewItem, deleteConfigurableMechanicalReviewItem,
    
    usvbKits: usvbKitsData, 
    getUSVBKitById, 
    updateUSVBKitMaterialQuantity,
    getConfigurableUsvbKits,
    updateConfigurableUsvbKitDetails,
    addMaterialToConfigurableUsvbKit,
    updateMaterialInConfigurableUsvbKit,
    deleteMaterialFromConfigurableUsvbKit,
    reorderMaterialInConfigurableUsvbKit,

    inventoryLogs, getInventoryLogsByAmbulanceId,
    centralInventoryLogs: centralInventoryLogsState, getCentralInventoryLogs, // exposed for API route
    addCentralInventoryLog, // Added for direct use by API routes
    getNotificationEmailConfig, setNotificationEmailConfig,
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

