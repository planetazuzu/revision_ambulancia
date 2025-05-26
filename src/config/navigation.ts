import { LayoutDashboard, Ambulance, Bell, Wrench, Sparkles, Boxes, Settings, UserCircle, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  isExternal?: boolean;
}

export const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/ambulances', label: 'Ambulances', icon: Ambulance },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
];

export const userNavItems: NavItem[] = [
    // { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
    // { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    // Add more user-specific links if needed
];


export const ambulanceWorkflowSteps = (ambulanceId: string) => [
  { name: "Mechanical Review", path: `/dashboard/ambulances/${ambulanceId}/review`, icon: Wrench, key: 'mechanicalReviewCompleted' },
  { name: "Cleaning Log", path: `/dashboard/ambulances/${ambulanceId}/cleaning`, icon: Sparkles, key: 'cleaningCompleted' },
  { name: "Inventory Check", path: `/dashboard/ambulances/${ambulanceId}/inventory`, icon: Boxes, key: 'inventoryCompleted' },
];
