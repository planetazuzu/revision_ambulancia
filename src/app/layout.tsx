
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gestión de Material de Ambulancias',
  description: 'Sistema para la Gestión de Material y Revisiones de Ambulancias',
  manifest: '/manifest.json', // Añadido para PWA
  icons: { // Opcional: añadir iconos para diferentes propósitos, si los tienes
    apple: '/icons/icon-192x192.png', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* El manifest.json también se puede añadir aquí, aunque Next.js puede gestionarlo desde metadata */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
        <meta name="theme-color" content="#73C23A" /> {/* GdLR Green */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppDataProvider>
              {children}
              <Toaster />
            </AppDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

