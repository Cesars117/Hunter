import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'Hunter - Sistema de Gestión de Taller',
  description: 'Sistema de gestión para taller mecánico - Estimados, órdenes de trabajo, clientes y vehículos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hunter',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <Toaster position="top-right" />
        <AppShell>{children}</AppShell>
        <PWARegister />
      </body>
    </html>
  );
}
