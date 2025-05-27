
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mainNavItems } from '@/config/navigation';
import { Header } from '@/components/layout/Header';
import { Ambulance, LogOut } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/'); // Use replace to avoid back button to dashboard
      return;
    }
    if (!loading && user && user.role === 'usuario' && !user.assignedAmbulanceId && pathname !== '/validate-ambulance') {
      router.replace('/validate-ambulance');
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }
  
  // If user needs validation and is not on validation page, show loading or minimal layout
  // This specific check might be redundant if router.replace works fast enough,
  // but can prevent rendering dashboard content momentarily.
  if (user.role === 'usuario' && !user.assignedAmbulanceId && pathname !== '/validate-ambulance') {
     return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Redirigiendo a validación de ambulancia...</p>
      </div>
    );
  }


  const NavContent = () => {
    const { open } = useSidebar();

    return (
       <>
        <SidebarHeader className="flex items-center gap-2 p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Ambulance className="h-6 w-6 text-primary" />
                <span className={cn(open ? "" : "sr-only")}>AmbuReview</span>
            </Link>
            <div className={cn("ml-auto", open ? "" : "hidden")}>
                <SidebarTrigger />
            </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
            <SidebarMenu className="space-y-1 p-2">
            {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    tooltip={open ? undefined : item.label}
                >
                    <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-sidebar-border mt-auto">
            <Button variant="ghost" onClick={logout} className={cn("w-full justify-start gap-2", open ? "" : "justify-center")}>
                <LogOut className="h-5 w-5" />
                <span className={cn(open ? "" : "sr-only")}>Cerrar Sesión</span>
            </Button>
        </SidebarFooter>
       </>
    );
  };


  return (
    <SidebarProvider defaultOpen={true}>
        <Sidebar variant="sidebar" collapsible="icon" side="left">
           <NavContent/>
        </Sidebar>
        <SidebarInset>
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
