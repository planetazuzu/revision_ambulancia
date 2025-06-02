
import { LayoutDashboard, Ambulance, Bell, Wrench, Sparkles, Boxes, Settings, UserCircle, LogOut, Archive, PackageSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  isExternal?: boolean;
  adminOnly?: boolean; // Renamed from coordinatorOnly for clarity if roles expand
}

export const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { href: '/dashboard/ambulances', label: 'Ambulancias', icon: Ambulance },
  { href: '/dashboard/gestion-materiales', label: 'Gestión de Materiales', icon: Archive }, // Ruta de archivo no cambia
  { href: '/dashboard/usvb-kit-inventory', label: 'Dotación USVB', icon: PackageSearch },
  { href: '/dashboard/alerts', label: 'Alertas', icon: Bell },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, adminOnly: true },
];

export const userNavItems: NavItem[] = [
    // { href: '/dashboard/profile', label: 'Perfil', icon: UserCircle },
    // { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
];


export const ambulanceWorkflowSteps = (ambulanceId: string) => [
  { name: "Revisión Mecánica", path: `/dashboard/ambulances/${ambulanceId}/review`, icon: Wrench, key: 'mechanicalReviewCompleted' },
  { name: "Registro de Limpieza", path: `/dashboard/ambulances/${ambulanceId}/cleaning`, icon: Sparkles, key: 'cleaningCompleted' },
  { name: "Control de Inventario", path: `/dashboard/ambulances/${ambulanceId}/inventory`, icon: Boxes, key: 'inventoryCompleted' },
];

