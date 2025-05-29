import type {NextConfig} from 'next';
import createNextPwa from '@ducanh2912/next-pwa';

const withPWA = createNextPwa({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Deshabilita PWA en desarrollo para facilitar la depuración
  register: true, // Registra el service worker
  skipWaiting: true, // Fuerza al service worker a activarse inmediatamente
  // cacheOnFrontEndNav: true, // Opcional: cachea las páginas navegadas en el cliente
  // aggressiveFrontEndNavCaching: true, // Opcional: puede mejorar el rendimiento offline
  // reloadOnOnline: true, // Opcional: recarga la página cuando se recupera la conexión
});


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
