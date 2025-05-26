import { LayoutDashboard, Ambulance, Bell, Wrench, Sparkles, Boxes, Settings, UserCircle, LogOut, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  isExternal?: boolean;
}

export const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { href: '/dashboard/ambulances', label: 'Ambulancias', icon: Ambulance },
  { href: '/dashboard/ampulario', label: 'Ampulario', icon: Archive },
  { href: '/dashboard/alerts', label: 'Alertas', icon: Bell },
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
