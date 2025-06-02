import type { Metadata } from 'next';
// Removed Inter font import: import { Inter as FontSans } from 'next/font/google';
import './globals-crm.css'; // CSS específico para este tema
import { cn } from '@/lib/utils';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { HeaderCRM } from '@/components/gobiernodelarioja-crm/HeaderCRM';
import { SidebarCRM } from '@/components/gobiernodelarioja-crm/SidebarCRM';
import React from 'react';

/*
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});
*/

export const metadata: Metadata = {
  title: 'CRM/ERP Gobierno de La Rioja',
  description: 'Sistema de Gestión CRM/ERP para el Gobierno de La Rioja',
};

// Tema Provider específico para esta sección si es necesario, o usar el global
function RiojaThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {/* Forzamos el tema claro por defecto para este layout, modo oscuro opcional vía componente */}
      {children}
    </NextThemesProvider>
  );
}


export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-serif antialiased theme-rioja" /* Removed fontSans.variable and changed font-sans to font-serif */)}>
        <RiojaThemeProvider>
          <div className="flex min-h-screen w-full flex-col">
            <SidebarCRM />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 md:sm:pl-[var(--sidebar-width-icon)] lg:sm:pl-[var(--sidebar-width)] transition-[padding-left] duration-300 ease-in-out">
              {/* El ajuste de sm:pl-[var(--sidebar-width)] es para el estado expandido del sidebar en desktop */}
              {/* Asegúrate que las variables CSS --sidebar-width-icon y --sidebar-width estén definidas */}
              <HeaderCRM />
              <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 bg-muted/40 theme-rioja">
                {children}
              </main>
            </div>
          </div>
        </RiojaThemeProvider>
      </body>
    </html>
  );
}
