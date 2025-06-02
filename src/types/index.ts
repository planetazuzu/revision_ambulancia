
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
}

export type ChecklistItemStatus = 'OK' | 'Reparar' | 'N/A';

export interface ChecklistItem {
  id: string;
  name: string;
  status: ChecklistItemStatus;
  notes?: string;
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
  'low_stock_ambulance' | // New alert type
  'low_stock_central';   // New alert type

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
  key: string; // Added key for easier mapping to Ambulance properties
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
  photoTaken?: boolean; // Placeholder for actual photo
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
  id: string; // Identificador único del material DENTRO de un kit específico
  name: string;
  quantity: number; // Cantidad actual en el kit
  targetQuantity: number; // Cantidad ideal según la plantilla
  status?: USVBKitMaterialStatus; // Calculado: ok, bajo, agotado
}

export interface USVBKit {
  id: string; // ej. "usvb-kit-01"
  number: number; // ej. 1 a 30
  name: string; // ej. "Espacio 4: EPI"
  iconName: string; // Nombre del icono de lucide-react, ej. "Shield"
  genericImageHint?: string; // Para data-ai-hint, ej. "medical kit"
  materials: USVBKitMaterial[]; // Representa el estado ACTUAL del kit (con quantity actual)
                                 // La targetQuantity se consultará de la configuración.
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
  changeDetails: string; // "Quantity: 5 -> 3", "Status: OK -> Repair"
  quantityBefore?: number;
  quantityAfter?: number;
  statusBefore?: string;
  statusAfter?: string;
  userId: string;
  userName: string;
  timestamp: string; // ISO Date string
}
