"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, BarChart2, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import RiojaLogoPlaceholder from './RiojaLogoPlaceholder';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

const navItems = [
  { href: '/gobiernodelarioja-crm/dashboard', label: 'Dashboard', icon: Home },
  { href: '/gobiernodelarioja-crm/clientes', label: 'Clientes', icon: Users },
  { href: '/gobiernodelarioja-crm/proyectos', label: 'Proyectos', icon: Briefcase },
  { href: '/gobiernodelarioja-crm/informes', label: 'Informes', icon: BarChart2 },
  { href: '/gobiernodelarioja-crm/configuracion', label: 'Configuración', icon: Settings },
  { href: '/gobiernodelarioja-crm/style-guide', label: 'Guía de Estilos', icon: Settings }, // Para ejemplos
];

export function SidebarCRM() {
  const pathname = usePathname();
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDesktopSidebar = () => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => (
    <Link
      href={item.href}
      onClick={() => setIsMobileMenuOpen(false)}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-rioja-primary-lightness/20 hover:text-rioja-primary",
        pathname === item.href ? "bg-rioja-primary-hue text-primary-foreground-rioja bg-opacity-80" : "text-rioja-gray-hue",
        isDesktopSidebarCollapsed ? "justify-center" : ""
      )}
      style={{
        color: pathname === item.href ? 'hsl(var(--primary-foreground-rioja))' : 'hsl(var(--rioja-gray-hue) var(--rioja-gray-saturation) 30%)',
        backgroundColor: pathname === item.href ? 'hsl(var(--primary-rioja))' : 'transparent',
      }}
    >
      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary-foreground-rioja" : "text-rioja-primary-hue")} 
       style={{ color: pathname === item.href ? 'hsl(var(--primary-foreground-rioja))' : 'hsl(var(--primary-rioja))' }}
      />
      <span className={cn(isDesktopSidebarCollapsed && "sm:hidden")}>{item.label}</span>
    </Link>
  );

  const DesktopSidebarContent = () => (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/gobiernodelarioja-crm/dashboard" className="flex items-center gap-2 font-semibold">
          <RiojaLogoPlaceholder className="h-6 w-6" />
          <span className={cn(isDesktopSidebarCollapsed && "hidden")}>GobLaRioja</span>
        </Link>
        <Button variant="outline" size="icon" className="ml-auto h-8 w-8" onClick={toggleDesktopSidebar}>
          {isDesktopSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          <span className="sr-only">Alternar menú lateral</span>
        </Button>
      </div>
      <div className="flex-1">
        <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4", isDesktopSidebarCollapsed && "justify-center")}>
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>
    </div>
  );
  
  const MobileSidebarContent = () => (
     <nav className="grid gap-2 text-lg font-medium">
        <Link
            href="/gobiernodelarioja-crm/dashboard"
            className="flex items-center gap-2 text-lg font-semibold mb-4"
            onClick={() => setIsMobileMenuOpen(false)}
        >
            <RiojaLogoPlaceholder className="h-6 w-6" />
            <span>GobLaRioja CRM</span>
        </Link>
        {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
        ))}
    </nav>
  );


  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
            "fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-card-rioja sm:flex transition-[width] duration-300 ease-in-out",
            isDesktopSidebarCollapsed ? "sm:w-14" : "sm:w-60"
        )}
        style={{ 
            width: isDesktopSidebarCollapsed ? 'var(--sidebar-width-icon, 3.5rem)' : 'var(--sidebar-width, 15rem)',
            backgroundColor: 'hsl(var(--card-rioja))'
        }}
        >
        <DesktopSidebarContent />
      </aside>

      {/* Mobile Hamburger Menu (managed by HeaderCRM) */}
    </>
  );
}
