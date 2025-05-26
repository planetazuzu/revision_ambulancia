export interface User {
  id: string;
  name: string;
  role: 'admin' | 'reviewer' | 'cleaner' | 'inventory_manager';
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
}

export type NonConsumableMaterialStatus = 'Operacional' | 'Necesita Reparación' | 'Fuera de Servicio';

export interface NonConsumableMaterial {
  id:string;
  name: string;
  serialNumber: string;
  status: NonConsumableMaterialStatus;
  ambulanceId: string;
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
  created_at: string; // Date ISO string
  updated_at: string; // Date ISO string
}

export interface Space {
  id: string;
  name: string;
}

export type AlertType = 'review_pending' | 'expiring_soon' | 'expired_material' | 'ampulario_expiring_soon' | 'ampulario_expired_material' | 'cleaning_pending';

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
