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

export interface ConsumableMaterial {
  id: string;
  name: string;
  reference: string;
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

export type Material = ConsumableMaterial | NonConsumableMaterial;

export interface Alert {
  id: string;
  type: 'review_pending' | 'expiring_soon' | 'expired_material';
  message: string;
  ambulanceId?: string;
  materialId?: string;
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
