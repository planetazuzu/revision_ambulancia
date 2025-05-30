
// Server-side in-memory store for Ampulario data
import type { Space, AmpularioMaterial, MaterialRoute } from '@/types';
import { formatISO, addDays, subDays } from 'date-fns';

// --- Spaces ---
let spaces: Space[] = [
  { id: 'space23', name: 'Almacén Principal' }, // Renamed from 'Ampulario Principal'
  { id: 'space01', name: 'Stock Local Ambulancia 01' }, 
];

export const getSpaces = (): Space[] => spaces;

export const getSpaceById = (id: string): Space | undefined => spaces.find(s => s.id === id);

export const addSpace = (spaceData: Omit<Space, 'id'>): Space => {
  const newSpace: Space = { ...spaceData, id: `space-${Date.now()}-${Math.random().toString(36).substring(7)}` };
  spaces.push(newSpace);
  return newSpace;
};

export const updateSpace = (id: string, updates: Partial<Omit<Space, 'id'>>): Space | undefined => {
  const spaceIndex = spaces.findIndex(s => s.id === id);
  if (spaceIndex === -1) return undefined;

  const updatedSpace = {
    ...spaces[spaceIndex],
    ...updates,
  };
  spaces[spaceIndex] = updatedSpace;
  return updatedSpace;
};

export const deleteSpace = (id: string): boolean => {
  const initialLength = spaces.length;
  const isSpaceInUse = ampularioMaterials.some(material => material.space_id === id);
  if (isSpaceInUse) {
    console.warn(`Attempted to delete space ${id} which is still in use by materials.`);
    return false; 
  }
  spaces = spaces.filter(s => s.id !== id);
  return spaces.length < initialLength;
};


// --- Ampulario Materials (now "Central Materials") ---
let ampularioMaterials: AmpularioMaterial[] = [
  { id: 'ampmat001', space_id: 'space23', name: 'Adrenalina 1mg/1ml', dose: '1', unit: 'mg/ml', quantity: 10, route: 'IV/IM', expiry_date: formatISO(addDays(new Date(), 90)), created_at: formatISO(new Date()), updated_at: formatISO(new Date()) },
  { id: 'ampmat002', space_id: 'space23', name: 'Salbutamol Nebulizador', dose: '5', unit: 'mg/ml', quantity: 5, route: 'Nebulizador', expiry_date: formatISO(addDays(new Date(), 2)), created_at: formatISO(new Date()), updated_at: formatISO(new Date()) },
  { id: 'ampmat003', space_id: 'space23', name: 'Paracetamol Comprimidos', dose: '500', unit: 'mg', quantity: 100, route: 'Oral', expiry_date: formatISO(subDays(new Date(), 5)), created_at: formatISO(new Date()), updated_at: formatISO(new Date()) },
  { id: 'ampmat004', space_id: 'space01', name: 'Morfina 10mg/ml', dose: '10', unit: 'mg/ml', quantity: 2, route: 'IV/IM', expiry_date: formatISO(addDays(new Date(), 180)), created_at: formatISO(new Date()), updated_at: formatISO(new Date()) },
];

export const getAmpularioMaterials = (filters: { spaceId?: string; routeName?: MaterialRoute; nameQuery?: string }): AmpularioMaterial[] => {
  let filtered = [...ampularioMaterials];
  if (filters.spaceId) {
    filtered = filtered.filter(m => m.space_id === filters.spaceId);
  }
  if (filters.routeName) {
    filtered = filtered.filter(m => m.route === filters.routeName);
  }
  if (filters.nameQuery) {
    filtered = filtered.filter(m => m.name.toLowerCase().includes(filters.nameQuery!.toLowerCase()));
  }
  return filtered.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); 
};

export const getAmpularioMaterialById = (id: string): AmpularioMaterial | undefined => ampularioMaterials.find(m => m.id === id);

export const addAmpularioMaterial = (materialData: Omit<AmpularioMaterial, 'id' | 'created_at' | 'updated_at'>): AmpularioMaterial => {
  const now = formatISO(new Date());
  const newMaterial: AmpularioMaterial = {
    ...materialData,
    id: `ampmat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    created_at: now,
    updated_at: now,
  };
  ampularioMaterials.push(newMaterial);
  return newMaterial;
};

export const addMultipleAmpularioMaterials = (materialsData: Omit<AmpularioMaterial, 'id' | 'created_at' | 'updated_at'>[]): AmpularioMaterial[] => {
  const addedMaterials: AmpularioMaterial[] = [];
  materialsData.forEach(materialData => {
    const newMaterial = addAmpularioMaterial(materialData);
    addedMaterials.push(newMaterial);
  });
  return addedMaterials;
};

export const updateAmpularioMaterial = (id: string, updates: Partial<Pick<AmpularioMaterial, 'quantity' | 'expiry_date' | 'name' | 'dose' | 'unit' | 'route' | 'space_id'>>): AmpularioMaterial | undefined => {
  const materialIndex = ampularioMaterials.findIndex(m => m.id === id);
  if (materialIndex === -1) return undefined;

  if (updates.space_id && !getSpaceById(updates.space_id)) {
    throw new Error(`El espacio con ID '${updates.space_id}' no existe.`);
  }

  const updatedMaterial = {
    ...ampularioMaterials[materialIndex],
    ...updates,
    updated_at: formatISO(new Date()),
  };
  ampularioMaterials[materialIndex] = updatedMaterial;
  return updatedMaterial;
};

export const deleteAmpularioMaterial = (id: string): boolean => {
  const initialLength = ampularioMaterials.length;
  ampularioMaterials = ampularioMaterials.filter(m => m.id !== id);
  return ampularioMaterials.length < initialLength;
};
