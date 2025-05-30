"use client";

import Link from 'next/link';
import { Menu, Search, UserCircle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import RiojaLogoPlaceholder from './RiojaLogoPlaceholder';
import { useTheme } from "next-themes";
import React from 'react';

// Re-uso de NavLink de SidebarCRM para consistencia en mobile
const navItems = [
  { href: '/gobiernodelarioja-crm/dashboard', label: 'Dashboard', icon: Home },
  { href: '/gobiernodelarioja-crm/clientes', label: 'Clientes', icon: Users },
  { href: '/gobiernodelarioja-crm/proyectos', label: 'Proyectos', icon: Briefcase },
  // ... más items si es necesario para el menú móvil
];


export function HeaderCRM() {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const NavLink = ({ item, onClick }: { item: typeof navItems[0], onClick: () => void }) => (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
       style={{ color: 'hsl(var(--muted-foreground-rioja))'}}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
  
  const MobileNavContent = () => (
     <nav className="grid gap-2 text-lg font-medium">
        <Link
            href="/gobiernodelarioja-crm/dashboard"
            className="flex items-center gap-3 text-lg font-semibold mb-4"
            onClick={() => setIsMobileMenuOpen(false)}
             style={{ color: 'hsl(var(--foreground-rioja))'}}
        >
            <RiojaLogoPlaceholder className="h-8 w-8" />
            <span className="">GobLaRioja CRM</span>
        </Link>
        {navItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={() => setIsMobileMenuOpen(false)} />
        ))}
    </nav>
  );


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card-rioja px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 theme-rioja" 
     style={{ backgroundColor: 'hsl(var(--card-rioja))'}}
    >
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs theme-rioja" style={{ backgroundColor: 'hsl(var(--card-rioja))'}}>
          <MobileNavContent />
        </SheetContent>
      </Sheet>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground-rioja" style={{ color: 'hsl(var(--muted-foreground-rioja))'}}/>
        <Input
          type="search"
          placeholder="Buscar en CRM..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px] input-rioja-custom"
        />
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="ml-2"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        <span className="sr-only">Alternar tema</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <UserCircle className="h-5 w-5" />
            <span className="sr-only">Menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="theme-rioja" style={{ backgroundColor: 'hsl(var(--popover-rioja))', borderColor: 'hsl(var(--border-rioja))'}}>
          <DropdownMenuLabel style={{ color: 'hsl(var(--popover-foreground-rioja))'}}>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator style={{ backgroundColor: 'hsl(var(--border-rioja))'}}/>
          <DropdownMenuItem style={{ color: 'hsl(var(--popover-foreground-rioja))'}}>Perfil</DropdownMenuItem>
          <DropdownMenuItem style={{ color: 'hsl(var(--popover-foreground-rioja))'}}>Configuración</DropdownMenuItem>
          <DropdownMenuSeparator style={{ backgroundColor: 'hsl(var(--border-rioja))'}}/>
          <DropdownMenuItem style={{ color: 'hsl(var(--popover-foreground-rioja))'}}>Cerrar Sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
