export interface User {
  id: string;
  name: string;
  role: 'admin' | 'reviewer' | 'cleaner' | 'inventory_manager';
}

export interface Ambulance {
  id: string;
  name: string; // e.g., "Ambulance 01"
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

export type ChecklistItemStatus = 'OK' | 'Repair' | 'N/A';

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
  responsiblePersonId: string;
  dateTime: string; // ISO Date string
  materialsUsed: string;
  observations?: string;
}

// This is for materials specifically stocked IN an ambulance
export interface ConsumableMaterial {
  id: string;
  name: string;
  reference: string; // Specific reference/lot for the item in ambulance
  quantity: number;
  expiryDate: string; // ISO Date string
  ambulanceId: string;
}

export interface NonConsumableMaterial {
  id:string;
  name: string;
  serialNumber: string;
  status: 'Operational' | 'Needs Repair' | 'Out of Service';
  ambulanceId: string;
}

export type MaterialRoute = "IV/IM" | "Nebulizador" | "Oral";

// This is for materials in the central Ampulario (storage space)
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

export interface Alert {
  id: string;
  type: 'review_pending' | 'expiring_soon' | 'expired_material' | 'ampulario_expiring_soon' | 'ampulario_expired_material';
  message: string;
  ambulanceId?: string;
  materialId?: string; // Could be ConsumableMaterial ID or AmpularioMaterial ID
  spaceId?: string; // For Ampulario alerts
  severity: 'low' | 'medium' | 'high';
  createdAt: string; // ISO Date string
}

export interface WorkflowStep {
  name: string;
  path: string;
  icon: React.ElementType;
  isCompleted: (ambulance: Ambulance) => boolean;
  isNextStep?: boolean;
}
