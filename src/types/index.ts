
export interface User {
  id: string;
  name: string;
  role: 'coordinador' | 'usuario';
  assignedAmbulanceId?: string;
}

export interface Ambulance {
  id: string;
  name: string; // e.g., "Ambulancia 01"
  licensePlate: string;
  model: string;
  year: number;
  lastMechanicalReview?: string; // Date ISO string
  lastCleaning?: string; // Date ISO string
  lastInventoryCheck?: string; // Date ISO string
  mechanicalReviewCompleted?: boolean;
  cleaningCompleted?: boolean;
  inventoryCompleted?: boolean;
  lastKnownKilometers?: number;
  lastCheckInByUserId?: string; // ID of user who last checked in
  lastCheckInDate?: string; // Date ISO string of last check-in
  dailyCheckCompleted?: boolean; // Added for daily check status
  lastDailyCheck?: string; // Added for last daily check date
}

export type ChecklistItemStatus = 'OK' | 'Reparar' | 'N/A';

export interface ChecklistItem {
  id: string; // Unique ID for the checklist item instance
  name: string;
  status: ChecklistItemStatus;
  notes?: string;
  category?: string; // Category for grouping
}

export interface MechanicalReview {
  id: string;
  ambulanceId: string;
  reviewerId: string;
  reviewDate: string; // ISO Date string
  items: ChecklistItem[];
}

export interface CleaningLog {
  id: string;
  ambulanceId: string;
  responsiblePersonId: string; // Should map to User.name or User.id
  dateTime: string; // ISO Date string
  materialsUsed: string;
  observations?: string;
}

export interface ConsumableMaterial {
  id: string;
  name: string;
  reference: string;
  quantity: number;
  expiryDate: string; // ISO Date string
  ambulanceId: string;
  storageLocation?: string;
  minStockLevel?: number; // Added for low stock alerts
}

export type NonConsumableMaterialStatus = 'Operacional' | 'Necesita Reparación' | 'Fuera de Servicio';

export interface NonConsumableMaterial {
  id:string;
  name: string;
  serialNumber: string;
  status: NonConsumableMaterialStatus;
  ambulanceId: string;
  storageLocation?: string;
  minStockLevel?: number; // Added for low stock alerts, though it's unusual for non-consumables unless it represents "minimum 1 unit must be operational"
}

export type MaterialRoute = "IV/IM" | "Nebulizador" | "Oral";

export interface AmpularioMaterial {
  id: string;
  space_id: string;
  name: string;
  dose: string;
  unit: string;
  quantity: number;
  route: MaterialRoute;
  expiry_date?: string; // Date ISO string, optional
  minStockLevel?: number; // Added for low stock alerts
  created_at: string; // Date ISO string
  updated_at: string; // Date ISO string
}

export interface Space {
  id: string;
  name: string;
}

export type AlertType = 
  'review_pending' | 
  'expiring_soon' | 
  'expired_material' | 
  'ampulario_expiring_soon' | 
  'ampulario_expired_material' | 
  'cleaning_pending' | 
  'daily_check_pending' |
  'low_stock_ambulance' | 
  'low_stock_central';   

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  ambulanceId?: string;
  materialId?: string;
  spaceId?: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string; // ISO Date string
}

export interface WorkflowStep {
  name: string;
  path: string;
  icon: React.ElementType;
  isCompleted: (ambulance: Ambulance) => boolean;
  key: string; 
  isNextStep?: boolean;
}

// --- Tipos para la Revisión Diaria del Vehículo ---
export type FuelLevel = 'Lleno' | '3/4' | '1/2' | '1/4' | 'Reserva' | 'Vacío';
export type TyrePressureStatus = 'OK' | 'Baja' | 'Alta' | 'Revisar';
export type SimplePresenceStatus = 'Presente' | 'Ausente';
export type EquipmentStatus = 'Operacional' | 'Defectuoso' | 'Ausente';
export type YesNoStatus = 'Sí' | 'No';

export interface ExteriorCornerCheck {
  notes?: string;
  photoTaken?: boolean; 
  photoUrl?: string; // Added to store the actual photo Data URL or a placeholder URL
}

export interface RevisionDiariaVehiculo {
  id: string;
  ambulanceId: string;
  driverFirstName: string;
  driverLastName: string;
  checkDate: string; // ISO Date string
  ambulanceNumber: string;
  paxBagNumber: string;
  paxFolderPresent: YesNoStatus;
  
  exteriorFrontRight: ExteriorCornerCheck;
  exteriorFrontLeft: ExteriorCornerCheck;
  exteriorRearRight: ExteriorCornerCheck;
  exteriorRearLeft: ExteriorCornerCheck;

  fuelLevel: FuelLevel;
  tyrePressureStatus: TyrePressureStatus;
  ambulanceRegistrationPresent: SimplePresenceStatus;
  greenCardInsurancePresent: SimplePresenceStatus;
  abnAmroMaestroCardPresent: SimplePresenceStatus;
  utaTankCardPresent: SimplePresenceStatus;
  ipadStatus: EquipmentStatus;

  additionalNotes?: string;
  submittedByUserId: string;
}

export type AmbulanceStorageLocation = string;


// --- Tipos para el Módulo de Gestión de Material USVB ---
export type USVBKitMaterialStatus = 'ok' | 'low' | 'out';

export interface USVBKitMaterial {
  id: string; 
  name: string;
  quantity: number; 
  targetQuantity: number; 
  status?: USVBKitMaterialStatus; 
}

export interface USVBKit {
  id: string; 
  number: number; 
  name: string; 
  iconName: string; 
  genericImageHint?: string; 
  materials: USVBKitMaterial[];                                
}


// --- Tipos para Logs de Inventario ---
export type InventoryLogAction = 'added' | 'updated' | 'deleted' | 'quantity_changed' | 'status_changed';

export interface InventoryLogEntry {
  id: string;
  ambulanceId: string;
  materialId: string;
  materialName: string;
  materialType: 'consumable' | 'non-consumable';
  action: InventoryLogAction;
  changeDetails: string; 
  quantityBefore?: number;
  quantityAfter?: number;
  statusBefore?: string;
  statusAfter?: string;
  userId: string;
  userName: string;
  timestamp: string; // ISO Date string
}

export interface CentralInventoryLogEntry {
  id: string;
  materialId: string;
  materialName: string;
  action: InventoryLogAction;
  spaceId: string;
  spaceName: string;
  changeDetails: string;
  quantityBefore?: number;
  quantityAfter?: number;
  userId?: string; 
  userName?: string; 
  timestamp: string; // ISO Date string
}

// Item configurable para la plantilla de revisión mecánica
export interface ConfigurableMechanicalReviewItem {
  id: string;
  name: string;
  category: string;
}
