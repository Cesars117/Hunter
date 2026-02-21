import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Hunter - Sistema de Gestión de Taller',
  description: 'Sistema de gestión para taller mecánico - Estimados, órdenes de trabajo, clientes y vehículos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Toaster position="top-right" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
